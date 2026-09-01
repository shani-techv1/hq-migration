import { authenticate } from "../shopify.server";
import { getTransferSheetImage } from "../orderMetafieldApi.server";

// Mirrors the backend's own check on /api/download-transfer-image: a bare
// filename with an image extension, no path separators, no traversal.
const SAFE_FILE_RE = /^[^/\\]+\.(png|jpg|jpeg|gif)$/i;

/**
 * GET /app/orders/download?file= — proxy a generated transfer sheet.
 *
 * Only a filename is accepted, never a full URL, so this cannot be pointed at
 * an arbitrary host. The backend serves these images inline; we re-send them as
 * an attachment so the browser downloads instead of navigating to the image.
 */
export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const file = url.searchParams.get("file")?.trim();

  if (!file || file.includes("..") || !SAFE_FILE_RE.test(file)) {
    return new Response("Invalid file parameter", { status: 400 });
  }

  const res = await getTransferSheetImage(file);

  if (!res.ok) {
    const text = await res.text();
    return new Response(text || `Upstream error ${res.status}`, {
      status: res.status,
    });
  }

  // Streamed rather than buffered — sheets are 300 DPI and can be very large.
  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": res.headers.get("Content-Type") || "image/png",
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "no-store",
    },
  });
};
