import React, { useState, useEffect, useRef } from 'react';
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
  const solutionKeyRef = useRef<string>('');

  useEffect(() => {
    if (!recipe) return;

    const currentRecipeId = recipe.id;
    const currentRules = recipe.rules;
    const key = `${worldSeed}:${currentRecipeId}`;

    // If solution is already calculated for this seed and recipe, do not reset or recalculate on index shift
    if (solutionKeyRef.current === key && solution !== null) {
      return;
    }

    // Only set solution to null if the recipe/seed actually changed
    if (solutionKeyRef.current !== key) {
      setSolution(null);
    }

    let isSubscribed = true;

    // Stagger calculation based on index only for initial mount/seed changes
    const timer = setTimeout(() => {
      async function calculateSolution() {
        const progress = await calculateTargetProgressAsync(worldSeed, currentRecipeId);
        const result = await solveAnvilStepsAsync(progress, currentRules);
        if (isSubscribed) {
          solutionKeyRef.current = key;
          setSolution({ progress, result });
        }
      }
      calculateSolution();
    }, index * 35);

    return () => {
      isSubscribed = false;
      clearTimeout(timer);
    };
  }, [worldSeed, recipe, index, solution]);

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
