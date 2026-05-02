import { NextResponse } from "next/server";
import { z } from "zod";
import {
  ensureDefaultRestaurant,
  listReviewsByRestaurant,
  saveSentimentSnapshot,
} from "@/lib/database";
import { summarizeSentiment } from "@/lib/sentiment";

const schema = z.object({
  restaurantId: z.string().optional(),
  persist: z.boolean().default(true),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid analysis payload", details: parsed.error.flatten() }, { status: 400 });
  }

  const restaurant = await ensureDefaultRestaurant();
  const targetId = parsed.data.restaurantId || restaurant.id;
  const reviews = await listReviewsByRestaurant(targetId);

  if (reviews.length === 0) {
    return NextResponse.json({ error: "No reviews found for this restaurant" }, { status: 404 });
  }

  const summary = summarizeSentiment(reviews);

  if (parsed.data.persist) {
    const snapshot = await saveSentimentSnapshot({
      restaurantId: targetId,
      avgSentiment: summary.avgSentiment,
      avgRating: summary.avgRating,
      topIssues: summary.topIssues,
      suggestions: summary.suggestions,
      platformBreakdown: summary.platformBreakdown,
    });

    return NextResponse.json({ status: "ok", summary, snapshot });
  }

  return NextResponse.json({ status: "ok", summary });
}
