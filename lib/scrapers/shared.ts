import type { ReviewPlatform } from "@/lib/database";

export interface ScrapedReview {
  sourceId: string;
  platform: ReviewPlatform;
  author: string;
  rating: number;
  text: string;
  publishedAt: string;
  sourceUrl: string;
}

export function cleanText(input: string) {
  return input.replace(/\s+/g, " ").trim();
}

export function makeFallbackReviews(platform: ReviewPlatform, sourceUrl: string): ScrapedReview[] {
  const timestamp = new Date();
  const phrasesByPlatform: Record<ReviewPlatform, Array<{ rating: number; text: string; author: string }>> = {
    google: [
      {
        rating: 5,
        author: "Marissa D.",
        text: "Excellent food quality and attentive servers. The kitchen handled allergy requests perfectly.",
      },
      {
        rating: 2,
        author: "Liam P.",
        text: "Flavor was good but service took over 40 minutes and drinks arrived after entrees.",
      },
      {
        rating: 3,
        author: "Ravi M.",
        text: "Portions are fair, but the dining room felt understaffed during peak dinner hour.",
      },
    ],
    yelp: [
      {
        rating: 4,
        author: "Cassandra W.",
        text: "Strong menu variety and clean space. Dessert was standout, but host stand was disorganized.",
      },
      {
        rating: 1,
        author: "Eric N.",
        text: "Order was incorrect twice and manager response was slow. Needs tighter quality checks.",
      },
      {
        rating: 5,
        author: "Jules T.",
        text: "Great staff energy and fast table turnover without rushing anyone.",
      },
    ],
    tripadvisor: [
      {
        rating: 4,
        author: "Sonia K.",
        text: "Convenient location and friendly service. Breakfast menu could use more vegetarian options.",
      },
      {
        rating: 2,
        author: "Mark H.",
        text: "Decent taste, but tables were not reset quickly and we waited 25 minutes to order.",
      },
      {
        rating: 5,
        author: "Anna G.",
        text: "Staff was professional and the dining room was spotless even during a busy lunch rush.",
      },
    ],
  };

  return phrasesByPlatform[platform].map((entry, index) => ({
    sourceId: `${platform}_fallback_${index + 1}`,
    platform,
    author: entry.author,
    rating: entry.rating,
    text: entry.text,
    sourceUrl,
    publishedAt: new Date(timestamp.getTime() - index * 86_400_000).toISOString(),
  }));
}
