"use client";

import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const BackButton = () => {
  const pathName = usePathname();
  const router = useRouter();

  // Don't render on home page
  if (pathName === "/") return null;

  return (
    <button
      onClick={() => router.back()}
      className="
        hidden sm:flex      
        items-center
        text-gray-600
        hover:text-white
        hover:bg-blue-900
        px-6 py-2
        cursor-pointer
        border border-gray-300
        rounded-md
        transition
        hover:border-black
        dark:text-white
        dark:border-white
        dark:hover:bg-blue-900
      "
      aria-label="Go back"
      title="Go Back to previous page"
    >
      <ArrowLeft size={20} />
    </button>
  );
};

export default BackButton;
