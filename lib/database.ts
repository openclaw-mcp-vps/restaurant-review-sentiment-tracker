import crypto from "node:crypto";
import path from "node:path";
import { promises as fs } from "node:fs";

export type ReviewPlatform = "google" | "yelp" | "tripadvisor";
export type SentimentLabel = "positive" | "neutral" | "negative";

export interface RestaurantRecord {
  id: string;
  name: string;
  ownerEmail: string;
  googleUrl: string;
  yelpUrl: string;
  tripadvisorUrl: string;
  createdAt: string;
  updatedAt: string;
  lastSyncedAt: string | null;
}

export interface ReviewRecord {
  id: string;
  sourceId: string;
  restaurantId: string;
  platform: ReviewPlatform;
  author: string;
  rating: number;
  text: string;
  publishedAt: string;
  sourceUrl: string;
  sentimentScore: number | null;
  sentimentLabel: SentimentLabel | null;
  topics: string[];
  createdAt: string;
}

export interface PlatformBreakdown {
  platform: ReviewPlatform;
  avgSentiment: number;
  avgRating: number;
  reviewCount: number;
}

export interface Suggestion {
  issue: string;
  action: string;
  expectedImpact: string;
}

export interface SentimentSnapshot {
  id: string;
  restaurantId: string;
  avgSentiment: number;
  avgRating: number;
  topIssues: string[];
  suggestions: Suggestion[];
  platformBreakdown: PlatformBreakdown[];
  generatedAt: string;
}

export interface PurchaseRecord {
  email: string;
  token: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  source: "stripe";
}

interface SyncLog {
  id: string;
  restaurantId: string;
  syncedAt: string;
  source: "manual" | "cron";
  details: string;
}

interface StoreShape {
  restaurants: RestaurantRecord[];
  reviews: ReviewRecord[];
  analyses: SentimentSnapshot[];
  purchases: PurchaseRecord[];
  syncLogs: SyncLog[];
}

const dataDir = path.join(process.cwd(), ".data");
const dataFile = path.join(dataDir, "store.json");

const emptyStore: StoreShape = {
  restaurants: [],
  reviews: [],
  analyses: [],
  purchases: [],
  syncLogs: [],
};

async function ensureStoreFile() {
  await fs.mkdir(dataDir, { recursive: true });

  try {
    await fs.access(dataFile);
  } catch {
    await fs.writeFile(dataFile, JSON.stringify(emptyStore, null, 2), "utf8");
  }
}

async function readStore(): Promise<StoreShape> {
  await ensureStoreFile();
  const raw = await fs.readFile(dataFile, "utf8");
  try {
    return JSON.parse(raw) as StoreShape;
  } catch {
    return emptyStore;
  }
}

async function writeStore(store: StoreShape) {
  await ensureStoreFile();
  await fs.writeFile(dataFile, JSON.stringify(store, null, 2), "utf8");
}

function now() {
  return new Date().toISOString();
}

function makeId(prefix: string) {
  return `${prefix}_${crypto.randomBytes(8).toString("hex")}`;
}

export async function ensureDefaultRestaurant() {
  const store = await readStore();
  if (store.restaurants.length > 0) {
    return store.restaurants[0];
  }

  const timestamp = now();
  const restaurant: RestaurantRecord = {
    id: makeId("rest"),
    name: "Demo Bistro",
    ownerEmail: "owner@example.com",
    googleUrl: "https://www.google.com/maps",
    yelpUrl: "https://www.yelp.com",
    tripadvisorUrl: "https://www.tripadvisor.com",
    createdAt: timestamp,
    updatedAt: timestamp,
    lastSyncedAt: null,
  };

  store.restaurants.push(restaurant);
  await writeStore(store);
  return restaurant;
}

export async function upsertRestaurant(input: {
  id?: string;
  name: string;
  ownerEmail: string;
  googleUrl: string;
  yelpUrl: string;
  tripadvisorUrl: string;
}) {
  const store = await readStore();
  const existing = input.id
    ? store.restaurants.find((restaurant) => restaurant.id === input.id)
    : store.restaurants.find((restaurant) => restaurant.ownerEmail === input.ownerEmail.toLowerCase());
  const timestamp = now();

  if (existing) {
    existing.name = input.name;
    existing.ownerEmail = input.ownerEmail.toLowerCase();
    existing.googleUrl = input.googleUrl;
    existing.yelpUrl = input.yelpUrl;
    existing.tripadvisorUrl = input.tripadvisorUrl;
    existing.updatedAt = timestamp;
    await writeStore(store);
    return existing;
  }

  const created: RestaurantRecord = {
    id: makeId("rest"),
    name: input.name,
    ownerEmail: input.ownerEmail.toLowerCase(),
    googleUrl: input.googleUrl,
    yelpUrl: input.yelpUrl,
    tripadvisorUrl: input.tripadvisorUrl,
    createdAt: timestamp,
    updatedAt: timestamp,
    lastSyncedAt: null,
  };

  store.restaurants.push(created);
  await writeStore(store);
  return created;
}

export async function listRestaurants() {
  const store = await readStore();
  return store.restaurants;
}

export async function getRestaurantById(id: string) {
  const store = await readStore();
  return store.restaurants.find((restaurant) => restaurant.id === id) ?? null;
}

export async function addOrUpdateReviews(
  restaurantId: string,
  reviews: Array<Omit<ReviewRecord, "id" | "createdAt" | "restaurantId">>,
) {
  const store = await readStore();
  const createdAt = now();

  for (const review of reviews) {
    const existing = store.reviews.find(
      (row) => row.restaurantId === restaurantId && row.platform === review.platform && row.sourceId === review.sourceId,
    );

    if (existing) {
      existing.author = review.author;
      existing.rating = review.rating;
      existing.text = review.text;
      existing.publishedAt = review.publishedAt;
      existing.sourceUrl = review.sourceUrl;
      existing.sentimentScore = review.sentimentScore;
      existing.sentimentLabel = review.sentimentLabel;
      existing.topics = review.topics;
      continue;
    }

    store.reviews.push({
      id: makeId("review"),
      restaurantId,
      createdAt,
      ...review,
    });
  }

  const restaurant = store.restaurants.find((item) => item.id === restaurantId);
  if (restaurant) {
    restaurant.lastSyncedAt = now();
    restaurant.updatedAt = now();
  }

  await writeStore(store);

  return store.reviews.filter((review) => review.restaurantId === restaurantId);
}

export async function listReviewsByRestaurant(restaurantId: string) {
  const store = await readStore();
  return store.reviews
    .filter((review) => review.restaurantId === restaurantId)
    .sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
}

export async function saveSentimentSnapshot(snapshot: Omit<SentimentSnapshot, "id" | "generatedAt">) {
  const store = await readStore();

  const entity: SentimentSnapshot = {
    id: makeId("snapshot"),
    generatedAt: now(),
    ...snapshot,
  };

  store.analyses.push(entity);
  await writeStore(store);
  return entity;
}

export async function getLatestSentimentSnapshot(restaurantId: string) {
  const store = await readStore();
  return (
    store.analyses
      .filter((analysis) => analysis.restaurantId === restaurantId)
      .sort((a, b) => new Date(b.generatedAt).getTime() - new Date(a.generatedAt).getTime())[0] ?? null
  );
}

export async function logSync(restaurantId: string, source: "manual" | "cron", details: string) {
  const store = await readStore();
  store.syncLogs.push({
    id: makeId("sync"),
    restaurantId,
    syncedAt: now(),
    source,
    details,
  });
  await writeStore(store);
}

export async function recordSuccessfulStripePurchase(email: string) {
  const store = await readStore();
  const normalized = email.toLowerCase().trim();
  const timestamp = now();
  const current = store.purchases.find((purchase) => purchase.email === normalized);

  if (current) {
    current.active = true;
    current.updatedAt = timestamp;
    await writeStore(store);
    return current;
  }

  const record: PurchaseRecord = {
    email: normalized,
    token: crypto.randomBytes(24).toString("hex"),
    active: true,
    source: "stripe",
    createdAt: timestamp,
    updatedAt: timestamp,
  };

  store.purchases.push(record);
  await writeStore(store);
  return record;
}

export async function claimAccessTokenByEmail(email: string) {
  const store = await readStore();
  const normalized = email.toLowerCase().trim();
  const purchase = store.purchases.find((item) => item.email === normalized && item.active);
  return purchase?.token ?? null;
}

export async function hasActiveAccessToken(token: string) {
  if (!token) {
    return false;
  }

  const store = await readStore();
  return store.purchases.some((purchase) => purchase.active && purchase.token === token);
}
