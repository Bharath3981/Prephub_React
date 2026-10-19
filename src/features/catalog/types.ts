import { z } from "zod";
import { kindSchema } from "@/shared/api/schemas";

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

/** A section of a category, for example "Concepts" or "Interview Questions". */
export const sectionSchema = z.object({
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  kind: kindSchema,
  entryCount: z.number(),
});
export type DeliverySection = z.infer<typeof sectionSchema>;

/** What GET /api/v1/delivery/categories/{category} returns inside `data`: the category plus its sections. */
export const categoryDetailSchema = categorySchema.extend({ sections: z.array(sectionSchema) });
export const categoryDetailDataSchema = z.object({ category: categoryDetailSchema });
export type DeliveryCategoryDetail = z.infer<typeof categoryDetailSchema>;
