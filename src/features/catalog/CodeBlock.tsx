import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/Button";

type CopyState = "idle" | "copied" | "failed";

/**
 * A code sample from an entry: a header with the language and a Copy button, then the code.
 *
 * The code is shown as plain text at once, and highlighted a moment later when the highlighter has loaded (it is a separate
 * file, fetched only when a page has code). Showing the text first means the page never waits for the highlighter and
 * never jumps: plain and highlighted code take the same space.
 */
export function CodeBlock({ code, language }: { code: string; language: string | null }) {
  const [html, setHtml] = useState<string | null>(null);
  const [copy, setCopy] = useState<CopyState>("idle");

  useEffect(() => {
    if (!language) return;
    let cancelled = false; // the entry changed before the highlighter answered: ignore the late answer
    import("@/shared/lib/highlight")
      .then((module) => module.highlight(code, language))
      .then((result) => {
        if (!cancelled) setHtml(result);
      })
      .catch(() => {
        // the highlighter is only decoration: if it fails to load, the plain code stays
      });
    return () => {
      cancelled = true;
    };
  }, [code, language]);

  // "Copied" goes back to "Copy" after a moment. The cleanup cancels the timer if the block disappears first.
  useEffect(() => {
    if (copy === "idle") return;
    const timer = setTimeout(() => setCopy("idle"), 1800);
    return () => clearTimeout(timer);
  }, [copy]);

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(code);
      setCopy("copied");
    } catch {
      setCopy("failed"); // no permission, or an insecure page
    }
  }

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span>{language ?? "code"}</span>
        <Button variant="ghost" size="sm" onClick={copyCode} aria-label="Copy code">
          {copy === "copied" ? "Copied" : copy === "failed" ? "Could not copy" : "Copy"}
        </Button>
        <span className="sr-only" role="status">
          {copy === "copied" ? "Code copied to the clipboard" : copy === "failed" ? "Could not copy the code" : ""}
        </span>
      </div>
      {/* tabIndex 0: a box that scrolls sideways must be reachable with the keyboard */}
      <pre tabIndex={0}>
        {html ? <code className="hljs" dangerouslySetInnerHTML={{ __html: html }} /> : <code>{code}</code>}
      </pre>
    </div>
  );
}
