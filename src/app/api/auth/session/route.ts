import { authJsonResponse } from "@/lib/auth/responses";
import { getCurrentSession } from "@/lib/auth/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const user = await getCurrentSession();
  if (!user) return authJsonResponse({ error: "Authentication required." }, 401);
  return authJsonResponse({ user: { email: user.email } });
}
