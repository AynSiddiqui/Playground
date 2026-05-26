import React from 'react';

interface PlaybackControlsProps {
  onNext: () => void;
  onPrevious: () => void;
  onReset: () => void;
  onRun: () => void;
  onStop: () => void;
  canGoBack: boolean;
  isRunning: boolean;
  isFinished: boolean;
  isStepping: boolean;
  currentIndex: number;
  totalSteps: number;
  onSliderChange: (index: number) => void;
}

/**
 * Playback controls bar with Next/Previous/Reset buttons and a timeline slider.
 */
const PlaybackControls: React.FC<PlaybackControlsProps> = ({
  onNext,
  onPrevious,
  onReset,
  onRun,
  onStop,
  canGoBack,
  isRunning,
  isFinished,
  isStepping,
  currentIndex,
  totalSteps,
  onSliderChange,
}) => {
  return (
    <div className="controls-bar">
      {/* Run / Stop */}
      {!isRunning ? (
        <button className="btn btn--run" onClick={onRun} id="btn-run">
          ▶ Run
        </button>
      ) : (
        <button className="btn btn--stop" onClick={onStop} id="btn-stop">
          ■ Stop
        </button>
      )}

      {/* Playback controls */}
      <div className="controls-bar__group">
        <button
          className="btn btn--icon"
          onClick={onReset}
          disabled={totalSteps === 0}
          title="Reset"
          id="btn-reset"
        >
          ⏮
        </button>
        <button
          className="btn btn--icon"
          onClick={onPrevious}
          disabled={!canGoBack}
          title="Previous"
          id="btn-previous"
        >
          ◀
        </button>
        <button
          className="btn btn--icon"
          onClick={onNext}
          disabled={isFinished || !isRunning || isStepping}
          title="Next"
          id="btn-next"
        >
          ▶
        </button>
      </div>

      {/* Timeline slider */}
      <div className="timeline">
        <span className="timeline__label">
          Step {totalSteps > 0 ? currentIndex + 1 : 0} / {totalSteps}
        </span>
        <input
          type="range"
          className="timeline__slider"
          min={0}
          max={Math.max(0, totalSteps - 1)}
          value={Math.max(0, currentIndex)}
          onChange={(e) => onSliderChange(parseInt(e.target.value, 10))}
          disabled={totalSteps === 0}
          id="timeline-slider"
        />
      </div>
    </div>
  );
};

export { PlaybackControls };
