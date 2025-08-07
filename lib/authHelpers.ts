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

  if (!settings) {
    return { authorized: false, reason: "Settings not found" };
  }

  const normalizedEmail = email.toLowerCase();
  const allowedDomains = settings.allowedDomains || [];
  const exceptionEmails = settings.exceptionEmails || [];

  const domainAllowed = allowedDomains.some((domain) =>
    normalizedEmail.endsWith(`@${domain.toLowerCase()}`)
  );
  const exceptionAllowed = exceptionEmails
    .map((e) => e.toLowerCase())
    .includes(normalizedEmail);

  if (!domainAllowed && !exceptionAllowed) {
    return { authorized: false, reason: "Domain or email not allowed" };
  }

  // Default role to "user"
  role = role || "user";
  const normalizedRole = role.toLowerCase();

  if (options?.requireSuperadmin && normalizedRole !== "superadmin") {
    return { authorized: false, reason: "Superadmin required" };
  }

  if (
    options?.requireAdmin &&
    normalizedRole !== "admin" &&
    normalizedRole !== "superadmin"
  ) {
    return { authorized: false, reason: "Admin or superadmin required" };
  }

  return { authorized: true };
}
