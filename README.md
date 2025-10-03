
# Trademark Clearance Bot — MVP Scaffold (EUIPO + WIPO + CIPO wired)

This repository scaffold contains:

- **Web**: Next.js (static export) hosted on **Azure Static Web Apps (Free)**
- **API**: Azure **Functions** (HTTP) under `/api/*`
- **Integrations**:
  - **EUIPO** (Sandbox) — configurable via env vars
  - **WIPO** (Global Brand Database / IP API Catalog endpoints) — configurable via env vars
  - **CIPO (Canada)** — via **IP Horizons** datasets (no scraping); a loader to build a local index
- **Similarity**: exact + fuzzy (Levenshtein) + phonetic (Double‑Metaphone)
- **Excel export**: `.xlsx` attachment + optional **Resend** email
- **CI/CD**: GitHub Actions → Azure Static Web Apps

## Quick start

1) **Local dev**
```bash
# Front-end
cd web
npm install
npm run dev  # http://localhost:3000

# API (Functions)
cd ../api
npm install
npm start     # http://localhost:7071
```

If running front-end and API separately, set `NEXT_PUBLIC_API_BASE=http://localhost:7071/api` in `web/.env.local`.

2) **Deploy (GitHub Actions → Azure SWA)**
- Create an **Azure Static Web App (Free)** and connect to this repo, or use the included workflow.
- Required build paths (match workflow):
  - App location: `web`
  - API location: `api`
  - Output location: `out` (Next.js export)
- If adding the workflow manually, set repo secret: `AZURE_STATIC_WEB_APPS_API_TOKEN` (from Azure SWA **Deployment token**).

3) **Configure integrations** (set in Azure Function App settings or GitHub secrets)

**EUIPO**
```
EUIPO_CLIENT_ID=
EUIPO_CLIENT_SECRET=
EUIPO_TOKEN_URL=
EUIPO_TRADEMARK_SEARCH_URL=
EUIPO_HTTP_METHOD=GET
EUIPO_SUBSCRIPTION_HEADER=
EUIPO_SUBSCRIPTION_VALUE=
```

**WIPO**
```
WIPO_CLIENT_ID=
WIPO_CLIENT_SECRET=
WIPO_TOKEN_URL=
WIPO_SEARCH_URL=
WIPO_HTTP_METHOD=GET
WIPO_SUBSCRIPTION_HEADER=
WIPO_SUBSCRIPTION_VALUE=
WIPO_QUERY_PARAM=q
WIPO_QUERY_BODY_FIELD=query
```

**Email (Resend)**
```
RESEND_API_KEY=
```

**USPTO (optional enrichment)**
```
USPTO_TSDR_API_KEY=
```

4) **Canada (CIPO) index (no scraping)**
- Download the latest **Trademarks** CSV from **IP Horizons** (CIPO official datasets).
- Build the compact local index:
```bash
cd api
npm install
npm run load:ca /absolute/path/to/cipo_trademarks.csv
```
- This writes `api/data/ca-index.json`. Commit it (if small) or host it in blob storage and mount.

5) **Run a search**
- Open the app, enter the mark, leave default jurisdictions (**US, CA, EU, UK, WIPO**), hit **Run search**.
- The UI shows closest cards for **US, CA, EU** and provides a **Download Excel** button.

> **Compliance**: No scraping. Use documented APIs (EUIPO/WIPO) and official datasets (CIPO IP Horizons) only. Collect email with consent and minimal retention.

