export const InvalidInvitationLink = () => (
  <main className="mx-auto max-w-lg p-6">
    <section className="rounded-lg border bg-card p-6" aria-labelledby="invalid-invitation-heading">
      <h1 id="invalid-invitation-heading" className="text-xl font-semibold">Invitation unavailable</h1>
      <p className="mt-2 text-muted-foreground">
        This invitation is no longer valid. Ask the person who sent it for a new one.
      </p>
    </section>
  </main>
);
