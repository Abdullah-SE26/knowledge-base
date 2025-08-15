"use client";
import React from "react";

interface VerifyRequestPageProps {
  userEmail?: string; // Pass the logged-in email if available
}

export default function VerifyRequestPage({ userEmail }: VerifyRequestPageProps) {
  // Function to detect provider URL based on email domain
  const getInboxUrl = (email?: string) => {
    if (!email) return "https://mail.google.com"; // fallback

    const domain = email.split("@")[1].toLowerCase();
    switch (domain) {
      case "gmail.com":
        return "https://mail.google.com/mail/u/0/#inbox";
      case "outlook.com":
      case "hotmail.com":
      case "live.com":
      case "msn.com":
        return "https://outlook.office.com/mail/inbox";
      case "yahoo.com":
      case "ymail.com":
      case "rocketmail.com":
        return "https://mail.yahoo.com";
      default:
        return "https://mail.google.com"; // fallback
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 text-center bg-gray-50 dark:bg-gray-900">
      <div className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-10 max-w-lg w-full">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">📩 Check your email</h2>
        <p className="text-gray-700 dark:text-gray-200 mb-6">
          A sign-in link has been sent to your email. Click the button below to open your inbox and verify your identity. 
          <br />
          <span className="font-semibold">Don’t see an email? Check your Spam or All Mail folder.</span>
        </p>

        <a
          href={getInboxUrl(userEmail)}
          target="_blank"
          rel="noopener noreferrer"
          className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition"
        >
          Open Your Inbox
        </a>

        <p className="text-gray-500 dark:text-gray-400 text-sm mt-6">
          Once you’ve clicked the link in your email, you can safely close this tab.
        </p>
      </div>
    </div>
  );
}
