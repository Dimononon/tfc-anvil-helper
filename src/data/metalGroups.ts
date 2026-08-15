import { TfcRecipe } from './recipes';

export interface MetalGroup {
  id: string;
  name: string;
  tagOrId: string;
  tier: number;
  cyclingIcons: string[];
  recipes: TfcRecipe[];
}

// Define metal families mapping sub-metal prefixes to primary metal group names
const METAL_FAMILIES: Array<{ family: string; prefixes: string[] }> = [
  { family: 'Blue Steel', prefixes: ['Blue Steel', 'High Carbon Blue Steel', 'Weak Blue Steel'] },
  { family: 'Red Steel', prefixes: ['Red Steel', 'High Carbon Red Steel', 'Weak Red Steel'] },
  { family: 'Black Steel', prefixes: ['Black Steel', 'High Carbon Black Steel'] },
  { family: 'Steel', prefixes: ['Steel', 'High Carbon Steel'] },
  { family: 'Wrought Iron', prefixes: ['Wrought Iron', 'Refined Iron Bloom', 'Raw Iron Bloom'] },
  { family: 'Iron', prefixes: ['Iron', 'Pig Iron', 'Cast Iron'] },
  { family: 'Bismuth Bronze', prefixes: ['Bismuth Bronze'] },
  { family: 'Bismuth', prefixes: ['Bismuth'] },
  { family: 'Black Bronze', prefixes: ['Black Bronze'] },
  { family: 'Cobalt Brass', prefixes: ['Cobalt Brass'] },
  { family: 'Brass', prefixes: ['Brass'] },
  { family: 'Bronze', prefixes: ['Bronze'] },
  { family: 'Chromium', prefixes: ['Chromium'] },
  { family: 'Cobalt', prefixes: ['Cobalt'] },
  { family: 'Copper', prefixes: ['Copper'] },
  { family: 'Gold', prefixes: ['Gold'] },
  { family: 'Invar', prefixes: ['Invar'] },
  { family: 'Lead', prefixes: ['Lead'] },
  { family: 'Nickel', prefixes: ['Nickel'] },
  { family: 'Potin', prefixes: ['Potin'] },
  { family: 'Red Alloy', prefixes: ['Red Alloy'] },
  { family: 'Rose Gold', prefixes: ['Rose Gold'] },
  { family: 'Silver', prefixes: ['Silver'] },
  { family: 'Stainless Steel', prefixes: ['Stainless Steel'] },
  { family: 'Sterling Silver', prefixes: ['Sterling Silver'] },
  { family: 'Tin Alloy', prefixes: ['Tin Alloy'] },
  { family: 'Tin', prefixes: ['Tin'] },
  { family: 'Zinc', prefixes: ['Zinc'] },
];

function classifyRecipeFamily(recipe: TfcRecipe): string {
  const iname = (recipe.inputName || recipe.input || '').trim();
  const rname = (recipe.resultName || recipe.result || '').trim();
  const rid = (recipe.id || '').toLowerCase();

  // 1. Try matching prefixes on resultName or inputName after stripping common modifiers
  for (const name of [rname, iname]) {
    let clean = name;
    for (const mod of ['Double ', 'Unfinished ', 'Small ', 'Long ', 'Large ', 'Big ']) {
      if (clean.startsWith(mod)) {
        clean = clean.slice(mod.length);
      }
    }

    for (const item of METAL_FAMILIES) {
      for (const prefix of item.prefixes) {
        if (clean.startsWith(prefix)) {
          return item.family;
        }
      }
    }
  }

  // 2. Fallback: match metal family in full text (inputName, resultName, recipe ID)
  const fullText = `${iname} ${rname} ${rid}`.toLowerCase();
  for (const item of METAL_FAMILIES) {
    for (const prefix of item.prefixes) {
      const p = prefix.toLowerCase();
      const regex = new RegExp(`(^|[\\s_/:\\-])${p}([\\s_/:\\-]|$)`, 'i');
      if (regex.test(fullText)) {
        return item.family;
      }
    }
  }

  return 'Other';
}

function deduplicateRecipes(recipes: TfcRecipe[]): TfcRecipe[] {
  const unique: TfcRecipe[] = [];
  const seen = new Set<string>();

  for (const r of recipes) {
    const key = r.id ? r.id : `${r.result}|${r.input}|${r.tier}|${(r.rules || []).join(',')}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(r);
    }
  }
  return unique;
}

const ALL_METAL_PREFIXES = METAL_FAMILIES.flatMap((f) => f.prefixes).sort((a, b) => b.length - a.length);

function getNormalizedItemName(cleanName: string): string {
  let s = cleanName;

  let leadMod = '';
  const modMatch = s.match(/^(Small|Long|Big|Large|Unfinished)\s+/i);
  if (modMatch) {
    leadMod = modMatch[1];
    s = s.slice(modMatch[0].length);
  }

  for (const prefix of ALL_METAL_PREFIXES) {
    const reg = new RegExp('^' + prefix + '\\s+', 'i');
    if (reg.test(s)) {
      s = s.replace(reg, '');
      break;
    }
  }

  if (!leadMod) {
    const modMatch2 = s.match(/^(Small|Long|Big|Large|Unfinished)\s+/i);
    if (modMatch2) {
      leadMod = modMatch2[1];
      s = s.slice(modMatch2[0].length);
    }
  }

  return leadMod ? `${s} (${leadMod})` : s;
}

function getRecipeCategoryRank(recipe: TfcRecipe): [number, number, string] {
  const rawName = recipe.resultName || recipe.result;
  const cleanName = rawName.replace(/[\s×x\d]+$/, '').trim();
  const n = cleanName.toLowerCase();
  const sortKey = getNormalizedItemName(cleanName);

  // Category 1: Basic Metal Stock (Ingots, Sheets, Plates)
  if (n.includes('bloom')) return [1, 1, sortKey];
  if (n.includes('ingot')) return [1, 2, sortKey];
  if (n.includes('sheet') || /\bplate\b/.test(n)) return [1, 3, sortKey];

  // Category 2: Small Parts & Fasteners (Rods, Wires, Bolts, Screws, Rings, Nuggets, Springs)
  if (/\brod\b/.test(n) || (/\bwire\b/.test(n) && !n.includes('cutter'))) return [2, 1, sortKey];
  if (
    ['bolt', 'ring', 'nugget', 'spring', 'gear'].some((k) => n.includes(k)) ||
    (/\bscrew\b/.test(n) && !n.includes('screwdriver'))
  )
    return [2, 2, sortKey];

  // Category 3: Tool & Instrument Heads / Weapon Parts (Axe, Saw, Pickaxe, Hoe, Chisel, Hammer, Knife, Tuyere, Screwdriver Tip, etc.)
  if (['head', 'blade', 'tip', 'part', 'hook', 'cutter', 'screwdriver', 'tuyere'].some((k) => n.includes(k))) return [3, 1, sortKey];

  // Category 4: Armor & Protection
  if (['unfinished', 'helmet', 'chestplate', 'greaves', 'boots', 'shield'].some((k) => n.includes(k))) return [4, 1, sortKey];

  // Category 5: Utility, Blocks & Misc (Chain, Door, Trapdoor, Bars, Lamp, etc.)
  return [5, 1, sortKey];
}

export function sortRecipes(recipes: TfcRecipe[]): TfcRecipe[] {
  return [...recipes].sort((a, b) => {
    const rankA = getRecipeCategoryRank(a);
    const rankB = getRecipeCategoryRank(b);

    if (rankA[0] !== rankB[0]) return rankA[0] - rankB[0];
    if (rankA[1] !== rankB[1]) return rankA[1] - rankB[1];
    return rankA[2].localeCompare(rankB[2]);
  });
}

export function getMetalGroups(rawRecipes: TfcRecipe[]): MetalGroup[] {
  const recipes = deduplicateRecipes(rawRecipes);
  const map = new Map<string, TfcRecipe[]>();

  for (const r of recipes) {
    const metalName = classifyRecipeFamily(r);
    if (!map.has(metalName)) {
      map.set(metalName, []);
    }
    map.get(metalName)!.push(r);
  }

  const groups: MetalGroup[] = [];

  for (const [name, groupRecipes] of map.entries()) {
    const id = name.toLowerCase().replace(/\s+/g, '_');

    // Filter inputs to ONLY include distinct Ingot / Bloom display items for icon cycling (no double ingots, sheets, rods)
    // Group by input display name (e.g. "Copper Ingot"), preferring "item:" keys over "tag:" keys to avoid bogus cycling
    const ingotMap = new Map<string, string>();

    for (const r of groupRecipes) {
      const iname = r.inputName || r.input;
      const isIngotOrBloom = (iname.includes('Ingot') || iname.includes('Bloom')) && !iname.includes('Double');
      if (isIngotOrBloom) {
        const cleanName = iname.trim();
        const currentBest = ingotMap.get(cleanName);
        if (!currentBest) {
          ingotMap.set(cleanName, r.input);
        } else if (currentBest.startsWith('tag:') && r.input.startsWith('item:')) {
          ingotMap.set(cleanName, r.input);
        }
      }
    }

    const cyclingIcons = ingotMap.size > 0 ? Array.from(ingotMap.values()) : [groupRecipes[0]?.input || ''];
    const primaryInput = cyclingIcons[0] || groupRecipes[0]?.input || '';
    const tagOrId = primaryInput.replace(/^(item:\s*|tag:\s*)/, '');
    const tier = Math.min(...groupRecipes.map((r) => r.tier));

    groups.push({
      id,
      name,
      tagOrId,
      tier,
      cyclingIcons,
      recipes: sortRecipes(groupRecipes),
    });
  }

  // Sort metal groups by tier ascending (Tier 1 -> Tier 2 -> Tier 3 -> Tier 4 -> Tier 5 -> Tier 6),
  // with secondary sort by recipe count descending
  groups.sort((a, b) => {
    if (a.name === 'Other') return 1;
    if (b.name === 'Other') return -1;
    if (a.tier !== b.tier) return a.tier - b.tier;
    return b.recipes.length - a.recipes.length;
  });

  return groups;
}
