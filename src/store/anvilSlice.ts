import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PRESETS, PresetId } from '../data/presets';

export interface CraftHistoryEntry {
  recipeId: string;
  presetId: PresetId;
  timestamp: number;
}

export interface AnvilState {
  worldSeed: string;
  selectedPreset: PresetId;
  selectedRecipeId: string;
  searchQuery: string;
  selectedTier: number | null;
  craftHistory: CraftHistoryEntry[];
}

const STORAGE_SEED_KEY = 'tfc_anvil_world_seed';
const STORAGE_PRESET_KEY = 'tfc_anvil_preset_id';
const STORAGE_HISTORY_KEY = 'tfc_anvil_craft_history';
const MAX_HISTORY_ITEMS = 20;

function loadHistoryFromStorage(): CraftHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.slice(0, MAX_HISTORY_ITEMS);
    }
  } catch (e) {
    console.error('Failed to load craft history from localStorage:', e);
  }
  return [];
}

function saveHistoryToStorage(history: CraftHistoryEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_HISTORY_KEY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save craft history to localStorage:', e);
  }
}

function helperAddToHistory(
  history: CraftHistoryEntry[],
  recipeId: string,
  presetId: PresetId
): CraftHistoryEntry[] {
  if (!recipeId) return history;
  // Remove existing duplicate entry for (recipeId, presetId)
  const filtered = history.filter(
    (item) => !(item.recipeId === recipeId && item.presetId === presetId)
  );
  // Prepend to top
  const updated = [
    { recipeId, presetId, timestamp: Date.now() },
    ...filtered,
  ].slice(0, MAX_HISTORY_ITEMS);

  saveHistoryToStorage(updated);
  return updated;
}

const getInitialSeed = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_SEED_KEY);
    if (saved) return saved;
  }
  return '832011092856214026';
};

const getInitialPreset = (): PresetId => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_PRESET_KEY) as PresetId;
    if (saved && PRESETS[saved]) return saved;
  }
  return 'tfg';
};

const initialSeed = getInitialSeed();
const initialPreset = getInitialPreset();
const activePreset = PRESETS[initialPreset] || PRESETS.tfg;
const initialRecipeId = activePreset.recipes[0]?.id || '';
const initialHistory = helperAddToHistory(loadHistoryFromStorage(), initialRecipeId, initialPreset);

const initialState: AnvilState = {
  worldSeed: initialSeed,
  selectedPreset: initialPreset,
  selectedRecipeId: initialRecipeId,
  searchQuery: '',
  selectedTier: null,
  craftHistory: initialHistory,
};

export const anvilSlice = createSlice({
  name: 'anvil',
  initialState,
  reducers: {
    setWorldSeed: (state, action: PayloadAction<string>) => {
      state.worldSeed = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_SEED_KEY, action.payload);
      }
    },
    setSelectedPreset: (state, action: PayloadAction<PresetId>) => {
      state.selectedPreset = action.payload;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_PRESET_KEY, action.payload);
      }
      const preset = PRESETS[action.payload] || PRESETS.tfc;
      const newRecipeId = preset.recipes[0]?.id || '';
      state.selectedRecipeId = newRecipeId;
      if (newRecipeId) {
        state.craftHistory = helperAddToHistory(state.craftHistory, newRecipeId, action.payload);
      }
    },
    setSelectedRecipeId: (state, action: PayloadAction<string>) => {
      state.selectedRecipeId = action.payload;
      if (action.payload) {
        state.craftHistory = helperAddToHistory(state.craftHistory, action.payload, state.selectedPreset);
      }
    },
    selectRecipeFromHistory: (
      state,
      action: PayloadAction<{ recipeId: string; presetId: PresetId }>
    ) => {
      state.selectedPreset = action.payload.presetId;
      state.selectedRecipeId = action.payload.recipeId;
      if (typeof window !== 'undefined') {
        localStorage.setItem(STORAGE_PRESET_KEY, action.payload.presetId);
      }
      state.craftHistory = helperAddToHistory(
        state.craftHistory,
        action.payload.recipeId,
        action.payload.presetId
      );
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedTier: (state, action: PayloadAction<number | null>) => {
      state.selectedTier = action.payload;
    },
    clearHistory: (state) => {
      state.craftHistory = [];
      saveHistoryToStorage([]);
    },
    removeFromHistory: (
      state,
      action: PayloadAction<{ recipeId: string; presetId: PresetId }>
    ) => {
      state.craftHistory = state.craftHistory.filter(
        (item) =>
          !(item.recipeId === action.payload.recipeId && item.presetId === action.payload.presetId)
      );
      saveHistoryToStorage(state.craftHistory);
    },
  },
});

export const {
  setWorldSeed,
  setSelectedPreset,
  setSelectedRecipeId,
  selectRecipeFromHistory,
  setSearchQuery,
  setSelectedTier,
  clearHistory,
  removeFromHistory,
} = anvilSlice.actions;

export default anvilSlice.reducer;

