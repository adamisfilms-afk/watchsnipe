"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Search,
  Heart,
  SlidersHorizontal,
  X,
  Watch,
  AlertCircle,
  Loader2,
  BookmarkPlus,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { ListingCard } from "@/components/ListingCard";
import { FilterPanel } from "@/components/FilterPanel";
import { SavedItemsPanel } from "@/components/SavedItemsPanel";
import { SavedSearchesPanel } from "@/components/SavedSearchesPanel";
import { EbayListing, SearchFilters, SavedItem, SavedSearch, ALL_MARKETPLACES } from "@/lib/types";
import {
  getSavedItems,
  saveItem,
  removeSavedItem,
  isItemSaved,
  getStoredFilters,
  storeFilters,
  getSavedSearches,
  saveSearch,
  removeSavedSearch,
} from "@/lib/storage";

const PAGE_SIZE = 150;

const DEFAULT_FILTERS: SearchFilters = {
  searchTerms: "rolex submariner, omega seamaster, tag heuer carrera",
  excludedCountries: ["CN"],
  minPrice: undefined,
  maxPrice: undefined,
  condition: [],
  listingType: "all",
  sortOrder: "bestMatch",
};

export default function WatchSnipePage() {
  const [filters, setFilters] = useState<SearchFilters>(DEFAULT_FILTERS);
  const [listings, setListings] = useState<EbayListing[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [savedSearches, setSavedSearches] = useState<SavedSearch[]>([]);
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSaved, setShowSaved] = useState(false);
  const [searchTermsInput, setSearchTermsInput] = useState(DEFAULT_FILTERS.searchTerms);
  const [hasSearched, setHasSearched] = useState(false);
  const [page, setPage] = useState(1);
  // Save search dialog
  const [saveDialogOpen, setSaveDialogOpen] = useState(false);
  const [saveSearchName, setSaveSearchName] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const mainRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const stored = getStoredFilters();
    if (stored) {
      const merged = { ...DEFAULT_FILTERS, ...stored };
      setFilters(merged);
      setSearchTermsInput(merged.searchTerms);
    }
    setSavedItems(getSavedItems());
    setSavedSearches(getSavedSearches());
  }, []);

  const search = useCallback(async (currentFilters: SearchFilters) => {
    const terms = currentFilters.searchTerms
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    if (terms.length === 0) {
      toast.error("Enter at least one search term");
      return;
    }

    abortRef.current?.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    setError(null);
    setHasSearched(true);
    setPage(1);

    // Build query params for a specific term + marketplace + offset
    const buildParams = (term: string, marketplace: string, offset = 0) => {
      const params = new URLSearchParams({ q: term, marketplace, offset: String(offset) });
      if (currentFilters.minPrice) params.set("minPrice", String(currentFilters.minPrice));
      if (currentFilters.maxPrice) params.set("maxPrice", String(currentFilters.maxPrice));
      currentFilters.condition.forEach((c) => params.append("condition", c));
      if (currentFilters.listingType) params.set("listingType", currentFilters.listingType);
      params.set("sort", currentFilters.sortOrder);
      return params;
    };

    const fetchPage = async (term: string, marketplace: string, offset: number) => {
      const res = await fetch(`/api/ebay?${buildParams(term, marketplace, offset).toString()}`, {
        signal: abortRef.current?.signal,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      return res.json();
    };

    try {
      // Fan out: every term × every marketplace, first page all in parallel
      const firstPageJobs = terms.flatMap((term) =>
        ALL_MARKETPLACES.map((mp) => ({ term, marketplace: mp.id }))
      );

      const firstResponses = await Promise.allSettled(
        firstPageJobs.map(({ term, marketplace }) => fetchPage(term, marketplace, 0))
      );

      const allListings: EbayListing[] = [];
      const seen = new Set<string>();
      let firstError: string | null = null;
      const followUpFetches: Promise<unknown>[] = [];

      firstResponses.forEach((result, i) => {
        const { term, marketplace } = firstPageJobs[i];
        if (result.status === "fulfilled") {
          const data = result.value;
          const items: EbayListing[] = data.itemSummaries ?? [];
          for (const item of items) {
            if (!seen.has(item.itemId)) { seen.add(item.itemId); allListings.push(item); }
          }
          // Queue follow-up pages up to 400 additional results per marketplace/term
          const total: number = data.total ?? 0;
          for (let offset = 200; offset < Math.min(total, 400); offset += 200) {
            followUpFetches.push(fetchPage(term, marketplace, offset));
          }
        } else if (!firstError) {
          // Only treat it as a hard error if ALL marketplaces fail
          firstError = result.reason?.message ?? "Unknown error";
        }
      });

      // Fetch follow-up pages
      if (followUpFetches.length > 0) {
        const followUps = await Promise.allSettled(followUpFetches);
        for (const result of followUps) {
          if (result.status === "fulfilled") {
            const items: EbayListing[] = (result.value as { itemSummaries?: EbayListing[] }).itemSummaries ?? [];
            for (const item of items) {
              if (!seen.has(item.itemId)) { seen.add(item.itemId); allListings.push(item); }
            }
          }
        }
      }

      // Only surface an error if we got zero results from everywhere
      if (allListings.length > 0) firstError = null;

      const filtered = allListings.filter(
        (item) =>
          !item.itemLocation?.country ||
          !currentFilters.excludedCountries.includes(item.itemLocation.country)
      );

      setListings(filtered);

      if (firstError && filtered.length === 0) {
        setError(`${firstError}. Check your eBay API credentials in .env.local`);
      } else if (filtered.length === 0 && allListings.length > 0) {
        toast.info(`${allListings.length} results filtered by country exclusions`);
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleSearch = () => {
    const updated = { ...filters, searchTerms: searchTermsInput };
    setFilters(updated);
    storeFilters(updated);
    setActiveSearchId(null);
    search(updated);
  };

  const handleFilterChange = (newFilters: SearchFilters) => {
    setFilters(newFilters);
    storeFilters(newFilters);
  };

  const handleSaveItem = (listing: EbayListing) => {
    saveItem(listing);
    setSavedItems(getSavedItems());
    toast.success("Saved to your watch list");
  };

  const handleRemoveItem = (itemId: string) => {
    removeSavedItem(itemId);
    setSavedItems(getSavedItems());
    toast("Removed from saved items");
  };

  const handleLoadSearch = (s: SavedSearch) => {
    setFilters(s.filters);
    setSearchTermsInput(s.filters.searchTerms);
    storeFilters(s.filters);
    setActiveSearchId(s.id);
    search(s.filters);
    setShowSaved(false);
  };

  const handleDeleteSearch = (id: string) => {
    removeSavedSearch(id);
    setSavedSearches(getSavedSearches());
    if (activeSearchId === id) setActiveSearchId(null);
    toast("Saved search deleted");
  };

  const handleSaveSearch = () => {
    const name = saveSearchName.trim();
    if (!name) return;
    const current = { ...filters, searchTerms: searchTermsInput };
    saveSearch(name, current);
    setSavedSearches(getSavedSearches());
    setSaveDialogOpen(false);
    setSaveSearchName("");
    toast.success(`Search "${name}" saved`);
  };

  const activeFiltersCount = [
    filters.minPrice !== undefined,
    filters.maxPrice !== undefined,
    filters.condition.length > 0,
    filters.listingType !== "all",
    filters.excludedCountries.length > 0,
  ].filter(Boolean).length;

  // Pagination
  const totalPages = Math.ceil(listings.length / PAGE_SIZE);
  const pagedListings = listings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Toaster position="bottom-right" />

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur">
        <div className="max-w-screen-2xl mx-auto px-4 py-3 flex items-center gap-3">
          <div className="flex items-center gap-2 shrink-0">
            <Watch className="h-5 w-5 text-primary" />
            <span className="font-bold text-lg tracking-tight">WatchSnipe</span>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Search bar */}
          <div className="flex-1 flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                className="pl-8 h-9 text-sm"
                placeholder="e.g. rolex submariner, omega seamaster, tag heuer"
                value={searchTermsInput}
                onChange={(e) => setSearchTermsInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} disabled={loading} className="h-9 px-4 shrink-0">
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Search className="h-4 w-4" />
              )}
              <span className="ml-1.5 hidden sm:inline">Search</span>
            </Button>
          </div>

          {/* Save search */}
          <Button
            variant="outline"
            size="sm"
            className="h-9 shrink-0 gap-1.5 hidden sm:flex"
            onClick={() => { setSaveSearchName(""); setSaveDialogOpen(true); }}
            title="Save current search"
          >
            <BookmarkPlus className="h-4 w-4" />
            <span className="hidden md:inline">Save</span>
          </Button>

          {/* Saved items toggle */}
          <Button
            variant={showSaved ? "default" : "ghost"}
            size="sm"
            className="h-9 shrink-0 gap-1.5"
            onClick={() => setShowSaved((v) => !v)}
            title="Saved items"
          >
            <Heart className={savedItems.length > 0 ? "h-4 w-4 fill-current text-red-500" : "h-4 w-4"} />
            {savedItems.length > 0 && (
              <Badge variant="secondary" className="h-4 text-[10px] px-1">
                {savedItems.length}
              </Badge>
            )}
          </Button>
        </div>
      </header>

      {/* Body */}
      <div className="max-w-screen-2xl mx-auto px-4 py-4 flex gap-4">
        {/* Sidebar — Saved Searches */}
        <aside className="hidden lg:block w-56 shrink-0">
          <div className="sticky top-20 rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-semibold">Saved Searches</span>
              {savedSearches.length > 0 && (
                <Badge variant="secondary" className="text-xs">{savedSearches.length}</Badge>
              )}
            </div>
            <SavedSearchesPanel
              searches={savedSearches}
              activeSearchId={activeSearchId}
              onLoad={handleLoadSearch}
              onDelete={handleDeleteSearch}
            />
            <Separator className="my-3" />
            <Button
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs gap-1.5"
              onClick={() => { setSaveSearchName(""); setSaveDialogOpen(true); }}
            >
              <BookmarkPlus className="h-3.5 w-3.5" />
              Save current search
            </Button>
          </div>
        </aside>

        {/* Main content */}
        <main ref={mainRef} className="flex-1 min-w-0">
          {showSaved ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold">
                  Saved Items{" "}
                  <span className="text-muted-foreground font-normal">({savedItems.length})</span>
                </h2>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => setShowSaved(false)}>
                  <X className="h-3 w-3 mr-1" />
                  Back to results
                </Button>
              </div>
              <SavedItemsPanel items={savedItems} onRemove={handleRemoveItem} />
            </div>
          ) : (
            <div>
              {/* Status bar — filter popover + search chips + result count */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                {/* Filter popover */}
                <Popover>
                  <PopoverTrigger className="inline-flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-background text-xs font-medium hover:bg-muted transition-colors shrink-0">
                    <SlidersHorizontal className="h-3.5 w-3.5" />
                    Filters
                    {activeFiltersCount > 0 && (
                      <Badge className="h-4 w-4 p-0 text-[10px] flex items-center justify-center ml-0.5">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </PopoverTrigger>
                  <PopoverContent side="bottom" align="start" className="w-72 p-4">
                    <p className="text-sm font-semibold mb-3">Search Filters</p>
                    <ScrollArea className="h-[420px] pr-2">
                      <FilterPanel filters={filters} onChange={handleFilterChange} />
                    </ScrollArea>
                  </PopoverContent>
                </Popover>

                <Separator orientation="vertical" className="h-4" />

                {filters.searchTerms
                  .split(",")
                  .map((t) => t.trim())
                  .filter(Boolean)
                  .map((term) => (
                    <Badge key={term} variant="secondary" className="text-xs">
                      {term}
                    </Badge>
                  ))}

                {listings.length > 0 && !loading && (
                  <span className="text-xs text-muted-foreground ml-1">
                    — {listings.length} results
                    {totalPages > 1 && `, page ${page} of ${totalPages}`}
                  </span>
                )}
                {loading && (
                  <span className="text-xs text-muted-foreground ml-1 flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Searching…
                  </span>
                )}
              </div>

              {/* Error banner */}
              {error && (
                <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 mb-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-destructive">Search Error</p>
                    <p className="text-xs text-muted-foreground">{error}</p>
                    {error.includes("credentials") && (
                      <p className="text-xs text-muted-foreground">
                        Add <code className="bg-muted px-1 rounded">EBAY_CLIENT_ID</code> and{" "}
                        <code className="bg-muted px-1 rounded">EBAY_CLIENT_SECRET</code> to{" "}
                        <code className="bg-muted px-1 rounded">.env.local</code>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Loading skeletons */}
              {loading && (
                <div className="space-y-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-stretch rounded-lg border border-border overflow-hidden">
                      <Skeleton className="w-[300px] h-[300px] shrink-0 rounded-none" />
                      <div className="flex-1 space-y-3">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-3 w-1/4" />
                      </div>
                      <Skeleton className="h-6 w-24 shrink-0" />
                    </div>
                  ))}
                </div>
              )}

              {/* Empty / pre-search states */}
              {!loading && !error && hasSearched && listings.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Watch className="h-12 w-12 text-muted-foreground/30 mb-3" />
                  <p className="text-sm text-muted-foreground">No listings found</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">Try different terms or adjust your filters</p>
                </div>
              )}

              {!loading && !hasSearched && (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <Watch className="h-16 w-16 text-muted-foreground/20 mb-4" />
                  <h2 className="text-base font-medium text-muted-foreground">Ready to snipe some watches</h2>
                  <p className="text-xs text-muted-foreground/60 mt-2 max-w-xs">
                    Enter your search terms above, separated by commas, and hit Search
                  </p>
                  <Button onClick={handleSearch} className="mt-4" size="sm">
                    <Search className="h-4 w-4 mr-1.5" />
                    Start Searching
                  </Button>
                </div>
              )}

              {/* Results list */}
              {!loading && pagedListings.length > 0 && (
                <>
                  <div className="space-y-1.5">
                    {pagedListings.map((listing) => (
                      <ListingCard
                        key={listing.itemId}
                        listing={listing}
                        isSaved={isItemSaved(listing.itemId)}
                        onSave={handleSaveItem}
                        onRemove={handleRemoveItem}
                      />
                    ))}
                  </div>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="flex items-center justify-center gap-3 mt-6">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === 1}
                        onClick={() => { setPage((p) => p - 1); mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        Page {page} of {totalPages}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={page === totalPages}
                        onClick={() => { setPage((p) => p + 1); mainRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }); }}
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </main>
      </div>

      {/* Save Search Dialog */}
      <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save Search</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="search-name" className="text-sm">Search name</Label>
              <Input
                id="search-name"
                placeholder="e.g. Vintage Rolex under $5k"
                value={saveSearchName}
                onChange={(e) => setSaveSearchName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveSearch()}
                autoFocus
              />
            </div>
            <div className="rounded-md bg-muted/50 p-3 space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Will save:</p>
              <p className="text-xs text-foreground">
                Terms: {searchTermsInput || filters.searchTerms || "—"}
              </p>
              {(filters.minPrice !== undefined || filters.maxPrice !== undefined) && (
                <p className="text-xs text-foreground">
                  Price: {filters.minPrice ?? "any"} – {filters.maxPrice ?? "any"}
                </p>
              )}
              {filters.condition.length > 0 && (
                <p className="text-xs text-foreground">Condition: {filters.condition.join(", ")}</p>
              )}
              {filters.excludedCountries.length > 0 && (
                <p className="text-xs text-foreground">
                  Excluding: {filters.excludedCountries.join(", ")}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(false)}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveSearch} disabled={!saveSearchName.trim()}>
              <BookmarkPlus className="h-4 w-4 mr-1.5" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
