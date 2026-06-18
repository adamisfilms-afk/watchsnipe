"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Heart, ExternalLink, Tag, MapPin, StickyNote, Clock, Calendar, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { SavedItem } from "@/lib/types";
import { relativeTime, relativeEnd } from "@/lib/relativeTime";
import { cn } from "@/lib/utils";

type SortOption = "saved-desc" | "saved-asc" | "price-asc" | "price-desc" | "listed-desc" | "ending-asc";

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
  { value: "saved-desc", label: "Recently Saved" },
  { value: "saved-asc", label: "Oldest Saved" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "listed-desc", label: "Most Recently Listed" },
  { value: "ending-asc", label: "Ending Soonest" },
];

function sortItems(items: SavedItem[], sort: SortOption, rates: Record<string, number> | null): SavedItem[] {
  const toUsd = (item: SavedItem) => {
    const v = item.listing.price?.value;
    if (!v) return 0;
    const amount = parseFloat(v);
    const currency = item.listing.price?.currency ?? "USD";
    const rate = (rates && currency !== "USD") ? rates[currency] : undefined;
    return rate ? amount / rate : amount;
  };

  return [...items].sort((a, b) => {
    switch (sort) {
      case "saved-desc": return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
      case "saved-asc":  return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
      case "price-asc":  return toUsd(a) - toUsd(b);
      case "price-desc": return toUsd(b) - toUsd(a);
      case "listed-desc": {
        const da = a.listing.itemCreationDate ? new Date(a.listing.itemCreationDate).getTime() : 0;
        const db = b.listing.itemCreationDate ? new Date(b.listing.itemCreationDate).getTime() : 0;
        return db - da;
      }
      case "ending-asc": {
        const ea = a.listing.itemEndDate ? new Date(a.listing.itemEndDate).getTime() : Infinity;
        const eb = b.listing.itemEndDate ? new Date(b.listing.itemEndDate).getTime() : Infinity;
        return ea - eb;
      }
    }
  });
}

interface SavedItemsPanelProps {
  items: SavedItem[];
  onRemove: (itemId: string) => void;
  onUpdateNotes: (itemId: string, notes: string) => void;
}

interface RowProps {
  item: SavedItem;
  onRemove: (itemId: string) => void;
  onUpdateNotes: (itemId: string, notes: string) => void;
  rates: Record<string, number> | null;
}

function SavedItemRow({ item, onRemove, onUpdateNotes, rates }: RowProps) {
  const [imgError, setImgError] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [noteText, setNoteText] = useState(item.notes ?? "");

  const listing = item.listing;
  const imageUrl = listing.thumbnailImages?.[0]?.imageUrl ?? listing.image?.imageUrl;
  const isAuction = listing.buyingOptions?.includes("AUCTION");
  const hasBuyNow = listing.buyingOptions?.includes("FIXED_PRICE");
  const city = listing.itemLocation?.city;
  const country = listing.itemLocation?.country;
  const hasPrice = listing.price?.value !== undefined;
  const priceValue = hasPrice ? parseFloat(listing.price.value) : null;
  const currency = listing.price?.currency ?? "USD";
  const ratesLoaded = rates !== null;
  const rate = (ratesLoaded && currency !== "USD") ? rates![currency] : undefined;
  const usdValue = priceValue !== null
    ? (currency === "USD" ? priceValue : rate ? priceValue / rate : null)
    : null;
  const endingSoon = listing.itemEndDate
    ? new Date(listing.itemEndDate).getTime() - Date.now() < 86_400_000
    : false;

  const saveNotes = () => {
    onUpdateNotes(item.id, noteText);
    setEditingNotes(false);
  };

  return (
    <div className="rounded-lg border border-green-400/70 bg-green-50 overflow-hidden">
      <div className="flex flex-col sm:flex-row items-stretch gap-0">
        {/* Image */}
        <div className="relative w-full aspect-square sm:aspect-auto sm:w-[300px] sm:h-[300px] shrink-0 bg-muted">
          {imageUrl && !imgError ? (
            <Image
              src={imageUrl}
              alt={listing.title}
              fill
              className="object-contain p-3"
              onError={() => setImgError(true)}
              sizes="300px"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <Tag className="h-12 w-12 text-muted-foreground/20" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between p-4 sm:p-5">
          <div className="space-y-3">
            <a
              href={listing.itemWebUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block text-base font-semibold leading-snug line-clamp-3 hover:underline hover:text-primary transition-colors"
            >
              {listing.title}
            </a>

            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              {isAuction && (
                <Badge variant="outline" className="text-xs py-0 h-5 gap-0.5">
                  <Clock className="h-3 w-3" />
                  Auction
                </Badge>
              )}
              {hasBuyNow && !isAuction && (
                <Badge variant="secondary" className="text-xs py-0 h-5">
                  Buy Now
                </Badge>
              )}
              {listing.itemCreationDate && (
                <span className="flex items-center gap-1 text-xs">
                  <Calendar className="h-3 w-3 shrink-0" />
                  Listed {relativeTime(listing.itemCreationDate)}
                </span>
              )}
              {listing.itemEndDate && (
                <span className={cn("flex items-center gap-1 text-xs", endingSoon && "text-orange-500 font-medium")}>
                  <Timer className="h-3 w-3 shrink-0" />
                  {relativeEnd(listing.itemEndDate)}
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              {(city || country) && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 shrink-0" />
                  {city ? `${city}, ${country}` : country}
                </span>
              )}
              {listing.seller?.username && (
                <span className="flex items-center gap-1">
                  <span className="font-medium text-foreground/70">{listing.seller.username}</span>
                  {listing.seller.feedbackPercentage && (
                    <span className="text-green-600">({listing.seller.feedbackPercentage}%)</span>
                  )}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => onRemove(listing.itemId)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-green-400 bg-green-100 text-green-700 hover:bg-red-50 hover:border-red-400 hover:text-red-600 transition-all"
            >
              <Heart className="h-3.5 w-3.5 fill-current" />
              Saved
            </button>
            <button
              onClick={() => setEditingNotes(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-border bg-background text-muted-foreground hover:bg-muted transition-all"
            >
              <StickyNote className="h-3.5 w-3.5" />
              Notes
            </button>
          </div>
        </div>

        {/* Price + link */}
        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between gap-2 p-4 pt-0 sm:p-5 shrink-0 w-full sm:w-36 border-t border-green-400/40 sm:border-t-0">
          <div className="text-left sm:text-right">
            {priceValue !== null ? (
              <>
                <p className="text-xl font-bold text-foreground">
                  {usdValue !== null
                    ? `$${usdValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                    : `${currency} ${priceValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </p>
                {currency !== "USD" && usdValue !== null && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {currency} {priceValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </>
            ) : (
              <p className="text-sm text-muted-foreground">—</p>
            )}
          </div>
          <a
            href={listing.itemWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            aria-label="View on eBay"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>

      {editingNotes ? (
        <div className="px-5 pb-4 space-y-1.5">
          <textarea
            className="w-full text-xs rounded border border-border bg-background p-2 resize-none h-16 focus:outline-none focus:ring-1 focus:ring-ring"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add notes…"
            autoFocus
          />
          <div className="flex gap-1.5">
            <Button size="sm" className="h-6 text-xs flex-1" onClick={saveNotes}>
              Save
            </Button>
            <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setEditingNotes(false)}>
              Cancel
            </Button>
          </div>
        </div>
      ) : item.notes ? (
        <div
          className="px-5 pb-4 pt-0 text-xs text-muted-foreground bg-muted/30 cursor-pointer hover:bg-muted/50 py-2"
          onClick={() => setEditingNotes(true)}
        >
          {item.notes}
        </div>
      ) : null}
    </div>
  );
}

export function SavedItemsPanel({ items, onRemove, onUpdateNotes }: SavedItemsPanelProps) {
  const [sort, setSort] = useState<SortOption>("saved-desc");
  const [rates, setRates] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    fetch("https://api.frankfurter.dev/v1/latest?base=USD")
      .then((r) => r.json())
      .then((data) => { if (data.rates) setRates(data.rates); })
      .catch(() => { setRates({}); });
  }, []);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Heart className="h-10 w-10 text-muted-foreground/30 mb-3" />
        <p className="text-sm text-muted-foreground">No saved items yet</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Click the heart icon on any listing to save it
        </p>
      </div>
    );
  }

  const sorted = sortItems(items, sort, rates);

  return (
    <div className="flex flex-col gap-3">
      {/* Sort control */}
      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground shrink-0">Sort by</Label>
        <Select value={sort} onValueChange={(v) => v && setSort(v as SortOption)}>
          <SelectTrigger className="h-8 text-xs flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-xs">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <ScrollArea className="h-[calc(100vh-14rem)]">
        <div className="space-y-3 pr-2">
          {sorted.map((item) => (
            <SavedItemRow key={item.id} item={item} onRemove={onRemove} onUpdateNotes={onUpdateNotes} rates={rates} />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
