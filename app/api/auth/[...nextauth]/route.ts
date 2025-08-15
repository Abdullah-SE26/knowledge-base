function logDebug(...args: any[]) {
  if (process.env.NODE_ENV !== "production") {
    console.log("[DEBUG]", ...args);
  }
}

function logError(...args: any[]) {
  console.error("[ERROR]", ...args);
}

import NextAuth, { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { CustomMongoDBAdapter } from "@/lib/customMongoAdapter";
import clientPromise from "@/lib/clientPromise";
import nodemailer from "nodemailer";
import { JWT } from "next-auth/jwt";
import { Session } from "next-auth";
import { MongoClient } from "mongodb";


const devEmails = ["m.abdullahx21@gmail.com"];

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

async function getUserRoleByEmail(email: string): Promise<string | null> {
  const client: MongoClient = await clientPromise;
  // Use correct DB name here:
  const db = client.db("it-kb-cluster");
  const user = await db
    .collection("users")
    .findOne({ email: email.toLowerCase() });
  logDebug("[getUserRoleByEmail] user role found:", user?.role);
  return user?.role || null;
}

async function getAllowedSettings() {
  const client: MongoClient = await clientPromise;
  const db = client.db("it-kb-cluster");
  const settings = await db.collection("settings").findOne({});
  logDebug("[getAllowedSettings] settings from DB:", settings);
  return {
    allowedDomains: (settings?.allowedDomains || []).map((d: string) =>
      d.toLowerCase()
    ),
    exceptionEmails: (settings?.exceptionEmails || []).map((e: string) =>
      e.toLowerCase()
    ),
  };
}

export const authOptions: NextAuthOptions = {
  adapter: CustomMongoDBAdapter(clientPromise),
  debug: true,

  session: {
    strategy: "jwt",
  },

  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,

      async sendVerificationRequest({ identifier, url, provider }) {
        const email = identifier.toLowerCase();
        const { allowedDomains, exceptionEmails } = await getAllowedSettings();

        const isAllowed =
          allowedDomains.some((domain) => email.endsWith(`@${domain}`)) ||
          exceptionEmails.includes(email) ||
          devEmails.includes(email);

        logDebug("[sendVerificationRequest] Attempt for:", email);
        if (!isAllowed) {
          logDebug(
            "[sendVerificationRequest] ❌ Email not allowed. Aborting send."
          );
          return;
        }

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
          const info = await transporter.sendMail({
            to: email,
            from: provider.from,
            subject: "Your sign-in link for Mawaridhi",
            html,
          });
          logDebug(
            "[sendVerificationRequest] ✅ Email sent:",
            info.messageId || info
          );
        } catch (error) {
          logError("[sendVerificationRequest] ❌ Email send failed:", error);
        }
      },
    }),
  ],

  callbacks: {
  async signIn({ user }) {
    const email = user?.email?.toLowerCase();
    if (!email) return false;

    const client = await clientPromise;
    const db = client.db("it-kb-cluster");

    const dbUser = await db.collection("users").findOne({ email });

    if (!dbUser) {
      // User doesn't exist: create new with default role 'user'
      await db.collection("users").insertOne({
        email,
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      logDebug("[signIn] Created new user with role 'user':", email);
    } else {
      logDebug("[signIn] Existing user role:", dbUser.role);
    }

    const { allowedDomains, exceptionEmails } = await getAllowedSettings();

    const isAllowed =
      allowedDomains.some((domain) => email.endsWith(`@${domain}`)) ||
      exceptionEmails.includes(email) ||
      devEmails.includes(email);

    logDebug(
      `[signIn] Login ${isAllowed ? "✅ allowed" : "❌ denied"} for ${email}`
    );
    return isAllowed;
  },

  async jwt({ token, user }) {
    if (user?.email) {
      token.email = user.email;

      // ALWAYS fetch fresh role from DB on sign-in
      const role = await getUserRoleByEmail(user.email);

      if (role) {
        token.role = role;
      } else {
        const { exceptionEmails } = await getAllowedSettings();
        if (
          exceptionEmails.includes(user.email.toLowerCase()) ||
          devEmails.includes(user.email.toLowerCase())
        ) {
          token.role = "user";
          logDebug("[jwt] Assigned 'user' role to exception email:", user.email);
        } else {
          token.role = "user";
        }
      }

      logDebug("[jwt] Token initialized for:", token.email, "| role:", token.role);
    } else if (token.email) {
      // Token refresh: fetch fresh role too
      const role = await getUserRoleByEmail(token.email);

      if (role) {
        token.role = role;
      } else {
        const { exceptionEmails } = await getAllowedSettings();
        if (
          exceptionEmails.includes(token.email.toLowerCase()) ||
          devEmails.includes(token.email.toLowerCase())
        ) {
          token.role = "user";
          logDebug("[jwt] Refreshed: assigned 'user' role to exception email:", token.email);
        } else {
          token.role = "user";
        }
      }

      logDebug("[jwt] Token refreshed for:", token.email, "| role:", token.role);
    }

    return token;
  },

  async session({ session, token }: { session: Session; token: JWT }) {
    session.user.id = token.sub ?? "";
    session.user.email = token.email ?? null;
    session.user.role = typeof token.role === "string" ? token.role : "user";

    logDebug("[session] Session role:", session.user.role);
    return session;
  },

  async redirect() {
    return "/";
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
