import "dotenv/config";
import { assertLocalPostgresUrl } from "./src/lib/database-url";
import { defineConfig, env } from "prisma/config";

const databaseUrl = assertLocalPostgresUrl(env("DATABASE_URL"));

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: { path: "prisma/migrations" },
  datasource: { url: databaseUrl },
});
