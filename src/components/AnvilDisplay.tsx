import React from 'react';
import { ItemIcon } from './ItemIcon';

interface Recipe {
  id: string;
  result: string;
  resultName?: string;
  input: string;
  inputName?: string;
  tier: number;
  rules: string[];
}

interface AnvilDisplayProps {
  recipe: Recipe;
  targetProgress: number;
}

// 8 Central Action Slots layout per user prompt (16x16 textures in 176x96 grid, moved 1px right, 1px down):
// Top row (y=31): -3 (Hit Light), -6 (Hit Medium), +2 (Punch), +7 (Bend)
// Bottom row (y=49): -9 (Hit Hard), -15 (Draw), +13 (Upset), +16 (Shrink)
const ACTION_SLOTS = [
  // Top Row (y = 31px)
  { id: 'HIT_LIGHT', name: 'Light Hit', value: -3, icon: '/assets/hit_light.png', x: 53, y: 31 },
  { id: 'HIT_MEDIUM', name: 'Medium Hit', value: -6, icon: '/assets/hit_medium.png', x: 71, y: 31 },
  { id: 'PUNCH', name: 'Punch', value: 2, icon: '/assets/punch.png', x: 89, y: 31 },
  { id: 'BEND', name: 'Bend', value: 7, icon: '/assets/bend.png', x: 107, y: 31 },
  // Bottom Row (y = 49px)
  { id: 'HIT_HEAVY', name: 'Hard Hit', value: -9, icon: '/assets/hit_hard.png', x: 53, y: 49 },
  { id: 'DRAW', name: 'Draw', value: -15, icon: '/assets/draw.png', x: 71, y: 49 },
  { id: 'UPSET', name: 'Upset', value: 13, icon: '/assets/upset.png', x: 89, y: 49 },
  { id: 'SHRINK', name: 'Shrink', value: 16, icon: '/assets/shrink.png', x: 107, y: 49 },
];

// Map rule string (e.g. 'draw_second_last', 'hit_last') to mandatory empty_ action icon
function getRuleActionIcon(rule: string): { icon: string; name: string } {
  const clean = rule.toLowerCase();
  if (clean.startsWith('punch')) return { icon: '/assets/empty_punch.png', name: 'Punch' };
  if (clean.startsWith('bend')) return { icon: '/assets/empty_bend.png', name: 'Bend' };
  if (clean.startsWith('upset')) return { icon: '/assets/empty_upset.png', name: 'Upset' };
  if (clean.startsWith('shrink')) return { icon: '/assets/empty_shrink.png', name: 'Shrink' };
  if (clean.startsWith('draw')) return { icon: '/assets/empty_draw.png', name: 'Draw' };
  if (clean.startsWith('hit')) return { icon: '/assets/empty_hit.png', name: 'Hit' };
  return { icon: '/assets/empty_hit.png', name: rule };
}

function getItemCount(itemKey: string, itemName?: string): number {
  const matchResult = itemKey.match(/\s+x(\d+)$/i);
  if (matchResult) {
    return parseInt(matchResult[1], 10);
  }
  if (itemName) {
    const matchName = itemName.match(/(?:[x×])\s*(\d+)$/i);
    if (matchName) {
      return parseInt(matchName[1], 10);
    }
  }
  return 1;
}

export const AnvilDisplay: React.FC<AnvilDisplayProps> = ({ recipe, targetProgress }) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = React.useState<number>(3);

  const resultCount = getItemCount(recipe.result, recipe.resultName);
  const inputCount = getItemCount(recipe.input, recipe.inputName);

  // Total canvas height for anvil GUI = 100px
  const totalCanvasHeight = 100;

  // Dynamic integer/fluid scale observer to keep pixel perfection at any resolution/zoom
  React.useLayoutEffect(() => {
    if (!wrapperRef.current) return;
    const updateScale = () => {
      if (!wrapperRef.current) return;
      const availableWidth = wrapperRef.current.clientWidth;
      if (availableWidth <= 0) return;
      // Prefer exact integer scale (e.g., 3x for 528px, 2x for 352px)
      const fitsScale = Math.floor(availableWidth / 176);
      if (fitsScale >= 1) {
        setScaleFactor(Math.min(fitsScale, 4));
      } else {
        setScaleFactor(availableWidth / 176);
      }
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    observer.observe(wrapperRef.current);
    window.addEventListener('resize', updateScale);
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  // Map mandatory top rule slots (x=60, 80, 100; y=8 in 176x100 grid)
  const topRuleSlots = React.useMemo(() => {
    const slots: Array<{ icon: string; name: string; label: string } | null> = [null, null, null];
    const rules = recipe.rules || [];

    rules.forEach((rule) => {
      const clean = rule.toLowerCase();
      const actionMeta = getRuleActionIcon(rule);
      const displayLabel = rule.replace(/_/g, ' ');

      if (clean.includes('third_last')) {
        slots[0] = { ...actionMeta, label: displayLabel };
      } else if (clean.includes('second_last')) {
        slots[1] = { ...actionMeta, label: displayLabel };
      } else if (clean.includes('last') && !clean.includes('not_last') && !clean.includes('second') && !clean.includes('third')) {
        slots[2] = { ...actionMeta, label: displayLabel };
      } else {
        if (!slots[0]) slots[0] = { ...actionMeta, label: displayLabel };
        else if (!slots[1]) slots[1] = { ...actionMeta, label: displayLabel };
        else if (!slots[2]) slots[2] = { ...actionMeta, label: displayLabel };
      }
    });

    return slots;
  }, [recipe.rules]);

  // Exact Integer Pixel Coordinates (0-150 scale spans x=15 to x=165)
  const clampedProgress = Math.min(150, Math.max(0, targetProgress));
  const targetX = 15 + clampedProgress; // exact integer pixel column on 176x100 canvas

  // Integer-aligned target number position under chevron (3px per digit, 1px gap)
  const targetStr = String(clampedProgress);
  const targetWidth = targetStr.length * 3 + (targetStr.length - 1) * 1;
  const targetOffset = Math.floor(targetWidth / 2);
  const targetNumberLeft = targetX - targetOffset;

  return (
    <div className="anvil-display-wrapper" ref={wrapperRef}>
      {/* Scaler Container with transform: scale */}
      <div
        className="anvil-display-scaler"
        style={{
          height: `${totalCanvasHeight}px`,
          transform: `scale(${scaleFactor})`,
          marginBottom: `${totalCanvasHeight * (scaleFactor - 1)}px`,
        }}
      >
        {/* Main Anvil GUI (176x100) */}
        <div className="anvil-display-container">
          {/* Authentic 176x100 Background Anvil Texture */}
          <img
            src="/assets/anvil_tp.png"
            alt="TFC Anvil GUI"
            className="anvil-tp-background"
          />

          {/* Left Item Slots */}
          {/* Output/Target Item */}
          <div
            className="anvil-slot-overlay item-slot target-item-slot"
            style={{ left: '22px', top: '21px' }}
            title={`Target Item: ${recipe.resultName || recipe.result}`}
          >
            <ItemIcon itemKey={recipe.result} size={16} />
            {resultCount > 1 && <span className="slot-badge">{resultCount}</span>}
          </div>

          {/* Input Item */}
          <div
            className="anvil-slot-overlay item-slot input-item-slot"
            style={{ left: '31px', top: '49px' }}
            title={`Input Item: ${recipe.inputName || recipe.input}`}
          >
            <ItemIcon itemKey={recipe.input} size={16} />
            {inputCount > 1 && <span className="slot-badge">{inputCount}</span>}
          </div>

          {/* Top 1-3 Mandatory Action Rule Slots */}
          {/* Right Slot (First step / 3rd last: x=100, y=8) */}
          <div
            className={`anvil-slot-overlay rule-slot ${topRuleSlots[0] ? 'active' : ''}`}
            style={{ left: '100px', top: '8px' }}
            title={topRuleSlots[0] ? `First Step: ${topRuleSlots[0].label}` : 'Optional step'}
          >
            {topRuleSlots[0] && (
              <img src={topRuleSlots[0].icon} alt={topRuleSlots[0].name} className="action-png-icon" />
            )}
          </div>

          {/* Middle Slot (Second step / 2nd last: x=80, y=8) */}
          <div
            className={`anvil-slot-overlay rule-slot ${topRuleSlots[1] ? 'active' : ''}`}
            style={{ left: '80px', top: '8px' }}
            title={topRuleSlots[1] ? `Second Step: ${topRuleSlots[1].label}` : 'Optional step'}
          >
            {topRuleSlots[1] && (
              <img src={topRuleSlots[1].icon} alt={topRuleSlots[1].name} className="action-png-icon" />
            )}
          </div>

          {/* Left Slot (Last step: x=60, y=8) */}
          <div
            className={`anvil-slot-overlay rule-slot ${topRuleSlots[2] ? 'active' : ''}`}
            style={{ left: '60px', top: '8px' }}
            title={topRuleSlots[2] ? `Last Step: ${topRuleSlots[2].label}` : 'Optional step'}
          >
            {topRuleSlots[2] && (
              <img src={topRuleSlots[2].icon} alt={topRuleSlots[2].name} className="action-png-icon" />
            )}
          </div>

          {/* Center 8 Action Blocks */}
          {ACTION_SLOTS.map(act => (
            <div
              key={act.id}
              className="anvil-slot-overlay action-slot"
              style={{ left: `${act.x}px`, top: `${act.y}px` }}
              title={`${act.name} (${act.value > 0 ? `+${act.value}` : act.value})`}
            >
              <img src={act.icon} alt={act.name} className="action-png-icon" />
            </div>
          ))}

          {/* Green Indicator Vertical Line (Y = 78 to 82) */}
          <div
            className="anvil-target-indicator-line"
            style={{ left: `${targetX}px` }}
          />

          {/* Target Chevron Marker (Y = 85px) */}
          <div
            className="anvil-chevron-indicator"
            style={{ left: `${targetX - 2}px`, top: '85px' }}
          >
            <img
              src="/assets/anvil_tp_chevron.png"
              alt="Target Progress Marker"
              className="chevron-icon"
            />
          </div>

          {/* Target Number Label using pixel-perfect PNG digit textures (Y = 91px) */}
          <div
            className="anvil-target-number-container"
            style={{ left: `${targetNumberLeft}px`, top: '91px' }}
          >
            {targetStr.split('').map((digit, idx) => (
              <img
                key={idx}
                src={`/assets/${digit}.png`}
                alt={digit}
                className="digit-texture-icon"
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
