import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import ENV from "../src/config/env.js";

const client = postgres(ENV.POSTGRES_DATABASE_URL);
export const db = drizzle(client);
