import React from 'react';
import { SolveResult } from '../engine/solver';

interface AnvilResultProps {
  solveResult?: SolveResult;
}

export const AnvilResult: React.FC<AnvilResultProps> = ({ solveResult }) => {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [scaleFactor, setScaleFactor] = React.useState<number>(3);

  // Total canvas height for results = 38px
  const totalCanvasHeight = 38;

  // Dynamic integer/fluid scale observer to keep pixel perfection aligned with AnvilDisplay
  React.useLayoutEffect(() => {
    if (!wrapperRef.current) return;
    const updateScale = () => {
      if (!wrapperRef.current) return;
      const availableWidth = wrapperRef.current.clientWidth;
      if (availableWidth <= 0) return;
      // Fluid scale for mobile/narrow screens (< 528px), integer scale for desktop (>= 528px)
      const fluidScale = availableWidth / 176;
      if (availableWidth < 528) {
        setScaleFactor(fluidScale);
      } else {
        const integerScale = Math.floor(fluidScale);
        setScaleFactor(Math.min(integerScale, 4));
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

  return (
    <div className="anvil-results-wrapper" ref={wrapperRef}>
      <div
        className="anvil-results-scaler"
        style={{
          height: `${totalCanvasHeight}px`,
          transform: `scale(${scaleFactor})`,
          marginBottom: `${totalCanvasHeight * (scaleFactor - 1)}px`,
        }}
      >
        <div className="anvil-results-container">
          <img
            src="/assets/results.png"
            alt="Anvil Results Sequence"
            className="results-bg-texture"
          />

          {/* Render up to 9 Grouped Action Slots (x=8, 26, 44, 62, 80, 98, 116, 134, 152 at y=8px) */}
          {Array.from({ length: 9 }).map((_, idx) => {
            const group = solveResult?.groupedSteps?.[idx];
            const slotX = 8 + idx * 18;
            const centerX = slotX + 8; // Center of 16px slot

            const countStr = group ? String(group.count) : '';
            const totalSymbols = 1 + countStr.length; // 'x' icon (3px) + digits (3px each)
            const countWidth = totalSymbols * 3 + (totalSymbols - 1) * 1;
            const countOffset = Math.floor(countWidth / 2);
            const countLeft = centerX - countOffset;

            return (
              <React.Fragment key={idx}>
                {/* Action Icon overlay at y=8px */}
                <div
                  className="results-slot-overlay"
                  style={{ left: `${slotX}px`, top: '8px' }}
                  title={group ? `${group.action.name} × ${group.count} (${group.action.value > 0 ? `+${group.action.value}` : group.action.value})` : undefined}
                >
                  {group && (
                    <img
                      src={group.action.icon}
                      alt={group.action.name}
                      className="action-png-icon"
                    />
                  )}
                </div>

                {/* Action Count (x.png + digits) directly under each active slot at y=27px */}
                {group && (
                  <div
                    className="results-action-count-container"
                    style={{ left: `${countLeft}px`, top: '27px' }}
                  >
                    <img src="/assets/x.png" alt="x" className="count-x-icon" />
                    {countStr.split('').map((digit, dIdx) => (
                      <img
                        key={dIdx}
                        src={`/assets/${digit}.png`}
                        alt={digit}
                        className="digit-texture-icon"
                      />
                    ))}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
