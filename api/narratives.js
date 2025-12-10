// api/narratives.js
module.exports = (req, res) => {
  const { api_key, limit = 10 } = req.query;
  if (!api_key) return res.status(401).json({ ok:false, error:"Missing API key" });

  const items = Array.from({length: Number(limit)}, (_, i) => ({
    id: `narrative_${i+1}`,
    title: `Narrativa #${i+1}`,
    summary: `Resumo curto da narrativa ${i+1}`,
    created_at: new Date(Date.now() - i*86400000).toISOString()
  }));

  return res.json({ ok: true, endpoint: "narratives", count: items.length, items });
};
