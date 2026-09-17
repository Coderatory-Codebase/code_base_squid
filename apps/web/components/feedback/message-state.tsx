import type { ReactElement, ReactNode } from "react";
import { PageShell } from "@/components/layout";

type MessageStateProps = Readonly<{
  action?: ReactNode;
  description: string;
  eyebrow: string;
  icon: ReactNode;
  title: string;
}>;

export const MessageState = ({ action, description, eyebrow, icon, title }: MessageStateProps): ReactElement => (
  <PageShell className="justify-center" width="narrow">
    {icon}
    <p className="mt-5 text-sm font-semibold text-amber-800">{eyebrow}</p>
    <h1 className="mt-3 text-2xl font-semibold text-neutral-950">{title}</h1>
    <p className="mt-3 text-neutral-600">{description}</p>
    {action}
  </PageShell>
);
