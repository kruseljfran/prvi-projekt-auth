import pool from "./db";

async function migrate() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS rounds (
        id SERIAL PRIMARY KEY,
        active BOOLEAN DEFAULT true,
        draw_numbers INTEGER[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tickets (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        round_id INTEGER REFERENCES rounds(id),
        personal_id VARCHAR(20) NOT NULL,
        numbers INTEGER[] NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log("Tables created successfully");
  } catch (error) {
    console.error("Migration failed:", error);
  } finally {
    await pool.end();
  }
}

migrate();
