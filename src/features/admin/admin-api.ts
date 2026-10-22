import type { ZodType } from "zod";
import { api } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/parse";

/**
 * Small helpers for the Management API (/management/...). Every call checks the answer with a zod schema,
 * like the public API calls do, and goes through the api client (so an expired access token is refreshed silently).
 */
type Query = Record<string, string | number | boolean | null | undefined>;

export async function mget<T>(schema: ZodType<T>, path: string, query?: Query, signal?: AbortSignal): Promise<T> {
  const response = await api<unknown>(`/management${path}`, { query, signal });
  return parseResponse(schema, response.data);
}

/** Same, but also returns `meta` (page numbers, or the cursor of the audit log). */
export async function mgetWithMeta<T, M>(schema: ZodType<T>, metaSchema: ZodType<M>, path: string, query?: Query, signal?: AbortSignal): Promise<{ data: T; meta: M }> {
  const response = await api<unknown>(`/management${path}`, { query, signal });
  return { data: parseResponse(schema, response.data), meta: parseResponse(metaSchema, response.meta) };
}

export async function msend<T>(schema: ZodType<T> | null, method: "POST" | "PATCH" | "DELETE", path: string, body?: unknown, query?: Query): Promise<T> {
  const response = await api<unknown>(`/management${path}`, { method, body, query });
  return schema ? parseResponse(schema, response.data) : (undefined as T);
}
