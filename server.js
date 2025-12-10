// server.js
require('dotenv').config();
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');

const app = express();
app.use(express.json());

// CORS: adjust the origin as needed
const allowedOrigins = (process.env.CORS_ORIGINS || "").split(',').map(s => s.trim()).filter(Boolean);
const corsOptions = {
  origin: function(origin, callback) {
    if(!origin) return callback(null, true); // allow server-to-server / curl
    if(allowedOrigins.length === 0) return callback(null, true);
    if(allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    } else {
      return callback(new Error('Not allowed by CORS'));
    }
  }
};
app.use(cors(corsOptions));

// Env vars (required)
const SUPABASE_URL = process.env.SUPABASE_URL; // e.g. https://xxxxx.supabase.co
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY; // service_role key
const PROXY_API_KEY = process.env.PROXY_API_KEY; // key clients must send
if(!SUPABASE_URL || !SERVICE_ROLE || !PROXY_API_KEY) {
  console.error("Missing required env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, PROXY_API_KEY");
  process.exit(1);
}

// helper: require api key
function requireApiKey(req, res, next) {
  const key = req.get('x-api-key') || req.query.api_key;
  if(!key || key !== PROXY_API_KEY) {
    return res.status(401).json({ error: "Unauthorized - missing or invalid x-api-key" });
  }
  next();
}

// helper: supabase REST call
async function restRequest(method, path, body, qs) {
  const url = new URL(`${SUPABASE_URL}/rest/v1/${path}`);
  if(qs && Object.keys(qs).length) {
    Object.keys(qs).forEach(k => url.searchParams.set(k, qs[k]));
  }
  const opts = {
    method,
    headers: {
      "apikey": SERVICE_ROLE,
      "Authorization": `Bearer ${SERVICE_ROLE}`,
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  };
  const r = await fetch(url.toString(), opts);
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch(e) { json = text; }
  if(!r.ok) throw { status: r.status, body: json };
  return json;
}

// endpoint health
app.get('/health', (req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ---------------------------
// MENTIONS: GET recent & POST insert (bulk)
app.get('/mentions', requireApiKey, async (req, res) => {
  try {
    const limit = req.query.limit || 200;
    const since = req.query.since;
    let qs = { select: '*', order: 'collected_at.desc', limit: String(limit) };
    if(since) qs['collected_at'] = `gte.${since}`;
    const data = await restRequest('GET', `mentions`, null, qs);
    res.json(data);
  } catch(err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.body || String(err) });
  }
});

app.post('/mentions', requireApiKey, async (req, res) => {
  try {
    let rows = Array.isArray(req.body) ? req.body : [req.body];
    const out = await restRequest('POST', 'mentions', rows);
    res.status(201).json(out);
  } catch(err) {
    console.error(err);
    res.status(err.status || 500).json({ error: err.body || String(err) });
  }
});

// ---------------------------
// ALERTS: GET open alerts, POST new alert
app.get('/alerts', requireApiKey, async (req, res) => {
  try {
    const data = await restRequest('GET', 'alerts', null, { select: '*', order: 'created_at.desc', limit: req.query.limit || 200 });
    res.json(data);
  } catch(err) {
    res.status(err.status || 500).json({ error: err.body || String(err) });
  }
});

app.post('/alerts', requireApiKey, async (req, res) => {
  try {
    const payload = Array.isArray(req.body) ? req.body : [req.body];
    const out = await restRequest('POST', 'alerts', payload);
    res.status(201).json(out);
  } catch(err) {
    res.status(err.status || 500).json({ error: err.body || String(err) });
  }
});

// ---------------------------
// Recommendations proxy
app.get('/recommendations', requireApiKey, async (req, res) => {
  try {
    const data = await restRequest('GET', 'recommendations', null, { select: '*', order: 'created_at.desc', limit: req.query.limit || 200 });
    res.json(data);
  } catch(err) {
    res.status(err.status || 500).json({ error: err.body || String(err) });
  }
});

// ---------------------------
// call RPCs (e.g., refresh_sentiment_aggregates)
app.post('/rpc/:fn', requireApiKey, async (req, res) => {
  try {
    const fn = req.params.fn;
    const url = `${SUPABASE_URL}/rpc/${fn}`;
    const r = await fetch(url, {
      method: 'POST',
      headers: {
        "apikey": SERVICE_ROLE,
        "Authorization": `Bearer ${SERVICE_ROLE}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(req.body || {})
    });
    const text = await r.text();
    let json;
    try { json = JSON.parse(text); } catch(e) { json = text; }
    if(!r.ok) return res.status(r.status).json({ error: json });
    return res.json(json);
  } catch(err) {
    res.status(err.status || 500).json({ error: err.body || String(err) });
  }
});

// ---------------------------
// simple proxy for arbitrary read queries (GET /table?select=...)
app.get('/table/:table', requireApiKey, async (req, res) => {
  try {
    const t = req.params.table;
    const allowed = ['mentions','alerts','territories','narratives','recommendations','sentiment_aggregates','users','sources','ingest_jobs'];
    if(!allowed.includes(t)) return res.status(403).json({ error: "table not allowed" });
    const qs = {};
    Object.keys(req.query).forEach(k => qs[k] = req.query[k]);
    const data = await restRequest('GET', t, null, qs);
    res.json(data);
  } catch(err) {
    res.status(err.status || 500).json({ error: err.body || String(err) });
  }
});

// ---------------------------
const PORT = parseInt(process.env.PORT || '3000', 10);
app.listen(PORT, () => console.log(`Proxy listening on port ${PORT}`));
