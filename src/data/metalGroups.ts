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
  const iname = recipe.inputName || recipe.input;
  const rname = recipe.resultName || recipe.result;

  // Move Aluminium Silicate and Stainless Steel Jar Lid recipes to 'Other'
  if (iname.includes('Aluminium Silicate') || rname.includes('Aluminium Silicate')) {
    return 'Other';
  }
  if (rname.includes('Stainless Steel Jar Lid') || (iname.includes('Stainless Steel') && rname.includes('Jar Lid'))) {
    return 'Other';
  }

  const cleaned = iname.startsWith('Long ') ? iname.slice(5) : iname;

  for (const item of METAL_FAMILIES) {
    for (const prefix of item.prefixes) {
      if (cleaned.startsWith(prefix)) {
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
    const res = r.resultName || r.result;
    const inp = r.inputName || r.input;
    const rulesStr = (r.rules || []).join(',');
    const key = `${res}|${inp}|${r.tier}|${rulesStr}`;
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(r);
    }
  }
  return unique;
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
      recipes: groupRecipes,
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
