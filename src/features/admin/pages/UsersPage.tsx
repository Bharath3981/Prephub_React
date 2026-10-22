import { useCallback, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router";
import { mget, mgetWithMeta, msend } from "@/features/admin/admin-api";
import { useCan, useUser } from "@/features/admin/auth/AuthProvider";
import { createdUserData, pageMetaSchema, revokedData, rolesData, userData, usersData, type AdminRole, type AdminUser } from "@/features/admin/schemas";
import { Empty, Notice, PageHeader, StatusBadge, Table, TableSkeleton, td } from "@/features/admin/ui";
import { useAction } from "@/shared/hooks/useAction";
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

const LIMIT = 25;
type Dialog = { kind: "create" } | { kind: "edit" | "disable" | "enable" | "revoke"; user: AdminUser } | { kind: "invite"; link: string; email: string } | null;

/** /admin/users: staff accounts. Viewing needs user.view; every change needs user.manage (the API enforces its own safety rules too). */
export function UsersPage() {
  useDocumentTitle("Users · Admin");
  const can = useCan();
  const me = useUser();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get("page")) || 1);
  const roleId = params.get("role") ?? "";
  const search = params.get("search") ?? "";
  const [draft, setDraft] = useState(search);

  const roles = useFetch((signal) => mget(rolesData, "/roles", undefined, signal), []);
  const roleList = roles.status === "success" ? roles.data.roles : [];
  const list = useFetch((signal) => mgetWithMeta(usersData, pageMetaSchema, "/users", { page, limit: LIMIT, roleId, search: search.trim() }, signal), [page, roleId, search]);

  const [dialog, setDialog] = useState<Dialog>(null);
  const [message, setMessage] = useState<string | null>(null);
  const manage = can("user.manage");

  const update = (next: Record<string, string>) => {
    const merged = new URLSearchParams(params);
    for (const [key, value] of Object.entries(next)) value ? merged.set(key, value) : merged.delete(key);
    setParams(merged, { replace: true });
  };
  const pageLink = useCallback((next: number) => ({ search: `?${new URLSearchParams({ ...(search && { search }), ...(roleId && { role: roleId }), page: String(next) })}` }), [search, roleId]);
  const done = (text: string) => {
    setDialog(null);
    setMessage(text);
    list.reload();
  };
  const users = list.status === "success" ? list.data.data.users : [];
  const meta = list.status === "success" ? list.data.meta : null;

  return (
    <div>
      <PageHeader title="Users" crumbs={[{ label: "Users" }]} description="Staff accounts. There are no learner accounts." action={manage && <Button onClick={() => setDialog({ kind: "create" })}>New user</Button>} />
      <div className="mb-4 flex flex-wrap items-start gap-3">
        <TextField
          label="Search"
          type="search"
          className="w-full sm:w-64"
          placeholder="Email or name, then Enter"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={() => draft.trim() !== search.trim() && update({ search: draft.trim(), page: "" })}
          onKeyDown={(event) => event.key === "Enter" && update({ search: draft.trim(), page: "" })}
        />
        <SelectField label="Role" className="w-full sm:w-48" value={roleId} onChange={(event) => update({ role: event.target.value, page: "" })}>
          <option value="">All roles</option>
          {roleList.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </SelectField>
      </div>
      {message && <Notice tone="success">{message}</Notice>}
      {list.status === "loading" && <TableSkeleton />}
      {list.status === "error" && <ErrorState title="Could not load the users" error={list.error} onRetry={list.reload} />}
      {list.status === "success" &&
        (users.length === 0 ? (
          <Empty>No users found.</Empty>
        ) : (
          <Table head={["User", "Role", "Status", "Last login", "Sessions", ""]} caption="Users">
            {users.map((user) => (
              <tr key={user.id}>
                <td className={td}>
                  <span className="font-medium">{user.name}</span>
                  {user.id === me.id && <span className="ml-2 text-xs text-muted">(you)</span>}
                  <span className="block text-xs text-muted">{user.email}</span>
                </td>
                <td className={td}>{user.role.name}</td>
                <td className={td}>
                  <StatusBadge status={user.status} />
                </td>
                <td className={`${td} whitespace-nowrap`}>{user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" }) : "never"}</td>
                <td className={td}>{user.activeSessions}</td>
                <td className={`${td} whitespace-nowrap text-right`}>
                  {manage && user.id !== me.id && (
                    <>
                      <IconButton icon="pencil" label={`Edit ${user.name}`} onClick={() => setDialog({ kind: "edit", user })} />
                      <IconButton icon="log-out" label={`Sign ${user.name} out everywhere`} disabled={user.activeSessions === 0} onClick={() => setDialog({ kind: "revoke", user })} />
                      <IconButton
                        icon={user.status === "ACTIVE" ? "ban" : "check"}
                        tone={user.status === "ACTIVE" ? "danger" : "neutral"}
                        label={`${user.status === "ACTIVE" ? "Disable" : "Enable"} ${user.name}`}
                        onClick={() => setDialog({ kind: user.status === "ACTIVE" ? "disable" : "enable", user })}
                      />
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
      {meta && <p className="mt-3 text-xs text-muted">{meta.total} users. You cannot change your own account here (use My account).</p>}

      {dialog?.kind === "create" && (
        <UserForm
          roles={roleList}
          user={null}
          onClose={() => setDialog(null)}
          onSaved={(result) => (result?.inviteLink ? (setDialog({ kind: "invite", link: result.inviteLink, email: result.email }), list.reload()) : done("User created. They receive an email to choose a password."))}
        />
      )}
      {dialog?.kind === "edit" && <UserForm roles={roleList} user={dialog.user} onClose={() => setDialog(null)} onSaved={() => done("User updated.")} />}
      {dialog?.kind === "invite" && (
        <Modal title="User created" onClose={() => setDialog(null)}>
          <p className="text-sm">
            No email is sent in this environment. Give <b>{dialog.email}</b> this one-use link (valid 72 hours) to choose a password:
          </p>
          <input readOnly value={dialog.link} onFocus={(event) => event.target.select()} aria-label="Invite link" className="w-full rounded-lg border border-border bg-surface-2 px-3 py-2 font-mono text-xs" />
          <div className="flex justify-end">
            <Button onClick={() => setDialog(null)}>Done</Button>
          </div>
        </Modal>
      )}
      {(dialog?.kind === "disable" || dialog?.kind === "enable" || dialog?.kind === "revoke") && (
        <ConfirmDialog
          title={dialog.kind === "disable" ? `Disable ${dialog.user.name}?` : dialog.kind === "enable" ? `Enable ${dialog.user.name}?` : `Sign ${dialog.user.name} out everywhere?`}
          confirmLabel={dialog.kind === "disable" ? "Disable" : dialog.kind === "enable" ? "Enable" : "Sign out"}
          danger={dialog.kind !== "enable"}
          onClose={() => setDialog(null)}
          onConfirm={async () => {
            const { kind, user } = dialog;
            if (kind === "revoke") {
              const result = await msend(revokedData, "POST", `/users/${user.id}/revoke-sessions`);
              done(`${result.revoked} sessions ended.`);
            } else {
              await msend(userData, "POST", `/users/${user.id}/${kind}`);
              done(kind === "disable" ? "User disabled and signed out." : "User enabled.");
            }
          }}
        >
          <p>{dialog.kind === "enable" ? "They can sign in again." : dialog.kind === "disable" ? "They cannot sign in, and their sessions end now." : `Ends their ${dialog.user.activeSessions} active sessions.`}</p>
        </ConfirmDialog>
      )}
    </div>
  );
}

function UserForm({ roles, user, onClose, onSaved }: { roles: AdminRole[]; user: AdminUser | null; onClose: () => void; onSaved: (created?: { inviteLink: string | null; email: string }) => void }) {
  const [email, setEmail] = useState(user?.email ?? "");
  const [name, setName] = useState(user?.name ?? "");
  const [roleId, setRoleId] = useState(user?.role.id ?? roles.find((role) => !role.isSystem || role.name !== "ADMIN")?.id ?? "");

  const save = useAction(async () => {
    if (user) {
      await msend(userData, "PATCH", `/users/${user.id}`, { name, roleId });
      return { inviteLink: null, email };
    }
    const created = await msend(createdUserData, "POST", "/users", { email, name, roleId });
    return { inviteLink: created.inviteLink, email };
  });
  const { fields, general } = fieldErrors(save.error);
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const result = await save.run();
    if (result) onSaved(user ? undefined : result);
  };

  return (
    <Modal title={user ? `Edit ${user.name}` : "New user"} onClose={onClose}>
      <form onSubmit={onSubmit} className="space-y-3" noValidate>
        <TextField label="Email" type="email" value={email} disabled={user !== null} required onChange={(event) => setEmail(event.target.value)} error={fields.email} />
        <TextField label="Name" value={name} required onChange={(event) => setName(event.target.value)} error={fields.name} />
        <SelectField label="Role" value={roleId} onChange={(event) => setRoleId(event.target.value)} error={fields.roleId} hint="You can only give a role whose permissions you hold yourself.">
          {roles.map((role) => (
            <option key={role.id} value={role.id}>
              {role.name}
            </option>
          ))}
        </SelectField>
        {general && <Notice>{general}</Notice>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={save.pending || !name.trim() || !roleId || !email}>
            {save.pending ? "Saving..." : "Save"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
