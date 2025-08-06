// lib/authHelpers.ts
import Settings from "@/models/Settings";
import connectMongoDB from "@/lib/mongodb";

export async function checkAuthorization(
  email: string,
  role: string,
  options?: { requireAdmin?: boolean; requireSuperadmin?: boolean }
) {
  await connectMongoDB();

  const settings = await Settings.findOne({}).lean();
  const allowedDomains = settings?.allowedDomains || [];
  const exceptionEmails = settings?.exceptionEmails || [];

  const domainAllowed = allowedDomains.some((domain) => email.endsWith(`@${domain}`));
  const exceptionAllowed = exceptionEmails.includes(email);

  if (!domainAllowed && !exceptionAllowed) {
    return { authorized: false, reason: "Domain or email not allowed" };
  }

  if (options?.requireSuperadmin && role !== "superadmin") {
    return { authorized: false, reason: "Superadmin required" };
  }

  if (options?.requireAdmin && role !== "admin" && role !== "superadmin") {
    return { authorized: false, reason: "Admin or superadmin required" };
  }

  return { authorized: true };
}
