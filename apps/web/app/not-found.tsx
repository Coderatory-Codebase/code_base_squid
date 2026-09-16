import Link from "next/link";

const NotFound = () => (
  <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12">
    <p className="text-sm font-semibold text-amber-800">404</p>
    <h1 className="mt-3 text-2xl font-semibold text-neutral-950">Page not found</h1>
    <p className="mt-3 text-neutral-600">The requested route does not exist.</p>
    <Link className="mt-7 w-fit text-sm font-medium text-emerald-800 underline underline-offset-4" href="/">Return home</Link>
  </main>
);

export default NotFound;
