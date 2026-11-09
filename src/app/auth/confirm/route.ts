import { verifyEmail } from "@/lib/auth/service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function invalidConfirmation(): Response {
  return new Response("Confirmation link is invalid or expired.", {
    status: 400,
    headers: {
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

export async function GET(request: Request): Promise<Response> {
  const parameters = new URL(request.url).searchParams;
  if (
    parameters.size !== 2 ||
    parameters.getAll("token_hash").length !== 1 ||
    parameters.getAll("type").length !== 1 ||
    parameters.get("type") !== "email"
  ) {
    return invalidConfirmation();
  }

  const tokenHash = parameters.get("token_hash") ?? "";
  if (!/^[a-f0-9]{64}$/.test(tokenHash)) return invalidConfirmation();

  let verified: boolean;
  try {
    verified = await verifyEmail(tokenHash);
  } catch {
    return invalidConfirmation();
  }
  if (!verified) return invalidConfirmation();

  return new Response(null, {
    status: 303,
    headers: {
      Location: "/sign-in?verified=1",
      "Cache-Control": "no-store",
      "Referrer-Policy": "no-referrer",
    },
  });
}
