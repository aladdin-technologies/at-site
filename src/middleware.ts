import { NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // aero.airportronics.com → serve /aero/* routes
  if (host.startsWith("aero.")) {
    // Root → login page
    if (pathname === "/") {
      return NextResponse.rewrite(new URL("/aero/login", request.url));
    }
    // Already on /aero/* → pass through
    if (pathname.startsWith("/aero")) {
      return NextResponse.next();
    }
    // Any other path on aero subdomain → rewrite to /aero prefix
    return NextResponse.rewrite(new URL(`/aero${pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|icon-|apple-|intro|.*\\..*).*)"],
};
