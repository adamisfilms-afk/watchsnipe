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

export function reorderSavedItems(orderedIds: string[]): void {
  const items = getSavedItems();
  const map = new Map(items.map((i) => [i.id, i]));
  const reordered = orderedIds.map((id) => map.get(id)).filter(Boolean) as typeof items;
  localStorage.setItem(SAVED_ITEMS_KEY, JSON.stringify(reordered));
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
