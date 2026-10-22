import { ApiRequestError } from "@/shared/api/client";

/**
 * The API answers a bad form with VALIDATION_ERROR and details like [{ path: "body.name", message: "..." }].
 * This turns them into { name: "..." } so each message can sit under its own field.
 * Messages without a field (and every other kind of error) come back in `general`.
 */
export function fieldErrors(error: Error | null): { fields: Record<string, string>; general: string | null } {
  if (!error) return { fields: {}, general: null };
  const fields: Record<string, string> = {};
  if (error instanceof ApiRequestError && Array.isArray(error.details)) {
    for (const item of error.details as { path?: unknown; message?: unknown }[]) {
      if (typeof item?.path === "string" && typeof item.message === "string") {
        const field = item.path.replace(/^(body|query|params)\./, "");
        fields[field] ??= item.message;
      }
    }
  }
  if (Object.keys(fields).length > 0) return { fields, general: null };
  const network = error instanceof ApiRequestError && error.code === "NETWORK";
  return { fields, general: network ? "The server cannot be reached." : error.message };
}
