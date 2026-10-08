export type {
	ApiConfig,
	ApiEnvironmentSource,
	OidcApiConfiguration,
	OidcProviderSettings,
	ValidatedApiEnvironment
} from "./configuration/index.js";
export type Principal = Readonly<{
  userId: string;
  email?: string;
  workspaceIds: readonly string[];
}>;
