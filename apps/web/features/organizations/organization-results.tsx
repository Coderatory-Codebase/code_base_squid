"use client";

import { useCallback, useEffect, useRef, useState, type ReactElement } from "react";
import { Building2, RotateCw } from "lucide-react";
import { Button } from "@workspace/ui";
import { loadMoreOrganizations } from "./organizations.actions";
import type { OrganizationListResult, OrganizationSummary } from "./organizations.gateway";

type OrganizationResultsProps = Readonly<{ result: OrganizationListResult; createdId?: string }>;

export const OrganizationResults = ({ result, createdId }: OrganizationResultsProps): ReactElement => {
  const [organizations, setOrganizations] = useState<readonly OrganizationSummary[]>(
    result.ok ? result.organizations : []
  );
  const [nextOffset, setNextOffset] = useState<number | null>(result.ok ? result.nextOffset : null);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async (): Promise<void> => {
    if (nextOffset === null || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setLoadError(null);
    try {
      const page = await loadMoreOrganizations(nextOffset);
      if (!page.ok) {
        setLoadError(page.message);
        return;
      }
      setOrganizations((current) => {
        const seen = new Set(current.map(({ id }) => id));
        return [...current, ...page.organizations.filter(({ id }) => !seen.has(id))];
      });
      setNextOffset(page.nextOffset);
    } catch {
      setLoadError("The next organization page could not be loaded. Try again.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [nextOffset]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (nextOffset === null || sentinel === null || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some(({ isIntersecting }) => isIntersecting)) void loadMore();
    }, { rootMargin: "300px 0px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loadMore, nextOffset]);

  if (!result.ok) {
    return (
      <section aria-labelledby="organizations-error-title" className="rounded-xl border border-destructive/30 bg-card p-6">
        <h2 className="text-lg font-semibold" id="organizations-error-title">Organizations could not be loaded</h2>
        <p className="mt-2 text-sm text-muted-foreground">{result.message} No organization list is shown until the query succeeds.</p>
        <Button asChild className="mt-5">
          <a href="/workspace/organization"><RotateCw aria-hidden="true" className="size-4" />Try again</a>
        </Button>
      </section>
    );
  }

  if (organizations.length === 0) {
    return (
      <section aria-labelledby="organizations-empty-title" className="rounded-xl border bg-card p-8 text-center">
        <Building2 aria-hidden="true" className="mx-auto size-8 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold" id="organizations-empty-title">You don’t belong to an organization yet</h2>
        <p className="mt-2 text-sm text-muted-foreground">Set up an organization to start bringing your workspaces together.</p>
        <Button asChild className="mt-5"><a href="/workspace/organization/new">Set up an organization</a></Button>
      </section>
    );
  }

  return (
    <>
      {createdId && organizations.some(({ id }) => id === createdId)
        ? <p aria-live="polite" className="rounded-md border border-primary/30 bg-card p-4 text-sm" role="status">Organization created. It is now available in your organization list.</p>
        : null}
      <ul aria-label="Organizations" className="grid gap-3">
        {organizations.map((organization) => (
          <li className="rounded-xl border bg-card p-5" id={`organization-${organization.id}`} key={organization.id}>
            <h2 className="font-medium"><a className="underline-offset-4 hover:underline" href={`/workspace/dashboard/${encodeURIComponent(organization.id)}`}>{organization.name}</a></h2>
          </li>
        ))}
      </ul>
      {nextOffset !== null ? (
        <div className="flex flex-col items-center gap-2 py-4" ref={sentinelRef}>
          <Button disabled={loading} onClick={() => void loadMore()} type="button">
            {loading ? "Loading organizations…" : "Load more organizations"}
          </Button>
          {loadError ? <p aria-live="polite" className="text-sm text-destructive" role="alert">{loadError}</p> : null}
          {loadError
            ? <Button disabled={loading} onClick={() => void loadMore()} type="button" variant="outline">Retry loading organizations</Button>
            : null}
          {loading ? <p aria-live="polite" className="sr-only" role="status">Loading more organizations.</p> : null}
        </div>
      ) : null}
    </>
  );
};
