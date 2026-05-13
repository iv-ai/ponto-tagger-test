# Ponto Tagger Test — Admin Guide

## Links

| Resource | URL |
|----------|-----|
| Candidate test | https://iv-ai.github.io/ponto-tagger-test/ |
| Results viewer | https://iv-ai.github.io/ponto-tagger-test/results.html |
| GitHub repo | https://github.com/iv-ai/ponto-tagger-test |
| Apps Script | https://script.google.com/macros/s/AKfycbzLqCcIkx38nCnnqbm4ZMULzX0Q1SZSaRsMurHTAz5GuvA4Vx9RoNd2iDxar2LLDr4WkQ/exec |
| Tagger Guideline | https://docs.google.com/document/d/1jpt4PgX-0Yo_sU2m9X6-YY_41Zn8Fa9khp53dPNWw1k/edit?tab=t.0 |

---

## One-Time Setup (already done)

- GitHub repo created at `iv-ai/ponto-tagger-test`
- GitHub Pages enabled — test is live at the URL above
- Apps Script deployed and URL wired into the test page
- Google Sheet auto-created on first submission (tabs: `Submissions`, `Master`)

---

## Setting the Answer Key

Do this once before sending the test to any candidates.

1. Go to the **candidate test URL** above
2. Open the guideline link on the page and read it
3. Type `I have fully read the guidelines` in the confirmation field
4. Enter name: **`poiMaster`** (exact, case-sensitive)
5. Tag all 42 items
6. Submit

Your answers are saved to the **Master** tab in the Google Sheet and used to score all candidates automatically.

> To update the answer key, repeat the steps above — it overwrites the previous master.

---

## Sending the Test to Candidates

Send candidates this URL:
```
https://iv-ai.github.io/ponto-tagger-test/
```

Instructions to include in your message:
- Open the link
- Read the guideline document on the page before starting
- Enter their real name (not poiMaster)
- Tag all 42 items and submit
- No login required

---

## Viewing Results

1. Go to the **results viewer URL** above
2. Paste the Apps Script URL (already saved in your browser after first visit)
3. Click **Load Results** (or **Refresh** on return visits)

What you'll see:
- **Green banner** — answer key is set
- **Candidate cards** — sorted by score (highest first), showing % correct
- **Results table** — every item × every candidate, green = correct, red = wrong, with answer key column highlighted in yellow
- **Thumbnail images** — click any image to expand full size

---

## Scoring

- Each item is scored as correct (1) or incorrect (0) against the poiMaster answer key
- Score = correct items ÷ total items answered by poiMaster × 100%
- Candidates who left items untagged are scored only on the items they did tag (denominator = items poiMaster tagged)

---

## Updating the 42 Test Items

To swap in new place images:
1. Find the place ID from the production tool (`ponto-ui-production-...`)
2. Share the ID — the dev fetches both image URLs from the API and updates `index.html`
3. Push to GitHub — live within ~30 seconds

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Start button stays disabled | Candidate must click the guideline link AND type the exact phrase |
| Submission fails silently | Check the Apps Script deployment is set to "Anyone" access |
| Results viewer shows no data | Paste the Apps Script URL in the viewer and click Load Results |
| Answer key missing (yellow warning) | Submit as `poiMaster` first |
| Images not loading | GCS image URLs are public — check internet connection |
| Need to re-deploy Apps Script after code change | Extensions → Apps Script → Deploy → Manage deployments → edit existing deployment (don't create new — URL will change) |
