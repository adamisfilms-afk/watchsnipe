import { SavedItem, SavedSearch, SearchFilters } from "./types";

const FILTERS_KEY = "watchsnipe_filters";

export interface StoreData {
  savedItems: SavedItem[];
  savedSearches: SavedSearch[];
  viewedItems: string[];
}

const EMPTY: StoreData = { savedItems: [], savedSearches: [], viewedItems: [] };

type StoreKey = keyof StoreData;

const LOCAL_KEYS: Record<StoreKey, string> = {
  savedItems: "watchsnipe_savedItems",
  savedSearches: "watchsnipe_savedSearches",
  viewedItems: "watchsnipe_viewedItems",
};

function readLocal<T>(key: StoreKey, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(LOCAL_KEYS[key]);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeLocal(key: StoreKey, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(LOCAL_KEYS[key], JSON.stringify(value));
  } catch {
    // Quota or private-mode failure — server (if configured) stays authoritative.
  }
}

// Loads all persisted data. Prefers the server store when configured (cross-device),
// otherwise falls back to this device's localStorage so data survives a refresh.
export async function fetchAllData(): Promise<StoreData> {
  try {
    const res = await fetch("/api/store");
    if (res.ok) {
      const data = await res.json();
      if (data.configured) {
        const server: StoreData = {
          savedItems: data.savedItems ?? [],
          savedSearches: data.savedSearches ?? [],
          viewedItems: data.viewedItems ?? [],
        };
        // Mirror locally so a later offline refresh still has the latest data.
        writeLocal("savedItems", server.savedItems);
        writeLocal("savedSearches", server.savedSearches);
        writeLocal("viewedItems", server.viewedItems);
        return server;
      }
    }
  } catch {
    // Network failure — fall through to local.
  }
  return {
    savedItems: readLocal("savedItems", EMPTY.savedItems),
    savedSearches: readLocal("savedSearches", EMPTY.savedSearches),
    viewedItems: readLocal("viewedItems", EMPTY.viewedItems),
  };
}

async function persist(key: StoreKey, value: unknown): Promise<void> {
  // Always persist locally so a refresh works even without a server store.
  writeLocal(key, value);
  try {
    await fetch("/api/store", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value }),
    });
  } catch {
    // Offline or storage unconfigured — local copy stays authoritative.
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
