import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow access to login page and auth API routes
  if (pathname === "/login" || pathname.startsWith("/api/auth")) {
    return;
  }

  // Require authentication for all other routes
  if (!req.auth) {
    const loginUrl = new URL("/login", req.url);
    return Response.redirect(loginUrl);
  }
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

