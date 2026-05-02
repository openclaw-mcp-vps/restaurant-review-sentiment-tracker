import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import { cleanText, makeFallbackReviews, type ScrapedReview } from "@/lib/scrapers/shared";

function parseRating(value: string | undefined) {
  if (!value) {
    return null;
  }

  const match = value.match(/[0-5](\.[0-9])?/);
  return match ? Number(match[0]) : null;
}

function parseGoogleHtml(html: string, sourceUrl: string): ScrapedReview[] {
  const $ = cheerio.load(html);
  const reviews: ScrapedReview[] = [];

  $("[data-review-id], div.gws-localreviews__google-review, div[data-hveid]").each((_, node) => {
    const text = cleanText($(node).find("span, div").text());
    if (!text || text.length < 30) {
      return;
    }

    const author = cleanText($(node).find("[class*=author], [class*=name], h3").first().text()) || "Google User";
    const ratingFromAria = parseRating($(node).find("[aria-label*=star], [aria-label*=Star]").first().attr("aria-label"));
    const rating = ratingFromAria ?? 4;

    reviews.push({
      sourceId: `google_${reviews.length + 1}_${author.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      platform: "google",
      author,
      rating,
      text,
      sourceUrl,
      publishedAt: new Date().toISOString(),
    });
  });

  return reviews.slice(0, 20);
}

async function scrapeWithBrowser(listingUrl: string) {
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
    );
    await page.goto(listingUrl, { waitUntil: "domcontentloaded", timeout: 20_000 });
    await new Promise((resolve) => setTimeout(resolve, 3500));
    return await page.content();
  } finally {
    await browser.close();
  }
}

export async function scrapeGoogleReviews(listingUrl: string): Promise<ScrapedReview[]> {
  try {
    const response = await fetch(listingUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      },
      next: { revalidate: 0 },
    });

    const html = await response.text();
    const parsed = parseGoogleHtml(html, listingUrl);
    if (parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fall through to browser-based attempt.
  }

  try {
    const html = await scrapeWithBrowser(listingUrl);
    const parsed = parseGoogleHtml(html, listingUrl);
    if (parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fall back when scraping is blocked.
  }

  return makeFallbackReviews("google", listingUrl);
}
