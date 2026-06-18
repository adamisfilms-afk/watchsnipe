import { NextRequest, NextResponse } from "next/server";

const EBAY_API_BASE = "https://api.ebay.com";
const EBAY_SANDBOX_BASE = "https://api.sandbox.ebay.com";

// Cache tokens per marketplace
const tokenCache: Record<string, { token: string; expiresAt: number }> = {};

async function getAccessToken(marketplace: string): Promise<string> {
  const cached = tokenCache[marketplace];
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const clientId = process.env.EBAY_CLIENT_ID;
  const clientSecret = process.env.EBAY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("eBay API credentials not configured");
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const base = process.env.EBAY_SANDBOX === "true" ? EBAY_SANDBOX_BASE : EBAY_API_BASE;

  const response = await fetch(`${base}/identity/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials&scope=https%3A%2F%2Fapi.ebay.com%2Foauth%2Fapi_scope",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`eBay auth failed: ${response.status} ${text}`);
  }

  const data = await response.json();
  tokenCache[marketplace] = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return tokenCache[marketplace].token;
}

// Determine the currency for a marketplace
function marketplaceCurrency(marketplace: string): string {
  const map: Record<string, string> = {
    EBAY_GB: "GBP",
    EBAY_AU: "AUD",
    EBAY_DE: "EUR",
    EBAY_FR: "EUR",
    EBAY_IT: "EUR",
    EBAY_ES: "EUR",
    EBAY_AT: "EUR",
    EBAY_BE: "EUR",
    EBAY_NL: "EUR",
    EBAY_CH: "CHF",
    EBAY_CA: "CAD",
    EBAY_HK: "HKD",
    EBAY_SG: "SGD",
  };
  return map[marketplace] ?? "USD";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const conditions = searchParams.getAll("condition");
  const listingType = searchParams.get("listingType");
  const sortOrder = searchParams.get("sort") || "bestMatch";
  const marketplace = searchParams.get("marketplace") || "EBAY_GB";
  const offset = searchParams.get("offset") || "0";
  // eBay Browse API max per request is 200
  const limit = "200";

  if (!query) {
    return NextResponse.json({ error: "Missing query" }, { status: 400 });
  }

  try {
    const token = await getAccessToken(marketplace);
    const base = process.env.EBAY_SANDBOX === "true" ? EBAY_SANDBOX_BASE : EBAY_API_BASE;
    const currency = marketplaceCurrency(marketplace);

    const params = new URLSearchParams({
      q: query,
      limit,
      offset,
      sort: sortOrder,
    });

    // Build all filter clauses and combine into a single filter param (eBay requires comma-separated)
    const filterParts: string[] = [];

    if (conditions.length > 0) {
      filterParts.push(`conditions:{${conditions.join("|")}}`);
    }

    if (listingType && listingType !== "all") {
      const typeMap: Record<string, string> = {
        auction: "AUCTION",
        buynow: "FIXED_PRICE",
      };
      if (typeMap[listingType]) {
        filterParts.push(`buyingOptions:{${typeMap[listingType]}}`);
      }
    }

    if (minPrice || maxPrice) {
      const priceFilter =
        minPrice && maxPrice
          ? `price:[${minPrice}..${maxPrice}],priceCurrency:${currency}`
          : minPrice
          ? `price:[${minPrice}..],priceCurrency:${currency}`
          : `price:[..${maxPrice}],priceCurrency:${currency}`;
      filterParts.push(priceFilter);
    }

    if (filterParts.length > 0) {
      params.set("filter", filterParts.join(","));
    }

    params.append("fieldgroups", "EXTENDED");

    const url = `${base}/buy/browse/v1/item_summary/search?${params.toString()}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "X-EBAY-C-MARKETPLACE-ID": marketplace,
      },
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("eBay API error:", response.status, text);
      return NextResponse.json(
        { error: `eBay API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Search failed" },
      { status: 500 }
    );
  }
}
