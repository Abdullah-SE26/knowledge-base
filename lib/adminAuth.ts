import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function checkAdminAuth() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    return { isAdmin: false, user: null };
  }
  
  const isAdmin = session.user.role === "admin";
  
  return { isAdmin, user: session.user };
}

export async function requireAdmin() {
  const { isAdmin, user } = await checkAdminAuth();
  
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }
  
  return user;
}