import { useEffect, useState, useCallback } from "react";

interface TabVisibilityState {
  isVisible: boolean;
  tabSwitchCount: number;
  isTestDisabled: boolean;
}

export const useTabVisibility = (enabled: boolean = true) => {
  const [state, setState] = useState<TabVisibilityState>({
    isVisible: true,
    tabSwitchCount: 0,
    isTestDisabled: false,
  });

  const handleVisibilityChange = useCallback(() => {
    if (!enabled) return;
    
    const isVisible = document.visibilityState === "visible";
    
    setState((prev) => {
      // Only count when switching away from the tab
      if (!isVisible && prev.isVisible) {
        const newCount = prev.tabSwitchCount + 1;
        return {
          isVisible,
          tabSwitchCount: newCount,
          isTestDisabled: true, // Disable immediately on first switch
        };
      }
      return { ...prev, isVisible };
    });
  }, [enabled]);

  const handleWindowBlur = useCallback(() => {
    if (!enabled) return;
    
    setState((prev) => {
      if (prev.isVisible) {
        const newCount = prev.tabSwitchCount + 1;
        return {
          isVisible: false,
          tabSwitchCount: newCount,
          isTestDisabled: true,
        };
      }
      return prev;
    });
  }, [enabled]);

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
    });
  }, []);

  return { ...state, resetState };
};
