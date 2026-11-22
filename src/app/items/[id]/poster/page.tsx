import type { Metadata } from "next";
import { cache, type CSSProperties } from "react";
import { notFound } from "next/navigation";
import { and, eq, ne, sql } from "drizzle-orm";
import QRCode from "qrcode";
import { ImageIcon } from "lucide-react";
import { db } from "@/db";
import { items } from "@/db/schema";
import { getSiteUrl } from "@/lib/utils";
import { PosterToolbar } from "@/components/items/PosterToolbar";

type PageProps = { params: Promise<{ id: string }> };

/** Public fields only: never the precise location or the poster's contact details. */
const getPosterItem = cache(async (id: string) => {
  const itemId = Number(id);
  if (!Number.isSafeInteger(itemId) || itemId <= 0) return null;
  const [row] = await db
    .select({
      id: items.id,
      type: items.type,
      title: items.title,
      description: items.description,
      category: items.category,
      approximateLocation: items.approximateLocation,
      city: items.city,
      country: items.country,
      dateLostFound: items.dateLostFound,
      photo: sql<string | null>`${items.photos} ->> 0`,
    })
    .from(items)
    // Archived listings are no longer public.
    .where(and(eq(items.id, itemId), ne(items.status, "archived")))
    .limit(1);
  return row ?? null;
});

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const item = await getPosterItem(id).catch(() => null);
  return {
    title: item
      ? `Poster: ${item.type === "lost" ? "Lost" : "Found"} ${item.title} | LOSTFOUND`
      : "Poster | LOSTFOUND",
    robots: { index: false, follow: false },
  };
}

function truncate(text: string, max: number) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

function isImageSrc(value: string | null): value is string {
  if (!value) return false;
  return value.startsWith("data:image/") || /^https?:\/\//i.test(value) || (value.startsWith("/") && !value.startsWith("//"));
}

// Sizes are in container units (cqw) of the printable area, so the on-screen
// sheet is an exact scaled preview of the printed page at any width.
const POSTER_CSS = `
@page { size: A4; margin: 12mm; }
.poster-sheet {
  --w: min(210mm, calc(100vw - 32px));
  position: relative;
  width: var(--w);
  min-height: calc(var(--w) * 297 / 210);
  padding: calc(var(--w) * 12 / 210);
  margin: 0 auto;
  background: #fff;
  color: #0f172a;
  border-radius: 6px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06), 0 30px 60px -24px rgba(15, 23, 42, 0.45);
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}
.poster-content { container-type: inline-size; }
.poster-stack { height: 145cqw; display: flex; flex-direction: column; gap: 2cqw; }
.poster-top { display: flex; align-items: center; justify-content: space-between; font-size: 2.4cqw; color: #475569; }
.poster-brand { display: flex; align-items: center; gap: 1.4cqw; font-weight: 800; letter-spacing: 0.02em; color: #0f172a; }
.poster-logo { display: inline-flex; align-items: center; justify-content: center; width: 4.6cqw; height: 4.6cqw; border-radius: 1.2cqw; background: #059669; color: #fff; font-size: 2.1cqw; font-weight: 900; }
.poster-ref { font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; }
.poster-headline { display: flex; align-items: flex-end; justify-content: space-between; gap: 3cqw; border-bottom: 0.5cqw solid var(--accent); padding-bottom: 2cqw; }
.poster-word { font-size: 23cqw; line-height: 0.78; font-weight: 900; letter-spacing: -0.045em; color: var(--accent); margin-left: -0.8cqw; }
.poster-tagline { font-size: 4cqw; line-height: 1.15; font-weight: 800; text-align: right; color: #0f172a; max-width: 30cqw; padding-bottom: 0.6cqw; }
.poster-photo { flex: 1 1 auto; min-height: 30cqw; border-radius: 2.4cqw; overflow: hidden; background: #f1f5f9; display: flex; align-items: center; justify-content: center; }
.poster-photo img { width: 100%; height: 100%; object-fit: contain; display: block; }
.poster-nophoto { display: flex; flex-direction: column; align-items: center; gap: 1.5cqw; color: #94a3b8; font-size: 2.8cqw; font-weight: 600; }
.poster-nophoto svg { width: 12cqw; height: 12cqw; }
.poster-title { font-size: 6cqw; line-height: 1.08; font-weight: 800; letter-spacing: -0.02em; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.poster-title::first-letter, .poster-desc::first-letter { text-transform: uppercase; }
.poster-chip { display: inline-block; vertical-align: middle; margin-left: 1.6cqw; padding: 0.5cqw 1.8cqw; border-radius: 99px; background: var(--accent-soft); color: var(--accent); font-size: 2.3cqw; font-weight: 700; letter-spacing: 0.02em; position: relative; top: -0.6cqw; }
.poster-desc { font-size: 2.9cqw; line-height: 1.45; color: #334155; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; overflow-wrap: anywhere; }
.poster-facts { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 1.6cqw; margin: 0; }
.poster-facts > div { background: #f8fafc; border: 0.25cqw solid #e2e8f0; border-radius: 1.8cqw; padding: 1.6cqw 2cqw; min-width: 0; }
.poster-facts dt { font-size: 1.9cqw; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #64748b; }
.poster-facts dd { margin: 0.4cqw 0 0; font-size: 3cqw; font-weight: 700; line-height: 1.2; text-transform: capitalize; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.poster-cta { display: flex; align-items: center; gap: 3.2cqw; padding: 2.4cqw; border-radius: 2.4cqw; background: var(--accent-soft); border: 0.35cqw solid var(--accent-line); }
.poster-qr { flex: none; width: 22cqw; padding: 1.4cqw; background: #fff; border-radius: 1.6cqw; }
.poster-qr svg { display: block; width: 100%; height: auto; }
.poster-cta-title { font-size: 4.1cqw; line-height: 1.15; font-weight: 800; letter-spacing: -0.01em; }
.poster-cta-sub { margin-top: 1cqw; font-size: 2.4cqw; line-height: 1.4; color: #475569; }
.poster-url { margin-top: 1.4cqw; font-size: 2.5cqw; font-weight: 700; color: var(--accent); overflow-wrap: anywhere; }
@media print {
  html, body { background: #fff !important; }
  body > *:not(main) { display: none !important; }
  .no-print { display: none !important; }
  .poster-page { min-height: 0 !important; padding: 0 !important; background: none !important; }
  .poster-sheet { width: auto; min-height: 0; padding: 0; margin: 0; border-radius: 0; box-shadow: none; overflow: hidden; break-inside: avoid; }
}
`;

export default async function PosterPage({ params }: PageProps) {
  const { id } = await params;
  const item = await getPosterItem(id);
  if (!item) notFound();

  const isLost = item.type === "lost";
  const itemUrl = `${getSiteUrl()}/items/${item.id}`;
  const qrSvg = await QRCode.toString(itemUrl, {
    type: "svg",
    margin: 0,
    errorCorrectionLevel: "M",
    color: { dark: "#0f172a", light: "#ffffff" },
  });
  const date = item.dateLostFound.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  });
  const accent = isLost
    ? { "--accent": "#e11d48", "--accent-soft": "#fff1f2", "--accent-line": "#fecdd3" }
    : { "--accent": "#059669", "--accent-soft": "#ecfdf5", "--accent-line": "#a7f3d0" };

  return (
    <div className="poster-page min-h-[calc(100vh-64px)] bg-slate-200/70 dark:bg-slate-900 px-4 py-8 sm:py-10">
      <style dangerouslySetInnerHTML={{ __html: POSTER_CSS }} />
      <PosterToolbar backHref={`/items/${item.id}`} />

      <article className="poster-sheet" style={accent as CSSProperties} aria-label={`${isLost ? "Lost" : "Found"} poster`}>
        <div className="poster-content">
          <div className="poster-stack">
            <div className="poster-top">
              <span className="poster-brand">
                <span className="poster-logo">LF</span>
                LOSTFOUND
              </span>
              <span className="poster-ref">Ref #{item.id}</span>
            </div>

            <div className="poster-headline">
              <h1 className="poster-word">{isLost ? "LOST" : "FOUND"}</h1>
              <p className="poster-tagline">{isLost ? "Have you seen this?" : "Is this yours?"}</p>
            </div>

            <div className="poster-photo">
              {isImageSrc(item.photo) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.photo} alt={item.title} />
              ) : (
                <div className="poster-nophoto">
                  <ImageIcon aria-hidden="true" />
                  No photo provided
                </div>
              )}
            </div>

            <div>
              <h2 className="poster-title">
                {item.title}
                <span className="poster-chip">{item.category}</span>
              </h2>
            </div>
            {item.description.trim() && <p className="poster-desc">{truncate(item.description, 220)}</p>}

            <dl className="poster-facts">
              <div>
                <dt>Area</dt>
                <dd>{item.approximateLocation}</dd>
              </div>
              <div>
                <dt>City</dt>
                <dd>{[item.city, item.country].filter(Boolean).join(", ") || "—"}</dd>
              </div>
              <div>
                <dt>{isLost ? "Lost on" : "Found on"}</dt>
                <dd>{date}</dd>
              </div>
            </dl>

            <div className="poster-cta">
              <div className="poster-qr" role="img" aria-label={`QR code linking to ${itemUrl}`} dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <div className="min-w-0">
                <p className="poster-cta-title">
                  Scan to contact the {isLost ? "owner" : "finder"} safely on LostFound
                </p>
                <p className="poster-cta-sub">
                  No phone numbers or addresses here. Messages go through LostFound, so everyone&apos;s details stay private.
                </p>
                <p className="poster-url">{itemUrl.replace(/^https?:\/\//, "")}</p>
              </div>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
