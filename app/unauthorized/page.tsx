"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const Unauthorized = () => {
  const router = useRouter();

  useEffect(() => {
    const timeout = setTimeout(() => {
      router.push("/");
    }, 2500);
    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <main className="min-h-[calc(100vh-80px-60px)] flex flex-col justify-center items-center px-4 bg-gray-50">
      {/* Adjust 80px and 60px to your navbar/footer heights */}

      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <div className="text-6xl mb-4 select-none" aria-hidden="true">
          🚫
        </div>
        <h1 className="text-2xl font-extrabold text-red-700 mb-2">
          Unauthorized Access
        </h1>
        <p className="text-gray-600 mb-6">
          You don’t have permission to view this page.
        </p>
        <p className="text-gray-500 text-sm">
          Redirecting you back to the homepage shortly.
          <br />
          If you believe this is an error, please contact the MIH IT Team.
        </p>
      </div>
    </main>
  );
};

export default Unauthorized;
