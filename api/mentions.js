// api/mentions.js
module.exports = (req, res) => {
  const { api_key, limit = 20 } = req.query;

  if (!api_key) {
    return res.status(401).json({ ok:false, error: "Missing API key" });
  }

  // Exemplo: dados estáticos de teste
  const items = Array.from({length: Number(limit)}, (_, i) => ({
    id: `mention_${i+1}`,
    text: `Exemplo de menção #${i+1}`,
    source: "twitter",
    created_at: new Date(Date.now() - i*3600*1000).toISOString()
  }));

  return res.json({ ok: true, endpoint: "mentions", count: items.length, items });
};
