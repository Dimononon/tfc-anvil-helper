import recipesTfc from './recipes_tfc.json';
import recipesTfg from './recipes_tfg.json';
import texturesTfc from './itemTextures_tfc.json';
import texturesTfg from './itemTextures_tfg.json';
import { TfcRecipe } from './recipes';

export interface TextureMeta {
  x: number;
  y: number;
  width: number;
  height: number;
  atlasWidth: number;
  atlasHeight: number;
}

export type PresetId = 'tfc' | 'tfg';

export interface PresetDef {
  id: PresetId;
  name: string;
  recipes: TfcRecipe[];
  textures: Record<string, TextureMeta>;
  atlasUrl: string;
}

export const PRESETS: Record<PresetId, PresetDef> = {
  tfc: {
    id: 'tfc',
    name: 'Vanilla TFC',
    recipes: recipesTfc as TfcRecipe[],
    textures: texturesTfc as Record<string, TextureMeta>,
    atlasUrl: '/textures/item_atlas_tfc.png',
  },
  tfg: {
    id: 'tfg',
    name: 'TerraFirmaGreg',
    recipes: recipesTfg as TfcRecipe[],
    textures: texturesTfg as Record<string, TextureMeta>,
    atlasUrl: '/textures/item_atlas_tfg.png',
  },
};
