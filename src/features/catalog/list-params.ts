import { useSearchParams, type To } from "react-router";
import { difficultySchema, type Difficulty } from "@/features/catalog/types";

export const PAGE_SIZE = 20;

/** The list's filters and page. They live in the URL (?page=2&difficulty=HARD&search=fiber), so a link or a refresh gives the same list. */
export interface ListParams {
  page: number;
  difficulty: Difficulty | undefined;
  search: string;
}

/** Read the three values and repair anything odd: the URL is typed by people, and the API would answer 400 for ?page=0 or ?difficulty=x. */
function readParams(searchParams: URLSearchParams): ListParams {
  const page = Number(searchParams.get("page"));
  const difficulty = difficultySchema.safeParse(searchParams.get("difficulty"));
  return {
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    difficulty: difficulty.success ? difficulty.data : undefined,
    search: (searchParams.get("search") ?? "").slice(0, 100),
  };
}

/** A new query string from the current params and a change. A filter change goes back to page 1 unless the change names a page. */
function buildSearch(current: ListParams, patch: Partial<ListParams>): string {
  const next = { ...current, ...patch };
  if (!("page" in patch)) next.page = 1;
  const params = new URLSearchParams();
  if (next.page > 1) params.set("page", String(next.page));
  if (next.difficulty) params.set("difficulty", next.difficulty);
  if (next.search.trim()) params.set("search", next.search.trim());
  const text = params.toString();
  return text ? `?${text}` : "";
}

export function useListParams() {
  const [searchParams, setSearchParams] = useSearchParams();
  const params = readParams(searchParams);

  return {
    ...params,
    /** Where a link goes after this change (for pagination links and "clear filters"). */
    to: (patch: Partial<ListParams>): To => ({ search: buildSearch(params, patch) }),
    /** Apply a change now. `replace` rewrites the current history entry (use it while typing, so Back is not full of half-typed searches). */
    change: (patch: Partial<ListParams>, options?: { replace?: boolean }) => setSearchParams(buildSearch(params, patch), options),
  };
}
