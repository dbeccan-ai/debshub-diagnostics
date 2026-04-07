

# Fix Desmos Calculator Triggering Tab-Switch Security

## Root Cause

There are **two problems**:

1. **Iframe focus triggers `window.blur`**: When a student clicks inside the Desmos iframe, the main window loses focus and fires a `blur` event. The `handleWindowBlur` handler in `use-tab-visibility.tsx` interprets this as a tab switch and immediately disables the test.

2. **Iframe `allow-popups` sandbox attribute**: The Desmos iframe has `allow-popups` in its sandbox, which could let Desmos open new tabs/windows — a real tab switch.

## Fix

### 1. `src/hooks/use-tab-visibility.tsx` — Ignore blur when focus moves to an iframe

Update `handleWindowBlur` to check if the newly focused element is an iframe within the page. When `window.blur` fires because a same-page iframe received focus, `document.activeElement` will be the `<iframe>` element. In that case, skip the security trigger.

```ts
const handleWindowBlur = useCallback(() => {
  if (!enabled) return;
  // If focus moved to an iframe on our page (e.g. Desmos calculator tool),
  // this is NOT a tab switch — ignore it.
  setTimeout(() => {
    if (document.activeElement?.tagName === "IFRAME") return;
    setState((prev) => {
      if (prev.isVisible) {
        const newCount = prev.tabSwitchCount + 1;
        return { isVisible: false, tabSwitchCount: newCount, isTestDisabled: true };
      }
      return prev;
    });
  }, 0);
}, [enabled]);
```

The `setTimeout(…, 0)` is needed because `document.activeElement` isn't updated until after the blur event fires.

### 2. `src/components/tools/ScientificCalculatorTool.tsx` — Remove `allow-popups`

Change the sandbox attribute from `"allow-scripts allow-same-origin allow-popups"` to `"allow-scripts allow-same-origin"`. This prevents Desmos from opening any new tabs at all.

## Files Changed

| File | Change |
|------|--------|
| `src/hooks/use-tab-visibility.tsx` | Skip blur handler when active element is an iframe |
| `src/components/tools/ScientificCalculatorTool.tsx` | Remove `allow-popups` from sandbox |

Two files, minimal changes. No new dependencies.

