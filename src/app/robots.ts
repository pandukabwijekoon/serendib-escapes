import type { MetadataRoute } from "next";

const BLOCKED_AI_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "Google-Extended",
  "GoogleOther",
  "PerplexityBot",
  "Perplexity-User",
  "Bytespider",
  "CCBot",
  "Meta-ExternalAgent",
  "Meta-ExternalFetcher",
  "FacebookBot",
  "Applebot-Extended",
  "Amazonbot",
  "cohere-ai",
  "Diffbot",
  "YouBot",
  "AI2Bot",
  "Scrapy",
  "Omgilibot",
  "DataForSeoBot",
  "ImagesiftBot",
  "PetalBot",
  "TimpiBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...BLOCKED_AI_BOTS.map((userAgent) => ({
        userAgent,
        disallow: "/",
      })),
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/*", "/api/*"],
      },
    ],
  };
}
