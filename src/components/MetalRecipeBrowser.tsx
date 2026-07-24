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
  countOverride?: number;
  isSelected: boolean;
  onClick: () => void;
}> = ({ group, countOverride, isSelected, onClick }) => {
  const [iconIndex, setIconIndex] = useState(0);

  useEffect(() => {
    if (group.cyclingIcons.length <= 1) return;
    const interval = setInterval(() => {
      setIconIndex((prev) => (prev + 1) % group.cyclingIcons.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [group.cyclingIcons]);

  const currentIconKey = group.cyclingIcons[iconIndex] || group.cyclingIcons[0];
  const recipeCount = countOverride ?? group.recipes.length;

  return (
    <button
      className={`slot-icon-btn metal-slot ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <ItemIcon itemKey={currentIconKey} size={32} />
      <span className="slot-badge">{recipeCount}</span>

      {/* Rich Metal Button Tooltip */}
      <div className="slot-tooltip">
        <div className="tooltip-title">{group.name}</div>
        <div className="tooltip-meta">Tier {group.tier} Anvil</div>
        <div className="tooltip-sub">{recipeCount} recipes</div>
      </div>
    </button>
  );
};

export const MetalRecipeBrowser: React.FC = () => {
  const dispatch = useAppDispatch();
  const { selectedPreset, selectedRecipeId } = useAppSelector((state) => state.anvil);
  const preset = PRESETS[selectedPreset] || PRESETS.tfc;
  const [searchQuery, setSearchQuery] = useState('');

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

  const isSearching = searchQuery.trim().length > 0;
  const queryLower = searchQuery.trim().toLowerCase();

  const filteredGroups = useMemo(() => {
    if (!isSearching) {
      return metalGroups.map((g) => ({ group: g, recipes: g.recipes }));
    }
    return metalGroups
      .map((g) => {
        const matching = g.recipes.filter((r) => {
          const inputStr = `${r.input} ${r.inputName || ''}`.toLowerCase();
          const resultStr = `${r.result} ${r.resultName || ''}`.toLowerCase();
          return inputStr.includes(queryLower) || resultStr.includes(queryLower);
        });
        return { group: g, recipes: matching };
      })
      .filter((item) => item.recipes.length > 0);
  }, [metalGroups, isSearching, queryLower]);

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
        <div className="browser-search-wrapper">
          <input
            type="text"
            className="browser-search-input"
            placeholder="Search input or output..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              className="search-clear-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Main Unified Grid Table for Metals & Expanded Recipe Slots */}
      <div className="recipe-browser-grid">
        {filteredGroups.map(({ group, recipes }) => {
          const isExpanded = isSearching || group.id === activeMetalId;

          return (
            <React.Fragment key={group.id}>
              {/* Metal Group Icon Button */}
              <MetalButton
                group={group}
                countOverride={isSearching ? recipes.length : undefined}
                isSelected={isExpanded}
                onClick={() => handleMetalClick(group.id)}
              />

              {/* Direct Recipe Slots added into the exact same grid right after clicked metal button */}
              {isExpanded &&
                recipes.map((recipe) => {
                  const isRecipeSelected = recipe.id === selectedRecipeId;
                  const recipeName = recipe.resultName || recipe.result;
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
                        <div className="tooltip-sub">input: {recipe.input.toLowerCase()}</div>
                        <div className="tooltip-sub">result: {recipe.result.toLowerCase()}</div>
                        <div className="tooltip-meta">Anvil Tier {recipe.tier}</div>
                      </div>
                    </button>
                  );
                })}
            </React.Fragment>
          );
        })}
        {isSearching && filteredGroups.length === 0 && (
          <div className="no-recipes-found">No recipes found matching "{searchQuery}"</div>
        )}
      </div>
    </div>
  );
};
