import { Link, Navigate, Outlet, useLocation } from "react-router";
import { useAuth, useCan } from "@/features/admin/auth/AuthProvider";
import { buttonClass } from "@/shared/ui/Button";

/** Only same-site /admin paths are allowed as a return address, so a crafted ?next=https://evil.example cannot send anyone away. */
export const safeNext = (next: string | null): string => (next && /^\/admin(\/|$|\?)/.test(next) && !next.startsWith("//") ? next : "/admin");

/** The layout of every admin page except login: signed in, or off to /admin/login (and back afterwards). */
export function RequireAuth() {
  const { state } = useAuth();
  const location = useLocation();
  const can = useCan();

  if (state.status === "loading") return <p role="status" className="p-8 text-muted">Checking your session...</p>;
  if (state.status === "anonymous") return <Navigate to={`/admin/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  // Admin area needs admin.access; a signed-in visitor without it gets an explanation, not a broken page.
  if (!can("admin.access")) return <NoAccess />;
  return <Outlet />;
}

/** For a page inside the admin: shows `children` only with the permission (any of the keys), else the "no access" page. */
export function RequirePermission({ anyOf, children }: { anyOf: string[]; children: React.ReactNode }) {
  const can = useCan();
  return can(...anyOf) ? <>{children}</> : <NoAccess />;
}

export function NoAccess() {
  return (
    <div className="space-y-3 py-10">
      <h1 className="text-2xl font-bold">No access</h1>
      <p className="text-muted">Your account does not have the permission for this page. Ask an admin if you need it.</p>
      <Link to="/admin" className={buttonClass("secondary")}>
        Back to the dashboard
      </Link>
    </div>
  );
}
