import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

function logDebug(...args: any[]) {
  if (process.env.NODE_ENV !== "production") {
    console.log("[DEBUG]", ...args);
  }
}

export async function middleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const url = req.nextUrl.clone();

  const pathname = url.pathname;
  logDebug("[MIDDLEWARE] Path:", pathname);
  logDebug("[MIDDLEWARE] Token:", token);

  // Require login for any route under /articles
  if (pathname.startsWith("/articles")) {
    if (!token) {
      logDebug("[MIDDLEWARE] ❌ No valid token or role, redirecting to login");
      url.pathname = "/login";
      return NextResponse.redirect(url);
    }
  }

  logDebug("[MIDDLEWARE] ✅ Token and role present. Allowing access.");

  // Admin routes protection
  if (pathname.startsWith("/admin/superadmin")) {
    if (token?.role !== "superadmin") {
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  }

  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/superadmin")) {
    if (!token || (token.role !== "admin" && token.role !== "superadmin")) {
      url.pathname = "/unauthorized";
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/articles/:path*"],
};
