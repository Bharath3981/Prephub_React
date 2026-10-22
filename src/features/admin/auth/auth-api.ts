import { z } from "zod";
import { api } from "@/shared/api/client";
import { parseResponse } from "@/shared/api/parse";

/** The signed-in user. `permissions` are keys such as "entry.edit"; the UI uses them to show or hide things, the API still checks each call. */
export const authUserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  role: z.string(),
  permissions: z.array(z.string()),
});
export type AuthUser = z.infer<typeof authUserSchema>;

const userData = z.object({ user: authUserSchema });

export async function login(email: string, password: string): Promise<AuthUser> {
  const response = await api<unknown>("/auth/login", { method: "POST", body: { email, password } });
  return parseResponse(userData, response.data).user;
}

/** Who is signed in (from the cookie)? A 401 means nobody: the api client already tried a silent refresh. */
export async function getMe(signal?: AbortSignal): Promise<AuthUser> {
  const response = await api<unknown>("/auth/me", { signal });
  return parseResponse(userData, response.data).user;
}

export async function logout(): Promise<void> {
  await api("/auth/logout", { method: "POST" });
}

export const sessionSchema = z.object({
  id: z.string(),
  userAgent: z.string().nullable(),
  ipAddress: z.string().nullable(),
  createdAt: z.string(),
  lastUsedAt: z.string(),
  expiresAt: z.string(),
  current: z.boolean(),
});
export type Session = z.infer<typeof sessionSchema>;

export async function getSessions(signal?: AbortSignal): Promise<Session[]> {
  const response = await api<unknown>("/auth/sessions", { signal });
  return parseResponse(z.object({ sessions: z.array(sessionSchema) }), response.data).sessions;
}

export async function revokeSession(id: string): Promise<void> {
  await api(`/auth/sessions/${id}`, { method: "DELETE" });
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await api("/auth/change-password", { method: "POST", body: { currentPassword, newPassword } });
}

/** Asks for a reset link. The API answers the same whether or not the email exists, so nobody can probe for accounts. */
export async function forgotPassword(email: string): Promise<void> {
  await api("/auth/forgot-password", { method: "POST", body: { email } });
}

/** Sets the password with the one-use token from the emailed (or invite) link. */
export async function resetPassword(token: string, password: string): Promise<void> {
  await api("/auth/reset-password", { method: "POST", body: { token, password } });
}
