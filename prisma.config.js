import { defineConfig } from "@prisma/config";
import ENV from "./src/config/env";

export default defineConfig({
  schema: "prisma/schema",
  datasource: {
    url: ENV.POSTGRES_DATABASE_URL,
  },
});
