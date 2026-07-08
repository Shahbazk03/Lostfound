"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Search, MapPin, Mail, Phone, ArrowRight, Globe, MessageCircle } from "lucide-react";
import { defaultFooterGroups, FooterGroup } from "@/lib/footer-constants";

export default function DynamicFooter({ footerData }: { footerData?: any }) {
  const [settings, setSettings] = useState<any>({});

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => setSettings(data.settings || data))
      .catch((err) => console.error("Error fetching footer settings:", err));
  }, []);

  const orgName = settings.organizationName || "LOSTFOUND";
  
  // Use CMS data if available, otherwise fallback to settings
  const desc = footerData?.description || settings.metadata?.footerDescription || "Empowering communities globally to connect lost belongings with their rightful owners. Trusted, secure, and fast.";
  const copyright = footerData?.copyrightText || settings.metadata?.copyrightText || `© ${new Date().getFullYear()} ${orgName} Inc. All rights reserved.`;
  const contactEmail = footerData?.contactEmail || settings.contactEmail || "hello@lostfound.com";
  const contactPhone = footerData?.contactPhone || settings.supportPhone || "+1 (555) 123-4567";
  
  const fb = settings.metadata?.facebookUrl || "#";
  const tw = settings.metadata?.twitterUrl || "#";
  
  const address = settings.address || "123 Innovation Drive";
  const city = settings.city || "San Francisco, CA 94103";
  const country = settings.country || "USA";

  const footerGroups: FooterGroup[] = footerData?.footerLinks?.length > 0 
    ? footerData.footerLinks 
    : (Array.isArray(settings.metadata?.footerGroups) && settings.metadata.footerGroups.length > 0
      ? settings.metadata.footerGroups 
      : defaultFooterGroups);
      
  const socialLinks = footerData?.socialLinks || [];
  const showNewsletter = footerData ? footerData.newsletterEnabled : true;
  
  if (footerData && footerData.isActive === false) return null;

  return (
    <footer className="bg-[#0b1120] text-slate-400 pt-20 pb-10 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Section: Newsletter & Branding */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-10 mb-16 pb-12 border-b border-slate-800/60">
          {showNewsletter ? (
            <div className="max-w-md">
              <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">Stay updated</h3>
              <p className="text-sm text-slate-400 mb-6">
                Join our newsletter for the latest platform features, success stories, and safety tips.
              </p>
              <div className="flex gap-2 relative">
                <input 
                  type="email" 
                  placeholder="Enter your email address" 
                  className="w-full bg-slate-900/50 border border-slate-800 text-white px-4 py-3 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-slate-600"
                />
                <button className="absolute right-1.5 top-1.5 bottom-1.5 bg-emerald-600 hover:bg-emerald-500 text-white px-5 rounded-lg font-medium transition-colors flex items-center gap-2">
                  Subscribe
                </button>
              </div>
            </div>
          ) : <div className="flex-1" />}
          
          <div className="flex flex-col items-start lg:items-end text-left lg:text-right">
            <div className="flex items-center gap-3 mb-4">
              {footerData?.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={footerData.logo} alt="Logo" className="h-10 w-auto" />
              ) : (
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  <span className="text-white font-bold text-lg tracking-wider">LF</span>
                </div>
              )}
              {!footerData?.logo && <span className="text-3xl font-extrabold text-white tracking-tight">{orgName}</span>}
            </div>
            <p className="text-sm max-w-xs leading-relaxed text-slate-400">
              {desc}
            </p>
          </div>
        </div>

        {/* Main Grid: Links & Info */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <h4 className="text-white font-semibold mb-6 tracking-wide">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-300">Email Support</p>
                  <a href={`mailto:${contactEmail}`} className="text-sm hover:text-emerald-400 transition-colors">{contactEmail}</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Phone className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-300">Call Us</p>
                  <p className="text-sm">{contactPhone}</p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-slate-300">Global Headquarters</p>
                  <p className="text-sm">{address}<br/>{city}, {country}</p>
                </div>
              </li>
            </ul>
          </div>
          
          {(Array.isArray(footerGroups) ? footerGroups : defaultFooterGroups).map((group, i) => (
            <div key={i}>
              <h4 className="text-white font-semibold mb-6 tracking-wide">{group?.title || ""}</h4>
              <ul className="space-y-3 text-sm">
                {(Array.isArray(group?.links) ? group.links : []).map((link, j) => (
                  <li key={j}>
                    <Link href={link?.url || "#"} className="hover:text-emerald-400 transition-colors flex items-center gap-2 group">
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity -ml-5 group-hover:ml-0" /> 
                      {link?.label || ""}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar: Copyright & Socials */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-slate-800/60 gap-4">
          <div className="flex flex-col md:flex-row items-center gap-4 text-xs">
            <span>{copyright}</span>
            <div className="hidden md:block w-1 h-1 bg-slate-700 rounded-full"></div>
            <div className="flex gap-4">
              <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
              <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
              <Link href="/cookies" className="hover:text-white transition-colors">Cookie Settings</Link>
            </div>
          </div>
          
          <div className="flex gap-4">
            {socialLinks.length > 0 ? (
              socialLinks.map((social: any, i: number) => {
                return (
                  <a key={i} href={social.url} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all">
                    <Globe className="w-4 h-4" />
                  </a>
                );
              })
            ) : (
              <>
                {tw && (
                  <a href={tw} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all">
                    <MessageCircle className="w-4 h-4" />
                  </a>
                )}
                {fb && (
                  <a href={fb} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center hover:bg-emerald-600 hover:text-white transition-all">
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </>
            )}
          </div>
        </div>

      </div>
    </footer>
  );
}
