"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

const Unauthorized = () => {
  const router = useRouter();

  useEffect(() => {
    // Redirect after 2 seconds
    const timeout = setTimeout(() => {
      router.push("/");
    }, 2000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <div className="text-center p-10">
      <p className="text-red-600 font-semibold text-lg">
        🚫 You are not authorized to view this page.
      </p>
      <p className="text-sm mt-2 text-gray-500">
        Redirecting to homepage... Please contact the MIH IT Team if this is a mistake.
      </p>
    </div>
  );
};

export default Unauthorized;
