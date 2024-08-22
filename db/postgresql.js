import pg from "pg";
import { DB_CONNSTRING } from "../config.js";

const pool = new pg.Pool({
  // ssl: { rejectUnauthorized: true },
  connectionString: DB_CONNSTRING,
  ssl: true,
});

export default pool;
