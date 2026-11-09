import {
  RegistrationEmailDeliveryError,
  registerAccount,
} from "@/lib/auth/service";
import { authJsonResponse } from "@/lib/auth/responses";
import { hasSameOrigin, parseJsonBody, registrationSchema } from "@/lib/auth/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request): Promise<Response> {
  if (!hasSameOrigin(request)) {
    return authJsonResponse({ error: "Request origin is not allowed." }, 403);
  }

  const parsed = registrationSchema.safeParse(await parseJsonBody(request));
  if (!parsed.success) {
    return authJsonResponse({ error: "Enter a valid email and a password of at least 12 characters." }, 400);
  }

  try {
    await registerAccount(parsed.data);
  } catch (error) {
    const status = error instanceof RegistrationEmailDeliveryError ? 503 : 500;
    return authJsonResponse(
      { error: "Registration could not be completed. Please try again." },
      status,
    );
  }

  return authJsonResponse(
    { message: "If this address can be registered, confirmation instructions have been sent." },
    202,
  );
}
