import NextAuth, { NextAuthOptions } from "next-auth";
import EmailProvider from "next-auth/providers/email";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/clientPromise";
import nodemailer from "nodemailer";

const allowedDomain = "mawaridhi.com"; // Change later to mawaridhi.com
const devEmails = ["m.abdullahx21@gmail.com"];

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SERVER_HOST,
  port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
  auth: {
    user: process.env.EMAIL_SERVER_USER,
    pass: process.env.EMAIL_SERVER_PASSWORD,
  },
});

export const authOptions: NextAuthOptions = {
  adapter: MongoDBAdapter(clientPromise),
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
        const { host } = new URL(url);
        const logoUrl = "https://knowledge-base-two-amber.vercel.app/logo.png";

        const html = `
          <div style="background: #f9fafb; padding: 30px; font-family: Arial, sans-serif;">
            <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.05);">
              <div style="padding: 30px; text-align: center;">
                <img src="${logoUrl}" alt="Mawaridhi Logo" style="height: 100px; margin-bottom: 20px;" />
                <h2 style="color: #0f172a; margin-bottom: 20px;">Sign in to Mawaridhi Knowledge Base</h2>
                <p style="margin-bottom: 30px;">Click the button below to securely sign in:</p>
                <a href="${url}" style="background: #0f172a; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; font-weight: bold;">Sign in</a>
                <p style="margin-top: 40px; font-size: 12px; color: #888;">
                  If you didnt request this, you can safely ignore this email.
                </p>
              </div>
            </div>
          </div>
        `;

        await transporter.sendMail({
          to: identifier,
          from: provider.from,
          subject: "Your sign-in link for Mawaridhi",
          html,
        });
      },
    }),
  ],
  callbacks: {
    async signIn({ user }) {
    const email = user?.email?.toLowerCase() || "";

    // Allow if email ends with @mawaridhi.com
    if (email.endsWith(`@${allowedDomain}`)) {
      return true;
    }

    // Allow if email is in devEmail exception list
    if (devEmails.includes(email)) {
      return true;
    }

    // Otherwise, deny sign in
    return false;
  },
    async session({ session, user }) {
      if (session.user && user.id) {
        session.user.id = user.id; 
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
