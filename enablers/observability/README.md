# Operational Observability

This enabler owns deployment and operations concerns for metrics, traces, log shipping,
dashboards, alerts, and runtime telemetry infrastructure when those capabilities are
required. The Platform organization API dashboard and proposed alert/retention policy are
in `workspace/organization-dashboard.json` and `workspace/organization-alert-policy.json`.
The dashboard expects the API's structured JSON logs in Grafana Loki. Import the dashboard
into Grafana and connect its Loki datasource to the central log pipeline. The policy records
threshold proposals, required 30-day log retention, and approval status; it must be ratified
by the workspace on-call rotation and enforced by the central log platform before paging or
retention can be considered active.

Reusable application and HTTP logging implementation belongs in `packages/logging`.
Workspace runtimes consume that package and do not duplicate logging under local
`observability/` directories.

## Organization-profile signal

The API emits the structured event `organization_profile.run` from the organization-profile
controller after each invocation. The event uses the stable fields `workspace=api`,
`module=organization-profile`, and `outcome=success|failure`; it excludes organization and
member identifiers and profile data.

This repository has no module dashboard or alert configuration to update. No alert threshold,
evaluation window, or owner/on-call rotation approval is recorded here, so none is asserted as
approved. The exact operational dependency is an approved dashboard/alerting platform
configuration and a named on-call owner/rotation to agree the threshold and evaluation window.
Until that dependency is supplied, no automated threshold alert is active. The designated
on-call owner must be identified to acknowledge and investigate qualifying failures, then
document the approved threshold, evaluation window, and response procedure here.

## Organization branding signal

The API emits the structured `organization_branding.read` event for organization-list
reads. It records outcome, elapsed milliseconds, returned count and whether the read met
the story's 700 ms budget; it excludes tenant and organization identifiers. Investigate
five-minute p95 above 700 ms or an error rate above 1% with at least 100 reads. Check API
and MongoDB availability, then inspect the scoped query and index plan. No metrics exporter
or dashboard is provisioned here yet; the event is available to the configured log pipeline.
