import { useEffect, useRef, type ReactNode } from "react";
import { Button } from "@/shared/ui/Button";

/**
 * A dialog on the browser's own <dialog> element: it traps focus, closes on Escape, dims the page, and screen readers
 * announce it as a dialog. Render it only while it is open (`{open && <Modal ...>}`), so each opening starts fresh.
 */
export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    if (element && !element.open) element.showModal();
    // No close() in a cleanup: Strict Mode runs effects twice in development, and close() fires the "close" event,
    // which would call onClose and shut the dialog the moment it opened. A removed <dialog> releases the page by itself.
  }, []);

  return (
    <dialog
      ref={dialog}
      aria-label={title}
      onClose={onClose}
      onClick={(event) => event.target === dialog.current && onClose()} // a click on the dimmed backdrop
      className={`m-auto w-[calc(100%-2rem)] ${wide ? "max-w-3xl" : "max-w-lg"} rounded-xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/50`}
    >
      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            ✕
          </Button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
