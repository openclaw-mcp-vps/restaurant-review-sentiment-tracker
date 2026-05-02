import Link from "next/link";
import { BarChart3, BellRing, Brain, MessageSquareQuote, Store, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const faqs = [
  {
    q: "How does ReviewPulse collect reviews?",
    a: "ReviewPulse runs scheduled collectors for each configured listing URL, normalizes review text and star ratings, and appends new entries to your restaurant timeline.",
  },
  {
    q: "How quickly are sentiment alerts sent?",
    a: "Alert checks run after each sync window. If average sentiment or star rating drops below your threshold, the dashboard flags it immediately and marks likely causes.",
  },
  {
    q: "Do I need technical setup?",
    a: "No engineering team needed. Add your Google, Yelp, and TripAdvisor listing links, set review goals, and ReviewPulse starts tracking automatically.",
  },
  {
    q: "What does the $12 plan include?",
    a: "One restaurant profile, continuous review monitoring, AI sentiment summaries, weekly improvement suggestions, and downgrade alerts.",
  },
];

const paymentHref = process.env.NEXT_PUBLIC_STRIPE_PAYMENT_LINK || "#";

export default function LandingPage() {
  return (
    <main className="grid-bg min-h-screen">
      <section className="mx-auto max-w-6xl px-6 pb-20 pt-12 sm:px-8 md:pt-20">
        <header className="mb-14 flex items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-100">
            <Store className="h-5 w-5 text-emerald-400" />
            ReviewPulse
          </div>
          <Link
            href="/dashboard"
            className="rounded-full border border-slate-700 px-4 py-2 text-sm text-slate-200 transition hover:border-slate-500"
          >
            Dashboard
          </Link>
        </header>

        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr] md:items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/60 px-3 py-1 text-xs font-medium text-emerald-300">
              <MessageSquareQuote className="h-3.5 w-3.5" />
              Built for independent restaurants and hospitality managers
            </p>
            <h1 className="text-4xl font-semibold leading-tight text-slate-50 sm:text-5xl">
              Track restaurant review sentiment across all platforms.
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">
              85% of diners read reviews before deciding where to eat. ReviewPulse consolidates Google, Yelp, and TripAdvisor feedback so you can spot service issues early, protect rating momentum, and improve repeat visits.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button href={paymentHref}>Start Monitoring for $12/mo</Button>
              <Link
                href="/unlock"
                className="rounded-full border border-slate-600 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:border-slate-400"
              >
                I Already Purchased
              </Link>
            </div>
          </div>

          <Card className="rounded-2xl p-6">
            <h2 className="text-xl font-semibold text-slate-100">What owners see in the first week</h2>
            <ul className="mt-5 space-y-4 text-sm text-slate-300">
              <li className="flex items-start gap-3">
                <TrendingDown className="mt-0.5 h-4 w-4 text-rose-400" />
                Detect sentiment drops tied to wait times, cleanliness, or order mistakes.
              </li>
              <li className="flex items-start gap-3">
                <Brain className="mt-0.5 h-4 w-4 text-indigo-300" />
                Get AI suggestions that map complaints to operational fixes your staff can execute.
              </li>
              <li className="flex items-start gap-3">
                <BellRing className="mt-0.5 h-4 w-4 text-amber-300" />
                Receive proactive alert flags before low ratings compound across platforms.
              </li>
              <li className="flex items-start gap-3">
                <BarChart3 className="mt-0.5 h-4 w-4 text-cyan-300" />
                Compare platform-level sentiment and keep score by week and issue category.
              </li>
            </ul>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20 sm:px-8">
        <div className="grid gap-5 md:grid-cols-3">
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-100">The Problem</h3>
            <p className="mt-3 text-sm text-slate-300">
              Reviews are scattered across platforms and arrive daily. Owners often notice rating declines only after foot traffic is already impacted.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-100">The Solution</h3>
            <p className="mt-3 text-sm text-slate-300">
              ReviewPulse centralizes raw feedback, scores sentiment per review, and highlights top recurring issues with practical next actions.
            </p>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-slate-100">The Outcome</h3>
            <p className="mt-3 text-sm text-slate-300">
              Teams act faster, reduce negative review streaks, and improve customer experience with clear operational priorities.
            </p>
          </Card>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-20 sm:px-8">
        <div className="glass rounded-2xl p-8 text-center">
          <h2 className="text-3xl font-semibold text-slate-50">Simple pricing for one location</h2>
          <p className="mx-auto mt-4 max-w-xl text-slate-300">
            $12/month for continuous review monitoring, AI sentiment analysis, and improvement playbooks designed for local restaurants.
          </p>
          <a
            href={paymentHref}
            className="mt-7 inline-block rounded-full bg-emerald-500 px-7 py-3 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Buy ReviewPulse
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-6 pb-24 sm:px-8">
        <h2 className="mb-6 text-2xl font-semibold text-slate-100">FAQ</h2>
        <div className="space-y-4">
          {faqs.map((item) => (
            <article key={item.q} className="glass rounded-xl p-5">
              <h3 className="text-base font-semibold text-slate-100">{item.q}</h3>
              <p className="mt-2 text-sm text-slate-300">{item.a}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
