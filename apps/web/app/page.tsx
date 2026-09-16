import type { ReactElement } from "react";
import { WorkspaceStatus } from "@/components/workspace/workspace-status";
import { createApiConfiguration } from "@/config/api";
import { readWebEnvironment } from "@/config/env";

const HomePage = (): ReactElement => {
  const api = createApiConfiguration(readWebEnvironment());
  return <WorkspaceStatus apiBaseUrl={api.baseUrl} />;
};

export default HomePage;
