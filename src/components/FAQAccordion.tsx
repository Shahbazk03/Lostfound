"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { FAQCategory } from "@/lib/content-constants";

export default function FAQAccordion({ faqs }: { faqs: FAQCategory[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  let flatFaqs: { q: string, a: string, category: string, index: number }[] = [];
  let counter = 0;
  faqs.forEach(cat => {
    cat.questions.forEach(q => {
      flatFaqs.push({ ...q, category: cat.category, index: counter++ });
    });
  });

  return (
    <div className="bg-white rounded-3xl shadow-xl border border-slate-100 p-4 md:p-8">
      {faqs.map((category, catIdx) => (
        <div key={catIdx} className={catIdx !== 0 ? "mt-12" : ""}>
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <span className="w-8 h-px bg-slate-200"></span>
            {category.category}
            <span className="flex-1 h-px bg-slate-100"></span>
          </h2>
          
          <div className="space-y-4">
            {category.questions.map((item) => {
              const globalIdx = flatFaqs.find(f => f.q === item.q)?.index || 0;
              const isOpen = openIndex === globalIdx;
              
              return (
                <div 
                  key={globalIdx} 
                  className={`border rounded-2xl transition-all duration-200 overflow-hidden ${
                    isOpen ? 'border-emerald-500 bg-emerald-50/30 shadow-md shadow-emerald-500/10' : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <button 
                    onClick={() => setOpenIndex(isOpen ? null : globalIdx)}
                    className="w-full text-left px-6 py-5 flex items-center justify-between gap-4 focus:outline-none"
                  >
                    <span className={`font-semibold text-lg transition-colors ${isOpen ? 'text-emerald-700' : 'text-slate-900'}`}>
                      {item.q}
                    </span>
                    <ChevronDown className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180 text-emerald-600' : 'text-slate-400'}`} />
                  </button>
                  
                  <div 
                    className={`transition-all duration-300 ease-in-out px-6 ${
                      isOpen ? 'max-h-96 pb-6 opacity-100' : 'max-h-0 py-0 opacity-0'
                    }`}
                  >
                    <p className="text-slate-600 leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
