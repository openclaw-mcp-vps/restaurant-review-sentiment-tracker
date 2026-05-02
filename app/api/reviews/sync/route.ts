import { NextResponse } from "next/server";
import { z } from "zod";
import { validateCronExpression } from "cron";
import { sendSentimentDropAlert } from "@/lib/alerts";
import {
  addOrUpdateReviews,
  ensureDefaultRestaurant,
  logSync,
  saveSentimentSnapshot,
  upsertRestaurant,
} from "@/lib/database";
import { scrapeGoogleReviews } from "@/lib/scrapers/google";
import { scrapeTripadvisorReviews } from "@/lib/scrapers/tripadvisor";
import { scrapeYelpReviews } from "@/lib/scrapers/yelp";
import { enrichReviewsWithSentiment, summarizeSentiment } from "@/lib/sentiment";

export const runtime = "nodejs";

const restaurantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2),
  ownerEmail: z.string().email(),
  googleUrl: z.string().url(),
  yelpUrl: z.string().url(),
  tripadvisorUrl: z.string().url(),
});

const requestSchema = z.object({
  source: z.enum(["manual", "cron"]).default("manual"),
  restaurant: restaurantSchema.optional(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid sync payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const restaurant = parsed.data.restaurant
    ? await upsertRestaurant(parsed.data.restaurant)
    : await ensureDefaultRestaurant();

  const [google, yelp, tripadvisor] = await Promise.all([
    scrapeGoogleReviews(restaurant.googleUrl),
    scrapeYelpReviews(restaurant.yelpUrl),
    scrapeTripadvisorReviews(restaurant.tripadvisorUrl),
  ]);

  const enriched = await enrichReviewsWithSentiment([...google, ...yelp, ...tripadvisor]);
  const savedReviews = await addOrUpdateReviews(restaurant.id, enriched);
  const summary = summarizeSentiment(savedReviews);

  const snapshot = await saveSentimentSnapshot({
    restaurantId: restaurant.id,
    avgSentiment: summary.avgSentiment,
    avgRating: summary.avgRating,
    topIssues: summary.topIssues,
    suggestions: summary.suggestions,
    platformBreakdown: summary.platformBreakdown,
  });

  await logSync(
    restaurant.id,
    parsed.data.source,
    `Synced ${savedReviews.length} reviews across Google, Yelp, TripAdvisor`,
  );

  if (summary.avgSentiment < -0.2) {
    await sendSentimentDropAlert({
      to: restaurant.ownerEmail,
      restaurantName: restaurant.name,
      avgSentiment: summary.avgSentiment,
      avgRating: summary.avgRating,
      topIssues: summary.topIssues,
      suggestions: summary.suggestions,
    }).catch(() => undefined);
  }

  const cronExpression = process.env.REVIEW_SYNC_CRON || "0 */6 * * *";
  const scheduleValidation = validateCronExpression(cronExpression);

  return NextResponse.json({
    status: "ok",
    restaurant,
    reviewCount: savedReviews.length,
    syncedPlatforms: ["google", "yelp", "tripadvisor"],
    summary,
    snapshot,
    scheduler: {
      cronExpression,
      valid: scheduleValidation.valid,
      error: scheduleValidation.error?.message || null,
    },
  });
}
