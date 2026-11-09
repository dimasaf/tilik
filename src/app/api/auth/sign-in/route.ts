import { cookies } from "next/headers";
import { authJsonResponse } from "@/lib/auth/responses";
import { signIn } from "@/lib/auth/service";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { hasSameOrigin, parseJsonBody, signInSchema } from "@/lib/auth/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!hasSameOrigin(request)) {
    return authJsonResponse({ error: "Request origin is not allowed." }, 403);
  }

  const parsed = signInSchema.safeParse(await parseJsonBody(request));
  if (!parsed.success) {
    return authJsonResponse({ error: "Enter a valid email and password." }, 400);
  }

  const result = await signIn(parsed.data);
  if (!result) {
    return authJsonResponse(
      { error: "Email/password is incorrect or the account is not verified." },
      401,
    );
  }

  const cookieStore = await cookies();
  cookieStore.set(
    SESSION_COOKIE_NAME,
    result.token,
    sessionCookieOptions(),
  );
  return authJsonResponse({ user: { email: result.user.email } });
}
