import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const PUBLIC_FILE = /\.(.*)$/;

const allowedDomain = "gmail.com"; // change to your domain if needed
const adminEmails = process.env.ADMIN_EMAILS?.split(",") || [];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const token = await getToken({ req });

  if (!token) {
    if (pathname.startsWith("/articles") || pathname === "/admin") {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    return NextResponse.next();
  }

  const email = token.email?.toLowerCase() || "";
  const isAllowedDomain = email.endsWith(`@${allowedDomain}`);
  const isAdmin = adminEmails.includes(email);

  if (pathname.startsWith("/articles") && !isAllowedDomain) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  if (pathname === "/admin" && !isAdmin) {
    return NextResponse.redirect(new URL("/unauthorized", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/articles/:path*", "/admin"],
};
