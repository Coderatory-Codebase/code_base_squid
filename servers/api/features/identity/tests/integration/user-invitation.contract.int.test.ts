import test from "node:test";

void test.skip(
  "TC-02.1.02-S1-4 AC-4 contract refusal is skipped until the Docker-backed principal and policy boundary is available",
  { skip: "Docker Desktop daemon is unavailable and this repository does not yet compose the required principal/policy command boundary." }
);
