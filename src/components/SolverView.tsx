import React, { useState, useEffect, useMemo } from 'react';
import { useAppSelector } from '../store';
import { PRESETS } from '../data/presets';
import { calculateTargetProgressAsync } from '../engine/rng';
import { solveAnvilStepsAsync, SolveResult } from '../engine/solver';
import { AnvilDisplay } from './AnvilDisplay';
import { AnvilResult } from './AnvilResult';
import { MetalRecipeBrowser } from './MetalRecipeBrowser';
import { CraftHistoryBar } from './CraftHistoryBar';

export const SolverView: React.FC = () => {
  const { worldSeed, selectedRecipeId, selectedPreset } = useAppSelector((state) => state.anvil);
  const preset = PRESETS[selectedPreset] || PRESETS.tfc;

  const recipe = useMemo(() => {
    return preset.recipes.find((r) => r.id === selectedRecipeId) || preset.recipes[0];
  }, [selectedRecipeId, preset]);

  const [targetProgress, setTargetProgress] = useState<number>(40);
  const [solveResult, setSolveResult] = useState<SolveResult | undefined>(undefined);

  // Asynchronous calculation for target progress value and optimal anvil steps
  useEffect(() => {
    if (!recipe) return;

    let isSubscribed = true;

    async function runAsyncCalculation() {
      const progress = await calculateTargetProgressAsync(worldSeed, recipe.id);
      const result = await solveAnvilStepsAsync(progress, recipe.rules);

      if (isSubscribed) {
        setTargetProgress(progress);
        setSolveResult(result);
      }
    }

    runAsyncCalculation();

    return () => {
      isSubscribed = false;
    };
  }, [worldSeed, recipe]);

  if (!recipe) {
    return (
      <div className="solver-workspace-layout">
        <CraftHistoryBar />
        <div className="solver-panel">Select a recipe to view anvil instructions</div>
      </div>
    );
  }

  return (
    <div className="solver-workspace-layout">
      <CraftHistoryBar />

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
    </div>
  );
};

