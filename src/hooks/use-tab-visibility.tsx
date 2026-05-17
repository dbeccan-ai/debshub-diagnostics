import { useEffect, useState, useCallback } from "react";

interface TabVisibilityState {
  isVisible: boolean;
  tabSwitchCount: number;
  isTestDisabled: boolean;
  showFirstWarning: boolean;
}

// Number of tab switches allowed before the test is paused.
// First switch shows a warning; second switch pauses.
const ALLOWED_SWITCHES_BEFORE_PAUSE = 1;

export const useTabVisibility = (enabled: boolean = true) => {
  const [state, setState] = useState<TabVisibilityState>({
    isVisible: true,
    tabSwitchCount: 0,
    isTestDisabled: false,
    showFirstWarning: false,
  });

  const registerSwitch = useCallback(() => {
    setState((prev) => {
      if (!prev.isVisible) return prev;
      const newCount = prev.tabSwitchCount + 1;
      const shouldPause = newCount > ALLOWED_SWITCHES_BEFORE_PAUSE;
      return {
        isVisible: false,
        tabSwitchCount: newCount,
        isTestDisabled: shouldPause,
        showFirstWarning: !shouldPause,
      };
    });
  }, []);

  const handleVisibilityChange = useCallback(() => {
    if (!enabled) return;
    const isVisible = document.visibilityState === "visible";
    if (!isVisible) {
      registerSwitch();
    } else {
      setState((prev) => ({ ...prev, isVisible: true }));
    }
  }, [enabled, registerSwitch]);

  const handleWindowBlur = useCallback(() => {
    if (!enabled) return;
    setTimeout(() => {
      if (document.activeElement?.tagName === "IFRAME") return;
      registerSwitch();
    }, 0);
  }, [enabled, registerSwitch]);

  useEffect(() => {
    if (!enabled) return;
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("blur", handleWindowBlur);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("blur", handleWindowBlur);
    };
  }, [enabled, handleVisibilityChange, handleWindowBlur]);

  const resetState = useCallback(() => {
    setState({
      isVisible: true,
      tabSwitchCount: 0,
      isTestDisabled: false,
      showFirstWarning: false,
    });
  }, []);

  const dismissFirstWarning = useCallback(() => {
    setState((prev) => ({ ...prev, showFirstWarning: false, isVisible: true }));
  }, []);

  return { ...state, resetState, dismissFirstWarning };
};
