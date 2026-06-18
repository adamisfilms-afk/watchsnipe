"use client";

import { useState } from "react";
import Image from "next/image";
import { Heart, ExternalLink, Trash2, Tag, MapPin, StickyNote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { SavedItem } from "@/lib/types";
import { updateItemNotes } from "@/lib/storage";

interface SavedItemsPanelProps {
  items: SavedItem[];
  onRemove: (itemId: string) => void;
}

export function SavedItemsPanel({ items, onRemove }: SavedItemsPanelProps) {
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [noteText, setNoteText] = useState("");

  const startEditNotes = (item: SavedItem) => {
    setEditingNotes(item.id);
    setNoteText(item.notes ?? "");
  };

  const saveNotes = (itemId: string) => {
    updateItemNotes(itemId, noteText);
    setEditingNotes(null);
  };

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
        {items.map((item) => {
          const imageUrl =
            item.listing.thumbnailImages?.[0]?.imageUrl ?? item.listing.image?.imageUrl;
          const savedDate = new Date(item.savedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          });

          return (
            <div
              key={item.id}
              className="rounded-lg border border-border bg-card p-3 space-y-2"
            >
              <div className="flex gap-3">
                {/* Thumbnail */}
                <div className="relative w-16 h-16 rounded bg-muted shrink-0 overflow-hidden">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={item.listing.title}
                      fill
                      className="object-contain p-1"
                      sizes="64px"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Tag className="h-5 w-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-xs font-medium line-clamp-2 leading-tight">
                    {item.listing.title}
                  </p>
                  <p className="text-sm font-bold text-primary">
                    {item.listing.price.currency === "USD" ? "$" : item.listing.price.currency + " "}
                    {parseFloat(item.listing.price.value).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                    })}
                  </p>
                  {item.listing.itemLocation?.country && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {item.listing.itemLocation.country}
                    </div>
                  )}
                </div>
              </div>

              {/* Saved date */}
              <p className="text-xs text-muted-foreground">Saved {savedDate}</p>

              {/* Notes */}
              {editingNotes === item.id ? (
                <div className="space-y-1.5">
                  <textarea
                    className="w-full text-xs rounded border border-border bg-background p-2 resize-none h-16 focus:outline-none focus:ring-1 focus:ring-ring"
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Add notes…"
                    autoFocus
                  />
                  <div className="flex gap-1.5">
                    <Button
                      size="sm"
                      className="h-6 text-xs flex-1"
                      onClick={() => saveNotes(item.id)}
                    >
                      Save
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 text-xs"
                      onClick={() => setEditingNotes(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : item.notes ? (
                <div
                  className="text-xs text-muted-foreground bg-muted/50 rounded p-2 cursor-pointer hover:bg-muted"
                  onClick={() => startEditNotes(item)}
                >
                  {item.notes}
                </div>
              ) : null}

              {/* Actions */}
              <div className="flex gap-1.5">
                <a
                  href={item.listing.itemWebUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center h-7 text-xs rounded-lg border border-border bg-background hover:bg-muted transition-colors px-2.5 font-medium"
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View
                </a>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2"
                  onClick={() => startEditNotes(item)}
                  title="Add notes"
                >
                  <StickyNote className="h-3 w-3" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs px-2 text-destructive hover:text-destructive"
                  onClick={() => onRemove(item.id)}
                  title="Remove"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>

              <Separator />
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}
