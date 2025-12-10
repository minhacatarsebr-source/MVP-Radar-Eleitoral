// ======= Derived endpoints to power Retool MVP =======
async function loadMentions(req) {
  try {
    const useLive = req.query.use_live === "1" || req.query.use_live === "true";
    if (useLive) {
      const base = process.env.BASE_URL || `https://${req.headers.host}`;
      const apiKey = req.query.api_key || req.header("api_key") || "";
      const url = `${base}/mentions?api_key=${encodeURIComponent(apiKey)}&limit=1000`;
      const r = await fetch(url);
      if (r.ok) {
        const json = await r.json();
        return Array.isArray(json) ? json : (json.data || json.mentions || []);
      }
    }
  } catch (err) {
    console.warn("loadMentions error:", err && err.message);
  }
  // fallback sample (minimal)
  return [
    { id: "m1", text: "Protesto em X", author:"user1", source:"Twitter", created_at: new Date(Date.now()-2*3600*1000).toISOString(), sentiment:"negative", score:-0.7, territory_id:"T1", keywords:["protesto","taxa"], engagement:15 },
    { id: "m2", text: "Deputado anuncia Y", author:"news1", source:"Facebook", created_at: new Date(Date.now()-26*3600*1000).toISOString(), sentiment:"positive", score:0.4, territory_id:"T2", keywords:["anúncio","projeto"], engagement:4 }
  ];
}

// -> /territories
app.get("/territories", async (req, res) => {
  const mentions = await loadMentions(req);
  const map = {};
  mentions.forEach(m => {
    const id = m.territory_id || "unknown";
    map[id] = map[id] || { id, name: id, count: 0 };
    map[id].count++;
  });
  res.json({ ok: true, total: Object.keys(map).length, data: Object.values(map) });
});

// -> /sentiment_aggregates?window=24h
app.get("/sentiment_aggregates", async (req, res) => {
  const mentions = await loadMentions(req);
  const window = req.query.window || "24h";
  const now = Date.now();
  const msWindow = window === "24h" ? 24*3600*1000 : window === "7d" ? 7*24*3600*1000 : 30*24*3600*1000;
  const filtered = mentions.filter(m => m.created_at && (now - new Date(m.created_at)) <= msWindow);
  const total = filtered.length;
  const counts = filtered.reduce((acc,m)=>{ acc[m.sentiment] = (acc[m.sentiment]||0)+1; return acc; }, {});
  const avg = filtered.reduce((s,m)=>s + (typeof m.score === "number" ? m.score : 0), 0) / (total||1);
  // timeseries: group by hour for 24h else by day
  const buckets = {};
  filtered.forEach(m=>{
    const d = new Date(m.created_at);
    const key = window==="24h" ? `${d.getUTCFullYear()}-${d.getUTCMonth()+1}-${d.getUTCDate()} ${d.getUTCHours()}:00` : d.toISOString().slice(0,10);
    buckets[key] = buckets[key] || { date:key, count:0, sum:0 };
    buckets[key].count++; buckets[key].sum += (typeof m.score==="number"?m.score:0);
  });
  const timeseries = Object.values(buckets).map(b=>({ date:b.date, count:b.count, avg_sentiment: +(b.sum/b.count||0).toFixed(3) }));
  res.json({ ok:true, total, sentiment_counts: counts, avg_sentiment: +avg.toFixed(3), timeseries });
});

// -> /narratives?limit=10
app.get("/narratives", async (req, res) => {
  const mentions = await loadMentions(req);
  const limit = parseInt(req.query.limit || "10");
  const kw = {};
  mentions.forEach(m=>{
    (m.keywords||[]).forEach(k=>{ const kk = String(k).toLowerCase(); kw[kk] = (kw[kk]||0)+1; });
    if(!m.keywords || !m.keywords.length){
      (String(m.text||"").toLowerCase().match(/\b[a-z0-9]{3,}\b/g)||[]).slice(0,5).forEach(w=>{ kw[w]=(kw[w]||0)+1; });
    }
  });
  const keywords = Object.entries(kw).map(([k,v])=>({ keyword:k, count:v })).sort((a,b)=>b.count-a.count).slice(0,limit);
  const narratives = keywords.slice(0,5).map((k,i)=>({
    id:`n${i+1}`, title:`Pauta: ${k.keyword}`, score:k.count,
    sample: mentions.filter(m=> (m.keywords||[]).map(x=>String(x).toLowerCase()).includes(k.keyword)).slice(0,3)
  }));
  res.json({ ok:true, data:{ keywords, narratives }});
});

// -> /alerts (derived)
app.get("/alerts", async (req, res) => {
  const mentions = await loadMentions(req);
  const now = Date.now();
  const h = 3600*1000;
  const lastHour = mentions.filter(m=> now - new Date(m.created_at) <= h);
  const prevHour = mentions.filter(m=> now - new Date(m.created_at) > h && now - new Date(m.created_at) <= 2*h);
  const alerts = [];
  if(prevHour.length && lastHour.length > prevHour.length * 1.8){
    alerts.push({ id:"a_spike", title:"Surto de menções", severity:"high", description:`Última hora: ${lastHour.length} / anterior: ${prevHour.length}`, triggered_at: new Date().toISOString() });
  }
  mentions.filter(m=> typeof m.score==="number" && m.score <= -0.7).slice(0,5).forEach((m,i)=> alerts.push({ id:`a_neg_${i}`, title:"Menção negativa", severity:"critical", description: (m.text||"").slice(0,140), mention_id:m.id, triggered_at:m.created_at }));
  res.json({ ok:true, total: alerts.length, data: alerts });
});

// -> POST /alerts (criar alert user)
app.post("/alerts", (req, res)=>{
  const body = req.body || {};
  if(!body.api_key) return res.status(401).json({ error:"Missing API key" });
  const id = "ua_"+Math.random().toString(36).slice(2,8);
  res.json({ ok:true, id, created_at:new Date().toISOString(), ...body });
});
