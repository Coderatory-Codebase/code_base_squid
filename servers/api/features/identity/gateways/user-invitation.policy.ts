import type { Principal } from "../types/index.js";

export const canInviteToWorkspace = (principal: Principal): boolean =>
  principal.role === "admin" && principal.permissions.includes("workspace:invite");
