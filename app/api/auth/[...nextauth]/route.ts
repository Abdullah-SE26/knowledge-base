import NextAuth, { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/clientPromise";
import { Resend } from "resend";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";
import { MongoClient } from "mongodb";

// Dev override emails
const devEmails = ["m.abdullahx21@gmail.com"];

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Get user role by email from MongoDB
async function getUserRoleByEmail(email: string): Promise<string | null> {
  const client: MongoClient = await clientPromise;
  const db = client.db();
  const user = await db
    .collection("users")
    .findOne({ email: email.toLowerCase() });
  return user?.role || null;
}

// Fetch allowed domains and exception emails
async function getAllowedSettings(): Promise<{
  allowedDomains: string[];
  exceptionEmails: string[];
}> {
  const client: MongoClient = await clientPromise;
  const db = client.db();
  const settings = await db.collection("settings").findOne({});
  return {
    allowedDomains: settings?.allowedDomains || [],
    exceptionEmails: settings?.exceptionEmails || [],
  };
}

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
  session: {
    strategy: "jwt",
  },

  providers: [
    EmailProvider({
      from: process.env.EMAIL_FROM,
      async sendVerificationRequest({ identifier, url, provider }) {
        const logoUrl = "https://mawaridhi-kb.vercel.app/logo.png";

        const html = `
          <div style="background: #f9fafb; padding: 30px; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
              <div style="padding: 30px; text-align: center;">
                <img src="${logoUrl}" alt="Mawaridhi Logo" style="height: 100px; margin-bottom: 20px;" />
                <h2 style="color: #0f172a; margin-bottom: 20px;">Sign in to Mawaridhi Knowledge Base</h2>
                <p style="margin-bottom: 30px;">Click the button below to securely sign in:</p>
                <a href="${url}" style="background: #0f172a; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold;">Sign in</a>
                <p style="margin-top: 40px; font-size: 12px; color: #888;">
                  If you didn’t request this, you can safely ignore this email.
                </p>
              </div>
            </div>
          </div>
        `;

        try {
          const { error } = await resend.emails.send({
            to: [identifier],
            from: provider.from || "",
            subject: "Your sign-in link for Mawaridhi",
            html,
          });

          if (error) throw error;

          console.log("✅ Verification email sent via Resend.");
        } catch (err) {
          console.error("❌ Failed to send verification email via Resend:", err);
        }
      },
    }),
  ],

  callbacks: {
    async signIn({ user }) {
      const email = user?.email?.toLowerCase() || "";
      if (!email) return false;

      const { allowedDomains, exceptionEmails } = await getAllowedSettings();

      // Allow if email ends with an allowed domain
      if (allowedDomains.some((domain: string) => email.endsWith(`@${domain}`))) {
        return true;
      }

      // Allow if email is in exception list
      if (exceptionEmails.includes(email)) {
        return true;
      }

      // Allow if email is in dev list
      if (devEmails.includes(email)) {
        return true;
      }

      return false;
    },

    async jwt({ token, user }) {
      if (user) {
        token.email = user.email;
        token.role = (user as any).role || "user";
      } else if (token.email) {
        const role = await getUserRoleByEmail(token.email);
        token.role = role || "user";
      }
      return token;
    },

    async session({ session, token }: { session: Session; token: JWT }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.email = token.email ?? null;
        session.user.role = typeof token.role === "string" ? token.role : "user";
      }
      return session;
    },

    async redirect({ url, baseUrl }) {
      return url.startsWith(baseUrl) ? "/" : baseUrl;
    },
  },

  pages: {
    signIn: "/login",
    verifyRequest: "/verify-request",
  },

  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
