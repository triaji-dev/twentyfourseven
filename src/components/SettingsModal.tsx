import React, { useState, useEffect } from 'react';
import { useSettings } from '../store/useSettings';
import type { DynamicCategory } from '../types';
import { X, Trash2, Plus } from 'lucide-react';

export const SettingsModal: React.FC = () => {
  const isOpen = useSettings((state) => state.isSettingsOpen);
  const closeSettings = useSettings((state) => state.closeSettings);
  const categories = useSettings((state) => state.categories);
  const setCategories = useSettings((state) => state.setCategories);
  
  // Local draft state - changes are only applied when modal closes
  const [draftCategories, setDraftCategories] = useState<DynamicCategory[]>([]);
  const [newCategory, setNewCategory] = useState<Partial<DynamicCategory>>({ key: '', name: '', color: '#10b981' });
  const [showAddForm, setShowAddForm] = useState(false);

  // Initialize draft when modal opens
  useEffect(() => {
    if (isOpen) {
      setDraftCategories([...categories]);
    }
  }, [isOpen, categories]);

  // Save draft to store when modal closes
  const handleClose = () => {
    setCategories(draftCategories);
    closeSettings();
  };

  if (!isOpen) return null;

  const handleUpdateCategory = (key: string, field: keyof DynamicCategory, value: string) => {
    setDraftCategories(prev => 
      prev.map(cat => 
        cat.key === key 
          ? { ...cat, [field]: field === 'key' ? value.toUpperCase() : value }
          : cat
      )
    );
  };

  const handleAddCategory = () => {
    if (newCategory.key && newCategory.name && newCategory.color) {
      const upperKey = newCategory.key.toUpperCase();
      // Check if key already exists
      if (draftCategories.some(cat => cat.key === upperKey)) {
        alert('Category key already exists!');
        return;
      }
      setDraftCategories(prev => [...prev, {
        key: upperKey,
        name: newCategory.name!,
        color: newCategory.color!,
      }]);
      setNewCategory({ key: '', name: '', color: '#10b981' });
      setShowAddForm(false);
    }
  };

  const handleDeleteCategory = (key: string) => {
    if (confirm(`Delete category "${key}"? This will not remove existing data.`)) {
      setDraftCategories(prev => prev.filter(cat => cat.key !== key));
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-6"
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-[340px] bg-[#0a0a0a] border border-[#262626] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh] animate-in fade-in zoom-in-95 duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-[#0a0a0a]">
          <h2 className="text-sm font-medium tracking-tight text-[#e5e5e5]">
            Settings
          </h2>
          <button
            onClick={handleClose}
            className="p-1 rounded-full text-[#525252] hover:text-[#e5e5e5] hover:bg-[#262626] transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Categories Section */}
        <div className="flex-1 overflow-y-auto custom-scrollbar px-5 pb-5 pt-1">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[10px] font-semibold text-[#525252] uppercase tracking-[0.15em]">
              Categories
            </h3>
          </div>
          
          <div className="space-y-0.5 mb-5">
            {draftCategories.map((category) => (
              <div 
                key={category.key}
                className="flex items-center gap-3 py-1.5 group"
              >
                {/* Color Picker */}
                <div className="relative w-3.5 h-3.5 shrink-0 rounded-full border border-white/10 group-hover:scale-110 transition-transform cursor-pointer">
                  <div 
                    className="absolute inset-0 rounded-full" 
                    style={{ backgroundColor: category.color }} 
                  />
                  <input
                    type="color"
                    value={category.color}
                    onChange={(e) => handleUpdateCategory(category.key, 'color', e.target.value)}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                
                {/* Key - Small badge style */}
                <div className="relative group/key">
                  <input
                    type="text"
                    value={category.key}
                    maxLength={1}
                    onChange={(e) => {
                      const newKey = e.target.value.toUpperCase();
                      if (newKey && draftCategories.some(cat => cat.key === newKey && cat.key !== category.key)) {
                        return;
                      }
                      handleUpdateCategory(category.key, 'key', newKey);
                    }}
                    className="w-5 h-5 text-center rounded bg-[#171717] border border-[#262626] text-[10px] font-bold text-[#737373] focus:text-[#e5e5e5] focus:border-[#525252] outline-none transition-all uppercase"
                  />
                </div>
                
                {/* Name Input */}
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) => handleUpdateCategory(category.key, 'name', e.target.value)}
                  placeholder="Category Name"
                  className="flex-1 bg-transparent text-xs text-[#e5e5e5] placeholder-[#404040] outline-none transition-all border-b border-transparent focus:border-[#262626] py-0.5"
                />
                
                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteCategory(category.key)}
                  className="p-1 text-[#404040] hover:text-[#ef4444] transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            ))}
          </div>

          {/* Add New Category */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="group flex items-center gap-2 text-[10px] font-medium text-[#525252] hover:text-[#a3a3a3] transition-colors pl-0.5"
            >
              <div className="w-4 h-4 rounded-full border border-dashed border-[#404040] flex items-center justify-center group-hover:border-[#737373]">
                <Plus size={10} />
              </div>
              Add category
            </button>
          ) : (
            <div className="mt-2 p-3 rounded-xl bg-[#171717] border border-[#262626] animate-in slide-in-from-top-1 duration-200">
              <div className="flex items-center gap-2 mb-3">
                <div className="relative w-4 h-4 shrink-0 rounded-full border border-white/10">
                  <div className="absolute inset-0 rounded-full" style={{ backgroundColor: newCategory.color }} />
                  <input
                    type="color"
                    value={newCategory.color}
                    onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                </div>
                
                <input
                  type="text"
                  value={newCategory.key}
                  maxLength={1}
                  onChange={(e) => setNewCategory({ ...newCategory, key: e.target.value.toUpperCase() })}
                  placeholder="K"
                  className="w-5 h-5 text-center rounded bg-[#0a0a0a] border border-[#262626] text-[10px] font-bold text-[#e5e5e5] outline-none placeholder-[#404040] uppercase"
                />
                
                <input
                  type="text"
                  value={newCategory.name}
                  onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                  placeholder="New Category Name"
                  className="flex-1 bg-transparent text-xs text-[#e5e5e5] outline-none placeholder-[#404040] border-b border-[#262626]"
                />
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleAddCategory}
                  className="flex-1 py-1 px-3 rounded-lg text-[10px] font-semibold bg-[#e5e5e5] text-black hover:bg-white transition-all transform active:scale-95"
                >
                  Confirm
                </button>
                <button
                  onClick={() => {
                    setShowAddForm(false);
                    setNewCategory({ key: '', name: '', color: '#10b981' });
                  }}
                  className="flex-1 py-1 px-3 rounded-lg text-[10px] font-semibold text-[#737373] hover:text-white hover:bg-[#262626] transition-all"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
          
          <div className="mt-8 mb-1">
            <p className="text-[9px] text-[#404040] text-center tracking-tight">
              Changes applied on close
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
