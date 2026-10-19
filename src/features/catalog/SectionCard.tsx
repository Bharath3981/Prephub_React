import { Link } from "react-router";
import type { DeliverySection } from "@/features/catalog/types";
import { Badge } from "@/shared/ui/Badge";
import { KindBadge } from "@/shared/ui/KindBadge";

export function SectionCard({ categorySlug, section }: { categorySlug: string; section: DeliverySection }) {
  const entries = section.entryCount === 1 ? "1 entry" : `${section.entryCount} entries`;
  return (
    <li>
      <Link
        to={`/${categorySlug}/${section.slug}`}
        className="flex h-full flex-col gap-2 rounded-xl border border-border bg-surface p-5 transition-colors hover:border-accent"
      >
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold">{section.name}</h3>
          <KindBadge kind={section.kind} />
        </div>
        {section.description && <p className="line-clamp-3 text-sm text-muted">{section.description}</p>}
        <Badge className="mt-auto self-start">{entries}</Badge>
      </Link>
    </li>
  );
}
