# Ponto Tagger Test — Admin Guide

## Links

| Resource | URL |
|----------|-----|
| Candidate test | https://iv-ai.github.io/ponto-tagger-test/ |
| Results viewer | https://iv-ai.github.io/ponto-tagger-test/results.html |
| Admin panel | https://iv-ai.github.io/ponto-tagger-test/admin.html |
| GitHub repo | https://github.com/iv-ai/ponto-tagger-test |
| Apps Script | https://script.google.com/macros/s/AKfycbzLqCcIkx38nCnnqbm4ZMULzX0Q1SZSaRsMurHTAz5GuvA4Vx9RoNd2iDxar2LLDr4WkQ/exec |
| Tagger Guideline | https://docs.google.com/document/d/1jpt4PgX-0Yo_sU2m9X6-YY_41Zn8Fa9khp53dPNWw1k/edit?tab=t.0 |

Admin panel passphrase: `poiMaster`

---

## One-Time Setup (already done)

- GitHub repo created at `iv-ai/ponto-tagger-test`
- GitHub Pages enabled — test is live at the URL above
- Apps Script deployed and URL wired into the test page
- Google Sheet auto-created on first submission (tabs: `Submissions`, `Master`, `Places`)

---

## Setting the Answer Key

Do this once before sending the test to any candidates.

**Option A — Admin panel (recommended for editing):**
1. Go to the admin panel URL above, enter passphrase `poiMaster`
2. In the "Master Answer Key" section, set the tag for each item
3. Click **Save Answer Key**

**Option B — Via the test page:**
1. Go to the candidate test URL above
2. Click the guideline link and read it
3. Type `I have fully read the guidelines` in the confirmation field
4. Enter name: **`poiMaster`** (exact, case-sensitive)
5. Tag all 42 items and submit

Either method saves to the **Master** tab in the Google Sheet and scores all candidates automatically.

> To update the answer key: use Option A (admin panel) or repeat Option B — both overwrite the previous key.

---

## Sending the Test to Candidates

Send candidates this URL:
```
https://iv-ai.github.io/ponto-tagger-test/
```

Template email is in `ADMIN.txt`. Candidates need no account or login.

---

## Viewing Results

1. Go to the **results viewer URL** above
2. On first visit, paste the Apps Script URL and click **Load Results** (saved in browser after that)
3. Click **Refresh** anytime to pull latest submissions

What you'll see:
- **Green banner** — answer key is set; **Yellow** — not set yet
- **Candidate cards** — sorted by score (highest first), showing % correct and breakdown by tag type
- **Results table** — every item × every candidate; green = correct, red = wrong, yellow column = answer key
- **Thumbnail images** — click any image to expand full size
- **Export CSV** — downloads all answers and scores as a spreadsheet

---

## Scoring

- Each item is scored as correct (1) or incorrect (0) against the poiMaster answer key
- Score = correct items ÷ total items × 100%

The 5 tag options:

| Tag | Meaning |
|-----|---------|
| Ready | Output image is good to go |
| Needs Design Review | Needs a minor design edit |
| Regenerate | Needs to be regenerated |
| Needs New Input | Input image is unusable |
| Flag | Location is a skip category |

---

## Swapping Test Images

Images are stored **in the repo** (`images/` folder) and are permanently frozen — they do not pull from production. This ensures the test is unaffected when the production platform reprocesses those places.

**Every swap requires a code commit:**

1. Get the place ID from the production tool (`ponto-ui`)
2. Share the ID with the developer — they will:
   - Fetch both image URLs from the Ponto API
   - Download `input_{id}.jpg` and `output_{id}_{timestamp}.jpg` into `images/`
   - Update the matching `ITEMS` entry in `index.html` to use `images/` paths
   - Commit and push to GitHub
3. Live within ~30 seconds of the push

> **Rule:** Never point `inputLink` / `outputLink` at a live GCS or production URL. Always download first, commit the file, and use the local `images/` path.

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Start button stays disabled | Candidate must click the guideline link AND type the exact confirmation phrase |
| Submission fails silently | Check Apps Script deployment is set to "Anyone" access — Deploy → Manage deployments |
| Results viewer shows no data | Paste the Apps Script URL in the viewer and click Load Results |
| Answer key missing (yellow warning) | Use the admin panel to set the key, or submit the test as `poiMaster` |
| Images not loading | Images are served from GitHub Pages — check the `images/` folder has the files |
| Need to re-deploy Apps Script | Extensions → Apps Script → Deploy → Manage deployments → edit existing (do NOT create new — URL changes) |
