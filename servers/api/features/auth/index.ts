export { createAuthRoutes } from "./routes/index.js";
export { createAuthService, hashPassword } from "./services/auth.service.js";
export { createAuthGateway } from "./db/auth.gateway.js";
export { readBearerToken } from "./controllers/auth.controller.js";
export type { AuthService } from "./services/auth.service.js";
