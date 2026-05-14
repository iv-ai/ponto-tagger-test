# CLAUDE.md — Ponto Tagger Test

This file is for AI-assisted maintenance. Read it before making any changes to this repo.

**Maintenance rule:** After completing any change to this repo, update this file (CLAUDE.md) to reflect what changed — architecture, constants, file structure, known gotchas, etc. Also update ADMIN.md and ADMIN.txt if the operational process changed. The goal is that this file always describes the current state of the repo, not a past state.

---

## What this repo is

A static GitHub Pages site that hosts a QA tagger recruitment test for iv-ai.
Candidates review 42 image pairs and classify each one. Results go to Google Sheets via a serverless Apps Script backend. Admins score candidates against a master answer key.

No build step. No framework. Pure HTML + vanilla JS + Tailwind CDN.

---

## Architecture

```
GitHub Pages (static)
  index.html       — candidate test
  results.html     — results viewer (includes feedback link generator)
  admin.html       — admin panel (passphrase: poiMaster)
  feedback.html    — read-only shareable feedback page (no login needed)
  images/          — frozen test images (84 files, ~88MB)

Google Apps Script (serverless backend)
  apps-script/Code.gs  — deployed web app, handles POST + GET

Google Sheets (data store, auto-created)
  Submissions tab  — one row per candidate submission
  Master tab       — answer key (place_id → {tag, comment})
  Places tab       — log of place swaps
```

Apps Script URL (hardcoded in all three HTML files as `APPS_SCRIPT_URL`):
`https://script.google.com/macros/s/AKfycbzLqCcIkx38nCnnqbm4ZMULzX0Q1SZSaRsMurHTAz5GuvA4Vx9RoNd2iDxar2LLDr4WkQ/exec`

---

## Key constants in index.html

```js
const APPS_SCRIPT_URL = '...';          // Apps Script web app URL
const CONFIRM_PHRASE  = 'I have fully read the guidelines';
// ITEMS array — 42 entries, each with: id, name, address, inputLink, outputLink
// inputLink / outputLink must always be local: "images/input_{id}.jpg" etc.
```

---

## The ITEMS array

Located at line ~352 in `index.html`. Each entry:

```js
{
  id:         "uuid",
  name:       "Place Name",
  address:    "123 Main St, City, ST",
  inputLink:  "images/input_{id}.jpg",
  outputLink: "images/output_{id}_{timestamp}.jpg"
}
```

The array has three sections (marked with comments):
1. Regular QA cases (lines ~353–382) — 30 items
2. Needs New Input cases (lines ~384–390) — 7 items
3. Flag cases (lines ~392–396) — 5 items

Items are shuffled on every page load (Fisher-Yates, line ~436).

---

## Image rule — never break this

All images must be local files in `images/`. Never use GCS or production URLs directly.

Reason: production GCS paths change when places are reprocessed (the timestamp suffix changes).
Using local copies freezes the test permanently.

When swapping a place:
1. Fetch image URLs from Ponto API (needs a Bearer token — ask the user)
2. Download both images:
   ```bash
   curl -o "images/input_{id}.jpg" "{input_gcs_url}"
   curl -o "images/output_{id}_{timestamp}.jpg" "{output_gcs_url}"
   ```
3. Update the ITEMS entry in index.html:
   ```js
   inputLink:  "images/input_{id}.jpg",
   outputLink: "images/output_{id}_{timestamp}.jpg"
   ```
4. Commit both the images and the index.html change
5. Push — live within ~30 seconds

---

## Apps Script backend

`apps-script/Code.gs` — the source of truth. After editing:
- Go to the Apps Script project
- Paste updated Code.gs
- Deploy → Manage deployments → **Edit the existing deployment** (pencil icon) → Deploy
- Do NOT create a new deployment — the URL will change and break all pages

POST endpoint actions:
- `{ action: "saveMaster", items: [{place_id, tag, comment}] }` — overwrite master key
- `{ action: "updatePlace", place: {index, place_id, name, address, input_url, output_url} }` — log place swap
- `{ tester_name, submitted_at, items: [...] }` — candidate submission (default, no action field)
  - If `tester_name === "poiMaster"`, treated as master key (legacy path, same as saveMaster)

GET returns: `{ success: true, master: {...}, submissions: [...], places: [...] }`

---

## Ponto API

Used only when fetching data for new test places. Requires a short-lived Firebase JWT Bearer token (expires ~1 hour — ask the user for a fresh one).

```
Base URL: https://ponto-api-production-454568860704.us-west1.run.app
Auth: Authorization: Bearer {token}

Get place details:
GET /places/{place_id}

Response includes: name, address, inputImageUrl, outputImageUrl
```

GCS image base: `https://storage.googleapis.com/iv-ubermaps-genai-images/`

---

## Common tasks

### Add or swap a test place
1. Get place ID from user
2. Ask user for a fresh Bearer token
3. `curl -H "Authorization: Bearer {token}" https://ponto-api-production-.../places/{id}` — extract inputImageUrl, outputImageUrl
4. Download both images to `images/`
5. Update ITEMS entry in index.html
6. Commit + push

### Edit the answer key
- Via admin.html (passphrase: `poiMaster`) — no code change needed
- Or edit the Master tab in Google Sheets directly

### Update the Apps Script
1. Edit `apps-script/Code.gs`
2. Commit to repo (source of truth)
3. Manually paste into Apps Script editor and re-deploy existing deployment

### Change the confirmation phrase
Update `CONFIRM_PHRASE` in index.html (line ~415). Must match exactly what candidates type.

### Change the admin passphrase
Search for `poiMaster` in admin.html — it appears as the hardcoded passphrase check. Update it and update all references in ADMIN.txt / ADMIN.md.

---

## Feedback link system

`results.html` has a "Create Feedback Link" feature:
1. Admin checks candidates in the results viewer
2. A modal shows only items those candidates got wrong, with editable note fields pre-filled from master key comments
3. "Generate Link" base64-encodes the full payload (candidates, wrong items, correct answers, notes) into a `feedback.html#<base64>` URL
4. Admin copies and sends the URL — recipient opens `feedback.html` which decodes the hash and renders a read-only page

`feedback.html` is fully static — no server, no login. Everything is in the URL hash.
The payload structure:
```js
{
  candidates: [{ name, email }],
  items: [{
    place_id, place_name, address, input_url, output_url,
    correct,      // correct tag
    note,         // reviewer's explanation
    candidates: [{ name, tag, comment }]  // what each candidate answered
  }],
  generated_at: ISO string
}
```

---

## Things to watch out for

- **Apps Script CORS**: POST uses `mode: 'no-cors'` (response is unreadable but write succeeds). This is expected — don't "fix" it.
- **Item count**: The test has exactly 42 items. Scoring denominators and UI labels assume this. If you change the count, check results.html scoring logic.
- **poiMaster name**: Hardcoded in index.html submission handler, Code.gs, admin.html passphrase, and ADMIN docs. If renaming, update all five places.
- **GitHub Pages branch**: Deploys from `main` at `/`. Pushes go live within ~30 seconds.
- **Repo size**: `images/` is ~88MB. Keep in mind when adding more images.
- **Feedback link size**: URL hash grows with item count and note length. For 42 items with long notes it stays well under browser URL limits, but don't add binary data.
