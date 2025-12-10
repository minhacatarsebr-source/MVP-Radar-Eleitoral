const express = require("express");
const app = express();

app.get("/mentions", (req, res) => {
  const { api_key, limit } = req.query;

  if (!api_key) {
    return res.status(401).json({ error: "Missing API key" });
  }

  res.json({
    ok: true,
    endpoint: "mentions",
    limit: limit ?? 20,
    time: new Date().toISOString()
  });
});

// Porta automática do Vercel
module.exports = app;
