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

---

## Admin guide

```
PONTO TAGGER TEST — ADMIN GUIDE
================================
Last updated: May 2026

This guide covers everything needed to run the QA tagger recruitment test
end-to-end. After reading this, you should be able to operate it fully
without any technical help.

================================================================
SECTION 1 — IMPORTANT LINKS
================================================================

Candidate test (send this to applicants):
  https://iv-ai.github.io/ponto-tagger-test/

Results viewer — see all submissions and scores (admin only):
  https://iv-ai.github.io/ponto-tagger-test/results.html

Admin panel — edit answer key, log place swaps (admin only):
  https://iv-ai.github.io/ponto-tagger-test/admin.html
  Passphrase: poiMaster

Tagger guideline document (candidates read this before the test):
  https://docs.google.com/document/d/1jpt4PgX-0Yo_sU2m9X6-YY_41Zn8Fa9khp53dPNWw1k/edit?tab=t.0

GitHub repo (for developers only — do not modify unless instructed):
  https://github.com/iv-ai/ponto-tagger-test

Apps Script backend (do not share — internal use only):
  https://script.google.com/macros/s/AKfycbzLqCcIkx38nCnnqbm4ZMULzX0Q1SZSaRsMurHTAz5GuvA4Vx9RoNd2iDxar2LLDr4WkQ/exec


================================================================
SECTION 2 — EMAIL BLURB (copy-paste to send to each candidate)
================================================================

Subject: Ponto QA Tagger Assessment

Hi [Name],

Thank you for your interest in joining the Ponto QA tagging team!

As the next step, we'd like you to complete a short image review
assessment. It should take around 30–60 minutes.

Before you start, please read the guideline document carefully —
the test will ask you to confirm you've read it before you can begin.

Test link:
https://iv-ai.github.io/ponto-tagger-test/

Instructions:
- Open the link above
- Click the guideline link on the page and read it in full
- Type the confirmation phrase when prompted
- Enter your full name and the Gmail address you'd use for the tool
- Review all 42 image pairs and tag each one
- Submit when done — no login or account required

Let me know if you have any questions. Good luck!

[Your name]

----------------------------------------------------------------


================================================================
SECTION 3 — BEFORE YOUR FIRST CANDIDATE: SET THE ANSWER KEY
================================================================

The answer key is what all candidates are scored against. You only
need to set it once. Update it anytime by repeating these steps.

HOW TO SET IT (via admin panel — easiest):

1. Go to the admin panel:
   https://iv-ai.github.io/ponto-tagger-test/admin.html

2. Enter passphrase: poiMaster

3. Paste the Apps Script URL (from Section 1) and click "Load"

4. Scroll through all 42 items in the "Master Answer Key" section.
   Click the correct tag for each one:
     Ready              — output looks good, production-quality
     Design Review      — minor edit needed (signage, crop, etc.)
     Regenerate         — bad AI output, artifacts, too similar to input
     Needs New Input    — source photo is unusable (food, person, etc.)
     Flag               — skip category (cemetery, bank, office building, etc.)

5. Click "Save Answer Key" — the sticky button at the top of the list.

That's it. All future candidate submissions will be scored against
these answers automatically.

ALTERNATIVE: You can also set the answer key by taking the test yourself.
Go to the candidate test link, enter name "poiMaster" (exact, case-sensitive),
tag all 42 items, and submit.

To UPDATE the answer key later: repeat either method above.
It always overwrites the previous key.


================================================================
SECTION 4 — SENDING THE TEST TO A CANDIDATE
================================================================

1. Copy the email blurb from Section 2
2. Fill in the candidate's name
3. Send

That's all. Candidates do not need an account, login, or any setup.
They just open the link.

Each candidate will be asked to enter:
- Their full name
- Their Gmail address (the one they would use to access the tool)

Both are stored with their results so you can identify them easily.


================================================================
SECTION 5 — VIEWING RESULTS
================================================================

1. Go to the results viewer:
   https://iv-ai.github.io/ponto-tagger-test/results.html

2. On your first visit, paste the Apps Script URL (from Section 1)
   and click "Load Results". It saves in your browser — you won't
   need to paste it again on return visits.

3. Click "Refresh" anytime to pull the latest submissions.

WHAT YOU'LL SEE:

  Status banner
    Green = answer key is set and ready
    Yellow = answer key is not set yet (go to Section 3)

  Summary stats
    Total submissions, average score, top score

  Candidate cards (one per submission, sorted best score first)
    Shows: name, Gmail, score %, correct/total, tag breakdown
    Click any card to open the full detail view for that candidate

  Candidate detail (opens when you click a card)
    Shows every item with:
      - Input and output thumbnails (click to enlarge)
      - The tag they chose
      - The correct answer (shown in red rows when wrong)
      - Any comment they left
    Use "Show wrong answers only" to focus on mistakes

  Full results table
    Every item x every candidate in a grid
    Green cell = correct, Red cell = wrong, Yellow column = answer key
    Click any thumbnail to enlarge

  Export CSV
    Downloads all answers, scores, and emails as a spreadsheet


================================================================
SECTION 6 — HOW SCORING WORKS
================================================================

Each of the 42 items is scored as correct (1) or incorrect (0)
against the poiMaster answer key.

  Score = correct items / 42 x 100

The 5 tag options:

  Ready              — output image is good to go
  Needs Design Review — output needs a minor design edit
  Regenerate         — output needs to be regenerated from scratch
  Needs New Input    — input photo is unusable (not a storefront)
  Flag               — location is a skip category (non-consumer POI)


================================================================
SECTION 7 — SWAPPING TEST IMAGES
================================================================

The test uses 42 fixed image pairs stored in the repo. They are
frozen — they never change unless a developer manually updates them.

If you need to replace a test image with a better example:

1. Find the place ID in the production tool (ponto-ui)
2. Send the place ID to the developer
3. The developer will download the new images and update the test
4. The change goes live within ~30 seconds of their push

IMPORTANT: Do not try to link images directly from the production
tool. They must be downloaded and stored in the repo first, or they
may disappear when the platform reprocesses that place.


================================================================
SECTION 8 — TROUBLESHOOTING
================================================================

Start button stays disabled after typing the phrase
  -> Candidate must ALSO click the guideline link to open it,
     AND enter both their name AND Gmail before the button activates.
  -> Make sure the phrase is typed exactly:
     I have fully read the guidelines

Submission fails or shows an error
  -> The Apps Script may need to be redeployed with "Anyone" access.
     Contact the developer.

Results viewer shows no data after loading
  -> Make sure the Apps Script URL is pasted correctly — no extra
     spaces at the start or end.
  -> Try clicking Refresh.

Answer key missing (yellow banner in results viewer)
  -> Go to Section 3 and set the answer key before reviewing candidates.

Images not loading in the test or results
  -> Images are hosted on GitHub Pages. If a specific image is
     missing, contact the developer — a file may not have been committed.

Need to change the answer key
  -> Go to the admin panel and use "Save Answer Key" (see Section 3).
     You can update individual answers at any time.

Need to add a new test image
  -> See Section 7. Always goes through the developer.
```
