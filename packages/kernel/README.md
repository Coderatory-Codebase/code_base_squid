# Event contracts

The kernel owns event envelope types, the version registry, and the schema
compatibility check. It does not publish events or own producer persistence.

## Adding an event version

1. Add the new version beside the existing version in `src/events/registry.ts`.
2. Define the version's envelope/payload schema in `src/events/schema.ts` when
   the owning module contract specifies its payload fields. Do not change an
   already-published version's schema to represent a new shape.
3. Keep the old version available during the overlap release. Producers publish
   both versions from their own transaction/outbox path; consumers continue
   reading the version they support.
4. Run `pnpm run check:contracts` and the kernel tests. The pull-request CI
   compatibility gate compares the change against the base branch's published
   snapshot and reports the event, version, and field for breaking changes.

The checked-in snapshot is `contracts/event-schemas.snapshot.json`. CI checks
that it exactly represents the schemas being published and compares those
schemas with the base branch snapshot. When a new event version is ready to be
published, update the snapshot in that change and increment its release number.
Do not edit the snapshot to silence a breaking-change failure; a breaking shape
requires a new event version.

## Retiring an event version

`src/events/lifecycle.ts` records the release currently checked by CI and the
lifecycle facts for each registered event version. When a newer version first
supersedes an older one, add that release to
`EVENT_VERSION_LIFECYCLE_OVERRIDES`. Keep the old version's lifecycle record
after removing its schema from `EVENT_CONTRACT_REGISTRY`; it is the evidence CI
uses to check the retirement. List each still-subscribing module in that
version's `consumers` array. A removal is accepted only in a later release and
only when the array is empty. Missing supersession data fails closed. Update
`CURRENT_EVENT_RELEASE` when changing the release the compatibility gate checks.

The active registry currently has no consumer subscriptions recorded in this
repository. This is not a claim that external modules have migrated; their
owners must register each consumer before a retirement is allowed. `R1.2` is
the overlap release in the backlog example, so the earliest allowed removal is
`R1.3`.

The current Squid task lists Wave 1 event names and the common envelope fields,
but does not provide per-event payload shapes. Those payloads remain open until
their owning module contracts define them; compatibility tests use an explicit
`TaskUpdated` fixture to prove field-removal/change diagnostics without claiming
that fixture is a registered Wave 1 event.
