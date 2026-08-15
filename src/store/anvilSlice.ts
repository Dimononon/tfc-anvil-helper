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
  craftHistoryByPreset: Record<PresetId, CraftHistoryEntry[]>;
}

const STORAGE_SEED_KEY = 'tfc_anvil_world_seed';
const STORAGE_PRESET_KEY = 'tfc_anvil_preset_id';
const STORAGE_HISTORY_KEY = 'tfc_anvil_craft_history';
const MAX_HISTORY_ITEMS = 20;

function loadHistoryForPreset(presetId: PresetId): CraftHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = `${STORAGE_HISTORY_KEY}_${presetId}`;
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.slice(0, MAX_HISTORY_ITEMS);
      }
    }
  } catch (e) {
    console.error(`Failed to load craft history for preset ${presetId}:`, e);
  }
  return [];
}

function saveHistoryForPreset(presetId: PresetId, history: CraftHistoryEntry[]) {
  if (typeof window === 'undefined') return;
  try {
    const key = `${STORAGE_HISTORY_KEY}_${presetId}`;
    localStorage.setItem(key, JSON.stringify(history));
  } catch (e) {
    console.error(`Failed to save craft history for preset ${presetId}:`, e);
  }
}

function helperAddToPresetHistory(
  historyMap: Record<PresetId, CraftHistoryEntry[]>,
  recipeId: string,
  presetId: PresetId
): Record<PresetId, CraftHistoryEntry[]> {
  if (!recipeId || !presetId) return historyMap;
  const currentList = historyMap[presetId] || [];
  const filtered = currentList.filter((item) => item.recipeId !== recipeId);
  const updatedList = [
    { recipeId, presetId, timestamp: Date.now() },
    ...filtered,
  ].slice(0, MAX_HISTORY_ITEMS);

  saveHistoryForPreset(presetId, updatedList);

  return {
    ...historyMap,
    [presetId]: updatedList,
  };
}

const getInitialSeed = (): string => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem(STORAGE_SEED_KEY);
    if (saved !== null) {
      if (saved === '832011092856214026') {
        localStorage.removeItem(STORAGE_SEED_KEY);
        return '';
      }
      return saved;
    }
  }
  return '';
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

const initialPresetHistoryMap: Record<PresetId, CraftHistoryEntry[]> = {
  tfc: loadHistoryForPreset('tfc'),
  tfg: loadHistoryForPreset('tfg'),
};

const initialStateHistory = helperAddToPresetHistory(
  initialPresetHistoryMap,
  initialRecipeId,
  initialPreset
);

const initialState: AnvilState = {
  worldSeed: initialSeed,
  selectedPreset: initialPreset,
  selectedRecipeId: initialRecipeId,
  searchQuery: '',
  selectedTier: null,
  craftHistoryByPreset: initialStateHistory,
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
      const preset = PRESETS[action.payload] || PRESETS.tfg;
      const newRecipeId = preset.recipes[0]?.id || '';
      state.selectedRecipeId = newRecipeId;
      if (newRecipeId) {
        state.craftHistoryByPreset = helperAddToPresetHistory(
          state.craftHistoryByPreset,
          newRecipeId,
          action.payload
        );
      }
    },
    setSelectedRecipeId: (state, action: PayloadAction<string>) => {
      state.selectedRecipeId = action.payload;
      if (action.payload) {
        state.craftHistoryByPreset = helperAddToPresetHistory(
          state.craftHistoryByPreset,
          action.payload,
          state.selectedPreset
        );
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
      state.craftHistoryByPreset = helperAddToPresetHistory(
        state.craftHistoryByPreset,
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
    clearHistory: (state, action: PayloadAction<PresetId | undefined>) => {
      const presetToClear = action.payload || state.selectedPreset;
      state.craftHistoryByPreset[presetToClear] = [];
      saveHistoryForPreset(presetToClear, []);
    },
    removeFromHistory: (
      state,
      action: PayloadAction<{ recipeId: string; presetId: PresetId }>
    ) => {
      const presetId = action.payload.presetId;
      const currentList = state.craftHistoryByPreset[presetId] || [];
      const updated = currentList.filter(
        (item) => !(item.recipeId === action.payload.recipeId && item.presetId === presetId)
      );
      state.craftHistoryByPreset[presetId] = updated;
      saveHistoryForPreset(presetId, updated);
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

