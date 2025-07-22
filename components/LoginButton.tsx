'use client';

import { signIn } from 'next-auth/react';

export default function LoginButton() {
    
    
    return (
    <button
      onClick={() => signIn("email", { callbackUrl: "/" })} 
      className="hover:bg-blue-900 border-2 rounded-md py-1 px-4 bg-blue-800 text-white cursor-pointer"
      title="Login using your company email to access the articles"
    >
      LOGIN
    </button>
    
  );
}
