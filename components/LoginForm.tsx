"use client";

import React, { useState, useEffect } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import LogoSwitcher from "./LogoSwitcher";
import { toast } from "react-hot-toast";

export default function LoginForm() {
  const { data: session } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const allowedDomain = "mawaridhi.com";
  const devEmails = ["m.abdullahx21@gmail.com"];

  useEffect(() => {
    if (session) {
      router.push("/");
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
    setError("");

    const form = e.currentTarget;
    const emailInput = form.elements.namedItem("email") as HTMLInputElement;
    const email = emailInput.value.trim().toLowerCase();

    // Client-side domain check (UX only)
    if (!email.endsWith(`@${allowedDomain}`) && !devEmails.includes(email)) {
      setError(" ❌ Error! Invalid domain. Please use your company provided email.")
      return;
    }

    setLoading(true);

    const res = await signIn("email", {
      email,
      redirect: false,
      callbackUrl: "/",
    });

    setLoading(false);

    if (res?.ok) {
      setSent(true);
      emailInput.value = "";
      toast.success("✅ Verification link sent!");
      setTimeout(() => {
        router.push("/verify-request");
      }, 1000);
    } else {
      setError("❌ Error! Invalid domain. Please use your company provided email.")
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white dark:bg-blue-950 p-10 rounded-xl mb-20 shadow-md w-full max-w-md mx-auto space-y-6"
    >
      <div className="flex justify-center">
        <LogoSwitcher />
      </div>

      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white">
          Sign In
        </h2>
        <p className="text-sm text-gray-500 dark:text-gray-300">
          Use your work email to receive a secure sign-in link
        </p>
      </div>

      {error && (
        <div className="bg-red-100 text-red-700 p-3 text-sm rounded border border-red-300">
          {error}
        </div>
      )}

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700 dark:text-white mb-1"
        >
          Work Email
        </label>
        <input
          type="email"
          inputMode="email"
          autoComplete="email"
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
        className={`w-full py-2 px-4 font-medium rounded-md transition flex justify-center items-center gap-2 ${
          sent
            ? "bg-green-600 hover:bg-green-700 text-white"
            : "bg-blue-800 hover:bg-blue-900 text-white"
        }`}
      >
        {loading && (
          <span className="loading loading-spinner text-white h-4 w-4" />
        )}

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

