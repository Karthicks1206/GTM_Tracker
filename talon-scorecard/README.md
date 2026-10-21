# Talon GTM Scorecard

A password-protected scorecard for Talon's go-to-market work. Upload the Excel tracker (or a CSV), and the site updates the outreach numbers, the funnel, the five north-star metrics and the contacts table.

## Deploy on Vercel

1. Push this folder to a GitHub repo (private recommended, since it will hold contact data once deployed).
2. In Vercel: **Add New → Project**, import the repo. Framework preset: Next.js. No build settings to change.
3. **Storage:** in the project, open **Storage → Create / Connect → Upstash (Redis)** from the Marketplace, free plan, and connect it to the project. This adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` automatically.
4. **Password:** **Settings → Environment Variables**, add `SITE_PASSWORD` with the team password (Production and Preview).
5. Redeploy (Deployments → ⋯ → Redeploy) so the new variables take effect.
6. Open the site, sign in, click **Download template**, fill it in, and drop it on the upload box.

## Run locally

```bash
npm install
echo "SITE_PASSWORD=test" > .env.local
npm run dev
```

Without Redis variables, local data lives in memory until the dev server restarts.

## How uploads work

- Accepts `.xlsx` (the template, sheets: Contacts, Weekly metrics, Activities) or `.csv` (one sheet; detected by its headers).
- Each sheet in the file **replaces** that part of the stored data. Sheets not in the file are kept.
- Rows whose first column starts with "Example" are ignored.
- Unknown status values are flagged as warnings after upload.

## Where to change things

- Targets, definitions and status lists: `lib/config.js`
- Column names the upload expects: `lib/sheets.js`
- Page layout: `app/page.js`; styles and colors: `app/globals.css` (font: IBM Plex Sans)
