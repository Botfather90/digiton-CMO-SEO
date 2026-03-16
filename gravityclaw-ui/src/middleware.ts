import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Password-protect the control centre.  The password is checked client-side
// via a cookie.  This middleware only protects the API routes so that no
// data leaks before auth.
const AUTH_COOKIE = "gc-auth";
const AUTH_VALUE  = "L3!";            // <-- access password

export function middleware(req: NextRequest) {
  // Let the page itself through — the client handles the gate UI.
  if (req.nextUrl.pathname === "/" || req.nextUrl.pathname.startsWith("/_next")) {
    return NextResponse.next();
  }

  // API routes require the cookie
  const cookie = req.cookies.get(AUTH_COOKIE);
  if (cookie?.value !== AUTH_VALUE) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
