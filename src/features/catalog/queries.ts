import { getCategories, getCategory } from "@/features/catalog/api";
import type { DeliveryCategory, DeliveryCategoryDetail } from "@/features/catalog/types";
import type { QueryOptions } from "@/shared/query/useQuery";

/**
 * The key and the fetcher of each query, written ONCE. Pages call useQuery(categoryQuery(slug)); later steps use the same
 * function to prefetch on hover and to invalidate, so the key can never be typed differently in two places.
 */
const ONE_MINUTE = 60_000;

export const categoriesQuery = (): QueryOptions<DeliveryCategory[]> => ({
  key: ["categories"],
  fetcher: (signal) => getCategories(signal),
  staleTime: ONE_MINUTE,
});

export const categoryQuery = (slug: string): QueryOptions<DeliveryCategoryDetail> => ({
  key: ["category", slug],
  fetcher: (signal) => getCategory(slug, signal),
  staleTime: ONE_MINUTE,
});
