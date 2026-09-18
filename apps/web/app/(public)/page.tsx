import type { ReactElement } from "react";
import { WorkspaceStatus } from "@/components";
import { createApiConfiguration, readWebEnvironment } from "@/config";

const HomePage = (): ReactElement => {
  const api = createApiConfiguration(readWebEnvironment());
  return <WorkspaceStatus apiBaseUrl={api.baseUrl} />;
};

export default HomePage;
