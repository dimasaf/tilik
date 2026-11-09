import { describe, expect, test } from "bun:test";
import { sessionCookieOptions } from "../../src/lib/auth/session";

describe("session cookie policy", () => {
  test("uses secure, httpOnly, SameSite=Lax cookies in production", () => {
    const options = sessionCookieOptions(true);
    expect(options.secure).toBe(true);
    expect(options.httpOnly).toBe(true);
    expect(options.sameSite).toBe("lax");
    expect(options.path).toBe("/");
    expect(options.maxAge).toBeGreaterThan(0);
  });

  test("keeps local HTTP development usable without Secure", () => {
    expect(sessionCookieOptions(false).secure).toBe(false);
  });
});
