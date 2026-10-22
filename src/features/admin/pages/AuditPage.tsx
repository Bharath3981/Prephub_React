import { useEffect, useRef, useState } from "react";
import { mget, mgetWithMeta } from "@/features/admin/admin-api";
import { auditActionsData, auditData, auditDetailData, auditMeta, type AuditItem } from "@/features/admin/schemas";
import { Empty, PageHeader, StatusBadge, Table, TableSkeleton, td } from "@/features/admin/ui";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useFetch } from "@/shared/hooks/useFetch";
import { Button } from "@/shared/ui/Button";
import { ErrorState } from "@/shared/ui/ErrorState";
import { SelectField, TextField } from "@/shared/ui/Field";
import { IconButton } from "@/shared/ui/IconButton";
import { Modal } from "@/shared/ui/Modal";

interface Filters {
  action: string;
  outcome: string;
  actor: string;
}
const NO_FILTERS: Filters = { action: "", outcome: "", actor: "" };

/** /admin/audit: the append-only log of who did what, newest first. Filters on the left, "Load more" follows the API's cursor. */
export function AuditPage() {
  useDocumentTitle("Audit log · Admin");
  const actions = useFetch((signal) => mget(auditActionsData, "/audit-logs/actions", undefined, signal), []);
  const [draft, setDraft] = useState(NO_FILTERS);
  const [applied, setApplied] = useState(NO_FILTERS);

  return (
    <div>
      <PageHeader title="Audit log" crumbs={[{ label: "Audit log" }]} description="Every change and sign-in, newest first. The log can only grow." />
      <form
        className="mb-4 flex flex-wrap items-end gap-3"
        onSubmit={(event) => {
          event.preventDefault();
          setApplied({ ...draft, actor: draft.actor.trim() });
        }}
      >
        <SelectField label="Action" className="w-full sm:w-64" value={draft.action} onChange={(event) => setDraft({ ...draft, action: event.target.value })}>
          <option value="">All actions</option>
          {actions.status === "success" &&
            actions.data.actions.map((item) => (
              <option key={item.action} value={item.action}>
                {item.action} ({item.count})
              </option>
            ))}
        </SelectField>
        <SelectField label="Result" className="w-full sm:w-36" value={draft.outcome} onChange={(event) => setDraft({ ...draft, outcome: event.target.value })}>
          <option value="">Any</option>
          <option value="SUCCESS">Success</option>
          <option value="FAILURE">Failure</option>
        </SelectField>
        <TextField label="Who" className="w-full sm:w-56" placeholder="part of an email" value={draft.actor} onChange={(event) => setDraft({ ...draft, actor: event.target.value })} />
        <Button type="submit">Apply</Button>
        <Button
          variant="secondary"
          onClick={() => {
            setDraft(NO_FILTERS);
            setApplied(NO_FILTERS);
          }}
        >
          Clear
        </Button>
      </form>
      {/* A new set of filters starts a new list: the key remounts it, so old rows and cursor are dropped. */}
      <AuditList key={`${applied.action}|${applied.outcome}|${applied.actor}`} filters={applied} />
    </div>
  );
}

function AuditList({ filters }: { filters: Filters }) {
  const [rows, setRows] = useState<AuditItem[]>([]);
  const [cursor, setCursor] = useState<string | null | undefined>(undefined); // undefined = first page not asked for yet
  const [hasMore, setHasMore] = useState(false);
  const [state, setState] = useState<"loading" | "idle" | "error">("loading");
  const [error, setError] = useState<Error | null>(null);
  const [opened, setOpened] = useState<string | null>(null);
  const [attempt, setAttempt] = useState(0);
  // The cursor for the NEXT page comes with the answer; the button turns it into the state that triggers the request.
  const nextCursor = useRef<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    setState("loading");
    mgetWithMeta(auditData, auditMeta, "/audit-logs", { limit: 25, cursor: cursor ?? undefined, action: filters.action, outcome: filters.outcome, actor: filters.actor }, controller.signal).then(
      ({ data, meta }) => {
        setRows((current) => (cursor ? [...current, ...data.logs] : data.logs));
        setHasMore(meta.hasMore);
        setState("idle");
        nextCursor.current = meta.nextCursor ?? null;
      },
      (caught: unknown) => {
        if (controller.signal.aborted) return;
        setError(caught instanceof Error ? caught : new Error(String(caught)));
        setState("error");
      },
    );
    return () => controller.abort();
  }, [cursor, filters, attempt]);

  return (
    <div className="space-y-3">
      {state === "error" && error && <ErrorState title="Could not load the log" error={error} onRetry={() => setAttempt((n) => n + 1)} />}
      {state === "loading" && rows.length === 0 && <TableSkeleton />}
      {rows.length === 0 && state === "idle" && <Empty>Nothing matches these filters.</Empty>}
      {rows.length > 0 && (
        <Table head={["When", "Who", "Action", "Thing", "Result", ""]} caption="Audit log">
          {rows.map((row) => (
            <tr key={row.id}>
              <td className={`${td} whitespace-nowrap`}>{new Date(row.createdAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</td>
              <td className={`${td} max-w-40 truncate`} title={row.actor?.email ?? undefined}>{row.actor?.email ?? "system"}</td>
              <td className={td}>
                <code>{row.action}</code>
              </td>
              <td className={`${td} text-muted`}>{row.entityType ?? "-"}</td>
              <td className={td}>
                <StatusBadge status={row.outcome} />
              </td>
              <td className={`${td} text-right`}>
                <IconButton icon="info" label={`Details of ${row.action}`} onClick={() => setOpened(row.id)} />
              </td>
            </tr>
          ))}
        </Table>
      )}
      {hasMore && (
        <Button variant="secondary" disabled={state === "loading"} onClick={() => setCursor(nextCursor.current)}>
          {state === "loading" ? "Loading..." : "Load more"}
        </Button>
      )}
      {opened && <AuditDetail id={opened} onClose={() => setOpened(null)} />}
    </div>
  );
}

function AuditDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const detail = useFetch((signal) => mget(auditDetailData, `/audit-logs/${id}`, undefined, signal), [id]);
  return (
    <Modal title="Audit event" onClose={onClose} wide>
      {detail.status === "loading" && <p role="status">Loading...</p>}
      {detail.status === "error" && <ErrorState error={detail.error} onRetry={detail.reload} />}
      {detail.status === "success" && (
        <div className="space-y-3 text-sm">
          <dl className="grid grid-cols-[7rem_1fr] gap-y-1">
            <dt className="text-muted">Action</dt>
            <dd>{detail.data.log.action}</dd>
            <dt className="text-muted">When</dt>
            <dd>{new Date(detail.data.log.createdAt).toLocaleString()}</dd>
            <dt className="text-muted">Who</dt>
            <dd>{detail.data.log.actor?.email ?? "system"}</dd>
            <dt className="text-muted">Thing</dt>
            <dd>
              {detail.data.log.entityType ?? "-"} {detail.data.log.entityId ?? ""}
            </dd>
            <dt className="text-muted">From</dt>
            <dd className="break-all">
              {detail.data.log.ip ?? "-"} · {detail.data.log.userAgent ?? ""}
            </dd>
            <dt className="text-muted">Request id</dt>
            <dd>{detail.data.log.requestId ?? "-"}</dd>
          </dl>
          {(["before", "after"] as const).map((side) => (
            <div key={side}>
              <p className="mb-1 font-medium">{side === "before" ? "Before (changed fields)" : "After"}</p>
              <pre className="max-h-48 overflow-auto rounded-lg bg-surface-2 p-3 text-xs">{detail.data.log[side] ? JSON.stringify(detail.data.log[side], null, 2) : "-"}</pre>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}
