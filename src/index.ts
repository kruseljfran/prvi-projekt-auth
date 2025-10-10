import express, { Request, Response } from "express";
import dotenv from "dotenv";
import path from "path";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Postavi view engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "../views"));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Početna ruta
app.get("/", (req: Request, res: Response) => {
  res.render("index", {
    message: "Dobrodošli u Loto aplikaciju 🎰 (TypeScript + Express)"
  });
});

app.listen(PORT, () => {
  console.log(`✅ Server pokrenut na http://localhost:${PORT}`);
});
