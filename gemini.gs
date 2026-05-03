function analyzeReceipt(attachment, subject, body) {
  const apiKey = PropertiesService.getScriptProperties().getProperty(CONFIG.GEMINI_API_KEY_PROPERTY);

  const prompt = `You are a German tax assistant. Analyze this attachment and email context to determine if it is a tax-deductible receipt or invoice.

Respond with ONLY a raw JSON object — no markdown, no code fences, no explanation.

{
  "isReceipt": boolean,
  "vendor": "vendor/company name, or null",
  "amount": number (net or gross, whichever is on the document), or null,
  "currency": "ISO 4217 currency code, e.g. EUR",
  "date": "YYYY-MM-DD, or null if not found",
  "category": "one of: software, hardware, office_supplies, travel, food_entertainment, phone_internet, education, professional_services, other",
  "deductionReason": "one sentence explaining why this is deductible under German tax law (Betriebsausgaben/Werbungskosten), or null if not deductible"
}

Email subject: ${subject}
Email body (first 600 chars): ${body.substring(0, 600)}`;

  const payload = {
    contents: [{
      parts: [
        { text: prompt },
        {
          inline_data: {
            mime_type: attachment.getContentType(),
            data: Utilities.base64Encode(attachment.getBytes()),
          },
        },
      ],
    }],
    generationConfig: {
      temperature: 0,
    },
  };

  const response = UrlFetchApp.fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${CONFIG.GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: 'post',
      contentType: 'application/json',
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    }
  );

  if (response.getResponseCode() !== 200) {
    throw new Error('Gemini API error ' + response.getResponseCode() + ': ' + response.getContentText());
  }

  const raw = JSON.parse(response.getContentText());
  const text = raw.candidates[0].content.parts[0].text.trim();

  return JSON.parse(text);
}
