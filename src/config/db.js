import pkg from "pg";
const { Pool } = pkg;

import ENV from "../config/env.js";

const pool = new Pool({
  connectionString: ENV.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

(async () => {
  try {
    const client = await pool.connect();
    console.log("Connected to PostgreSQL (Neon)");
    client.release();
  } catch (err) {
    console.error("❌ Error connecting to PostgreSQL:", err);
  }
})();

pool.on("error", (err) => {
  console.error("❌ PostgreSQL error:", err);
});

export default pool;
