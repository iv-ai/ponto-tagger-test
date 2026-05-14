# ponto-tagger-test

Recruitment assessment and calibration test for Ponto QA taggers. Candidates and working taggers review 42 image pairs and classify each one. Results go to Google Sheets and are scored automatically against a master answer key.

---

## Quick links

| | URL |
|---|---|
| Candidate test | https://iv-ai.github.io/ponto-tagger-test/ |
| Tagger calibration test | https://iv-ai.github.io/ponto-tagger-test/?type=tagger |
| Interactive guideline | https://iv-ai.github.io/ponto-tagger-test/guideline.html |
| Results viewer (admin) | https://iv-ai.github.io/ponto-tagger-test/results.html |
| Admin panel (admin) | https://iv-ai.github.io/ponto-tagger-test/admin.html |
| Feedback page | https://iv-ai.github.io/ponto-tagger-test/feedback.html |
| Tagger guideline doc | https://docs.google.com/document/d/1jpt4PgX-0Yo_sU2m9X6-YY_41Zn8Fa9khp53dPNWw1k/edit?tab=t.0 |
| Production tagger tool | https://iv-poi-ui-production-454568860704.us-west1.run.app/login |
| Apps Script backend | https://script.google.com/macros/s/AKfycbzLqCcIkx38nCnnqbm4ZMULzX0Q1SZSaRsMurHTAz5GuvA4Vx9RoNd2iDxar2LLDr4WkQ/exec |
| Admin guide (Google Doc) | https://docs.google.com/document/d/1CsbKueMIG1ooZEdZtUMkMM4M24FkvWFvkaZkWyyh3ds/edit?tab=t.0 |

Admin panel passphrase: `poiMaster`

---

## What this is

The production Ponto platform generates AI output images for retail locations. QA taggers review each image pair (input photo + AI-generated output) and decide what action is needed. This repo serves two purposes:

1. **Candidate test** — screen new applicants before onboarding
2. **Tagger calibration** — periodically test working taggers for quality and alignment

The 42 test items are a fixed, frozen set chosen to cover the full range of tagging decisions a real tagger would encounter.

---

## Two test modes

### Candidate test
**URL:** `https://iv-ai.github.io/ponto-tagger-test/`

For new applicants. Enforces a 3-step onboarding flow before the test starts:
1. Open and read the guideline document
2. Complete the interactive guideline tutorial (7-question quiz must be passed)
3. Enter full name, Gmail address, and type the confirmation phrase

Submissions appear under **Candidates** in the results viewer. No score is shown to the candidate at the end.

### Tagger calibration test
**URL:** `https://iv-ai.github.io/ponto-tagger-test/?type=tagger`

For existing working taggers. No guideline gate — they already know the job. After submitting, taggers immediately see their own score and a full item-by-item breakdown showing what they got right, what they got wrong, and the correct answer with explanation.

Submissions appear under **Working Taggers** in the results viewer.

---

## The 5 tag options

| Tag | When to use |
|-----|-------------|
| **Ready** | Output looks good — different from input, natural, production-quality |
| **Needs Design Review** | Minor edit needed (missing signage, unnatural crop, etc.) |
| **Regenerate** | Bad AI output — artifacts, too similar to input, significant scene errors |
| **Needs New Input** | Input photo is unusable — food shot, person, interior, irrelevant image |
| **Flag** | Location is a skip category (see below) |

### Flag categories

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
index.html           — candidate + tagger test (?type=tagger for tagger mode)
guideline.html       — interactive guideline tutorial (standalone shareable page)
results.html         — admin results viewer (candidates + taggers, feedback links, CSV export)
admin.html           — admin panel (edit answer key with comments, log place swaps)
feedback.html        — read-only shareable feedback page (no login, data compressed in URL hash)
images/              — frozen copies of all 84 test images (42 input + 42 output)
guideline-images/    — 20 images used in the interactive guideline tutorial
apps-script/
  Code.gs            — Google Apps Script backend (POST/GET web app)
ADMIN.txt            — full operational guide for non-technical admins
ADMIN.md             — same guide in markdown format
CLAUDE.md            — architecture + maintenance context for AI-assisted work
README.md            — this file
```

---

## How it works

### Candidate flow
1. Candidate opens `index.html`
2. Clicks the guideline doc link (step 1 — unlocks step 2)
3. Completes the interactive tutorial at `guideline.html`, passes the 7-question quiz (step 2 — unlocks step 3)
4. Enters name, Gmail, types confirmation phrase (step 3)
5. Tags all 42 items, submits
6. Submission POSTs to Apps Script → written to Google Sheet (`Submissions` tab with `tester_type: "candidate"`)

### Tagger calibration flow
1. Tagger opens `index.html?type=tagger` — no guideline gate
2. Enters name and Gmail, starts immediately
3. Tags all 42 items, submits
4. After submission, immediately sees their score and full item-by-item answer breakdown
5. Submission POSTs to Apps Script → written to Google Sheet (`tester_type: "tagger"`)

### Answer key
- Set via the admin panel (`admin.html`) — scroll through all 42 items, click tags, add explanatory notes, save
- Or set by taking the test as `poiMaster` (exact, case-sensitive name)
- Stored in the `Master` tab in Google Sheets

### Results viewer
- GETs from the Apps Script → scores all submissions against the master key
- Shows two sections: **Candidates** and **Working Taggers**
- Click any card to see full per-item breakdown
- Select candidates → "Create Feedback Link" → edit notes → generate shareable link
- Export CSV downloads all answers and scores

### Feedback links
- Admin selects candidates, edits per-item notes, clicks "Generate Link"
- Payload is compressed (fflate) and encoded in the URL hash — no server needed
- `feedback.html` decompresses and renders a read-only page with score cards and wrong-answer breakdown
- Notes typed in the feedback modal are also saved back to the master key comments
- Links are permanent and self-contained (nothing stored server-side)

Item order is randomized per session (Fisher-Yates shuffle) so candidates can't copy each other.

---

## Images

All test images are stored in `images/` and served from GitHub Pages. They are **never** fetched from production at runtime — this is intentional. GCS output image URLs change when the production platform reprocesses a place (the timestamp suffix changes), which would silently break the test.

Naming convention:
- `images/input_{place_id}.jpg` — input photo
- `images/output_{place_id}_{timestamp}.jpg` — AI-generated output

**When swapping a place:** download both images first, commit them to `images/`, then update `index.html`. Never point directly at a GCS URL. See `CLAUDE.md` for the full process.

Guideline tutorial images are in `guideline-images/` (20 files, named `image1.png` – `image20.png`).

---

## Backend (Apps Script)

`apps-script/Code.gs` is deployed as a Google Apps Script web app. It handles:

| Method | Action field | Description |
|--------|-------------|-------------|
| POST | `saveMaster` | Overwrite the master answer key |
| POST | `saveFeedback` | Store a feedback payload by ID |
| POST | `updatePlace` | Log a place swap to the Places sheet |
| POST | *(none)* | Save a candidate or tagger submission |
| GET | — | Return `{ master, submissions, places }` |

Google Sheets tabs:
- `Submissions` — all submissions with columns: `tester_name`, `tester_email`, `tester_type`, `submitted_at`, then per-item columns
- `Master` — answer key: `place_id`, `tag`, `comment`
- `Places` — place swap log
- `Feedback` — stored feedback payloads for shareable links

The deployed URL is hardcoded in `index.html`, `results.html`, `admin.html`, and `feedback.html` as `APPS_SCRIPT_URL` / `DEFAULT_SCRIPT_URL`.

**When updating `Code.gs`:** always edit the *existing* deployment — never create a new one. A new deployment changes the URL and breaks all pages.

---

## For developers / AI-assisted maintenance

See [`CLAUDE.md`](CLAUDE.md) — full architecture, key constants, common task recipes, and things to watch out for.

---

## Admin guide

> **Delegating this to someone?** Share this link and ask them to read it fully before starting:
> https://docs.google.com/document/d/1CsbKueMIG1ooZEdZtUMkMM4M24FkvWFvkaZkWyyh3ds/edit?tab=t.0
> It covers all operational steps without requiring any technical knowledge.

```
PONTO TAGGER TEST — ADMIN GUIDE
================================
Last updated: May 2026

This guide covers everything needed to run the QA tagger test end-to-end.
After reading this, you should be able to operate it fully without any
technical help.

================================================================
SECTION 1 — IMPORTANT LINKS
================================================================

Candidate test (send this to new applicants):
  https://iv-ai.github.io/ponto-tagger-test/

Tagger calibration test (send this to working taggers):
  https://iv-ai.github.io/ponto-tagger-test/?type=tagger

Interactive guideline tutorial (can be shared standalone):
  https://iv-ai.github.io/ponto-tagger-test/guideline.html

Results viewer — see scores, details, feedback links (admin only):
  https://iv-ai.github.io/ponto-tagger-test/results.html

Admin panel — edit answer key, log place swaps (admin only):
  https://iv-ai.github.io/ponto-tagger-test/admin.html
  Passphrase: poiMaster

Tagger guideline document:
  https://docs.google.com/document/d/1jpt4PgX-0Yo_sU2m9X6-YY_41Zn8Fa9khp53dPNWw1k/edit?tab=t.0

GitHub repo (developers only):
  https://github.com/iv-ai/ponto-tagger-test

Apps Script backend (do not share — internal only):
  https://script.google.com/macros/s/AKfycbzLqCcIkx38nCnnqbm4ZMULzX0Q1SZSaRsMurHTAz5GuvA4Vx9RoNd2iDxar2LLDr4WkQ/exec


================================================================
SECTION 2 — THE TWO TEST LINKS
================================================================

There are two different test URLs — use the right one:

CANDIDATE TEST (new applicants):
  https://iv-ai.github.io/ponto-tagger-test/
  - Enforces a 3-step onboarding flow before the test begins
  - Step 1: Read the guideline document
  - Step 2: Complete the interactive tutorial and pass a 7-question quiz
  - Step 3: Enter name, Gmail, and type the confirmation phrase
  - No score shown at the end — results are for admin review only
  - Appears under "Candidates" in the results viewer

TAGGER CALIBRATION TEST (existing working taggers):
  https://iv-ai.github.io/ponto-tagger-test/?type=tagger
  - No guideline gate — taggers already know the job
  - Tagger sees their full score and answer breakdown immediately
    after submitting (correct answers, what they got wrong, explanations)
  - Appears under "Working Taggers" in the results viewer


================================================================
SECTION 3 — EMAIL BLURBS
================================================================

--- FOR NEW CANDIDATES ---

Subject: Ponto QA Tagger Assessment

Hi [Name],

Thank you for your interest in joining the Ponto QA tagging team!

As the next step, please complete a short image review assessment.
It should take around 30–60 minutes.

The test will guide you through the process step by step:
1. Read the tagger guideline document
2. Complete a short interactive tutorial
3. Tag 42 image pairs and submit

Test link:
https://iv-ai.github.io/ponto-tagger-test/

No login or account required. Let me know if you have any questions.

[Your name]

---

--- FOR WORKING TAGGERS ---

Subject: Ponto QA Calibration Test

Hi [Name],

We're running a quick calibration check for the tagging team.
It uses the same 42-item format you're familiar with — should
take about 20–30 minutes.

You'll see your score and a full breakdown of your answers right
after you submit, so it's also a useful self-check.

Test link:
https://iv-ai.github.io/ponto-tagger-test/?type=tagger

No login required. Thanks!

[Your name]

---


================================================================
SECTION 4 — BEFORE YOUR FIRST TEST: SET THE ANSWER KEY
================================================================

The answer key is what all submissions are scored against. Set it
once before sending the test to anyone. Update it anytime.

HOW TO SET IT (via admin panel):

1. Go to: https://iv-ai.github.io/ponto-tagger-test/admin.html

2. Enter passphrase: poiMaster

3. The data loads automatically. Scroll through all 42 items.

4. Click the correct tag for each item:
     Ready           — output looks good, production-quality
     Design Review   — minor edit needed (signage, crop, etc.)
     Regenerate      — bad AI output, too similar, or weird artifacts
     Needs New Input — source photo is unusable (food, person, etc.)
     Flag            — skip category (medical, bank, church, etc.)

5. Optionally add a note/explanation for each item in the text field.
   These notes appear in feedback links sent to candidates.

6. Click "Save Answer Key" at the top of the list.

ALTERNATIVE: Take the test yourself at the candidate URL, enter
name "poiMaster" (exact, case-sensitive), and submit. This skips
all steps and saves your answers as the master key.

To UPDATE the answer key: repeat either method above.
It always replaces the previous key completely.


================================================================
SECTION 5 — VIEWING RESULTS
================================================================

Go to: https://iv-ai.github.io/ponto-tagger-test/results.html

The page loads automatically using the saved Apps Script URL.
Click "Refresh" anytime to pull the latest submissions.

WHAT YOU'LL SEE:

  Status banner
    Green  = answer key is set and ready
    Yellow = answer key is missing (see Section 4)

  Summary stats
    Total submissions, average score, top score

  Candidates section
    Cards for each new applicant, sorted best score first
    Shows: name, Gmail, score %, correct/total, tag breakdown
    Click any card to open a full per-item detail view

  Working Taggers section
    Same cards but for calibration submissions
    Tagged with an indigo "Tagger" badge

  Candidate/Tagger detail drawer (opens on click)
    Every item with thumbnails, their tag, correct answer,
    and their comment. Use "Show wrong answers only" to focus.

  Full results table
    Every item × every submission in a grid
    Green = correct, Red = wrong, Yellow column = answer key

  Export CSV
    Downloads all answers, scores, and emails


================================================================
SECTION 6 — HOW SCORING WORKS
================================================================

Each of the 42 items is scored correct (1) or incorrect (0)
against the master answer key.

  Score = correct items / 42 × 100

For CANDIDATES: score is shown to admin only.
For TAGGERS: score is shown to the tagger immediately after
  submitting, with a full breakdown of each wrong answer.


================================================================
SECTION 7 — SHARING FEEDBACK WITH CANDIDATES
================================================================

After reviewing results, send individual candidates a personalized
feedback link showing what they got wrong and why.

HOW TO CREATE A FEEDBACK LINK:

1. Go to the results viewer:
   https://iv-ai.github.io/ponto-tagger-test/results.html

2. In the Candidates section, tick the checkbox on each card
   you want to include.

3. Click "Create Feedback Link" — a panel opens showing only
   items where at least one selected candidate got it wrong.

4. For each wrong item:
   - See the input and output images (click to enlarge)
   - See the correct answer and what each candidate tagged
   - Edit the note field (pre-filled from your answer key comments)

5. Click "Generate Link" — a short URL appears.

6. Copy and send it (email, Slack, etc.)

WHAT THE CANDIDATE SEES:
  - Their score card (% and correct/total)
  - Each wrong item with thumbnails, correct answer, their answer
  - Your note highlighted in a box
  No login required. Anyone with the link can open it.

NOTES:
  - Notes you type in the feedback modal are also saved back to the
    answer key automatically — you won't need to retype them next time
  - Links are permanent and self-contained (nothing stored on a server)
  - You can include multiple candidates in one link


================================================================
SECTION 8 — SWAPPING TEST IMAGES
================================================================

The 42 test images are frozen in the repo — they never change
unless a developer manually updates them.

To replace a test image:
1. Find the place ID in the production tool (ponto-ui)
2. Send the place ID to the developer
3. The developer downloads the new images and updates the test
4. Change goes live within ~30 seconds of their push

IMPORTANT: Images must be downloaded into the repo first.
Never link directly to production GCS URLs — they change over time
and will silently break the test.


================================================================
SECTION 9 — TROUBLESHOOTING
================================================================

Start button stays disabled
  -> Candidate must complete all 3 steps in order:
     1. Open the guideline document link
     2. Complete the interactive tutorial and pass the quiz
     3. Enter name, Gmail, and type exactly:
        I have fully read the guidelines

Tagger test button is grayed out / nothing happens
  -> Make sure you're using the tagger link with ?type=tagger
  -> There is no guideline gate — name and Gmail are enough

Submission fails or shows an error
  -> The Apps Script may need to be redeployed with "Anyone" access.
     Contact the developer.

Results viewer shows no data
  -> Click Refresh. If still empty, the Apps Script URL may have
     changed — contact the developer.

Answer key missing (yellow banner)
  -> See Section 4 to set the answer key.

Images not loading
  -> Images are on GitHub Pages. Contact the developer if a
     specific image is missing.

Feedback link shows "No feedback data found"
  -> Try generating the link again — older links (before May 2026)
     used a different format and may not work.

Need to change the answer key
  -> Admin panel → Save Answer Key (see Section 4).
     Can update individual answers or add notes at any time.
```
