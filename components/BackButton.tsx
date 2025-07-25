"use client"

import { usePathname, useRouter } from "next/navigation";
import {  ArrowLeft } from "lucide-react";

const BackButton = () => {

    const pathName = usePathname();
    const router = useRouter();

    if(pathName === '/') return null;

    return (
        <button onClick={() => router.back()}
        className="flex items-center  text-gray-600 hover:text-black mb-5 px-8 py-1.5 cursor-pointer border border-gray-300 rounded-md transition hover:border-black dark:text-white dark:border-white dark:hover:bg-blue-900"
        aria-label="Go back"
        >
        
        <ArrowLeft size={20}/> 

        </button>
    )

}

export default BackButton;