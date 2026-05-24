// ═══════════════════════════════════════════════════════════════════════════
//  PLAYGROUND DESIGN CHALLENGE — Google Apps Script backend
//  Copy this entire file into your Google Apps Script editor, then deploy
//  as a Web App with access set to "Anyone, even anonymous".
//  See SETUP.md for full instructions.
// ═══════════════════════════════════════════════════════════════════════════

// Your sheet must have a tab named "Votes" with these columns:
//   A: ID  |  B: Name  |  C: Likes  |  D: Money

function doGet(e) {
  const params   = e.parameter;
  const action   = params.action   || 'all';
  const callback = params.callback || null;
  const id       = parseInt(params.id) || 0;

  let result;
  try {
    if      (action === 'all')    result = getAllVotes();
    else if (action === 'get')    result = getVotes(id);
    else if (action === 'like')   result = incrementLikes(id);
    else if (action === 'invest') result = incrementMoney(id);
    else                          result = { error: 'Unknown action: ' + action };
  } catch (err) {
    result = { error: err.message };
  }

  const json   = JSON.stringify(result);
  const body   = callback ? callback + '(' + json + ');' : json;
  const mime   = callback
    ? ContentService.MimeType.JAVASCRIPT
    : ContentService.MimeType.JSON;

  return ContentService.createTextOutput(body).setMimeType(mime);
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getSheet() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName('Votes');
}

function getAllVotes() {
  const sheet  = getSheet();
  const values = sheet.getDataRange().getValues();
  const results = [];
  for (let i = 1; i < values.length; i++) {   // row 0 = header
    const row = values[i];
    results.push({ id: row[0], name: row[1], likes: row[2], money: row[3] });
  }
  return results;
}

function getVotes(id) {
  const sheet  = getSheet();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == id) {
      const r = values[i];
      return { id: r[0], name: r[1], likes: r[2], money: r[3] };
    }
  }
  return { error: 'Design ' + id + ' not found' };
}

function incrementLikes(id) {
  const sheet  = getSheet();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == id) {
      const rowNum   = i + 1;                            // sheet rows are 1-indexed
      const likesCell = sheet.getRange(rowNum, 3);       // column C
      const moneyCell = sheet.getRange(rowNum, 4);       // column D
      likesCell.setValue(likesCell.getValue() + 1);
      return { id: id, name: values[i][1], likes: likesCell.getValue(), money: moneyCell.getValue() };
    }
  }
  return { error: 'Design ' + id + ' not found' };
}

function incrementMoney(id) {
  const sheet  = getSheet();
  const values = sheet.getDataRange().getValues();
  for (let i = 1; i < values.length; i++) {
    if (values[i][0] == id) {
      const rowNum    = i + 1;
      const likesCell  = sheet.getRange(rowNum, 3);
      const moneyCell  = sheet.getRange(rowNum, 4);      // column D
      moneyCell.setValue(moneyCell.getValue() + 100);
      return { id: id, name: values[i][1], likes: likesCell.getValue(), money: moneyCell.getValue() };
    }
  }
  return { error: 'Design ' + id + ' not found' };
}
