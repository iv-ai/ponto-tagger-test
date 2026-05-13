// Ponto Tagger Test — Google Apps Script
// Deploy as: Web App → Execute as Me → Anyone can access
//
// After deploying, copy the Web App URL into index.html → APPS_SCRIPT_URL

const SHEET_NAME = 'Submissions';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Create sheet + header row on first run
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const headers = buildHeaders(payload.items.length);
      sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      sheet.getRange(1, 1, 1, headers.length)
        .setFontWeight('bold')
        .setBackground('#f1f5f9');
      sheet.setFrozenRows(1);
    }

    const row = buildRow(payload);
    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: 'ok' }))
    .setMimeType(ContentService.MimeType.JSON);
}

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
  const base = [
    payload.tester_name,
    payload.submitted_at,
  ];
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
