function setup() {
  const props = PropertiesService.getScriptProperties();

  const apiKey = props.getProperty(CONFIG.GEMINI_API_KEY_PROPERTY);
  if (!apiKey) {
    throw new Error('Set GEMINI_API_KEY in Project Settings → Script Properties before running setup.');
  }

  getOrCreateDriveFolder(CONFIG.DRIVE_FOLDER_NAME);

  let spreadsheet;
  const existingSheetId = props.getProperty(CONFIG.SHEET_ID_PROPERTY);
  if (existingSheetId) {
    spreadsheet = SpreadsheetApp.openById(existingSheetId);
  } else {
    spreadsheet = SpreadsheetApp.create(CONFIG.SHEET_NAME);
    initSheet(spreadsheet.getActiveSheet());
    props.setProperty(CONFIG.SHEET_ID_PROPERTY, spreadsheet.getId());
  }

  GmailApp.createLabel(CONFIG.PROCESSED_LABEL);

  ScriptApp.getProjectTriggers()
    .filter(t => t.getHandlerFunction() === 'processNewEmails')
    .forEach(t => ScriptApp.deleteTrigger(t));
  ScriptApp.newTrigger('processNewEmails')
    .timeBased()
    .everyHours(CONFIG.TRIGGER_INTERVAL_HOURS)
    .create();

  props.setProperty(CONFIG.LAST_PROCESSED_PROPERTY, new Date().getTime().toString());

  Logger.log('Setup complete.');
  Logger.log('Sheet: ' + spreadsheet.getUrl());
}

function processNewEmails() {
  const props = PropertiesService.getScriptProperties();
  const lastProcessed = parseInt(props.getProperty(CONFIG.LAST_PROCESSED_PROPERTY) || '0');
  const runStart = new Date().getTime();

  const t = () => ((new Date().getTime() - runStart) / 1000).toFixed(1) + 's';

  Logger.log('[' + t() + '] Searching Gmail...');
  const processedLabel = GmailApp.getUserLabelByName(CONFIG.PROCESSED_LABEL)
    || GmailApp.createLabel(CONFIG.PROCESSED_LABEL);
  const afterSeconds = lastProcessed > 0 ? Math.floor(lastProcessed / 1000) : Math.floor(runStart / 1000);
  const threads = GmailApp.search('has:attachment -label:' + CONFIG.PROCESSED_LABEL + ' after:' + afterSeconds);
  Logger.log('[' + t() + '] Found ' + threads.length + ' thread(s) to check.');

  let receiptsFound = 0;
  let attachmentsSkipped = 0;

  for (const thread of threads) {
    let threadTouched = false;

    for (const message of thread.getMessages()) {
      if (message.getDate().getTime() <= lastProcessed) continue;

      const attachments = message.getAttachments().filter(isReceiptMimeType);
      if (attachments.length === 0) continue;

      threadTouched = true;
      for (const attachment of attachments) {
        Logger.log('[' + t() + '] Analyzing "' + attachment.getName() + '" from "' + message.getSubject() + '"...');
        try {
          const wasReceipt = processAttachment(attachment, message);
          if (wasReceipt) {
            receiptsFound++;
            Logger.log('[' + t() + '] ✓ Receipt logged.');
          } else {
            attachmentsSkipped++;
            Logger.log('[' + t() + '] – Not a receipt, skipped.');
          }
        } catch (e) {
          Logger.log('[' + t() + '] Error: ' + e.message);
        }
      }
    }

    if (threadTouched) thread.addLabel(processedLabel);
  }

  Logger.log('[' + t() + '] Done. Receipts logged: ' + receiptsFound + ', skipped: ' + attachmentsSkipped + '.');
  props.setProperty(CONFIG.LAST_PROCESSED_PROPERTY, runStart.toString());
}

function debugReprocess() {
  const lookbackMs = CONFIG.DEBUG_LOOKBACK_HOURS * 60 * 60 * 1000;
  const since = new Date().getTime() - lookbackMs;

  const processedLabel = GmailApp.getUserLabelByName(CONFIG.PROCESSED_LABEL);
  if (processedLabel) {
    const labeled = GmailApp.search('label:' + CONFIG.PROCESSED_LABEL + ' newer_than:' + CONFIG.DEBUG_LOOKBACK_HOURS + 'h');
    labeled.forEach(t => t.removeLabel(processedLabel));
    Logger.log('Removed processed label from ' + labeled.length + ' thread(s).');
  }

  PropertiesService.getScriptProperties().setProperty(CONFIG.LAST_PROCESSED_PROPERTY, since.toString());
  Logger.log('Lookback window set to ' + CONFIG.DEBUG_LOOKBACK_HOURS + 'h. Running processNewEmails...');
  processNewEmails();
}

function isReceiptMimeType(attachment) {
  const mime = attachment.getContentType();
  return mime === 'application/pdf' || mime.startsWith('image/');
}

function processAttachment(attachment, message) {
  const analysis = analyzeReceipt(attachment, message.getSubject(), message.getPlainBody());
  if (analysis.is_deductible === false) return false;

  const emailDate = message.getDate().toISOString().substring(0, 10);
  const date = analysis.date || emailDate;
  const driveUrl = saveAttachmentToDrive(attachment, analysis.vendor, date);
  appendToLedger({
    date,
    vendor: analysis.vendor,
    amount: analysis.amount,
    category: analysis.category,
    legalBasis: analysis.legal_basis,
    deductiblePercentage: analysis.deductible_percentage,
    confidence: analysis.confidence,
    isDeductible: analysis.is_deductible,
    itemDescription: analysis.item_description,
    reason: analysis.reason,
    steuerberaterNote: analysis.steuerberater_note,
    driveUrl,
    emailSubject: message.getSubject(),
  });
  return true;
}
