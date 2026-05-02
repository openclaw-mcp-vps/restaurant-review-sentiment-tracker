import { NextResponse } from "next/server";
import { z } from "zod";
import { claimAccessTokenByEmail } from "@/lib/database";

const schema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Valid purchase email is required." }, { status: 400 });
  }

  const token = await claimAccessTokenByEmail(parsed.data.email);
  if (!token) {
    return NextResponse.json(
      {
        error:
          "No active purchase found for this email yet. Complete Stripe checkout first, then retry after webhook delivery.",
      },
      { status: 403 },
    );
  }

  return NextResponse.json({ token });
}
