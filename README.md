# ponto-tagger-test

Recruitment assessment for Ponto QA taggers. Candidates review 42 image pairs and classify each one; results are stored in Google Sheets and scored automatically against a master answer key.

---

## Quick links

| | URL |
|---|---|
| Candidate test | https://iv-ai.github.io/ponto-tagger-test/ |
| Results viewer (admin) | https://iv-ai.github.io/ponto-tagger-test/results.html |
| Admin panel (admin) | https://iv-ai.github.io/ponto-tagger-test/admin.html |
| Tagger guideline doc | https://docs.google.com/document/d/1jpt4PgX-0Yo_sU2m9X6-YY_41Zn8Fa9khp53dPNWw1k/edit?tab=t.0 |
| Production tagger tool | https://iv-poi-ui-production-454568860704.us-west1.run.app/login |
| Apps Script backend | https://script.google.com/macros/s/AKfycbzLqCcIkx38nCnnqbm4ZMULzX0Q1SZSaRsMurHTAz5GuvA4Vx9RoNd2iDxar2LLDr4WkQ/exec |
| Admin guide (plain text) | [ADMIN.txt](ADMIN.txt) |

Admin panel passphrase: `poiMaster`

---

## What this is

The production Ponto platform generates AI output images for retail locations. QA taggers review each image pair (input photo + AI-generated output) and decide what action is needed. This test replicates that workflow to screen candidates before onboarding.

The 42 test items are a fixed, frozen set — 30 standard QA cases, 7 "Needs New Input" cases, and 5 "Flag" cases — chosen to cover the full range of tagging decisions a real tagger would encounter.

---

## The 5 tag options

These match exactly what taggers use in the production tool:

| Tag | When to use |
|-----|-------------|
| **Ready** | Output looks good — different from input, natural, production-quality |
| **Needs Design Review** | Minor edit needed (missing signage, unnatural crop, etc.) |
| **Regenerate** | Bad AI output — artifacts, too similar to input, significant scene errors |
| **Needs New Input** | Input photo is unusable — food shot, person, interior, irrelevant image |
| **Flag** | Location is a skip category (see below) |

### Flag categories

Flag the location if it falls into any of these categories:

- **Cemetery** — memorial / burial ground
- **City Block** — multi-storey apartment buildings, office blocks, mixed-use buildings surrounded by streets
- **Cadastral** — land surveying / property mapping
- **Adult Entertainment** — adult toys, strip clubs, gambling houses
- **Event Spaces** — commercial event venues (banquet halls, convention centers)
- **Lottery Booth** — retail / gaming
- **Professional Place** — education (preschool–high school), governance, military; also dance studios, martial arts academies, acting schools, sports academies, libraries
- **Medical Center** — healthcare facilities (dentist, hospital, clinic)
- **Spiritual Center** — religious / worship sites
- **Residence** — houses, apartments, condos, townhouses
- **Auto Service** — automotive repairs, inspections, oil changes, maintenance
- **Banking & Finance** — banks, credit unions, ATMs, financial advisory offices
- **Building & Construction** — construction, architecture, civil engineering, building materials
- **Commercial Services** — non-retail business services: printing shops, photo/art studios, repair services, consulting, catering, logistics
- **Manufacture / Factory**
- **Pharmacy** — flag and leave comment "pharmacy"
- **Permanently or temporarily closed locations**
- **Vehicles as locations** — boat, bus, ship, van

When unsure, flag it and leave a comment explaining why.

---

## Repo structure

```
index.html          — candidate test (42 items, guideline gate, submission)
results.html        — admin results viewer (scores, table, detail drawer, CSV export)
admin.html          — admin panel (edit answer key, log place swaps)
images/             — frozen copies of all 84 test images (42 input + 42 output)
apps-script/
  Code.gs           — Google Apps Script backend (POST/GET web app)
ADMIN.txt           — full operational guide for non-technical admins
ADMIN.md            — same guide in markdown format
CLAUDE.md           — architecture + maintenance context for AI-assisted work
README.md           — this file
```

---

## How it works

1. **Candidate** opens `index.html`, clicks the guideline link, types the confirmation phrase, enters their name and Gmail, tags all 42 items, submits
2. **Submission** POSTs to the Apps Script web app → written to Google Sheet (`Submissions` tab)
3. **Answer key** is set via the admin panel or by submitting as `poiMaster` → written to `Master` tab
4. **Results viewer** GETs from the Apps Script → scores each candidate against the master key, shows per-item breakdown in a click-through detail drawer

Item order is randomized per session (Fisher-Yates shuffle) so candidates can't copy each other.

---

## Images

All test images are stored in `images/` and served from GitHub Pages. They are **never** fetched from production at runtime — this is intentional. GCS output image URLs change when the production platform reprocesses a place (the timestamp suffix changes), which would silently break the test.

Naming convention:
- `images/input_{place_id}.jpg` — input photo
- `images/output_{place_id}_{timestamp}.jpg` — AI-generated output

**When swapping a place:** download both images first, commit them to `images/`, then update `index.html`. Never point directly at a GCS URL. See `CLAUDE.md` for the full process.

---

## Backend (Apps Script)

`apps-script/Code.gs` is deployed as a Google Apps Script web app. It handles:

| Method | Action field | Description |
|--------|-------------|-------------|
| POST | `saveMaster` | Overwrite the master answer key |
| POST | `updatePlace` | Log a place swap to the Places sheet |
| POST | *(none)* | Save a candidate submission (includes `tester_email`) |
| GET | — | Return `{ master, submissions, places }` |

The deployed URL is hardcoded in `index.html`, `results.html`, and `admin.html` as `APPS_SCRIPT_URL`.

**When updating `Code.gs`:** always edit the *existing* deployment — never create a new one. A new deployment changes the URL and breaks all three pages.

---

## For developers / AI-assisted maintenance

See [`CLAUDE.md`](CLAUDE.md) — it has the full architecture, key constants, common task recipes, and things to watch out for.
