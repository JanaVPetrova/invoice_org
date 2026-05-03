function initSheet(sheet) {
  const headers = ['Date', 'Vendor', 'Amount', 'Currency', 'Category', 'Deduction Reason', 'Receipt', 'Email Subject', 'Processed At'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(6, 350);
  sheet.setColumnWidth(7, 200);
}

function appendToLedger({ date, vendor, amount, currency, category, deductionReason, driveUrl, emailSubject }) {
  const sheetId = PropertiesService.getScriptProperties().getProperty(CONFIG.SHEET_ID_PROPERTY);
  const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();

  sheet.appendRow([
    date,
    vendor,
    amount,
    currency,
    category,
    deductionReason,
    driveUrl,
    emailSubject,
    new Date().toISOString(),
  ]);
}
