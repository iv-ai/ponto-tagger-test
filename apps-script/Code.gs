// Ponto Tagger Test — Google Apps Script
// Deploy as: Web App → Execute as Me → Anyone can access
//
// POST actions (sent as JSON with an "action" field):
//   action: "submit"        — candidate submission (or poiMaster answer key)
//   action: "saveMaster"    — admin overwrites master key answers
//   action: "updatePlace"   — admin swaps a place entry in the Places sheet
//   action: "saveFeedback"  — store a feedback payload, returns { id }
//
// GET  — returns { master, submissions, places }
// GET ?id=XXXX — returns { feedback: <payload> }

const SHEET_NAME          = 'Submissions';
const MASTER_SHEET_NAME   = 'Master';
const PLACES_SHEET_NAME   = 'Places';
const FEEDBACK_SHEET_NAME = 'Feedback';

// ─── ROUTER ──────────────────────────────────────────────────────────────────

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    if (payload.action === 'saveMaster') {
      saveMaster(ss, payload.items);
      return ok({ saved: true });
    }

    if (payload.action === 'updatePlace') {
      updatePlace(ss, payload.place);
      return ok({ saved: true });
    }

    if (payload.action === 'saveFeedback') {
      saveFeedback(ss, payload.id, payload.data);
      return ok({ saved: true });
    }

    // Default: candidate submission
    if (payload.tester_name === 'poiMaster') {
      saveMaster(ss, payload.items.map(i => ({ place_id: i.place_id, tag: i.tag, comment: i.comment })));
      return ok({ master: true });
    }

    saveSubmission(ss, payload);
    return ok({ submitted: true });

  } catch (err) {
    return error(err.message);
  }
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();

    // ?id=XXXX — return a single feedback payload
    if (e.parameter && e.parameter.id) {
      const data = getFeedback(ss, e.parameter.id);
      if (!data) return error('Feedback not found');
      return ok({ feedback: data });
    }

    return ok({
      master:      getMaster(ss),
      submissions: getSubmissions(ss),
      places:      getPlaces(ss),
    });
  } catch (err) {
    return error(err.message);
  }
}

// ─── MASTER ──────────────────────────────────────────────────────────────────

function saveMaster(ss, items) {
  let sheet = ss.getSheetByName(MASTER_SHEET_NAME);
  if (!sheet) sheet = ss.insertSheet(MASTER_SHEET_NAME);
  else sheet.clearContents();

  sheet.getRange(1, 1, 1, 3).setValues([['place_id', 'tag', 'comment']]);
  sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#fef9c3');
  sheet.setFrozenRows(1);

  if (items.length) {
    sheet.getRange(2, 1, items.length, 3).setValues(
      items.map(i => [i.place_id || '', i.tag || '', i.comment || ''])
    );
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

// ─── FEEDBACK STORAGE ────────────────────────────────────────────────────────

function saveFeedback(ss, id, data) {
  let sheet = ss.getSheetByName(FEEDBACK_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(FEEDBACK_SHEET_NAME);
    sheet.getRange(1, 1, 1, 3).setValues([['id', 'created_at', 'payload']]);
    sheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#f1f5f9');
    sheet.setFrozenRows(1);
  }

  sheet.appendRow([id, new Date().toISOString(), JSON.stringify(data)]);
  return id;
}

function getFeedback(ss, id) {
  const sheet = ss.getSheetByName(FEEDBACK_SHEET_NAME);
  if (!sheet) return null;
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) return JSON.parse(data[i][2]);
  }
  return null;
}

// ─── PLACES ──────────────────────────────────────────────────────────────────

function updatePlace(ss, place) {
  let sheet = ss.getSheetByName(PLACES_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(PLACES_SHEET_NAME);
    sheet.getRange(1, 1, 1, 6).setValues([['index', 'place_id', 'name', 'address', 'input_url', 'output_url']]);
    sheet.getRange(1, 1, 1, 6).setFontWeight('bold').setBackground('#f1f5f9');
    sheet.setFrozenRows(1);
  }

  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == place.index || data[i][1] === place.place_id) {
      sheet.getRange(i + 1, 1, 1, 6).setValues([[
        place.index, place.place_id, place.name, place.address, place.input_url, place.output_url
      ]]);
      return;
    }
  }
  sheet.appendRow([place.index, place.place_id, place.name, place.address, place.input_url, place.output_url]);
}

function getPlaces(ss) {
  const sheet = ss.getSheetByName(PLACES_SHEET_NAME);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  return data.slice(1).map(row => ({
    index:      row[0],
    place_id:   row[1],
    name:       row[2],
    address:    row[3],
    input_url:  row[4],
    output_url: row[5],
  }));
}

// ─── SUBMISSIONS ─────────────────────────────────────────────────────────────

function saveSubmission(ss, payload) {
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    const headers = buildHeaders(payload.items.length);
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f1f5f9');
    sheet.setFrozenRows(1);
  } else {
    // Migrate: insert tester_email column after tester_name if missing
    const headerRow = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    if (!headerRow.includes('tester_email')) {
      const nameCol = headerRow.indexOf('tester_name') + 1; // 1-based
      sheet.insertColumnAfter(nameCol);
      sheet.getRange(1, nameCol + 1).setValue('tester_email').setFontWeight('bold').setBackground('#f1f5f9');
      const lastRow = sheet.getLastRow();
      if (lastRow > 1) {
        sheet.getRange(2, nameCol + 1, lastRow - 1, 1).setValue('');
      }
    }
  }
  sheet.appendRow(buildRow(payload));
}

function getSubmissions(ss) {
  const sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0];
  return data.slice(1)
    .filter(row => {
      const name = row[headers.indexOf('tester_name')];
      return name && name !== '' && name !== 'poiMaster';
    })
    .map(row => {
      const obj = {};
      headers.forEach((h, i) => { obj[h] = row[i]; });
      const items = [];
      let i = 1;
      while (obj['item_' + i + '_place_id'] !== undefined) {
        items.push({
          index:      i,
          place_id:   obj['item_' + i + '_place_id'],
          place_name: obj['item_' + i + '_place_name'],
          address:    obj['item_' + i + '_address'],
          input_url:  obj['item_' + i + '_input_url'],
          output_url: obj['item_' + i + '_output_url'],
          tag:        obj['item_' + i + '_tag'],
          comment:    obj['item_' + i + '_comment'],
        });
        i++;
      }
      return { tester_name: obj.tester_name, tester_email: obj.tester_email || '', submitted_at: obj.submitted_at, items };
    });
}

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function buildHeaders(itemCount) {
  const base = ['tester_name', 'tester_email', 'submitted_at'];
  const cols = [];
  for (let i = 1; i <= itemCount; i++) {
    cols.push(`item_${i}_place_id`, `item_${i}_place_name`, `item_${i}_address`,
              `item_${i}_input_url`, `item_${i}_output_url`, `item_${i}_tag`, `item_${i}_comment`);
  }
  return [...base, ...cols];
}

function buildRow(payload) {
  const base = [payload.tester_name, payload.tester_email || '', payload.submitted_at];
  const cols = [];
  payload.items.forEach(item => {
    cols.push(item.place_id||'', item.place_name||'', item.address||'',
              item.input_url||'', item.output_url||'', item.tag||'', item.comment||'');
  });
  return [...base, ...cols];
}

function ok(data) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, ...data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function error(msg) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}
