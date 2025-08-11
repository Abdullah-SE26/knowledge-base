"use client";

import { useState } from "react";

type ArticlePayload = {
  title: string;
  subject: string;
  content: string;
};

type TranslateProps = {
  articleId?: string;
  original: ArticlePayload;
  onTranslate: (translated: ArticlePayload) => void;
};

export default function Translate({ articleId, original, onTranslate }: TranslateProps) {
  const [language, setLanguage] = useState("en");
  const [loading, setLoading] = useState(false);

  async function handleTranslate(lang: string) {
    if (lang === "en") {
      setLanguage("en");
      onTranslate(original);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          articleId,
          payload: original,
          targetLang: lang,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Translation failed");

      const translated: ArticlePayload = {
        title: data.translation.title,
        subject: data.translation.subject,
        content: data.translation.content,
      };

      setLanguage(lang);
      onTranslate(translated);
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={language}
        onChange={(e) => handleTranslate(e.target.value)}
        className="border rounded-md px-3 py-1 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 cursor-pointer shadow-sm"
      >
        <option value="en">English</option>
        <option value="ar">Arabic</option>
      </select>
      {loading && <span className="text-sm text-gray-500">Translating...</span>}
    </div>
  );
}
