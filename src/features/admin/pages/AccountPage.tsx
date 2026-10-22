import { useState, type FormEvent } from "react";
import { changePassword, getSessions, revokeSession } from "@/features/admin/auth/auth-api";
import { useAuth, useUser } from "@/features/admin/auth/AuthProvider";
import { Empty, Notice, PageHeader, Table, TableSkeleton, td } from "@/features/admin/ui";
import { useAction } from "@/shared/hooks/useAction";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useFetch } from "@/shared/hooks/useFetch";
import { fieldErrors } from "@/shared/lib/field-errors";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { ErrorState } from "@/shared/ui/ErrorState";
import { IconButton } from "@/shared/ui/IconButton";
import { TextField } from "@/shared/ui/Field";

/** /admin/account: who you are, where you are signed in (end any session), and change your password. */
export function AccountPage() {
  useDocumentTitle("My account · Admin");
  const user = useUser();
  return (
    <div className="space-y-10">
      <PageHeader title="My account" crumbs={[{ label: "My account" }]} />
      <dl className="grid max-w-md grid-cols-[6rem_1fr] gap-y-1 text-sm">
        <dt className="text-muted">Name</dt>
        <dd>{user.name}</dd>
        <dt className="text-muted">Email</dt>
        <dd>{user.email}</dd>
        <dt className="text-muted">Role</dt>
        <dd>{user.role}</dd>
      </dl>
      <Sessions />
      <PasswordForm />
    </div>
  );
}

function Sessions() {
  const { logout } = useAuth();
  const sessions = useFetch((signal) => getSessions(signal), []);
  const revoke = useAction(async (id: string) => {
    await revokeSession(id);
    sessions.reload();
  });
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-semibold">Where you are signed in</h2>
      {revoke.error && <Notice>{fieldErrors(revoke.error).general}</Notice>}
      {sessions.status === "loading" && <TableSkeleton />}
      {sessions.status === "error" && <ErrorState title="Could not load your sessions" error={sessions.error} onRetry={sessions.reload} />}
      {sessions.status === "success" &&
        (sessions.data.length === 0 ? (
          <Empty>No sessions.</Empty>
        ) : (
          <Table head={["Browser", "Address", "Last used", "Expires", ""]} caption="Your sessions">
            {sessions.data.map((session) => (
              <tr key={session.id}>
                <td className={`${td} max-w-xs truncate`} title={session.userAgent ?? undefined}>
                  {session.userAgent ?? "unknown"}
                  {session.current && <Badge tone="success" className="ml-2">this browser</Badge>}
                </td>
                <td className={td}>{session.ipAddress ?? "-"}</td>
                <td className={td}>{new Date(session.lastUsedAt).toLocaleString()}</td>
                <td className={td}>{new Date(session.expiresAt).toLocaleDateString()}</td>
                <td className={`${td} text-right`}>
                  <IconButton
                    icon="log-out"
                    label={session.current ? "Sign out of this browser" : "End this session"}
                    disabled={revoke.pending}
                    onClick={() => (session.current ? void logout() : void revoke.run(session.id))}
                  />
                </td>
              </tr>
            ))}
          </Table>
        ))}
    </section>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [done, setDone] = useState(false);
  const save = useAction(async () => {
    await changePassword(current, next);
    return true;
  });
  const { fields, general } = fieldErrors(save.error);
  const mismatch = again !== "" && again !== next ? "The two passwords are different." : undefined;

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setDone(false);
    if (await save.run()) {
      setDone(true);
      setCurrent("");
      setNext("");
      setAgain("");
    }
  };

  return (
    <section className="max-w-md space-y-3">
      <h2 className="text-lg font-semibold">Change password</h2>
      <form onSubmit={onSubmit} className="space-y-3" noValidate>
        <TextField label="Current password" type="password" autoComplete="current-password" value={current} onChange={(event) => setCurrent(event.target.value)} error={fields.currentPassword} />
        <TextField label="New password" type="password" autoComplete="new-password" value={next} onChange={(event) => setNext(event.target.value)} error={fields.newPassword} hint="At least 12 characters." />
        <TextField label="New password again" type="password" autoComplete="new-password" value={again} onChange={(event) => setAgain(event.target.value)} error={mismatch} />
        {general && <Notice>{general}</Notice>}
        {done && <Notice tone="success">Password changed.</Notice>}
        <Button type="submit" disabled={save.pending || !current || next.length < 12 || next !== again}>
          {save.pending ? "Saving..." : "Change password"}
        </Button>
      </form>
    </section>
  );
}
