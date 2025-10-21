import path from "path";
import express from "express";
import dotenv from "dotenv";
import { auth } from "express-openid-connect";
import adminRoutes from "./routes/adminRoutes";
import mainRoutes from "./routes/mainRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// Auth0 konfiguracija
const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET!,
  baseURL: process.env.AUTH0_BASE_URL!,
  clientID: process.env.AUTH0_CLIENT_ID!,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL!,
};

// Middleware za Auth0
app.use(auth(config));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/admin", adminRoutes);

app.use("/", mainRoutes);

// handle express-jwt errors
app.use((err: any, _req: any, res: any, _next: any) => {
  if (err && err.name === "UnauthorizedError") {
    // token missing / invalid
    return res.status(401).json({ error: "Unauthorized: invalid or missing token" });
  }
  // fallback
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server pokrenut na http://localhost:${PORT}`);
});
