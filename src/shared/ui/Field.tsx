import { useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/shared/lib/cn";

export const controlClass =
  "w-full rounded-lg border border-border bg-surface px-3 text-sm placeholder:text-muted focus:border-accent focus:outline-none disabled:opacity-60 aria-[invalid=true]:border-danger";

interface FieldProps {
  label: string;
  /** The message for this field (from the form's own checks or from the API). */
  error?: string;
  hint?: string;
  className?: string;
  /** Receives the props that tie the control to the label, the hint and the error. */
  children: (props: { id: string; "aria-invalid": boolean; "aria-describedby": string | undefined }) => ReactNode;
}

/** Label + control + hint + error message, wired together for screen readers. */
export function Field({ label, error, hint, className, children }: FieldProps) {
  const id = useId();
  const noteId = `${id}-note`;
  return (
    <div className={cn("space-y-1", className)}>
      <label htmlFor={id} className="block text-sm font-medium">
        {label}
      </label>
      {children({ id, "aria-invalid": !!error, "aria-describedby": error || hint ? noteId : undefined })}
      {(error || hint) && (
        <p id={noteId} className={cn("text-xs", error ? "text-danger" : "text-muted")}>
          {error ?? hint}
        </p>
      )}
    </div>
  );
}

export function TextField({ label, error, hint, className, ...input }: Omit<InputHTMLAttributes<HTMLInputElement>, "children"> & Omit<FieldProps, "children">) {
  return <Field label={label} error={error} hint={hint} className={className}>{(aria) => <input {...aria} {...input} className={cn(controlClass, "h-10")} />}</Field>;
}

export function TextAreaField({ label, error, hint, className, ...area }: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "children"> & Omit<FieldProps, "children">) {
  return <Field label={label} error={error} hint={hint} className={className}>{(aria) => <textarea {...aria} {...area} className={cn(controlClass, "py-2")} />}</Field>;
}

export function SelectField({ label, error, hint, className, children, ...select }: SelectHTMLAttributes<HTMLSelectElement> & Omit<FieldProps, "children"> & { children: ReactNode }) {
  return <Field label={label} error={error} hint={hint} className={className}>{(aria) => <select {...aria} {...select} className={cn(controlClass, "h-10 cursor-pointer appearance-none bg-[length:1rem] bg-[right_0.6rem_center] bg-no-repeat pr-9", "select-chevron")}>{children}</select>}</Field>;
}

export function CheckboxField({ label, hint, ...input }: Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "children"> & { label: string; hint?: string }) {
  return (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" {...input} className="mt-0.5 size-4 accent-[var(--accent)]" />
      <span>
        {label}
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}
