import { describe, expect, test } from "bun:test";
import { hasSameOrigin } from "../../src/lib/auth/validation";

const previousOrigin = process.env.APP_ORIGIN;

function requestWithOrigin(origin?: string): Request {
  const headers = new Headers();
  if (origin) headers.set("origin", origin);
  return new Request("http://app:3000/api/auth/register", {
    method: "POST",
    headers,
  });
}

describe("authentication mutation origin checks", () => {
  test("accepts the configured browser origin across the private Compose alias", () => {
    process.env.APP_ORIGIN = "http://localhost:3000";
    expect(hasSameOrigin(requestWithOrigin("http://localhost:3000"))).toBe(true);
  });

  test("rejects path-bearing, missing, and non-canonical origins", () => {
    process.env.APP_ORIGIN = "http://localhost:3000";
    expect(hasSameOrigin(requestWithOrigin("http://localhost:3000/path"))).toBe(false);
    expect(hasSameOrigin(requestWithOrigin())).toBe(false);
    expect(hasSameOrigin(requestWithOrigin("https://attacker.example"))).toBe(false);
  });
});

if (previousOrigin === undefined) {
  delete process.env.APP_ORIGIN;
} else {
  process.env.APP_ORIGIN = previousOrigin;
}
