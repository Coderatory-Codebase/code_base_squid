# Identity module dashboard

The deployable Grafana dashboard is [identity-dashboard.grafana.json](identity-dashboard.grafana.json). It uses the Loki datasource selected during import and displays sign-in success, callback error, verification failure, profile outcomes, and sign-in p95 completion time. The Workspace ID text box filters event JSON at query time; it is intentionally not an indexed Loki label.

## Event contract

| Event | Fields | Dashboard use |
| --- | --- | --- |
| `identity.sign_in.completion` | `module`, `workspaceId`, `outcome`, `durationMs` | Success/error counts and p95 callback duration; provider verification round-trip is excluded. |
| `identity.sign_in.failed` | `module`, `increment` | Invalid, expired, or unverifiable callback count. Workspace is unknown at this boundary. |
| `identity.user_profile.gateway_query` | `module`, `workspaceId`, `outcome`, `durationMs` | Success, not-found, and operational error counts. |

## Local Grafana Cloud delivery

### Quick start on Windows

Use two PowerShell windows from the repository root. Start Alloy first; it opens a local-only HTTP receiver on `127.0.0.1:3101`. Then run the web app and API with the normal `pnpm run dev` command. In development, the API forwards its structured JSON logs to Alloy while keeping its normal console output. Alloy filters out non-Identity API logs before sending anything to Cloud. The Alloy launcher is only for Alloy and checks for an existing Alloy listener before starting another instance.

1. In the first window, if PowerShell blocks local scripts, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned` (current window only), then run `.\enablers\observability\start-identity-alloy.ps1`. Enter the Loki user ID and paste the `logs:write` token at the hidden prompt. Alloy runs in the foreground; the token is never written to a file.
2. In the second window, run `pnpm run dev` as usual.
3. Keep both windows open, then sign in or visit the profile page. Refresh the Grafana dashboard.

Stop each process with `Ctrl+C` in its own window. If `pnpm run dev` reports that port 3000 or 4000 is already in use, stop the existing web/API process before starting another. If Alloy reports port 12345 is occupied, reuse the existing Alloy instance or stop it before launching one more. Port 3101 is reserved for the API-to-Alloy local log handoff.

### Manual setup

1. Start Alloy with the API receiver on `127.0.0.1:3101`, then start the API normally in development. The API forwards a structured JSON copy of its logs to Alloy while retaining its configured console format.
2. Install Grafana Alloy from Grafana's official distribution. Copy `identity.alloy.example` to a local Alloy config outside the repository and set these variables in the Alloy process environment:
   - `GRAFANA_CLOUD_LOKI_URL`: `https://logs-prod-035.grafana.net/loki/api/v1/push`
   - `LOKI_USERNAME`: Grafana Cloud Logs user ID
   - `GRAFANA_CLOUD_API_KEY`: Cloud Access Policy token restricted to Logs write
3. Start Alloy with that config. Its pipeline parses the API JSON, drops every non-Identity event before transmission, and sends only Identity signals to Loki. `module`, `event`, and `outcome` are bounded labels; `workspaceId` is structured metadata to avoid high-cardinality labels.
4. In Grafana, create a dashboard, choose **Import dashboard**, upload `identity-dashboard.grafana.json`, select `grafanacloud-swiftcanyon1350-logs` for `DS_LOKI`, then import. Set the time range to include newly ingested events.

The Grafana Loki datasource is a query connection; it does not ingest API output by itself. Alloy provides the missing local-to-Cloud delivery path. Do not put Cloud credentials in this repository, an `.env` file committed to git, or the Alloy config.

## Alert threshold and runbook

For this task, Muhammad Sami approved this threshold on 2026-10-05: alert when the Identity
sign-in completion p95 exceeds **300 ms for 5 consecutive minutes**. The 300 ms limit matches
Story 02.1.01-S1 acceptance criterion 6; provider round-trip time remains excluded from the
measured duration.

**Runbook:** When this alert fires, check the Identity dashboard's sign-in completion p95,
sign-in error and verification-failure panels for the same 5-minute window. If the p95 remains
above 300 ms, investigate callback completion latency and recent Identity/API changes; record
the affected time window and workspace filter, then follow the team's incident escalation
process. Do not treat verification failures alone as proof of a latency incident.
