import { Link } from "react-router";
import type { EntrySummary } from "@/features/catalog/types";
import { Badge } from "@/shared/ui/Badge";
import { DifficultyBadge } from "@/shared/ui/DifficultyBadge";
import { KindBadge } from "@/shared/ui/KindBadge";
import { useRenderCount } from "@/shared/dev/render-count";

/** One entry in a list: title, summary, kind, difficulty and tags. The whole row is one link to the entry page (module M3). */
export function EntryRow({ entry }: { entry: EntrySummary }) {
  useRenderCount("EntryRow");
  return (
    <li>
      <Link
        to={`/${entry.categorySlug}/${entry.sectionSlug}/${entry.slug}`}
        className="block space-y-2 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-accent"
      >
        <div className="flex flex-wrap items-center gap-2">
          <KindBadge kind={entry.kind} />
          {entry.difficulty && <DifficultyBadge difficulty={entry.difficulty} />}
        </div>
        <h3 className="font-semibold">{entry.title}</h3>
        {entry.summary && <p className="line-clamp-2 text-sm text-muted">{entry.summary}</p>}
        {entry.tags.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Tags">
            {entry.tags.map((tag) => (
              <li key={tag.slug}>
                <Badge>{tag.name}</Badge>
              </li>
            ))}
          </ul>
        )}
      </Link>
    </li>
  );
}
