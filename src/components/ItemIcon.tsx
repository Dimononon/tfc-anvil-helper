import React from 'react';
import { useAppSelector } from '../store';
import { PRESETS } from '../data/presets';

interface ItemIconProps {
  itemKey: string;
  size?: number;
  className?: string;
}

export const ItemIcon: React.FC<ItemIconProps> = ({ itemKey, size = 32, className = '' }) => {
  const { selectedPreset } = useAppSelector((state) => state.anvil);
  const preset = PRESETS[selectedPreset] || PRESETS.tfg;
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

  // Pad the sample boundary inward by 0.5 atlas pixels on each edge to completely eliminate nearest-neighbor subpixel bleed
  // from adjacent tiles in the texture atlas regardless of container layout position, screen scaling, or CSS transforms.
  const pad = 0.5;
  const sampleWidth = meta.width - 2 * pad;
  const scale = size / sampleWidth;
  const bgWidth = meta.atlasWidth * scale;
  const bgHeight = meta.atlasHeight * scale;
  const bgX = -(meta.x + pad) * scale;
  const bgY = -(meta.y + pad) * scale;

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
        overflow: 'hidden',
      }}
      title={itemKey}
    />
  );
};
