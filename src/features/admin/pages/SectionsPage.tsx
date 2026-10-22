import { useState, type FormEvent } from "react";
import { Link, useParams } from "react-router";
import { mget, msend } from "@/features/admin/admin-api";
import { useCan } from "@/features/admin/auth/AuthProvider";
import { categoryData, sectionData, sectionsData, type AdminSection, type Kind, type Status } from "@/features/admin/schemas";
import { Empty, MoveButtons, Notice, PageHeader, StatusBadge, Table, TableSkeleton, moved, td } from "@/features/admin/ui";
import { useAction } from "@/shared/hooks/useAction";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useFetch } from "@/shared/hooks/useFetch";
import { fieldErrors } from "@/shared/lib/field-errors";
import { slugify } from "@/shared/lib/slugify";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { ErrorState } from "@/shared/ui/ErrorState";
import { SelectField, TextAreaField, TextField } from "@/shared/ui/Field";
import { IconButton } from "@/shared/ui/IconButton";
import { Modal } from "@/shared/ui/Modal";

const KIND_HELP: Record<Kind, string> = {
  CONCEPT: "Explanations to read (concept)",
  QUESTION: "Interview questions with answers",
  EXAMPLE: "Worked code examples",
};

/** /admin/categories/:categoryId/sections: the sections of one topic. */
export function SectionsPage() {
  const categoryId = useParams().categoryId ?? "";
  const can = useCan();
  const category = useFetch((signal) => mget(categoryData, `/categories/${categoryId}`, undefined, signal), [categoryId]);
  const list = useFetch((signal) => mget(sectionsData, `/categories/${categoryId}/sections`, undefined, signal), [categoryId]);
  const [editing, setEditing] = useState<AdminSection | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminSection | null>(null);

  const topicName = category.status === "success" ? category.data.category.name : "...";
  useDocumentTitle(`${topicName} · Sections · Admin`);

  const reorder = useAction(async (ids: string[]) => {
    await msend(null, "POST", `/categories/${categoryId}/sections/reorder`, { ids });
    list.reload();
  });
  const sections = list.status === "success" ? list.data.sections : [];
  const move = (from: number, to: number) => void reorder.run(moved(sections, from, to).map((section) => section.id));

  return (
    <div>
      <PageHeader
        title={`${topicName}: sections`}
        crumbs={[{ label: "Topics", to: "/admin/categories" }, { label: topicName }]}
        action={can("section.create") && <Button onClick={() => setEditing("new")}>New section</Button>}
      />
      {category.status === "error" && <ErrorState title="Could not load the topic" error={category.error} onRetry={category.reload} />}
      {reorder.error && <Notice>{fieldErrors(reorder.error).general ?? "Could not reorder"}</Notice>}
      {list.status === "loading" && <TableSkeleton />}
      {list.status === "error" && category.status !== "error" && <ErrorState title="Could not load the sections" error={list.error} onRetry={list.reload} />}
      {list.status === "success" &&
        (sections.length === 0 ? (
          <Empty>This topic has no sections yet.</Empty>
        ) : (
          <Table head={["Order", "Name", "Kind", "Status", "Entries", ""]} caption="Sections">
            {sections.map((section, index) => (
              <tr key={section.id}>
                <td className={td}>{can("section.edit") && <MoveButtons index={index} count={sections.length} disabled={reorder.pending} onMove={move} label={section.name} />}</td>
                <td className={`${td} font-medium`}>
                  {section.name}
                  <span className="block text-xs font-normal text-muted">{section.slug}</span>
                </td>
                <td className={td}>{section.kind.toLowerCase()}</td>
                <td className={td}>
                  <StatusBadge status={section.status} />
                </td>
                <td className={td}>
                  <Link to={`/admin/sections/${section.id}/entries`} className="text-accent hover:underline">
                    {section.entryCount} {section.entryCount === 1 ? "entry" : "entries"}
                  </Link>
                </td>
                <td className={`${td} whitespace-nowrap text-right`}>
                  {can("section.edit") && (
                    <IconButton icon="pencil" label={`Edit ${section.name}`} onClick={() => setEditing(section)} />
                  )}
                  {can("section.delete") && (
                    <IconButton icon="trash" tone="danger" label={`Delete ${section.name}`} onClick={() => setDeleting(section)} />
                  )}
                </td>
              </tr>
            ))}
          </Table>
        ))}
      {editing && (
        <SectionForm
          categoryId={categoryId}
          section={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            list.reload();
          }}
        />
      )}
      {deleting && (
        <DeleteSection
          section={deleting}
          onClose={() => setDeleting(null)}
          onDeleted={() => {
            setDeleting(null);
            list.reload();
          }}
        />
      )}
    </div>
  );
}

function SectionForm({ categoryId, section, onClose, onSaved }: { categoryId: string; section: AdminSection | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(section?.name ?? "");
  const [slug, setSlug] = useState(section?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(section !== null);
  const [description, setDescription] = useState(section?.description ?? "");
  const [kind, setKind] = useState<Kind>(section?.kind ?? "QUESTION");
  const [status, setStatus] = useState<Status>(section?.status ?? "DRAFT");

  const save = useAction(async () => {
    const body = { name, slug, description: description.trim() || null, kind, status };
    await (section ? msend(sectionData, "PATCH", `/sections/${section.id}`, body) : msend(sectionData, "POST", `/categories/${categoryId}/sections`, body));
    return true;
  });
  const { fields, general } = fieldErrors(save.error);
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (await save.run()) onSaved();
  };

  return (
    <Modal title={section ? `Edit ${section.name}` : "New section"} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3" noValidate>
        <TextField
          label="Name"
          value={name}
          required
          error={fields.name}
          onChange={(event) => {
            setName(event.target.value);
            if (!slugTouched) setSlug(slugify(event.target.value));
          }}
        />
        <TextField
          label="Slug"
          value={slug}
          required
          error={fields.slug}
          onChange={(event) => {
            setSlug(event.target.value);
            setSlugTouched(true);
          }}
        />
        <TextAreaField label="Description" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} error={fields.description} />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Kind" value={kind} onChange={(event) => setKind(event.target.value as Kind)} error={fields.kind} hint={KIND_HELP[kind]}>
            <option value="CONCEPT">Concept</option>
            <option value="QUESTION">Question</option>
            <option value="EXAMPLE">Example</option>
          </SelectField>
          <SelectField label="Status" value={status} onChange={(event) => setStatus(event.target.value as Status)} error={fields.status}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </SelectField>
        </div>
        {general && <Notice>{general}</Notice>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.pending}>
            {save.pending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

function DeleteSection({ section, onClose, onDeleted }: { section: AdminSection; onClose: () => void; onDeleted: () => void }) {
  const [cascade, setCascade] = useState(false);
  return (
    <ConfirmDialog
      title={`Delete ${section.name}?`}
      confirmLabel="Delete"
      onClose={onClose}
      onConfirm={async () => {
        await msend(null, "DELETE", `/sections/${section.id}`, undefined, { cascade });
        onDeleted();
      }}
    >
      <p>This cannot be undone.</p>
      {section.entryCount > 0 && (
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={cascade} onChange={(event) => setCascade(event.target.checked)} className="mt-0.5 size-4" />
          <span>Also delete its {section.entryCount} entries. Without this the API refuses, because the section is not empty.</span>
        </label>
      )}
    </ConfirmDialog>
  );
}
