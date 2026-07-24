export type AnvilActionType =
  | 'PUNCH'
  | 'BEND'
  | 'UPSET'
  | 'SHRINK'
  | 'DRAW'
  | 'HIT_LIGHT'
  | 'HIT_MEDIUM'
  | 'HIT_HEAVY';

export interface AnvilActionDef {
  id: AnvilActionType;
  name: string;
  value: number;
  icon: string;
  type: 'negative' | 'positive';
}

export const ANVIL_ACTIONS: Record<AnvilActionType, AnvilActionDef> = {
  PUNCH: { id: 'PUNCH', name: 'Punch', value: 2, icon: '/assets/punch.png', type: 'positive' },
  BEND: { id: 'BEND', name: 'Bend', value: 7, icon: '/assets/bend.png', type: 'positive' },
  UPSET: { id: 'UPSET', name: 'Upset', value: 13, icon: '/assets/upset.png', type: 'positive' },
  SHRINK: { id: 'SHRINK', name: 'Shrink', value: 16, icon: '/assets/shrink.png', type: 'positive' },
  DRAW: { id: 'DRAW', name: 'Draw', value: -15, icon: '/assets/draw.png', type: 'negative' },
  HIT_LIGHT: { id: 'HIT_LIGHT', name: 'Light Hit', value: -3, icon: '/assets/hit_light.png', type: 'negative' },
  HIT_MEDIUM: { id: 'HIT_MEDIUM', name: 'Medium Hit', value: -6, icon: '/assets/hit_medium.png', type: 'negative' },
  HIT_HEAVY: { id: 'HIT_HEAVY', name: 'Hard Hit', value: -9, icon: '/assets/hit_hard.png', type: 'negative' },
};

export interface GroupedStep {
  action: AnvilActionDef;
  count: number;
  mandatoryRule?: string; // Rule description if mandatory
}

export interface SolveResult {
  targetProgress: number;
  totalSteps: number;
  steps: AnvilActionType[];
  groupedSteps: GroupedStep[];
  success: boolean;
  message?: string;
}

function stepMatches(action: AnvilActionType, stepPrefix: string): boolean {
  if (stepPrefix === 'hit') {
    return action === 'HIT_LIGHT' || action === 'HIT_MEDIUM' || action === 'HIT_HEAVY';
  }
  if (stepPrefix === 'punch') return action === 'PUNCH';
  if (stepPrefix === 'bend') return action === 'BEND';
  if (stepPrefix === 'upset') return action === 'UPSET';
  if (stepPrefix === 'shrink') return action === 'SHRINK';
  if (stepPrefix === 'draw') return action === 'DRAW';
  return false;
}

/**
 * Checks if a given sequence of actions satisfies a recipe rule.
 */
function matchesRule(sequence: AnvilActionType[], rule: string): boolean {
  const len = sequence.length;
  if (len < 1) return false;

  const parts = rule.toLowerCase().split('_');
  const stepPrefix = parts[0];
  const order = parts.slice(1).join('_');

  const aLast = sequence[len - 1];
  const aSec = len >= 2 ? sequence[len - 2] : null;
  const aThird = len >= 3 ? sequence[len - 3] : null;

  if (order === 'last') {
    return stepMatches(aLast, stepPrefix);
  }
  if (order === 'second_last') {
    return aSec !== null && stepMatches(aSec, stepPrefix);
  }
  if (order === 'third_last') {
    return aThird !== null && stepMatches(aThird, stepPrefix);
  }
  if (order === 'not_last') {
    const secMatch = aSec !== null && stepMatches(aSec, stepPrefix);
    const thirdMatch = aThird !== null && stepMatches(aThird, stepPrefix);
    return secMatch || thirdMatch;
  }
  if (order === 'any') {
    const lastMatch = stepMatches(aLast, stepPrefix);
    const secMatch = aSec !== null && stepMatches(aSec, stepPrefix);
    const thirdMatch = aThird !== null && stepMatches(aThird, stepPrefix);
    return lastMatch || secMatch || thirdMatch;
  }

  return true;
}

/**
 * Validates that the entire action sequence satisfies all recipe rules.
 */

export function validateRules(sequence: AnvilActionType[], rules: string[]): boolean {
  return rules.every(rule => matchesRule(sequence, rule));
}

const solverCache = new Map<string, SolveResult>();

/**
 * BFS Pathfinding Solver to find optimal step sequence.
 * 1. Minimizes total number of hammer hits (path.length).
 * 2. Among paths of minimum length, minimizes total grouped action steps (consecutive grouping).
 * 3. Deduplicates states per level for sub-millisecond execution.
 * 4. Caches solution results for 0ms instant repeated lookups.
 */
export function solveAnvilSteps(targetProgress: number, rules: string[] = []): SolveResult {
  if (targetProgress <= 0) {
    return { targetProgress, totalSteps: 0, steps: [], groupedSteps: [], success: true };
  }

  const cacheKey = `${targetProgress}:${rules.join(',')}`;
  const cached = solverCache.get(cacheKey);
  if (cached) return cached;

  const actionKeys: AnvilActionType[] = Object.keys(ANVIL_ACTIONS) as AnvilActionType[];

  // Current depth frontier: list of [currentVal, path]
  let currentLevel: Array<[number, AnvilActionType[]]> = [[0, []]];
  const visited = new Set<string>();
  visited.add(`0:`);

  const maxDepth = 15;
  const maxProgress = 150; // TFC scale maximum

  for (let depth = 1; depth <= maxDepth; depth++) {
    // Map stateKey (val:suffix) -> best path for this state at current depth
    const nextLevelMap = new Map<string, { val: number; path: AnvilActionType[]; groupCount: number }>();
    const validSolutions: AnvilActionType[][] = [];

    for (const [current, path] of currentLevel) {
      for (const act of actionKeys) {
        const nextVal = current + ANVIL_ACTIONS[act].value;
        // Progress must stay strictly >= 1 at all times to prevent destroying the item
        if (nextVal < 1 || nextVal > maxProgress) continue;

        const nextPath = [...path, act];

        if (nextVal === targetProgress && validateRules(nextPath, rules)) {
          validSolutions.push(nextPath);
        }

        const suffixKey = `${nextVal}:${nextPath.slice(-3).join(',')}`;
        if (!visited.has(suffixKey)) {
          const gCount = groupSteps(nextPath).length;
          const existing = nextLevelMap.get(suffixKey);
          if (!existing || gCount < existing.groupCount) {
            nextLevelMap.set(suffixKey, { val: nextVal, path: nextPath, groupCount: gCount });
          }
        }
      }
    }

    if (validSolutions.length > 0) {
      // Sort solutions to pick the one with the fewest grouped action blocks
      validSolutions.sort((a, b) => {
        const groupsA = groupSteps(a).length;
        const groupsB = groupSteps(b).length;
        if (groupsA !== groupsB) return groupsA - groupsB;

        // Secondary tie breaker: prefer paths that repeat the same action consecutively
        const lastActionA = a[a.length - 1];
        const lastActionB = b[b.length - 1];
        if (lastActionA !== lastActionB) {
          return ANVIL_ACTIONS[lastActionB].value - ANVIL_ACTIONS[lastActionA].value;
        }
        return 0;
      });

      const bestPath = validSolutions[0];
      const groupedSteps = groupSteps(bestPath);

      const result: SolveResult = {
        targetProgress,
        totalSteps: bestPath.length,
        steps: bestPath,
        groupedSteps,
        success: true,
      };
      solverCache.set(cacheKey, result);
      return result;
    }

    currentLevel = [];
    for (const [key, entry] of nextLevelMap.entries()) {
      visited.add(key);
      currentLevel.push([entry.val, entry.path]);
    }

    if (currentLevel.length === 0) break;
  }

  const failResult: SolveResult = {
    targetProgress,
    totalSteps: 0,
    steps: [],
    groupedSteps: [],
    success: false,
    message: 'Could not calculate step sequence for given target and rules.',
  };
  solverCache.set(cacheKey, failResult);
  return failResult;
}

export async function solveAnvilStepsAsync(targetProgress: number, rules: string[] = []): Promise<SolveResult> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(solveAnvilSteps(targetProgress, rules));
    }, 0);
  });
}

/**
 * Groups consecutive identical actions into a single GroupedStep.
 * Mandatory and non-mandatory steps of the same action type merge seamlessly.
 */
function groupSteps(sequence: AnvilActionType[]): GroupedStep[] {
  const result: GroupedStep[] = [];
  const len = sequence.length;
  if (len === 0) return result;

  let i = 0;
  while (i < len) {
    const act = sequence[i];
    let count = 1;

    while (i + count < len && sequence[i + count] === act) {
      count++;
    }

    result.push({
      action: ANVIL_ACTIONS[act],
      count,
    });

    i += count;
  }

  return result;
}
