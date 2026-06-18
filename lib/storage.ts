import { SavedItem, SavedSearch, EbayListing, SearchFilters } from "./types";

const SAVED_ITEMS_KEY = "watchsnipe_saved_items";
const FILTERS_KEY = "watchsnipe_filters";

export function getSavedItems(): SavedItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_ITEMS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveItem(listing: EbayListing): SavedItem {
  const items = getSavedItems();
  const existing = items.find((i) => i.id === listing.itemId);
  if (existing) return existing;

  const newItem: SavedItem = {
    id: listing.itemId,
    listing,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify([newItem, ...items]));
  return newItem;
}

export function removeSavedItem(itemId: string): void {
  const items = getSavedItems().filter((i) => i.id !== itemId);
  localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(items));
}

export function isItemSaved(itemId: string): boolean {
  return getSavedItems().some((i) => i.id === itemId);
}

export function updateItemNotes(itemId: string, notes: string): void {
  const items = getSavedItems().map((i) =>
    i.id === itemId ? { ...i, notes } : i
  );
  localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(items));
}

const VIEWED_ITEMS_KEY = "watchsnipe_viewed_items";

export function getViewedItems(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(VIEWED_ITEMS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

export function markViewed(itemId: string): void {
  const viewed = getViewedItems();
  if (viewed.has(itemId)) return;
  viewed.add(itemId);
  localStorage.setItem(VIEWED_ITEMS_KEY, JSON.stringify([...viewed]));
}

export function clearViewedItems(): void {
  localStorage.removeItem(VIEWED_ITEMS_KEY);
}

const SAVED_SEARCHES_KEY = "watchsnipe_saved_searches";

export function getSavedSearches(): SavedSearch[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SAVED_SEARCHES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSearch(name: string, filters: SearchFilters): SavedSearch {
  const searches = getSavedSearches();
  const newSearch: SavedSearch = {
    id: Date.now().toString(),
    name,
    filters,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify([newSearch, ...searches]));
  return newSearch;
}

export function removeSavedSearch(id: string): void {
  const searches = getSavedSearches().filter((s) => s.id !== id);
  localStorage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(searches));
}

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
