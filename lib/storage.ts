import { SavedItem, SavedSearch, SearchFilters } from "./types";

const FILTERS_KEY = "watchsnipe_filters";

export interface StoreData {
  savedItems: SavedItem[];
  savedSearches: SavedSearch[];
  viewedItems: string[];
}

const EMPTY: StoreData = { savedItems: [], savedSearches: [], viewedItems: [] };

// Loads all server-persisted data in one round trip.
export async function fetchAllData(): Promise<StoreData> {
  try {
    const res = await fetch("/api/store");
    if (!res.ok) return EMPTY;
    const data = await res.json();
    return {
      savedItems: data.savedItems ?? [],
      savedSearches: data.savedSearches ?? [],
      viewedItems: data.viewedItems ?? [],
    };
  } catch {
    return EMPTY;
  }
}

type StoreKey = keyof StoreData;

async function persist(key: StoreKey, value: unknown): Promise<void> {
  try {
    await fetch("/api/store", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  } catch {
    // Offline or storage unconfigured — local React state stays authoritative.
  }
}

export const persistSavedItems = (items: SavedItem[]) => persist("savedItems", items);
export const persistSavedSearches = (searches: SavedSearch[]) => persist("savedSearches", searches);
export const persistViewedItems = (ids: string[]) => persist("viewedItems", ids);

// Filters stay device-local — they're a per-session convenience, not shared state.
export function getStoredFilters(): Partial<SearchFilters> | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(FILTERS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function storeFilters(filters: SearchFilters): void {
  localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
}
