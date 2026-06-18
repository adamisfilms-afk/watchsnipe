import { NextRequest, NextResponse } from "next/server";
import { Redis } from "@upstash/redis";
import { SavedItem, SavedSearch } from "@/lib/types";

const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
const redis = url && token ? new Redis({ url, token }) : null;

const KEYS = {
  savedItems: "watchsnipe:savedItems",
  savedSearches: "watchsnipe:savedSearches",
  viewedItems: "watchsnipe:viewedItems",
} as const;

type StoreKey = keyof typeof KEYS;

export async function GET() {
  if (!redis) {
    return NextResponse.json({
      savedItems: [],
      savedSearches: [],
      viewedItems: [],
      configured: false,
    });
  }

  const [savedItems, savedSearches, viewedItems] = await Promise.all([
    redis.get<SavedItem[]>(KEYS.savedItems),
    redis.get<SavedSearch[]>(KEYS.savedSearches),
    redis.get<string[]>(KEYS.viewedItems),
  ]);

  return NextResponse.json({
    savedItems: savedItems ?? [],
    savedSearches: savedSearches ?? [],
    viewedItems: viewedItems ?? [],
    configured: true,
  });
}

export async function PUT(req: NextRequest) {
  if (!redis) {
    return NextResponse.json({ error: "Storage not configured" }, { status: 503 });
  }

  const body = await req.json().catch(() => null);
  if (!body || typeof body.key !== "string" || !(body.key in KEYS)) {
    return NextResponse.json({ error: "Invalid key" }, { status: 400 });
  }

  await redis.set(KEYS[body.key as StoreKey], body.value);
  return NextResponse.json({ ok: true });
}
