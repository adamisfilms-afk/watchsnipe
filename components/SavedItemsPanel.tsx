"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, ExternalLink, Trash2, Tag, MapPin, StickyNote, Clock, Calendar, Timer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SavedItem } from "@/lib/types";
import { updateItemNotes } from "@/lib/storage";
import { relativeTime, relativeEnd } from "@/lib/relativeTime";
import { cn } from "@/lib/utils";

interface SavedItemsPanelProps {
  items: SavedItem[];
  onRemove: (itemId: string) => void;
}

interface RowProps {
  item: SavedItem;
  onRemove: (itemId: string) => void;
}

function SavedItemRow({ item, onRemove }: RowProps) {
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
  const endingSoon = listing.itemEndDate
    ? new Date(listing.itemEndDate).getTime() - Date.now() < 86_400_000
    : false;

  const saveNotes = () => {
    updateItemNotes(item.id, noteText);
    setEditingNotes(false);
  };

  return (
    <div className="rounded-lg border border-green-400/70 bg-green-50 overflow-hidden">
      <div className="flex items-stretch gap-0">
        {/* Image */}
        <div className="relative w-[300px] h-[300px] shrink-0 bg-muted">
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
        <div className="flex-1 min-w-0 flex flex-col justify-between p-5">
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

          {/* Bottom actions */}
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
        <div className="flex flex-col items-end justify-between p-5 shrink-0 w-36">
          <div className="text-right">
            {priceValue !== null ? (
              <>
                <p className="text-xl font-bold text-foreground">
                  {currency === "USD" ? "$" : `${currency} `}
                  {priceValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                {currency !== "USD" && (
                  <p className="text-xs text-muted-foreground mt-0.5">{currency}</p>
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

      {/* Notes section */}
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

export function SavedItemsPanel({ items, onRemove }: SavedItemsPanelProps) {
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

  return (
    <ScrollArea className="h-[calc(100vh-12rem)]">
      <div className="space-y-3 pr-2">
        {items.map((item) => (
          <SavedItemRow key={item.id} item={item} onRemove={onRemove} />
        ))}
      </div>
    </ScrollArea>
  );
}
