import { api } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/parse";
import {
  categoriesDataSchema,
  categoryDetailDataSchema,
  entriesDataSchema,
  pageMetaSchema,
  type DeliveryCategory,
  type DeliveryCategoryDetail,
  type EntriesPage,
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

/** The entries of one section (published ones only). limit is at most 100; filters and pages come in step 2.5. */
export async function getEntries(categorySlug: string, sectionSlug: string, query: { page?: number; limit?: number } = {}, signal?: AbortSignal): Promise<EntriesPage> {
  const path = `/delivery/categories/${encodeURIComponent(categorySlug)}/sections/${encodeURIComponent(sectionSlug)}/entries`;
  const response = await api<unknown>(path, { query, signal });
  return { entries: parseResponse(entriesDataSchema, response.data).entries, meta: parseResponse(pageMetaSchema, response.meta) };
}
