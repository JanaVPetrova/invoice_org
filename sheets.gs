function initSheet(sheet) {
  const headers = [
    'Date', 'Amount', 'Category', 'Legal Basis',
    'Confidence', 'Is Deductible', 'Item Description', 'Reason',
    'Steuerberater Note', 'Receipt', 'Email', 'Processed At',
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(7, 300);
  sheet.setColumnWidth(8, 300);
  sheet.setColumnWidth(9, 350);
  sheet.setColumnWidth(10, 200);
}

function appendToLedger({ date, amount, category, legalBasis, confidence, isDeductible, itemDescription, reason, steuerberaterNote, driveUrl, emailUrl }) {
  const sheetId = PropertiesService.getScriptProperties().getProperty(CONFIG.SHEET_ID_PROPERTY);
  const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();

  sheet.appendRow([
    date,
    amount,
    category,
    legalBasis,
    confidence,
    isDeductible,
    itemDescription,
    reason,
    steuerberaterNote,
    driveUrl,
    emailUrl,
    new Date().toISOString(),
  ]);
}
