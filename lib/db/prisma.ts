import "server-only";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "@/lib/generated/prisma/client";

type GlobalWithPrisma = typeof globalThis & {
  rytmPrisma?: PrismaClient;
};

const globalForPrisma = globalThis as GlobalWithPrisma;

export function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

export function getPrismaClient() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required before using the Prisma database.");
  }

  if (!globalForPrisma.rytmPrisma) {
    globalForPrisma.rytmPrisma = new PrismaClient({
      adapter: new PrismaPg(process.env.DATABASE_URL),
    });
  }

  return globalForPrisma.rytmPrisma;
}
