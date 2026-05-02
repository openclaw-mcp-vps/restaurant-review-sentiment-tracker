import OpenAI from "openai";
import { z } from "zod";
import type { PlatformBreakdown, ReviewRecord, SentimentLabel, Suggestion } from "@/lib/database";

const aiResponseSchema = z.object({
  score: z.number().min(-1).max(1),
  rationale: z.string().min(1),
  topics: z.array(z.string()).max(5),
});

const topicKeywords: Record<string, RegExp[]> = {
  "slow service": [/slow/i, /wait/i, /late/i, /delay/i, /took\s+\d+/i],
  cleanliness: [/dirty/i, /clean/i, /hygiene/i, /messy/i, /sticky/i],
  "order accuracy": [/wrong order/i, /incorrect/i, /missing/i, /mistake/i],
  "staff attitude": [/rude/i, /friendly/i, /attentive/i, /host/i, /server/i],
  "food quality": [/cold/i, /fresh/i, /flavor/i, /taste/i, /overcooked/i, /undercooked/i],
  "value perception": [/expensive/i, /overpriced/i, /value/i, /portion/i],
};

const positiveTerms = [
  "excellent",
  "great",
  "friendly",
  "fresh",
  "amazing",
  "perfect",
  "quick",
  "clean",
  "attentive",
  "professional",
  "delicious",
];

const negativeTerms = [
  "slow",
  "rude",
  "dirty",
  "incorrect",
  "mistake",
  "cold",
  "late",
  "overpriced",
  "messy",
  "awful",
  "bad",
  "disappointing",
];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function scoreFromLexicon(text: string) {
  const normalized = text.toLowerCase();
  let score = 0;

  for (const term of positiveTerms) {
    if (normalized.includes(term)) {
      score += 0.18;
    }
  }

  for (const term of negativeTerms) {
    if (normalized.includes(term)) {
      score -= 0.2;
    }
  }

  return clamp(score, -1, 1);
}

function inferTopics(text: string) {
  const found = Object.entries(topicKeywords)
    .filter(([, patterns]) => patterns.some((pattern) => pattern.test(text)))
    .map(([topic]) => topic);

  return found.slice(0, 4);
}

function labelFromScore(score: number): SentimentLabel {
  if (score > 0.2) {
    return "positive";
  }
  if (score < -0.2) {
    return "negative";
  }
  return "neutral";
}

async function scoreWithOpenAI(text: string) {
  if (!process.env.OPENAI_API_KEY) {
    return null;
  }

  try {
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0,
      messages: [
        {
          role: "system",
          content:
            "You analyze restaurant reviews. Return compact JSON: {score:number -1..1, rationale:string, topics:string[]}.",
        },
        {
          role: "user",
          content: text,
        },
      ],
      response_format: { type: "json_object" },
    });

    const raw = completion.choices[0]?.message?.content;
    if (!raw) {
      return null;
    }

    const parsed = aiResponseSchema.safeParse(JSON.parse(raw));
    if (!parsed.success) {
      return null;
    }

    return parsed.data;
  } catch {
    return null;
  }
}

export async function analyzeSingleReview(text: string) {
  const ai = await scoreWithOpenAI(text);
  if (ai) {
    return {
      score: clamp(ai.score, -1, 1),
      label: labelFromScore(ai.score),
      topics: ai.topics,
      rationale: ai.rationale,
    };
  }

  const fallbackScore = scoreFromLexicon(text);
  return {
    score: fallbackScore,
    label: labelFromScore(fallbackScore),
    topics: inferTopics(text),
    rationale: "Lexicon fallback model",
  };
}

function computeTopIssues(reviews: Array<Pick<ReviewRecord, "sentimentScore" | "topics">>) {
  const counts = new Map<string, number>();

  for (const review of reviews) {
    if ((review.sentimentScore ?? 0) > 0) {
      continue;
    }
    for (const topic of review.topics) {
      counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([topic]) => topic);
}

function buildSuggestions(topIssues: string[]): Suggestion[] {
  const suggestionBook: Record<string, Suggestion> = {
    "slow service": {
      issue: "Slow service",
      action: "Add a peak-hour expo role and pre-batch high-volume prep items every 30 minutes.",
      expectedImpact: "Shorter ticket times and fewer complaints about waiting.",
    },
    cleanliness: {
      issue: "Cleanliness concerns",
      action: "Run a timed FOH sanitation checklist and manager sign-off each service window.",
      expectedImpact: "Higher trust scores and stronger family/repeat diner sentiment.",
    },
    "order accuracy": {
      issue: "Order accuracy",
      action: "Introduce final pass callouts before table drop and POS modifier verification.",
      expectedImpact: "Fewer remake costs and lower negative review volume.",
    },
    "staff attitude": {
      issue: "Staff attitude",
      action: "Coach greeting/recovery scripts and review difficult interactions in pre-shift huddles.",
      expectedImpact: "Better hospitality sentiment and improved review tone.",
    },
    "food quality": {
      issue: "Food quality inconsistencies",
      action: "Audit holding times and run line taste checks at open, rush peak, and close.",
      expectedImpact: "More consistent ratings across lunch and dinner services.",
    },
    "value perception": {
      issue: "Value concerns",
      action: "Bundle high-margin pairings and clarify portion/value messaging in menu descriptions.",
      expectedImpact: "Improved perceived value in mid-tier rating reviews.",
    },
  };

  return topIssues.map((issue) => suggestionBook[issue]).filter(Boolean);
}

export function buildPlatformBreakdown(reviews: ReviewRecord[]): PlatformBreakdown[] {
  const grouped = new Map<string, ReviewRecord[]>();

  for (const review of reviews) {
    const group = grouped.get(review.platform) ?? [];
    group.push(review);
    grouped.set(review.platform, group);
  }

  return [...grouped.entries()].map(([platform, rows]) => {
    const avgSentiment = rows.reduce((sum, row) => sum + (row.sentimentScore ?? 0), 0) / rows.length;
    const avgRating = rows.reduce((sum, row) => sum + row.rating, 0) / rows.length;

    return {
      platform: platform as PlatformBreakdown["platform"],
      avgSentiment: Number(avgSentiment.toFixed(2)),
      avgRating: Number(avgRating.toFixed(2)),
      reviewCount: rows.length,
    };
  });
}

export async function enrichReviewsWithSentiment(
  reviews: Array<Pick<ReviewRecord, "sourceId" | "platform" | "author" | "rating" | "text" | "publishedAt" | "sourceUrl">>,
) {
  const output: Array<
    Pick<
      ReviewRecord,
      | "sourceId"
      | "platform"
      | "author"
      | "rating"
      | "text"
      | "publishedAt"
      | "sourceUrl"
      | "sentimentScore"
      | "sentimentLabel"
      | "topics"
    >
  > = [];

  for (const review of reviews) {
    const analysis = await analyzeSingleReview(review.text);
    output.push({
      ...review,
      sentimentScore: Number(analysis.score.toFixed(2)),
      sentimentLabel: analysis.label,
      topics: analysis.topics,
    });
  }

  return output;
}

export function summarizeSentiment(reviews: ReviewRecord[]) {
  if (reviews.length === 0) {
    return {
      avgSentiment: 0,
      avgRating: 0,
      topIssues: [],
      suggestions: [],
      platformBreakdown: [],
    };
  }

  const avgSentiment = reviews.reduce((sum, review) => sum + (review.sentimentScore ?? 0), 0) / reviews.length;
  const avgRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
  const topIssues = computeTopIssues(reviews);
  const suggestions = buildSuggestions(topIssues);

  return {
    avgSentiment: Number(avgSentiment.toFixed(2)),
    avgRating: Number(avgRating.toFixed(2)),
    topIssues,
    suggestions,
    platformBreakdown: buildPlatformBreakdown(reviews),
  };
}
