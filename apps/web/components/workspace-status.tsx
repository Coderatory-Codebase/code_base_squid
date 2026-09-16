import { Activity, Database, Globe2, Server } from "lucide-react";

type WorkspaceStatusProps = Readonly<{ apiBaseUrl: string }>;

const foundations = [
  { label: "Web", detail: "Next.js 16 / React 19", icon: Globe2 },
  { label: "API", detail: "Express 5 / TypeScript", icon: Server },
  { label: "Data", detail: "Mongoose connection boundary", icon: Database }
] as const;

export const WorkspaceStatus = ({ apiBaseUrl }: WorkspaceStatusProps) => (
  <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col px-6 py-10 sm:px-10 sm:py-16">
    <header className="border-b border-neutral-200 pb-8">
      <div className="mb-5 flex size-11 items-center justify-center rounded-md bg-emerald-700 text-white shadow-sm">
        <Activity aria-hidden="true" className="size-5" />
      </div>
      <p className="mb-2 text-sm font-semibold text-emerald-800">Workspace ready</p>
      <h1 className="max-w-2xl text-3xl font-semibold text-neutral-950 sm:text-4xl">
        The application foundation is running.
      </h1>
      <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">
        Web and API runtimes are configured as separate workspace units and ready for the first vertical slice.
      </p>
    </header>

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

    <footer className="mt-auto flex flex-col gap-2 border-t border-neutral-200 pt-6 text-sm text-neutral-600 sm:flex-row sm:items-center sm:justify-between">
      <span>API boundary</span>
      <code className="w-fit rounded bg-neutral-100 px-2 py-1 font-mono text-xs text-neutral-800">{apiBaseUrl}</code>
    </footer>
  </main>
);
