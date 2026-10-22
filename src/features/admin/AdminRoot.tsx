import { Outlet } from "react-router";

/** The /admin route tree. The auth provider lives higher up, in RootLayout, because the public header needs it too. */
export function AdminRoot() {
  return <Outlet />;
}
