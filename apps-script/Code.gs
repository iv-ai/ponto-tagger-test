// Ponto Tagger Test — Google Apps Script
// Deploy as: Web App → Execute as Me → Anyone can access
//
// After deploying, copy the Web App URL into index.html → APPS_SCRIPT_URL
//
// Special rule: if tester_name === 'poiMaster', the submission is saved to
// the "Master" sheet and used as the answer key for scoring all other submissions.

const SHEET_NAME = 'Submissions';
const MASTER_SHEET_NAME = 'Master';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (payload.tester_name === 'poiMaster') {
      saveMaster(ss, payload);
      return ContentService
        .createTextOutput(JSON.stringify({ success: true, master: true }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    saveSubmission(ss, payload);
    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// GET /  →  returns all submissions + master answer key as JSON
// Used by results.html to load live data
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const result = {
      master: getMaster(ss),
      submissions: getSubmissions(ss),
    };
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ─── MASTER ──────────────────────────────────────────────────────────────────

function saveMaster(ss, payload) {
  let sheet = ss.getSheetByName(MASTER_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(MASTER_SHEET_NAME);
  } else {
    sheet.clearContents();
  }
  // Store as two columns: place_id, tag
  sheet.getRange(1, 1, 1, 3).setValues([['place_id', 'tag', 'comment']]);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#fef9c3');
  sheet.setFrozenRows(1);

  const rows = payload.items.map(item => [
    item.place_id || '',
    item.tag || '',
    item.comment || '',
  ]);
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, 3).setValues(rows);
  }
}

function getMaster(ss) {
  const sheet = ss.getSheetByName(MASTER_SHEET_NAME);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return null;
  const master = {};
  for (let i = 1; i < data.length; i++) {
    master[data[i][0]] = { tag: data[i][1], comment: data[i][2] };
  }
  return master;
}

// ─── SUBMISSIONS ─────────────────────────────────────────────────────────────

function saveSubmission(ss, payload) {
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = buildHeaders(payload.items.length);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length)
      .setFontWeight('bold')
      .setBackground('#f1f5f9');
    sheet.setFrozenRows(1);
  }
  sheet.appendRow(buildRow(payload));
}

function getSubmissions(ss) {
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];

  const headers = data[0];
  return data.slice(1).map(row => {
    const obj = {};
    headers.forEach((h, i) => { obj[h] = row[i]; });

    // Reconstruct items array from flat columns
    const items = [];
    let i = 1;
    while (obj['item_' + i + '_place_id'] !== undefined) {
      items.push({
        index: i,
        place_id: obj['item_' + i + '_place_id'],
        place_name: obj['item_' + i + '_place_name'],
        address: obj['item_' + i + '_address'],
        input_url: obj['item_' + i + '_input_url'],
        output_url: obj['item_' + i + '_output_url'],
        tag: obj['item_' + i + '_tag'],
        comment: obj['item_' + i + '_comment'],
      });
      i++;
    }
    return {
      tester_name: obj.tester_name,
      submitted_at: obj.submitted_at,
      items,
    };
  });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function buildHeaders(itemCount) {
  const base = ['tester_name', 'submitted_at'];
  const itemCols = [];
  for (let i = 1; i <= itemCount; i++) {
    itemCols.push(
      `item_${i}_place_id`,
      `item_${i}_place_name`,
      `item_${i}_address`,
      `item_${i}_input_url`,
      `item_${i}_output_url`,
      `item_${i}_tag`,
      `item_${i}_comment`
    );
  }
  return [...base, ...itemCols];
}

function buildRow(payload) {
  const base = [payload.tester_name, payload.submitted_at];
  const itemCols = [];
  payload.items.forEach(item => {
    itemCols.push(
      item.place_id || '',
      item.place_name || '',
      item.address || '',
      item.input_url || '',
      item.output_url || '',
      item.tag || '',
      item.comment || ''
    );
  });
  return [...base, ...itemCols];
}
