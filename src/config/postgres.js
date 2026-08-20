import pkg from "pg";
const { Pool } = pkg;

import ENV from "./env.js";

const pool = new Pool({
  connectionString: ENV.POSTGRES_DATABASE_URL,
  ssl: ENV.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

(async () => {
  try {
    const client = await pool.connect();
    console.log("Connected to PostgreSQL");
    client.release();
  } catch (err) {
    console.error("Error connecting to PostgreSQL:", err);
  }
})();

pool.on("error", (err) => {
  console.error("PostgreSQL error:", err);
});

export default pool;

export const query = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error("DB Query Error:", err);
    throw err;
  }
};
