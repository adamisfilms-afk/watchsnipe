"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, ExternalLink, MapPin, Tag, Clock, Calendar, Timer } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { EbayListing } from "@/lib/types";
import { relativeTime, relativeEnd } from "@/lib/relativeTime";
import { cn } from "@/lib/utils";

interface ListingCardProps {
  listing: EbayListing;
  isSaved: boolean;
  onSave: (listing: EbayListing) => void;
  onRemove: (itemId: string) => void;
}

export function ListingCard({ listing, isSaved, onSave, onRemove }: ListingCardProps) {
  const [imgError, setImgError] = useState(false);
  const imageUrl = listing.thumbnailImages?.[0]?.imageUrl ?? listing.image?.imageUrl;

  const isAuction = listing.buyingOptions?.includes("AUCTION");
  const hasBuyNow = listing.buyingOptions?.includes("FIXED_PRICE");
  const city = listing.itemLocation?.city;
  const country = listing.itemLocation?.country;

  const hasPrice = listing.price?.value !== undefined;
  const priceValue = hasPrice ? parseFloat(listing.price.value) : null;
  const currency = listing.price?.currency ?? "USD";

  const endingSoon =
    listing.itemEndDate
      ? new Date(listing.itemEndDate).getTime() - Date.now() < 86_400_000
      : false;

  return (
    <div
      className={cn(
        "group flex items-stretch gap-0 rounded-lg border overflow-hidden transition-colors",
        isSaved
          ? "border-green-400/70 bg-green-50"
          : "border-border bg-card hover:border-primary/40"
      )}
    >
      {/* Left: image */}
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

      {/* Right: content */}
      <div className="flex-1 min-w-0 flex flex-col justify-between p-5">
        {/* Top section */}
        <div className="space-y-3">
          {/* Title */}
          <a
            href={listing.itemWebUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-base font-semibold leading-snug line-clamp-3 hover:underline hover:text-primary transition-colors"
          >
            {listing.title}
          </a>

          {/* Row 1: listing type chip + listed date + end date */}
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
              <span
                className={cn(
                  "flex items-center gap-1 text-xs",
                  endingSoon ? "text-orange-500 font-medium" : ""
                )}
              >
                <Timer className="h-3 w-3 shrink-0" />
                {relativeEnd(listing.itemEndDate)}
              </span>
            )}
          </div>

          {/* Row 2: location + seller */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            {(city || country) && (
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                {city ? `${city}, ${country}` : country}
              </span>
            )}
            {listing.seller?.username && (
              <span className="flex items-center gap-1">
                <span className="font-medium text-foreground/70">
                  {listing.seller.username}
                </span>
                {listing.seller.feedbackPercentage && (
                  <span className="text-green-600">
                    ({listing.seller.feedbackPercentage}%)
                  </span>
                )}
              </span>
            )}
          </div>
        </div>

        {/* Bottom section: save chip */}
        <div className="mt-4">
          <button
            onClick={() => (isSaved ? onRemove(listing.itemId) : onSave(listing))}
            className={cn(
              "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all",
              isSaved
                ? "border-green-400 bg-green-100 text-green-700 hover:bg-green-200"
                : "border-border bg-background text-muted-foreground hover:border-green-400 hover:text-green-700 hover:bg-green-50"
            )}
          >
            <Heart className={cn("h-3.5 w-3.5", isSaved && "fill-current")} />
            {isSaved ? "Saved" : "Save"}
          </button>
        </div>
      </div>

      {/* Far right: price + eBay link */}
      <div className="flex flex-col items-end justify-between p-5 shrink-0 w-36">
        <div className="text-right">
          {priceValue !== null ? (
            <>
              <p className="text-xl font-bold text-foreground">
                {currency === "USD" ? "$" : `${currency} `}
                {priceValue.toLocaleString("en-US", {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
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
          className="p-1.5 rounded-md text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-foreground hover:bg-muted transition-all"
          aria-label="View on eBay"
        >
          <ExternalLink className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
}
