"use client";

import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LogoSwitcher from "./LogoSwitcher";

export default function LoginForm() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const allowedDomain = "gmail.com"; // Change to "mawaridhi.com"

  useEffect(() => {
    if (session) {
      router.push("/"); // Redirect if already signed in
    }
  }, [session, router]);

  if (session) {
    return (
      <div className="text-center p-8">
        <h2 className="text-2xl font-semibold">You are already signed in.</h2>
      </div>
    );
  }

 const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setError(""); // clear previous error

  const form = e.currentTarget;
  const emailInput = form.elements.namedItem("email") as HTMLInputElement;
  const email = emailInput.value;

  if (!email.endsWith(`@${allowedDomain}`)) {
    setError("Error! Invalid domain. Please use your company email.");
    return;
  }

  setLoading(true);

  const res = await signIn("email", {
    email,
    redirect: false,
    callbackUrl: "/", // <--- add this!
  });

  setLoading(false);

  if (res?.ok) {
    setSent(true);
    emailInput.value = "";
    setTimeout(() => {
      router.push("/verify-request");
    }, 1500);
  } else {
    setError("Failed to send verification email. Try again.");
  }
};
;

  return (    
    <form
      onSubmit={handleSubmit}
      className="bg-white p-10 mb-25 rounded-xl shadow-md w-full max-w-md mx-auto space-y-6 dark:bg-blue-950"
    >
      
        <LogoSwitcher/>
     
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">Sign in</h2>
        <p className="text-sm text-gray-500 dark:text-white">
          Use your company email to receive a verification link
        </p>
      </div>

      {error && (
        <div role="alert" className="alert alert-error alert-outline mb-4 dark:text-white">
          <span>{error}</span>
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 mb-1 dark:text-white"
        >
          Work Email
        </label>
        <input
          type="email"
          name="email"
          id="email"
          required
          placeholder={`example@${allowedDomain}`}
          className="dark:text-white block w-full px-4 py-2 border text-black border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition"
          disabled={loading || sent}
        />
      </div>

      <button
        type="submit"
        disabled={loading || sent}
        className={`dark:text-white cursor-pointer w-full py-2 px-4 font-medium rounded-md transition flex justify-center items-center gap-2 ${
          sent
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-blue-800 hover:bg-blue-900 text-white"
        }`}
      >
        {loading && <span className="loading loading-spinner text-info"></span>}

        {sent ? (
          <>
            <svg
              className="h-5 w-5 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 13l4 4L19 7"
              />
            </svg>
            Sent
          </>
        ) : loading ? (
          "Sending..."
        ) : (
          "Send Verification Link"
        )}
      </button>
    </form>
  );
}
