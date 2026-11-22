// Server component on the homepage (no "use client"): only the interactive
// islands below (MatchVisual, HowItWorks, AdminDeleteItem, ScrollReveal,
// the footer) ship JavaScript. It also renders inside the admin CMS live
// preview, so it must stay free of server-only imports and hooks.
import Link from "next/link";
import type { ReactNode } from "react";
import {
  Search,
  MapPin,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Globe,
  CheckCircle,
  CheckCircle2,
  Lock,
  Smartphone,
  Tablet,
  Wallet,
  CreditCard,
  IdCard,
  Key,
  KeyRound,
  Briefcase,
  Backpack,
  Luggage,
  FileText,
  FileQuestion,
  Book,
  BookOpen,
  Laptop,
  Headphones,
  Camera,
  Watch,
  Glasses,
  Gem,
  Dog,
  Cat,
  PawPrint,
  Shirt,
  Umbrella,
  Bike,
  Car,
  Dumbbell,
  Trophy,
  Gamepad2,
  ToyBrick,
  Baby,
  Gift,
  Tag,
  Box,
  Package,
  Star,
  Users,
  Zap,
  Activity,
  Cpu,
  Bell,
  MessageSquare,
  MessageCircle,
  Mail,
  Phone,
  PhoneCall,
  Heart,
  HeartPulse,
  Eye,
  Clock,
  Award,
  BadgeCheck,
  Sparkles,
  TrendingUp,
  ThumbsUp,
  Handshake,
  Brain,
  Bot,
  Rocket,
  Target,
  Fingerprint,
  Server,
  Building2,
  GraduationCap,
  Lightbulb,
  Smile,
  Map as MapIcon,
  Navigation,
  Compass,
  Plane,
  Train,
  Bus,
  ArrowRight,
  ChevronRight,
  Plus,
  Inbox,
  MapPinned,
  LayoutDashboard,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";
import RecentListings from "@/components/RecentListings";
import DynamicFooter from "@/components/DynamicFooter";
import ScrollReveal from "@/components/animations/ScrollReveal";
import { categories as itemCategories, categoryBrowseHref, toItemCategory, cn } from "@/lib/utils";
import HeroSearch from "./HeroSearch";
import MatchVisual from "./MatchVisual";
import HowItWorks from "./HowItWorks";
import { CATEGORY_ICONS } from "./category-icons";
import { formatMoney, placeLabel, timeAgo } from "./format";
import type { ItemCardData } from "./ItemCard";

// Icons the CMS can reference by name. Importing them explicitly (instead of
// `import * as Icons`) keeps the bundle to the icons actually used. Unknown
// names fall back to a default icon.
const CMS_ICONS: Record<string, LucideIcon> = {
  Search, MapPin, Shield, ShieldCheck, ShieldAlert, Globe, CheckCircle, Lock,
  Smartphone, Tablet, Wallet, CreditCard, IdCard, Key, KeyRound, Briefcase,
  Backpack, Luggage, FileText, FileQuestion, Book, BookOpen, Laptop, Headphones,
  Camera, Watch, Glasses, Gem, Dog, Cat, PawPrint, Shirt, Umbrella, Bike, Car,
  Dumbbell, Trophy, Gamepad2, ToyBrick, Baby, Gift, Tag, Box, Package, Star,
  Users, Zap, Activity, Cpu, Bell, MessageSquare, MessageCircle, Mail, Phone,
  PhoneCall, Heart, HeartPulse, Eye, Clock, Award, BadgeCheck, Sparkles,
  TrendingUp, ThumbsUp, Handshake, Brain, Bot, Rocket, Target, Fingerprint,
  Server, Building2, GraduationCap, Lightbulb, Smile, Map: MapIcon, Navigation, Compass,
  Plane, Train, Bus,
};

const normalizeIconName = (name: string) => name.toLowerCase().replace(/[^a-z0-9]/g, "");
const CMS_ICONS_NORMALIZED = new Map(
  Object.entries(CMS_ICONS).map(([name, icon]) => [normalizeIconName(name), icon])
);

/** Resolves "Wallet", "wallet" or "check-circle" style names; falls back otherwise. */
function resolveIcon(name: unknown, fallback: LucideIcon): LucideIcon {
  if (typeof name !== "string" || !name) return fallback;
  return CMS_ICONS[name] ?? CMS_ICONS_NORMALIZED.get(normalizeIconName(name)) ?? fallback;
}

// Tailwind only generates classes it can find as complete strings in source,
// so runtime-built names like `md:grid-cols-${n}` never work. Use fixed maps.
const STATS_GRID_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
  5: "grid-cols-2 md:grid-cols-5",
};

const STAT_COLORS: Record<string, string> = {
  emerald: "text-emerald-600 dark:text-emerald-400",
  blue: "text-sky-600 dark:text-sky-400",
  purple: "text-violet-600 dark:text-violet-400",
  orange: "text-amber-600 dark:text-amber-400",
};

// Keyframes for these live in app/globals.css (@theme).
const HERO_ANIMATIONS: Record<string, string> = {
  none: "",
  float: "animate-hero-float",
  pulse: "animate-hero-pulse",
  bounce: "animate-hero-bounce",
};

/** The old stock illustration; treated as "no custom image" so the match visual shows. */
const DEFAULT_ILLUSTRATION = "/hero-3d-illustration.png";

const CONTAINER = "mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8";
const SECTION_Y = "py-16 md:py-24";
const FOCUS_RING =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-offset-slate-950";
const PRIMARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 " +
  FOCUS_RING;
const SECONDARY_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 " +
  FOCUS_RING;

/* ------------------------------------------------------------------------ */
/* Data types (filled in app/page.tsx; the admin preview passes a subset)    */
/* ------------------------------------------------------------------------ */

/** One number in the stats strip, already formatted. Computed in app/page.tsx. */
export interface CommunityStat {
  label: string;
  value: string;
  accent?: boolean;
}

/** A city and how many items were reported there. */
export interface CityCount {
  /** Normalised (lowercased, trimmed) city name. */
  key: string;
  /** Display name. */
  name: string;
  count: number;
}

/** Public fields of a recent item (live feed and "Recently reported" cards). */
export interface LatestItem {
  id: number;
  type: "lost" | "found";
  title: string;
  area: string;
  city: string;
  /** ISO timestamp the report was posted. */
  createdAt: string;
  category?: string;
  /** First photo URL, if any. */
  photo?: string | null;
  /** ISO date the item was lost or found. */
  dateLostFound?: string;
  status?: string;
}

/** Platform fees in minor units (from organisation settings). */
export interface PlatformPricing {
  currency: string;
  chatUnlockFee: number;
  subscriptionFee: number;
}

export interface HomepageData {
  hero: any;
  statisticsList: any[];
  categoriesList: any[];
  featuresList: any[];
  pricingPlansList: any[];
  /** Real community numbers (zeros already removed). */
  communityStats?: CommunityStat[];
  topCities?: CityCount[];
  latestItems?: LatestItem[];
  /** Active listings per canonical category. */
  categoryCounts?: Record<string, number>;
  /** Active listings in total. */
  activeItems?: number;
  /** Distinct cities with at least one report. */
  citiesCount?: number;
  pricing?: PlatformPricing;
  /** Server time (ms) the data was read at; anchors "3h ago" labels. */
  renderedAt?: number;
  // Legacy counts, still supplied by the admin CMS preview.
  recoveredItemsCount?: number;
  usersCount?: number;
  successRate?: number;
  countriesCount?: number;
  globalNetwork?: any;
  faq?: any;
  cta?: any;
  footer?: any;
}

/** Stats for callers that only pass the legacy counts (the admin preview). */
function legacyStats(data: HomepageData): CommunityStat[] {
  const stats: CommunityStat[] = [];
  if (data.recoveredItemsCount) stats.push({ label: "Items reunited", value: String(data.recoveredItemsCount), accent: true });
  if (data.usersCount) stats.push({ label: "Members", value: String(data.usersCount) });
  if (data.countriesCount) stats.push({ label: "Countries", value: String(data.countriesCount) });
  if (data.recoveredItemsCount && data.successRate) stats.push({ label: "Success rate", value: `${data.successRate}%`, accent: true });
  return stats.length >= 2 ? stats : [];
}

/** True for CMS stat values that are just zero ("0", "0%", "0+"). */
function isZeroValue(value: unknown) {
  const digits = String(value ?? "").replace(/[^0-9.]/g, "");
  return digits !== "" && Number(digits) === 0;
}

/* ------------------------------------------------------------------------ */
/* Building blocks                                                           */
/* ------------------------------------------------------------------------ */

function SectionHeader({
  eyebrow,
  title,
  lead,
  id,
  align = "center",
  action,
  dark = false,
}: {
  eyebrow: ReactNode;
  title: ReactNode;
  lead?: ReactNode;
  id?: string;
  align?: "center" | "left";
  action?: ReactNode;
  dark?: boolean;
}) {
  const text = (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p className={cn("text-sm font-semibold", dark ? "text-emerald-400" : "text-emerald-600 dark:text-emerald-400")}>{eyebrow}</p>
      <h2
        id={id}
        className={cn(
          "mt-2 text-3xl font-bold tracking-tight md:text-4xl",
          dark ? "text-white" : "text-slate-900 dark:text-white"
        )}
      >
        {title}
      </h2>
      {lead && (
        <p className={cn("mt-4 text-lg leading-relaxed", dark ? "text-slate-400" : "text-slate-600 dark:text-slate-400")}>{lead}</p>
      )}
    </div>
  );
  if (!action) return text;
  return (
    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
      {text}
      <div className="shrink-0">{action}</div>
    </div>
  );
}

function TextLink({ href, children, dark = false }: { href: string; children: ReactNode; dark?: boolean }) {
  return (
    <Link
      href={href}
      className={cn(
        "group inline-flex items-center gap-1.5 rounded-lg px-1 py-1 text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
        dark
          ? "text-emerald-300 hover:text-emerald-200"
          : "text-emerald-700 hover:text-emerald-800 dark:text-emerald-400 dark:hover:text-emerald-300"
      )}
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden />
    </Link>
  );
}

function LiveDot() {
  return (
    <span className="relative flex h-2 w-2" aria-hidden>
      <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60 motion-safe:animate-ping" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
    </span>
  );
}

/* ------------------------------------------------------------------------ */
/* Live activity                                                             */
/* ------------------------------------------------------------------------ */

function TopCities({ cities }: { cities: CityCount[] }) {
  const max = Math.max(1, ...cities.map((c) => c.count));
  return (
    <div className="flex h-full flex-col rounded-2xl bg-white/[0.04] p-5 ring-1 ring-inset ring-white/10 sm:p-6">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold text-white">
          <MapPinned className="h-5 w-5 text-emerald-400" aria-hidden />
          Top cities
        </h3>
        <span className="text-xs font-medium text-slate-400">by items reported</span>
      </div>

      {cities.length > 0 ? (
        <>
          <ol className="space-y-1">
            {cities.map((city, i) => (
              <li key={city.key}>
                <Link
                  href={`/browse?city=${encodeURIComponent(city.name)}`}
                  className="group block rounded-xl px-3 py-2.5 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400"
                >
                  <div className="flex items-baseline justify-between gap-3 text-sm">
                    <span className="flex min-w-0 items-baseline gap-3">
                      <span className="w-4 shrink-0 text-right text-xs font-semibold tabular-nums text-slate-500">{i + 1}</span>
                      <span className="truncate font-semibold text-slate-100 group-hover:text-white">{city.name}</span>
                    </span>
                    <span className="shrink-0 tabular-nums text-slate-400">
                      <span className="font-semibold text-white">{city.count}</span> {city.count === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <div className="ml-7 mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400"
                      style={{ width: `${Math.max(6, Math.round((city.count / max) * 100))}%` }}
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ol>
          <p className="mt-auto border-t border-white/10 pt-4 text-sm text-slate-400">
            {cities.length < 3
              ? "We're growing city by city. Report an item to put yours on the board."
              : "Pick a city to see what's been reported there."}
          </p>
        </>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <MapPinned className="h-8 w-8 text-emerald-400" aria-hidden />
          <p className="mt-3 font-semibold text-white">No cities on the board yet</p>
          <p className="mt-1 max-w-xs text-sm text-slate-400">Cities show up here as soon as items are reported with a location.</p>
        </div>
      )}
    </div>
  );
}

function LatestReports({ items, now }: { items: LatestItem[]; now: number }) {
  return (
    <div className="flex h-full flex-col rounded-2xl bg-white/[0.04] p-5 ring-1 ring-inset ring-white/10 sm:p-6">
      <div className="mb-2 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold text-white">
          <Activity className="h-5 w-5 text-emerald-400" aria-hidden />
          Latest reports
        </h3>
        <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-semibold text-emerald-300 ring-1 ring-inset ring-emerald-500/20">
          <LiveDot />
          Live
        </span>
      </div>

      {items.length > 0 ? (
        <ul className="-mx-2 divide-y divide-white/[0.06]">
          {items.map((item) => {
            const place = placeLabel(item.area, item.city);
            return (
              <li key={item.id}>
                <Link
                  href={`/items/${item.id}`}
                  className="group flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 sm:gap-4"
                >
                  <span
                    className={cn(
                      "inline-flex w-[60px] shrink-0 justify-center rounded-full px-2 py-1 text-[11px] font-bold uppercase tracking-wide ring-1 ring-inset",
                      item.type === "lost"
                        ? "bg-rose-500/15 text-rose-300 ring-rose-500/30"
                        : "bg-emerald-500/15 text-emerald-300 ring-emerald-500/30"
                    )}
                  >
                    {item.type === "lost" ? "Lost" : "Found"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-slate-100 group-hover:text-white">{item.title}</span>
                    {place && (
                      <span className="mt-0.5 flex items-center gap-1 text-sm text-slate-400">
                        <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span className="truncate">{place}</span>
                      </span>
                    )}
                  </span>
                  <time dateTime={item.createdAt} className="shrink-0 text-xs font-medium tabular-nums text-slate-400">
                    {timeAgo(item.createdAt, now)}
                  </time>
                  <ChevronRight
                    className="hidden h-4 w-4 shrink-0 text-slate-500 transition-transform group-hover:text-emerald-300 motion-safe:group-hover:translate-x-0.5 sm:block"
                    aria-hidden
                  />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <Inbox className="h-8 w-8 text-emerald-400" aria-hidden />
          <p className="mt-3 font-semibold text-white">It&apos;s quiet right now</p>
          <p className="mt-1 max-w-xs text-sm text-slate-400">New lost and found reports appear here the moment they&apos;re posted.</p>
          <Link
            href="/report"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Report an item
          </Link>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------------ */
/* Page                                                                      */
/* ------------------------------------------------------------------------ */

export default function HomepageVisuals({ data }: { data: HomepageData }) {
  const { hero, statisticsList, categoriesList, featuresList, pricingPlansList, globalNetwork, faq, cta, footer } = data;

  if (!hero) return null;

  // Builds the headline as React elements (never raw HTML), so CMS text can't
  // inject markup or script. Highlight words are regex-escaped before use.
  const renderHeadline = () => {
    const headline: string = hero?.headline || "";
    const words: string[] = (hero?.highlightedWords || "")
      .split(",")
      .map((w: string) => w.trim())
      .filter(Boolean);

    const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const matcher = words.length ? new RegExp(`(${words.map(escapeRegExp).join("|")})`, "gi") : null;
    const lowerWords = new Set(words.map((w) => w.toLowerCase()));

    return headline.split("\n").map((line, lineIdx) => (
      <span key={lineIdx}>
        {lineIdx > 0 && <br />}
        {(matcher ? line.split(matcher) : [line]).map((part, i) =>
          lowerWords.has(part.toLowerCase()) ? (
            <span key={i} className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent dark:from-emerald-400 dark:to-teal-300">
              {part}
            </span>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </span>
    ));
  };

  const now = data.renderedAt ?? 0;
  const topCities = data.topCities ?? [];
  const latestItems = data.latestItems ?? [];
  const pricing = data.pricing;

  // Stats: admin-entered stats win when present; otherwise real community numbers.
  const cmsStats = (statisticsList || []).filter((s) => s.isActive !== false && !isZeroValue(s.numberValue));
  const realStats = data.communityStats ?? legacyStats(data);
  const statsCount = cmsStats.length > 0 ? cmsStats.length : realStats.length;
  const statsColumns = STATS_GRID_COLS[Math.min(Math.max(statsCount, 1), 5)];

  // Hero illustration: a custom CMS image replaces the match visual.
  const customIllustration =
    typeof hero.illustrationImage === "string" &&
    hero.illustrationImage.trim() !== "" &&
    hero.illustrationImage !== DEFAULT_ILLUSTRATION
      ? hero.illustrationImage
      : null;
  const heroAnimationClass = HERO_ANIMATIONS[hero.illustrationAnimation ?? "float"] ?? HERO_ANIMATIONS.float;

  // "3 active listings in Lucknow" (real numbers only).
  const activeItems = data.activeItems ?? 0;
  const citiesCount = data.citiesCount ?? topCities.length;
  const heroPulse =
    activeItems > 0
      ? `${activeItems} active listing${activeItems === 1 ? "" : "s"}${
          citiesCount === 1 && topCities[0]
            ? ` in ${topCities[0].name}`
            : citiesCount > 1
              ? ` across ${citiesCount} cities`
              : ""
        }`
      : null;

  // Recent listings come from the same cached query as the live feed. The
  // admin preview has none, so RecentListings shows placeholders there.
  const recentItems: ItemCardData[] | undefined = data.latestItems
    ? data.latestItems.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        category: item.category ?? "Other",
        area: item.area,
        city: item.city,
        photo: item.photo ?? null,
        date: item.dateLostFound ?? item.createdAt,
        status: item.status,
      }))
    : undefined;

  // Category tiles with real counts. CMS categories win when configured;
  // otherwise the canonical categories, busiest first, plus "All".
  const counts = data.categoryCounts ?? {};
  const countFor = (name: string) => counts[toItemCategory(name) ?? ""] ?? 0;
  const activeCmsCategories = (categoriesList || []).filter((c) => c.isActive !== false && c.name);
  const categoryTiles =
    activeCmsCategories.length > 0
      ? activeCmsCategories.map((cat, i) => ({
          key: String(cat.id ?? i),
          label: String(cat.name),
          href: categoryBrowseHref(String(cat.name)),
          icon: resolveIcon(cat.icon, CATEGORY_ICONS[toItemCategory(cat.name) ?? ""] ?? Package),
          count: countFor(String(cat.name)),
        }))
      : itemCategories
          .filter((c) => c !== "Other")
          .map((c, i) => ({ key: c, label: c, href: categoryBrowseHref(c), icon: CATEGORY_ICONS[c] ?? Package, count: counts[c] ?? 0, order: i }))
          .sort((a, b) => b.count - a.count || a.order - b.order)
          .slice(0, 7);

  const features =
    featuresList?.length > 0
      ? featuresList
          .filter((f) => f.isActive !== false)
          .map((f, i) => ({ key: String(f.id ?? i), icon: resolveIcon(f.icon, ShieldCheck), title: String(f.title ?? ""), desc: String(f.description ?? "") }))
      : [
          { key: "matching", icon: Sparkles, title: "Smart matching", desc: "Each new report is compared with reports from the other side by category, place, date and description, so likely matches come to you." },
          { key: "location", icon: MapPin, title: "Location privacy", desc: "Listings show only an approximate area. The exact spot is shown only to people who unlock it." },
          { key: "messaging", icon: Lock, title: "Private messaging", desc: "Talk inside LostFound. Your phone number and email are never shown on a listing." },
          { key: "photos", icon: Camera, title: "Photo listings", desc: "Add photos so owners recognise their things at a glance and finders can confirm what they have." },
          { key: "dashboard", icon: LayoutDashboard, title: "One simple dashboard", desc: "Track your reports, review suggested matches and mark items as reunited when they're back." },
          { key: "community", icon: Users, title: "Built for communities", desc: "Neighbourhoods, campuses and stations: the more people report, the faster things find their way home." },
        ];

  const chatFee = pricing ? formatMoney(pricing.chatUnlockFee, pricing.currency) : null;
  const subscriptionFee = pricing ? formatMoney(pricing.subscriptionFee, pricing.currency) : null;

  const defaultFaq = [
    {
      question: "Is LostFound free to use?",
      answer: `Yes. Reporting a lost or found item, browsing listings and getting match suggestions are free. To message the person behind a listing you unlock that conversation once${
        chatFee ? ` (${chatFee})` : ""
      }, or go Premium${subscriptionFee ? ` (${subscriptionFee} a month)` : ""} to message about any listing.`,
    },
    {
      question: "How does smart matching work?",
      answer:
        "When you post a report, LostFound compares it with reports of the opposite type: the category, the city, the dates and the words in the title and description. The likeliest matches are shown first on your dashboard.",
    },
    {
      question: "Who can see where I lost or found something?",
      answer:
        "Everyone sees only the approximate area you choose, for example \"Hazratganj\". The precise location stays hidden and is shown only to people who unlock it.",
    },
    {
      question: "How do I contact the person who found my item?",
      answer:
        "Open the listing and send a message. Conversations happen inside LostFound, so your phone number and email are never shown unless you decide to share them.",
    },
    {
      question: "How do I make sure I'm returning an item to its real owner?",
      answer:
        "Ask about a detail that isn't visible in the photos, such as a lock screen, a card inside or a scratch. Meet in a busy public place, and never pay anyone upfront to get your item back.",
    },
    {
      question: "What should I do once the item is back?",
      answer: "Mark your report as resolved from your dashboard. It leaves the active listings so nobody keeps searching for it.",
    },
  ];
  const cmsFaqItems = Array.isArray(faq?.items) ? faq.items.filter((i: any) => i?.question && i?.answer) : [];
  const faqItems: { question: string; answer: string }[] = cmsFaqItems.length > 0 ? cmsFaqItems : defaultFaq;
  const showFaq = !faq || faq.isActive !== false;

  const activePlans = (pricingPlansList || []).filter((p) => p.isActive !== false);

  return (
    <div className="w-full bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-200">
      {/* ================================================================ */}
      {/* HERO: plain server HTML, fully styled without JavaScript         */}
      {/* ================================================================ */}
      <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
          {hero.backgroundImage ? (
            <div
              className="absolute inset-0 bg-cover bg-center opacity-10"
              style={{ backgroundImage: `url(${JSON.stringify(String(hero.backgroundImage))})` }}
            />
          ) : (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(55%_60%_at_75%_10%,rgba(16,185,129,0.13),transparent_70%)] dark:bg-[radial-gradient(55%_60%_at_75%_10%,rgba(16,185,129,0.14),transparent_70%)]" />
              <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-50 [mask-image:radial-gradient(70%_60%_at_50%_0%,black,transparent)] dark:opacity-[0.06]" />
            </>
          )}
        </div>

        <div className={cn(CONTAINER, "grid items-center gap-12 pb-16 pt-10 md:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16 lg:pb-24 lg:pt-20")}>
          <div className="max-w-3xl">
            {heroPulse && (
              <Link
                href="/browse"
                className={cn(
                  "group mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 py-1 pl-1.5 pr-3 text-sm font-medium text-slate-700 shadow-sm backdrop-blur transition-colors hover:border-emerald-300 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-emerald-500/40",
                  FOCUS_RING
                )}
              >
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                  <LiveDot />
                  Live
                </span>
                {heroPulse}
                <ChevronRight className="h-4 w-4 text-slate-400 transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden />
              </Link>
            )}

            <h1
              id="hero-heading"
              className="text-[2.5rem] font-bold leading-[1.08] tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-[3.5rem] xl:text-6xl"
            >
              {renderHeadline()}
            </h1>
            {hero.subheading && (
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400">{hero.subheading}</p>
            )}

            <div className="mt-8">
              <HeroSearch />
            </div>

            {(hero.primaryButtonText || hero.secondaryButtonText) && (
              <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                {hero.primaryButtonText && (
                  <Link
                    href={hero.primaryButtonLink || "/browse"}
                    className="group inline-flex items-center gap-1.5 rounded-lg py-1 text-sm font-semibold text-slate-700 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-300 dark:hover:text-emerald-400"
                  >
                    {hero.primaryButtonText}
                    <ArrowRight className="h-4 w-4 transition-transform motion-safe:group-hover:translate-x-0.5" aria-hidden />
                  </Link>
                )}
                {hero.secondaryButtonText && (
                  <Link
                    href={hero.secondaryButtonLink || "/report"}
                    className="group inline-flex items-center gap-1.5 rounded-lg py-1 text-sm font-semibold text-slate-700 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-slate-300 dark:hover:text-emerald-400"
                  >
                    <Plus className="h-4 w-4" aria-hidden />
                    {hero.secondaryButtonText}
                  </Link>
                )}
              </div>
            )}

            {Array.isArray(hero.trustBadges) && hero.trustBadges.length > 0 && (
              <ul className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-2.5 border-t border-slate-200/80 pt-6 text-sm text-slate-600 dark:border-slate-800 dark:text-slate-400">
                {hero.trustBadges.map((badge: string, idx: number) => (
                  <li key={idx} className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden />
                    {badge}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="relative w-full">
            {customIllustration ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={customIllustration}
                alt=""
                decoding="async"
                fetchPriority="high"
                className={cn("mx-auto max-h-[560px] w-full object-contain motion-reduce:animate-none", heroAnimationClass)}
              />
            ) : (
              <MatchVisual />
            )}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* STATS                                                            */}
      {/* ================================================================ */}
      {statsCount > 0 && (
        <section aria-label="LostFound in numbers" className="border-y border-slate-200/80 bg-slate-50 dark:border-slate-800 dark:bg-slate-950">
          <dl className={cn("mx-auto grid max-w-[1600px] gap-px bg-slate-200/70 dark:bg-slate-800/70", statsColumns)}>
            {(cmsStats.length > 0
              ? cmsStats.map((stat, i) => ({
                  key: String(stat.id ?? i),
                  label: String(stat.label ?? ""),
                  value: String(stat.numberValue ?? ""),
                  tone: STAT_COLORS[stat.color] ?? "text-slate-900 dark:text-white",
                }))
              : realStats.map((stat) => ({
                  key: stat.label,
                  label: stat.label,
                  value: stat.value,
                  tone: stat.accent ? "text-emerald-600 dark:text-emerald-400" : "text-slate-900 dark:text-white",
                }))
            ).map((stat) => (
              <div
                key={stat.key}
                className="flex flex-col-reverse items-center justify-center gap-1 bg-slate-50 px-3 py-7 text-center dark:bg-slate-950 md:py-9 [&:nth-child(odd):last-child]:col-span-2 md:[&:nth-child(odd):last-child]:col-span-1"
              >
                <dt className="text-xs font-medium text-slate-500 dark:text-slate-400 sm:text-sm">{stat.label}</dt>
                <dd className={cn("text-3xl font-bold tracking-tight tabular-nums md:text-4xl", stat.tone)}>{stat.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {/* ================================================================ */}
      {/* HOW IT WORKS                                                     */}
      {/* ================================================================ */}
      <section id="how-it-works" aria-labelledby="how-heading" className={cn(SECTION_Y, "bg-white dark:bg-slate-950")}>
        <div className={CONTAINER}>
          <ScrollReveal>
            <SectionHeader
              id="how-heading"
              eyebrow="How it works"
              title="From “I lost it” to “got it back”"
              lead="Three simple steps, with help from people nearby."
            />
          </ScrollReveal>
          <div className="mt-12 md:mt-16">
            <HowItWorks />
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* RECENTLY REPORTED                                                */}
      {/* ================================================================ */}
      <RecentListings items={recentItems} now={now} />

      {/* ================================================================ */}
      {/* CATEGORIES                                                       */}
      {/* ================================================================ */}
      <section aria-labelledby="categories-heading" className={cn(SECTION_Y, "bg-white dark:bg-slate-950")}>
        <div className={CONTAINER}>
          <ScrollReveal>
            <SectionHeader
              id="categories-heading"
              align="left"
              eyebrow="Browse by category"
              title="What are you looking for?"
              lead="Jump straight to the kind of item you lost or found."
              action={<TextLink href="/browse">All listings</TextLink>}
            />
          </ScrollReveal>

          <ScrollReveal className="mt-10">
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
              {categoryTiles.map((cat) => (
                <li key={cat.key} className="flex">
                  <Link
                    href={cat.href}
                    className={cn(
                      "group relative flex w-full flex-col rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm transition duration-200 hover:border-emerald-500/30 hover:shadow-md hover:shadow-slate-900/5 motion-safe:hover:-translate-y-0.5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-emerald-500/30 sm:p-5",
                      FOCUS_RING
                    )}
                  >
                    <span className="flex items-start justify-between">
                      <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-50 text-slate-600 ring-1 ring-inset ring-slate-200/70 transition-colors group-hover:bg-emerald-50 group-hover:text-emerald-600 group-hover:ring-emerald-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700 dark:group-hover:bg-emerald-500/10 dark:group-hover:text-emerald-400 dark:group-hover:ring-emerald-500/30">
                        <cat.icon className="h-5 w-5" aria-hidden />
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-300 transition group-hover:text-emerald-600 motion-safe:group-hover:translate-x-0.5 dark:text-slate-600 dark:group-hover:text-emerald-400" aria-hidden />
                    </span>
                    <span className="mt-5 block truncate font-semibold text-slate-900 dark:text-white">{cat.label}</span>
                    <span className={cn("mt-0.5 text-sm", cat.count > 0 ? "font-medium text-emerald-700 dark:text-emerald-400" : "text-slate-400 dark:text-slate-500")}>
                      {cat.count > 0 ? `${cat.count} active listing${cat.count === 1 ? "" : "s"}` : "No listings yet"}
                    </span>
                  </Link>
                </li>
              ))}
              {activeCmsCategories.length === 0 && (
                <li className="flex">
                  <Link
                    href="/browse"
                    className={cn(
                      "group flex w-full flex-col justify-between rounded-2xl border border-dashed border-slate-300 bg-slate-50/60 p-4 transition-colors hover:border-emerald-500/40 hover:bg-emerald-50/40 dark:border-slate-700 dark:bg-slate-900/40 dark:hover:bg-emerald-500/5 sm:p-5",
                      FOCUS_RING
                    )}
                  >
                    <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-slate-600 ring-1 ring-inset ring-slate-200/70 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                      <LayoutGrid className="h-5 w-5" aria-hidden />
                    </span>
                    <span className="mt-5">
                      <span className="block font-semibold text-slate-900 dark:text-white">All categories</span>
                      <span className="mt-0.5 flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                        {activeItems > 0 ? `${activeItems} active listing${activeItems === 1 ? "" : "s"}` : "See everything"}
                      </span>
                    </span>
                  </Link>
                </li>
              )}
            </ul>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================ */}
      {/* LIVE ACTIVITY (real data from app/page.tsx)                      */}
      {/* ================================================================ */}
      {(!globalNetwork || globalNetwork.isActive !== false) && (
        <section aria-labelledby="live-activity-heading" className={cn(SECTION_Y, "bg-slate-50 dark:bg-slate-900/40")}>
          <div className={CONTAINER}>
            <ScrollReveal>
              <div className="relative isolate overflow-hidden rounded-3xl bg-slate-950 px-5 py-10 shadow-xl shadow-slate-900/10 ring-1 ring-slate-900/5 dark:bg-slate-900 dark:ring-white/10 sm:px-10 md:py-14">
                <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(60%_80%_at_0%_0%,rgba(16,185,129,0.18),transparent_60%)]" />
                <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[url('/grid.svg')] opacity-[0.06] [mask-image:linear-gradient(180deg,black,transparent)]" />

                <SectionHeader
                  dark
                  align="left"
                  id="live-activity-heading"
                  eyebrow={
                    <span className="inline-flex items-center gap-2">
                      <LiveDot /> Live activity
                    </span>
                  }
                  title={globalNetwork?.title || "Happening in the community"}
                  lead={globalNetwork?.description || "Real reports from real people, updated the moment something is lost or found."}
                  action={<TextLink href="/browse" dark>Browse all listings</TextLink>}
                />

                <div className="mt-10 grid grid-cols-1 gap-5 lg:grid-cols-5">
                  <div className="min-w-0 lg:col-span-2">
                    <TopCities cities={topCities} />
                  </div>
                  <div className="min-w-0 lg:col-span-3">
                    <LatestReports items={latestItems} now={now} />
                  </div>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* FEATURES                                                         */}
      {/* ================================================================ */}
      <section aria-labelledby="features-heading" className={cn(SECTION_Y, "bg-white dark:bg-slate-950")}>
        <div className={CONTAINER}>
          <ScrollReveal>
            <SectionHeader
              id="features-heading"
              eyebrow="Why LostFound"
              title="Designed for trust from the first report"
              lead="Everything you need to get things back, without giving away more than you want to."
            />
          </ScrollReveal>
          <ScrollReveal className="mt-12 md:mt-16">
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {features.map((feature) => (
                <li
                  key={feature.key}
                  className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-sm transition-colors hover:border-slate-300 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-slate-700"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
                    <feature.icon className="h-5 w-5" aria-hidden />
                  </span>
                  <h3 className="mt-5 font-semibold text-slate-900 dark:text-white">{feature.title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">{feature.desc}</p>
                </li>
              ))}
            </ul>
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================ */}
      {/* PRICING                                                          */}
      {/* ================================================================ */}
      <section aria-labelledby="pricing-heading" className={cn(SECTION_Y, "bg-slate-50 dark:bg-slate-900/40")}>
        <div className={CONTAINER}>
          <ScrollReveal>
            <SectionHeader
              id="pricing-heading"
              eyebrow="Pricing"
              title="Free to report. Pay only to connect."
              lead="Posting and searching are always free. When you find a likely match, unlock that conversation or go Premium to message about any listing."
            />
          </ScrollReveal>

          <ScrollReveal className="mt-12 md:mt-16">
            {activePlans.length > 0 ? (
              <ul className="mx-auto grid max-w-5xl gap-5 md:grid-cols-2 lg:grid-cols-3">
                {activePlans.map((plan, i) => (
                  <li
                    key={plan.id ?? i}
                    className={cn(
                      "relative flex flex-col rounded-2xl border bg-white p-7 shadow-sm dark:bg-slate-900",
                      plan.isPopular ? "border-emerald-500 ring-1 ring-emerald-500" : "border-slate-200/80 dark:border-slate-800"
                    )}
                  >
                    {plan.isPopular && (
                      <span className="absolute -top-3 left-7 rounded-full bg-emerald-600 px-3 py-1 text-xs font-semibold text-white">Most popular</span>
                    )}
                    <h3 className="font-semibold text-slate-900 dark:text-white">{plan.name}</h3>
                    {plan.description && <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{plan.description}</p>}
                    <p className="mt-6 flex items-baseline gap-1">
                      <span className="text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {formatMoney(Number(plan.monthlyPrice) || 0, pricing?.currency || "USD")}
                      </span>
                      <span className="text-sm text-slate-500 dark:text-slate-400">/month</span>
                    </p>
                    <ul className="mt-6 flex-1 space-y-3">
                      {((plan.benefits as string[]) || []).map((benefit, j) => (
                        <li key={j} className="flex gap-3 text-sm text-slate-700 dark:text-slate-300">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    <Link href={plan.buttonLink || "/register"} className={cn("mt-8", plan.isPopular ? PRIMARY_BUTTON : SECONDARY_BUTTON)}>
                      {plan.buttonText || "Get started"}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <ul className="mx-auto grid max-w-5xl gap-5 lg:grid-cols-3">
                {[
                  {
                    name: "Free",
                    price: formatMoney(0, pricing?.currency || "INR"),
                    period: "forever",
                    blurb: "Everything you need to report and search.",
                    benefits: ["Report lost and found items", "Browse and search every listing", "Smart match suggestions", "Your exact location stays private"],
                    cta: { label: "Report an item", href: "/report" },
                    featured: false,
                  },
                  {
                    name: "Per conversation",
                    price: chatFee ?? "Small fee",
                    period: "one-time, per listing",
                    blurb: "Found a likely match? Unlock the chat for that listing.",
                    benefits: ["Message the person behind one listing", "Pay only when you've found a likely match", "Your phone number and email stay private"],
                    cta: { label: "Browse listings", href: "/browse" },
                    featured: false,
                  },
                  {
                    name: "Premium",
                    price: subscriptionFee ?? "Monthly",
                    period: "per month",
                    blurb: "For people who report or search often.",
                    benefits: ["Message about any listing", "No per-conversation fees", "Everything in Free"],
                    cta: { label: "Create an account", href: "/register" },
                    featured: true,
                  },
                ].map((plan) => (
                  <li
                    key={plan.name}
                    className={cn(
                      "relative flex flex-col rounded-2xl border p-7 shadow-sm",
                      plan.featured
                        ? "border-slate-900 bg-slate-900 text-white dark:border-emerald-500/40 dark:bg-slate-900 dark:ring-1 dark:ring-emerald-500/30"
                        : "border-slate-200/80 bg-white dark:border-slate-800 dark:bg-slate-900"
                    )}
                  >
                    <h3 className={cn("font-semibold", plan.featured ? "text-white" : "text-slate-900 dark:text-white")}>{plan.name}</h3>
                    <p className={cn("mt-1 text-sm", plan.featured ? "text-slate-300" : "text-slate-600 dark:text-slate-400")}>{plan.blurb}</p>
                    <p className="mt-6 flex items-baseline gap-2">
                      <span className={cn("text-4xl font-bold tracking-tight", plan.featured ? "text-white" : "text-slate-900 dark:text-white")}>{plan.price}</span>
                      <span className={cn("text-sm", plan.featured ? "text-slate-400" : "text-slate-500 dark:text-slate-400")}>{plan.period}</span>
                    </p>
                    <ul className="mt-6 flex-1 space-y-3">
                      {plan.benefits.map((benefit) => (
                        <li key={benefit} className={cn("flex gap-3 text-sm", plan.featured ? "text-slate-200" : "text-slate-700 dark:text-slate-300")}>
                          <CheckCircle2 className={cn("mt-0.5 h-4 w-4 shrink-0", plan.featured ? "text-emerald-400" : "text-emerald-600 dark:text-emerald-400")} aria-hidden />
                          {benefit}
                        </li>
                      ))}
                    </ul>
                    <Link
                      href={plan.cta.href}
                      className={cn(
                        "mt-8",
                        plan.featured
                          ? "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm transition hover:bg-emerald-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900"
                          : SECONDARY_BUTTON
                      )}
                    >
                      {plan.cta.label}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </ScrollReveal>
        </div>
      </section>

      {/* ================================================================ */}
      {/* FAQ: native <details>, so it works without JavaScript            */}
      {/* ================================================================ */}
      {showFaq && faqItems.length > 0 && (
        <section aria-labelledby="faq-heading" className={cn(SECTION_Y, "bg-white dark:bg-slate-950")}>
          <div className={cn(CONTAINER, "grid gap-10 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-16")}>
            <ScrollReveal>
              <SectionHeader
                id="faq-heading"
                align="left"
                eyebrow="FAQ"
                title={faq?.title || "Questions, answered"}
                lead={faq?.description || "The short version of how LostFound works, what it costs and how we keep you safe."}
              />
              <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                More detail in our{" "}
                <Link href="/terms" className="font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400">
                  Terms
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="font-medium text-emerald-700 underline-offset-4 hover:underline dark:text-emerald-400">
                  Privacy Policy
                </Link>
                .
              </p>
            </ScrollReveal>

            <div className="divide-y divide-slate-200 border-y border-slate-200 dark:divide-slate-800 dark:border-slate-800">
              {faqItems.map((item, i) => (
                <details key={i} name="homepage-faq" className="group" open={i === 0}>
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-6 rounded-lg py-5 text-left font-semibold text-slate-900 transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-white dark:hover:text-emerald-400">
                    {item.question}
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-transform duration-200 group-open:rotate-45 group-open:bg-emerald-50 group-open:text-emerald-600 dark:bg-slate-800 dark:text-slate-400 dark:group-open:bg-emerald-500/10 dark:group-open:text-emerald-400">
                      <Plus className="h-4 w-4" aria-hidden />
                    </span>
                  </summary>
                  <p className="whitespace-pre-line pb-5 pr-10 text-[15px] leading-relaxed text-slate-600 dark:text-slate-400">{item.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ================================================================ */}
      {/* FINAL CTA                                                        */}
      {/* ================================================================ */}
      {(!cta || cta.isActive !== false) && (
        <section aria-labelledby="cta-heading" className="bg-white pb-16 dark:bg-slate-950 md:pb-24">
          <div className={CONTAINER}>
            <ScrollReveal>
              <div className="relative isolate overflow-hidden rounded-3xl bg-emerald-600 px-6 py-14 text-center shadow-xl shadow-emerald-900/10 dark:bg-emerald-700 sm:px-12 md:py-20">
                <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(50%_80%_at_50%_0%,rgba(255,255,255,0.22),transparent_70%)]" />
                <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 bg-[url('/grid.svg')] opacity-20 [mask-image:radial-gradient(60%_70%_at_50%_50%,black,transparent)]" />
                <h2 id="cta-heading" className="mx-auto max-w-2xl text-3xl font-bold tracking-tight text-white md:text-5xl">
                  {cta?.headline || "Lost something? Found something?"}
                </h2>
                <p className="mx-auto mt-4 max-w-xl text-lg text-emerald-50/90">
                  {cta?.subheading || "Post a report in a minute. The sooner it's listed, the sooner it finds its way home."}
                </p>
                <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                  <Link
                    href={cta?.primaryButtonLink || "/report"}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-800 shadow-sm transition hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-600"
                  >
                    {cta?.primaryButtonText || "Report an item"}
                  </Link>
                  <Link
                    href={cta?.secondaryButtonLink || "/browse"}
                    className="inline-flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white ring-1 ring-inset ring-white/40 transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                  >
                    {cta?.secondaryButtonText || "Browse listings"}
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </Link>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </section>
      )}

      <DynamicFooter footerData={footer} />
    </div>
  );
}
