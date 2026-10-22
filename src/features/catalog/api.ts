import { api } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/parse";
import {
  categoriesDataSchema,
  categoryDetailDataSchema,
  entriesDataSchema,
  entryDataSchema,
  tagDetailDataSchema,
  tagsDataSchema,
  pageMetaSchema,
  searchDataSchema,
  type DeliveryCategory,
  type DeliveryCategoryDetail,
  type Difficulty,
  type EntriesPage,
  type EntryDetail,
  type TagEntries,
  type TagsPage,
} from "@/features/catalog/types";

/** All visible categories. Pass a signal so the request can be cancelled (see useFetch). */
export async function getCategories(signal?: AbortSignal): Promise<DeliveryCategory[]> {
  const response = await api<unknown>("/delivery/categories", { signal });
  return parseResponse(categoriesDataSchema, response.data).categories;
}

/** One category with its sections. An unknown slug makes the API answer 404, which arrives as an ApiRequestError with status 404. */
export async function getCategory(slug: string, signal?: AbortSignal): Promise<DeliveryCategoryDetail> {
  const response = await api<unknown>(`/delivery/categories/${encodeURIComponent(slug)}`, { signal });
  return parseResponse(categoryDetailDataSchema, response.data).category;
}

export interface EntriesQuery {
  page?: number;
  /** 1 to 100. */
  limit?: number;
  difficulty?: Difficulty;
  search?: string;
}

/** The entries of one section (published ones only), one page at a time. Empty values are left out of the URL. */
export async function getEntries(categorySlug: string, sectionSlug: string, query: EntriesQuery = {}, signal?: AbortSignal): Promise<EntriesPage> {
  const path = `/delivery/categories/${encodeURIComponent(categorySlug)}/sections/${encodeURIComponent(sectionSlug)}/entries`;
  const response = await api<unknown>(path, { query: { ...query }, signal });
  return { entries: parseResponse(entriesDataSchema, response.data).entries, meta: parseResponse(pageMetaSchema, response.meta) };
}

/** One entry in full. An unknown slug makes the API answer 404 (an ApiRequestError with status 404). */
export async function getEntry(categorySlug: string, sectionSlug: string, entrySlug: string, signal?: AbortSignal): Promise<EntryDetail> {
  const path = `/delivery/categories/${encodeURIComponent(categorySlug)}/sections/${encodeURIComponent(sectionSlug)}/entries/${encodeURIComponent(entrySlug)}`;
  const response = await api<unknown>(path, { signal });
  return parseResponse(entryDataSchema, response.data).entry;
}

export interface QuestionsQuery extends EntriesQuery {
  /** Only questions from this topic (a category slug). */
  category?: string;
  /** Only questions with this tag (a tag slug). */
  tag?: string;
}

/** Questions from ALL topics, one page at a time, with optional filters. Same row shape as a section's entries. */
export async function getQuestions(query: QuestionsQuery = {}, signal?: AbortSignal): Promise<EntriesPage> {
  const response = await api<unknown>("/delivery/questions", { query: { ...query }, signal });
  return { entries: parseResponse(entriesDataSchema, response.data).entries, meta: parseResponse(pageMetaSchema, response.meta) };
}

/** All tags, most used first, one page at a time (at most 100 per page). */
export async function getTags(query: { page?: number; limit?: number } = {}, signal?: AbortSignal): Promise<TagsPage> {
  const response = await api<unknown>("/delivery/tags", { query: { ...query }, signal });
  return { tags: parseResponse(tagsDataSchema, response.data).tags, meta: parseResponse(pageMetaSchema, response.meta) };
}

/** One tag and one page of its entries. An unknown tag makes the API answer 404. */
export async function getTag(slug: string, query: { page?: number; limit?: number } = {}, signal?: AbortSignal): Promise<TagEntries> {
  const response = await api<unknown>(`/delivery/tags/${encodeURIComponent(slug)}`, { query: { ...query }, signal });
  const data = parseResponse(tagDetailDataSchema, response.data);
  return { tag: data.tag, entries: { entries: data.entries, meta: parseResponse(pageMetaSchema, response.meta) } };
}

/** The shortest search text the API accepts. */
export const MIN_SEARCH_LENGTH = 2;

/** Full-text search over published entries, best match first. The API has no topic or difficulty filter here. Supports "quoted phrases", OR and -excluded. `q` must have at least MIN_SEARCH_LENGTH characters. */
export async function searchEntries(query: { q: string; page?: number; limit?: number }, signal?: AbortSignal): Promise<EntriesPage> {
  const response = await api<unknown>("/delivery/search", { query: { ...query }, signal });
  return { entries: parseResponse(searchDataSchema, response.data).results, meta: parseResponse(pageMetaSchema, response.meta) };
}
