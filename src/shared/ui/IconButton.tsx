import type { ButtonHTMLAttributes } from "react";
import { Link } from "react-router";
import { cn } from "@/shared/lib/cn";

/** Small outline icons (24x24 grid, 2px stroke, the Lucide style). Each is a list of SVG shapes. */
const ICONS = {
  pencil: ['<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/>', '<path d="m15 5 4 4"/>'],
  trash: ['<path d="M3 6h18"/>', '<path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>', '<path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>', '<path d="M10 11v6"/>', '<path d="M14 11v6"/>'],
  up: ['<path d="m5 12 7-7 7 7"/>', '<path d="M12 19V5"/>'],
  down: ['<path d="M12 5v14"/>', '<path d="m19 12-7 7-7-7"/>'],
  eye: ['<path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"/>', '<circle cx="12" cy="12" r="3"/>'],
  "eye-off": [
    '<path d="M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49"/>',
    '<path d="M14.084 14.158a3 3 0 0 1-4.242-4.242"/>',
    '<path d="M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143"/>',
    '<path d="m2 2 20 20"/>',
  ],
  info: ['<circle cx="12" cy="12" r="10"/>', '<path d="M12 16v-4"/>', '<path d="M12 8h.01"/>'],
  merge: ['<circle cx="18" cy="18" r="3"/>', '<circle cx="6" cy="6" r="3"/>', '<path d="M6 21V9a9 9 0 0 0 9 9"/>'],
  ban: ['<circle cx="12" cy="12" r="10"/>', '<path d="m4.9 4.9 14.2 14.2"/>'],
  check: ['<path d="M21.801 10A10 10 0 1 1 17 3.335"/>', '<path d="m9 11 3 3L22 4"/>'],
  "log-out": ['<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>', '<path d="m16 17 5-5-5-5"/>', '<path d="M21 12H9"/>'],
} as const;

export type IconName = keyof typeof ICONS;

/** Decorative: the button around it carries the accessible name. The shapes above are fixed strings in this file, never user data. */
export function Icon({ name, className }: { name: IconName; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={cn("size-4", className)}
      dangerouslySetInnerHTML={{ __html: ICONS[name].join("") }}
    />
  );
}

type Props = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "children" | "aria-label" | "title"> & {
  icon: IconName;
  /** What the button does, including its target ("Edit Admin"): the tooltip and the name screen readers announce. */
  label: string;
  tone?: "neutral" | "danger";
};

/** A square icon-only button for table rows. The label is both the tooltip (title) and the accessible name. */
export function IconButton({ icon, label, tone = "neutral", className, type = "button", ...props }: Props) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={cn(
        "inline-flex size-8 items-center justify-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        tone === "danger" ? "text-danger hover:bg-danger-soft" : "text-muted hover:bg-surface-2 hover:text-foreground",
        className,
      )}
      {...props}
    >
      <Icon name={icon} />
    </button>
  );
}

/** The same square icon, as a router link (for "open the editor"). */
export function IconLink({ icon, label, to }: { icon: IconName; label: string; to: string }) {
  return (
    <Link to={to} aria-label={label} title={label} className="inline-flex size-8 items-center justify-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-foreground">
      <Icon name={icon} />
    </Link>
  );
}
