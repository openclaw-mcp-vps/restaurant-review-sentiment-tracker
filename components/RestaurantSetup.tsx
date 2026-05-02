"use client";

import { useState, useTransition } from "react";

type RestaurantSetupProps = {
  initial: {
    id?: string;
    name?: string;
    ownerEmail?: string;
    googleUrl?: string;
    yelpUrl?: string;
    tripadvisorUrl?: string;
  };
};

export function RestaurantSetup({ initial }: RestaurantSetupProps) {
  const [message, setMessage] = useState<string>("");
  const [pending, startTransition] = useTransition();

  return (
    <section className="glass rounded-xl p-5">
      <h2 className="text-lg font-semibold text-slate-100">Restaurant Setup</h2>
      <p className="mt-1 text-sm text-slate-400">
        Save listing URLs and run an immediate sync to refresh sentiment metrics.
      </p>

      <form
        className="mt-5 space-y-3"
        onSubmit={(event) => {
          event.preventDefault();
          const form = event.currentTarget;
          const formData = new FormData(form);

          startTransition(async () => {
            setMessage("Saving and syncing reviews...");

            const body = {
              source: "manual",
              restaurant: {
                id: String(formData.get("id") || ""),
                name: String(formData.get("name") || ""),
                ownerEmail: String(formData.get("ownerEmail") || ""),
                googleUrl: String(formData.get("googleUrl") || ""),
                yelpUrl: String(formData.get("yelpUrl") || ""),
                tripadvisorUrl: String(formData.get("tripadvisorUrl") || ""),
              },
            };

            const response = await fetch("/api/reviews/sync", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify(body),
            });

            if (!response.ok) {
              const payload = (await response.json().catch(() => ({}))) as { error?: string };
              setMessage(payload.error || "Sync failed. Check your listing URLs and try again.");
              return;
            }

            setMessage("Sync completed. Refreshing dashboard...");
            window.location.reload();
          });
        }}
      >
        <input type="hidden" name="id" defaultValue={initial.id || ""} />
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300" htmlFor="name">
            Restaurant Name
          </label>
          <input
            id="name"
            name="name"
            required
            defaultValue={initial.name || ""}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300" htmlFor="ownerEmail">
            Owner Email
          </label>
          <input
            id="ownerEmail"
            name="ownerEmail"
            type="email"
            required
            defaultValue={initial.ownerEmail || ""}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300" htmlFor="googleUrl">
            Google Listing URL
          </label>
          <input
            id="googleUrl"
            name="googleUrl"
            type="url"
            required
            defaultValue={initial.googleUrl || "https://www.google.com/maps"}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300" htmlFor="yelpUrl">
            Yelp Listing URL
          </label>
          <input
            id="yelpUrl"
            name="yelpUrl"
            type="url"
            required
            defaultValue={initial.yelpUrl || "https://www.yelp.com"}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs font-medium text-slate-300" htmlFor="tripadvisorUrl">
            TripAdvisor Listing URL
          </label>
          <input
            id="tripadvisorUrl"
            name="tripadvisorUrl"
            type="url"
            required
            defaultValue={initial.tripadvisorUrl || "https://www.tripadvisor.com"}
            className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 outline-none transition focus:border-emerald-400"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Syncing..." : "Save and Sync Reviews"}
        </button>

        {message ? <p className="text-xs text-slate-300">{message}</p> : null}
      </form>
    </section>
  );
}
