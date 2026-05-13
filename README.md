# Ponto Tagger Test

Recruitment test for QA taggers. Candidates tag 30 sample images; results go to a Google Sheet; you review in `results.html`.

## URLs (after GitHub Pages is enabled)

| Page | URL |
|------|-----|
| Candidate test | `https://iv-ai.github.io/ponto-tagger-test/` |
| Results viewer | `https://iv-ai.github.io/ponto-tagger-test/results.html` |

---

## Setup

### 1. Add real images to `index.html`

Open `index.html` and find the `ITEMS` array near the top of the `<script>` block. Replace `inputLink` and `outputLink` for each of the 30 items with real image URLs from your dataset.

### 2. Set up Google Apps Script

1. Go to [script.google.com](https://script.google.com) → **New project**
2. Paste the contents of `apps-script/Code.gs`
3. Click **Deploy → New deployment → Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
4. Copy the Web App URL
5. In `index.html`, replace `YOUR_APPS_SCRIPT_URL_HERE` with the URL

### 3. Enable GitHub Pages

In the repo settings → Pages → Source: `main` branch, `/ (root)` folder → Save.

The test will be live at `https://iv-ai.github.io/ponto-tagger-test/`.

---

## Viewing Results

Open `results.html` and use **Load from Sheet**. To get the Sheet JSON URL:

1. Open the Google Sheet that the Apps Script writes to
2. File → Share → Publish to web → Sheet: `Submissions`, Format: `JSON` → Publish
3. Paste the published URL into the results viewer

You can also paste raw JSON directly into the results viewer for quick testing.

---

## Adding Ground Truth (optional)

To score candidates automatically, add a `groundTruth` object to `index.html`:

```js
const GROUND_TRUTH = {
  item_001: 'ready',
  item_002: 'regenerate',
  // ...
};
```

The results viewer will highlight correct/incorrect answers per candidate.
