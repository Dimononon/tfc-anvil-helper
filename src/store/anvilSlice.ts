import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { PRESETS, PresetId } from '../data/presets';

export interface AnvilState {
  worldSeed: string;
  selectedPreset: PresetId;
  selectedRecipeId: string;
  searchQuery: string;
  selectedTier: number | null;
}

const STORAGE_SEED_KEY = 'tfc_anvil_world_seed';
const STORAGE_PRESET_KEY = 'tfc_anvil_preset_id';

const initialSeed = typeof window !== 'undefined'
  ? localStorage.getItem(STORAGE_SEED_KEY) || '123456789'
  : '123456789';

const initialPreset = (typeof window !== 'undefined'
  ? (localStorage.getItem(STORAGE_PRESET_KEY) as PresetId)
  : null) || 'tfc';

const activePreset = PRESETS[initialPreset] || PRESETS.tfc;

const initialState: AnvilState = {
  worldSeed: initialSeed,
  selectedPreset: activePreset.id,
  selectedRecipeId: activePreset.recipes[0]?.id || '',
  searchQuery: '',
  selectedTier: null,
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
      state.selectedRecipeId = preset.recipes[0]?.id || '';
    },
    setSelectedRecipeId: (state, action: PayloadAction<string>) => {
      state.selectedRecipeId = action.payload;
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
    setSelectedTier: (state, action: PayloadAction<number | null>) => {
      state.selectedTier = action.payload;
    },
  },
});

export const {
  setWorldSeed,
  setSelectedPreset,
  setSelectedRecipeId,
  setSearchQuery,
  setSelectedTier,
} = anvilSlice.actions;

export default anvilSlice.reducer;
