function initSheet(sheet) {
  const headers = [
    'Date', 'Vendor', 'Amount', 'Category', 'Legal Basis', 'Deductible %',
    'Confidence', 'Is Deductible', 'Item Description', 'Reason',
    'Steuerberater Note', 'Receipt', 'Email Subject', 'Processed At',
  ];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]).setFontWeight('bold');
  sheet.setFrozenRows(1);
  sheet.setColumnWidth(9, 300);
  sheet.setColumnWidth(10, 300);
  sheet.setColumnWidth(11, 350);
  sheet.setColumnWidth(12, 200);
}

function appendToLedger({ date, vendor, amount, category, legalBasis, deductiblePercentage, confidence, isDeductible, itemDescription, reason, steuerberaterNote, driveUrl, emailSubject }) {
  const sheetId = PropertiesService.getScriptProperties().getProperty(CONFIG.SHEET_ID_PROPERTY);
  const sheet = SpreadsheetApp.openById(sheetId).getActiveSheet();

  sheet.appendRow([
    date,
    vendor,
    amount,
    category,
    legalBasis,
    deductiblePercentage,
    confidence,
    isDeductible,
    itemDescription,
    reason,
    steuerberaterNote,
    driveUrl,
    emailSubject,
    new Date().toISOString(),
  ]);
}
