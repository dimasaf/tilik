import "server-only";
import { prisma } from "@/lib/db";
import {
  hashOpaqueToken,
  hashPassword,
  newEmailVerificationTokenHash,
  newSessionToken,
  verifyPassword,
} from "@/lib/auth/crypto";
import { sendVerificationEmail } from "@/lib/auth/email";
import type { RegistrationCredentials, SignInCredentials } from "@/lib/auth/validation";

const VERIFICATION_TOKEN_TTL_MS = 24 * 60 * 60 * 1_000;
export const SESSION_TTL_SECONDS = 30 * 24 * 60 * 60;

export class RegistrationEmailDeliveryError extends Error {}

function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "P2002"
  );
}

export async function registerAccount(
  credentials: RegistrationCredentials,
): Promise<void> {
  const passwordHash = await hashPassword(credentials.password);
  let user: { id: string };
  try {
    user = await prisma.user.create({
      data: { email: credentials.email, passwordHash },
      select: { id: true },
    });
  } catch (error) {
    if (isUniqueConstraintViolation(error)) return;
    throw error;
  }

  const tokenHash = newEmailVerificationTokenHash();
  const storedTokenHash = hashOpaqueToken(tokenHash);
  await prisma.emailVerificationToken.create({
    data: {
      userId: user.id,
      tokenHash: storedTokenHash,
      expiresAt: new Date(Date.now() + VERIFICATION_TOKEN_TTL_MS),
    },
  });

  try {
    await sendVerificationEmail(credentials.email, tokenHash);
  } catch {
    await prisma.emailVerificationToken.deleteMany({
      where: { userId: user.id, tokenHash: storedTokenHash },
    });
    await prisma.user.deleteMany({
      where: { id: user.id, emailVerifiedAt: null },
    });
    throw new RegistrationEmailDeliveryError();
  }
}

export async function verifyEmail(tokenHash: string): Promise<boolean> {
  if (!/^[a-f0-9]{64}$/.test(tokenHash)) return false;
  const storedTokenHash = hashOpaqueToken(tokenHash);
  const now = new Date();

  return prisma.$transaction(async (transaction) => {
    const token = await transaction.emailVerificationToken.findUnique({
      where: { tokenHash: storedTokenHash },
      select: { userId: true },
    });
    if (!token) return false;

    const claimed = await transaction.emailVerificationToken.updateMany({
      where: {
        tokenHash: storedTokenHash,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });
    if (claimed.count !== 1) return false;

    const verified = await transaction.user.updateMany({
      where: { id: token.userId, emailVerifiedAt: null },
      data: { emailVerifiedAt: now },
    });
    return verified.count === 1;
  });
}

export async function signIn(
  credentials: SignInCredentials,
): Promise<{ token: string; user: { id: string; email: string } } | null> {
  const user = await prisma.user.findUnique({
    where: { email: credentials.email },
    select: { id: true, email: true, passwordHash: true, emailVerifiedAt: true },
  });
  const passwordMatches = await verifyPassword(
    credentials.password,
    user?.passwordHash ?? null,
  );
  if (!user || !user.emailVerifiedAt || !passwordMatches) return null;

  const token = newSessionToken();
  await prisma.session.create({
    data: {
      userId: user.id,
      tokenHash: hashOpaqueToken(token),
      expiresAt: new Date(Date.now() + SESSION_TTL_SECONDS * 1_000),
    },
  });
  return { token, user: { id: user.id, email: user.email } };
}

export async function validateSession(
  token: string | undefined,
): Promise<{ id: string; email: string } | null> {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;

  const tokenHash = hashOpaqueToken(token);
  const session = await prisma.session.findUnique({
    where: { tokenHash },
    select: {
      expiresAt: true,
      user: {
        select: { id: true, email: true, emailVerifiedAt: true },
      },
    },
  });

  if (!session) return null;
  if (session.expiresAt <= new Date() || !session.user.emailVerifiedAt) {
    await prisma.session.deleteMany({ where: { tokenHash } });
    return null;
  }

  return { id: session.user.id, email: session.user.email };
}

export async function endSession(token: string | undefined): Promise<void> {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return;
  await prisma.session.deleteMany({ where: { tokenHash: hashOpaqueToken(token) } });
}
