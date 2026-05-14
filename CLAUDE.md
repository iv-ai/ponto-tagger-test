# CLAUDE.md — Ponto Tagger Test

This file is for AI-assisted maintenance. Read it before making any changes to this repo.

**Maintenance rule:** After completing any change to this repo, update this file (CLAUDE.md) to reflect what changed — architecture, constants, file structure, known gotchas, etc. Also update README.md if the operational process changed. The goal is that this file always describes the current state of the repo, not a past state.

---

## What this repo is

A static GitHub Pages site that hosts a QA tagger recruitment test for iv-ai.
Candidates review 42 image pairs and classify each one. Results go to Google Sheets via a serverless Apps Script backend. Admins score candidates against a master answer key.

There are two test modes:
- **Candidate mode** (`index.html`) — requires completing a 3-step gate (read guideline doc → pass interactive tutorial → enter name/email/confirmation phrase) before taking the test
- **Tagger mode** (`index.html?type=tagger`) — skips the gate, reveals score + full answer breakdown immediately after submission, appears separately in results.html as "Working Taggers"

No build step. No framework. Pure HTML + vanilla JS + Tailwind CDN.

---

## Architecture

```
GitHub Pages (static)
  index.html            — test (candidate + tagger mode via ?type=tagger)
  results.html          — results viewer (admin, includes feedback link generator)
  admin.html            — admin panel (passphrase: poiMaster)
  feedback.html         — read-only shareable feedback page (no login needed)
  guideline.html        — standalone interactive tutorial / quiz (9 slides, 7-question quiz)
  guideline-images/     — 20 images used by guideline.html (copied from QA Guideline doc)
  images/               — frozen test images (84 files, ~88MB)

Google Apps Script (serverless backend)
  apps-script/Code.gs   — deployed web app, handles POST + GET

Google Sheets (data store, auto-created)
  Submissions tab   — one row per submission (candidate + tagger)
  Master tab        — answer key (place_id → {tag, comment})
  Places tab        — log of place swaps
  Feedback tab      — feedback payloads (id, created_at, payload JSON) — currently unused
```

Apps Script URL (hardcoded in all HTML files):
`https://script.google.com/macros/s/AKfycbzLqCcIkx38nCnnqbm4ZMULzX0Q1SZSaRsMurHTAz5GuvA4Vx9RoNd2iDxar2LLDr4WkQ/exec`

- In `admin.html` and `results.html`: stored in `localStorage` with key `ponto_script_url`, falls back to hardcoded `DEFAULT_SCRIPT_URL`
- In `index.html`: hardcoded as `APPS_SCRIPT_URL` constant

---

## Key constants in index.html

```js
const APPS_SCRIPT_URL = '...';
const CONFIRM_PHRASE  = 'I have fully read the guidelines';
const TESTER_TYPE     = (new URLSearchParams(location.search).get('type') === 'tagger')
                          ? 'tagger' : 'candidate';
// ITEMS array — 42 entries, each with: id, name, address, inputLink, outputLink
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

Three sections (marked with comments):
1. Regular QA cases (~30 items)
2. Needs New Input cases (~7 items)
3. Flag cases (~5 items)

Items are shuffled on every page load (Fisher-Yates).

---

## 3-step gate (candidate mode only)

`index.html` enforces a sequential gate before candidates can take the test. State is tracked in `sessionStorage`:

| Step | What it does | sessionStorage key |
|------|--------------|--------------------|
| 1 | Click "Open Guidelines" — opens the QA Google Doc | `docOpened = '1'` |
| 2 | Click "Start Interactive Tutorial" — goes to `guideline.html`, passes quiz | `guidelineComplete = '1'` |
| 3 | Enter name, valid email, and exact confirmation phrase | — |

- `poiMaster` bypasses all gate checks
- Tagger mode (`?type=tagger`) also bypasses the gate (session check is skipped)
- `updateSteps()` progressively unlocks each section and grays out locked ones with `opacity-40 pointer-events-none`
- `checkConfirmPhrase()` validates all three inputs before enabling "Start Test"

---

## guideline.html

Standalone 9-slide interactive guide + quiz. Can be shared as a standalone page or used as the mandatory gate.

Slides:
- Slide 0: Welcome
- Slides 1–6: Tutorial content with guideline-images (copied from QA Guideline 5_1_26)
- Slide 7: 7-question quiz
- Slide 8: Done / return to test

Quiz behavior:
- All 7 questions must be answered correctly to proceed
- Wrong answers show the correct answer highlighted green with explanation text
- Correct answers: `[1, 2, 1, 3, 2, 2, 0]` (index into options array for each question)
- On completion: sets `sessionStorage.setItem('guidelineComplete', '1')`, advances to slide 8
- `returnToTest()` redirects to `index.html`

Progress label shows `X / 7 correct`.

---

## Image rule — never break this

All images must be local files in `images/`. Never use GCS or production URLs directly.

Reason: production GCS paths change when places are reprocessed (the timestamp suffix changes). Using local copies freezes the test permanently.

When swapping a place:
1. Fetch image URLs from Ponto API (needs a Bearer token — ask the user)
2. Download both images:
   ```bash
   curl -o "images/input_{id}.jpg" "{input_gcs_url}"
   curl -o "images/output_{id}_{timestamp}.jpg" "{output_gcs_url}"
   ```
3. Update the ITEMS entry in index.html
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

| Action field | Payload | Effect |
|---|---|---|
| `"saveMaster"` | `{ items: [{place_id, tag, comment}] }` | Overwrite Master tab |
| `"updatePlace"` | `{ place: {index, place_id, name, address, input_url, output_url} }` | Log place swap to Places tab |
| `"saveFeedback"` | `{ id, data: {...} }` | Store feedback payload in Feedback tab (currently unused — feedback uses fflate hash) |
| _(none)_ | `{ tester_name, tester_email, tester_type, submitted_at, items: [...] }` | Candidate or tagger submission |

GET returns: `{ success: true, master: {...}, submissions: [...], places: [...] }`
GET `?id=XXXX` returns: `{ success: true, feedback: <payload> }`

Sheets auto-migration: if an existing Submissions sheet is missing `tester_email` or `tester_type` columns, Code.gs inserts them and backfills defaults on the next write.

---

## Submission payload schema

```js
{
  tester_name:   "string",
  tester_email:  "string",
  tester_type:   "candidate" | "tagger",
  submitted_at:  "ISO string",
  items: [{
    place_id, place_name, address, input_url, output_url, tag, comment
  }]
}
```

`tester_type` drives separation in results.html:
- `"candidate"` → appears in Candidates section
- `"tagger"` → appears in Working Taggers section

---

## Tagger mode (index.html?type=tagger)

- `TESTER_TYPE` is set to `'tagger'` when `?type=tagger` is in the URL
- Gate steps 1–3 are skipped entirely
- After submission: fetches master key from Apps Script GET, computes score, renders `screen-tagger-results` with per-item breakdown (correct = green, wrong = red + shows correct answer)
- Score card: `X / 42 correct (Y%)`
- In results.html: tagger submissions render in a separate "Working Taggers" section with an indigo "Tagger" badge

---

## Feedback link system

`results.html` has a "Create Feedback Link" feature:
1. Admin checks candidates in the results viewer
2. A modal shows wrong items with editable note fields pre-filled from master key comments
3. "Generate Link" compresses the full payload with **fflate (deflate, level 9)** into a URL-safe base64 string and appends it as `feedback.html#<compressed>`
4. Admin copies and sends the URL — recipient opens `feedback.html` which decompresses and renders

`feedback.html` is fully static — no server, no login. Everything is in the URL hash.

**fflate CDN**: `https://cdn.jsdelivr.net/npm/fflate@0.8.2/umd/index.js` (loaded in both results.html and feedback.html)

Compression/decompression:
```js
// Compress (results.html)
const compressed = fflate.deflateSync(fflate.strToU8(json), { level: 9 });
const encoded = btoa(String.fromCharCode(...compressed))
  .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

// Decompress (feedback.html) — with old-format fallback
const b64 = hash.replace(/-/g, '+').replace(/_/g, '/');
const binary = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
const json = fflate.strFromU8(fflate.inflateSync(binary));
// fallback: JSON.parse(decodeURIComponent(escape(atob(hash))))
```

Feedback payload structure:
```js
{
  candidates: [{ name, email, correct, total }],
  items: [{
    place_id, place_name, address, input_url, output_url,
    correct,      // correct tag
    note,         // reviewer's explanation
    candidates: [{ name, tag, comment }]
  }],
  generated_at: "ISO string"
}
```

Score cards in feedback.html: green ≥80%, yellow ≥60%, red <60%.

---

## Ponto API

Used only when fetching data for new test places. Requires a short-lived Firebase JWT Bearer token (expires ~1 hour — ask the user for a fresh one).

```
Base URL: https://ponto-api-production-454568860704.us-west1.run.app
Auth: Authorization: Bearer {token}

GET /places/{place_id}
Response includes: name, address, inputImageUrl, outputImageUrl
```

GCS image base: `https://storage.googleapis.com/iv-ubermaps-genai-images/`

---

## Common tasks

### Add or swap a test place
1. Get place ID from user
2. Ask user for a fresh Bearer token
3. Fetch place details from Ponto API
4. Download both images to `images/`
5. Update ITEMS entry in index.html
6. Commit + push

### Edit the answer key
- Via admin.html (passphrase: `poiMaster`) — no code change needed
- Or edit the Master tab in Google Sheets directly

### Update the Apps Script
1. Edit `apps-script/Code.gs`
2. Commit to repo (source of truth)
3. Manually paste into Apps Script editor and re-deploy **existing** deployment

### Change the confirmation phrase
Update `CONFIRM_PHRASE` in index.html. Must match exactly what candidates type.

### Change the admin passphrase
Search for `poiMaster` in admin.html — hardcoded passphrase check. Update it and update README.md.

### Update quiz questions / answers
Edit `guideline.html` — `correctAnswers` array and `questions` array are near the bottom of the `<script>` block.

---

## Things to watch out for

- **Apps Script CORS**: POST uses `mode: 'no-cors'` (response is unreadable but write succeeds). This is expected — don't "fix" it. Don't add response parsing to POST calls.
- **Apps Script re-deployment**: Code.gs changes do nothing until the existing deployment is updated (pencil icon in Manage Deployments). Creating a new deployment changes the URL and breaks all pages.
- **Feedback link compression**: fflate is loaded from CDN. If CDN is unavailable, feedback links can't be generated or decoded. Consider bundling if reliability becomes an issue.
- **Item count**: The test has exactly 42 items. Scoring denominators and UI labels assume this. If you change the count, check results.html scoring logic and guideline.html if it references 42.
- **poiMaster name**: Hardcoded in index.html (gate bypass + submission handler), Code.gs, admin.html (passphrase), and README.md. If renaming, update all places.
- **GitHub Pages branch**: Deploys from `main` at `/`. Pushes go live within ~30 seconds.
- **Repo size**: `images/` is ~88MB. Keep in mind when adding more images.
- **sessionStorage scope**: `guidelineComplete` and `docOpened` are per-session (cleared on tab close). Candidates must complete the gate in a single session.
- **Feedback sheet tab**: `saveFeedback` in Code.gs writes to a Feedback tab, but the current feedback system doesn't use it (fflate hash approach). The tab and handler exist for future use.
- **tagger_type column migration**: If an existing sheet predates the `tester_type` column, Code.gs auto-inserts it on next write and backfills `'candidate'`. This only runs once.
