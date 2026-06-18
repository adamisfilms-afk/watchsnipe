"use client";

import { useState } from "react";
import { X, ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SearchFilters, CONDITION_OPTIONS, ALL_COUNTRIES, SORT_OPTIONS } from "@/lib/types";

interface FilterPanelProps {
  filters: SearchFilters;
  onChange: (filters: SearchFilters) => void;
}

export function FilterPanel({ filters, onChange }: FilterPanelProps) {
  const [countrySearch, setCountrySearch] = useState("");
  const [showAllCountries, setShowAllCountries] = useState(false);

  const update = (patch: Partial<SearchFilters>) => onChange({ ...filters, ...patch });

  const toggleCondition = (value: string) => {
    const next = filters.condition.includes(value)
      ? filters.condition.filter((c) => c !== value)
      : [...filters.condition, value];
    update({ condition: next });
  };

  const toggleExcludedCountry = (code: string) => {
    const next = filters.excludedCountries.includes(code)
      ? filters.excludedCountries.filter((c) => c !== code)
      : [...filters.excludedCountries, code];
    update({ excludedCountries: next });
  };

  const filteredCountries = ALL_COUNTRIES.filter(
    (c) =>
      c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
      c.code.toLowerCase().includes(countrySearch.toLowerCase())
  );

  const visibleCountries = showAllCountries ? filteredCountries : filteredCountries.slice(0, 20);

  return (
    <div className="space-y-5">
      {/* Sort */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Sort By
        </Label>
        <Select value={filters.sortOrder} onValueChange={(v) => update({ sortOrder: v ?? filters.sortOrder })}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value} className="text-sm">
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Price Range */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Price Range (USD)
        </Label>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            className="h-8 text-sm"
            value={filters.minPrice ?? ""}
            onChange={(e) =>
              update({ minPrice: e.target.value !== "" ? parseFloat(e.target.value) : undefined })
            }
          />
          <span className="text-muted-foreground text-xs">–</span>
          <Input
            type="number"
            placeholder="Max"
            className="h-8 text-sm"
            value={filters.maxPrice ?? ""}
            onChange={(e) =>
              update({ maxPrice: e.target.value !== "" ? parseFloat(e.target.value) : undefined })
            }
          />
        </div>
      </div>

      <Separator />

      {/* Listing Type */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Listing Type
        </Label>
        <Select value={filters.listingType} onValueChange={(v) => update({ listingType: v ?? filters.listingType })}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="text-sm">All Listings</SelectItem>
            <SelectItem value="auction" className="text-sm">Auction Only</SelectItem>
            <SelectItem value="buynow" className="text-sm">Buy It Now Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      {/* Condition */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Condition
        </Label>
        <div className="space-y-2">
          {CONDITION_OPTIONS.map((opt) => (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={`cond-${opt.value}`}
                checked={filters.condition.includes(opt.value)}
                onCheckedChange={() => toggleCondition(opt.value)}
              />
              <label htmlFor={`cond-${opt.value}`} className="text-sm cursor-pointer">
                {opt.label}
              </label>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Excluded Countries */}
      <div className="space-y-2">
        <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Exclude Countries
        </Label>

        {filters.excludedCountries.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {filters.excludedCountries.map((code) => {
              const country = ALL_COUNTRIES.find((c) => c.code === code);
              return (
                <Badge
                  key={code}
                  variant="destructive"
                  className="text-xs gap-1 cursor-pointer"
                  onClick={() => toggleExcludedCountry(code)}
                >
                  {country?.name ?? code}
                  <X className="h-2.5 w-2.5" />
                </Badge>
              );
            })}
            <Button
              variant="ghost"
              size="sm"
              className="h-5 text-xs px-1 text-muted-foreground"
              onClick={() => update({ excludedCountries: [] })}
            >
              Clear all
            </Button>
          </div>
        )}

        <Input
          placeholder="Search countries…"
          className="h-7 text-xs"
          value={countrySearch}
          onChange={(e) => setCountrySearch(e.target.value)}
        />

        <ScrollArea className="h-48">
          <div className="space-y-1.5 pr-2">
            {visibleCountries.map((country) => (
              <div key={country.code} className="flex items-center gap-2">
                <Checkbox
                  id={`country-${country.code}`}
                  checked={filters.excludedCountries.includes(country.code)}
                  onCheckedChange={() => toggleExcludedCountry(country.code)}
                />
                <label
                  htmlFor={`country-${country.code}`}
                  className="text-sm cursor-pointer flex items-center gap-1.5"
                >
                  <span className="text-xs text-muted-foreground">{country.code}</span>
                  {country.name}
                </label>
              </div>
            ))}
            {filteredCountries.length > 20 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-xs"
                onClick={() => setShowAllCountries((v) => !v)}
              >
                {showAllCountries ? (
                  <>
                    <ChevronUp className="h-3 w-3 mr-1" />
                    Show less
                  </>
                ) : (
                  <>
                    <ChevronDown className="h-3 w-3 mr-1" />
                    Show {filteredCountries.length - 20} more
                  </>
                )}
              </Button>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
