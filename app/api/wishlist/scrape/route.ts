import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }

    // ── 1. Shopify ────────────────────────────────────────────────────────────
    // Try fetching <url>.json for clean Shopify product data
    try {
      const shopifyUrl = url.split("?")[0].replace(/\/$/, "") + ".json";
      const shopRes = await fetch(shopifyUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(6000),
      });
      if (shopRes.ok) {
        const shopData = await shopRes.json();
        const product = shopData?.product;
        if (product) {
          const variant = product.variants?.[0];
          const price = variant ? parseFloat(variant.price) : undefined;
          const image = product.images?.[0]?.src ?? undefined;
          return NextResponse.json({
            title: product.title ?? "",
            price: price ?? null,
            image: image ?? null,
            description: product.body_html
              ? product.body_html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300)
              : null,
            url,
            source: "shopify",
          });
        }
      }
    } catch {
      // Not Shopify or failed — fall through
    }

    // ── 2. Open Graph ─────────────────────────────────────────────────────────
    const htmlRes = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; DashboardBot/1.0; +https://localhost)",
        Accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(8000),
    });

    if (!htmlRes.ok) {
      return NextResponse.json(
        { error: `Failed to fetch page: HTTP ${htmlRes.status}` },
        { status: 200 }
      );
    }

    const html = await htmlRes.text();

    function getOG(property: string): string | null {
      // Match <meta property="og:..." content="..."/> (order independent, single or double quotes)
      const re = new RegExp(
        `<meta[^>]+property=["']${property}["'][^>]+content=["']([^"']+)["']`,
        "i"
      );
      const re2 = new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${property}["']`,
        "i"
      );
      const m = re.exec(html) ?? re2.exec(html);
      return m ? m[1].trim() : null;
    }

    function getMeta(name: string): string | null {
      const re = new RegExp(
        `<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["']`,
        "i"
      );
      const re2 = new RegExp(
        `<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["']`,
        "i"
      );
      const m = re.exec(html) ?? re2.exec(html);
      return m ? m[1].trim() : null;
    }

    function getTitle(): string | null {
      const ogTitle = getOG("og:title");
      if (ogTitle) return ogTitle;
      const m = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
      return m ? m[1].trim() : null;
    }

    function parsePrice(raw: string | null): number | null {
      if (!raw) return null;
      const cleaned = raw.replace(/[^0-9.]/g, "");
      const n = parseFloat(cleaned);
      return isNaN(n) ? null : n;
    }

    const title = getTitle();
    const rawPrice =
      getOG("og:price:amount") ??
      getOG("product:price:amount") ??
      getMeta("twitter:data1") ??
      null;
    const price = parsePrice(rawPrice);
    const image = getOG("og:image") ?? null;
    const description =
      getOG("og:description") ??
      getMeta("description") ??
      null;

    return NextResponse.json({
      title: title ?? null,
      price,
      image,
      description: description ? description.slice(0, 300) : null,
      url,
      source: "og",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 200 });
  }
}
