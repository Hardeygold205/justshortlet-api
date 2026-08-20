import mysql from "mysql2/promise";
import ENV from "./env.js";

const pool = mysql.createPool({
  uri: ENV.MYSQL_DATABASE_URL,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

(async () => {
  try {
    const conn = await pool.getConnection();
    console.log("Connected to MySQL");
    conn.release();
  } catch (err) {
    console.error("Error connecting to MySQL:", err);
  }
})();

export default pool;

export const query = async (sql, params) => {
  try {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } catch (err) {
    console.error("MySQL Query Error:", err);
    throw err;
  }
};
