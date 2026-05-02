import * as cheerio from "cheerio";
import puppeteer from "puppeteer";
import { cleanText, makeFallbackReviews, type ScrapedReview } from "@/lib/scrapers/shared";

function parseYelpHtml(html: string, sourceUrl: string): ScrapedReview[] {
  const $ = cheerio.load(html);
  const reviews: ScrapedReview[] = [];

  $("[data-testid='review-content'], article[data-review-id], div.review").each((index, node) => {
    const text = cleanText($(node).find("p, span").text());
    if (!text || text.length < 25) {
      return;
    }

    const author = cleanText($(node).find("a[href*='/user_details'], span[class*=name], h3").first().text()) || "Yelp User";
    const ratingLabel = $(node).find("[aria-label*='star rating'], [aria-label*='Star rating']").first().attr("aria-label");
    const ratingMatch = ratingLabel?.match(/[1-5](\.[0-9])?/);

    reviews.push({
      sourceId: `yelp_${index + 1}_${author.toLowerCase().replace(/[^a-z0-9]/g, "")}`,
      platform: "yelp",
      author,
      rating: ratingMatch ? Number(ratingMatch[0]) : 4,
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

export async function scrapeYelpReviews(listingUrl: string): Promise<ScrapedReview[]> {
  try {
    const response = await fetch(listingUrl, {
      headers: {
        "user-agent":
          "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36",
      },
      next: { revalidate: 0 },
    });

    const parsed = parseYelpHtml(await response.text(), listingUrl);
    if (parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fall through.
  }

  try {
    const html = await scrapeWithBrowser(listingUrl);
    const parsed = parseYelpHtml(html, listingUrl);
    if (parsed.length > 0) {
      return parsed;
    }
  } catch {
    // Fall back when scraping is blocked.
  }

  return makeFallbackReviews("yelp", listingUrl);
}
