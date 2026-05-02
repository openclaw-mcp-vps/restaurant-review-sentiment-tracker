import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { recordSuccessfulStripePurchase } from "@/lib/database";

export const runtime = "nodejs";

function safeCompare(a: string, b: string) {
  const aBuffer = Buffer.from(a, "utf8");
  const bBuffer = Buffer.from(b, "utf8");

  if (aBuffer.length !== bBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(aBuffer, bBuffer);
}

function verifyStripeSignature(payload: string, signatureHeader: string, secret: string) {
  const entries = signatureHeader.split(",").map((entry) => entry.trim());
  const timestamp = entries.find((entry) => entry.startsWith("t="))?.replace("t=", "");
  const signatures = entries.filter((entry) => entry.startsWith("v1=")).map((entry) => entry.replace("v1=", ""));

  if (!timestamp || signatures.length === 0) {
    return false;
  }

  const signedPayload = `${timestamp}.${payload}`;
  const expected = crypto.createHmac("sha256", secret).update(signedPayload, "utf8").digest("hex");

  const isValid = signatures.some((signature) => safeCompare(signature, expected));
  const isRecent = Math.abs(Date.now() / 1000 - Number(timestamp)) <= 300;

  return isValid && isRecent;
}

export async function POST(request: Request) {
  const rawPayload = await request.text();
  const signature = request.headers.get("stripe-signature") || "";
  const secret = process.env.STRIPE_WEBHOOK_SECRET || "";

  if (!secret) {
    return NextResponse.json({ error: "Webhook secret is not configured" }, { status: 500 });
  }

  const valid = verifyStripeSignature(rawPayload, signature, secret);
  if (!valid) {
    return NextResponse.json({ error: "Invalid webhook signature" }, { status: 400 });
  }

  const event = JSON.parse(rawPayload) as {
    type: string;
    data?: {
      object?: {
        customer_email?: string;
        customer_details?: {
          email?: string;
        };
      };
    };
  };

  if (event.type === "checkout.session.completed") {
    const email = event.data?.object?.customer_email || event.data?.object?.customer_details?.email;
    if (email) {
      await recordSuccessfulStripePurchase(email);
    }
  }

  return NextResponse.json({ received: true, eventType: event.type });
}
