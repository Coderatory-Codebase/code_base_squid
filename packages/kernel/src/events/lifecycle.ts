import { EVENT_CONTRACT_REGISTRY } from "./registry.js";

export type EventRelease = `R${number}.${number}`;

export type EventVersionLifecycle = Readonly<{
  /** Release in which a newer version first superseded this version. */
  supersededInRelease: EventRelease | null;
  /** Registered consumer module names that still subscribe to this version. */
  consumers: readonly string[];
}>;

export type EventVersionLifecycleRegistry = Readonly<
  Record<string, Readonly<Record<string, EventVersionLifecycle>>>
>;

/** Release currently being checked by the local compatibility gate. */
export const CURRENT_EVENT_RELEASE: EventRelease = "R1.0";

/**
 * Lifecycle facts that are not derivable from the active version list.
 * Keep an entry after removing a version so CI can validate its retirement.
 * Add consumer module names here when their published contracts subscribe.
 */
export const EVENT_VERSION_LIFECYCLE_OVERRIDES: EventVersionLifecycleRegistry = Object.freeze({
  // The current published snapshot is R1.0; TaskUpdated v2 is already active
  // beside v1, so v1's overlap began in that release.
  TaskUpdated: Object.freeze({
    "1": Object.freeze({ supersededInRelease: "R1.0", consumers: Object.freeze([]) })
  })
});

const activeLifecycleRecords = Object.fromEntries(
  Object.entries(EVENT_CONTRACT_REGISTRY).map(([eventType, versions]) => [
    eventType,
    Object.freeze(Object.fromEntries(versions.map((version) => [
      String(version),
      Object.freeze({ supersededInRelease: null, consumers: Object.freeze([]) })
    ])))
  ])
);

/**
 * Registry view covering active versions and any explicitly retained history.
 * Empty consumer lists mean no consumer is currently registered in this repo.
 */
const lifecycleRecords = Object.fromEntries(
  [...new Set([
    ...Object.keys(activeLifecycleRecords),
    ...Object.keys(EVENT_VERSION_LIFECYCLE_OVERRIDES)
  ])].map((eventType) => [
    eventType,
    Object.freeze({
      ...(activeLifecycleRecords[eventType] ?? {}),
      ...(EVENT_VERSION_LIFECYCLE_OVERRIDES[eventType] ?? {})
    })
  ])
);

export const EVENT_VERSION_LIFECYCLE_REGISTRY: EventVersionLifecycleRegistry = Object.freeze(lifecycleRecords);

export type EventVersionRetirementInput = Readonly<{
  event: string;
  version: string;
  currentRelease: EventRelease;
  lifecycle: EventVersionLifecycle | undefined;
}>;

export type EventVersionRetirementBlock = Readonly<{
  currentRelease: EventRelease;
  reason: string;
}>;

const parseRelease = (release: EventRelease): readonly [number, number] => {
  const match = /^R(\d+)\.(\d+)$/.exec(release);
  if (!match) {
    throw new TypeError(`Invalid event release "${release}"; expected R<major>.<minor>.`);
  }
  return [Number(match[1]), Number(match[2])];
};

const compareReleases = (left: EventRelease, right: EventRelease): number => {
  const [leftMajor, leftMinor] = parseRelease(left);
  const [rightMajor, rightMinor] = parseRelease(right);
  return leftMajor - rightMajor || leftMinor - rightMinor;
};

const nextRelease = (release: EventRelease): EventRelease => {
  const [major, minor] = parseRelease(release);
  return `R${String(major)}.${String(minor + 1)}` as EventRelease;
};

/** Return why a removal is blocked; undefined means the version may be retired. */
export const getEventVersionRetirementBlock = (
  input: EventVersionRetirementInput
): EventVersionRetirementBlock | undefined => {
  const { event, version, currentRelease, lifecycle } = input;

  if (!lifecycle) {
    return {
      currentRelease,
      reason: "no lifecycle record is registered for this version"
    };
  }

  if (lifecycle.supersededInRelease === null) {
    return {
      currentRelease,
      reason: "no superseding release is recorded"
    };
  }

  parseRelease(currentRelease);
  parseRelease(lifecycle.supersededInRelease);

  if (compareReleases(currentRelease, lifecycle.supersededInRelease) <= 0) {
    return {
      currentRelease,
      reason: `${event} version ${version} was superseded in ${lifecycle.supersededInRelease}; its overlap is still active, so removal is first allowed in ${nextRelease(lifecycle.supersededInRelease)}`
    };
  }

  if (lifecycle.consumers.length > 0) {
    const consumers = [...new Set(lifecycle.consumers)].sort().join(", ");
    return {
      currentRelease,
      reason: `${event} version ${version} is still consumed by ${consumers}`
    };
  }

  return undefined;
};
