import type { ReactElement } from "react";
import { Database, Globe2, Server, type LucideIcon } from "lucide-react";

type WorkspaceFoundation = Readonly<{
  label: string;
  detail: string;
  icon: LucideIcon;
}>;

const foundations: readonly WorkspaceFoundation[] = [
  { label: "Web", detail: "Next.js 16 / React 19", icon: Globe2 },
  { label: "API", detail: "Express 5 / TypeScript", icon: Server },
  { label: "Data", detail: "Mongoose connection boundary", icon: Database }
];

export const RuntimeFoundation = (): ReactElement => (
  <section aria-labelledby="foundation-heading" className="py-8">
    <h2 id="foundation-heading" className="text-sm font-semibold text-neutral-950">Runtime foundation</h2>
    <div className="mt-4 grid border-y border-neutral-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
      {foundations.map(({ label, detail, icon: Icon }) => (
        <div className="flex min-h-28 items-start gap-3 border-b border-neutral-200 py-5 last:border-b-0 sm:border-b-0 sm:px-5 sm:first:pl-0" key={label}>
          <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0 text-neutral-500" />
          <div>
            <p className="font-medium text-neutral-950">{label}</p>
            <p className="mt-1 text-sm leading-6 text-neutral-600">{detail}</p>
          </div>
        </div>
      ))}
    </div>
  </section>
);
