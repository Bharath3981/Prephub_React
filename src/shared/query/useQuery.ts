import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import { queryCache, type QueryEntry } from "@/shared/query/cache";
import { hashKey } from "@/shared/query/keys";

export interface QueryOptions<T> {
  /** Names the data. Everything the request depends on goes in the key: ["category", slug]. */
  key: readonly unknown[];
  fetcher: (signal: AbortSignal) => Promise<T>;
  /** How long (ms) data counts as fresh. Fresh data is shown without a request. Default 0: always refresh when it is shown. */
  staleTime?: number;
  /** false: do not fetch (yet). */
  enabled?: boolean;
}

export type QueryResult<T> = (
  | { status: "loading"; data: undefined }
  | { status: "success"; data: T }
  | { status: "error"; data: undefined }
) & { error: Error | null; isFetching: boolean; refetch: () => void };

export function useQuery<T>({ key, fetcher, staleTime = 0, enabled = true }: QueryOptions<T>): QueryResult<T> {
  const hash = hashKey(key);

  // 1. Read the cache entry for this key. The hook re-renders this component when the entry changes.
  //    subscribe and getSnapshot are rebuilt only when the key changes, so React moves to the new key's entry.
  const subscribe = useCallback((listener: () => void) => queryCache.subscribe(hash, listener), [hash]);
  const getSnapshot = useCallback(() => queryCache.getSnapshot(hash), [hash]);
  const entry = useSyncExternalStore(subscribe, getSnapshot) as QueryEntry<T>;

  // 2. Always call the LATEST fetcher (an inline function is new on every render), without making it a dependency.
  const fetcherRef = useRef(fetcher);
  useEffect(() => {
    fetcherRef.current = fetcher;
  });

  // 3. When the key is shown (or changes), fetch if we have nothing or the data is stale. Old data stays on screen meanwhile.
  useEffect(() => {
    if (enabled && queryCache.isStale(hash, staleTime)) void queryCache.fetch(hash, (signal) => fetcherRef.current(signal));
  }, [hash, enabled, staleTime]);

  const refetch = useCallback(() => {
    void queryCache.fetch(hash, (signal) => fetcherRef.current(signal));
  }, [hash]);

  return { ...entry, refetch } as QueryResult<T>;
}
