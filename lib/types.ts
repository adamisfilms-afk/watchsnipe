export interface EbayListing {
  itemId: string;
  title: string;
  price: {
    value: string;
    currency: string;
  };
  image?: {
    imageUrl: string;
  };
  itemLocation?: {
    country: string;
    city?: string;
  };
  condition?: string;
  listingType?: string;
  itemWebUrl: string;
  seller?: {
    username: string;
    feedbackScore?: number;
    feedbackPercentage?: string;
  };
  buyingOptions?: string[];
  shortDescription?: string;
  thumbnailImages?: { imageUrl: string }[];
  itemCreationDate?: string;
  itemEndDate?: string;
}

export interface SearchFilters {
  searchTerms: string;
  excludedCountries: string[];
  minPrice?: number;
  maxPrice?: number;
  condition: string[];
  listingType: string;
  sortOrder: string;
}

// All major eBay marketplaces searched in parallel for worldwide coverage
export const ALL_MARKETPLACES = [
  { id: "EBAY_US", currency: "USD" },
  { id: "EBAY_GB", currency: "GBP" },
  { id: "EBAY_DE", currency: "EUR" },
  { id: "EBAY_AU", currency: "AUD" },
  { id: "EBAY_FR", currency: "EUR" },
  { id: "EBAY_IT", currency: "EUR" },
  { id: "EBAY_ES", currency: "EUR" },
  { id: "EBAY_CA", currency: "CAD" },
  { id: "EBAY_AT", currency: "EUR" },
  { id: "EBAY_BE", currency: "EUR" },
  { id: "EBAY_NL", currency: "EUR" },
  { id: "EBAY_CH", currency: "CHF" },
  { id: "EBAY_HK", currency: "HKD" },
  { id: "EBAY_SG", currency: "SGD" },
];

export const MARKETPLACE_OPTIONS = [
  { value: "EBAY_GB", label: "eBay UK" },
  { value: "EBAY_US", label: "eBay US" },
  { value: "EBAY_AU", label: "eBay Australia" },
  { value: "EBAY_DE", label: "eBay Germany" },
  { value: "EBAY_FR", label: "eBay France" },
  { value: "EBAY_IT", label: "eBay Italy" },
  { value: "EBAY_ES", label: "eBay Spain" },
  { value: "EBAY_CA", label: "eBay Canada" },
  { value: "EBAY_AT", label: "eBay Austria" },
  { value: "EBAY_BE", label: "eBay Belgium" },
  { value: "EBAY_NL", label: "eBay Netherlands" },
  { value: "EBAY_CH", label: "eBay Switzerland" },
  { value: "EBAY_HK", label: "eBay Hong Kong" },
  { value: "EBAY_SG", label: "eBay Singapore" },
];

export interface SavedSearch {
  id: string;
  name: string;
  filters: SearchFilters;
  createdAt: string;
}

export interface SavedItem {
  id: string;
  listing: EbayListing;
  savedAt: string;
  notes?: string;
}

export const CONDITION_OPTIONS = [
  { value: "NEW", label: "New" },
  { value: "USED_EXCELLENT", label: "Used - Excellent" },
  { value: "USED_GOOD", label: "Used - Good" },
  { value: "USED_ACCEPTABLE", label: "Used - Acceptable" },
  { value: "FOR_PARTS_OR_NOT_WORKING", label: "For Parts" },
];

export const ALL_COUNTRIES = [
  { code: "AF", name: "Afghanistan" },
  { code: "AL", name: "Albania" },
  { code: "DZ", name: "Algeria" },
  { code: "AR", name: "Argentina" },
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "AZ", name: "Azerbaijan" },
  { code: "BD", name: "Bangladesh" },
  { code: "BY", name: "Belarus" },
  { code: "BE", name: "Belgium" },
  { code: "BO", name: "Bolivia" },
  { code: "BA", name: "Bosnia and Herzegovina" },
  { code: "BR", name: "Brazil" },
  { code: "BG", name: "Bulgaria" },
  { code: "KH", name: "Cambodia" },
  { code: "CA", name: "Canada" },
  { code: "CL", name: "Chile" },
  { code: "CN", name: "China" },
  { code: "CO", name: "Colombia" },
  { code: "HR", name: "Croatia" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EC", name: "Ecuador" },
  { code: "EG", name: "Egypt" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "GE", name: "Georgia" },
  { code: "DE", name: "Germany" },
  { code: "GH", name: "Ghana" },
  { code: "GR", name: "Greece" },
  { code: "GT", name: "Guatemala" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IN", name: "India" },
  { code: "ID", name: "Indonesia" },
  { code: "IR", name: "Iran" },
  { code: "IQ", name: "Iraq" },
  { code: "IE", name: "Ireland" },
  { code: "IL", name: "Israel" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "JO", name: "Jordan" },
  { code: "KZ", name: "Kazakhstan" },
  { code: "KE", name: "Kenya" },
  { code: "KR", name: "South Korea" },
  { code: "KW", name: "Kuwait" },
  { code: "LV", name: "Latvia" },
  { code: "LB", name: "Lebanon" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MY", name: "Malaysia" },
  { code: "MX", name: "Mexico" },
  { code: "MA", name: "Morocco" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NG", name: "Nigeria" },
  { code: "NO", name: "Norway" },
  { code: "PK", name: "Pakistan" },
  { code: "PE", name: "Peru" },
  { code: "PH", name: "Philippines" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "QA", name: "Qatar" },
  { code: "RO", name: "Romania" },
  { code: "RU", name: "Russia" },
  { code: "SA", name: "Saudi Arabia" },
  { code: "RS", name: "Serbia" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "ZA", name: "South Africa" },
  { code: "ES", name: "Spain" },
  { code: "LK", name: "Sri Lanka" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TW", name: "Taiwan" },
  { code: "TH", name: "Thailand" },
  { code: "TR", name: "Turkey" },
  { code: "UA", name: "Ukraine" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
  { code: "UY", name: "Uruguay" },
  { code: "UZ", name: "Uzbekistan" },
  { code: "VE", name: "Venezuela" },
  { code: "VN", name: "Vietnam" },
];

export const SORT_OPTIONS = [
  { value: "bestMatch", label: "Best Match" },
  { value: "price", label: "Price: Low to High" },
  { value: "-price", label: "Price: High to Low" },
  { value: "newlyListed", label: "Newly Listed" },
  { value: "endingSoonest", label: "Ending Soonest" },
];
