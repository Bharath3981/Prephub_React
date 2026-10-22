import { NavLink, Outlet } from "react-router";
import { useAuth, useCan, useUser } from "@/features/admin/auth/AuthProvider";
import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/Button";

interface NavItem {
  to: string;
  label: string;
  /** The user needs ANY of these permissions to see the link (and the page checks the same keys). */
  anyOf: string[];
  end?: boolean;
}

/** The single list that decides both the sidebar and (through <RequirePermission>) who may open each page. */
export const ADMIN_NAV: { heading: string; items: NavItem[] }[] = [
  { heading: "Overview", items: [{ to: "/admin", label: "Dashboard", anyOf: ["admin.access"], end: true }] },
  {
    heading: "Content",
    items: [
      { to: "/admin/categories", label: "Topics and sections", anyOf: ["category.view"] },
      { to: "/admin/tags", label: "Tags", anyOf: ["tag.view"] },
    ],
  },
  {
    heading: "People",
    items: [
      { to: "/admin/users", label: "Users", anyOf: ["user.manage", "user.view"] },
      { to: "/admin/roles", label: "Roles", anyOf: ["role.view", "user.manage"] },
    ],
  },
  {
    heading: "System",
    items: [
      { to: "/admin/settings", label: "Settings", anyOf: ["settings.view"] },
      { to: "/admin/audit", label: "Audit log", anyOf: ["audit.view"] },
      { to: "/admin/jobs", label: "Background jobs", anyOf: ["jobs.view"] },
    ],
  },
  { heading: "You", items: [{ to: "/admin/account", label: "My account", anyOf: ["admin.access"] }] },
];

/** The admin frame: sidebar with only the links the user may open, and the page on the right. */
export function AdminLayout() {
  const user = useUser();
  const { logout } = useAuth();
  const can = useCan();

  return (
    <div className="grid gap-8 lg:grid-cols-[14rem_1fr]">
      <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start">
        <div className="rounded-xl border border-border bg-surface p-3 text-sm">
          <p className="font-semibold">{user.name}</p>
          <p className="truncate text-xs text-muted">{user.email}</p>
          <p className="mt-1 text-xs text-muted">Role: {user.role}</p>
          <Button className="mt-3 w-full" variant="secondary" size="sm" onClick={() => void logout()}>
            Sign out
          </Button>
        </div>
        <nav aria-label="Admin" className="space-y-4">
          {ADMIN_NAV.map((group) => {
            const items = group.items.filter((item) => can(...item.anyOf));
            if (items.length === 0) return null;
            return (
              <div key={group.heading}>
                <p className="mb-1 px-3 text-xs font-bold uppercase tracking-wider">{group.heading}</p>
                <ul className="space-y-0.5">
                  {items.map((item) => (
                    <li key={item.to}>
                      <NavLink
                        to={item.to}
                        end={item.end}
                        className={({ isActive }) => cn("block rounded-lg px-3 py-2 text-sm", isActive ? "bg-accent-soft font-semibold text-accent-strong" : "text-muted hover:bg-surface-2 hover:text-foreground")}
                      >
                        {item.label}
                      </NavLink>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  );
}
