import { describe, expect, test } from "bun:test";
import { assertLocalPostgresUrl } from "../../src/lib/database-url";

describe("application PostgreSQL endpoint policy", () => {
  test("allows the local Compose PostgreSQL service", () => {
    expect(() =>
      assertLocalPostgresUrl(
        "postgresql://tilikstory@postgres:5432/tilikstory?schema=public",
      ),
    ).not.toThrow();
  });

  test("allows host development over loopback", () => {
    expect(() =>
      assertLocalPostgresUrl(
        "postgresql://tilikstory@127.0.0.1:5432/tilikstory?schema=public",
      ),
    ).not.toThrow();
  });

  test("rejects hosted PostgreSQL and Prisma Postgres endpoints", () => {
    expect(() =>
      assertLocalPostgresUrl(
        "postgresql://user@pooled.db.prisma.io:5432/postgres?sslmode=require",
      ),
    ).toThrow();
    expect(() =>
      assertLocalPostgresUrl(
        "postgresql://user@db.example.com:5432/tilikstory",
      ),
    ).toThrow();
  });
});
