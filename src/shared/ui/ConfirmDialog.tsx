import type { ReactNode } from "react";
import { useAction } from "@/shared/hooks/useAction";
import { fieldErrors } from "@/shared/lib/field-errors";
import { Button } from "@/shared/ui/Button";
import { Modal } from "@/shared/ui/Modal";

/** "Are you sure?" for an action that cannot be undone. Closes itself when the action succeeds; shows the API's message when it fails. */
export function ConfirmDialog({
  title,
  confirmLabel,
  danger = true,
  onConfirm,
  onClose,
  children,
}: {
  title: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => Promise<unknown>;
  onClose: () => void;
  children: ReactNode;
}) {
  // `true` marks success: run() returns undefined on failure, and a delete has no other result to tell them apart.
  const action = useAction(async () => {
    await onConfirm();
    return true;
  });
  const { general } = fieldErrors(action.error);
  return (
    <Modal title={title} onClose={onClose}>
      <div className="space-y-3 text-sm">{children}</div>
      {general && (
        <p role="alert" className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          {general}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button
          variant={danger ? "danger" : "primary"}
          disabled={action.pending}
          onClick={async () => {
            if (await action.run()) onClose();
          }}
        >
          {action.pending ? "Working..." : confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
