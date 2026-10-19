import { useCallback, useEffect, useState, type DependencyList } from "react";

/**
 * A request is always in exactly one of three states, so we model it as one value, not three booleans:
 * `{ loading }`, `{ success, data }` or `{ error }`. TypeScript then only lets you read `data` after you checked
 * that the status is "success".
 */
export type FetchState<T> =
  | { status: "loading" }
  | { status: "success"; data: T }
  | { status: "error"; error: Error };

/**
 * Loads data when the component appears, and again whenever a value in `deps` changes.
 *
 * - `fetcher` receives an AbortSignal and should pass it to fetch, so a request we no longer need is cancelled.
 * - When `deps` change (or the component goes away), the cleanup aborts the old request and the old result is ignored,
 *   so a slow answer can never overwrite a newer one (the race condition, see /dev/race).
 * - `reload()` runs the request again.
 */
export function useFetch<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: DependencyList): FetchState<T> & { reload: () => void } {
  const [state, setState] = useState<FetchState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    // Show "loading" again, but if we are already loading return the SAME object so React skips the re-render.
    setState((current) => (current.status === "loading" ? current : { status: "loading" }));

    fetcher(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setState({ status: "success", data }); // ignore a result nobody waits for any more
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setState({ status: "error", error: error instanceof Error ? error : new Error(String(error)) });
      },
    );

    return () => controller.abort(); // runs before the next effect and when the component unmounts
    // `fetcher` is not listed on purpose: the caller says WHEN to reload through `deps`.
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  return { ...state, reload };
}
