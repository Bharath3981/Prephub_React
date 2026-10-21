import { Link } from "react-router";

/** A tag as a link to its page (/tags/<slug>): "#Fiber". Do not use it inside another link (a whole-card link), where a Badge is right. */
export function TagChip({ tag }: { tag: { name: string; slug: string } }) {
  return (
    <Link
      to={`/tags/${tag.slug}`}
      className="inline-flex items-center rounded-full border border-border bg-surface px-2.5 py-0.5 text-xs text-muted transition-colors hover:border-accent hover:text-accent"
    >
      #{tag.name}
    </Link>
  );
}
