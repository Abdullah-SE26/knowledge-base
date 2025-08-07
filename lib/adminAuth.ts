import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";


// Optional role check
interface RequireAdminOptions {
  requireSuperadmin?: boolean;
}

export async function requireAdmin(req: Request, options: RequireAdminOptions = {}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    return null;
  }

  // Default role to "user" if missing
  const role = session.user?.role ?? "user";

  if (options.requireSuperadmin) {
    if (role !== "superadmin") {
      return null;
    }
  } else {
    if (role !== "admin" && role !== "superadmin") {
      return null;
    }
  }

  return session;
}
