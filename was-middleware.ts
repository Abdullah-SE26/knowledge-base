import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const ALLOWED_DOMAINS = process.env.ALLOWED_DOMAINS
  ? process.env.ALLOWED_DOMAINS.split(",")
  : ["mawaridhi.com"];

const EXCEPTION_EMAILS = process.env.EXCEPTION_EMAILS
  ? process.env.EXCEPTION_EMAILS.split(",")
  : ["m.abdullahx21@gmail.com"];

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const email = token?.email || "";
  const role = token?.role || "";

  const url = req.nextUrl.clone();

  const isAllowedDomain = ALLOWED_DOMAINS.some((domain) =>
    email.endsWith(`@${domain.trim()}`)
  );
  const isExceptionEmail = EXCEPTION_EMAILS.includes(email);
  const isAdmin = role === "admin";
  const isSuperAdmin = role === "superadmin";

  if (req.nextUrl.pathname.startsWith("/admin/superadmin") && !isSuperAdmin) {
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  if (
    req.nextUrl.pathname.startsWith("/admin") &&
    !req.nextUrl.pathname.startsWith("/admin/superadmin") &&
    !(isExceptionEmail || isAdmin)
  ) {
    url.pathname = "/unauthorized";
    return NextResponse.redirect(url);
  }

  if (
    (req.nextUrl.pathname.startsWith("/articles") ||
      req.nextUrl.pathname.startsWith("/article")) &&
    !isAllowedDomain &&
    !isExceptionEmail
  ) {
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/articles/:path*", "/article/:path*"],
};
