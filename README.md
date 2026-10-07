"# code_base_squid" 


### Kernel scoped collection handle (servers/api/kernel/gateway)
- `createScopedHandle`: workspace-bound find/insert/update/softDelete, koi unscoped method nahi.
- Updates version-conditional (ARC-008), conflict par `version_conflict`.
- Workspace ke bagair query se pehle throw (`workspace_required`).
- New error codes `ApiErrorCode` mein (packages/types).

Deferred: `RawCollection` ka Mongo adapter (integrations/mongodb), policy-binding check,
collection allow-list, kernel ke liye 409 mapping service layer mein.



### Tenant isolation proof (PACK-TENANT)
- `integrations/mongodb/scoped-collection.ts`: Mongo implementation of the kernel `RawCollection` port.
- `integrations/mongodb/tests/pack-tenant.test.ts`: replica-set test (mongodb-memory-server) proving cross-tenant reads/writes are blocked and no-workspace calls make zero driver calls.
- `mongodb-memory-server` build script is explicitly declined in `pnpm-workspace.yaml` (`allowBuilds: false`); the mongod binary downloads on first test run.
- Deferred: collection allow-list, policy-binding check, CI cache for the mongod binary.