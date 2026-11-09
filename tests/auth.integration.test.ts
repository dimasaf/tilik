import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  assertComposeAuthTestEndpoints,
  type AuthTestEndpointConfiguration,
} from "../src/lib/auth/test-endpoints";

const endpoints: AuthTestEndpointConfiguration = {
  topology: process.env.AUTH_TEST_TOPOLOGY ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  appUrl: process.env.AUTH_TEST_APP_URL ?? "",
  appOrigin: process.env.APP_ORIGIN ?? "",
  mailpitApiUrl: process.env.MAILPIT_API_URL ?? "",
  smtpHost: process.env.SMTP_HOST ?? "",
  smtpPort: Number(process.env.SMTP_PORT),
};

const appUrl = endpoints.appUrl;
const mailpitApiUrl = endpoints.mailpitApiUrl;
const origin = new URL(endpoints.appOrigin || "http://invalid").origin;
const password = "local integration password 2026!";
let email = "";
let confirmationPathAndQuery = "";

function authRequest(body?: unknown, cookie?: string): RequestInit {
  const headers = new Headers({ origin });
  if (body !== undefined) headers.set("content-type", "application/json");
  if (cookie) headers.set("cookie", cookie);
  return {
    method: body === undefined ? "GET" : "POST",
    headers,
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    redirect: "manual",
  };
}

async function confirmationEmail(recipient: string): Promise<string> {
  const search = new URL("/api/v1/search", mailpitApiUrl);
  search.searchParams.set("query", `to:"${recipient}"`);
  search.searchParams.set("limit", "10");

  const searchResponse = await fetch(search);
  if (!searchResponse.ok) {
    throw new Error("The local Mailpit search endpoint is unavailable.");
  }

  const result = (await searchResponse.json()) as {
    messages?: Array<{ ID?: string; id?: string }>;
  };
  const messageId = result.messages?.[0]?.ID ?? result.messages?.[0]?.id;
  if (!messageId) {
    throw new Error("Mailpit did not receive the confirmation email.");
  }

  const messageResponse = await fetch(
    new URL(`/api/v1/message/${encodeURIComponent(messageId)}`, mailpitApiUrl),
  );
  if (!messageResponse.ok) {
    throw new Error("The local Mailpit message could not be read.");
  }

  const message = (await messageResponse.json()) as {
    Text?: string;
    text?: string;
  };
  const match = (message.Text ?? message.text ?? "").match(
    /https?:\/\/[^\s<>"']+/,
  );
  if (!match) throw new Error("The confirmation email has no activation link.");
  return match[0].replace(/[),.;]+$/, "");
}

function confirmationPath(tokenHash: string): string {
  const query = new URLSearchParams({ token_hash: tokenHash, type: "email" });
  return `/auth/confirm?${query.toString()}`;
}

function cookiePair(response: Response): string {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie) throw new Error("The sign-in response did not set a session cookie.");
  return setCookie.split(";", 1)[0]!;
}

beforeAll(async () => {
  assertComposeAuthTestEndpoints(endpoints);

  const appHealth = await fetch(new URL("/api/health", appUrl));
  const mailpitHealth = await fetch(new URL("/api/v1/info", mailpitApiUrl));
  if (!appHealth.ok || !mailpitHealth.ok) {
    throw new Error("The private Compose app or Mailpit service is unavailable.");
  }
});

afterAll(() => {
  confirmationPathAndQuery = "";
});

describe("T1 registration, email confirmation, and PostgreSQL sessions", () => {
  test("rejects cross-origin authentication mutations", async () => {
    const response = await fetch(new URL("/api/auth/sign-out", appUrl), {
      method: "POST",
      headers: { origin: "https://attacker.example" },
      redirect: "manual",
    });
    expect(response.status).toBe(403);
  });
  test("rejects protected reads before account registration", async () => {
    const page = await fetch(new URL("/account", appUrl), { redirect: "manual" });
    expect(page.status).toBe(307);
    expect(new URL(page.headers.get("location")!, appUrl).pathname).toBe("/sign-in");

    const session = await fetch(new URL("/api/auth/session", appUrl));
    expect(session.status).toBe(401);
    expect(session.headers.get("cache-control")).toContain("no-store");
  });

  test("registers an unverified account and sends a local confirmation email", async () => {
    email = `auth-${crypto.randomUUID()}@example.test`;
    const page = await fetch(new URL("/register", appUrl));
    expect(page.status).toBe(200);
    const pageMarkup = await page.text();
    expect(pageMarkup.includes('name="email"')).toBe(true);
    expect(pageMarkup.includes('name="password"')).toBe(true);

    const registration = await fetch(
      new URL("/api/auth/register", appUrl),
      authRequest({ email, password }),
    );
    expect(registration.status).toBe(202);
    expect(registration.headers.get("cache-control")).toContain("no-store");
    expect(registration.headers.has("set-cookie")).toBe(false);

    const blockedSignIn = await fetch(
      new URL("/api/auth/sign-in", appUrl),
      authRequest({ email, password }),
    );
    expect(blockedSignIn.status).toBe(401);

    const confirmationUrl = new URL(await confirmationEmail(email));
    expect(confirmationUrl.origin).toBe(endpoints.appOrigin);
    expect(confirmationUrl.pathname).toBe("/auth/confirm");
    expect([...confirmationUrl.searchParams.keys()].sort()).toEqual([
      "token_hash",
      "type",
    ]);
    expect(confirmationUrl.searchParams.get("type")).toBe("email");
    confirmationPathAndQuery = `${confirmationUrl.pathname}${confirmationUrl.search}`;
    const tokenHash = confirmationUrl.searchParams.get("token_hash") ?? "";
    expect(/^[a-f0-9]{64}$/.test(tokenHash)).toBe(true);

    const malformed = await fetch(
      new URL("/auth/confirm?type=email", appUrl),
      { redirect: "manual" },
    );
    expect(malformed.status).toBe(400);
    expect(malformed.headers.get("cache-control")).toBe("no-store");
    expect(malformed.headers.get("referrer-policy")).toBe("no-referrer");

    const extraAuthParameter = await fetch(
      new URL(
        `${confirmationPath(confirmationUrl.searchParams.get("token_hash") ?? "")}&access_token=unexpected`,
        appUrl,
      ),
      { redirect: "manual" },
    );
    expect(extraAuthParameter.status).toBe(400);

    const wrongType = await fetch(
      new URL(
        `/auth/confirm?${new URLSearchParams({
          token_hash: tokenHash,
          type: "signup",
        })}`,
        appUrl,
      ),
      { redirect: "manual" },
    );
    expect(wrongType.status).toBe(400);
  });

  test("confirms once with a same-origin sanitized, non-cacheable redirect", async () => {
    const response = await fetch(
      new URL(confirmationPathAndQuery, appUrl),
      { redirect: "manual" },
    );

    expect(response.status).toBe(303);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(response.headers.get("referrer-policy")).toBe("no-referrer");
    const location = response.headers.get("location") ?? "";
    const redirectUrl = new URL(location, endpoints.appOrigin);
    expect(redirectUrl.origin).toBe(endpoints.appOrigin);
    expect(redirectUrl.pathname).toBe("/sign-in");
    expect([...redirectUrl.searchParams.keys()]).toEqual(["verified"]);
    expect(location).toBe("/sign-in?verified=1");
    expect(redirectUrl.searchParams.has("token_hash")).toBe(false);
    expect(redirectUrl.searchParams.has("access_token")).toBe(false);

    const replay = await fetch(
      new URL(confirmationPathAndQuery, appUrl),
      { redirect: "manual" },
    );
    expect(replay.status).toBe(400);
    expect(replay.headers.get("cache-control")).toBe("no-store");
    expect(replay.headers.get("referrer-policy")).toBe("no-referrer");
  });

  test("creates independent PostgreSQL sessions and signs out only the current one", async () => {
    const firstSignIn = await fetch(
      new URL("/api/auth/sign-in", appUrl),
      authRequest({ email, password }),
    );
    expect(firstSignIn.status).toBe(200);
    const firstSetCookie = firstSignIn.headers.get("set-cookie") ?? "";
    expect(firstSetCookie.toLowerCase().includes("httponly")).toBe(true);
    expect(firstSetCookie.toLowerCase().includes("samesite=lax")).toBe(true);
    expect(firstSetCookie.toLowerCase().includes("secure")).toBe(true);
    const firstCookie = cookiePair(firstSignIn);

    const firstSession = await fetch(new URL("/api/auth/session", appUrl), {
      headers: { cookie: firstCookie },
    });
    expect(firstSession.status).toBe(200);
    expect((await firstSession.json()).user.email).toBe(email);
    expect((await fetch(new URL("/account", appUrl), {
      headers: { cookie: firstCookie },
    })).status).toBe(200);

    const secondSignIn = await fetch(
      new URL("/api/auth/sign-in", appUrl),
      authRequest({ email, password }),
    );
    expect(secondSignIn.status).toBe(200);
    const secondCookie = cookiePair(secondSignIn);
    expect(secondCookie === firstCookie).toBe(false);

    const signOut = await fetch(
      new URL("/api/auth/sign-out", appUrl),
      authRequest({}, firstCookie),
    );
    expect(signOut.status).toBe(200);
    expect(signOut.headers.get("cache-control")).toContain("no-store");

    const firstSessionAfterSignOut = await fetch(
      new URL("/api/auth/session", appUrl),
      { headers: { cookie: firstCookie } },
    );
    expect(firstSessionAfterSignOut.status).toBe(401);
    const firstProtectedPageAfterSignOut = await fetch(
      new URL("/account", appUrl),
      { headers: { cookie: firstCookie }, redirect: "manual" },
    );
    expect(firstProtectedPageAfterSignOut.status).toBe(307);

    const secondSessionAfterSignOut = await fetch(
      new URL("/api/auth/session", appUrl),
      { headers: { cookie: secondCookie } },
    );
    expect(secondSessionAfterSignOut.status).toBe(200);

    const secondSignOut = await fetch(
      new URL("/api/auth/sign-out", appUrl),
      authRequest({}, secondCookie),
    );
    expect(secondSignOut.status).toBe(200);
  });
});
