"use client";

import { CircleAlert, RotateCcw } from "lucide-react";
import { useEffect } from "react";

const ErrorPage = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12">
      <CircleAlert aria-hidden="true" className="size-8 text-red-700" />
      <h1 className="mt-5 text-2xl font-semibold text-neutral-950">The application could not load.</h1>
      <p className="mt-3 text-neutral-600">The error was captured at the application boundary.</p>
      <button className="mt-7 inline-flex w-fit items-center gap-2 rounded-md bg-neutral-950 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800" onClick={reset} type="button">
        <RotateCcw aria-hidden="true" className="size-4" /> Retry
      </button>
    </main>
  );
};

export default ErrorPage;
