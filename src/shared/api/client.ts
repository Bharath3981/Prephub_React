/**
 * The API client. Every call goes to /api/v1 on the same origin (the Vite dev server proxies it to the Express API),
 * so the httpOnly auth cookies travel with the request.
 *
 * The API always answers with an envelope:
 *   success: { success: true, data, meta? }
 *   failure: { success: false, error: { code, message, details?, requestId? } }
 */
export interface ApiSuccess<T, M = unknown> {
  success: true;
  data: T;
  meta?: M;
}

/** A failed call. status 0 means the server could not be reached at all. */
export class ApiRequestError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly requestId?: string,
  ) {
    super(message);
    this.name = "ApiRequestError";
  }
}

const BASE = "/api/v1";

type Query = Record<string, string | number | boolean | null | undefined>;
interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  query?: Query;
  /** Pass an AbortSignal to cancel the request (the promise then rejects with an AbortError). */
  signal?: AbortSignal;
}

/** ?a=1&b=2 from an object, skipping empty values. */
function toQueryString(query?: Query): string {
  if (!query) return "";
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }
  const text = params.toString();
  return text ? `?${text}` : "";
}

async function send<T, M>(path: string, { method = "GET", body, query, signal }: RequestOptions): Promise<ApiSuccess<T, M>> {
  let res: Response;
  try {
    res = await fetch(BASE + path + toQueryString(query), {
      method,
      signal,
      credentials: "include",
      headers: { accept: "application/json", ...(body !== undefined && { "content-type": "application/json" }) },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") throw err; // a cancelled request is not a failure
    throw new ApiRequestError(0, "NETWORK", "Cannot reach the server");
  }

  const text = await res.text();
  let json: unknown;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined; // not JSON (for example a proxy error page)
  }

  if (!res.ok) {
    const error = (json as { error?: { code?: string; message?: string; details?: unknown; requestId?: string } } | undefined)?.error;
    throw new ApiRequestError(res.status, error?.code ?? "UNKNOWN", error?.message ?? (res.statusText || "Request failed"), error?.details, error?.requestId);
  }
  return json as ApiSuccess<T, M>;
}

// ---------------------------------------------------------------------------------------------
// Silent refresh. The access token (httpOnly cookie) lives for minutes. When it has expired the API answers 401; we
// ask POST /auth/refresh for a new one (the browser sends the refresh cookie by itself) and repeat the request once.
// ---------------------------------------------------------------------------------------------

/** The refresh that is running right now. Five requests failing together share ONE refresh instead of sending five. */
let refreshing: Promise<boolean> | null = null;

function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${BASE}/auth/refresh`, { method: "POST", credentials: "include", headers: { accept: "application/json" } })
    .then((res) => res.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

/** Called when the session could not be renewed, so the app can forget the user and show the login page. */
let onSessionExpired: (() => void) | undefined;
export function setSessionExpiredHandler(handler: (() => void) | undefined) {
  onSessionExpired = handler;
}

/** These answer 401 for a normal reason (wrong password, no cookie), so a refresh would not help. */
const NO_REFRESH = ["/auth/login", "/auth/refresh", "/auth/logout"];

export async function api<T, M = unknown>(path: string, options: RequestOptions = {}): Promise<ApiSuccess<T, M>> {
  try {
    return await send<T, M>(path, options);
  } catch (error) {
    if (!(error instanceof ApiRequestError) || error.status !== 401 || NO_REFRESH.includes(path)) throw error;
    if (await refreshSession()) return send<T, M>(path, options); // second try; a second 401 is final
    onSessionExpired?.();
    throw error;
  }
}
