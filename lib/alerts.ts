import nodemailer from "nodemailer";
import type { Suggestion } from "@/lib/database";

export async function sendSentimentDropAlert(input: {
  to: string;
  restaurantName: string;
  avgSentiment: number;
  avgRating: number;
  topIssues: string[];
  suggestions: Suggestion[];
}) {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || "587");
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.ALERT_FROM_EMAIL || "alerts@reviewpulse.local";

  if (!host || !user || !pass) {
    return;
  }

  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const issueList = input.topIssues.length > 0 ? input.topIssues.join(", ") : "No dominant issue detected";
  const suggestionLines = input.suggestions
    .map((suggestion) => `- ${suggestion.issue}: ${suggestion.action} (${suggestion.expectedImpact})`)
    .join("\n");

  await transport.sendMail({
    from,
    to: input.to,
    subject: `ReviewPulse Alert: Sentiment Drop for ${input.restaurantName}`,
    text: [
      `Average sentiment dropped to ${input.avgSentiment.toFixed(2)} and average rating is ${input.avgRating.toFixed(2)}.`,
      `Top issue themes: ${issueList}`,
      "",
      "Recommended actions:",
      suggestionLines || "- Keep monitoring new reviews for issue clusters.",
    ].join("\n"),
  });
}
