import { NextResponse } from "next/server";
import clientPromise from "@/lib/clientPromise";

type ArticlePayload = {
  title: string;
  subject: string;
  content: string;
};

type TranslateRequest = {
  articleId?: string;
  payload: ArticlePayload;
  targetLang: string;
};

const modelMap: Record<string, string> = {
  ar: "Helsinki-NLP/opus-mt-en-ar",
};

async function callHuggingFaceAPI(
  model: string,
  text: string,
  apiKey: string
): Promise<string> {
  const res = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ inputs: text }),
  });

  if (!res.ok) {
    throw new Error(`Hugging Face API error: ${await res.text()}`);
  }

  const data = await res.json();
  if (Array.isArray(data) && data[0]?.translation_text) {
    return data[0].translation_text;
  }
  throw new Error("Invalid translation response from Hugging Face");
}

// Protect URLs, markdown, and UI terms
function protectText(text: string): { protected: string; map: Record<string, string> } {
  const map: Record<string, string> = {};
  let counter = 0;

  // URLs
  text = text.replace(/https?:\/\/[^\s)]+/g, (match) => {
    const key = `[[URL_${counter++}]]`;
    map[key] = match;
    return key;
  });

  // Markdown bold/italic/headings
  text = text.replace(/(\*\*.*?\*\*)|(\*.*?\*)|(#+\s.*)/g, (match) => {
    const key = `[[MD_${counter++}]]`;
    map[key] = match;
    return key;
  });

  // Quoted button labels
  text = text.replace(/"([^"]+)"/g, (match) => {
    const key = `[[BTN_${counter++}]]`;
    map[key] = match;
    return key;
  });

  return { protected: text, map };
}

function restoreText(text: string, map: Record<string, string>): string {
  for (const key in map) {
    text = text.replace(new RegExp(key, "g"), map[key]);
  }
  return text;
}

// Fix common Arabic translation errors
function cleanArabic(text: string): string {
  return text
    .replace(/\bنقر\b/gi, "انقر")
    .replace(/\bTeket\b/gi, "تذكرة")
    .replace(/\bPrtinter\b/gi, "الطابعة")
    .replace(/\bموجز موجز\b/gi, "موجز");
}

// Split large text into safe chunks
function chunkContent(content: string, maxWords = 250): string[] {
  const paragraphs = content.split("\n").filter(Boolean);
  const chunks: string[] = [];
  let currentChunk = "";

  for (const para of paragraphs) {
    const currentWordCount = currentChunk.split(" ").length;
    const paraWordCount = para.split(" ").length;

    if (currentWordCount + paraWordCount > maxWords) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = para;
    } else {
      currentChunk += (currentChunk ? "\n" : "") + para;
    }
  }
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks;
}

export async function POST(req: Request) {
  try {
    const { articleId, payload, targetLang }: TranslateRequest = await req.json();

    if (!payload || !targetLang) {
      return NextResponse.json({ error: "Missing payload or targetLang" }, { status: 400 });
    }

    const modelName = modelMap[targetLang];
    if (!modelName) {
      return NextResponse.json({ error: "Unsupported target language" }, { status: 400 });
    }

    const hfApiKey = process.env.HUGGINGFACE_API_KEY;
    if (!hfApiKey) {
      return NextResponse.json({ error: "Hugging Face API key not configured" }, { status: 500 });
    }

    const client = await clientPromise;
    const db = client.db();
    const translationsCol = db.collection("translations");

    // Check cache
    if (articleId) {
      const cached = await translationsCol.findOne({ articleId, lang: targetLang });
      if (cached) {
        return NextResponse.json({ translation: cached });
      }
    }

    // Translate with formatting protection
    const protectAndTranslate = async (text: string) => {
      const { protected: safeText, map } = protectText(text);
      const translated = await callHuggingFaceAPI(modelName, safeText, hfApiKey);
      const restored = restoreText(translated, map);
      return cleanArabic(restored);
    };

    const translatedTitle = await protectAndTranslate(payload.title);
    const translatedSubject = await protectAndTranslate(payload.subject);

    const chunks = chunkContent(payload.content);
    const translatedChunks: string[] = [];
    for (const chunk of chunks) {
      translatedChunks.push(await protectAndTranslate(chunk));
    }
    const translatedContent = translatedChunks.join("\n\n");

    const translationDoc = {
      articleId: articleId || null,
      lang: targetLang,
      title: translatedTitle,
      subject: translatedSubject,
      content: translatedContent,
      provider: "huggingface-api",
      model: modelName,
      createdAt: new Date(),
    };

    if (articleId) {
      await translationsCol.updateOne(
        { articleId, lang: targetLang },
        { $set: translationDoc },
        { upsert: true }
      );
    }

    return NextResponse.json({ translation: translationDoc });
  } catch (error: any) {
    console.error("Translate API error:", error);
    return NextResponse.json({ error: error.message || "Translation failed" }, { status: 500 });
  }
}
