import { api } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/parse";
import { categoriesDataSchema, type DeliveryCategory } from "@/features/catalog/types";

/** All visible categories. Pass a signal so the request can be cancelled (see useFetch). */
export async function getCategories(signal?: AbortSignal): Promise<DeliveryCategory[]> {
  const response = await api<unknown>("/delivery/categories", { signal });
  return parseResponse(categoriesDataSchema, response.data).categories;
}
