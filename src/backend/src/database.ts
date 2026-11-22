import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../node_modules/.generated/prisma/client.js";

export function createDatabase(databaseUrl: string): PrismaClient {
  return new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });
}
