# Identity invitations

`GET /identity/user-invitations` lists invitations for the authenticated user's only
active workspace. The caller sends the `workspace_session` value as a bearer token. If the
session is missing or invalid, there is no active workspace, or the user has multiple
active workspaces, the API returns the established authentication/workspace-resolution
error.

The list command is bound to the central `workspace.invitation.manage` ability. Policy
re-reads the caller's active membership from Workspace and permits only non-guest owners
and admins. The query gateway adds `workspaceId` and `deletedAt: null` after caller filters.
Only `id`, email, status, role, expiry, and creation time are returned; token hashes and
inviter identifiers remain server-side. An optional `status` filter accepts `pending`,
`accepted`, `expired`, or `revoked`.

Invitation mutations are not exposed through this route. They must append their domain
event to the outbox in the same Mongo transaction as the invitation state change before
an HTTP write action is registered.
