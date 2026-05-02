import { MessageSquareText, Star } from "lucide-react";
import type { ReviewRecord } from "@/lib/database";

function sentimentTone(label: ReviewRecord["sentimentLabel"]) {
  if (label === "positive") {
    return "text-emerald-300 border-emerald-500/30 bg-emerald-500/10";
  }
  if (label === "negative") {
    return "text-rose-300 border-rose-500/30 bg-rose-500/10";
  }
  return "text-slate-300 border-slate-500/40 bg-slate-500/10";
}

export function ReviewCard({ review }: { review: ReviewRecord }) {
  return (
    <article className="glass rounded-xl p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-300">
          <MessageSquareText className="h-4 w-4 text-cyan-300" />
          <span className="font-medium text-slate-100">{review.author}</span>
          <span>on {review.platform}</span>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-xs ${sentimentTone(review.sentimentLabel)}`}>
          {review.sentimentLabel || "unscored"}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-1 text-amber-300">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`h-4 w-4 ${index < Math.round(review.rating) ? "fill-current" : "text-slate-600"}`}
          />
        ))}
        <span className="ml-2 text-xs text-slate-400">{review.rating.toFixed(1)} / 5</span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-slate-200">{review.text}</p>

      {review.topics.length > 0 ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {review.topics.map((topic) => (
            <span key={topic} className="rounded-md border border-slate-700 px-2 py-1 text-xs text-slate-300">
              {topic}
            </span>
          ))}
        </div>
      ) : null}

      <p className="mt-4 text-xs text-slate-500">{new Date(review.publishedAt).toLocaleString()}</p>
    </article>
  );
}
