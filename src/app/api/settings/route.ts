import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { db, withDbRetry } from "@/db";
import { organizationSettings } from "@/db/schema";
import { authErrorResponse } from "@/lib/api-errors";
import { PUBLIC_CONTENT_TAG } from "@/lib/cache";
import {
  DEFAULT_CHAT_UNLOCK_FEE_CENTS,
  DEFAULT_SUBSCRIPTION_FEE_CENTS,
  feeToCents,
} from "@/lib/stripe";

/**
 * Drop inline base64 images (e.g. metadata.founderContent.image, ~170 KB) from
 * the public payload. Every page loads this endpoint and no public page uses
 * them; admins edit them through /api/admin/settings, which is unaffected.
 */
function stripInlineImages(value: unknown): unknown {
  if (typeof value === "string") return value.startsWith("data:") ? null : value;
  if (Array.isArray(value)) return value.map(stripInlineImages);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, stripInlineImages(v)])
    );
  }
  return value;
}

/**
 * Public site settings. metadata.oneTimeUnlockFee and
 * metadata.premiumSubscriptionFee are always integer cents here (the admin may
 * have stored 4.99 or 499), matching what Stripe is actually charged.
 * Cached; admin settings/organization saves purge PUBLIC_CONTENT_TAG.
 */
const loadPublicSettings = unstable_cache(
  () =>
    withDbRetry(async () => {
      const [settings] = await db.select().from(organizationSettings).limit(1);
      if (!settings) return null;

      const metadata = settings.metadata ?? {};
      return stripInlineImages({
        ...settings,
        metadata: {
          ...metadata,
          oneTimeUnlockFee: feeToCents(metadata.oneTimeUnlockFee, DEFAULT_CHAT_UNLOCK_FEE_CENTS),
          premiumSubscriptionFee: feeToCents(
            metadata.premiumSubscriptionFee,
            DEFAULT_SUBSCRIPTION_FEE_CENTS
          ),
        },
      });
    }),
  ["public-settings-v1"],
  { revalidate: 300, tags: [PUBLIC_CONTENT_TAG] }
);

export async function GET() {
  try {
    return NextResponse.json({ settings: await loadPublicSettings() });
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;
    console.error("Get public settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
