import { NextRequest, NextResponse } from "next/server";

/**
 * Comprehensive AI crawler, LLM scraper, and automated harvester User-Agent blocklist.
 */
const AI_AND_SCRAPER_UA_REGEX =
  /(gptbot|chatgpt-user|oai-searchbot|claudebot|claude-web|anthropic-ai|google-extended|perplexitybot|perplexity-user|bytespider|ccbot|meta-externalagent|meta-externalfetcher|applebot-extended|amazonbot|cohere-ai|diffbot|youbot|ai2bot|omgilibot|imagesiftbot|dataforseobot|petalbot|timpibot|scrapy|httrack|webcopier|python-requests|aiohttp|semrushbot|ahrefsbot|mj12bot|dotbot)/i;

/**
 * Common automated vulnerability scanner probe paths.
 */
const BLOCKED_PROBE_PATHS =
  /(\.env|\.git|wp-admin|wp-login|wp-content|phpmyadmin|xmlrpc\.php|\.php$|\.asp$|\.aspx$|\.sql$|\.bak$)/i;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const userAgent = request.headers.get("user-agent") ?? "";

  // 1. Block AI bots and automated scrapers at the edge
  if (AI_AND_SCRAPER_UA_REGEX.test(userAgent)) {
    return new NextResponse("Access denied for automated AI bots and scrapers.", {
      status: 403,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow, noai, noimageai",
        "Cache-Control": "no-store",
      },
    });
  }

  // 2. Block automated vulnerability scanner probes
  if (BLOCKED_PROBE_PATHS.test(pathname)) {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  }

  // 3. CSRF Origin check on state-changing API requests (excluding Bearer-protected /api/seed)
  const method = request.method.toUpperCase();
  if (
    pathname.startsWith("/api/") &&
    pathname !== "/api/seed" &&
    (method === "POST" ||
      method === "PUT" ||
      method === "PATCH" ||
      method === "DELETE")
  ) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return NextResponse.json(
            { error: "Cross-origin request blocked." },
            { status: 403 }
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Invalid request origin." },
          { status: 403 }
        );
      }
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noai, noimageai");
  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
