import { z } from "zod";

/** Pieces of the API's data that more than one feature uses (the category page, the section page, the entry page). */
export const kindSchema = z.enum(["CONCEPT", "QUESTION", "EXAMPLE"]);
export type Kind = z.infer<typeof kindSchema>;
