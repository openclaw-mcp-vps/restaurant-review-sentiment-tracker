import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import { cleanText, makeFallbackReviews, type ScrapedReview } from "@/lib/scrapers/shared";

function parseTripadvisorHtml(html: string, sourceUrl: string): ScrapedReview[] {
  const $ = cheerio.load(html);
  const reviews: ScrapedReview[] = [];

  $("[data-automation='reviewCard'], article, div.review-container").each((index, node) => {
    const text = cleanText($(node).find("q span, p, div").text());
    if (!text || text.length < 25) {
      return;
    }

    const author = cleanText($(node).find("a[href*='Profile'], span[class*=name], h3").first().text()) || "TripAdvisor User";
    const bubble = $(node).find("[class*='bubble_rating']").attr("class") || "";
    const match = bubble.match(/bubble_(\d+)/);
    const rating = match ? Number(match[1]) / 10 : 4;

    reviews.push({
      sourceId: `tripadvisor_${index + 1}_${author.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      platform: "tripadvisor",
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

export async function scrapeTripadvisorReviews(listingUrl: string): Promise<ScrapedReview[]> {
  try {
    const response = await fetch(listingUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      },
      next: { revalidate: 0 },
    });

    const parsed = parseTripadvisorHtml(await response.text(), listingUrl);
    if (parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fall through.
  }

  try {
    const html = await scrapeWithBrowser(listingUrl);
    const parsed = parseTripadvisorHtml(html, listingUrl);
    if (parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fall back when scraping is blocked.
  }

  return makeFallbackReviews("tripadvisor", listingUrl);
}
