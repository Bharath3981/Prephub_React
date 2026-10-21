import { useMemo, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import { sanitizeHtml } from "@/shared/lib/sanitize-html";

/**
 * The body of an entry: HTML from the API, cleaned first, then put into the page.
 *
 * dangerouslySetInnerHTML is named that way on purpose: React no longer protects this part of the page, so the only thing
 * between the server text and the visitor's browser is sanitizeHtml(). It runs once per body (useMemo), not on every render.
 */
export function EntryBody({ html }: { html: string }) {
  const clean = useMemo(() => sanitizeHtml(html), [html]);
  const navigate = useNavigate();

  // The HTML is not React, so its links are plain <a> tags that would reload the whole app. One listener on the container
  // sends clicks on links to our own pages through the router instead. (A keyboard Enter on a link also arrives as a click.)
  function onClick(event: MouseEvent<HTMLDivElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest("a");
    if (!link || !event.currentTarget.contains(link) || link.target) return;
    const href = link.getAttribute("href");
    if (!href || !href.startsWith("/") || href.startsWith("//")) return; // other sites: let the browser handle it
    event.preventDefault();
    navigate(href);
  }

  // eslint-disable-next-line react/no-danger
  return <div className="entry-body" onClick={onClick} dangerouslySetInnerHTML={{ __html: clean }} />;
}
