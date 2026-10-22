import { useMemo, useState, type FormEvent } from "react";
import { mget, msend } from "@/features/admin/admin-api";
import { useCan, useUser } from "@/features/admin/auth/AuthProvider";
import { permissionsData, roleData, rolesData, type AdminRole } from "@/features/admin/schemas";
import { Notice, PageHeader, Table, TableSkeleton, td } from "@/features/admin/ui";
import { useAction } from "@/shared/hooks/useAction";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useFetch } from "@/shared/hooks/useFetch";
import { fieldErrors } from "@/shared/lib/field-errors";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { ConfirmDialog } from "@/shared/ui/ConfirmDialog";
import { ErrorState } from "@/shared/ui/ErrorState";
import { CheckboxField, TextAreaField, TextField } from "@/shared/ui/Field";
import { IconButton } from "@/shared/ui/IconButton";
import { Modal } from "@/shared/ui/Modal";

/** /admin/roles: roles and their permissions. Permissions are fixed in code; roles and the mapping live in the database. */
export function RolesPage() {
  useDocumentTitle("Roles · Admin");
  const can = useCan();
  const roles = useFetch((signal) => mget(rolesData, "/roles", undefined, signal), []);
  const permissions = useFetch((signal) => mget(permissionsData, "/permissions", undefined, signal), []);
  const [editing, setEditing] = useState<AdminRole | "new" | null>(null);
  const [deleting, setDeleting] = useState<AdminRole | null>(null);
  const manage = can("role.manage");

  return (
    <div>
      <PageHeader
        title="Roles"
        crumbs={[{ label: "Roles" }]}
        description="A role is a named set of permissions. Built-in roles cannot be deleted and can only gain permissions."
        action={manage && <Button onClick={() => setEditing("new")}>New role</Button>}
      />
      {roles.status === "loading" && <TableSkeleton />}
      {roles.status === "error" && <ErrorState title="Could not load the roles" error={roles.error} onRetry={roles.reload} />}
      {roles.status === "success" && (
        <Table head={["Role", "Permissions", "Users", ""]} caption="Roles">
          {roles.data.roles.map((role) => (
            <tr key={role.id}>
              <td className={td}>
                <span className="font-medium">{role.name}</span>
                {role.isSystem && <Badge className="ml-2">built-in</Badge>}
                {role.description && <span className="block text-xs text-muted">{role.description}</span>}
              </td>
              <td className={`${td} max-w-md text-xs text-muted`}>{role.permissions.length} permissions: {role.permissions.join(", ")}</td>
              <td className={td}>{role.userCount}</td>
              <td className={`${td} whitespace-nowrap text-right`}>
                {manage && (
                  <>
                    <IconButton icon="pencil" label={`Edit ${role.name}`} onClick={() => setEditing(role)} />
                    {!role.isSystem && <IconButton icon="trash" tone="danger" label={`Delete ${role.name}`} onClick={() => setDeleting(role)} />}
                  </>
                )}
              </td>
            </tr>
          ))}
        </Table>
      )}
      {editing && permissions.status === "success" && (
        <RoleForm
          role={editing === "new" ? null : editing}
          allPermissions={permissions.data.permissions}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            roles.reload();
          }}
        />
      )}
      {editing && permissions.status === "error" && (
        <Modal title="Permissions unavailable" onClose={() => setEditing(null)}>
          <ErrorState error={permissions.error} onRetry={permissions.reload} />
        </Modal>
      )}
      {deleting && (
        <ConfirmDialog
          title={`Delete ${deleting.name}?`}
          confirmLabel="Delete"
          onClose={() => setDeleting(null)}
          onConfirm={async () => {
            await msend(null, "DELETE", `/roles/${deleting.id}`);
            roles.reload();
          }}
        >
          <p>{deleting.userCount > 0 ? `${deleting.userCount} users have this role; the API will refuse until they have another one.` : "No user has this role."}</p>
        </ConfirmDialog>
      )}
    </div>
  );
}

function RoleForm({ role, allPermissions, onClose, onSaved }: { role: AdminRole | null; allPermissions: { key: string; description: string | null }[]; onClose: () => void; onSaved: () => void }) {
  const me = useUser();
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selected, setSelected] = useState<Set<string>>(new Set(role?.permissions ?? []));

  // The permissions you hold are the only ones you can hand out. A built-in role can only GAIN permissions.
  const groups = useMemo(() => {
    const byArea = new Map<string, typeof allPermissions>();
    for (const permission of allPermissions) byArea.set(permission.key.split(".")[0], [...(byArea.get(permission.key.split(".")[0]) ?? []), permission]);
    return [...byArea.entries()];
  }, [allPermissions]);

  const save = useAction(async () => {
    const permissionKeys = [...selected];
    const trimmed = description.trim() || null;
    await (role ? msend(roleData, "PATCH", `/roles/${role.id}`, { description: trimmed, permissionKeys }) : msend(roleData, "POST", "/roles", { name, description: trimmed, permissionKeys }));
    return true;
  });
  const { fields, general } = fieldErrors(save.error);
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (await save.run()) onSaved();
  };
  const toggle = (key: string, on: boolean) =>
    setSelected((current) => {
      const next = new Set(current);
      if (on) next.add(key);
      else next.delete(key);
      return next;
    });

  return (
    <Modal title={role ? `Edit ${role.name}` : "New role"} onClose={onClose} wide>
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="Name" value={name} disabled={role !== null} required onChange={(event) => setName(event.target.value)} error={fields.name} hint="Capital letters, digits and underscores." />
          <TextAreaField label="Description" rows={2} value={description} onChange={(event) => setDescription(event.target.value)} error={fields.description} />
        </div>
        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Permissions ({selected.size})</legend>
          {fields.permissionKeys && <p className="text-xs text-danger">{fields.permissionKeys}</p>}
          <div className="grid max-h-72 gap-4 overflow-y-auto sm:grid-cols-2">
            {groups.map(([area, items]) => (
              <div key={area} className="space-y-1.5">
                <p className="text-xs font-bold uppercase tracking-wider text-muted">{area}</p>
                {items.map((permission) => {
                  const held = me.permissions.includes(permission.key);
                  const locked = role?.isSystem && role.permissions.includes(permission.key); // built-in roles never lose a permission
                  return (
                    <CheckboxField
                      key={permission.key}
                      label={permission.key}
                      hint={!held ? "You do not hold this one" : (permission.description ?? undefined)}
                      checked={selected.has(permission.key)}
                      disabled={(!held && !selected.has(permission.key)) || !!locked}
                      onChange={(event) => toggle(permission.key, event.target.checked)}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </fieldset>
        {general && <Notice>{general}</Notice>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.pending || selected.size === 0 || (!role && !name.trim())}>
            {save.pending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
