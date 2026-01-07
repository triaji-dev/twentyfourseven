import { create } from 'zustand';
import { SETTINGS_KEY } from '../constants';
import type { DynamicCategory } from '../types';
import { DEFAULT_CATEGORIES } from '../types';

interface SettingsState {
  categories: DynamicCategory[];
  isSettingsOpen: boolean;
  
  // Actions
  setCategories: (categories: DynamicCategory[]) => void;
  addCategory: (category: DynamicCategory) => void;
  updateCategory: (key: string, updates: Partial<DynamicCategory>) => void;
  deleteCategory: (key: string) => void;
  openSettings: () => void;
  closeSettings: () => void;
  getCategoryByKey: (key: string) => DynamicCategory | undefined;
  getValidKeys: () => string[];
}

// Load settings from localStorage
const loadSettings = (): DynamicCategory[] => {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.categories && Array.isArray(parsed.categories)) {
        return parsed.categories;
      }
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_CATEGORIES;
};

// Save settings to localStorage
const saveSettings = (categories: DynamicCategory[]): void => {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ categories }));
  } catch (e) {
    console.error('Failed to save settings:', e);
  }
};

export const useSettings = create<SettingsState>((set, get) => ({
  categories: loadSettings(),
  isSettingsOpen: false,
  
  setCategories: (categories: DynamicCategory[]) => {
    saveSettings(categories);
    set({ categories });
  },
  
  addCategory: (category: DynamicCategory) => {
    const newCategories = [...get().categories, category];
    saveSettings(newCategories);
    set({ categories: newCategories });
  },
  
  updateCategory: (key: string, updates: Partial<DynamicCategory>) => {
    const newCategories = get().categories.map(cat =>
      cat.key === key ? { ...cat, ...updates } : cat
    );
    saveSettings(newCategories);
    set({ categories: newCategories });
  },
  
  deleteCategory: (key: string) => {
    const newCategories = get().categories.filter(cat => cat.key !== key);
    saveSettings(newCategories);
    set({ categories: newCategories });
  },
  
  openSettings: () => set({ isSettingsOpen: true }),
  closeSettings: () => set({ isSettingsOpen: false }),
  
  getCategoryByKey: (key: string) => {
    return get().categories.find(cat => cat.key === key);
  },
  
  getValidKeys: () => {
    return get().categories.map(cat => cat.key);
  },
}));
