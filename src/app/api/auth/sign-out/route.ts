import { cookies } from "next/headers";
import { authJsonResponse } from "@/lib/auth/responses";
import { endSession } from "@/lib/auth/service";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { hasSameOrigin } from "@/lib/auth/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!hasSameOrigin(request)) {
    return authJsonResponse({ error: "Request origin is not allowed." }, 403);
  }

  const cookieStore = await cookies();
  await endSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  cookieStore.set(SESSION_COOKIE_NAME, "", {
    ...sessionCookieOptions(),
    maxAge: 0,
  });
  return authJsonResponse({ signedOut: true });
}
