import React from 'react';
import { useAppSelector } from '../store';
import { PRESETS } from '../data/presets';

interface ItemIconProps {
  itemKey: string;
  size?: number;
  className?: string;
}

export const ItemIcon: React.FC<ItemIconProps> = ({ itemKey, size = 32, className = '' }) => {
  const selectedPreset = useAppSelector(state => state.anvil.selectedPreset);
  const preset = PRESETS[selectedPreset] || PRESETS.tfc;
  const meta = preset.textures[itemKey];

  if (!meta) {
    return (
      <div
        className={`fallback-icon ${className}`}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          fontSize: `${size * 0.5}px`,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: '4px',
        }}
        title={`Missing texture: ${itemKey}`}
      >
        🔨
      </div>
    );
  }

  const scale = size / meta.width;
  const bgWidth = meta.atlasWidth * scale;
  const bgHeight = meta.atlasHeight * scale;
  // Add a tiny subpixel offset (0.05 atlas px) to prevent subpixel nearest-neighbor bleed from adjacent atlas tiles
  const offset = 0.05;
  const bgX = -(meta.x + offset) * scale;
  const bgY = -(meta.y + offset) * scale;

  return (
    <div
      className={`item-icon ${className}`}
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundImage: `url(${preset.atlasUrl})`,
        backgroundPosition: `${bgX}px ${bgY}px`,
        backgroundSize: `${bgWidth}px ${bgHeight}px`,
        backgroundRepeat: 'no-repeat',
        imageRendering: 'pixelated',
        flexShrink: 0,
      }}
      title={itemKey}
    />
  );
};
