import { Link } from "react-router";
import { ADMIN_NAV } from "@/features/admin/AdminLayout";
import { mget } from "@/features/admin/admin-api";
import { useCan, useUser } from "@/features/admin/auth/AuthProvider";
import { PageHeader, StatusBadge, Table, TableSkeleton, td } from "@/features/admin/ui";
import { auditData } from "@/features/admin/schemas";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useFetch } from "@/shared/hooks/useFetch";
import { ErrorState } from "@/shared/ui/ErrorState";

/** /admin: where to go (only what the user may open) and, with audit.view, the latest activity. */
export function DashboardPage() {
  useDocumentTitle("Admin");
  const user = useUser();
  const can = useCan();

  return (
    <div>
      <PageHeader title={`Welcome, ${user.name}`} description="Manage the content, the people and the system of PrepHub." />
      <ul className="grid gap-3 sm:grid-cols-2">
        {ADMIN_NAV.flatMap((group) => group.items)
          .filter((item) => item.to !== "/admin" && can(...item.anyOf))
          .map((item) => (
            <li key={item.to}>
              <Link to={item.to} className="block rounded-xl border border-border bg-surface p-4 font-medium transition-colors hover:border-accent">
                {item.label}
              </Link>
            </li>
          ))}
      </ul>
      {can("audit.view") && <RecentActivity />}
    </div>
  );
}

function RecentActivity() {
  const logs = useFetch((signal) => mget(auditData, "/audit-logs", { limit: 8 }, signal), []);
  return (
    <section className="mt-8 space-y-3">
      <h2 className="text-lg font-semibold">Recent activity</h2>
      {logs.status === "loading" && <TableSkeleton />}
      {logs.status === "error" && <ErrorState title="Could not load the activity" error={logs.error} onRetry={logs.reload} />}
      {logs.status === "success" && (
        <Table head={["When", "Who", "Action", "Result"]} caption="Recent activity">
          {logs.data.logs.map((log) => (
            <tr key={log.id}>
              <td className={td}>{new Date(log.createdAt).toLocaleString()}</td>
              <td className={td}>{log.actor?.email ?? "system"}</td>
              <td className={td}>
                <code>{log.action}</code>
              </td>
              <td className={td}>
                <StatusBadge status={log.outcome} />
              </td>
            </tr>
          ))}
        </Table>
      )}
    </section>
  );
}
