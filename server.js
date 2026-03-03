import express from "express";
import cors from "cors";
import os from "os";
import dotenv from "dotenv";

dotenv.config();

import dramaboxRoutes from "./routes/dramabox.js";
import netshortRoutes from "./routes/netshort.js";
import flickreelsRoutes from "./routes/flickreels.js";
import freereelsRoutes from "./routes/freereels.js";
import meloloRoutes from "./routes/melolo.js";
import reelshortRoutes from "./routes/reelshort.js";
import movieboxRoutes from "./routes/moviebox.js";

const app = express();

/* =========================
   BASIC CONFIG
========================= */

app.disable("x-powered-by");
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

/* =========================
   ROUTES
========================= */

app.use("/api", dramaboxRoutes);
app.use("/api", netshortRoutes);
app.use("/api", flickreelsRoutes);
app.use("/api", freereelsRoutes);
app.use("/api", meloloRoutes);
app.use("/api", reelshortRoutes);
app.use("/api", movieboxRoutes);

/* =========================
   404 HANDLER
========================= */

app.use((req, res) => {
  res.status(404).json({
    error: "Not Found",
    message: "Endpoint tidak ditemukan"
  });
});

/* =========================
   GLOBAL ERROR HANDLER
========================= */

app.use((err, req, res, next) => {
  console.error("Global Error:", err.stack);
  res.status(500).json({
    error: "Server Error",
    message: "Terjadi kesalahan pada server"
  });
});

/* =========================
   START SERVER
========================= */

const PORT = process.env.PORT || 5000;
const PUBLIC_IP = process.env.PUBLIC_IP || "localhost";

app.listen(PORT, "0.0.0.0", () => {
  console.log("\n🚀 Server Running:");
  console.log(`   ➜ Local:   http://localhost:${PORT}`);
  console.log(`   ➜ Public:  http://${PUBLIC_IP}:${PORT}\n`);
});