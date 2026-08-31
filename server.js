const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, "public")));

app.get("/api/health", (req, res) => {
  res.json({ ok: true, name: "Minecraft Skript Generator" });
});

app.listen(PORT, () => {
  console.log(`Minecraft Skript Generator działa: http://localhost:${PORT}`);
});