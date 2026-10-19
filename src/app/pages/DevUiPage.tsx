import { Link } from "react-router";
import { Badge } from "@/shared/ui/Badge";
import { Button, buttonClass } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";

/** Development only (/dev/ui): the building blocks from M0 on one page. */
export function DevUiPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">UI components</h1>

      <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-2">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button size="sm">Small</Button>
          <Button disabled>Disabled</Button>
          <Link to="/questions" className={buttonClass("secondary")}>
            A link that looks like a button
          </Link>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold">Badges</h2>
        <div className="flex flex-wrap gap-2">
          <Badge>Neutral</Badge>
          <Badge tone="accent">Accent</Badge>
          <Badge tone="success">Success</Badge>
          <Badge tone="warning">Warning</Badge>
          <Badge tone="danger">Danger</Badge>
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-surface p-5">
        <h2 className="font-semibold">Loading placeholder</h2>
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
        <Skeleton className="h-24 w-full" />
      </section>
    </div>
  );
}
