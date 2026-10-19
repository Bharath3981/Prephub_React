/**
 * The query cache: server data kept by key, outside React, so many components and many pages can share it.
 * It is the same idea as the theme store: a snapshot per key, a list of listeners, and a new snapshot object
 * whenever something changes, so useSyncExternalStore (see useQuery.ts) can tell that it changed.
 */

/** What a component can see about one query. */
export interface QueryEntry<T = unknown> {
  /** "loading": no data yet. "success": we have data (maybe old). "error": the request failed and we have no data. */
  status: "loading" | "success" | "error";
  data: T | undefined;
  /** The error of the LAST request. With old data on screen it can be set while status is still "success". */
  error: Error | null;
  /** A request is running right now (the first one, or a refresh in the background). */
  isFetching: boolean;
  /** When the data last arrived (milliseconds since 1970). 0 means never. */
  updatedAt: number;
}

interface QueryRecord {
  snapshot: QueryEntry;
  listeners: Set<() => void>;
  /** The request in flight, if any. A second caller joins it instead of sending another one. */
  inFlight: Promise<void> | null;
  controller: AbortController | null;
}

/** One shared object for "nothing known about this key yet": the same reference every time, as getSnapshot requires. */
const INITIAL: QueryEntry = { status: "loading", data: undefined, error: null, isFetching: false, updatedAt: 0 };

class QueryCache {
  private records = new Map<string, QueryRecord>();

  private ensure(hash: string): QueryRecord {
    let record = this.records.get(hash);
    if (!record) {
      record = { snapshot: INITIAL, listeners: new Set(), inFlight: null, controller: null };
      this.records.set(hash, record);
    }
    return record;
  }

  /** Replace the snapshot with a NEW object and tell everyone who listens to this key. */
  private update(record: QueryRecord, patch: Partial<QueryEntry>) {
    record.snapshot = { ...record.snapshot, ...patch };
    record.listeners.forEach((listener) => listener());
  }

  // ---- the two functions useSyncExternalStore needs, per key ----
  getSnapshot(hash: string): QueryEntry {
    return this.records.get(hash)?.snapshot ?? INITIAL;
  }
  subscribe(hash: string, listener: () => void): () => void {
    const record = this.ensure(hash);
    record.listeners.add(listener);
    return () => {
      record.listeners.delete(listener);
    };
  }

  /** True if there is no data yet, or the data is older than `staleTime` milliseconds. */
  isStale(hash: string, staleTime: number): boolean {
    const record = this.records.get(hash);
    if (!record || record.snapshot.updatedAt === 0) return true;
    return Date.now() - record.snapshot.updatedAt >= staleTime;
  }

  /**
   * Run the request for this key and put the result in the cache.
   * If one is already running for the same key, return that one (de-duplication): ten components asking at once send one request.
   */
  fetch<T>(hash: string, fetcher: (signal: AbortSignal) => Promise<T>): Promise<void> {
    const record = this.ensure(hash);
    if (record.inFlight) return record.inFlight;

    const controller = new AbortController();
    record.controller = controller;
    this.update(record, { isFetching: true });

    const done: Promise<void> = fetcher(controller.signal)
      .then(
        (data) => this.update(record, { status: "success", data, error: null, isFetching: false, updatedAt: Date.now() }),
        (error: unknown) => {
          const failure = error instanceof Error ? error : new Error(String(error));
          // Keep old data on screen if we have it: a failed refresh should not blank the page.
          this.update(record, { status: record.snapshot.data === undefined ? "error" : "success", error: failure, isFetching: false });
        },
      )
      .finally(() => {
        if (record.inFlight === done) record.inFlight = null;
      });
    record.inFlight = done;
    return done;
  }

  /** For learning in the browser console: window.__queryCache.debug() */
  debug() {
    return [...this.records.entries()].map(([key, record]) => ({
      key,
      status: record.snapshot.status,
      isFetching: record.snapshot.isFetching,
      ageSeconds: record.snapshot.updatedAt ? Math.round((Date.now() - record.snapshot.updatedAt) / 1000) : null,
      subscribers: record.listeners.size,
    }));
  }
}

export const queryCache = new QueryCache();

if (import.meta.env.DEV) (window as unknown as { __queryCache?: QueryCache }).__queryCache = queryCache;
