import type { ReactElement, ReactNode } from "react";
import { cn } from "@/lib/utils";

type PageShellProps = Readonly<{
  children: ReactNode;
  className?: string;
  width?: "standard" | "narrow";
}>;

const widths: Readonly<Record<NonNullable<PageShellProps["width"]>, string>> = {
  standard: "max-w-5xl",
  narrow: "max-w-3xl"
};

export const PageShell = ({ children, className, width = "standard" }: PageShellProps): ReactElement => (
  <main className={cn("mx-auto flex min-h-screen w-full flex-col px-6 py-10 sm:px-10 sm:py-16", widths[width], className)}>
    {children}
  </main>
);
