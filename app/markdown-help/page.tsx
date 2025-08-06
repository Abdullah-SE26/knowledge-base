// app/markdown-help/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { marked } from "marked";

const examples = [
  { feature: "Heading 1", syntax: "# Heading", example: "# My Title" },
  { feature: "Heading 2", syntax: "## Subheading", example: "## Section" },
  { feature: "Bold", syntax: "**bold**", example: "**bold**" },
  { feature: "Italic", syntax: "*italic*", example: "*italic*" },
  { feature: "Strikethrough", syntax: "~~strike~~", example: "~~deleted~~" },
  {
    feature: "Link",
    syntax: "[text](url)",
    example: "[Google](https://google.com)",
  },
  {
    feature: "Image",
    syntax: "![alt](url)",
    example: "![Logo](/publiclogo.png)",
  },
  { feature: "Blockquote", syntax: "> quote", example: "> Hello" },
  { feature: "List (Bullet)", syntax: "- item", example: "- One\n- Two" },
  {
    feature: "List (Numbered)",
    syntax: "1. item",
    example: "1. First\n2. Second",
  },
  { feature: "Divider", syntax: "---", example: "---" },
  {
    feature: "Task List",
    syntax: "- [ ] item",
    example: "- [ ] To Do\n- [x] Done",
  },
];

export default function MarkdownHelpPage() {
  const [examplesWithHtml, setExamplesWithHtml] = useState<
    { feature: string; syntax: string; example: string; html: string }[]
  >([]);

  useEffect(() => {
    const renderHtml = async () => {
      const rendered = await Promise.all(
        examples.map(async (ex) => ({
          ...ex,
          html: await marked.parse(ex.example),
        }))
      );
      setExamplesWithHtml(rendered);
    };

    renderHtml();
  }, []);

  return (
    <main className="max-w-3xl mx-auto px-6 py-12 prose prose-lg dark:prose-invert">
      {/* ... other static content ... */}

      <h2 className="mt-10 mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Markdown Syntax Cheat Sheet
      </h2>
      <table className="mb-10 w-full table-auto border-collapse border border-gray-300 dark:border-gray-700 text-left text-gray-900 dark:text-gray-100">
        <thead className="bg-gray-100 dark:bg-gray-800">
          <tr>
            <th className="border border-gray-300 dark:border-gray-700 px-4 py-2">
              Feature
            </th>
            <th className="border border-gray-300 dark:border-gray-700 px-4 py-2">
              Syntax
            </th>
            <th className="border border-gray-300 dark:border-gray-700 px-4 py-2">
              Example (Raw + Rendered)
            </th>
          </tr>
        </thead>
        <tbody>
          {examplesWithHtml.map(({ feature, syntax, example, html }, idx) => (
            <tr
              key={idx}
              className={
                idx % 2 === 0
                  ? "bg-white dark:bg-gray-900"
                  : "bg-gray-50 dark:bg-gray-800"
              }
            >
              <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 font-semibold">
                {feature}
              </td>
              <td className="border border-gray-300 dark:border-gray-700 px-4 py-2 font-mono text-sm whitespace-pre-wrap">
                {syntax}
              </td>
              <td className="border border-gray-300 dark:border-gray-700 px-4 py-2">
                <div className="flex flex-col gap-2">
                  <span className="block font-mono text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                    {example}
                  </span>
                  <div
                    className="prose dark:prose-invert max-w-full"
                    dangerouslySetInnerHTML={{ __html: html }}
                  />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h2 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-gray-100">
        Tips
      </h2>
      <ul className="mb-10 list-disc list-inside text-gray-800 dark:text-gray-300">
        <li>
          Use <span className="font-bold">Ctrl + /</span> or{" "}
          <span className="font-bold">Cmd + /</span> for keyboard shortcuts
        </li>
        <li>Click preview to see rendered output</li>
      </ul>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        For more examples, visit the{" "}
        <a
          href="https://www.markdownguide.org/cheat-sheet/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline dark:text-blue-400"
        >
          full Markdown Guide
        </a>
        .
      </p>
    </main>
  );
}
