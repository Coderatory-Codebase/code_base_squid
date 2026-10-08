import type {
  EventEnvelope,
  EventVersionPayload,
  VersionedEnvelopes
} from "./envelope.js";
import {
  EVENT_CONTRACT_REGISTRY,
  type RegisteredEventType,
  type RegisteredEventVersion
} from "./registry.js";

type VersionPayload<EventType extends RegisteredEventType> = {
  [Version in RegisteredEventVersion<EventType>]: EventVersionPayload<Version>;
}[RegisteredEventVersion<EventType>];

type AtLeastTwoVersions<EventType extends RegisteredEventType> = readonly [
  VersionPayload<EventType>,
  VersionPayload<EventType>,
  ...VersionPayload<EventType>[]
];

type EventEnvelopeMetadata<EventType extends RegisteredEventType, Actor> = Readonly<{
  id: string;
  type: EventType;
  workspaceId: string;
  actor: Actor;
  occurredAt: string;
}>;

export const createVersionedEnvelopes = <
  EventType extends RegisteredEventType,
  Actor,
  const Versions extends AtLeastTwoVersions<EventType>
>(
  metadata: EventEnvelopeMetadata<EventType, Actor>,
  versions: Versions
): VersionedEnvelopes<EventType, Actor, Versions> => {
  const registeredVersions: readonly number[] = EVENT_CONTRACT_REGISTRY[metadata.type];
  const seenVersions = new Set<number>();
  for (const { version } of versions) {
    if (!registeredVersions.includes(version)) {
      throw new RangeError(`${metadata.type} version ${String(version)} is not registered.`);
    }
    if (seenVersions.has(version)) {
      throw new RangeError(`${metadata.type} version ${String(version)} appears more than once in an overlap.`);
    }
    seenVersions.add(version);
  }

  const envelopes = versions.map(({ version, payload }) => Object.freeze({
    ...metadata,
    version,
    payload
  } satisfies EventEnvelope<EventType, number, Actor, unknown>));

  return Object.freeze(envelopes) as VersionedEnvelopes<EventType, Actor, Versions>;
};
