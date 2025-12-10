// api/alerts.js
module.exports = (req, res) => {
  const { api_key, limit = 20 } = req.query;
  if (!api_key) return res.status(401).json({ ok:false, error:"Missing API key" });

  const items = Array.from({length: Number(limit)}, (_, i) => ({
    id: `alert_${i+1}`,
    title: `Alerta de exemplo #${i+1}`,
    level: i % 3 === 0 ? "high" : "medium",
    created_at: new Date(Date.now() - i*600000).toISOString()
  }));

  return res.json({ ok: true, endpoint: "alerts", count: items.length, items });
};
