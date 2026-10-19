import { z } from "zod";

/**
 * What GET /api/v1/delivery/categories returns inside `data`. The schema is the single source of truth:
 * the TypeScript type is derived from it, so the check at run time and the type at compile time cannot disagree.
 * (Zod ignores fields we did not list, such as a future `icon`.)
 */
export const categorySchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  sectionCount: z.number(),
});

export const categoriesDataSchema = z.object({
  categories: z.array(categorySchema),
});

export type DeliveryCategory = z.infer<typeof categorySchema>;
