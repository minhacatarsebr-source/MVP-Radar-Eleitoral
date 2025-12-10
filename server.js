const express = require("express");
const app = express();

app.get("/", (req, res) => {
  res.send("API do Radar Eleitoral está funcionando!");
});

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

// ADICIONE ENDPOINTS FUTUROS AQUI
// app.get("/territories", ...)
// app.get("/alerts", ...)

module.exports = app;
