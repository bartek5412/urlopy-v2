import { PrismaClient } from "@prisma/client";
import { PrismaBetterSQLite3 } from "@prisma/adapter-better-sqlite3";
import Database from "better-sqlite3";

// Singleton pattern dla Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Utwórz adapter dla SQLite
const databaseUrl = process.env.DATABASE_URL || "file:./prisma/prod.db";
// Usuń prefix "file:" z URL dla better-sqlite3
const dbPath = databaseUrl.startsWith("file:") 
  ? databaseUrl.replace("file:", "") 
  : databaseUrl;
const sqliteDatabase = new Database(dbPath);
const adapter = new PrismaBetterSQLite3(sqliteDatabase);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;
