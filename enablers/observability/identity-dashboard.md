# Identity module dashboard

This file defines the Identity module dashboard panels using the structured events currently emitted by the API. The repository has no configured dashboard provider, so this is the module dashboard specification; it does not claim a deployed dashboard exists.

## Panels

| Panel | Structured event | What to show | Filters |
| --- | --- | --- | --- |
| Sign-in completion outcomes | `identity.sign_in.completion` | Count by `outcome` (`success`, `error`) and p95 of `durationMs` | `module=identity`; filter by `workspaceId` when present. A missing or ambiguous active workspace is recorded as `null` |
| Sign-in verification failures | `identity.sign_in.failed` | Count `increment` over time | `module=identity`; sign-in verification failures happen before a workspace is known, so workspace filtering does not apply |
| User profile query outcomes | `identity.user_profile.gateway_query` | Count by `outcome` (`success`, `not_found`, `error`) and p95 of `durationMs` | `module=identity`, `workspaceId` |

## Current event fields

- `identity.sign_in.completion` is emitted around the sign-in completion transaction with `module`, `workspaceId`, `outcome`, and `durationMs`. Its duration excludes the provider verification round trip. New users use the workspace created in the bootstrap transaction; returning users use their workspace ID when they have exactly one active workspace.
- `identity.sign_in.failed` is emitted at the sign-in verification boundary as a warning with `module` and `increment: 1`.
- `identity.user_profile.gateway_query` is emitted at the profile gateway boundary with `module`, `workspaceId`, `outcome`, and `durationMs`. Success and failure outcomes are both visible; `not_found` is shown separately from an operational error.

Workspace filtering is available for profile queries and sign-in callbacks with one resolved workspace. An unauthenticated sign-in failure has no workspace context, and a returning user with multiple active workspaces has no selected workspace at callback time; neither is assigned a guessed workspace.

## Follow-up for a live dashboard

Connect these event panels to the deployment's log dashboard when a provider is selected. Agree alert thresholds with the on-call rotation before enabling alerts. Verification failures and completion outcomes are separate events; combine their counts carefully when calculating an overall sign-in failure rate.
