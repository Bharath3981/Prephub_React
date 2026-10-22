import type { ReactNode } from "react";
import { Link } from "react-router";
import { cn } from "@/shared/lib/cn";
import { Badge } from "@/shared/ui/Badge";
import { Breadcrumbs } from "@/shared/ui/Breadcrumbs";
import { IconButton } from "@/shared/ui/IconButton";
import { Skeleton } from "@/shared/ui/Skeleton";

export function PageHeader({ title, description, crumbs, action }: { title: string; description?: string; crumbs?: { label: string; to?: string }[]; action?: ReactNode }) {
  return (
    <header className="mb-6 space-y-2">
      {crumbs && <Breadcrumbs items={[{ label: "Admin", to: "/admin" }, ...crumbs]} />}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        {action}
      </div>
      {description && <p className="max-w-2xl text-sm text-muted">{description}</p>}
    </header>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === "PUBLISHED" || status === "ACTIVE" || status === "SUCCESS" ? "success" : status === "DISABLED" || status === "FAILURE" ? "danger" : "warning";
  return <Badge tone={tone}>{status.toLowerCase()}</Badge>;
}

/** A table that scrolls sideways on a phone instead of breaking the page. */
export function Table({ head, children, caption }: { head: string[]; children: ReactNode; caption: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-surface">
      <table className="w-full text-left text-sm">
        <caption className="sr-only">{caption}</caption>
        <thead className="border-b border-border bg-surface-2 text-xs uppercase tracking-wide text-muted">
          <tr>
            {head.map((label) => (
              <th key={label} scope="col" className="px-2.5 py-2 font-medium">
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">{children}</tbody>
      </table>
    </div>
  );
}
export const td = "px-2.5 py-2 align-middle";

export function TableSkeleton() {
  return (
    <div role="status" aria-busy="true" className="space-y-2">
      <span className="sr-only">Loading...</span>
      {[0, 1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-10 w-full" />
      ))}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">{children}</p>;
}

/** Move up / move down for a row. The parent decides what "moving" means (it sends the new order to the API). */
export function MoveButtons({ index, count, disabled, onMove, label }: { index: number; count: number; disabled?: boolean; onMove: (from: number, to: number) => void; label: string }) {
  return (
    <span className="inline-flex gap-1">
      <IconButton icon="up" label={`Move ${label} up`} disabled={disabled || index === 0} onClick={() => onMove(index, index - 1)} />
      <IconButton icon="down" label={`Move ${label} down`} disabled={disabled || index === count - 1} onClick={() => onMove(index, index + 1)} />
    </span>
  );
}

export const moved = <T,>(items: T[], from: number, to: number): T[] => {
  const copy = [...items];
  copy.splice(to, 0, copy.splice(from, 1)[0]);
  return copy;
};

export function RowLink({ to, children, className }: { to: string; children: ReactNode; className?: string }) {
  return (
    <Link to={to} className={cn("font-medium text-accent hover:underline", className)}>
      {children}
    </Link>
  );
}

/** The red box for an error of a whole screen action (not a field). */
export function Notice({ tone = "danger", children }: { tone?: "danger" | "success"; children: ReactNode }) {
  return (
    <p role={tone === "danger" ? "alert" : "status"} className={cn("rounded-lg px-3 py-2 text-sm", tone === "danger" ? "bg-danger-soft text-danger" : "bg-success-soft text-success")}>
      {children}
    </p>
  );
}
