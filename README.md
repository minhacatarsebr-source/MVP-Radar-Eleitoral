# Supabase Proxy for Radar Eleitoral MVP

Lightweight Node/Express proxy that exposes a simple REST surface for Retool and other internal tools,
while keeping your Supabase `service_role` key securely on the server.

## Files
- server.js        : main express app
- package.json     : dependencies and scripts
- .env.example     : environment variables example

## Quick start (local)
1. Copy `.env.example` to `.env` and fill in values.
2. Install dependencies:
   ```
   npm install
   ```
3. Run locally:
   ```
   npm run dev
   ```
4. Test:
   ```
   curl -H "x-api-key: <PROXY_API_KEY>" http://localhost:3000/health
   ```

## Deploy on Vercel
1. Push this repo to GitHub.
2. Create a new Project on Vercel from the repo.
3. Set Environment Variables in Vercel dashboard:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - PROXY_API_KEY
   - CORS_ORIGINS
4. Deploy and use the provided URL as the base for the Retool REST resource.

## Usage (Retool)
Create a **REST API** resource on Retool:
  - Base URL: `https://<your-vercel-project>.vercel.app`
  - Header: `x-api-key: <PROXY_API_KEY>`
  - Example endpoints:
    - GET /mentions
    - POST /mentions
    - GET /alerts
    - POST /rpc/refresh_sentiment_aggregates
