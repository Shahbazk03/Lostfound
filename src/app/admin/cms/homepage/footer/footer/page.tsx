"use client";

import { useState, useEffect } from "react";
import { getFooter, saveFooter } from "./actions";
import { CMSLayout } from "@/components/admin/CMSLayout";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Plus, Trash2, Send, Globe, MessageCircle } from "lucide-react";
import Link from "next/link";
import * as Icons from "lucide-react";

const ICONS: Record<string, any> = {
  Github: Globe,
  Twitter: MessageCircle,
  Facebook: Globe,
  Instagram: Globe,
  Linkedin: Globe,
};

export default function FooterCMSPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    logo: "",
    description: "Your trusted platform for recovering lost items safely and efficiently.",
    copyrightText: "© 2026 LostFound. All rights reserved.",
    contactEmail: "support@lostfound.com",
    contactPhone: "+1 (555) 123-4567",
    newsletterEnabled: true,
    socialLinks: [
      { platform: "Twitter", url: "https://twitter.com", icon: "Twitter" },
      { platform: "Github", url: "https://github.com", icon: "Github" }
    ],
    footerLinks: [
      {
        title: "Platform",
        links: [
          { label: "Browse Items", url: "/browse" },
          { label: "Report Item", url: "/report" },
          { label: "Pricing", url: "/pricing" }
        ]
      },
      {
        title: "Company",
        links: [
          { label: "About Us", url: "/about" },
          { label: "Contact", url: "/contact" },
          { label: "Privacy Policy", url: "/privacy" }
        ]
      }
    ]
  });

  useEffect(() => {
    getFooter().then((data) => {
      if (data) {
        setFormData({
          logo: data.logo || "",
          description: data.description || "",
          copyrightText: data.copyrightText || "",
          contactEmail: data.contactEmail || "",
          contactPhone: data.contactPhone || "",
          newsletterEnabled: data.newsletterEnabled ?? true,
          socialLinks: data.socialLinks || [],
          footerLinks: data.footerLinks || []
        });
      }
      setLoading(false);
    });
  }, []);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    await saveFooter(formData);
    setSaving(false);
    alert("Footer saved successfully!");
  };

  // Social Links
  const addSocial = () => {
    setFormData(prev => ({
      ...prev,
      socialLinks: [...prev.socialLinks, { platform: "New", url: "#", icon: "Twitter" }]
    }));
  };
  
  const removeSocial = (idx: number) => {
    setFormData(prev => {
      const newLinks = [...prev.socialLinks];
      newLinks.splice(idx, 1);
      return { ...prev, socialLinks: newLinks };
    });
  };

  const updateSocial = (idx: number, field: string, value: string) => {
    setFormData(prev => {
      const newLinks = [...prev.socialLinks];
      newLinks[idx] = { ...newLinks[idx], [field]: value };
      return { ...prev, socialLinks: newLinks };
    });
  };

  // Footer Link Groups
  const addGroup = () => {
    setFormData(prev => ({
      ...prev,
      footerLinks: [...prev.footerLinks, { title: "New Group", links: [] }]
    }));
  };
  
  const removeGroup = (gIdx: number) => {
    setFormData(prev => {
      const newGroups = [...prev.footerLinks];
      newGroups.splice(gIdx, 1);
      return { ...prev, footerLinks: newGroups };
    });
  };

  const updateGroupTitle = (gIdx: number, title: string) => {
    setFormData(prev => {
      const newGroups = [...prev.footerLinks];
      newGroups[gIdx].title = title;
      return { ...prev, footerLinks: newGroups };
    });
  };

  const addLink = (gIdx: number) => {
    setFormData(prev => {
      const newGroups = [...prev.footerLinks];
      newGroups[gIdx].links.push({ label: "New Link", url: "#" });
      return { ...prev, footerLinks: newGroups };
    });
  };

  const removeLink = (gIdx: number, lIdx: number) => {
    setFormData(prev => {
      const newGroups = [...prev.footerLinks];
      newGroups[gIdx].links.splice(lIdx, 1);
      return { ...prev, footerLinks: newGroups };
    });
  };

  const updateLink = (gIdx: number, lIdx: number, field: string, value: string) => {
    setFormData(prev => {
      const newGroups = [...prev.footerLinks];
      newGroups[gIdx].links[lIdx] = { ...newGroups[gIdx].links[lIdx], [field]: value };
      return { ...prev, footerLinks: newGroups };
    });
  };

  const formContent = (
    <div className="space-y-8 pb-12">
      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Brand Details</h2>
        <ImageUpload label="Footer Logo (Optional)" value={formData.logo} onChange={(url) => handleChange("logo", url)} />
        
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Company Description</label>
          <textarea 
            value={formData.description}
            onChange={(e) => handleChange("description", e.target.value)}
            rows={3}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Email</label>
            <input 
              value={formData.contactEmail}
              onChange={(e) => handleChange("contactEmail", e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Contact Phone</label>
            <input 
              value={formData.contactPhone}
              onChange={(e) => handleChange("contactPhone", e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Copyright Text</label>
          <input 
            value={formData.copyrightText}
            onChange={(e) => handleChange("copyrightText", e.target.value)}
            className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Navigation Links</h2>
        
        {formData.footerLinks.map((group, gIdx) => (
          <div key={gIdx} className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex gap-4 items-center">
              <input 
                value={group.title}
                onChange={(e) => updateGroupTitle(gIdx, e.target.value)}
                placeholder="Column Title"
                className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-sm"
              />
              <button onClick={() => removeGroup(gIdx)} className="text-red-500 hover:bg-red-50 p-2 rounded">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
            
            <div className="pl-4 space-y-2 border-l-2 border-slate-200 dark:border-slate-700">
              {group.links.map((link, lIdx) => (
                <div key={lIdx} className="flex gap-2 items-center">
                  <input 
                    value={link.label}
                    onChange={(e) => updateLink(gIdx, lIdx, "label", e.target.value)}
                    placeholder="Link Label"
                    className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                  <input 
                    value={link.url}
                    onChange={(e) => updateLink(gIdx, lIdx, "url", e.target.value)}
                    placeholder="/url"
                    className="flex-1 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                  <button onClick={() => removeLink(gIdx, lIdx)} className="text-slate-400 hover:text-red-500">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button onClick={() => addLink(gIdx)} className="text-emerald-600 text-sm font-medium hover:underline flex items-center gap-1 mt-2">
                <Plus className="w-3 h-3" /> Add Link
              </button>
            </div>
          </div>
        ))}
        <button onClick={addGroup} className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg text-sm font-medium w-full text-slate-700 dark:text-slate-300">
          + Add New Column
        </button>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Social Links</h2>
        {formData.socialLinks.map((social, idx) => (
          <div key={idx} className="flex gap-3 items-center">
            <select
              value={social.icon}
              onChange={(e) => updateSocial(idx, "icon", e.target.value)}
              className="bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            >
              <option value="Twitter">Twitter</option>
              <option value="Github">Github</option>
              <option value="Facebook">Facebook</option>
              <option value="Instagram">Instagram</option>
              <option value="Linkedin">Linkedin</option>
            </select>
            <input 
              value={social.url}
              onChange={(e) => updateSocial(idx, "url", e.target.value)}
              placeholder="https://..."
              className="flex-1 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
            <button onClick={() => removeSocial(idx)} className="text-slate-400 hover:text-red-500">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button onClick={addSocial} className="text-emerald-600 text-sm font-medium hover:underline flex items-center gap-1 mt-2">
          <Plus className="w-3 h-3" /> Add Social Link
        </button>
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-2">Features</h2>
        <label className="flex items-center gap-3 cursor-pointer">
          <input 
            type="checkbox" 
            checked={formData.newsletterEnabled}
            onChange={(e) => handleChange("newsletterEnabled", e.target.checked)}
            className="w-5 h-5 rounded text-emerald-500 focus:ring-emerald-500"
          />
          <span className="font-semibold text-slate-700 dark:text-slate-300">Enable Newsletter Subscription Widget</span>
        </label>
      </div>
    </div>
  );

  const previewContent = (
    <footer className="bg-white dark:bg-[#0B1120] border-t border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 lg:gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="flex items-center gap-3">
              {formData.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={formData.logo} alt="Logo" className="h-8 w-auto object-contain" />
              ) : (
                <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-emerald-500/20">
                  LF
                </div>
              )}
              <span className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">LostFound</span>
            </div>
            
            <p className="text-base leading-relaxed max-w-sm">
              {formData.description}
            </p>

            <div className="flex gap-4">
              {formData.socialLinks.map((social, idx) => {
                const Icon = ICONS[social.icon] || Globe;
                return (
                  <Link key={idx} href={social.url} className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center hover:bg-emerald-500 hover:text-white transition-colors text-slate-500 dark:text-slate-400">
                    <Icon className="w-4 h-4" />
                  </Link>
                );
              })}
            </div>
          </div>

          {formData.footerLinks.map((group, idx) => (
            <div key={idx}>
              <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-sm">{group.title}</h3>
              <ul className="space-y-4">
                {group.links.map((link, lIdx) => (
                  <li key={lIdx}>
                    <Link href={link.url} className="hover:text-emerald-500 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          {formData.newsletterEnabled && (
            <div className="lg:col-span-1">
              <h3 className="font-bold text-slate-900 dark:text-white mb-6 uppercase tracking-wider text-sm">Subscribe</h3>
              <p className="text-sm mb-4">Get the latest news and updates.</p>
              <div className="flex items-center gap-2">
                <input 
                  type="email" 
                  placeholder="Enter your email" 
                  className="w-full bg-slate-100 dark:bg-slate-800 border-transparent rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                />
                <button className="bg-emerald-500 hover:bg-emerald-600 text-white p-3 rounded-xl transition-colors">
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        </div>
        
        <div className="mt-16 pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 text-sm">
          <p>{formData.copyrightText}</p>
          <div className="flex gap-6">
            {formData.contactEmail && <a href={`mailto:${formData.contactEmail}`} className="hover:text-emerald-500">{formData.contactEmail}</a>}
            {formData.contactPhone && <span>{formData.contactPhone}</span>}
          </div>
        </div>
      </div>
    </footer>
  );

  if (loading) {
    return <div className="p-12 flex justify-center"><div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <CMSLayout 
      title="Footer Section"
      description="Manage your global site footer."
      formContent={formContent}
      previewContent={previewContent}
      onSave={handleSave}
      isSaving={saving}
    />
  );
}
