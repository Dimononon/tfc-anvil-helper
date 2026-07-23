import React, { useState, useEffect, useMemo } from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setSelectedRecipeId } from '../store/anvilSlice';
import { PRESETS } from '../data/presets';
import { getMetalGroups, MetalGroup } from '../data/metalGroups';
import { ItemIcon } from './ItemIcon';

// Helper to extract result count from recipe
function getRecipeCount(recipe: { result: string; resultName?: string }): number {
  const matchResult = recipe.result.match(/\s+x(\d+)$/i);
  if (matchResult) {
    return parseInt(matchResult[1], 10);
  }
  if (recipe.resultName) {
    const matchName = recipe.resultName.match(/(?:[x×])\s*(\d+)$/i);
    if (matchName) {
      return parseInt(matchName[1], 10);
    }
  }
  return 1;
}

// Single Metal Button component with icon cycling
const MetalButton: React.FC<{
  group: MetalGroup;
  isSelected: boolean;
  onClick: () => void;
}> = ({ group, isSelected, onClick }) => {
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    if (group.cyclingIcons.length <= 1) return;
    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % group.cyclingIcons.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [group.cyclingIcons]);

  const currentIconKey = group.cyclingIcons[iconIndex] || group.cyclingIcons[0];

  return (
    <button
      className={`slot-icon-btn metal-slot ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <ItemIcon itemKey={currentIconKey} size={32} />
      <span className="slot-badge">{group.recipes.length}</span>

      {/* Rich Metal Button Tooltip */}
      <div className="slot-tooltip">
        <div className="tooltip-title">{group.name}</div>
        <div className="tooltip-meta">🔨 Tier {group.tier} Anvil</div>
        <div className="tooltip-sub">{group.recipes.length} recipes</div>
        <div className="tooltip-rules">{group.tagOrId}</div>
      </div>
    </button>
  );
};

export const MetalRecipeBrowser: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selectedPreset, selectedRecipeId } = useAppSelector((state) => state.anvil);
  const preset = PRESETS[selectedPreset] || PRESETS.tfc;

  const metalGroups = useMemo(() => {
    return getMetalGroups(preset.recipes);
  }, [preset.recipes]);

  // Find metal group containing the currently selected recipe by default
  const initialMetalId = useMemo(() => {
    for (const g of metalGroups) {
      if (g.recipes.some((r) => r.id === selectedRecipeId)) {
        return g.id;
      }
    }
    return metalGroups[0]?.id || null;
  }, [metalGroups, selectedRecipeId]);

  const [activeMetalId, setActiveMetalId] = useState<string | null>(initialMetalId);

  // Sync active metal group if selectedRecipeId changes externally
  useEffect(() => {
    if (!activeMetalId) {
      setActiveMetalId(initialMetalId);
    }
  }, [initialMetalId]);

  const activeGroup = useMemo(() => {
    return metalGroups.find((g) => g.id === activeMetalId) || null;
  }, [metalGroups, activeMetalId]);

  const handleMetalClick = (groupId: string) => {
    if (activeMetalId === groupId) {
      setActiveMetalId(null); // Toggle close
    } else {
      setActiveMetalId(groupId);
    }
  };

  return (
    <div className="metal-recipe-browser">
      {/* Header Bar */}
      <div className="browser-bar-header">
        <div className="bar-title">
          <span>Recipe Browser</span>
          <span className="preset-pill">{preset.name}</span>
        </div>
        {activeGroup && (
          <div className="active-metal-summary">
            <span className="metal-title">{activeGroup.name}</span>
            <span className="preset-pill" style={{ background: 'rgba(240, 140, 0, 0.15)', color: 'var(--accent-primary)', borderColor: 'rgba(240, 140, 0, 0.3)' }}>
              Tier {activeGroup.tier}
            </span>
            <code className="metal-tag">{activeGroup.tagOrId}</code>
            <span className="count-tag">{activeGroup.recipes.length} items</span>
          </div>
        )}
      </div>

      {/* Main Unified Grid Table for Metals & Expanded Recipe Slots */}
      <div className="recipe-browser-grid">
        {metalGroups.map((group) => {
          const isSelected = group.id === activeMetalId;

          return (
            <React.Fragment key={group.id}>
              {/* Metal Group Icon Button */}
              <MetalButton
                group={group}
                isSelected={isSelected}
                onClick={() => handleMetalClick(group.id)}
              />

              {/* Direct Recipe Slots added into the exact same grid right after clicked metal button */}
              {isSelected &&
                group.recipes.map((recipe) => {
                  const isRecipeSelected = recipe.id === selectedRecipeId;
                  const recipeName = recipe.resultName || recipe.result;
                  const inputName = recipe.inputName || recipe.input;
                  const count = getRecipeCount(recipe);

                  return (
                    <button
                      key={recipe.id}
                      className={`slot-icon-btn recipe-slot ${isRecipeSelected ? 'selected' : ''}`}
                      onClick={() => dispatch(setSelectedRecipeId(recipe.id))}
                    >
                      <ItemIcon itemKey={recipe.result} size={32} />
                      {count > 1 && <span className="slot-badge">x{count}</span>}

                      {/* Rich Tooltip */}
                      <div className="slot-tooltip">
                        <div className="tooltip-title">{recipeName}</div>
                        <div className="tooltip-sub">Input: {inputName}</div>
                        <div className="tooltip-meta">Anvil Tier {recipe.tier}</div>
                        <div className="tooltip-rules">
                          {recipe.rules.map((r) => r.replace(/_/g, ' ')).join(' • ')}
                        </div>
                      </div>
                    </button>
                  );
                })}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
