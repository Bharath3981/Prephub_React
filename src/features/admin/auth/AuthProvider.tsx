import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { setSessionExpiredHandler } from "@/shared/api/client";
import { ApiRequestError } from "@/shared/api/client";
import { getMe, login as loginRequest, logout as logoutRequest, type AuthUser } from "@/features/admin/auth/auth-api";

/**
 * Who is signed in. The tokens are NOT here: they are httpOnly cookies that JavaScript cannot read. React only keeps the
 * user the API described (name, role, permission keys) so the screen can show the right things.
 *
 *   loading        we are asking /auth/me (so the page does not flash the login form for a signed-in person)
 *   anonymous      nobody is signed in
 *   authenticated  `user` is set
 */
type AuthState =
  | { status: "loading" }
  | { status: "anonymous"; failure?: Error }
  | { status: "authenticated"; user: AuthUser };

interface AuthContextValue {
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    const controller = new AbortController();
    getMe(controller.signal).then(
      (user) => setState({ status: "authenticated", user }),
      (error: unknown) => {
        if (controller.signal.aborted) return;
        // 401 is the normal "not signed in". Anything else (server down) is shown on the login page, not hidden.
        const unexpected = error instanceof ApiRequestError && error.status === 401 ? undefined : error instanceof Error ? error : new Error(String(error));
        setState({ status: "anonymous", failure: unexpected });
      },
    );
    return () => controller.abort();
  }, []);

  // The api client calls this when a refresh failed (the refresh cookie expired or was revoked): back to the login page.
  useEffect(() => {
    setSessionExpiredHandler(() => setState({ status: "anonymous" }));
    return () => setSessionExpiredHandler(undefined);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const user = await loginRequest(email, password);
    setState({ status: "authenticated", user });
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setState({ status: "anonymous" }); // even if the request failed, this browser no longer shows the admin
    }
  }, []);

  // One stable object, so components that read the context render only when the state really changes.
  const value = useMemo(() => ({ state, login, logout }), [state, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside <AuthProvider>");
  return value;
}

/** The signed-in user. Only call it below <RequireAuth>, where a user always exists. */
export function useUser(): AuthUser {
  const { state } = useAuth();
  if (state.status !== "authenticated") throw new Error("useUser needs a signed-in user");
  return state.user;
}

/** `can("entry.edit")`: does the user hold the permission? True if they hold ANY of several keys. Permissions, never role names. */
export function useCan(): (...permissions: string[]) => boolean {
  const { state } = useAuth();
  const held = state.status === "authenticated" ? state.user.permissions : undefined;
  return useCallback((...permissions: string[]) => !!held && permissions.some((key) => held.includes(key)), [held]);
}
