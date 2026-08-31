import type { NextConfig } from "next";

// Same-origin cookie delivery via rewrites (ADR-012): the browser talks
// to apps/web only; apps/web proxies /api/** to servers/api server-side.
// Avoids SameSite=None + HTTPS-only cookie requirements in local dev and
// avoids CORS for the browser-facing path entirely.
const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:4000";

const nextConfig: NextConfig = {
  // This repository has its own deliberate, root-level AGENTS.md/CLAUDE.md
  // convention (see ../../AGENTS.md) — don't let `next dev` generate a
  // second, nested pair inside apps/web.
  agentRules: false,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
