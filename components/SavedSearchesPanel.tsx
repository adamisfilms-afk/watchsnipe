"use client";

import { useState } from "react";
import { Search, Trash2, ChevronRight, BookmarkPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SavedSearch } from "@/lib/types";
import { cn } from "@/lib/utils";

interface SavedSearchesPanelProps {
  searches: SavedSearch[];
  activeSearchId: string | null;
  onLoad: (search: SavedSearch) => void;
  onDelete: (id: string) => void;
}

export function SavedSearchesPanel({
  searches,
  activeSearchId,
  onLoad,
  onDelete,
}: SavedSearchesPanelProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  if (searches.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center px-2">
        <BookmarkPlus className="h-8 w-8 text-muted-foreground/30 mb-2" />
        <p className="text-xs text-muted-foreground">No saved searches</p>
        <p className="text-xs text-muted-foreground/60 mt-1">
          Use the Save button to bookmark your current search &amp; filters
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {searches.map((s) => {
        const isActive = s.id === activeSearchId;
        const termCount = s.filters.searchTerms.split(",").filter((t) => t.trim()).length;
        const hasFilters =
          s.filters.condition.length > 0 ||
          s.filters.minPrice !== undefined ||
          s.filters.maxPrice !== undefined ||
          s.filters.listingType !== "all" ||
          s.filters.excludedCountries.length > 0;

        return (
          <div
            key={s.id}
            className={cn(
              "group flex items-center gap-2 rounded-md px-2 py-2 cursor-pointer transition-colors",
              isActive
                ? "bg-primary/10 border border-primary/20"
                : "hover:bg-accent border border-transparent"
            )}
            onClick={() => onLoad(s)}
          >
            <Search className={cn("h-3.5 w-3.5 shrink-0", isActive ? "text-primary" : "text-muted-foreground")} />

            <div className="flex-1 min-w-0">
              <p className={cn("text-sm font-medium truncate", isActive && "text-primary")}>
                {s.name}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {termCount} term{termCount !== 1 ? "s" : ""}
                {hasFilters && " · filtered"}
              </p>
            </div>

            {confirmDelete === s.id ? (
              <div className="flex gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  className="text-xs text-destructive hover:underline"
                  onClick={() => { onDelete(s.id); setConfirmDelete(null); }}
                >
                  Delete
                </button>
                <button
                  className="text-xs text-muted-foreground hover:underline"
                  onClick={() => setConfirmDelete(null)}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                className="shrink-0 p-1 rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all"
                onClick={(e) => { e.stopPropagation(); setConfirmDelete(s.id); }}
                aria-label="Delete saved search"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}

            {isActive && <ChevronRight className="h-3.5 w-3.5 text-primary shrink-0" />}
          </div>
        );
      })}
    </div>
  );
}
