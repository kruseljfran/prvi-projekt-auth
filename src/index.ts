import path from "path";
import express from "express";
import dotenv from "dotenv";
import { auth } from "express-openid-connect";
import adminRoutes from "./routes/adminRoutes";
import mainRoutes from "./routes/mainRoutes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "../public")));

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const config = {
  authRequired: false,
  auth0Logout: true,
  secret: process.env.AUTH0_SECRET!,
  baseURL: process.env.AUTH0_BASE_URL!,
  clientID: process.env.AUTH0_CLIENT_ID!,
  issuerBaseURL: process.env.AUTH0_ISSUER_BASE_URL!,
};

app.use(auth(config));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/admin", adminRoutes);

app.use("/", mainRoutes);

app.use((err: any, _req: any, res: any, _next: any) => {
  if (err && err.name === "UnauthorizedError") {
    return res.status(401).json({ error: "Unauthorized: invalid or missing token" });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Server pokrenut na ${PORT}`);
});
