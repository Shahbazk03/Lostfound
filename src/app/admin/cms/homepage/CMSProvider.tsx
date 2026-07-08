"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { HomepageData } from "@/components/home/HomepageVisuals";

interface CMSContextType {
  data: HomepageData;
  updateHero: (newData: Partial<HomepageData['hero']>) => void;
  updateStatistics: (newList: any[]) => void;
  updateCategories: (newList: any[]) => void;
  updateFeatures: (newList: any[]) => void;
  updateTestimonials: (newList: any[]) => void;
  updatePricing: (newList: any[]) => void;
  updateGlobalNetwork: (newData: any) => void;
  updateFooter: (newData: any) => void;
}

const CMSContext = createContext<CMSContextType | null>(null);

export function CMSProvider({ children, initialData }: { children: ReactNode, initialData: HomepageData }) {
  const [data, setData] = useState<HomepageData>(initialData);

  const updateHero = (newData: Partial<HomepageData['hero']>) => {
    setData(prev => ({ ...prev, hero: { ...prev.hero, ...newData } }));
  };

  const updateStatistics = (newList: any[]) => {
    setData(prev => ({ ...prev, statisticsList: newList }));
  };

  const updateCategories = (newList: any[]) => {
    setData(prev => ({ ...prev, categoriesList: newList }));
  };

  const updateFeatures = (newList: any[]) => {
    setData(prev => ({ ...prev, featuresList: newList }));
  };

  const updateTestimonials = (newList: any[]) => {
    setData(prev => ({ ...prev, testimonialsList: newList }));
  };

  const updatePricing = (newList: any[]) => {
    setData(prev => ({ ...prev, pricingPlansList: newList }));
  };

  const updateGlobalNetwork = (newData: any) => {
    setData(prev => ({ ...prev, globalNetwork: { ...prev.globalNetwork, ...newData } }));
  };

  const updateFooter = (newData: any) => {
    setData(prev => ({ ...prev, footer: { ...prev.footer, ...newData } }));
  };

  return (
    <CMSContext.Provider value={{
      data,
      updateHero,
      updateStatistics,
      updateCategories,
      updateFeatures,
      updateTestimonials,
      updatePricing,
      updateGlobalNetwork,
      updateFooter
    }}>
      {children}
    </CMSContext.Provider>
  );
}

export function useCMS() {
  const context = useContext(CMSContext);
  if (!context) {
    throw new Error("useCMS must be used within a CMSProvider");
  }
  return context;
}
