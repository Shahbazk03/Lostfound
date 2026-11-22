import Stripe from "stripe";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { organizationSettings } from "@/db/schema";

const secretKey = process.env.STRIPE_SECRET_KEY?.trim() ?? "";

/**
 * null until a real secret/restricted key (sk_… / rk_…) is configured.
 * Placeholder values count as "not configured" so routes answer 503 instead
 * of failing deep inside a Stripe call.
 */
export const stripe = /^(sk|rk)_(test|live)_/.test(secretKey)
  ? new Stripe(secretKey, {
      apiVersion: "2026-05-27.dahlia",
    })
  : null;

export function paymentsUnavailable() {
  return NextResponse.json(
    { error: "Payments are not available yet. Please try again later." },
    { status: 503 }
  );
}

/** Stripe's minimum card charge (USD and most currencies) is 50 cents. */
export const MIN_CHARGE_CENTS = 50;
const MAX_CHARGE_CENTS = 99_999_999;
export const DEFAULT_CHAT_UNLOCK_FEE_CENTS = 100; // $1.00
export const DEFAULT_SUBSCRIPTION_FEE_CENTS = 499; // $4.99 / month

/**
 * Public base URL for Stripe redirects: NEXT_PUBLIC_APP_URL when set,
 * otherwise the request's own origin.
 */
export function getAppBaseUrl(request: Request): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (configured) {
    try {
      return new URL(configured).origin;
    } catch {
      console.error("NEXT_PUBLIC_APP_URL is not a valid URL; using the request origin.");
    }
  }
  const host = (request.headers.get("x-forwarded-host") ?? request.headers.get("host"))
    ?.split(",")[0]
    .trim();
  if (host) {
    const forwardedProto = request.headers.get("x-forwarded-proto")?.split(",")[0].trim();
    const isLocal = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(host);
    const proto =
      forwardedProto === "http" || forwardedProto === "https"
        ? forwardedProto
        : isLocal
          ? "http"
          : "https";
    return `${proto}://${host}`;
  }
  return new URL(request.url).origin;
}

/** ISO currency code in Stripe's lowercase form; falls back to "usd". */
export function normalizeCurrency(value: unknown): string {
  const code = typeof value === "string" ? value.trim().toLowerCase() : "";
  return /^[a-z]{3}$/.test(code) ? code : "usd";
}

/**
 * Turn an admin-configured fee into integer cents.
 *
 * Rule: a value written with a decimal point ("4.99", 4.99, "5.00") is in
 * major units and is multiplied by 100; a whole number (499, "499") is
 * already cents. Anything non-numeric, below 50 cents or absurdly large
 * falls back to the default.
 */
export function feeToCents(value: unknown, fallback: number): number {
  let amount: number;
  let majorUnits: boolean;

  if (typeof value === "number") {
    amount = value;
    majorUnits = !Number.isInteger(value);
  } else if (typeof value === "string" && value.trim() !== "") {
    const text = value.trim();
    amount = Number(text);
    majorUnits = text.includes(".");
  } else {
    return fallback;
  }

  if (!Number.isFinite(amount) || amount <= 0) return fallback;

  const cents = Math.round(majorUnits ? amount * 100 : amount);
  if (cents < MIN_CHARGE_CENTS || cents > MAX_CHARGE_CENTS) {
    console.warn(`Ignoring configured fee ${JSON.stringify(value)}; using ${fallback} cents.`);
    return fallback;
  }
  return cents;
}

/** Platform-wide fees from organization_settings.metadata, normalised to cents. */
export async function getPlatformPricing() {
  const [settings] = await db
    .select({
      metadata: organizationSettings.metadata,
      currency: organizationSettings.currency,
    })
    .from(organizationSettings)
    .limit(1);

  const metadata = settings?.metadata ?? {};
  return {
    chatUnlockFee: feeToCents(metadata.oneTimeUnlockFee, DEFAULT_CHAT_UNLOCK_FEE_CENTS),
    subscriptionFee: feeToCents(
      metadata.premiumSubscriptionFee,
      DEFAULT_SUBSCRIPTION_FEE_CENTS
    ),
    currency: normalizeCurrency(settings?.currency),
  };
}

function requireStripe(): Stripe {
  if (!stripe) throw new Error("Stripe is not configured");
  return stripe;
}

type CheckoutResult = { id: string; url: string };

/**
 * Stripe substitutes the real id for this literal placeholder. The success
 * page passes it to POST /api/payments/confirm.
 */
const SESSION_ID_PARAM = "session_id={CHECKOUT_SESSION_ID}";

function toResult(session: Stripe.Checkout.Session): CheckoutResult {
  if (!session.url) throw new Error("Stripe returned a checkout session without a URL");
  return { id: session.id, url: session.url };
}

type OneTimeCheckoutInput = {
  userId: number;
  itemId: number;
  amount: number;
  currency: string;
  baseUrl: string;
  customerEmail?: string;
};

/** One-time payment that reveals an item's precise location. */
export async function createItemUnlockSession(
  input: OneTimeCheckoutInput & { itemTitle?: string }
): Promise<CheckoutResult> {
  const { userId, itemId, amount, currency, baseUrl, customerEmail, itemTitle } = input;
  const session = await requireStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: normalizeCurrency(currency),
          product_data: {
            name: "Unlock precise location",
            description: itemTitle ? itemTitle.slice(0, 200) : `Item #${itemId}`,
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    customer_email: customerEmail,
    client_reference_id: String(userId),
    success_url: `${baseUrl}/items/${itemId}?unlocked=location&${SESSION_ID_PARAM}`,
    cancel_url: `${baseUrl}/items/${itemId}?unlocked=cancelled`,
    metadata: {
      type: "item_unlock",
      userId: String(userId),
      itemId: String(itemId),
    },
  });
  return toResult(session);
}

/** One-time payment that unlocks messaging for one item. */
export async function createConversationUnlockSession(
  input: OneTimeCheckoutInput
): Promise<CheckoutResult> {
  const { userId, itemId, amount, currency, baseUrl, customerEmail } = input;
  const session = await requireStripe().checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: normalizeCurrency(currency),
          product_data: {
            name: "Unlock Chat",
            description: "Unlock messaging for this item",
          },
          unit_amount: amount,
        },
        quantity: 1,
      },
    ],
    customer_email: customerEmail,
    client_reference_id: String(userId),
    success_url: `${baseUrl}/items/${itemId}?unlocked=chat&${SESSION_ID_PARAM}`,
    cancel_url: `${baseUrl}/items/${itemId}?unlocked=cancelled`,
    metadata: {
      type: "conversation_unlock",
      userId: String(userId),
      itemId: String(itemId),
    },
  });
  return toResult(session);
}

/** Monthly premium subscription (unlimited messaging). */
export async function createSubscriptionSession(input: {
  userId: number;
  itemId?: number;
  amount: number;
  currency: string;
  baseUrl: string;
  customerEmail?: string;
}): Promise<CheckoutResult> {
  const { userId, itemId, amount, currency, baseUrl, customerEmail } = input;
  const returnPath = itemId ? `/items/${itemId}` : "/dashboard";
  const session = await requireStripe().checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: normalizeCurrency(currency),
          product_data: {
            name: "LostFound Premium",
            description: "Unlimited messaging subscription",
          },
          unit_amount: amount,
          recurring: { interval: "month" },
        },
        quantity: 1,
      },
    ],
    customer_email: customerEmail,
    client_reference_id: String(userId),
    success_url: `${baseUrl}${returnPath}?unlocked=premium&${SESSION_ID_PARAM}`,
    cancel_url: `${baseUrl}${returnPath}?unlocked=cancelled`,
    metadata: {
      type: "monthly_subscription",
      userId: String(userId),
    },
    subscription_data: {
      metadata: { type: "monthly_subscription", userId: String(userId) },
    },
  });
  return toResult(session);
}
