import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const publicPageRoutes = ["/login", "/register"];
const protectedRoutes = ["/home", "/match", "/mine/verification", "/mine", "/admin"];

function isAuthenticated(request: NextRequest): boolean {
  const sessionToken =
    request.cookies.get("next-auth.session-token")?.value ||
    request.cookies.get("__Secure-next-auth.session-token")?.value;
  return !!sessionToken;
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const loggedIn = isAuthenticated(request);

  // NextAuth API routes return JSON, not HTML. They must always pass through
  // so the client SessionProvider can fetch /api/auth/session and /api/auth/csrf.
  if (pathname.startsWith("/api/auth")) {
    return NextResponse.next();
  }

  if (publicPageRoutes.some((r) => pathname.startsWith(r))) {
    if (loggedIn) return NextResponse.redirect(new URL("/home", request.url));
    return NextResponse.next();
  }

  if (protectedRoutes.some((r) => pathname.startsWith(r))) {
    if (!loggedIn) return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.png$|.*\\.svg$).*)"],
};