"use client";

import { useOptimistic, useState, useTransition, type FormEvent } from "react";
import { Button } from "@workspace/ui";
import type { OrganizationSettingUpdateActionResult } from "../_actions/organization-setting.action";
import type { OrganizationSettings, OrganizationSettingsPatch } from "@/lib/api/organization-settings";

type EditableSettings = Readonly<{
  timeZone: string;
  weekStart: "Monday" | "Sunday";
  dateFormat: "DD/MM/YYYY" | "MM/DD/YYYY" | "YYYY-MM-DD";
  workspaceSetupRule: "owner only" | "any member";
}>;

type ConflictState = Readonly<{
  current: Readonly<{ settings: OrganizationSettings; version: number }> | null;
  attempted: OrganizationSettingsPatch;
}>;

const toEditableSettings = (settings: OrganizationSettings): EditableSettings => ({
  timeZone: settings.timeZone.value,
  weekStart: settings.weekStart.value,
  dateFormat: settings.dateFormat.value,
  workspaceSetupRule: settings.workspaceSetupRule.value
});

const patchBetween = (current: EditableSettings, next: EditableSettings): OrganizationSettingsPatch => ({
  ...(current.timeZone === next.timeZone ? {} : { timeZone: next.timeZone }),
  ...(current.weekStart === next.weekStart ? {} : { weekStart: next.weekStart }),
  ...(current.dateFormat === next.dateFormat ? {} : { dateFormat: next.dateFormat }),
  ...(current.workspaceSetupRule === next.workspaceSetupRule ? {} : { workspaceSetupRule: next.workspaceSetupRule })
});

const applyPatch = (current: OrganizationSettings, patch: OrganizationSettingsPatch): OrganizationSettings => ({
  ...current,
  ...(patch.timeZone === undefined ? {} : { timeZone: { value: patch.timeZone, source: "owner" as const } }),
  ...(patch.weekStart === undefined ? {} : { weekStart: { value: patch.weekStart, source: "owner" as const } }),
  ...(patch.dateFormat === undefined ? {} : { dateFormat: { value: patch.dateFormat, source: "owner" as const } }),
  ...(patch.workspaceSetupRule === undefined ? {} : { workspaceSetupRule: { value: patch.workspaceSetupRule, source: "owner" as const } })
});

const updateFromAction = (result: OrganizationSettingUpdateActionResult, previous: OrganizationSettings): Readonly<{
  status: OrganizationSettingUpdateActionResult["status"];
  settings: OrganizationSettings;
  version: number;
  conflict: ConflictState | null;
  message: string;
}> => {
  if (result.status === "updated") {
    return {
      status: "updated",
      settings: { ...previous, ...result.settings },
      version: result.version,
      conflict: null,
      message: "Organization settings saved."
    };
  }
  if (result.status === "conflict") {
    return {
      status: "conflict",
      settings: result.current ? { ...previous, ...result.current.settings } : previous,
      version: result.current?.version ?? previous.version ?? 1,
      conflict: { current: result.current, attempted: {} },
      message: "These settings changed while you were editing. Review the latest values below."
    };
  }
  return {
    status: "failure",
    settings: previous,
    version: previous.version ?? 1,
    conflict: null,
    message: result.message
  };
};

const settingsToSummary = (settings: OrganizationSettings): string =>
  `Time zone ${settings.timeZone.value}; week starts ${settings.weekStart.value}; date format ${settings.dateFormat.value}; workspace setup ${settings.workspaceSetupRule.value}.`;

export const OrganizationSettingsEditor = ({
  organization,
  updateSettings
}: {
  readonly organization: OrganizationSettings;
  readonly updateSettings: (input: unknown) => Promise<OrganizationSettingUpdateActionResult>;
}) => {
  const [baseSettings, setBaseSettings] = useState(organization);
  const [optimisticSettings, setOptimisticSettings] = useOptimistic(baseSettings, (_current, next: OrganizationSettings) => next);
  const [draft, setDraft] = useState(() => toEditableSettings(organization));
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const save = (patch: OrganizationSettingsPatch, expectedVersion: number): void => {
    if (!organization.organizationId || Object.keys(patch).length === 0) return;
    startTransition(async () => {
      setOptimisticSettings(applyPatch(baseSettings, patch));
      setMessage("Saving organization settings...");
      const result = await updateSettings({
        organizationId: organization.organizationId,
        expectedVersion,
        settings: patch
      });
      const next = updateFromAction(result, baseSettings);
      setBaseSettings({ ...next.settings, version: next.version });
      setConflict(next.conflict
        ? { ...next.conflict, attempted: patch }
        : null);
      setMessage(next.message);
      if (result.status === "updated") setDraft(toEditableSettings(next.settings));
    });
  };

  const submit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    setConflict(null);
    const patch = patchBetween(toEditableSettings(baseSettings), draft);
    save(patch, baseSettings.version ?? organization.version ?? 1);
  };

  const latest = conflict?.current
    ? { ...baseSettings, ...conflict.current.settings, version: conflict.current.version }
    : null;
  const unavailable = conflict !== null && conflict.current === null;

  return (
    <div className="mt-6 space-y-4 border-t pt-5">
      <h3 className="font-semibold">Edit organization defaults</h3>
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {pending ? `Preview while saving: ${settingsToSummary(optimisticSettings)}` : "Changes are saved only after you select Save settings."}
      </p>
      <form aria-busy={pending} className="grid gap-4 sm:grid-cols-2" onSubmit={submit}>
        <label className="grid gap-1 text-sm font-medium" htmlFor={`timezone-${organization.organizationId}`}>
          Time zone
          <input
            autoComplete="off"
            className="h-10 rounded-md border bg-background px-3 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-sky-300 dark:focus-visible:ring-offset-slate-950"
            disabled={pending || unavailable}
            id={`timezone-${organization.organizationId}`}
            onChange={(event) => {
              const timeZone = event.currentTarget.value;
              setDraft((current) => ({ ...current, timeZone }));
            }}
            required
            value={draft.timeZone}
          />
        </label>
        <label className="grid gap-1 text-sm font-medium" htmlFor={`week-start-${organization.organizationId}`}>
          Week starts
          <select
            className="h-10 rounded-md border bg-background px-3 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-sky-300 dark:focus-visible:ring-offset-slate-950"
            disabled={pending || unavailable}
            id={`week-start-${organization.organizationId}`}
            onChange={(event) => {
              const weekStart = event.currentTarget.value as EditableSettings["weekStart"];
              setDraft((current) => ({ ...current, weekStart }));
            }}
            value={draft.weekStart}
          >
            <option value="Monday">Monday</option>
            <option value="Sunday">Sunday</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium" htmlFor={`date-format-${organization.organizationId}`}>
          Date format
          <select
            className="h-10 rounded-md border bg-background px-3 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-sky-300 dark:focus-visible:ring-offset-slate-950"
            disabled={pending || unavailable}
            id={`date-format-${organization.organizationId}`}
            onChange={(event) => {
              const dateFormat = event.currentTarget.value as EditableSettings["dateFormat"];
              setDraft((current) => ({ ...current, dateFormat }));
            }}
            value={draft.dateFormat}
          >
            <option value="DD/MM/YYYY">DD/MM/YYYY</option>
            <option value="MM/DD/YYYY">MM/DD/YYYY</option>
            <option value="YYYY-MM-DD">YYYY-MM-DD</option>
          </select>
        </label>
        <label className="grid gap-1 text-sm font-medium" htmlFor={`setup-rule-${organization.organizationId}`}>
          Workspace setup rule
          <select
            className="h-10 rounded-md border bg-background px-3 font-normal focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-sky-300 dark:focus-visible:ring-offset-slate-950"
            disabled={pending || unavailable}
            id={`setup-rule-${organization.organizationId}`}
            onChange={(event) => {
              const workspaceSetupRule = event.currentTarget.value as EditableSettings["workspaceSetupRule"];
              setDraft((current) => ({ ...current, workspaceSetupRule }));
            }}
            value={draft.workspaceSetupRule}
          >
            <option value="owner only">Owner only</option>
            <option value="any member">Any member</option>
          </select>
        </label>
        <div className="flex items-center gap-3 sm:col-span-2">
          <Button className="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-sky-300 dark:focus-visible:ring-offset-slate-950" disabled={pending || unavailable || Object.keys(patchBetween(toEditableSettings(baseSettings), draft)).length === 0} type="submit">
            {pending ? "Saving..." : "Save settings"}
          </Button>
          <p aria-live="polite" className="text-sm text-muted-foreground" role="status">{message}</p>
        </div>
      </form>

      {conflict && latest ? (
        <section aria-labelledby={`settings-conflict-${organization.organizationId}`} className="space-y-3 rounded-md border border-amber-500/50 bg-amber-500/10 p-4" role="alert">
          <h4 className="font-semibold" id={`settings-conflict-${organization.organizationId}`}>Settings changed on the server</h4>
          <p className="text-sm">Current values: {settingsToSummary(latest)}</p>
          <div className="flex flex-wrap gap-3">
            <Button disabled={pending} onClick={() => {
              setBaseSettings(latest);
              setDraft(toEditableSettings(latest));
              setConflict(null);
              setMessage("Showing the latest saved settings.");
            }} className="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-sky-300 dark:focus-visible:ring-offset-slate-950" type="button" variant="outline">Use current settings</Button>
            <Button className="focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background dark:focus-visible:ring-sky-300 dark:focus-visible:ring-offset-slate-950" disabled={pending} onClick={() => save(conflict.attempted, latest.version ?? 1)} type="button">
              Apply my changes to current version
            </Button>
          </div>
        </section>
      ) : conflict ? (
        <section aria-live="assertive" className="rounded-md border border-destructive/50 bg-destructive/10 p-4" role="alert">
          <h4 className="font-semibold">Organization is no longer available</h4>
          <p className="text-sm">Refresh this page to confirm your access and current settings.</p>
        </section>
      ) : null}
    </div>
  );
};
