import { MessageSquare } from "lucide-react";
import { db } from "@/db";
import { organizationSettings } from "@/db/schema";
import { defaultFaqs } from "@/lib/content-constants";
import FAQAccordion from "@/components/FAQAccordion";

export default async function FAQPage() {
  const settingsArray = await db.select().from(organizationSettings).limit(1);
  const settings = settingsArray[0] || {};
  
  const faqs = Array.isArray(settings.metadata?.faqContent) && settings.metadata.faqContent.length > 0
    ? settings.metadata.faqContent
    : defaultFaqs;

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Hero */}
      <div className="bg-[#0b1120] py-20 px-4 text-center">
        <div className="max-w-3xl mx-auto">
          <div className="w-16 h-16 bg-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
            <MessageSquare className="w-8 h-8 text-emerald-400" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-6">Frequently Asked Questions</h1>
          <p className="text-lg text-slate-400">Everything you need to know about the platform, how it works, and how to stay safe.</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-3xl mx-auto px-4 -mt-8 relative z-10">
        <FAQAccordion faqs={faqs} />
      </div>
    </div>
  );
}
