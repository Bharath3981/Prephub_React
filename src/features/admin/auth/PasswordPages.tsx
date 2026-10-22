import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router";
import { forgotPassword, resetPassword } from "@/features/admin/auth/auth-api";
import { Notice } from "@/features/admin/ui";
import { useAction } from "@/shared/hooks/useAction";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { fieldErrors } from "@/shared/lib/field-errors";
import { Button, buttonClass } from "@/shared/ui/Button";
import { TextField } from "@/shared/ui/Field";

/** /admin/forgot-password: ask for a reset link by email. */
export function ForgotPasswordPage() {
  useDocumentTitle("Forgot password");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const send = useAction(async () => {
    await forgotPassword(email);
    return true;
  });
  const { fields, general } = fieldErrors(send.error);
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (await send.run()) setSent(true);
  };
  return (
    <div className="mx-auto max-w-sm space-y-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Forgot your password?</h1>
      {sent ? (
        <Notice tone="success">If that email belongs to an account, a reset link is on its way.</Notice>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <TextField label="Email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} error={fields.email} />
          {general && <Notice>{general}</Notice>}
          <Button type="submit" className="w-full" disabled={send.pending || !email}>
            Send the link
          </Button>
        </form>
      )}
      <Link to="/admin/login" className="text-sm text-accent hover:underline">
        Back to sign in
      </Link>
    </div>
  );
}

/** /admin/reset-password?token=...: choose a new password. The same page serves the invite link of a new account. */
export function ResetPasswordPage() {
  useDocumentTitle("Choose a password");
  const token = useSearchParams()[0].get("token") ?? "";
  const [password, setPassword] = useState("");
  const [again, setAgain] = useState("");
  const [done, setDone] = useState(false);
  const save = useAction(async () => {
    await resetPassword(token, password);
    return true;
  });
  const { fields, general } = fieldErrors(save.error);
  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (await save.run()) setDone(true);
  };
  return (
    <div className="mx-auto max-w-sm space-y-6 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Choose a password</h1>
      {!token ? (
        <Notice>This link is incomplete. Open the link from the email again.</Notice>
      ) : done ? (
        <div className="space-y-3">
          <Notice tone="success">Password saved. You can sign in now.</Notice>
          <Link to="/admin/login" className={buttonClass()}>
            Sign in
          </Link>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <TextField label="New password" type="password" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} error={fields.password} hint="At least 12 characters." />
          <TextField label="New password again" type="password" autoComplete="new-password" value={again} onChange={(event) => setAgain(event.target.value)} error={again && again !== password ? "The two passwords are different." : undefined} />
          {(general || fields.token) && <Notice>{fields.token ?? general}</Notice>}
          <Button type="submit" className="w-full" disabled={save.pending || password.length < 12 || password !== again}>
            Save password
          </Button>
        </form>
      )}
    </div>
  );
}
