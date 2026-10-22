import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router";
import { mget, msend } from "@/features/admin/admin-api";
import { useCan } from "@/features/admin/auth/AuthProvider";
import { entryData, previewData, sectionData, type AdminEntry, type AdminSection } from "@/features/admin/schemas";
import { Notice, PageHeader, StatusBadge } from "@/features/admin/ui";
import { EntryBody } from "@/features/catalog/EntryBody";
import { useAction } from "@/shared/hooks/useAction";
import { useDebouncedValue } from "@/shared/hooks/useDebouncedValue";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useFetch } from "@/shared/hooks/useFetch";
import { fieldErrors } from "@/shared/lib/field-errors";
import { slugify } from "@/shared/lib/slugify";
import { Button } from "@/shared/ui/Button";
import { ErrorState } from "@/shared/ui/ErrorState";
import { SelectField, TextAreaField, TextField } from "@/shared/ui/Field";
import { Skeleton } from "@/shared/ui/Skeleton";

/**
 * /admin/sections/:sectionId/entries/new and /admin/entries/:entryId.
 * Loads what the form needs (the entry when editing, and the section, whose KIND decides the extra fields), then
 * mounts <EntryForm>. The form is a separate component so its fields start from the loaded values (no "reset" effects).
 */
export function EntryEditPage() {
  const params = useParams();
  const entryId = params.entryId;
  const entry = useFetch((signal) => (entryId ? mget(entryData, `/entries/${entryId}`, undefined, signal) : Promise.resolve(null)), [entryId]);
  const sectionId = entryId ? (entry.status === "success" ? entry.data?.entry.sectionId : undefined) : params.sectionId;
  const section = useFetch((signal) => (sectionId ? mget(sectionData, `/sections/${sectionId}`, undefined, signal) : Promise.resolve(null)), [sectionId]);

  useDocumentTitle(entryId ? "Edit entry · Admin" : "New entry · Admin");

  if (entry.status === "error") return <ErrorState title="Could not load the entry" error={entry.error} onRetry={entry.reload} />;
  if (section.status === "error") return <ErrorState title="Could not load the section" error={section.error} onRetry={section.reload} />;
  if (entry.status === "loading" || section.status === "loading" || !section.data) return <Skeleton className="h-64 w-full" />;

  return <EntryForm key={entry.data?.entry.id ?? "new"} entry={entry.data?.entry ?? null} section={section.data.section} />;
}

/** meta fields as plain strings while editing; turned into the API's object on save. */
function metaToForm(meta: Record<string, unknown> | null) {
  const text = (value: unknown) => (typeof value === "string" ? value : "");
  return {
    group: text(meta?.group),
    readingMinutes: typeof meta?.readingMinutes === "number" ? String(meta.readingMinutes) : "",
    followUps: Array.isArray(meta?.followUps) ? (meta.followUps as string[]).join("\n") : "",
    scenario: text(meta?.scenario),
    language: text(meta?.language),
  };
}

function EntryForm({ entry, section }: { entry: AdminEntry | null; section: AdminSection }) {
  const navigate = useNavigate();
  const can = useCan();
  const kind = section.kind;

  const [title, setTitle] = useState(entry?.title ?? "");
  const [slug, setSlug] = useState(entry?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(entry !== null);
  const [summary, setSummary] = useState(entry?.summary ?? "");
  const [body, setBody] = useState(entry?.body ?? "");
  const [difficulty, setDifficulty] = useState(entry?.difficulty ?? "");
  const [tags, setTags] = useState(entry?.tags.map((tag) => tag.name).join(", ") ?? "");
  const [meta, setMeta] = useState(metaToForm(entry?.meta ?? null));
  const [status, setStatus] = useState(entry?.status);
  const [saved, setSaved] = useState(false);

  const save = useAction(async () => {
    const metaBody: Record<string, unknown> = {};
    if (meta.group.trim()) metaBody.group = meta.group.trim();
    if (kind === "CONCEPT" && meta.readingMinutes) metaBody.readingMinutes = Number(meta.readingMinutes);
    if (kind === "QUESTION") {
      const followUps = meta.followUps.split("\n").map((line) => line.trim()).filter(Boolean);
      if (followUps.length) metaBody.followUps = followUps;
    }
    if (kind === "EXAMPLE") {
      if (meta.scenario.trim()) metaBody.scenario = meta.scenario.trim();
      if (meta.language.trim()) metaBody.language = meta.language.trim();
    }
    const payload = {
      title,
      slug,
      summary: summary.trim() || null,
      body,
      difficulty: kind === "QUESTION" && difficulty ? difficulty : null,
      meta: metaBody,
      tags: tags.split(",").map((name) => name.trim()).filter(Boolean),
    };
    if (entry) return (await msend(entryData, "PATCH", `/entries/${entry.id}`, payload)).entry;
    return (await msend(entryData, "POST", `/sections/${section.id}/entries`, payload)).entry;
  });
  const publish = useAction(async () => {
    if (!entry) return;
    await msend(null, "POST", `/entries/${entry.id}/${status === "PUBLISHED" ? "unpublish" : "publish"}`);
    setStatus(status === "PUBLISHED" ? "DRAFT" : "PUBLISHED");
  });
  const { fields, general } = fieldErrors(save.error);

  const onSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSaved(false);
    const result = await save.run();
    if (!result) return;
    if (entry) setSaved(true);
    else navigate(`/admin/entries/${result.id}`, { replace: true });
  };

  const setMetaField = (key: keyof typeof meta) => (event: { target: { value: string } }) => setMeta((current) => ({ ...current, [key]: event.target.value }));

  return (
    <div>
      <PageHeader
        title={entry ? "Edit entry" : "New entry"}
        crumbs={[{ label: "Topics", to: "/admin/categories" }, { label: section.name, to: `/admin/sections/${section.id}/entries` }, { label: entry ? entry.title : "New" }]}
        action={
          entry && (
            <div className="flex items-center gap-2">
              {status && <StatusBadge status={status} />}
              {can("entry.publish") && (
                <Button variant="secondary" disabled={publish.pending} onClick={() => void publish.run()}>
                  {status === "PUBLISHED" ? "Unpublish" : "Publish"}
                </Button>
              )}
            </div>
          )
        }
      />
      {publish.error && <Notice>{fieldErrors(publish.error).general}</Notice>}
      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <p className="text-sm text-muted">
          Section kind: <b>{kind.toLowerCase()}</b>
        </p>
        <TextField
          label="Title"
          value={title}
          required
          error={fields.title}
          onChange={(event) => {
            setTitle(event.target.value);
            if (!slugTouched) setSlug(slugify(event.target.value).slice(0, 80));
          }}
        />
        <TextField
          label="Slug"
          value={slug}
          required
          error={fields.slug}
          hint="The address of the entry page."
          onChange={(event) => {
            setSlug(event.target.value);
            setSlugTouched(true);
          }}
        />
        <TextAreaField label="Summary" rows={2} maxLength={300} value={summary} onChange={(event) => setSummary(event.target.value)} error={fields.summary} hint="One or two sentences for the list cards (up to 300 characters)." />

        {kind === "QUESTION" && (
          <SelectField label="Difficulty" value={difficulty} onChange={(event) => setDifficulty(event.target.value as typeof difficulty)} error={fields.difficulty}>
            <option value="">None</option>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </SelectField>
        )}

        <MarkdownEditor value={body} onChange={setBody} error={fields.body} />

        <TextField label="Tags" value={tags} onChange={(event) => setTags(event.target.value)} error={fields.tags} hint="Names separated by commas, at most 10. New names create new tags." />

        <fieldset className="space-y-3 rounded-xl border border-border p-4">
          <legend className="px-1 text-sm font-medium">Extra fields for a {kind.toLowerCase()}</legend>
          <TextField label="Group" value={meta.group} onChange={setMetaField("group")} error={fields["meta.group"]} hint="The heading the side panel files this entry under." />
          {kind === "CONCEPT" && <TextField label="Reading minutes" type="number" min={1} max={120} value={meta.readingMinutes} onChange={setMetaField("readingMinutes")} error={fields["meta.readingMinutes"]} />}
          {kind === "QUESTION" && <TextAreaField label="Follow-up questions" rows={4} value={meta.followUps} onChange={setMetaField("followUps")} error={fields["meta.followUps"]} hint="One per line, at most 10." />}
          {kind === "EXAMPLE" && (
            <>
              <TextAreaField label="Scenario" rows={2} value={meta.scenario} onChange={setMetaField("scenario")} error={fields["meta.scenario"]} />
              <TextField label="Language" value={meta.language} onChange={setMetaField("language")} error={fields["meta.language"]} hint="For example typescript" />
            </>
          )}
        </fieldset>

        {entry && entry.related.length > 0 && (
          <p className="text-sm text-muted">
            Related entries (kept as they are): {entry.related.map((related) => related.title).join(", ")}
          </p>
        )}

        {general && <Notice>{general}</Notice>}
        {saved && <Notice tone="success">Saved.</Notice>}
        <div className="flex gap-2">
          <Button type="submit" disabled={save.pending || !title || !slug || !body}>
            {save.pending ? "Saving..." : entry ? "Save changes" : "Create entry"}
          </Button>
          <Button variant="secondary" onClick={() => navigate(`/admin/sections/${section.id}/entries`)}>
            Back to the list
          </Button>
        </div>
      </form>
    </div>
  );
}

/** Markdown on the left, the rendered result (from the API's own renderer, so it matches the site) on the right. */
function MarkdownEditor({ value, onChange, error }: { value: string; onChange: (value: string) => void; error?: string }) {
  const debounced = useDebouncedValue(value, 600);
  const [html, setHtml] = useState("");
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    if (!debounced.trim()) {
      setHtml("");
      return;
    }
    const controller = new AbortController();
    msend(previewData, "POST", "/markdown/preview", { markdown: debounced }).then(
      (result) => {
        if (controller.signal.aborted) return;
        setHtml(result.html);
        setFailed(null);
      },
      (caught: unknown) => !controller.signal.aborted && setFailed(caught instanceof Error ? caught.message : "Preview failed"),
    );
    return () => controller.abort();
  }, [debounced]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <TextAreaField label="Body (Markdown)" rows={18} value={value} onChange={(event) => onChange(event.target.value)} error={error} className="font-mono" spellCheck={false} />
      <div className="space-y-1">
        <p className="text-sm font-medium">Preview</p>
        <div className="max-h-[28rem] overflow-auto rounded-lg border border-border bg-surface p-4">
          {failed ? <Notice>{failed}</Notice> : html ? <EntryBody html={html} editor={false} /> : <p className="text-sm text-muted">Nothing to preview yet.</p>}
        </div>
      </div>
    </div>
  );
}
