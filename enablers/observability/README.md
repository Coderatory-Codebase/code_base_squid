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
