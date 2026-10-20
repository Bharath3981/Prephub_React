import { useState } from "react";
import type { FetchState } from "@/shared/hooks/useFetch";

/**
 * While the next page or filter loads, keep showing the last result instead of an empty skeleton.
 * `scope` says what the data belongs to (for example the section): when it changes, the old data is dropped,
 * because the last page of ANOTHER section is not a placeholder, it is wrong.
 */
export function useKeepPrevious<T>(state: FetchState<T>, scope: string): { data: T | undefined; isPlaceholder: boolean } {
  const [last, setLast] = useState<{ scope: string; data: T } | null>(null);

  // Setting state while rendering is allowed for "remember something derived from props": React re-renders at once, before painting.
  if (state.status === "success" && (last === null || last.data !== state.data || last.scope !== scope)) {
    setLast({ scope, data: state.data });
  }

  if (state.status === "success") return { data: state.data, isPlaceholder: false };
  if (state.status === "loading" && last !== null && last.scope === scope) return { data: last.data, isPlaceholder: true };
  return { data: undefined, isPlaceholder: false };
}
