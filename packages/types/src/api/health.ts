export type ApiEnvironment = "development" | "test" | "production";

export type ApiHealthResponse = Readonly<{
  status: "ok";
  service: string;
  environment: ApiEnvironment;
}>;
