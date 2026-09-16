import { WorkspaceStatus } from "@/components/workspace-status";
import { createApiConfiguration } from "@/config/api";
import { readWebEnvironment } from "@/config/env";

const HomePage = () => {
  const api = createApiConfiguration(readWebEnvironment());
  return <WorkspaceStatus apiBaseUrl={api.baseUrl} />;
};

export default HomePage;
