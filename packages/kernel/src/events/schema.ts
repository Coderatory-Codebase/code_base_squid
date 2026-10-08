import { EVENT_CONTRACT_REGISTRY } from "./registry.js";

export type JsonSchema = Readonly<{
  $schema?: string;
  $id?: string;
  title?: string;
  description?: string;
  type?: string;
  const?: string | number;
  format?: string;
  required?: readonly string[];
  properties?: Readonly<Record<string, JsonSchema>>;
  additionalProperties?: boolean;
}>;

export type EventVersionSchemas = Readonly<Record<string, Readonly<Record<string, JsonSchema>>>>;

export type EventSchemaSnapshot = Readonly<{
  schemaVersion: 1;
  release: number;
  events: EventVersionSchemas;
}>;

const envelopeFields = Object.freeze([
  "id",
  "type",
  "version",
  "workspaceId",
  "actor",
  "occurredAt",
  "payload"
] as const);

const createEnvelopeSchema = (eventType: string, version: number): JsonSchema => Object.freeze({
  $schema: "https://json-schema.org/draft/2020-12/schema",
  type: "object",
  required: envelopeFields,
  additionalProperties: false,
  properties: Object.freeze({
    id: Object.freeze({ type: "string" }),
    type: Object.freeze({ const: eventType }),
    version: Object.freeze({ const: version }),
    workspaceId: Object.freeze({ type: "string" }),
    actor: Object.freeze({}),
    occurredAt: Object.freeze({ type: "string", format: "date-time" }),
    payload: Object.freeze({})
  })
});

const eventSchemas = Object.fromEntries(
  Object.entries(EVENT_CONTRACT_REGISTRY).map(([eventType, versions]) => [
    eventType,
    Object.freeze(Object.fromEntries(
      versions.map((version) => [String(version), createEnvelopeSchema(eventType, version)])
    ))
  ])
);

/** Release schemas for the currently registered event versions. */
export const EVENT_CONTRACT_SCHEMAS = Object.freeze(eventSchemas) as EventVersionSchemas;

/** Schema shape captured when the first event contracts were published. */
export const EVENT_SCHEMA_SNAPSHOT: EventSchemaSnapshot = Object.freeze({
  schemaVersion: 1,
  release: 1,
  events: EVENT_CONTRACT_SCHEMAS
});
