import test from "node:test";

const integrationBlocker = "Skipped: Docker Desktop daemon is unavailable; real MongoDB transaction and seeded-workspace evidence cannot run.";

void test.skip("TC-02.1.02-S1-1 AC-1 integration persistence is skipped pending Docker MongoDB", integrationBlocker);
void test.skip("TC-02.1.02-S1-2 AC-2 integration persistence/outbox/log inspection is skipped pending Docker MongoDB", integrationBlocker);
void test.skip("TC-02.1.02-S1-3 AC-3 integration replacement and old-link invalidation is skipped pending Docker MongoDB", integrationBlocker);
void test.skip("TC-02.1.02-S1-5 AC-5 integration invalid-address persistence check is skipped pending Docker MongoDB", integrationBlocker);
void test.skip("TC-02.1.02-S1-X-data integration ownership, retention, and index-plan check is skipped pending Docker MongoDB", integrationBlocker);
