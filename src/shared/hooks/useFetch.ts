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

const LOADING = { status: "loading" } as const;

const sameDeps = (a: DependencyList, b: DependencyList) => a.length === b.length && a.every((value, i) => Object.is(value, b[i]));

/**
 * Loads data when the component appears, and again whenever a value in `deps` changes.
 *
 * - `fetcher` receives an AbortSignal and should pass it to fetch, so a request we no longer need is cancelled.
 * - When `deps` change (or the component goes away), the cleanup aborts the old request and the old result is ignored,
 *   so a slow answer can never overwrite a newer one (the race condition, see /dev/race).
 * - The result is stored together with the `deps` it was fetched for. In the one render right after `deps` change, the
 *   stored result belongs to the OLD deps, so it is reported as "loading", never as the old data under the new inputs.
 * - `reload()` runs the request again.
 */
export function useFetch<T>(fetcher: (signal: AbortSignal) => Promise<T>, deps: DependencyList): FetchState<T> & { reload: () => void } {
  const [stored, setStored] = useState<{ state: FetchState<T>; deps: DependencyList }>({ state: LOADING, deps });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    const controller = new AbortController();

    // Show "loading" again, but if we are already loading return the SAME object so React skips the re-render.
    setStored((current) => (current.state.status === "loading" && sameDeps(current.deps, deps) ? current : { state: LOADING, deps }));

    fetcher(controller.signal).then(
      (data) => {
        if (!controller.signal.aborted) setStored({ state: { status: "success", data }, deps }); // ignore a result nobody waits for any more
      },
      (error: unknown) => {
        if (!controller.signal.aborted) setStored({ state: { status: "error", error: error instanceof Error ? error : new Error(String(error)) }, deps });
      },
    );

    return () => controller.abort(); // runs before the next effect and when the component unmounts
    // `fetcher` is not listed on purpose: the caller says WHEN to reload through `deps`.
  }, [...deps, attempt]);

  const reload = useCallback(() => setAttempt((n) => n + 1), []);
  const state = sameDeps(stored.deps, deps) ? stored.state : LOADING;
  return { ...state, reload };
}
