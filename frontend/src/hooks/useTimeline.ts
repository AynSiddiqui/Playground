import { useState, useCallback, useRef } from 'react';
import type { Snapshot } from '../types';

interface UseTimelineReturn {
  /** All snapshots received so far */
  timeline: Snapshot[];
  /** Index of the currently displayed snapshot */
  currentIndex: number;
  /** The snapshot at the current index, or null if empty */
  currentSnapshot: Snapshot | null;
  /** Push a new snapshot to the end of the timeline */
  pushSnapshot: (snapshot: Snapshot) => void;
  /** Go to the previous snapshot (from cache, no backend call) */
  goBack: () => boolean;
  /** Go to the next snapshot (returns false if at the end, meaning backend step needed) */
  goForward: () => boolean;
  /** Jump to a specific index */
  goTo: (index: number) => void;
  /** Reset the entire timeline */
  reset: () => void;
  /** Whether we're at the latest snapshot (end of timeline) */
  isAtLatest: boolean;
  /** Whether we can go back */
  canGoBack: boolean;
}

/**
 * Custom hook implementing the frontend "Time Machine" cache.
 * 
 * As the backend sends snapshots, they're pushed into an array.
 * "Previous" scrubs back through local state (instant, no backend call).
 * "Next" either advances the local index or signals the caller to request
 * a new step from the backend.
 */
export function useTimeline(): UseTimelineReturn {
  const [timeline, setTimeline] = useState<Snapshot[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const timelineRef = useRef<Snapshot[]>([]);

  const pushSnapshot = useCallback((snapshot: Snapshot) => {
    timelineRef.current = [...timelineRef.current, snapshot];
    setTimeline(timelineRef.current);
    setCurrentIndex(timelineRef.current.length - 1);
  }, []);

  const goBack = useCallback((): boolean => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      return true;
    }
    return false;
  }, [currentIndex]);

  const goForward = useCallback((): boolean => {
    if (currentIndex < timelineRef.current.length - 1) {
      setCurrentIndex(prev => prev + 1);
      return true;
    }
    // At the end of cache — caller should request a backend step
    return false;
  }, [currentIndex]);

  const goTo = useCallback((index: number) => {
    if (index >= 0 && index < timelineRef.current.length) {
      setCurrentIndex(index);
    }
  }, []);

  const reset = useCallback(() => {
    timelineRef.current = [];
    setTimeline([]);
    setCurrentIndex(-1);
  }, []);

  const currentSnapshot = currentIndex >= 0 && currentIndex < timeline.length
    ? timeline[currentIndex]
    : null;

  const isAtLatest = currentIndex === timeline.length - 1;
  const canGoBack = currentIndex > 0;

  return {
    timeline,
    currentIndex,
    currentSnapshot,
    pushSnapshot,
    goBack,
    goForward,
    goTo,
    reset,
    isAtLatest,
    canGoBack,
  };
}
