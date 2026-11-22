"use client";

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import type { HomepageData } from "@/components/home/HomepageVisuals";

/** Homepage sections that are edited and published independently. */
export const SECTION_KEYS = [
  "hero",
  "statisticsList",
  "categoriesList",
  "featuresList",
  "pricingPlansList",
  "globalNetwork",
  "faq",
  "cta",
  "footer",
] as const;
export type SectionKey = (typeof SECTION_KEYS)[number];

type Snapshot = Partial<Record<SectionKey, unknown>>;

interface CMSContextType {
  data: HomepageData;
  updateHero: (newData: Partial<HomepageData["hero"]>) => void;
  updateStatistics: (newList: any[]) => void;
  updateCategories: (newList: any[]) => void;
  updateFeatures: (newList: any[]) => void;
  updatePricing: (newList: any[]) => void;
  updateGlobalNetwork: (newData: any) => void;
  updateFaq: (newData: any) => void;
  updateCta: (newData: any) => void;
  updateFooter: (newData: any) => void;
  /** Record what is now live for a section (call after a successful publish). */
  markSaved: (key: SectionKey, value: unknown) => void;
  /** True when the section differs from what was last loaded / published. */
  isDirty: (key: SectionKey) => boolean;
  /** Sections with unpublished edits. */
  dirtyKeys: SectionKey[];
  /** Throw away a section's edits and remount its editor. */
  discard: (key: SectionKey) => void;
  /** Bumped by discard(); the layout keys the editor on it. */
  revision: number;
}

const CMSContext = createContext<CMSContextType | null>(null);

function clone<T>(value: T): T {
  if (value === null || value === undefined) return value;
  try {
    return structuredClone(value);
  } catch {
    return JSON.parse(JSON.stringify(value)) as T;
  }
}

// Key-order independent JSON, cached per object so only the edited section is
// re-serialised on each keystroke.
const serialised = new WeakMap<object, string>();
function stable(value: unknown): string {
  if (value === null || value === undefined) return "null";
  if (typeof value !== "object") return JSON.stringify(value);
  const cached = serialised.get(value);
  if (cached !== undefined) return cached;
  const out = JSON.stringify(value, (_k, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.keys(v)
          .sort()
          .reduce<Record<string, unknown>>((o, k) => {
            o[k] = v[k];
            return o;
          }, {})
      : v
  );
  serialised.set(value, out);
  return out;
}

function snapshotOf(data: HomepageData): Snapshot {
  const snap: Snapshot = {};
  for (const key of SECTION_KEYS) snap[key] = clone((data as unknown as Record<string, unknown>)[key] ?? null);
  return snap;
}

export function CMSProvider({ children, initialData }: { children: ReactNode; initialData: HomepageData }) {
  const [data, setData] = useState<HomepageData>(initialData);
  const [saved, setSaved] = useState<Snapshot>(() => snapshotOf(initialData));
  const [revision, setRevision] = useState(0);

  const updateHero = useCallback((newData: Partial<HomepageData["hero"]>) => {
    setData((prev) => ({ ...prev, hero: { ...prev.hero, ...newData } }));
  }, []);
  const updateStatistics = useCallback((newList: any[]) => setData((prev) => ({ ...prev, statisticsList: newList })), []);
  const updateCategories = useCallback((newList: any[]) => setData((prev) => ({ ...prev, categoriesList: newList })), []);
  const updateFeatures = useCallback((newList: any[]) => setData((prev) => ({ ...prev, featuresList: newList })), []);
  const updatePricing = useCallback((newList: any[]) => setData((prev) => ({ ...prev, pricingPlansList: newList })), []);
  const updateGlobalNetwork = useCallback(
    (newData: any) => setData((prev) => ({ ...prev, globalNetwork: { ...prev.globalNetwork, ...newData } })),
    []
  );
  const updateFaq = useCallback((newData: any) => setData((prev) => ({ ...prev, faq: { ...prev.faq, ...newData } })), []);
  const updateCta = useCallback((newData: any) => setData((prev) => ({ ...prev, cta: { ...prev.cta, ...newData } })), []);
  const updateFooter = useCallback(
    (newData: any) => setData((prev) => ({ ...prev, footer: { ...prev.footer, ...newData } })),
    []
  );

  const markSaved = useCallback((key: SectionKey, value: unknown) => {
    setSaved((prev) => ({ ...prev, [key]: clone(value) }));
  }, []);

  const discard = useCallback(
    (key: SectionKey) => {
      setData((prev) => ({ ...prev, [key]: clone(saved[key] ?? null) }));
      setRevision((r) => r + 1);
    },
    [saved]
  );

  const dirtyKeys = useMemo(
    () =>
      SECTION_KEYS.filter(
        (key) => stable((data as unknown as Record<string, unknown>)[key] ?? null) !== stable(saved[key] ?? null)
      ),
    [data, saved]
  );

  const isDirty = useCallback((key: SectionKey) => dirtyKeys.includes(key), [dirtyKeys]);

  const value = useMemo<CMSContextType>(
    () => ({
      data,
      updateHero,
      updateStatistics,
      updateCategories,
      updateFeatures,
      updatePricing,
      updateGlobalNetwork,
      updateFaq,
      updateCta,
      updateFooter,
      markSaved,
      isDirty,
      dirtyKeys,
      discard,
      revision,
    }),
    [
      data,
      updateHero,
      updateStatistics,
      updateCategories,
      updateFeatures,
      updatePricing,
      updateGlobalNetwork,
      updateFaq,
      updateCta,
      updateFooter,
      markSaved,
      isDirty,
      dirtyKeys,
      discard,
      revision,
    ]
  );

  return <CMSContext.Provider value={value}>{children}</CMSContext.Provider>;
}

export function useCMS() {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error("useCMS must be used within a CMSProvider");
  }
  return context;
}
