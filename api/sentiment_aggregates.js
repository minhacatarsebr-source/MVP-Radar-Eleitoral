// api/sentiment_aggregates.js
module.exports = (req, res) => {
  const { api_key, entity = "all" } = req.query;
  if (!api_key) return res.status(401).json({ ok:false, error:"Missing API key" });

  // Exemplo de agregação por sentimento
  const now = new Date().toISOString();
  const data = {
    entity,
    timeframe: "24h",
    positive: 123,
    neutral: 456,
    negative: 78,
    generated_at: now
  };

  return res.json({ ok: true, endpoint: "sentiment_aggregates", data });
};
