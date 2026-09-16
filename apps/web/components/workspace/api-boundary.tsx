import type { ReactElement } from "react";
import { Button } from "@/components/ui/button";

type ApiBoundaryProps = Readonly<{
  baseUrl: string;
}>;

export const ApiBoundary = ({ baseUrl }: ApiBoundaryProps): ReactElement => (
  <footer className="mt-auto flex flex-col gap-2 border-t border-neutral-200 pt-6 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
    <span>API boundary</span>
    <div className="flex flex-wrap items-center gap-3">
      <code className="w-fit rounded bg-neutral-100 px-2 py-1 font-mono text-xs text-neutral-800">{baseUrl}</code>
      <Button asChild size="sm" variant="outline">
        <a href={`${baseUrl}/health`}>API health</a>
      </Button>
    </div>
  </footer>
);
