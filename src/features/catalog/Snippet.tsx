/** HTML entities the API may leave in a snippet, turned back into characters. We never put the snippet in as HTML. */
const ENTITIES: Record<string, string> = { "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"', "&#39;": "'" };
const decode = (text: string) => text.replace(/&(amp|lt|gt|quot|#39);/g, (entity) => ENTITIES[entity]);

/**
 * A search snippet: text with the matches wrapped in <mark>. We do NOT use dangerouslySetInnerHTML for it. The text is
 * split on the mark tags and every piece is drawn as plain text (React escapes it), so nothing in a snippet can ever run.
 */
export function Snippet({ text }: { text: string }) {
  const parts = text.split(/<mark>(.*?)<\/mark>/gs); // odd positions are the matches
  return (
    <p className="line-clamp-3 text-sm text-muted">
      {parts.map((part, i) => (i % 2 === 1 ? <mark key={i} className="rounded bg-accent-soft px-0.5 text-foreground">{decode(part)}</mark> : decode(part)))}
    </p>
  );
}
