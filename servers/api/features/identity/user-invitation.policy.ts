import type { Principal } from "./types.js";

export const canInviteToWorkspace = (principal: Principal): boolean =>
  principal.role === "admin" && principal.permissions.includes("workspace:invite");
