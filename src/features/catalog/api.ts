import { api } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/parse";
import { categoriesDataSchema, categoryDetailDataSchema, type DeliveryCategory, type DeliveryCategoryDetail } from "@/features/catalog/types";

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
