# ponto-tagger-test

Recruitment assessment for Ponto QA taggers. Candidates review 42 image pairs and classify each one; results are stored in Google Sheets and scored automatically against a master answer key.

**Live URLs:**
- Candidate test: https://iv-ai.github.io/ponto-tagger-test/
- Results viewer: https://iv-ai.github.io/ponto-tagger-test/results.html
- Admin panel: https://iv-ai.github.io/ponto-tagger-test/admin.html

---

## Repo structure

```
index.html          — candidate test (42 items, guideline gate, submission)
results.html        — admin results viewer (scores, table, CSV export)
admin.html          — admin panel (edit answer key, log place swaps)
images/             — frozen copies of all 84 test images (42 input + 42 output)
apps-script/
  Code.gs           — Google Apps Script backend (POST/GET web app)
ADMIN.md            — operational guide for admins (this repo)
ADMIN.txt           — plain-text version of the admin guide (for delegation)
CLAUDE.md           — context for AI-assisted maintenance (read this first)
README.md           — this file
```

---

## How it works

1. **Candidate** opens `index.html`, reads the guideline, enters their name, tags all 42 items, submits
2. **Submission** POSTs to a Google Apps Script web app → written to a Google Sheet (`Submissions` tab)
3. **Answer key** is set by submitting as `poiMaster` (or via `admin.html`) → written to `Master` tab
4. **Results viewer** (`results.html`) GETs from the same Apps Script → scores each candidate against the master key

Item order is randomized per session (Fisher-Yates shuffle) to prevent candidates copying each other.

---

## Images

All test images are stored in `images/` and served from GitHub Pages. They are **not** fetched from production at runtime. This is intentional — images on the production GCS bucket change as places get reprocessed.

Naming convention:
- `images/input_{place_id}.jpg` — input photo
- `images/output_{place_id}_{timestamp}.jpg` — generated output

When swapping a test place, the new images must be downloaded and committed to this folder before updating `index.html`. See `ADMIN.md` for the full process.

---

## Backend (Apps Script)

`apps-script/Code.gs` is deployed as a Google Apps Script web app. It handles:

| Method | Action | Description |
|--------|--------|-------------|
| POST | `saveMaster` | Overwrite the master answer key |
| POST | `updatePlace` | Log a place swap to the Places sheet |
| POST | *(default)* | Save a candidate submission |
| GET | — | Return `{ master, submissions, places }` |

The deployed URL is hardcoded in `index.html`, `results.html`, and `admin.html` as `APPS_SCRIPT_URL`.

**Important:** When updating `Code.gs`, always edit the *existing* deployment — do not create a new one. Creating a new deployment changes the URL, which would break all three pages.

---

## Making changes

See `CLAUDE.md` for AI-assisted maintenance instructions.

For operational tasks (sending to candidates, viewing results, swapping images), see `ADMIN.md`.
