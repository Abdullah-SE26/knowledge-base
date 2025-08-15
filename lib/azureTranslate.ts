
const endpoint = process.env.AZURE_TRANSLATOR_ENDPOINT;
const subscriptionKey = process.env.AZURE_TRANSLATOR_KEY;
const region = process.env.AZURE_TRANSLATOR_REGION;

if (!endpoint || !subscriptionKey || !region) {
  throw new Error(
    "Azure Translator environment variables are not properly set. " +
      "Make sure AZURE_TRANSLATOR_ENDPOINT, AZURE_TRANSLATOR_KEY, and AZURE_TRANSLATOR_REGION are defined."
  );
}

interface TranslationResponse {
  translations: { text: string; to: string }[];
}

async function translateTextBatch(
  texts: string[],
  toLanguage = "ar"
): Promise<string[]> {
  const url = `${endpoint}/translate?api-version=3.0&to=${toLanguage}`;

  const body = texts.map((text) => ({ text }));


  const headers = new Headers({
    "Ocp-Apim-Subscription-Key": subscriptionKey!,
    "Ocp-Apim-Subscription-Region": region!,
    "Content-Type": "application/json",
  });

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Azure Translation API error: ${response.status} ${errorText}`
    );
  }

const data: TranslationResponse[] = await response.json();
console.log("Azure response:", JSON.stringify(data, null, 2));

// Defensive check and error if missing translations
for (let i = 0; i < data.length; i++) {
  if (!data[i].translations || data[i].translations.length === 0) {
    throw new Error(`Missing translations for input index ${i}`);
  }
}

return data.map((item) => item.translations[0].text);

}

export async function translateArticleFields(
  title: string,
  subject: string,
  content: string
): Promise<{ title_ar: string; subject_ar: string; content_ar: string }> {
  try {
    const [title_ar, subject_ar, content_ar] = await translateTextBatch([
      title,
      subject,
      content,
    ]);
    return { title_ar, subject_ar, content_ar };
  } catch (err) {
    console.error("Azure translation error:", err);
    throw err;
  }
}
