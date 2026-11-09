import "server-only";
import { cookies } from "next/headers";
import { SESSION_TTL_SECONDS, validateSession } from "@/lib/auth/service";

export const SESSION_COOKIE_NAME = "tilikstory_session";

export function sessionCookieOptions(production = process.env.NODE_ENV === "production") {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: production,
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}

export async function getCurrentSession(): Promise<{
  id: string;
  email: string;
} | null> {
  const cookieStore = await cookies();
  return validateSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
}
