function analyzeReceipt(attachment, subject, body) {
  const apiKey = PropertiesService.getScriptProperties().getProperty(CONFIG.GEMINI_API_KEY_PROPERTY);

  const prompt = `You are a German tax assistant. Analyze this purchase confirmation email and determine if the expense could be deductible under German tax law (EStG).

Consider all relevant deductibility categories:
- Werbungskosten (§9)
- Betriebsausgaben (§4)
- Sonderausgaben (§10)
- Außergewöhnliche Belastungen (§33)
- Haushaltsnahe Dienstleistungen (§35a Abs. 2)
- Handwerkerleistungen (§35a Abs. 3)
- Haushaltsnahe Beschäftigungsverhältnisse (§35a Abs. 1)
- Energetische Sanierung (§35c)
- Vermietungskosten (§9 i.V.m. §21)
- Vorwerbungskosten
- Kinderbetreuungskosten (§10 Abs. 1 Nr. 5)
- Ausbildungskosten (§9/§10)
- Spenden (§10b)
- AfA (§7)

Be generous — flag anything potentially deductible and let the Steuerberater decide.

Return ONLY valid JSON:
{
  "is_deductible": true | false | "possibly",
  "confidence": "high" | "medium" | "low",
  "category": "...",
  "legal_basis": "...",
  "deductible_percentage": 100,
  "item_description": "...",
  "amount": "...",
  "vendor": "...",
  "date": "YYYY-MM-DD from the invoice/receipt, or null if not found",
  "reason": "...",
  "steuerberater_note": "..."
}

Email subject: ${subject}
Email body (first 1000 chars): ${body.substring(0, 1000)}`;

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
