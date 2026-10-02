# code_base_squid

This repository is a pnpm monorepo with a Next.js web app in `apps/web` and an Express API in `servers/api`. Run `pnpm install` from the repository root, then use `pnpm run dev` to start both development servers.

## Organization workspace

The organization workspace is available at `/workspace/organization` after signing in at `/sign-in`. It lists organizations owned by the signed-in user or connected to one of that user's workspaces. If the list is empty, use **Set up an organization** to create one. The organization list is loaded by the web server and does not expose the session token to browser-side JavaScript.

For a local preview account, configure `MONGODB_URI`, `PREVIEW_USER_EMAIL`, `PREVIEW_USER_PASSWORD`, and `PREVIEW_WORKSPACE_ID` in the API environment, start the API, then run `pnpm --filter @workspace/api seed:preview`. Set `NEXT_PUBLIC_API_BASE_URL` in the web environment to the API base URL. Keep real credentials in ignored environment files; `.env.example` documents the variable names.

See [the workspace feature contract and runbook](servers/api/features/workspace/README.md) for API behavior and operational guidance.

## Repository commands

Use `pnpm run projects`, `pnpm run graph`, `pnpm run tasks`, `pnpm run check`, `pnpm run validate`, and `pnpm test` from the repository root to inspect and validate the workspace.
