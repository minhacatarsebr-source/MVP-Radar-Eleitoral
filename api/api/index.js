// api/index.js
const express = require("express");
const serverless = require("serverless-http");
const app = express();

app.use(express.json());

// Middleware simples de checagem de api_key (pode ajustar)
app.use((req, res, next) => {
  const apiKey = req.query.api_key || req.headers["x-api-key"];
  if (!apiKey) {
    // para desenvolvimento, permitimos um modo "open" se precisar — aqui retornamos 401
    return res.status(401).json({ error: "Missing api_key (use ?api_key=... or X-API-KEY header)" });
  }
  // se quiser validar chave, faça aqui
  // if (apiKey !== process.env.PROXY_API_KEY) return res.status(403).json({ error: "Invalid key" });
  next();
});

/*
 Endpoints implementados:
  - /mentions       e /listar_mentions
  - /alerts         e /listar_alerts
  - /narratives     e /listar_narratives
  - /sentiment_aggregates e /listar_sentiment_aggregates
  - /territories    e /listar_territories
*/
const now = () => new Date().toISOString();

function makeListResponse(name, limit = 20) {
  const items = [];
  for (let i = 1; i <= limit; i++) {
    items.push({ id: `${name}_${i}`, sample: `${name} example ${i}` });
  }
  return {
    ok: true,
    endpoint: name,
    limit,
    time: now(),
    data: items
  };
}

app.get("/mentions", (req, res) => {
  const limit = parseInt(req.query.limit || 20, 10);
  res.json(makeListResponse("mentions", limit));
});
app.get("/listar_mentions", (req, res) => {
  const limit = parseInt(req.query.limit || 20, 10);
  res.json(makeListResponse("listar_mentions", limit));
});

app.get("/alerts", (req, res) => {
  const limit = parseInt(req.query.limit || 20, 10);
  res.json(makeListResponse("alerts", limit));
});
app.get("/listar_alerts", (req, res) => {
  const limit = parseInt(req.query.limit || 20, 10);
  res.json(makeListResponse("listar_alerts", limit));
});

app.get("/narratives", (req, res) => {
  const limit = parseInt(req.query.limit || 20, 10);
  res.json(makeListResponse("narratives", limit));
});
app.get("/listar_narratives", (req, res) => {
  const limit = parseInt(req.query.limit || 20, 10);
  res.json(makeListResponse("listar_narratives", limit));
});

app.get("/sentiment_aggregates", (req, res) => {
  const limit = parseInt(req.query.limit || 20, 10);
  res.json(makeListResponse("sentiment_aggregates", limit));
});
app.get("/listar_sentiment_aggregates", (req, res) => {
  const limit = parseInt(req.query.limit || 20, 10);
  res.json(makeListResponse("listar_sentiment_aggregates", limit));
});

app.get("/territories", (req, res) => {
  const limit = parseInt(req.query.limit || 20, 10);
  res.json(makeListResponse("territories", limit));
});
app.get("/listar_territories", (req, res) => {
  const limit = parseInt(req.query.limit || 20, 10);
  res.json(makeListResponse("listar_territories", limit));
});

// root health check
app.get("/", (req, res) => {
  res.send("API do Radar Eleitoral está funcionando!");
});

// export para Vercel (serverless)
module.exports = app;
module.exports.handler = serverless(app);
