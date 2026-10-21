import { useMemo } from "react";
import { htmlToReact } from "@/features/catalog/html-to-react";

/**
 * The body of an entry: HTML from the API, sanitised, then turned into React elements (code samples become CodeBlock).
 * Done once per body (useMemo), not on every render. Links to our own pages are router links (see html-to-react.tsx).
 */
export function EntryBody({ html }: { html: string }) {
  const content = useMemo(() => htmlToReact(html), [html]);
  return <div className="entry-body">{content}</div>;
}
