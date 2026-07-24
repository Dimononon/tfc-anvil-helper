import React from 'react';
import { useAppDispatch, useAppSelector } from '../store';
import { setSelectedPreset, setWorldSeed } from '../store/anvilSlice';
import { PRESETS, PresetId } from '../data/presets';

export const Header: React.FC = () => {
  const dispatch = useAppDispatch();
  const { worldSeed, selectedPreset } = useAppSelector(state => state.anvil);

  const handleSeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch(setWorldSeed(e.target.value));
  };

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand">
          <span className="brand-title-sm">TFC Anvil Helper</span>
        </div>

        <div className="header-controls">
          <div className="control-group">
            <label htmlFor="preset-select" className="control-label">Preset:</label>
            <select
              id="preset-select"
              className="control-input"
              value={selectedPreset}
              onChange={e => dispatch(setSelectedPreset(e.target.value as PresetId))}
              disabled
            >
              {Object.values(PRESETS).map(preset => (
                <option key={preset.id} value={preset.id}>
                  {preset.name}
                </option>
              ))}
            </select>
          </div>

          <div className="control-group">
            <label htmlFor="seed-input" className="control-label">World Seed:</label>
            <input
              id="seed-input"
              type="text"
              className="control-input"
              value={worldSeed}
              onChange={handleSeedChange}
              placeholder="Seed..."
              disabled
            />
          </div>
        </div>
      </div>
    </header>
  );
};
