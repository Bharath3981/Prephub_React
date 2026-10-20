import { ApiRequestError } from "@/shared/api/client";
import type { FetchState } from "@/shared/hooks/useFetch";

/** The API answered 404 (an unknown topic, section or entry): show the not-found page, not a generic error with "Try again". */
export const isNotFound = (state: FetchState<unknown>) => state.status === "error" && state.error instanceof ApiRequestError && state.error.status === 404;
