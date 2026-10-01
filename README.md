"# code_base_squid" 


### Kernel scoped collection handle (servers/api/kernel/gateway)
- `createScopedHandle`: workspace-bound find/insert/update/softDelete, koi unscoped method nahi.
- Updates version-conditional (ARC-008), conflict par `version_conflict`.
- Workspace ke bagair query se pehle throw (`workspace_required`).
- New error codes `ApiErrorCode` mein (packages/types).

Deferred: `RawCollection` ka Mongo adapter (integrations/mongodb), policy-binding check,
collection allow-list, kernel ke liye 409 mapping service layer mein.