import type { ReactElement } from "react";
import { PageShell } from "@/components/layout/page-shell";

const Loading = (): ReactElement => (
  <PageShell>
    <div aria-label="Loading application" className="h-2 w-32 animate-pulse rounded bg-neutral-200" role="status" />
  </PageShell>
);

export default Loading;
