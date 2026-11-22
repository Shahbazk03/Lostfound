"use client";

import { useEffect, useState } from "react";
import { PanelBottom, X } from "lucide-react";
import { useCMS } from "@/app/admin/cms/homepage/CMSProvider";
import { adminFetch, errorMessage } from "@/components/admin/admin-api";
import { useConfirm, useToast } from "@/components/admin/AdminFeedback";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Field, Input, Select, Switch, Textarea } from "@/components/admin/ui/Form";
import { iconButton } from "@/components/admin/ui/styles";
import { cn } from "@/lib/utils";
import {
  AddButton,
  EditorCard,
  EmptyList,
  InlineAdd,
  RepeaterItem,
  SectionEditor,
  useSectionPublisher,
} from "../_components/SectionEditor";
import { collect, emailError, httpUrlError, linkError, maxLen, move, required, type Errors } from "../_components/validation";

type FooterLink = { label?: string; url?: string; pageId?: number };
type FooterColumn = { title?: string; links?: FooterLink[] };
type SocialLink = { platform?: string; url?: string; icon?: string };

export default function FooterPage() {
  const { data, updateFooter } = useCMS();
  const toast = useToast();
  const confirm = useConfirm();
  const [localData, setLocalData] = useState<any>(
    data.footer || {
      logo: "",
      description: "",
      copyrightText: "",
      contactEmail: "",
      contactPhone: "",
      socialLinks: [],
      footerLinks: [],
      newsletterEnabled: true,
      isActive: true,
    }
  );
  const [cmsPages, setCmsPages] = useState<any[]>([]);
  const { saving, publish } = useSectionPublisher("footer", "/api/admin/cms/footer", "footer");

  useEffect(() => {
    adminFetch<unknown>("/api/admin/cms/pages", {}, "Failed to load CMS pages for the link picker")
      .then((d) => setCmsPages(Array.isArray(d) ? d : []))
      .catch((err) => toast.error(errorMessage(err)));
  }, [toast]);

  const handleChange = (key: string, value: any) => {
    const updated = { ...localData, [key]: value };
    setLocalData(updated);
    updateFooter(updated);
  };

  // Social links
  const socials: SocialLink[] = Array.isArray(localData.socialLinks) ? localData.socialLinks : [];
  const setSocials = (next: SocialLink[]) => handleChange("socialLinks", next);
  const updateSocial = (index: number, key: keyof SocialLink, value: string) =>
    setSocials(socials.map((s, i) => (i === index ? { ...s, [key]: value } : s)));
  const removeSocial = async (index: number) => {
    const ok = await confirm({ title: "Remove this social link?", message: "It will be removed from the homepage when you publish.", confirmLabel: "Remove" });
    if (!ok) return;
    setSocials(socials.filter((_, i) => i !== index));
  };

  // Link columns (all updates are immutable so the saved snapshot stays intact)
  const columns: FooterColumn[] = Array.isArray(localData.footerLinks) ? localData.footerLinks : [];
  const setColumns = (next: FooterColumn[]) => handleChange("footerLinks", next);
  const updateColumn = (index: number, patch: Partial<FooterColumn>) =>
    setColumns(columns.map((c, i) => (i === index ? { ...c, ...patch } : c)));
  const linksOf = (col: FooterColumn) => (Array.isArray(col.links) ? col.links : []);
  const updateLink = (colIndex: number, linkIndex: number, patch: Partial<FooterLink>) =>
    updateColumn(colIndex, {
      links: linksOf(columns[colIndex]).map((l, j) => (j === linkIndex ? { ...l, ...patch } : l)),
    });
  const removeColumn = async (index: number) => {
    const ok = await confirm({ title: "Remove this link column?", message: "It will be removed from the homepage when you publish.", confirmLabel: "Remove" });
    if (!ok) return;
    setColumns(columns.filter((_, i) => i !== index));
  };

  const onPickPage = (colIndex: number, linkIndex: number, value: string) => {
    if (value) {
      // Linking to a CMS page clears the custom URL.
      updateLink(colIndex, linkIndex, { pageId: parseInt(value, 10), url: undefined });
    } else {
      updateLink(colIndex, linkIndex, { pageId: undefined });
    }
  };

  // Validation
  const errors = collect([
    ["description", maxLen(localData.description, 5000)],
    ["copyrightText", maxLen(localData.copyrightText, 255)],
    ["contactEmail", emailError(localData.contactEmail) ?? maxLen(localData.contactEmail, 255)],
    ["contactPhone", maxLen(localData.contactPhone, 50)],
  ]);
  const socialErrors: Errors[] = socials.map((s) =>
    collect([
      ["platform", required(s.platform, "Platform")],
      ["url", httpUrlError(s.url, "URL is required")],
    ])
  );
  const columnErrors: Errors[] = columns.map((c) => collect([["title", required(c.title, "Column title")]]));
  const linkErrors: Errors[][] = columns.map((c) =>
    linksOf(c).map((l) =>
      collect([
        ["label", required(l.label, "Label")],
        ["url", l.pageId ? null : (required(l.url, "URL") ?? linkError(l.url))],
      ])
    )
  );
  const errorCount =
    Object.keys(errors).length +
    [...socialErrors, ...columnErrors, ...linkErrors.flat()].reduce((n, e) => n + Object.keys(e).length, 0);

  return (
    <SectionEditor
      sectionKey="footer"
      icon={PanelBottom}
      title="Footer"
      description="Site-wide footer: brand, contact details, social and link columns."
      errorCount={errorCount}
      saving={saving}
      onPublish={() => publish(localData, localData)}
    >
      <EditorCard title="General">
        <div className="space-y-3">
          <Switch
            checked={localData.isActive !== false}
            onChange={(v) => handleChange("isActive", v)}
            label="Show the custom footer"
            description="When off, the site falls back to the default footer."
          />
          <Switch checked={localData.newsletterEnabled !== false} onChange={(v) => handleChange("newsletterEnabled", v)} label="Show newsletter form" />
        </div>
        <ImageUpload label="Logo" value={localData.logo || ""} onChange={(url) => handleChange("logo", url)} />
        <Field label="Description" error={errors.description}>
          <Textarea rows={3} value={localData.description || ""} onChange={(e) => handleChange("description", e.target.value)} />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Contact email" error={errors.contactEmail}>
            <Input type="email" value={localData.contactEmail || ""} onChange={(e) => handleChange("contactEmail", e.target.value)} placeholder="hello@example.com" />
          </Field>
          <Field label="Contact phone" error={errors.contactPhone}>
            <Input type="tel" value={localData.contactPhone || ""} onChange={(e) => handleChange("contactPhone", e.target.value)} />
          </Field>
        </div>
        <Field label="Copyright text" error={errors.copyrightText}>
          <Input value={localData.copyrightText || ""} onChange={(e) => handleChange("copyrightText", e.target.value)} placeholder="© 2026 LostFound. All rights reserved." />
        </Field>
      </EditorCard>

      <div>
        <h2 className="mb-3 px-1 text-sm font-semibold text-slate-900 dark:text-white">Social links</h2>
        <div className="space-y-4">
          {socials.length === 0 && <EmptyList>No social links yet.</EmptyList>}
          {socials.map((social, i) => (
            <RepeaterItem
              key={i}
              label={social.platform?.trim() || `Social link ${i + 1}`}
              index={i}
              count={socials.length}
              onMove={(from, to) => setSocials(move(socials, from, to))}
              onRemove={() => removeSocial(i)}
              invalid={Object.keys(socialErrors[i]).length > 0}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Platform" required error={socialErrors[i].platform}>
                  <Input value={social.platform || ""} onChange={(e) => updateSocial(i, "platform", e.target.value)} placeholder="Instagram" />
                </Field>
                <Field label="Icon" hint="Lucide icon name">
                  <Input value={social.icon || ""} onChange={(e) => updateSocial(i, "icon", e.target.value)} placeholder="Instagram" />
                </Field>
              </div>
              <Field label="URL" required error={socialErrors[i].url}>
                <Input type="url" value={social.url || ""} onChange={(e) => updateSocial(i, "url", e.target.value)} placeholder="https://instagram.com/yourpage" />
              </Field>
            </RepeaterItem>
          ))}
          <AddButton onClick={() => setSocials([...socials, { platform: "Twitter", url: "https://twitter.com", icon: "Twitter" }])}>
            Add social link
          </AddButton>
        </div>
      </div>

      <div>
        <h2 className="mb-3 px-1 text-sm font-semibold text-slate-900 dark:text-white">Link columns</h2>
        <div className="space-y-4">
          {columns.length === 0 && <EmptyList>No link columns yet.</EmptyList>}
          {columns.map((col, i) => {
            const links = linksOf(col);
            return (
              <RepeaterItem
                key={i}
                label={col.title?.trim() || `Column ${i + 1}`}
                index={i}
                count={columns.length}
                onMove={(from, to) => setColumns(move(columns, from, to))}
                onRemove={() => removeColumn(i)}
                invalid={Object.keys(columnErrors[i]).length > 0 || linkErrors[i].some((e) => Object.keys(e).length > 0)}
              >
                <Field label="Column title" required error={columnErrors[i].title}>
                  <Input value={col.title || ""} onChange={(e) => updateColumn(i, { title: e.target.value })} placeholder="Company" />
                </Field>
                <div>
                  <p className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Links</p>
                  {links.length === 0 && <p className="text-sm text-slate-500 dark:text-slate-400">No links in this column.</p>}
                  <ul className="space-y-3">
                    {links.map((link, j) => {
                      const le = linkErrors[i][j];
                      return (
                        <li key={j} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 dark:border-slate-800 dark:bg-slate-950/40">
                          <div className="flex items-start gap-2">
                            <div className="grid min-w-0 flex-1 gap-3 sm:grid-cols-2">
                              <Field label="Label" required error={le.label}>
                                <Input value={link.label || ""} onChange={(e) => updateLink(i, j, { label: e.target.value })} placeholder="About us" />
                              </Field>
                              <Field label="Destination">
                                <Select value={link.pageId ? String(link.pageId) : ""} onChange={(e) => onPickPage(i, j, e.target.value)}>
                                  <option value="">Custom URL</option>
                                  {cmsPages.map((p) => (
                                    <option key={p.id} value={p.id}>
                                      {p.title} (/{p.slug}){p.status && p.status !== "published" ? ` — ${p.status}` : ""}
                                    </option>
                                  ))}
                                </Select>
                              </Field>
                              {!link.pageId && (
                                <Field label="URL" required error={le.url} className="sm:col-span-2">
                                  <Input value={link.url || ""} onChange={(e) => updateLink(i, j, { url: e.target.value })} placeholder="/about or https://…" />
                                </Field>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => updateColumn(i, { links: links.filter((_, k) => k !== j) })}
                              className={cn(iconButton, "mt-7 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400")}
                              aria-label={`Remove link ${link.label || j + 1}`}
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                  <div className="mt-2">
                    <InlineAdd onClick={() => updateColumn(i, { links: [...links, { label: "New link", url: "#" }] })}>Add link</InlineAdd>
                  </div>
                </div>
              </RepeaterItem>
            );
          })}
          <AddButton onClick={() => setColumns([...columns, { title: "New column", links: [] }])}>Add column</AddButton>
        </div>
      </div>
    </SectionEditor>
  );
}
