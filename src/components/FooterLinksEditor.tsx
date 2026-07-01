"use client";

import { useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import { defaultFooterGroups, FooterGroup } from "@/lib/footer-constants";
import { 
  DndContext, 
  closestCenter, 
  KeyboardSensor, 
  PointerSensor, 
  useSensor, 
  useSensors, 
  DragEndEvent 
} from "@dnd-kit/core";
import { 
  SortableContext, 
  sortableKeyboardCoordinates, 
  verticalListSortingStrategy, 
  useSortable 
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

// Extended link with stable unique ID for drag and drop
interface SortableLink {
  id: string;
  label: string;
  url: string;
}

interface SortableGroup {
  title: string;
  links: SortableLink[];
}

interface Props {
  groups: FooterGroup[];
  onChange: (groups: FooterGroup[]) => void;
}

function SortableLinkItem({ 
  link, 
  linkIndex, 
  groupIndex, 
  updateLink, 
  removeLink 
}: { 
  link: SortableLink, 
  linkIndex: number, 
  groupIndex: number, 
  updateLink: (g: number, l: number, k: "label" | "url", v: string) => void,
  removeLink: (g: number, l: number) => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex gap-2 items-center p-2 rounded-lg bg-white border transition-all duration-200 ${
        isDragging 
          ? 'shadow-[0_20px_25px_-5px_rgba(16,185,129,0.3)] border-emerald-500 ring-2 ring-emerald-500/20 scale-105 relative' 
          : 'border-transparent hover:border-slate-200 hover:shadow-sm'
      }`}
    >
      <div 
        {...attributes} 
        {...listeners} 
        className={`p-1.5 rounded cursor-grab active:cursor-grabbing transition-colors ${
          isDragging ? 'text-emerald-500' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
        }`}
      >
        <GripVertical className="w-4 h-4" />
      </div>
      <input
        type="text"
        value={link.label}
        onChange={(e) => updateLink(groupIndex, linkIndex, "label", e.target.value)}
        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
        placeholder="Link Label"
      />
      <input
        type="text"
        value={link.url}
        onChange={(e) => updateLink(groupIndex, linkIndex, "url", e.target.value)}
        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-md text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-mono text-slate-600"
        placeholder="URL (e.g. /about)"
      />
      <button
        type="button"
        onClick={() => removeLink(groupIndex, linkIndex)}
        className="text-slate-400 hover:text-red-500 p-1.5 rounded hover:bg-red-50 transition-colors"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function FooterLinksEditor({ groups, onChange }: Props) {
  // Initialize with stable IDs for dnd-kit
  const [editingGroups, setEditingGroups] = useState<SortableGroup[]>(() => {
    const initialGroups = groups?.length ? groups : defaultFooterGroups;
    return initialGroups.map(g => ({
      title: g.title,
      links: g.links.map(l => ({ ...l, id: Math.random().toString(36).substring(2, 9) }))
    }));
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const notifyChange = (newGroups: SortableGroup[]) => {
    setEditingGroups(newGroups);
    // Strip the internal IDs before sending to parent
    onChange(newGroups.map(g => ({
      title: g.title,
      links: g.links.map(({ id, ...rest }) => rest)
    })));
  };

  const addGroup = () => {
    notifyChange([...editingGroups, { title: "New Column", links: [] }]);
  };

  const updateGroupTitle = (index: number, title: string) => {
    const newGroups = [...editingGroups];
    newGroups[index].title = title;
    notifyChange(newGroups);
  };

  const removeGroup = (index: number) => {
    const newGroups = [...editingGroups];
    newGroups.splice(index, 1);
    notifyChange(newGroups);
  };

  const addLink = (groupIndex: number) => {
    const newGroups = [...editingGroups];
    newGroups[groupIndex].links.push({ 
      id: Math.random().toString(36).substring(2, 9), 
      label: "New Link", 
      url: "/" 
    });
    notifyChange(newGroups);
  };

  const updateLink = (groupIndex: number, linkIndex: number, key: "label" | "url", value: string) => {
    const newGroups = [...editingGroups];
    newGroups[groupIndex].links[linkIndex][key] = value;
    notifyChange(newGroups);
  };

  const removeLink = (groupIndex: number, linkIndex: number) => {
    const newGroups = [...editingGroups];
    newGroups[groupIndex].links.splice(linkIndex, 1);
    notifyChange(newGroups);
  };

  const handleDragEnd = (event: DragEndEvent, groupIndex: number) => {
    const { active, over } = event;
    
    if (active.id !== over?.id) {
      const newGroups = [...editingGroups];
      const oldIndex = newGroups[groupIndex].links.findIndex(l => l.id === active.id);
      const newIndex = newGroups[groupIndex].links.findIndex(l => l.id === over?.id);
      
      const newLinks = [...newGroups[groupIndex].links];
      const [movedItem] = newLinks.splice(oldIndex, 1);
      newLinks.splice(newIndex, 0, movedItem);
      
      newGroups[groupIndex].links = newLinks;
      notifyChange(newGroups);
    }
  };

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center">
        <h4 className="text-md font-bold text-slate-900">Dynamic Footer Columns</h4>
        <button
          type="button"
          onClick={addGroup}
          className="text-xs font-medium bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1"
        >
          <Plus className="w-3 h-3" /> Add Column
        </button>
      </div>

      <div className="space-y-6">
        {editingGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="bg-slate-50 border border-slate-200 rounded-xl p-4 relative">
            <div className="flex gap-4 mb-4">
              <input
                type="text"
                value={group.title}
                onChange={(e) => updateGroupTitle(groupIndex, e.target.value)}
                className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                placeholder="Column Title (e.g. Resources)"
              />
              <button
                type="button"
                onClick={() => removeGroup(groupIndex)}
                className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition-colors"
                title="Remove Column"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1">
              <DndContext 
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={(e) => handleDragEnd(e, groupIndex)}
              >
                <SortableContext 
                  items={group.links.map(l => l.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {group.links.map((link, linkIndex) => (
                    <SortableLinkItem
                      key={link.id}
                      link={link}
                      linkIndex={linkIndex}
                      groupIndex={groupIndex}
                      updateLink={updateLink}
                      removeLink={removeLink}
                    />
                  ))}
                </SortableContext>
              </DndContext>
            </div>

            <button
              type="button"
              onClick={() => addLink(groupIndex)}
              className="mt-4 text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 px-2 py-1 rounded hover:bg-emerald-50 transition-colors"
            >
              <Plus className="w-3 h-3" /> Add Link
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
