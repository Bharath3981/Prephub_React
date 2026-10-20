import type { EntrySummary } from "@/features/catalog/types";

export interface EntryGroup {
  /** Used as the HTML id, so the sidebar can link to the heading (#group-hooks). */
  id: string;
  title: string;
  entries: EntrySummary[];
}

const slugify = (text: string) => text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/** The API names groups "4. Hooks" so they sort in order; people should read "Hooks". */
export const groupTitle = (raw: string | null) => (raw ? raw.replace(/^\d+\.\s*/, "") : "Other");

/** Entries arrive sorted, so a group is a run of neighbours: keep the order of first appearance. */
export function groupEntries(entries: EntrySummary[]): EntryGroup[] {
  const groups = new Map<string, EntryGroup>();
  for (const entry of entries) {
    const title = groupTitle(entry.group);
    let group = groups.get(title);
    if (!group) {
      group = { id: `group-${slugify(title)}`, title, entries: [] };
      groups.set(title, group);
    }
    group.entries.push(entry);
  }
  return [...groups.values()];
}
