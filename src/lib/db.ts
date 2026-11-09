import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { assertLocalPostgresUrl } from "@/lib/database-url";

const globalForPrisma = globalThis as typeof globalThis & {
  tilikstoryPrisma?: PrismaClient;
};

function createPrismaClient(): PrismaClient {
  const connectionString = assertLocalPostgresUrl(process.env.DATABASE_URL ?? "");
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
  });
}

export const prisma = globalForPrisma.tilikstoryPrisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.tilikstoryPrisma = prisma;
}
