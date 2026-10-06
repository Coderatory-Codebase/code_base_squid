export type EventEnvelope<
  EventType extends string,
  Version extends number,
  Actor,
  Payload
> = Readonly<{
  id: string;
  type: EventType;
  version: Version;
  workspaceId: string;
  actor: Actor;
  occurredAt: string;
  payload: Payload;
}>;

export type EventVersionPayload<Version extends number = number, Payload = unknown> = Readonly<{
  version: Version;
  payload: Payload;
}>;

export type VersionedEnvelopes<
  EventType extends string,
  Actor,
  Versions extends readonly EventVersionPayload[]
> = {
  readonly [Index in keyof Versions]: Versions[Index] extends EventVersionPayload
    ? EventEnvelope<
        EventType,
        Versions[Index]["version"],
        Actor,
        Versions[Index]["payload"]
      >
    : never;
};
