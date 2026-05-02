import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { claimAccessTokenByEmail } from "@/lib/database";

async function unlock(formData: FormData) {
  "use server";

  const email = String(formData.get("email") || "").trim().toLowerCase();
  const token = await claimAccessTokenByEmail(email);

  if (!token) {
    return;
  }

  (await cookies()).set("reviewpulse_access", token, {
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/dashboard");
}

export default function UnlockPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-6 py-12">
      <div className="glass w-full rounded-2xl p-8">
        <h1 className="text-3xl font-semibold text-slate-50">Unlock your dashboard</h1>
        <p className="mt-3 text-sm text-slate-300">
          Enter the same email used during Stripe checkout. If your payment is confirmed by webhook, dashboard access is enabled instantly.
        </p>
        <form action={unlock} className="mt-6 space-y-4">
          <label className="block text-sm text-slate-300" htmlFor="email">
            Purchase Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-slate-100 outline-none ring-0 transition focus:border-emerald-400"
            placeholder="owner@restaurant.com"
          />
          <button
            type="submit"
            className="w-full rounded-lg bg-emerald-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-emerald-400"
          >
            Unlock Access
          </button>
        </form>
      </div>
    </main>
  );
}
