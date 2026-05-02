import Link from "next/link";
import { cookies } from "next/headers";
import { AlertTriangle, CheckCircle2, Clock3, Star } from "lucide-react";
import { RestaurantSetup } from "@/components/RestaurantSetup";
import { ReviewCard } from "@/components/ReviewCard";
import { SentimentChart } from "@/components/SentimentChart";
import {
  ensureDefaultRestaurant,
  getLatestSentimentSnapshot,
  hasActiveAccessToken,
  listReviewsByRestaurant,
} from "@/lib/database";
import { getStripeHostedCheckoutLink } from "@/lib/lemonsqueezy";
import { summarizeSentiment } from "@/lib/sentiment";

function sentimentPill(value: number) {
  if (value > 0.2) {
    return { label: "Healthy", className: "bg-emerald-500/15 border-emerald-500/40 text-emerald-300" };
  }
  if (value < -0.2) {
    return { label: "Needs Attention", className: "bg-rose-500/15 border-rose-500/40 text-rose-300" };
  }
  return { label: "Watch", className: "bg-amber-500/15 border-amber-500/40 text-amber-300" };
}

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get("reviewpulse_access")?.value ?? "";
  const hasAccess = await hasActiveAccessToken(accessToken);

  if (!hasAccess) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-6 py-12">
        <section className="glass w-full rounded-2xl p-8 text-center">
          <AlertTriangle className="mx-auto h-10 w-10 text-amber-300" />
          <h1 className="mt-4 text-3xl font-semibold text-slate-50">Dashboard Locked</h1>
          <p className="mx-auto mt-3 max-w-xl text-slate-300">
            Purchase access to monitor sentiment trends, sync new reviews, and receive actionable recommendations.
          </p>
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <a
              href={getStripeHostedCheckoutLink()}
              className="rounded-full bg-emerald-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
            >
              Buy for $12/mo
            </a>
            <Link
              href="/unlock"
              className="rounded-full border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-400"
            >
              I Already Purchased
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const restaurant = await ensureDefaultRestaurant();
  const reviews = await listReviewsByRestaurant(restaurant.id);
  const latestSnapshot = await getLatestSentimentSnapshot(restaurant.id);
  const fallbackSummary = summarizeSentiment(reviews);

  const summary = latestSnapshot
    ? {
        avgSentiment: latestSnapshot.avgSentiment,
        avgRating: latestSnapshot.avgRating,
        topIssues: latestSnapshot.topIssues,
        suggestions: latestSnapshot.suggestions,
        platformBreakdown: latestSnapshot.platformBreakdown,
      }
    : fallbackSummary;

  const tone = sentimentPill(summary.avgSentiment);

  return (
    <main className="mx-auto max-w-7xl px-6 pb-14 pt-8 sm:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-semibold text-slate-50">{restaurant.name} Sentiment Dashboard</h1>
          <p className="mt-1 text-sm text-slate-400">Cross-platform review intelligence for day-to-day operations.</p>
        </div>
        <Link
          href="/"
          className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
        >
          Back to Site
        </Link>
      </header>

      <section className="mb-6 grid gap-4 md:grid-cols-3">
        <article className="glass rounded-xl p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Average Sentiment</p>
          <p className="mt-2 text-3xl font-semibold text-slate-100">{summary.avgSentiment.toFixed(2)}</p>
          <span className={`mt-3 inline-flex rounded-full border px-2.5 py-1 text-xs ${tone.className}`}>{tone.label}</span>
        </article>
        <article className="glass rounded-xl p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Average Rating</p>
          <p className="mt-2 flex items-center gap-2 text-3xl font-semibold text-slate-100">
            <Star className="h-6 w-6 text-amber-300" />
            {summary.avgRating.toFixed(2)}
          </p>
          <p className="mt-3 text-xs text-slate-400">Across {reviews.length} total reviews</p>
        </article>
        <article className="glass rounded-xl p-5">
          <p className="text-xs uppercase tracking-wide text-slate-400">Last Sync</p>
          <p className="mt-2 flex items-center gap-2 text-lg font-semibold text-slate-100">
            <Clock3 className="h-5 w-5 text-cyan-300" />
            {restaurant.lastSyncedAt ? new Date(restaurant.lastSyncedAt).toLocaleString() : "Never"}
          </p>
          <p className="mt-3 text-xs text-slate-400">Run a sync after service changes to validate impact quickly.</p>
        </article>
      </section>

      <section className="mb-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <SentimentChart data={summary.platformBreakdown} />
        <RestaurantSetup
          initial={{
            id: restaurant.id,
            name: restaurant.name,
            ownerEmail: restaurant.ownerEmail,
            googleUrl: restaurant.googleUrl,
            yelpUrl: restaurant.yelpUrl,
            tripadvisorUrl: restaurant.tripadvisorUrl,
          }}
        />
      </section>

      <section className="mb-8 grid gap-4 md:grid-cols-3">
        <article className="glass rounded-xl p-5 md:col-span-3">
          <h2 className="text-lg font-semibold text-slate-100">Recommended Next Actions</h2>
          {summary.suggestions.length > 0 ? (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              {summary.suggestions.map((item) => (
                <div key={item.issue} className="rounded-lg border border-slate-700 bg-slate-900/50 p-4">
                  <h3 className="font-semibold text-slate-100">{item.issue}</h3>
                  <p className="mt-2 text-sm text-slate-300">{item.action}</p>
                  <p className="mt-2 text-xs text-emerald-300">Impact: {item.expectedImpact}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 flex items-center gap-2 text-sm text-emerald-300">
              <CheckCircle2 className="h-4 w-4" />
              No critical issue clusters detected yet. Keep syncing to maintain visibility.
            </p>
          )}
        </article>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold text-slate-100">Latest Reviews</h2>
        {reviews.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2">
            {reviews.slice(0, 8).map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        ) : (
          <div className="glass rounded-xl p-5 text-sm text-slate-300">
            No reviews synced yet. Add listing URLs and click <span className="font-semibold">Save and Sync Reviews</span>.
          </div>
        )}
      </section>
    </main>
  );
}
