import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow access to login page and auth API routes
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  // Check for NextAuth session cookie
  // NextAuth v5 uses various cookie names depending on configuration
  const cookies = req.cookies;
  const hasSessionCookie = 
    cookies.has("authjs.session-token") ||
    cookies.has("__Secure-authjs.session-token") ||
    cookies.has("next-auth.session-token") ||
    cookies.has("__Secure-next-auth.session-token");

  // If no session token, redirect to login
  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", req.url);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

