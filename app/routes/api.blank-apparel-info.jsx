/**
 * App proxy endpoint: GET /apps/customscale-app/blank-apparel-info
 *
 * Returns the "Blank Apparel" collection's vendor rules and first 10 products.
 * Used by the storefront to check if the cart already contains blank apparel
 * (by vendor match) and to display upsell products when it doesn't.
 *
 * Response (JSON):
 *   {
 *     vendors: ["Bella + Canvas", "Gildan", ...],
 *     products: [{ id, title, handle, image, price, compareAtPrice, currency }, ...]
 *   }
 */

import { authenticate } from "../shopify.server";

const COLLECTION_HANDLE = "blank-apparel";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });

export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Accept",
      },
    });
  }

  const ctx = await authenticate.public.appProxy(request);
  const admin = ctx.admin;
  if (!admin) {
    return json({ error: "Store not authenticated" }, 401);
  }

  try {
    const res = await admin.graphql(
      `{
        collectionByHandle(handle: "${COLLECTION_HANDLE}") {
          ruleSet {
            rules {
              column
              condition
              relation
            }
          }
          products(first: 10) {
            nodes {
              id
              title
              handle
              featuredImage { url altText }
              priceRange { minVariantPrice { amount currencyCode } }
              compareAtPriceRange { minVariantCompareAtPrice { amount currencyCode } }
            }
          }
        }
      }`,
    );

    const data = typeof res?.json === "function" ? await res.json() : res;
    const collection = data?.data?.collectionByHandle;

    if (!collection) {
      return json({ vendors: [], products: [] });
    }

    // Extract vendor names from the automated collection rules
    const vendors = (collection.ruleSet?.rules || [])
      .filter((r) => r.column === "VENDOR" && r.relation === "EQUALS")
      .map((r) => r.condition);

    const products = (collection.products?.nodes || []).map((p) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      image: p.featuredImage?.url || null,
      imageAlt: p.featuredImage?.altText || "",
      price: p.priceRange?.minVariantPrice?.amount || null,
      compareAtPrice:
        p.compareAtPriceRange?.minVariantCompareAtPrice?.amount || null,
      currency: p.priceRange?.minVariantPrice?.currencyCode || "USD",
    }));

    return json({ vendors, products });
  } catch (err) {
    console.error("[api.blank-apparel-info] Error:", err);
    return json({ error: "Failed to fetch collection info" }, 500);
  }
};
