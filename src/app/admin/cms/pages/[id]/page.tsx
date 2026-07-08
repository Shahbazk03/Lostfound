"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, GripVertical, Settings, Eye, Code, FileText, MoveUp, MoveDown, RefreshCw } from "lucide-react";
import { BlockRenderer } from "@/components/cms/BlockRenderer";
import { TiptapEditor } from "@/components/cms/TiptapEditor";

export default function CMSPageEditor({ params }: { params: Promise<{ id: string }> }) {
  const p = use(params);
  const pageId = p.id;
  const router = useRouter();

  const [page, setPage] = useState<any>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"content" | "settings">("content");

  useEffect(() => {
    fetchPage();
  }, [pageId]);

  const fetchPage = async () => {
    try {
      const res = await fetch(`/api/admin/cms/pages/${pageId}`);
      if (res.ok) {
        const data = await res.json();
        setPage(data.page);
        setBlocks(data.blocks || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const savePage = async () => {
    setSaving(true);
    try {
      await fetch(`/api/admin/cms/pages/${pageId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page, blocks }),
      });
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addBlock = (type: string) => {
    const newBlock = {
      id: `temp-${Date.now()}`,
      type,
      content: getDefaultContentForBlock(type),
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlockContent = (index: number, key: string, value: any) => {
    const newBlocks = [...blocks];
    newBlocks[index] = {
      ...newBlocks[index],
      content: { ...newBlocks[index].content, [key]: value },
    };
    setBlocks(newBlocks);
  };

  const moveBlock = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newBlocks = [...blocks];
      const temp = newBlocks[index];
      newBlocks[index] = newBlocks[index - 1];
      newBlocks[index - 1] = temp;
      setBlocks(newBlocks);
    } else if (direction === 'down' && index < blocks.length - 1) {
      const newBlocks = [...blocks];
      const temp = newBlocks[index];
      newBlocks[index] = newBlocks[index + 1];
      newBlocks[index + 1] = temp;
      setBlocks(newBlocks);
    }
  };

  const removeBlock = (index: number) => {
    const newBlocks = [...blocks];
    newBlocks.splice(index, 1);
    setBlocks(newBlocks);
  };

  if (loading) return <div className="p-12 text-center">Loading editor...</div>;
  if (!page) return <div className="p-12 text-center">Page not found</div>;

  return (
    <div className="flex h-[calc(100vh-64px)] -mx-6 -my-6 bg-slate-50 dark:bg-slate-950 overflow-hidden">
      {/* LEFT: EDITOR PANEL */}
      <div className="w-[450px] flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col h-full overflow-hidden">
        
        {/* Editor Header */}
        <div className="h-16 px-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push("/admin/cms/pages")} className="p-2 -ml-2 text-slate-400 hover:text-slate-600 rounded-lg">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h2 className="font-semibold text-slate-900 dark:text-white truncate max-w-[150px]">{page.title}</h2>
          </div>
          <button
            onClick={savePage}
            disabled={saving}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-1.5 rounded-md font-medium text-sm flex items-center gap-2 transition disabled:opacity-50"
          >
            {saving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 shrink-0">
          <button 
            onClick={() => setActiveTab("content")} 
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === "content" ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <div className="flex items-center justify-center gap-2"><FileText className="w-4 h-4" /> Content</div>
          </button>
          <button 
            onClick={() => setActiveTab("settings")} 
            className={`flex-1 py-3 text-sm font-medium border-b-2 ${activeTab === "settings" ? "border-emerald-500 text-emerald-600" : "border-transparent text-slate-500 hover:text-slate-700"}`}
          >
            <div className="flex items-center justify-center gap-2"><Settings className="w-4 h-4" /> Settings</div>
          </button>
        </div>

        {/* Editor Content Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6">
          
          {activeTab === "settings" && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Page Title</label>
                <input type="text" value={page.title} onChange={e => setPage({...page, title: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">URL Slug</label>
                <input type="text" value={page.slug} onChange={e => setPage({...page, slug: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Status</label>
                <select value={page.status} onChange={e => setPage({...page, status: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-emerald-500">
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="font-medium text-slate-900 dark:text-white mb-4">SEO Metadata</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">SEO Title</label>
                    <input type="text" value={page.seoTitle || ""} onChange={e => setPage({...page, seoTitle: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" placeholder={page.title} />
                  </div>
                  <div>
                    <label className="block text-xs text-slate-500 mb-1">Meta Description</label>
                    <textarea rows={3} value={page.seoDescription || ""} onChange={e => setPage({...page, seoDescription: e.target.value})} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "content" && (
            <div className="space-y-6">
              {blocks.length === 0 ? (
                <div className="text-center py-8 text-slate-500 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                  <p className="mb-2">No content blocks yet.</p>
                  <p className="text-xs">Add a block below to start building your page.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {blocks.map((block, index) => (
                    <div key={block.id || index} className="bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                      <div className="flex items-center justify-between p-3 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                          <span className="font-semibold text-sm capitalize text-slate-700 dark:text-slate-200">{block.type.replace("-", " ")}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => moveBlock(index, 'up')} className="p-1 text-slate-400 hover:text-slate-700"><MoveUp className="w-3.5 h-3.5" /></button>
                          <button onClick={() => moveBlock(index, 'down')} className="p-1 text-slate-400 hover:text-slate-700"><MoveDown className="w-3.5 h-3.5" /></button>
                          <button onClick={() => removeBlock(index)} className="p-1 text-slate-400 hover:text-rose-500 ml-1"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                      
                      <div className="p-4 space-y-3">
                        {renderBlockEditor(block, index, updateBlockContent)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">Add Content Block</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => addBlock('hero')} className="px-3 py-2 text-sm text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition">Hero Section</button>
                  <button onClick={() => addBlock('rich-text')} className="px-3 py-2 text-sm text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition">Rich Text</button>
                  <button onClick={() => addBlock('feature-grid')} className="px-3 py-2 text-sm text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition">Feature Grid</button>
                  <button onClick={() => addBlock('faq')} className="px-3 py-2 text-sm text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition">FAQ List</button>
                  <button onClick={() => addBlock('contact-form')} className="px-3 py-2 text-sm text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition">Contact Form</button>
                  <button onClick={() => addBlock('divider')} className="px-3 py-2 text-sm text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-emerald-500 hover:text-emerald-600 transition">Divider</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT: LIVE PREVIEW PANEL */}
      <div className="flex-1 bg-slate-100 dark:bg-slate-950 flex flex-col h-full relative">
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur border border-slate-200 dark:border-slate-800 shadow-sm rounded-full px-4 py-2 flex items-center gap-2 text-xs font-medium text-slate-500">
          <Eye className="w-4 h-4" /> Live Preview
        </div>
        <div className="flex-1 overflow-y-auto">
          {/* We render the actual blocks in a scaled view or just 100% width. We will render them 100% to reflect reality. */}
          <div className="min-h-full bg-slate-50 dark:bg-slate-950 shadow-2xl">
            {blocks.map((block, i) => (
              <BlockRenderer key={block.id || i} block={block} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function getDefaultContentForBlock(type: string) {
  switch (type) {
    case 'hero': return { headline: "Amazing New Feature", subheading: "Discover the best way to manage your items online. Fast, secure, and beautiful.", primaryButtonText: "Get Started", primaryButtonLink: "/" };
    case 'rich-text': return { html: "<h2>Your Heading Here</h2><p>Start typing your paragraph here...</p>" };
    case 'feature-grid': return { title: "Why Choose Us", features: [{title: "Fast", description: "Lightning fast performance"}, {title: "Secure", description: "Bank-level security"}] };
    case 'faq': return { title: "Frequently Asked Questions", items: [{question: "How does this work?", answer: "It is very simple..."}] };
    case 'contact-form': return { title: "Contact Us", subtitle: "We'd love to hear from you." };
    default: return {};
  }
}

function renderBlockEditor(block: any, index: number, updateFn: (idx: number, key: string, val: any) => void) {
  const content = block.content || {};
  
  if (block.type === 'hero') {
    return (
      <>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Headline</label>
          <input type="text" value={content.headline || ""} onChange={e => updateFn(index, 'headline', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Subheading</label>
          <textarea rows={2} value={content.subheading || ""} onChange={e => updateFn(index, 'subheading', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-slate-500 mb-1">Primary Button</label>
            <input type="text" value={content.primaryButtonText || ""} onChange={e => updateFn(index, 'primaryButtonText', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm mb-1" placeholder="Text" />
            <input type="text" value={content.primaryButtonLink || ""} onChange={e => updateFn(index, 'primaryButtonLink', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm" placeholder="URL" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">Secondary Button</label>
            <input type="text" value={content.secondaryButtonText || ""} onChange={e => updateFn(index, 'secondaryButtonText', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm mb-1" placeholder="Text" />
            <input type="text" value={content.secondaryButtonLink || ""} onChange={e => updateFn(index, 'secondaryButtonLink', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm" placeholder="URL" />
          </div>
        </div>
      </>
    );
  }

  if (block.type === 'rich-text') {
    return (
      <div>
        <label className="block text-xs text-slate-500 mb-1">HTML Content</label>
        <TiptapEditor 
          value={content.html || ""} 
          onChange={val => updateFn(index, 'html', val)} 
        />
      </div>
    );
  }

  if (block.type === 'faq') {
    return (
      <div>
        <label className="block text-xs text-slate-500 mb-1">Section Title</label>
        <input type="text" value={content.title || ""} onChange={e => updateFn(index, 'title', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm mb-3" />
        <label className="block text-xs text-slate-500 mb-1">Questions</label>
        {content.items?.map((item: any, i: number) => (
          <div key={i} className="mb-2 p-2 border border-slate-200 dark:border-slate-700 rounded bg-white dark:bg-slate-900">
            <input type="text" value={item.question} onChange={e => {
              const newItems = [...content.items];
              newItems[i].question = e.target.value;
              updateFn(index, 'items', newItems);
            }} className="w-full bg-transparent border-b border-slate-100 dark:border-slate-800 mb-1 px-1 py-1 text-sm focus:outline-none" placeholder="Question" />
            <textarea value={item.answer} onChange={e => {
              const newItems = [...content.items];
              newItems[i].answer = e.target.value;
              updateFn(index, 'items', newItems);
            }} className="w-full bg-transparent px-1 py-1 text-sm focus:outline-none" placeholder="Answer" rows={2} />
          </div>
        ))}
        <button onClick={() => {
          const newItems = [...(content.items || []), { question: "New Question", answer: "Answer here" }];
          updateFn(index, 'items', newItems);
        }} className="text-xs text-emerald-600 font-medium">+ Add Question</button>
      </div>
    );
  }
  
  if (block.type === 'contact-form') {
    return (
      <>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Title</label>
          <input type="text" value={content.title || ""} onChange={e => updateFn(index, 'title', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Subtitle</label>
          <input type="text" value={content.subtitle || ""} onChange={e => updateFn(index, 'subtitle', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm" />
        </div>
        <div>
          <label className="block text-xs text-slate-500 mb-1">Button Text</label>
          <input type="text" value={content.buttonText || ""} onChange={e => updateFn(index, 'buttonText', e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-md px-3 py-1.5 text-sm" />
        </div>
      </>
    );
  }

  return <div className="text-sm text-slate-500">Edit options not available for this block yet.</div>;
}
