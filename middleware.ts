import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const allowedDomain = "mawaridhi.com";
const devEmails = ["m.abdullahx21@gmail.com"];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = token?.email || "";
  const role = token?.role || "";

  const url = req.nextUrl.clone();

  const isAllowedDomain = email.endsWith(`@${allowedDomain}`);
  const isDev = devEmails.includes(email);
  const isAdmin = role === "admin";
  const isSuperAdmin = role === "superadmin";

  // Protect /super-admin — only superadmin can access
  if (req.nextUrl.pathname.startsWith("/super-admin") && !isSuperAdmin) {
    url.pathname = "/unauthorized"; // or your custom no-access page
    return NextResponse.redirect(url);
  }

  // Protect /admin - allow dev emails OR admins
  if (req.nextUrl.pathname.startsWith("/admin") && !(isDev || isAdmin)) {
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  // Protect /articles and /article
  if (
    (req.nextUrl.pathname.startsWith("/articles") ||
      req.nextUrl.pathname.startsWith("/article")) &&
    !isAllowedDomain &&
    !isDev
  ) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin", "/articles/:path*", "/article/:path*", "/super-admin/:path*"],
};
