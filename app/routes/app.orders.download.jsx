import { authenticate } from "../shopify.server";
import {
  getGarmentPdf,
  getTransferSheetImage,
} from "../orderMetafieldApi.server";

// Mirrors the backend's own checks on /api/download-transfer-image and
// /api/download-garment-pdf: a bare filename with an image or PDF extension,
// no path separators, no traversal.
const SAFE_FILE_RE = /^[^/\\]+\.(png|jpg|jpeg|gif|pdf)$/i;

/**
 * GET /app/orders/download?file= — proxy a generated transfer sheet, garment
 * gang sheet or garment print sheet PDF.
 *
 * Only a filename is accepted, never a full URL, so this cannot be pointed at
 * an arbitrary host. The backend keeps PDFs and images behind separate
 * endpoints, so the extension picks which one to call. The backend serves
 * files inline; we re-send them as an attachment so the browser downloads
 * instead of navigating to the file.
 */
export const loader = async ({ request }) => {
  await authenticate.admin(request);

  const url = new URL(request.url);
  const file = url.searchParams.get("file")?.trim();

  if (!file || file.includes("..") || !SAFE_FILE_RE.test(file)) {
    return new Response("Invalid file parameter", { status: 400 });
  }

  const isPdf = /\.pdf$/i.test(file);
  const res = isPdf
    ? await getGarmentPdf(file)
    : await getTransferSheetImage(file);

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
      "Content-Type":
        res.headers.get("Content-Type") ||
        (isPdf ? "application/pdf" : "image/png"),
      "Content-Disposition": `attachment; filename="${file}"`,
      "Cache-Control": "no-store",
    },
  });
};
