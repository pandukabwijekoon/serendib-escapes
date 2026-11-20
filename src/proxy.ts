import { NextRequest, NextResponse } from "next/server";

/**
 * Comprehensive AI crawler, LLM live-fetcher, headless browser, and automated
 * scraper User-Agent blocklist.
 */
const AI_AND_SCRAPER_UA_REGEX =
  /(gptbot|chatgpt|oai-searchbot|openai|claudebot|claude-web|anthropic|google-extended|googleother|perplexity|bytespider|ccbot|meta-external|facebookexternalhit|facebot|bingbot|bingpreview|msnbot|duckassistbot|applebot|amazonbot|cohere|diffbot|youbot|ai2bot|omgilibot|imagesiftbot|dataforseobot|petalbot|timpibot|scrapy|httrack|webcopier|python|aiohttp|requests|urllib|curl|wget|axios|node-fetch|undici|\bgot\b|okhttp|go-http-client|\bjava\b|libwww|headlesschrome|phantomjs|selenium|puppeteer|playwright|semrushbot|ahrefsbot|mj12bot|dotbot)/i;

/**
 * Common automated vulnerability scanner probe paths.
 */
const BLOCKED_PROBE_PATHS =
  /(\.env|\.git|wp-admin|wp-login|wp-content|phpmyadmin|xmlrpc\.php|\.php$|\.asp$|\.aspx$|\.sql$|\.bak$)/i;

const HUMAN_GATE_COOKIE_NAME = "serendib_human_gate";
const HUMAN_GATE_COOKIE_VALUE = "verified_js_2026_srd";

/**
 * Minimal 403 browser-verification gate HTML containing ZERO site content,
 * brand names, destinations, or pricing so stateless AI link readers receive
 * nothing useful while real browsers verify and reload in ~30ms.
 */
const BROWSER_GATE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="robots" content="noindex, nofollow, noai, noimageai" />
  <title>Restricted Access</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #0A0F0D;
      color: #E2E8F0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      padding: 24px;
    }
    .card {
      max-width: 400px;
      width: 100%;
      padding: 28px;
      border-radius: 16px;
      background: rgba(17, 24, 21, 0.9);
      border: 1px solid rgba(212, 175, 55, 0.28);
      text-align: center;
    }
    .dot {
      width: 10px;
      height: 10px;
      border-radius: 9999px;
      background: #D4AF37;
      margin: 0 auto 14px;
    }
    h1 {
      font-size: 16px;
      font-weight: 600;
      color: #FFFFFF;
      margin-bottom: 8px;
    }
    p {
      font-size: 13px;
      line-height: 1.5;
      color: #94A3B8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="dot"></div>
    <h1>Verifying your browser...</h1>
    <p id="gate-msg">Automated AI bots and scrapers are blocked. Please ensure JavaScript and cookies are enabled.</p>
  </div>
  <script>
    (function () {
      try {
        if (navigator.webdriver) return;
        var token = ["verified", "js", "2026", "srd"].join("_");
        var sec = location.protocol === "https:" ? "; Secure" : "";
        document.cookie = "${HUMAN_GATE_COOKIE_NAME}=" + token + "; path=/; max-age=86400; SameSite=Lax" + sec;
        if (document.cookie.indexOf(token) !== -1) {
          window.location.replace(window.location.href);
        }
      } catch (e) {}
    })();
  </script>
</body>
</html>`;

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const method = request.method.toUpperCase();
  const userAgent = request.headers.get("user-agent") ?? "";

  // 1. Block known AI bots, scrapers, HTTP clients, and empty/short User-Agents
  if (userAgent.trim().length < 12 || AI_AND_SCRAPER_UA_REGEX.test(userAgent)) {
    return new NextResponse(
      "Access denied for automated AI bots and scrapers.",
      {
        status: 403,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Robots-Tag": "noindex, nofollow, noai, noimageai",
          "Cache-Control": "no-store",
        },
      }
    );
  }

  // 2. Block automated vulnerability scanner probes
  if (BLOCKED_PROBE_PATHS.test(pathname)) {
    return new NextResponse("Forbidden", {
      status: 403,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "X-Robots-Tag": "noindex, nofollow, noai, noimageai",
        "Cache-Control": "no-store",
      },
    });
  }

  // 3. CSRF Origin check on state-changing API requests (excluding Bearer-protected /api/seed)
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

  // 4. Layer 2: Proof-of-Browser JS Gate for HTML page GET requests
  const isPageRoute =
    method === "GET" &&
    !pathname.startsWith("/api/") &&
    !pathname.startsWith("/_next/") &&
    !pathname.startsWith("/images/") &&
    !pathname.startsWith("/sequences/") &&
    pathname !== "/robots.txt" &&
    pathname !== "/favicon.ico";

  if (isPageRoute) {
    const acceptLanguage = request.headers.get("accept-language");
    if (!acceptLanguage || acceptLanguage.trim().length === 0) {
      return new NextResponse("Access denied for automated clients.", {
        status: 403,
        headers: {
          "Content-Type": "text/plain; charset=utf-8",
          "X-Robots-Tag": "noindex, nofollow, noai, noimageai",
          "Cache-Control": "no-store",
        },
      });
    }

    const gateCookie = request.cookies.get(HUMAN_GATE_COOKIE_NAME)?.value;
    if (gateCookie !== HUMAN_GATE_COOKIE_VALUE) {
      return new NextResponse(BROWSER_GATE_HTML, {
        status: 403,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "X-Robots-Tag": "noindex, nofollow, noai, noimageai",
          "Cache-Control": "no-store, no-cache, must-revalidate",
        },
      });
    }
  }

  const response = NextResponse.next();
  response.headers.set("X-Robots-Tag", "noai, noimageai");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
