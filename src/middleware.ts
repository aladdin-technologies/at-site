import { NextRequest, NextResponse } from "next/server";

/**
 * Subdomain → route mapping.
 * Add a new line here to register a new subdomain tool.
 * Each subdomain gets its own /[tool]/* routes in src/app/[tool]/
 */
const SUBDOMAIN_TOOLS: Record<string, string> = {
  aero: "/aero",
  // "non-aero": "/non-aero",
  // benchmark: "/benchmark",
  // advisory: "/advisory",
  // charges: "/charges",
};

export function middleware(request: NextRequest) {
  const host = request.headers.get("host") || "";
  const pathname = request.nextUrl.pathname;

  // Extract subdomain: "aero.airportronics.com" → "aero"
  // Also handles "aero.localhost:3001" for local dev
  const parts = host.split(".");
  const subdomain = parts.length >= 2 ? parts[0] : null;

  // Check if this subdomain is a registered tool
  if (subdomain && subdomain !== "www" && SUBDOMAIN_TOOLS[subdomain]) {
    const toolPath = SUBDOMAIN_TOOLS[subdomain];

    // Root → login page
    if (pathname === "/") {
      return NextResponse.rewrite(new URL(`${toolPath}/login`, request.url));
    }

    // Already on the tool path → pass through
    if (pathname.startsWith(toolPath)) {
      return NextResponse.next();
    }

    // Rewrite to tool path prefix
    return NextResponse.rewrite(new URL(`${toolPath}${pathname}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|favicon.ico|icon-|apple-|intro|.*\\..*).*)"],
};
