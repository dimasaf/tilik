import { describe, expect, test } from "bun:test";
import {
  assertComposeAuthTestEndpoints,
  type AuthTestEndpointConfiguration,
} from "../../src/lib/auth/test-endpoints";

const localEndpoints: AuthTestEndpointConfiguration = {
  topology: "compose-private",
  databaseUrl:
    "postgresql://tilikstory@postgres:5432/tilikstory?schema=public",
  appUrl: "http://app:3000",
  appOrigin: "http://localhost:3000",
  mailpitApiUrl: "http://mailpit:8025",
  smtpHost: "mailpit",
  smtpPort: 1025,
};

describe("local authentication test endpoint confinement", () => {
  test("accepts only the approved private Compose service topology", () => {
    expect(() => assertComposeAuthTestEndpoints(localEndpoints)).not.toThrow();
  });

  test("fails closed for a hosted PostgreSQL endpoint", () => {
    expect(() =>
      assertComposeAuthTestEndpoints({
        ...localEndpoints,
        databaseUrl:
          "postgresql://user@db.example.com:5432/tilikstory",
      }),
    ).toThrow();
  });

  test("fails closed for an external Mailpit endpoint", () => {
    expect(() =>
      assertComposeAuthTestEndpoints({
        ...localEndpoints,
        mailpitApiUrl: "https://mailpit.example.com",
      }),
    ).toThrow();
  });

  test("fails closed for an app endpoint outside the local Compose stack", () => {
    expect(() =>
      assertComposeAuthTestEndpoints({
        ...localEndpoints,
        appUrl: "https://app.example.com",
      }),
    ).toThrow();
  });

  test("fails closed when private Compose topology is not explicitly selected", () => {
    expect(() =>
      assertComposeAuthTestEndpoints({
        ...localEndpoints,
        topology: "loopback",
      }),
    ).toThrow();
  });
});
