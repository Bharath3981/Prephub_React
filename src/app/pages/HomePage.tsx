import { Link } from "react-router";
import { useRenderCount } from "@/shared/dev/render-count";
import { Badge } from "@/shared/ui/Badge";
import { Button, buttonClass } from "@/shared/ui/Button";
import { Skeleton } from "@/shared/ui/Skeleton";

/** A temporary home page for M0: it shows the building blocks. Module M1 replaces it with the real category list. */
export function HomePage() {
  useRenderCount("HomePage");
  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-3xl font-bold tracking-tight">PrepHub React</h1>
        <p className="mt-2 max-w-2xl text-muted">
          The React version of PrepHub, built module by module. This is the foundation (M0): the app shell, the router, the theme and a few
          basic components. The real pages come next.
        </p>
      </section>

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

      {import.meta.env.DEV && (
        <p className="text-sm text-muted">
          Development tools: <Link className="underline" to="/dev/boom">trigger an error</Link>, and read <code>window.__renders</code> in the console for render counts.
        </p>
      )}
    </div>
  );
}
