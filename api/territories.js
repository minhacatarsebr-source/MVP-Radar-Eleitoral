// api/territories.js
module.exports = (req, res) => {
  const { api_key } = req.query;
  if (!api_key) return res.status(401).json({ ok:false, error:"Missing API key" });

  const items = [
    { id: "terr_1", name: "Território A", lat: -23.55, lon: -46.63, population_est: 1000000 },
    { id: "terr_2", name: "Território B", lat: -22.90, lon: -43.17, population_est: 500000 }
  ];

  return res.json({ ok: true, endpoint: "territories", count: items.length, items });
};
