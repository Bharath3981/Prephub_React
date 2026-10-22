import { useState, type FormEvent } from "react";
import { Link } from "react-router";
import { mget, msend } from "@/features/admin/admin-api";
import { useCan } from "@/features/admin/auth/AuthProvider";
import { categoriesData, categoryData, type AdminCategory } from "@/features/admin/schemas";
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

/** /admin/categories: the topics. Create, edit, reorder, delete (with its sections), and open a topic's sections. */
export function CategoriesPage() {
  useDocumentTitle("Topics · Admin");
  const can = useCan();
  const list = useFetch((signal) => mget(categoriesData, "/categories", { limit: 100 }, signal), []);
  const [editing, setEditing] = useState<AdminCategory | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminCategory | null>(null);

  const reorder = useAction(async (ids: string[]) => {
    await msend(null, "POST", "/categories/reorder", { ids });
    list.reload();
  });

  const categories = list.status === "success" ? list.data.categories : [];
  const move = (from: number, to: number) => void reorder.run(moved(categories, from, to).map((category) => category.id));

  return (
    <div>
      <PageHeader
        title="Topics"
        description="A topic (category) holds sections, and a section holds entries."
        crumbs={[{ label: "Topics" }]}
        action={can("category.create") && <Button onClick={() => setEditing("new")}>New topic</Button>}
      />
      {reorder.error && <Notice>{fieldErrors(reorder.error).general ?? "Could not reorder"}</Notice>}
      {list.status === "loading" && <TableSkeleton />}
      {list.status === "error" && <ErrorState title="Could not load the topics" error={list.error} onRetry={list.reload} />}
      {list.status === "success" &&
        (categories.length === 0 ? (
          <Empty>No topics yet.</Empty>
        ) : (
          <Table head={["Order", "Name", "Slug", "Status", "Visibility", "Sections", ""]} caption="Topics">
            {categories.map((category, index) => (
              <tr key={category.id}>
                <td className={td}>{can("category.edit") && <MoveButtons index={index} count={categories.length} disabled={reorder.pending} onMove={move} label={category.name} />}</td>
                <td className={`${td} font-medium`}>{category.name}</td>
                <td className={td}>
                  <code>{category.slug}</code>
                </td>
                <td className={td}>
                  <StatusBadge status={category.status} />
                </td>
                <td className={td}>{category.visibility.toLowerCase()}</td>
                <td className={td}>
                  <Link to={`/admin/categories/${category.id}/sections`} className="text-accent hover:underline">
                    {category.sectionCount} {category.sectionCount === 1 ? "section" : "sections"}
                  </Link>
                </td>
                <td className={`${td} whitespace-nowrap text-right`}>
                  {can("category.edit") && (
                    <IconButton icon="pencil" label={`Edit ${category.name}`} onClick={() => setEditing(category)} />
                  )}
                  {can("category.delete") && (
                    <IconButton icon="trash" tone="danger" label={`Delete ${category.name}`} onClick={() => setDeleting(category)} />
                  )}
                </td>
              </tr>
            ))}
          </Table>
        ))}

      {editing && (
        <CategoryForm
          category={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            list.reload();
          }}
        />
      )}
      {deleting && (
        <DeleteCategory
          category={deleting}
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

function CategoryForm({ category, onClose, onSaved }: { category: AdminCategory | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState(category?.name ?? "");
  const [slug, setSlug] = useState(category?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(category !== null); // an existing slug is never rewritten by typing the name
  const [description, setDescription] = useState(category?.description ?? "");
  const [status, setStatus] = useState(category?.status ?? "DRAFT");
  const [visibility, setVisibility] = useState(category?.visibility ?? "DRAFT");

  const save = useAction(async () => {
    const body = { name, slug, description: description.trim() || null, status, visibility };
    await (category ? msend(categoryData, "PATCH", `/categories/${category.id}`, body) : msend(categoryData, "POST", "/categories", body));
    return true;
  });
  const { fields, general } = fieldErrors(save.error);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (await save.run()) onSaved();
  };

  return (
    <Modal title={category ? `Edit ${category.name}` : "New topic"} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3" noValidate>
        <TextField
          label="Name"
          value={name}
          onChange={(event) => {
            setName(event.target.value);
            if (!slugTouched) setSlug(slugify(event.target.value));
          }}
          error={fields.name}
          required
        />
        <TextField
          label="Slug"
          hint="Lowercase letters, numbers and hyphens. It is the address: /slug"
          value={slug}
          onChange={(event) => {
            setSlug(event.target.value);
            setSlugTouched(true);
          }}
          error={fields.slug}
          required
        />
        <TextAreaField label="Description" rows={3} value={description} onChange={(event) => setDescription(event.target.value)} error={fields.description} />
        <div className="grid gap-3 sm:grid-cols-2">
          <SelectField label="Status" value={status} onChange={(event) => setStatus(event.target.value as typeof status)} error={fields.status}>
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </SelectField>
          <SelectField label="Visibility" value={visibility} onChange={(event) => setVisibility(event.target.value as typeof visibility)} error={fields.visibility} hint="The public site shows published + public topics.">
            <option value="DRAFT">Draft</option>
            <option value="PUBLIC">Public</option>
            <option value="AUTHENTICATED">Signed-in users</option>
            <option value="ROLES">Some roles</option>
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

function DeleteCategory({ category, onClose, onDeleted }: { category: AdminCategory; onClose: () => void; onDeleted: () => void }) {
  const hasSections = category.sectionCount > 0;
  const [cascade, setCascade] = useState(false);
  return (
    <ConfirmDialog
      title={`Delete ${category.name}?`}
      confirmLabel="Delete"
      onClose={onClose}
      onConfirm={async () => {
        await msend(null, "DELETE", `/categories/${category.id}`, undefined, { cascade });
        onDeleted();
      }}
    >
      <p>This cannot be undone.</p>
      {hasSections && (
        <label className="flex items-start gap-2">
          <input type="checkbox" checked={cascade} onChange={(event) => setCascade(event.target.checked)} className="mt-0.5 size-4" />
          <span>Also delete its {category.sectionCount} sections and all their entries. Without this the API refuses, because the topic is not empty.</span>
        </label>
      )}
    </ConfirmDialog>
  );
}
