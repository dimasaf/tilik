import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
  type ScryptOptions,
} from "node:crypto";

function scryptAsync(
  password: string,
  salt: Buffer,
  keylen: number,
  options: ScryptOptions,
): Promise<Buffer> {
  const { promise, resolve, reject } = Promise.withResolvers<Buffer>();
  scryptCallback(password, salt, keylen, options, (error, derivedKey) => {
    if (error) {
      reject(error);
    } else {
      resolve(derivedKey);
    }
  });
  return promise;
}

const SCRYPT_N = 32_768;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const SCRYPT_KEY_BYTES = 64;
const SCRYPT_MAXMEM_BYTES = 64 * 1024 * 1024;

function derivePasswordKey(password: string, salt: Buffer): Promise<Buffer> {
  return scryptAsync(password, salt, SCRYPT_KEY_BYTES, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
    maxmem: SCRYPT_MAXMEM_BYTES,
  });
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await derivePasswordKey(password, salt);
  return `$scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt.toString("hex")}$${key.toString("hex")}`;
}

function decodePasswordHash(encoded: string): { salt: Buffer; key: Buffer } | null {
  const parts = encoded.split("$");
  if (
    parts.length !== 7 ||
    parts[1] !== "scrypt" ||
    Number(parts[2]) !== SCRYPT_N ||
    Number(parts[3]) !== SCRYPT_R ||
    Number(parts[4]) !== SCRYPT_P ||
    !/^[a-f0-9]{32}$/.test(parts[5] ?? "") ||
    !/^[a-f0-9]{128}$/.test(parts[6] ?? "")
  ) {
    return null;
  }

  return {
    salt: Buffer.from(parts[5]!, "hex"),
    key: Buffer.from(parts[6]!, "hex"),
  };
}

const dummyPasswordHash = hashPassword(randomBytes(32).toString("hex"));

export async function verifyPassword(
  password: string,
  encoded: string | null,
): Promise<boolean> {
  const parsed = encoded ? decodePasswordHash(encoded) : null;
  const target = parsed ?? decodePasswordHash(await dummyPasswordHash)!;
  const derived = await derivePasswordKey(password, target.salt);
  const matches = timingSafeEqual(derived, target.key);
  return parsed !== null && encoded !== null && matches;
}

export function hashOpaqueToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function newEmailVerificationTokenHash(): string {
  return createHash("sha256").update(randomBytes(32)).digest("hex");
}

export function newSessionToken(): string {
  return randomBytes(32).toString("base64url");
}
