import test from "node:test";

void test.skip(
  "TC-02.1.02-S1-6 AC-6 load budget is skipped until k6, Docker MongoDB, and the authenticated invite route are available",
  { skip: "No Docker daemon, k6 executable, or composed authenticated invitation route is available." },
  () => undefined
);

void test.skip(
  "TC-02.1.02-S1-X-performance target-volume view budget is skipped until k6, Docker MongoDB, and the invitation-list route are available",
  { skip: "No Docker daemon, k6 executable, or composed invitation-list route is available." },
  () => undefined
);
