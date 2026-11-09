import { z } from "zod";
import { getApplicationOrigin } from "@/lib/auth/origin";

const email = z.string().trim().max(254).email().transform((value) => value.toLowerCase());

export const registrationSchema = z
  .object({
    email,
    password: z.string().min(12).max(128),
  })
  .strict();

export const signInSchema = z
  .object({
    email,
    password: z.string().min(1).max(128),
  })
  .strict();

export type RegistrationCredentials = z.infer<typeof registrationSchema>;
export type SignInCredentials = z.infer<typeof signInSchema>;

export function hasSameOrigin(request: Request): boolean {
  const suppliedOrigin = request.headers.get("origin");
  if (!suppliedOrigin) return false;

  try {
    const parsedOrigin = new URL(suppliedOrigin);
    return (
      suppliedOrigin === parsedOrigin.origin &&
      parsedOrigin.origin === getApplicationOrigin().origin
    );
  } catch {
    return false;
  }
}

export async function parseJsonBody(request: Request): Promise<unknown | null> {
  if (request.headers.get("content-type")?.split(";", 1)[0] !== "application/json") {
    return null;
  }

  const declaredLength = Number(request.headers.get("content-length") ?? 0);
  if (declaredLength > 4_096) return null;

  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > 4_096) return null;
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}
