/** Browser-only helpers for images picked by the user (FileReader + canvas). */

/** Reads a file as a data: URL; null if it can't be read. */
export function readFileAsDataUrl(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : null);
    reader.onerror = () => resolve(null);
    reader.readAsDataURL(file);
  });
}

/**
 * Re-encodes an image as JPEG (white background) so it fits within
 * `maxChars` and, if given, `maxSide` pixels. Images that already fit are
 * returned unchanged. On any failure the original is returned.
 */
export async function downscaleDataUrl(
  dataUrl: string,
  { maxChars, maxSide }: { maxChars: number; maxSide?: number }
): Promise<string> {
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const longest = Math.max(img.naturalWidth, img.naturalHeight);
    if (dataUrl.length <= maxChars && (!maxSide || longest <= maxSide)) return dataUrl;

    let side = Math.min(longest, maxSide ?? 2000);
    let quality = 0.85;
    for (let attempt = 0; attempt < 5; attempt++) {
      const scale = Math.min(1, side / longest);
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) break;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const out = canvas.toDataURL("image/jpeg", quality);
      if (out.length <= maxChars) return out;
      side = Math.round(side * 0.75);
      quality = Math.max(0.6, quality - 0.1);
    }
  } catch {
    // Fall through: the API will explain any size problem.
  }
  return dataUrl;
}
