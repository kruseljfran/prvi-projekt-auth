import dotenv from "dotenv";

dotenv.config();

import pg from "pg";

console.log("Connecting to DB:", process.env.DATABASE_URL);

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export default pool;