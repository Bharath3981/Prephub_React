import { useState, type FormEvent } from "react";
import { Link, Navigate, useSearchParams } from "react-router";
import { useAuth } from "@/features/admin/auth/AuthProvider";
import { safeNext } from "@/features/admin/auth/RequireAuth";
import { useAction } from "@/shared/hooks/useAction";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { fieldErrors } from "@/shared/lib/field-errors";
import { Button } from "@/shared/ui/Button";
import { TextField } from "@/shared/ui/Field";

/** /admin/login. After a good login we go back to where the visitor was heading (?next=...), checked by safeNext. */
export function LoginPage() {
  useDocumentTitle("Sign in");
  const { state, login } = useAuth();
  const [params] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submit = useAction(login);
  const { fields, general } = fieldErrors(submit.error);

  if (state.status === "authenticated") return <Navigate to={safeNext(params.get("next"))} replace />;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submit.run(email, password); // on success the state changes and the <Navigate> above runs
  };

  return (
    <div className="mx-auto max-w-sm space-y-6 py-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold tracking-tight">Sign in</h1>
        <p className="text-sm text-muted">Staff accounts only. An admin creates them.</p>
      </header>
      {state.status === "anonymous" && state.failure && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          Could not check your session: {state.failure.message}
        </p>
      )}
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <TextField label="Email" type="email" autoComplete="username" required value={email} onChange={(event) => setEmail(event.target.value)} error={fields.email} />
        <TextField label="Password" type="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} error={fields.password} />
        {general && (
          <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
            {general}
          </p>
        )}
        <Button type="submit" className="w-full" disabled={submit.pending || !email || !password}>
          {submit.pending ? "Signing in..." : "Sign in"}
        </Button>
        <p className="text-center text-sm">
          <Link to="/admin/forgot-password" className="text-accent hover:underline">
            Forgot your password?
          </Link>
        </p>
      </form>
    </div>
  );
}
