import React from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import {
  selectRecipeFromHistory,
  clearHistory,
  removeFromHistory,
} from '../store/anvilSlice';
import { CraftHistoryItem } from './CraftHistoryItem';

export const CraftHistoryBar: React.FC = () => {
  const dispatch = useAppDispatch();
  const { craftHistoryByPreset, worldSeed, selectedRecipeId, selectedPreset } = useAppSelector(
    (state) => state.anvil
  );

  const activeHistory = craftHistoryByPreset[selectedPreset] || [];

  return (
    <aside className="craft-history-sidebar">
      {/* Sidebar Header */}
      <div className="history-bar-header">
        <div className="history-title-group">
          <span className="history-header-title">History</span>
          <span className="history-count-pill">{activeHistory.length}/20</span>
        </div>
        {activeHistory.length > 0 && (
          <button
            className="history-clear-btn"
            onClick={() => dispatch(clearHistory(selectedPreset))}
            title={`Clear ${selectedPreset.toUpperCase()} craft history`}
          >
            Clear
          </button>
        )}
      </div>

      {/* History Items List */}
      <div className="history-items-list">
        {activeHistory.length === 0 ? (
          <div className="history-empty-state">
            <span>No craft history</span>
            <span className="history-empty-sub">Select recipes to add history</span>
          </div>
        ) : (
          activeHistory.map((entry, idx) => {
            const isSelected =
              entry.recipeId === selectedRecipeId && entry.presetId === selectedPreset;

            return (
              <CraftHistoryItem
                key={`${entry.presetId}:${entry.recipeId}`}
                entry={entry}
                worldSeed={worldSeed}
                isSelected={isSelected}
                index={idx}
                onSelect={() =>
                  dispatch(
                    selectRecipeFromHistory({
                      recipeId: entry.recipeId,
                      presetId: entry.presetId,
                    })
                  )
                }
                onRemove={(e) => {
                  e.stopPropagation();
                  dispatch(
                    removeFromHistory({
                      recipeId: entry.recipeId,
                      presetId: entry.presetId,
                    })
                  );
                }}
              />
            );
          })
        )}
      </div>
    </aside>
  );
};
