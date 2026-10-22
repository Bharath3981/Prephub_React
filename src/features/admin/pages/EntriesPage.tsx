import { useCallback, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { mgetWithMeta, mget, msend } from "@/features/admin/admin-api";
import { useCan } from "@/features/admin/auth/AuthProvider";
import { categoryData, entriesData, pageMetaSchema, sectionData, type AdminEntryItem } from "@/features/admin/schemas";
import { Empty, MoveButtons, Notice, PageHeader, StatusBadge, Table, TableSkeleton, moved, td } from "@/features/admin/ui";
import { useAction } from "@/shared/hooks/useAction";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useFetch } from "@/shared/hooks/useFetch";
import { fieldErrors } from "@/shared/lib/field-errors";
import { buttonClass, Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { ErrorState } from "@/shared/ui/ErrorState";
import { IconButton, IconLink } from "@/shared/ui/IconButton";
import { Pagination } from "@/shared/ui/Pagination";

const LIMIT = 100;

/** /admin/sections/:sectionId/entries: the entries of one section, with publish, delete and (when nothing is filtered) reorder. */
export function EntriesPage() {
  const sectionId = useParams().sectionId ?? "";
  const can = useCan();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const status = params.get("status") === "DRAFT" || params.get("status") === "PUBLISHED" ? (params.get("status") as "DRAFT" | "PUBLISHED") : undefined;

  const section = useFetch((signal) => mget(sectionData, `/sections/${sectionId}`, undefined, signal), [sectionId]);
  const categoryId = section.status === "success" ? section.data.section.categoryId : null;
  const category = useFetch((signal) => (categoryId ? mget(categoryData, `/categories/${categoryId}`, undefined, signal) : Promise.resolve(null)), [categoryId]);
  const list = useFetch((signal) => mgetWithMeta(entriesData, pageMetaSchema, `/sections/${sectionId}/entries`, { page, limit: LIMIT, status }, signal), [sectionId, page, status]);

  const [deleting, setDeleting] = useState<AdminEntryItem | null>(null);
  const sectionName = section.status === "success" ? section.data.section.name : "...";
  const topicName = category.status === "success" && category.data ? category.data.category.name : "Topic";
  useDocumentTitle(`${sectionName} · Entries · Admin`);

  const publish = useAction(async (entry: AdminEntryItem) => {
    await msend(null, "POST", `/entries/${entry.id}/${entry.status === "PUBLISHED" ? "unpublish" : "publish"}`);
    list.reload();
  });
  const reorder = useAction(async (ids: string[]) => {
    await msend(null, "POST", `/sections/${sectionId}/entries/reorder`, { ids });
    list.reload();
  });

  const entries = list.status === "success" ? list.data.data.entries : [];
  const meta = list.status === "success" ? list.data.meta : null;
  // The API wants EVERY id of the section for a reorder, so it is offered only when this screen shows them all.
  const canReorder = can("entry.edit") && !status && meta !== null && meta.totalPages <= 1;
  const move = (from: number, to: number) => void reorder.run(moved(entries, from, to).map((entry) => entry.id));
  const pageLink = useCallback((next: number) => ({ search: `?${new URLSearchParams({ ...(status && { status }), page: String(next) })}` }), [status]);

  return (
    <div>
      <PageHeader
        title={`${sectionName}: entries`}
        crumbs={[{ label: "Topics", to: "/admin/categories" }, { label: topicName, to: categoryId ? `/admin/categories/${categoryId}/sections` : undefined }, { label: sectionName }]}
        action={can("entry.create") && <Link to={`/admin/sections/${sectionId}/entries/new`} className={buttonClass()}>New entry</Link>}
      />
      <div className="mb-4 flex items-center gap-2 text-sm" role="group" aria-label="Status filter">
        {([undefined, "DRAFT", "PUBLISHED"] as const).map((value) => (
          <Button key={value ?? "all"} size="sm" variant={status === value ? "primary" : "secondary"} aria-pressed={status === value} onClick={() => setParams(value ? { status: value } : {}, { replace: true })}>
            {value ? value.toLowerCase() : "All"}
          </Button>
        ))}
      </div>
      {(publish.error || reorder.error) && <Notice>{fieldErrors(publish.error ?? reorder.error).general ?? "That did not work"}</Notice>}
      {section.status === "error" && <ErrorState title="Could not load the section" error={section.error} onRetry={section.reload} />}
      {list.status === "loading" && <TableSkeleton />}
      {list.status === "error" && <ErrorState title="Could not load the entries" error={list.error} onRetry={list.reload} />}
      {list.status === "success" &&
        (entries.length === 0 ? (
          <Empty>No entries here{status ? ` with status ${status.toLowerCase()}` : ""}.</Empty>
        ) : (
          <Table head={["Order", "Title", "Difficulty", "Tags", "Status", ""]} caption="Entries">
            {entries.map((entry, index) => (
              <tr key={entry.id}>
                <td className={td}>{canReorder && <MoveButtons index={index} count={entries.length} disabled={reorder.pending} onMove={move} label={entry.title} />}</td>
                <td className={`${td} max-w-md font-medium`}>
                  <Link to={`/admin/entries/${entry.id}`} className="text-accent hover:underline">
                    {entry.title}
                  </Link>
                </td>
                <td className={td}>{entry.difficulty?.toLowerCase() ?? "-"}</td>
                <td className={`${td} max-w-48 truncate text-muted`}>{entry.tags.map((tag) => tag.name).join(", ")}</td>
                <td className={td}>
                  <StatusBadge status={entry.status} />
                </td>
                <td className={`${td} whitespace-nowrap text-right`}>
                  <IconLink icon="pencil" label={`Edit ${entry.title}`} to={`/admin/entries/${entry.id}`} />
                  {can("entry.publish") && (
                    <IconButton
                      icon={entry.status === "PUBLISHED" ? "eye-off" : "eye"}
                      label={`${entry.status === "PUBLISHED" ? "Unpublish" : "Publish"} ${entry.title}`}
                      disabled={publish.pending}
                      onClick={() => void publish.run(entry)}
                    />
                  )}
                  {can("entry.delete") && (
                    <IconButton icon="trash" tone="danger" label={`Delete ${entry.title}`} onClick={() => setDeleting(entry)} />
                  )}
                </td>
              </tr>
            ))}
          </Table>
        ))}
      {meta && meta.totalPages > 1 && (
        <div className="mt-4">
          <Pagination page={meta.page} totalPages={meta.totalPages} to={pageLink} />
        </div>
      )}
      {meta && <p className="mt-3 text-xs text-muted">{meta.total} entries in this section{canReorder ? "" : status ? " (clear the filter to reorder)" : ""}.</p>}
      {deleting && (
        <ConfirmDialog
          title={`Delete "${deleting.title}"?`}
          confirmLabel="Delete"
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await msend(null, "DELETE", `/entries/${deleting.id}`);
            list.reload();
          }}
        >
          <p>This cannot be undone. It disappears from the public site.</p>
        </ConfirmDialog>
      )}
    </div>
  );
}
