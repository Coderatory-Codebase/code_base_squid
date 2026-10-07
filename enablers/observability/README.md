# Operational Observability

This enabler owns deployment and operations concerns for metrics, traces, log shipping,
dashboards, alerts, and runtime telemetry infrastructure when those capabilities are
required. No provider-specific operational configuration is justified yet.

Reusable application and HTTP logging implementation belongs to `packages/logging`.
Workspace runtimes consume that package and do not duplicate logging under local
`observability/` directories.

## Organization branding signal

The API emits the structured `organization_branding.read` event for organization-list
reads. It records outcome, elapsed milliseconds, returned count and whether the read met
the story's 700 ms budget; it excludes tenant and organization identifiers. Investigate
five-minute p95 above 700 ms or an error rate above 1% with at least 100 reads. Check API
and MongoDB availability, then inspect the scoped query and index plan. No metrics exporter
or dashboard is provisioned here yet; the event is available to the configured log pipeline.
