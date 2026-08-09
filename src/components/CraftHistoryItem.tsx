import React, { useState, useEffect } from 'react';
import { CraftHistoryEntry } from '../store/anvilSlice';
import { PRESETS } from '../data/presets';
import { calculateTargetProgressAsync } from '../engine/rng';
import { solveAnvilStepsAsync, SolveResult } from '../engine/solver';
import { ItemIcon } from './ItemIcon';
import { HistoryStepSequence } from './HistoryStepSequence';

export interface CraftHistoryItemProps {
  entry: CraftHistoryEntry;
  worldSeed: string;
  isSelected: boolean;
  index: number;
  onSelect: () => void;
  onRemove: (e: React.MouseEvent) => void;
}

interface HistorySolutionData {
  progress: number;
  result: SolveResult;
}

export const CraftHistoryItem: React.FC<CraftHistoryItemProps> = ({
  entry,
  worldSeed,
  isSelected,
  index,
  onSelect,
  onRemove,
}) => {
  const preset = PRESETS[entry.presetId] || PRESETS.tfc;
  const recipe = preset.recipes.find((r) => r.id === entry.recipeId);

  const [solution, setSolution] = useState<HistorySolutionData | null>(null);

  useEffect(() => {
    if (!recipe) return;

    setSolution(null);
    const currentRecipeId = recipe.id;
    const currentRules = recipe.rules;
    let isSubscribed = true;

    // Stagger calculations based on index to calculate and display step results sequentially one at a time
    const timer = setTimeout(() => {
      async function calculateSolution() {
        const progress = await calculateTargetProgressAsync(worldSeed, currentRecipeId);
        const result = await solveAnvilStepsAsync(progress, currentRules);
        if (isSubscribed) {
          setSolution({ progress, result });
        }
      }
      calculateSolution();
    }, index * 35);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [worldSeed, recipe, index]);

  if (!recipe) return null;

  const resultName = recipe.resultName || recipe.result;

  return (
    <div
      className={`history-item-card ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
      title={`Select ${resultName} (${preset.name})`}
    >
      {/* Top Row: Flow Header (Input -> Arrow -> Result) */}
      <div className="history-card-header">
        <div className="history-flow-icons">
          {/* Input Item Icon */}
          <div className="history-icon-wrapper" title={`Input: ${recipe.inputName || recipe.input}`}>
            <ItemIcon itemKey={recipe.input} size={32} />
          </div>

          {/* Arrow */}
          <span className="history-flow-arrow">→</span>

          {/* Result Item Icon */}
          <div className="history-icon-wrapper" title={`Result: ${resultName}`}>
            <ItemIcon itemKey={recipe.result} size={32} />
          </div>
        </div>
      </div>

      {/* Bottom Row: 32x32 Action Steps without wrapper */}
      <HistoryStepSequence
        groupedSteps={solution?.result?.groupedSteps}
        success={solution?.result?.success}
        isLoading={solution === null}
      />

      {/* Remove single entry button */}
      <button
        className="history-remove-btn"
        onClick={onRemove}
        title="Remove from history"
      >
        ✕
      </button>
    </div>
  );
};
