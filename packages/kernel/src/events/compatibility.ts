import type { EventSchemaSnapshot, JsonSchema } from "./schema.js";
import {
  CURRENT_EVENT_RELEASE,
  EVENT_VERSION_LIFECYCLE_REGISTRY,
  getEventVersionRetirementBlock,
  type EventRelease,
  type EventVersionLifecycleRegistry
} from "./lifecycle.js";

export type EventSchemaCompatibilityIssue = Readonly<{
  event: string;
  version: string;
  replacementVersions?: readonly string[];
  field: string;
  change: "removed" | "changed";
  retirementBlock?: string;
}>;

export type EventSchemaCompatibilityOptions = Readonly<{
  currentRelease?: EventRelease;
  lifecycleRegistry?: EventVersionLifecycleRegistry;
}>;

type JsonRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is JsonRecord =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const stableJson = (value: unknown): string => {
  if (Array.isArray(value)) {
    return `[${value.map(stableJson).join(",")}]`;
  }
  if (!isRecord(value)) {
    return JSON.stringify(value);
  }

  const entries = Object.keys(value)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableJson(value[key])}`);
  return `{${entries.join(",")}}`;
};

const fieldPath = (parent: string, field: string): string =>
  parent.length === 0 ? field : `${parent}.${field}`;

const addIssue = (
  issues: Map<string, EventSchemaCompatibilityIssue>,
  issue: EventSchemaCompatibilityIssue
): void => {
  const key = `${issue.event}\u0000${issue.version}\u0000${issue.field}\u0000${issue.change}`;
  issues.set(key, issue);
};

const compareSchemaNode = (
  event: string,
  version: string,
  field: string,
  baseline: unknown,
  current: unknown,
  issues: Map<string, EventSchemaCompatibilityIssue>
): void => {
  if (!isRecord(baseline) || !isRecord(current)) {
    if (stableJson(baseline) !== stableJson(current)) {
      addIssue(issues, { event, version, field: field || "schema", change: "changed" });
    }
    return;
  }

  const baselineRequired = Array.isArray(baseline.required)
    ? baseline.required.filter((entry): entry is string => typeof entry === "string")
    : [];
  const currentRequired = Array.isArray(current.required)
    ? current.required.filter((entry): entry is string => typeof entry === "string")
    : [];
  const requiredNames = new Set([...baselineRequired, ...currentRequired]);

  for (const name of requiredNames) {
    const wasRequired = baselineRequired.includes(name);
    const isRequired = currentRequired.includes(name);
    if (wasRequired !== isRequired) {
      addIssue(issues, {
        event,
        version,
        field: fieldPath(field, name),
        change: "changed"
      });
    }
  }

  const baselineProperties = isRecord(baseline.properties) ? baseline.properties : {};
  const currentProperties = isRecord(current.properties) ? current.properties : {};
  const propertyNames = new Set([...Object.keys(baselineProperties), ...Object.keys(currentProperties)]);

  for (const name of propertyNames) {
    const propertyPath = fieldPath(field, name);
    if (!(name in currentProperties)) {
      addIssue(issues, { event, version, field: propertyPath, change: "removed" });
    } else if (!(name in baselineProperties)) {
      addIssue(issues, { event, version, field: propertyPath, change: "changed" });
    } else {
      compareSchemaNode(
        event,
        version,
        propertyPath,
        baselineProperties[name],
        currentProperties[name],
        issues
      );
    }
  }

  const informationalKeys = new Set(["$schema", "$id", "title", "description", "properties", "required"]);
  const schemaKeys = new Set([
    ...Object.keys(baseline).filter((key) => !informationalKeys.has(key)),
    ...Object.keys(current).filter((key) => !informationalKeys.has(key))
  ]);

  for (const key of schemaKeys) {
    if (!(key in baseline) || !(key in current)) {
      addIssue(issues, {
        event,
        version,
        field: field || key,
        change: key in baseline ? "removed" : "changed"
      });
    } else if (stableJson(baseline[key]) !== stableJson(current[key])) {
      addIssue(issues, { event, version, field: field || "schema", change: "changed" });
    }
  }
};

export const findEventSchemaCompatibilityIssues = (
  baseline: EventSchemaSnapshot,
  current: EventSchemaSnapshot,
  options: EventSchemaCompatibilityOptions = {}
): readonly EventSchemaCompatibilityIssue[] => {
  const issues = new Map<string, EventSchemaCompatibilityIssue>();
  const currentRelease = options.currentRelease ?? CURRENT_EVENT_RELEASE;
  const lifecycleRegistry = options.lifecycleRegistry ?? EVENT_VERSION_LIFECYCLE_REGISTRY;

  for (const event of Object.keys(baseline.events).sort()) {
    const baselineVersions = baseline.events[event];
    const currentVersions = current.events[event];
    if (!currentVersions) {
      addIssue(issues, { event, version: "*", field: "event", change: "removed" });
      continue;
    }
    if (!baselineVersions) {
      continue;
    }

    for (const version of Object.keys(baselineVersions).sort((left, right) => Number(left) - Number(right))) {
      const baselineSchema: JsonSchema | undefined = baselineVersions[version];
      const currentSchema: JsonSchema | undefined = currentVersions[version];
      if (!baselineSchema || !currentSchema) {
        if (!currentSchema) {
          const lifecycle = lifecycleRegistry[event]?.[version];
          const retirementBlock = getEventVersionRetirementBlock({
            event,
            version,
            currentRelease,
            lifecycle
          });
          if (retirementBlock) {
            addIssue(issues, {
              event,
              version,
              replacementVersions: Object.keys(currentVersions).sort((left, right) => Number(left) - Number(right)),
              field: "version",
              change: "removed",
              retirementBlock: retirementBlock.reason
            });
          }
        }
        continue;
      }

      compareSchemaNode(event, version, "", baselineSchema, currentSchema, issues);
    }
  }

  return [...issues.values()].sort((left, right) =>
    left.event.localeCompare(right.event)
    || Number(left.version) - Number(right.version)
    || left.field.localeCompare(right.field)
  );
};

export const formatEventSchemaCompatibilityIssue = (
  issue: EventSchemaCompatibilityIssue
): string => issue.retirementBlock
  ? `Event ${issue.event} version ${issue.version}${issue.replacementVersions?.length
    ? ` cannot be retired while version${issue.replacementVersions.length === 1 ? "" : "s"} ${issue.replacementVersions.join(", ")} remain registered`
    : " cannot be retired"}: ${issue.retirementBlock}.`
  : `Event ${issue.event} version ${issue.version} field "${issue.field}" was ${issue.change} from its published schema.`;
