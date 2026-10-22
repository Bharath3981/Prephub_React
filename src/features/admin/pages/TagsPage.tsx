import { useCallback, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { z } from "zod";
import { mgetWithMeta, msend } from "@/features/admin/admin-api";
import { useCan } from "@/features/admin/auth/AuthProvider";
import { adminTagSchema, pageMetaSchema, tagData, tagsData, type AdminTag } from "@/features/admin/schemas";
import { Empty, Notice, PageHeader, Table, TableSkeleton, td } from "@/features/admin/ui";
import { useAction } from "@/shared/hooks/useAction";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useFetch } from "@/shared/hooks/useFetch";
import { fieldErrors } from "@/shared/lib/field-errors";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { ErrorState } from "@/shared/ui/ErrorState";
import { SelectField, TextField } from "@/shared/ui/Field";
import { IconButton } from "@/shared/ui/IconButton";
import { Modal } from "@/shared/ui/Modal";
import { Pagination } from "@/shared/ui/Pagination";

const LIMIT = 50;
type Dialog = { kind: "create" } | { kind: "rename" | "delete" | "merge"; tag: AdminTag } | { kind: "prune" } | null;

/** /admin/tags: search, create, rename, delete, merge into another tag, and remove all unused tags. */
export function AdminTagsPage() {
  useDocumentTitle("Tags · Admin");
  const can = useCan();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const sort = params.get("sort") === "usage" ? "usage" : "name";
  const search = params.get("search") ?? "";

  // The box keeps its own text; the URL (and the request) follow when you press Enter or leave the box.
  const [draft, setDraft] = useState(search);
  const urlSearch = draft.trim();
  const list = useFetch((signal) => mgetWithMeta(tagsData, pageMetaSchema, "/tags", { page, limit: LIMIT, sort, search: search.trim() }, signal), [page, sort, search]);
  const [dialog, setDialog] = useState<Dialog>(null);
  const [message, setMessage] = useState<string | null>(null);

  const update = (next: Record<string, string>) => {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) value ? merged.set(key, value) : merged.delete(key);
    setParams(merged, { replace: true });
  };
  // Write the paused text to the URL (resetting the page).
  const applySearch = () => {
    if (urlSearch !== search.trim()) update({ search: urlSearch, page: "" });
  };
  const pageLink = useCallback((next: number) => ({ search: `?${new URLSearchParams({ ...(search && { search }), sort, page: String(next) })}` }), [search, sort]);

  const done = (text: string) => {
    setDialog(null);
    setMessage(text);
    list.reload();
  };
  const tags = list.status === "success" ? list.data.data.tags : [];
  const meta = list.status === "success" ? list.data.meta : null;

  return (
    <div>
      <PageHeader
        title="Tags"
        crumbs={[{ label: "Tags" }]}
        action={
          can("tag.manage") && (
            <div className="flex gap-2">
              <Button variant="secondary" onClick={() => setDialog({ kind: "prune" })}>
                Remove unused
              </Button>
              <Button onClick={() => setDialog({ kind: "create" })}>New tag</Button>
            </div>
          )
        }
      />
      <div className="mb-4 flex flex-wrap items-start gap-3">
        <TextField
          label="Search"
          type="search"
          value={draft}
          className="w-full sm:w-64"
          placeholder="Name or slug, then Enter"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={applySearch}
          onKeyDown={(event) => event.key === "Enter" && applySearch()}
        />
        <SelectField label="Sort" className="w-full sm:w-44" value={sort} onChange={(event) => update({ sort: event.target.value, page: "" })}>
          <option value="name">Name</option>
          <option value="usage">Most used</option>
        </SelectField>
      </div>
      {message && <Notice tone="success">{message}</Notice>}
      {list.status === "loading" && <TableSkeleton />}
      {list.status === "error" && <ErrorState title="Could not load the tags" error={list.error} onRetry={list.reload} />}
      {list.status === "success" &&
        (tags.length === 0 ? (
          <Empty>No tags found.</Empty>
        ) : (
          <Table head={["Name", "Slug", "Entries", ""]} caption="Tags">
            {tags.map((tag) => (
              <tr key={tag.id}>
                <td className={`${td} font-medium`}>{tag.name}</td>
                <td className={td}>
                  <code>{tag.slug}</code>
                </td>
                <td className={td}>{tag.entryCount}</td>
                <td className={`${td} whitespace-nowrap text-right`}>
                  {can("tag.manage") && (
                    <>
                      <IconButton icon="pencil" label={`Rename ${tag.name}`} onClick={() => setDialog({ kind: "rename", tag })} />
                      <IconButton icon="merge" label={`Merge ${tag.name} into another tag`} onClick={() => setDialog({ kind: "merge", tag })} />
                      <IconButton icon="trash" tone="danger" label={`Delete ${tag.name}`} onClick={() => setDialog({ kind: "delete", tag })} />
                    </>
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
      {meta && <p className="mt-3 text-xs text-muted">{meta.total} tags.</p>}

      {dialog?.kind === "create" && <NameForm title="New tag" initial="" send={(name) => msend(tagData, "POST", "/tags", { name })} onClose={() => setDialog(null)} onSaved={() => done("Tag created.")} />}
      {dialog?.kind === "rename" && (
        <NameForm title={`Rename ${dialog.tag.name}`} initial={dialog.tag.name} send={(name) => msend(tagData, "PATCH", `/tags/${dialog.tag.id}`, { name })} onClose={() => setDialog(null)} onSaved={() => done("Tag renamed.")} />
      )}
      {dialog?.kind === "delete" && (
        <ConfirmDialog
          title={`Delete ${dialog.tag.name}?`}
          confirmLabel="Delete"
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            await msend(null, "DELETE", `/tags/${dialog.tag.id}`, undefined, { force: dialog.tag.entryCount > 0 });
            done("Tag deleted.");
          }}
        >
          <p>{dialog.tag.entryCount > 0 ? `${dialog.tag.entryCount} entries use this tag; it will be removed from them.` : "No entry uses this tag."}</p>
        </ConfirmDialog>
      )}
      {dialog?.kind === "prune" && (
        <ConfirmDialog
          title="Remove unused tags?"
          confirmLabel="Remove"
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            const result = await msend(z.object({ deleted: z.number() }), "POST", "/tags/prune");
            done(`${result.deleted} unused tags removed.`);
          }}
        >
          <p>Deletes every tag that no entry uses.</p>
        </ConfirmDialog>
      )}
      {dialog?.kind === "merge" && <MergeDialog tag={dialog.tag} onClose={() => setDialog(null)} onMerged={(moved) => done(`Merged: ${moved} entries moved.`)} />}
    </div>
  );
}

function NameForm({ title, initial, send, onClose, onSaved }: { title: string; initial: string; send: (name: string) => Promise<unknown>; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(initial);
  const save = useAction(async () => {
    await send(name);
    return true;
  });
  const { fields, general } = fieldErrors(save.error);
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (await save.run()) onSaved();
  };
  return (
    <Modal title={title} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3" noValidate>
        <TextField label="Name" value={name} required maxLength={40} onChange={(event) => setName(event.target.value)} error={fields.name} hint="The slug is made from the name." />
        {general && <Notice>{general}</Notice>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.pending || !name.trim()}>
            Save
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/** Pick the tag that KEEPS the entries; the tag being merged is deleted. */
function MergeDialog({ tag, onClose, onMerged }: { tag: AdminTag; onClose: () => void; onMerged: (moved: number) => void }) {
  const [text, setText] = useState("");
  const query = useDebouncedValue(text.trim(), 300);
  const found = useFetch((signal) => (query ? mgetWithMeta(z.object({ tags: z.array(adminTagSchema) }), pageMetaSchema, "/tags", { search: query, limit: 8 }, signal) : Promise.resolve(null)), [query]);
  const [target, setTarget] = useState<AdminTag | null>(null);
  const merge = useAction(async () => {
    if (!target) return undefined;
    const result = await msend(z.object({ movedEntries: z.number() }), "POST", `/tags/${tag.id}/merge`, { intoId: target.id });
    return result.movedEntries;
  });
  const { general } = fieldErrors(merge.error);
  const options = found.status === "success" && found.data ? found.data.data.tags.filter((other) => other.id !== tag.id) : [];

  return (
    <Modal title={`Merge ${tag.name}`} onClose={onClose}>
      <p className="text-sm">
        All {tag.entryCount} entries tagged <b>{tag.name}</b> move to the tag you pick, and <b>{tag.name}</b> is deleted.
      </p>
      <TextField label="Find the tag to keep" value={text} onChange={(event) => setText(event.target.value)} />
      <ul className="space-y-1" aria-label="Matching tags">
        {options.map((option) => (
          <li key={option.id}>
            <Button variant={target?.id === option.id ? "primary" : "secondary"} size="sm" className="w-full justify-between" aria-pressed={target?.id === option.id} onClick={() => setTarget(option)}>
              <span>{option.name}</span>
              <span className="opacity-70">{option.entryCount}</span>
            </Button>
          </li>
        ))}
      </ul>
      {general && <Notice>{general}</Notice>}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant="danger"
          disabled={!target || merge.pending}
          onClick={async () => {
            const moved = await merge.run();
            if (moved !== undefined) onMerged(moved);
          }}
        >
          {target ? `Merge into ${target.name}` : "Pick a tag"}
        </Button>
      </div>
    </Modal>
  );
}
