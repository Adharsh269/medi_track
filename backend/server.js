
require("dotenv").config();

const express = require("express");
const cors = require("cors");
const profileRoutes = require("./routes/profile");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
  })
);

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "MedicTrack API",
  });
});

app.use("/api", profileRoutes);

app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
  });
});

app.listen(PORT, () => {
  console.log(`MedicTrack API running on http://localhost:${PORT}`);
});
