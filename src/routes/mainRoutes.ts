import express, {Request, Response} from "express";
import pool from "../db";
import { v4 as uuidv4 } from "uuid";
// @ts-ignore
import QRCode from "qrcode";

import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

// Početna stranica — prikazuje podatke o trenutnom kolu i korisniku
router.get("/", async (req, res) => {
  try {
    const user = (req as any).oidc?.user || null;

    // Dohvati trenutno kolo (ako postoji)
    const result = await pool.query("SELECT * FROM rounds ORDER BY id DESC LIMIT 1");
    const currentRound = result.rows[0] || null;

    res.render("index", { user, round: currentRound });
  } catch (error) {
    console.error("Greška kod GET /:", error);
    res.status(500).send("Greška na serveru.");
  }
});

router.get("/ticket", (req: Request, res: Response) => {
  res.render("ticket", { error: null });
});

// POST /ticket - obrada uplate listića
router.post("/ticket", async (req: Request, res: Response) => {
  try {
    const { idNumber, numbers } = req.body;

    // Validacija idNumber
    if (!idNumber || idNumber.length > 20) {
      return res.render("ticket", { error: "Neispravan broj osobne iskaznice/putovnice." });
    }

    // Validacija brojeva
    if (!numbers) {
      return res.render("ticket", { error: "Polje brojevi ne smije biti prazno." });
    }

    const nums = numbers.split(",").map((n: string) => parseInt(n.trim(), 10));

    if (nums.length < 6 || nums.length > 10) {
      return res.render("ticket", { error: "Brojevi moraju biti između 6 i 10." });
    }

    const invalidNum = nums.find((n: number) => isNaN(n) || n < 1 || n > 45);
    if (invalidNum !== undefined) {
      return res.render("ticket", { error: `Neispravan broj: ${invalidNum}. Mora biti između 1 i 45.` });
    }

    const uniqueNums = new Set(nums);
    if (uniqueNums.size !== nums.length) {
      return res.render("ticket", { error: "Brojevi ne smiju sadržavati duplikate." });
    }

    // Dohvati trenutno kolo
    const { rows: rounds } = await pool.query("SELECT * FROM rounds WHERE active = TRUE ORDER BY id DESC LIMIT 1");
    if (rounds.length === 0) {
      return res.render("ticket", { error: "Trenutno nema aktivnog kola." });
    }
    const currentRound = rounds[0];

    // Generiraj UUID za listić
    const ticketId = uuidv4();

    // Spremi u bazu
    await pool.query(
      "INSERT INTO tickets (id, personal_id, numbers, round_id) VALUES ($1, $2, $3, $4)",
      [ticketId, idNumber, nums, currentRound.id]
    );

    // Generiraj QR kod (sadrži URL za prikaz listića)
  const baseUrl = process.env.AUTH0_BASE_URL;
  const qrUrl = `${baseUrl}/ticket/${ticketId}`;
  const qrImage = await QRCode.toDataURL(qrUrl);

    // Vrati stranicu s QR kodom
    res.render("ticketConfirm", { qrImage });

  } catch (error) {
    console.error("Greška kod POST /ticket:", error);
    res.status(500).send("Greška na serveru.");
  }
});

router.get("/ticket/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Dohvati listić po UUID-u
    const ticketResult = await pool.query(
      "SELECT * FROM tickets WHERE id = $1",
      [id]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).send("Listić nije pronađen.");
    }

    const ticket = ticketResult.rows[0];

    // Dohvati pripadajuće kolo
    const roundResult = await pool.query(
      "SELECT * FROM rounds WHERE id = $1",
      [ticket.round_id]
    );
    const round = roundResult.rows[0] || null;

    res.render("ticketView", { ticket, round });
  } catch (error) {
    console.error("Greška kod GET /ticket/:id:", error);
    res.status(500).send("Greška na serveru.");
  }
});

export default router;
