/**
 * External API client for order metafields and product transfer sheets.
 * Base URL: https://highquality.allgovjobs.com
 */

const API_BASE = "https://highquality.allgovjobs.com/backend";

/**
 * POST /api/order-metafield - Save order metafield when customer places order.
 * Called from orders/create webhook (or Flow) so backend has order + CustomImage URLs when customer sees confirmation page.
 * @param {{ shop: string, order_id: string|number, line_items: object[], images: string[] }} body - images are CustomImage URLs from line item properties
 * @returns {Promise<Response>}
 */
export async function postOrderMetafield({ shop, order_id, line_items, images }) {
  const res = await fetch(`${API_BASE}/api/order-metafield`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shop, order_id, line_items, images }),
  });
  return res;
}

/**
 * GET /api/order-metafield - Get order metafield data
 * @param {{ shop: string, order_id: string }} params
 * @returns {Promise<Response>}
 */
export async function getOrderMetafield({ shop, order_id }) {
  const url = new URL(`${API_BASE}/api/order-metafield`);
  url.searchParams.set("shop", shop);
  url.searchParams.set("order_id", String(order_id));
  const res = await fetch(url.toString());
  return res;
}

/**
 * POST /api/orders/transfer-sheet-by-product - Generate per-product transfer sheets
 * for one or more orders. Responds with a download link per generated sheet and
 * sends no email, unlike the webhook variants of the same endpoint.
 *
 * Generation renders every sheet before responding, so this call is slow —
 * budget for tens of seconds per order.
 * @param {{ shop: string, orderIds: (string|number)[] }} params
 * @returns {Promise<Response>}
 */
export async function generateTransferSheetsByProduct({ shop, orderIds }) {
  return fetch(`${API_BASE}/api/orders/transfer-sheet-by-product`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ shop, orderIds }),
  });
}

/**
 * GET /api/download-transfer-image - Stream a generated transfer sheet by filename.
 * The filename comes from `pngFileName` on a sheet returned by the call above.
 * @param {string} file
 * @returns {Promise<Response>}
 */
export async function getTransferSheetImage(file) {
  const url = new URL(`${API_BASE}/api/download-transfer-image`);
  url.searchParams.set("file", file);
  return fetch(url.toString());
}
