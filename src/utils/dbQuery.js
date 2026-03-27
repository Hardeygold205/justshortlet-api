import pool from "../config/db.js";

export const query = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (err) {
    console.error("DB Query Error:", err);
    throw err;
  }
};
