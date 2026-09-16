import { WorkspaceStatus } from "@/components/workspace-status";
import { getWebEnvironment } from "@/config/environment";

const HomePage = () => {
  const { apiBaseUrl } = getWebEnvironment();
  return <WorkspaceStatus apiBaseUrl={apiBaseUrl} />;
};

export default HomePage;
