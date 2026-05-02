"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PlatformBreakdown } from "@/lib/database";

export function SentimentChart({ data }: { data: PlatformBreakdown[] }) {
  return (
    <div className="glass h-[320px] rounded-xl p-4">
      <h3 className="mb-4 text-lg font-semibold text-slate-100">Platform Sentiment Snapshot</h3>
      <ResponsiveContainer width="100%" height="88%">
        <BarChart data={data} margin={{ top: 10, right: 12, left: -10, bottom: 2 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
          <XAxis dataKey="platform" stroke="#9ca3af" tickLine={false} axisLine={false} />
          <YAxis stroke="#9ca3af" tickLine={false} axisLine={false} />
          <Tooltip
            cursor={{ fill: "rgba(148, 163, 184, 0.1)" }}
            contentStyle={{
              background: "#0f172a",
              border: "1px solid #334155",
              borderRadius: 10,
              color: "#e2e8f0",
            }}
          />
          <Legend />
          <Bar dataKey="avgSentiment" fill="#34d399" name="Avg Sentiment" radius={[6, 6, 0, 0]} />
          <Bar dataKey="avgRating" fill="#60a5fa" name="Avg Rating" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
