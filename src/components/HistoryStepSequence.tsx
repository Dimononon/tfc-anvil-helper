import React from 'react';
import { GroupedStep } from '../engine/solver';

interface HistoryStepSequenceProps {
  groupedSteps?: GroupedStep[];
  success?: boolean;
  isLoading?: boolean;
}

export const HistoryStepSequence: React.FC<HistoryStepSequenceProps> = ({
  groupedSteps = [],
  success = true,
  isLoading = false,
}) => {
  if (isLoading) {
    return <span className="history-loading-indicator">Calculating...</span>;
  }

  if (!success || groupedSteps.length === 0) {
    return <span className="history-no-steps">{success ? 'No steps' : 'Unsolvable'}</span>;
  }

  // Render up to 6 grouped steps in one row with xN textures under each action icon
  const visibleSteps = groupedSteps.slice(0, 6);

  return (
    <div className="history-step-sequence">
      {visibleSteps.map((step, idx) => {
        const countStr = String(step.count);
        return (
          <div
            key={idx}
            className="history-step-column"
            title={`${step.action.name} × ${step.count} (${step.action.value > 0 ? `+${step.action.value}` : step.action.value})`}
          >
            {/* Action PNG Icon */}
            <img
              src={step.action.icon}
              alt={step.action.name}
              className="history-action-png-icon"
            />

            {/* xN Texture digits directly under the action icon */}
            <div className="history-action-count-texture">
              <img src="/assets/x.png" alt="x" className="history-count-x" />
              {countStr.split('').map((digit, dIdx) => (
                <img
                  key={dIdx}
                  src={`/assets/${digit}.png`}
                  alt={digit}
                  className="history-count-digit"
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
