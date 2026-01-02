import React, { useState, useEffect } from 'react';
import { useSettings } from '../store/useSettings';
import type { DynamicCategory } from '../types';

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
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}
      onClick={handleClose}
    >
      <div 
        className="w-full max-w-lg max-h-[80vh] overflow-y-auto rounded-xl p-6"
        style={{ backgroundColor: '#171717', border: '1px solid #262626' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-medium" style={{ color: '#e5e5e5' }}>
            Settings
          </h2>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg transition-all"
            style={{ color: '#a3a3a3' }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Categories Section */}
        <div className="mb-6">
          <h3 className="text-sm font-medium mb-4" style={{ color: '#a3a3a3' }}>
            Categories
          </h3>
          
          <div className="space-y-3">
            {draftCategories.map((category) => (
              <div 
                key={category.key}
                className="flex items-center gap-3 p-3 rounded-lg"
                style={{ backgroundColor: '#262626' }}
              >
                {/* Color Picker */}
                <input
                  type="color"
                  value={category.color}
                  onChange={(e) => handleUpdateCategory(category.key, 'color', e.target.value)}
                  className="w-8 h-8 rounded cursor-pointer"
                  style={{ border: 'none', padding: 0, backgroundColor: 'transparent' }}
                />
                
                {/* Key Input */}
                <input
                  type="text"
                  value={category.key}
                  maxLength={1}
                  onChange={(e) => {
                    const newKey = e.target.value.toUpperCase();
                    if (newKey && draftCategories.some(cat => cat.key === newKey && cat.key !== category.key)) {
                      alert('Key already exists!');
                      return;
                    }
                    handleUpdateCategory(category.key, 'key', newKey);
                  }}
                  className="w-10 h-8 text-center rounded text-sm font-medium"
                  style={{ 
                    backgroundColor: '#333333', 
                    color: '#e5e5e5',
                    border: '1px solid #404040'
                  }}
                />
                
                {/* Name Input */}
                <input
                  type="text"
                  value={category.name}
                  onChange={(e) => handleUpdateCategory(category.key, 'name', e.target.value)}
                  placeholder="Category name"
                  className="flex-1 h-8 px-3 rounded text-sm"
                  style={{ 
                    backgroundColor: '#333333', 
                    color: '#e5e5e5',
                    border: '1px solid #404040'
                  }}
                />
                
                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteCategory(category.key)}
                  className="p-2 rounded transition-all hover:bg-red-900/30"
                  style={{ color: '#ef4444' }}
                  title="Delete category"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Category */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="w-full py-3 rounded-lg text-sm font-medium transition-all"
            style={{ 
              backgroundColor: '#262626', 
              color: '#a3a3a3',
              border: '1px dashed #404040'
            }}
          >
            + Add New Category
          </button>
        ) : (
          <div 
            className="p-4 rounded-lg space-y-3"
            style={{ backgroundColor: '#262626', border: '1px solid #404040' }}
          >
            <h4 className="text-sm font-medium" style={{ color: '#e5e5e5' }}>
              New Category
            </h4>
            
            <div className="flex items-center gap-3">
              {/* Color Picker */}
              <input
                type="color"
                value={newCategory.color}
                onChange={(e) => setNewCategory({ ...newCategory, color: e.target.value })}
                className="w-8 h-8 rounded cursor-pointer"
                style={{ border: 'none', padding: 0, backgroundColor: 'transparent' }}
              />
              
              {/* Key Input */}
              <input
                type="text"
                value={newCategory.key}
                maxLength={1}
                onChange={(e) => setNewCategory({ ...newCategory, key: e.target.value.toUpperCase() })}
                placeholder="K"
                className="w-10 h-8 text-center rounded text-sm font-medium"
                style={{ 
                  backgroundColor: '#333333', 
                  color: '#e5e5e5',
                  border: '1px solid #404040'
                }}
              />
              
              {/* Name Input */}
              <input
                type="text"
                value={newCategory.name}
                onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                placeholder="Category name"
                className="flex-1 h-8 px-3 rounded text-sm"
                style={{ 
                  backgroundColor: '#333333', 
                  color: '#e5e5e5',
                  border: '1px solid #404040'
                }}
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={handleAddCategory}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ backgroundColor: '#10b981', color: '#ffffff' }}
              >
                Add
              </button>
              <button
                onClick={() => {
                  setShowAddForm(false);
                  setNewCategory({ key: '', name: '', color: '#10b981' });
                }}
                className="flex-1 py-2 rounded-lg text-sm font-medium transition-all"
                style={{ backgroundColor: '#404040', color: '#a3a3a3' }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Info */}
        <p className="mt-4 text-xs" style={{ color: '#525252' }}>
          Changes will be applied when you close this dialog.
        </p>
      </div>
    </div>
  );
};
