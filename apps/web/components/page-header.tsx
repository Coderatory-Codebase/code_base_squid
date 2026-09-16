import type { ReactElement, ReactNode } from "react";

type PageHeaderProps = Readonly<{
  description: string;
  eyebrow: string;
  icon: ReactNode;
  title: string;
}>;

export const PageHeader = ({ description, eyebrow, icon, title }: PageHeaderProps): ReactElement => (
  <header className="border-b border-neutral-200 pb-8">
    <div className="mb-5 flex size-11 items-center justify-center rounded-md bg-emerald-700 text-white shadow-sm">
      {icon}
    </div>
    <p className="mb-2 text-sm font-semibold text-emerald-800">{eyebrow}</p>
    <h1 className="max-w-2xl text-3xl font-semibold text-neutral-950 sm:text-4xl">{title}</h1>
    <p className="mt-4 max-w-2xl text-base leading-7 text-neutral-600">{description}</p>
  </header>
);
