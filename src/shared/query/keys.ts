/**
 * Turns a query key (an array) into a string, because a Map needs a simple key.
 * The same key must always give the same string, so the properties of any object inside are sorted:
 * ["entries", { page: 1, tag: "x" }] and ["entries", { tag: "x", page: 1 }] are the SAME query.
 */
export const hashKey = (key: readonly unknown[]): string =>
  JSON.stringify(key, (_name, value) =>
    value && typeof value === "object" && !Array.isArray(value)
      ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)))
      : value,
  );
