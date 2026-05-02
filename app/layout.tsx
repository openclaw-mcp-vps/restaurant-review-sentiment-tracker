import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://reviewpulse.local"),
  title: "ReviewPulse | Restaurant Review Sentiment Tracker",
  description:
    "Track Google, Yelp, and TripAdvisor sentiment in one dashboard. Detect review drops early and get actionable recommendations to improve diner experience.",
  openGraph: {
    title: "ReviewPulse | Track restaurant review sentiment across all platforms",
    description:
      "See review trends across Google, Yelp, and TripAdvisor with AI-powered insights and weekly improvement recommendations.",
    type: "website",
    url: "https://reviewpulse.local",
    siteName: "ReviewPulse",
  },
  twitter: {
    card: "summary_large_image",
    title: "ReviewPulse | Restaurant Review Sentiment Tracker",
    description:
      "Monitor cross-platform restaurant sentiment and receive clear operational recommendations.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#0d1117] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
