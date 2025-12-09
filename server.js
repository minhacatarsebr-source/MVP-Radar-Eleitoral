import express from "express";
const app = express();

// rota funcional agora
app.get("/mentions", (req, res) => {
  const { api_key, limit } = req.query;

  if (!api_key) {
    return res.status(401).json({ error: "Missing API key" });
  }

  res.json({
    ok: true,
    endpoint: "mentions",
    limit: Number(limit) || 20,
    time: new Date().toISOString()
  });
});

// export para Vercel
export default app;
