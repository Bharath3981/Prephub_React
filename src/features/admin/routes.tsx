import type { RouteObject } from "react-router";
import { AdminLayout } from "@/features/admin/AdminLayout";
import { AdminRoot } from "@/features/admin/AdminRoot";
import { RequireAuth, RequirePermission } from "@/features/admin/auth/RequireAuth";
import { RouteError } from "@/app/RouteError";

/**
 * A page that is downloaded only when someone opens it (so the public site does not carry the admin code) and that
 * needs one of the permissions. `load` is the dynamic import; `name` is the exported component.
 */
function page<M extends Record<string, unknown>>(path: string, load: () => Promise<M>, name: keyof M & string, anyOf: string[]): RouteObject {
  const lazy: RouteObject["lazy"] = async () => {
    const Page = (await load())[name] as React.ComponentType;
    return {
      Component: () => (
        <RequirePermission anyOf={anyOf}>
          <Page />
        </RequirePermission>
      ),
    };
  };
  return path === "" ? { index: true, lazy } : { path, lazy };
}

/**
 * /reset-password and /forgot-password at the ROOT: the API builds its invite and reset emails as WEB_URL/reset-password?token=...
 * (the same address the Next.js app uses), so this app answers there too. The /admin/... copies are for links inside the admin.
 */
export const rootPasswordRoutes: RouteObject[] = [
  { path: "reset-password", lazy: async () => ({ Component: (await import("@/features/admin/auth/PasswordPages")).ResetPasswordPage }) },
  { path: "forgot-password", lazy: async () => ({ Component: (await import("@/features/admin/auth/PasswordPages")).ForgotPasswordPage }) },
];

/** /admin/...: login (open to everyone) and, behind <RequireAuth>, every other admin page inside the sidebar layout. */
export const adminRoute: RouteObject = {
  path: "admin",
  element: <AdminRoot />,
  errorElement: <RouteError />,
  children: [
    { path: "forgot-password", lazy: async () => ({ Component: (await import("@/features/admin/auth/PasswordPages")).ForgotPasswordPage }) },
    { path: "reset-password", lazy: async () => ({ Component: (await import("@/features/admin/auth/PasswordPages")).ResetPasswordPage }) },
    { path: "login", lazy: async () => ({ Component: (await import("@/features/admin/auth/LoginPage")).LoginPage }) },
    {
      element: <RequireAuth />,
      children: [
        {
          element: <AdminLayout />,
          errorElement: <RouteError />,
          children: [
            page("", () => import("@/features/admin/pages/DashboardPage"), "DashboardPage", ["admin.access"]),
            page("account", () => import("@/features/admin/pages/AccountPage"), "AccountPage", ["admin.access"]),
            page("categories", () => import("@/features/admin/pages/CategoriesPage"), "CategoriesPage", ["category.view"]),
            page("categories/:categoryId/sections", () => import("@/features/admin/pages/SectionsPage"), "SectionsPage", ["section.view"]),
            page("sections/:sectionId/entries", () => import("@/features/admin/pages/EntriesPage"), "EntriesPage", ["entry.view"]),
            page("sections/:sectionId/entries/new", () => import("@/features/admin/pages/EntryEditPage"), "EntryEditPage", ["entry.create"]),
            page("entries/:entryId", () => import("@/features/admin/pages/EntryEditPage"), "EntryEditPage", ["entry.view"]),
            page("tags", () => import("@/features/admin/pages/TagsPage"), "AdminTagsPage", ["tag.view"]),
            page("users", () => import("@/features/admin/pages/UsersPage"), "UsersPage", ["user.manage", "user.view"]),
            page("roles", () => import("@/features/admin/pages/RolesPage"), "RolesPage", ["role.view", "user.manage"]),
            page("settings", () => import("@/features/admin/pages/SettingsPage"), "SettingsPage", ["settings.view"]),
            page("audit", () => import("@/features/admin/pages/AuditPage"), "AuditPage", ["audit.view"]),
            page("jobs", () => import("@/features/admin/pages/JobsPage"), "JobsPage", ["jobs.view"]),
          ],
        },
      ],
    },
  ],
};
