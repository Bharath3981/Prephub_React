import { useState } from "react";
import { mget, msend } from "@/features/admin/admin-api";
import { useCan } from "@/features/admin/auth/AuthProvider";
import { settingsData, type AdminSetting } from "@/features/admin/schemas";
import { Notice, PageHeader, TableSkeleton } from "@/features/admin/ui";
import { useAction } from "@/shared/hooks/useAction";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { useFetch } from "@/shared/hooks/useFetch";
import { fieldErrors } from "@/shared/lib/field-errors";
import { Badge } from "@/shared/ui/Badge";
import { Button } from "@/shared/ui/Button";
import { ErrorState } from "@/shared/ui/ErrorState";
import { TextAreaField, TextField } from "@/shared/ui/Field";

/** /admin/settings: site settings. Each one saves on its own; "Reset" sends null, which means "go back to the default". */
export function SettingsPage() {
  useDocumentTitle("Settings · Admin");
  const settings = useFetch((signal) => mget(settingsData, "/settings", undefined, signal), []);
  return (
    <div>
      <PageHeader title="Settings" crumbs={[{ label: "Settings" }]} description="Public settings are also shown on the public site." />
      {settings.status === "loading" && <TableSkeleton />}
      {settings.status === "error" && <ErrorState title="Could not load the settings" error={settings.error} onRetry={settings.reload} />}
      {settings.status === "success" && (
        <ul className="space-y-4">
          {settings.data.settings.map((setting) => (
            // key includes updatedAt: after a save the row starts again from the saved value.
            <SettingRow key={`${setting.key}:${setting.updatedAt}`} setting={setting} onSaved={settings.reload} />
          ))}
        </ul>
      )}
    </div>
  );
}

/** How a value is edited: numbers and text as one line, anything else (objects, booleans) as JSON. */
const asText = (value: unknown) => (typeof value === "string" ? value : typeof value === "number" ? String(value) : JSON.stringify(value, null, 2));

function SettingRow({ setting, onSaved }: { setting: AdminSetting; onSaved: () => void }) {
  const can = useCan();
  const kind = typeof setting.default === "string" ? "text" : typeof setting.default === "number" ? "number" : "json";
  const [text, setText] = useState(asText(setting.value));
  const [parseError, setParseError] = useState<string | null>(null);
  const canEdit = can("settings.manage");

  const save = useAction(async (value: unknown) => {
    await msend(null, "PATCH", "/settings", { values: { [setting.key]: value } });
    return true;
  });
  const { fields, general } = fieldErrors(save.error);
  const message = parseError ?? fields[`values.${setting.key}`] ?? general;

  const submit = async () => {
    let value: unknown = text;
    if (kind === "number") value = Number(text);
    if (kind === "json") {
      try {
        value = JSON.parse(text);
      } catch {
        return setParseError("This is not valid JSON.");
      }
    }
    setParseError(null);
    if (await save.run(value)) onSaved();
  };

  return (
    <li className="space-y-2 rounded-xl border border-border bg-surface p-4">
      <div className="flex flex-wrap items-center gap-2">
        <code className="font-semibold">{setting.key}</code>
        {setting.public ? <Badge tone="accent">public</Badge> : <Badge>private</Badge>}
        {setting.isDefault && <Badge>default</Badge>}
      </div>
      <p className="text-sm text-muted">{setting.description}</p>
      {kind === "json" ? (
        <TextAreaField label="Value (JSON)" rows={4} className="font-mono" value={text} disabled={!canEdit} onChange={(event) => setText(event.target.value)} error={message ?? undefined} spellCheck={false} />
      ) : (
        <TextField label="Value" type={kind === "number" ? "number" : "text"} value={text} disabled={!canEdit} onChange={(event) => setText(event.target.value)} error={message ?? undefined} />
      )}
      {canEdit && (
        <div className="flex gap-2">
          <Button size="sm" disabled={save.pending || text === asText(setting.value)} onClick={() => void submit()}>
            Save
          </Button>
          <Button
            size="sm"
            variant="secondary"
            disabled={save.pending || setting.isDefault}
            onClick={async () => {
              if (await save.run(null)) onSaved();
            }}
          >
            Reset to default
          </Button>
        </div>
      )}
      {setting.updatedAt && <p className="text-xs text-muted">Changed {new Date(setting.updatedAt).toLocaleString()}</p>}
    </li>
  );
}
