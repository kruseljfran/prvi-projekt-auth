import express, { Request, Response } from "express";
import pool from "../db";
import m2mAuth from "../middleware/m2mAuth";

const router = express.Router();


/**
 * POST /new-round
 * Aktivira novo kolo (ako trenutno nema aktivnog)
 */
router.post("/new-round", m2mAuth, async (req: Request, res: Response) => {
  try {
    const activeRound = await pool.query("SELECT * FROM rounds WHERE active = TRUE");

    if (activeRound.rows.length > 0) {
      // Već postoji aktivno kolo → nema efekta
      return res.sendStatus(204);
    }

    await pool.query("INSERT INTO rounds (active) VALUES (TRUE)");
    return res.status(201).json({ message: "Novo kolo uspješno aktivirano." });
  } catch (error) {
    console.error("Greška kod /new-round:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

/**
 * POST /close
 * Zatvara trenutno aktivno kolo
 */
router.post("/close", m2mAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(
      "UPDATE rounds SET active = FALSE WHERE active = TRUE RETURNING *"
    );

    if (result.rowCount === 0) {
      // Nema aktivnog kola → nema efekta
      return res.sendStatus(204);
    }

    return res.status(200).json({ message: "Kolo uspješno zatvoreno." });
  } catch (error) {
    console.error("Greška kod /close:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});

/**
 * POST /store-results
 * Sprema izvučene brojeve za trenutno kolo
 */
router.post("/store-results", m2mAuth, async (req: Request, res: Response) => {
  try {
    const { numbers } = req.body;

    if (!numbers || !Array.isArray(numbers)) {
      return res.status(400).json({ error: "Nedostaje polje 'numbers' ili nije u ispravnom formatu." });
    }

    const { rows: rounds } = await pool.query(
      "SELECT * FROM rounds ORDER BY id DESC LIMIT 1"
    );

    if (rounds.length === 0) {
      return res.status(400).json({ error: "Nema evidentiranih kola u bazi." });
    }

    const currentRound = rounds[0];

    if (currentRound.active) {
      return res.status(400).json({ error: "Uplate su još aktivne — brojevi se ne mogu pohraniti." });
    }

    if (currentRound.draw_numbers && currentRound.draw_numbers.length > 0) {
      return res.status(400).json({ error: "Brojevi za ovo kolo su već pohranjeni." });
    }

    await pool.query(
      "UPDATE rounds SET draw_numbers = $1 WHERE id = $2",
      [numbers, currentRound.id]
    );

    return res.sendStatus(204);
  } catch (error) {
    console.error("Greška kod /store-results:", error);
    res.status(500).json({ error: "Greška na serveru." });
  }
});


export default router;
