// types/next-auth.d.ts
import NextAuth from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email?: string | null;
      role?: string;
      name?: string | null;
      image?: string | null;
    };
  }

  interface User {
    role?: string;
  }

  interface JWT {
    role?: string;
    email?: string;
    sub?: string;
  }
}
