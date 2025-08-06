import "dotenv/config";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

async function main() {
  try {
    const { data, error } = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: ["md.4bdull4h@gmail.com"], // replace with your target email
      subject: "✅ Resend Email Test",
      html: "<h1>It works!</h1><p>This is a test email from Resend API via script.</p>",
    });

    if (error) {
      console.error("❌ Error:", error);
    } else {
      console.log("✅ Sent:", data);
    }
  } catch (err) {
    console.error("❌ Failed to send:", err);
  }
}

main();
