import { useEffect } from "react";

/**
 * Development helper for the "render budget" of a page: counts how many times a component COMMITTED a render.
 * Read the numbers in the browser console with: window.__renders
 *
 * It counts in an effect (after the commit), not in the render body, so React's extra Strict Mode render is not
 * counted. In development Strict Mode also mounts every component twice, so the first count is 2 instead of 1.
 * In a production build the effect does nothing.
 */
export function useRenderCount(name: string) {
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __renders?: Record<string, number> };
    w.__renders ??= {};
    w.__renders[name] = (w.__renders[name] ?? 0) + 1;
  });
}
