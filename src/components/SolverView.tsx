import React, { useMemo } from 'react';
import { useAppSelector } from '../store';
import { PRESETS } from '../data/presets';
import { calculateTargetProgress } from '../engine/rng';
import { solveAnvilSteps } from '../engine/solver';
import { AnvilDisplay } from './AnvilDisplay';
import { AnvilResult } from './AnvilResult';
import { MetalRecipeBrowser } from './MetalRecipeBrowser';

export const SolverView: React.FC = () => {
  const { worldSeed, selectedRecipeId, selectedPreset } = useAppSelector(state => state.anvil);
  const preset = PRESETS[selectedPreset] || PRESETS.tfc;

  const recipe = useMemo(() => {
    return preset.recipes.find(r => r.id === selectedRecipeId) || preset.recipes[0];
  }, [selectedRecipeId, preset]);

  // Calculate target progress value using 128-bit PRNG engine (instantaneous 0ms)
  const targetProgress = useMemo(() => {
    if (!recipe) return 40;
    return calculateTargetProgress(worldSeed, recipe.id);
  }, [worldSeed, recipe]);

  // Run A* / BFS solver for optimal steps (0ms cached execution)
  const solveResult = useMemo(() => {
    if (!recipe) return undefined;
    return solveAnvilSteps(targetProgress, recipe.rules);
  }, [targetProgress, recipe]);

  if (!recipe) {
    return <div className="solver-panel">Select a recipe to view anvil instructions</div>;
  }

  return (
    <div className="solver-panel">
      <MetalRecipeBrowser />

      <div className="anvil-main-display-section">
        {/* Anvil Result action sequence component rendered directly above AnvilDisplay */}
        <AnvilResult solveResult={solveResult} />

        {/* Authentic TFC Anvil GUI Display */}
        <AnvilDisplay
          recipe={recipe}
          targetProgress={targetProgress}
        />
      </div>

      {/* Solved Status Message if solver failed */}
      {solveResult && !solveResult.success && (
        <div className="empty-state">
          ⚠️ {solveResult.message || 'Unable to solve steps for this target.'}
        </div>
      )}
    </div>
  );
};
