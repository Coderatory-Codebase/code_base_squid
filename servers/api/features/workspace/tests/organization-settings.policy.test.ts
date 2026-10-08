import test from "node:test";
import assert from "node:assert/strict";
import { ERROR_CODES } from "../../../constants/index.js";
import {
  createCommandBus,
  createCommandFactory,
  type AllowedCommand,
  type Principal
} from "../../../kernel/index.js";
import { abilities } from "../../access/public.js";
import {
  decideOrganizationSettingsCommand,
  createWorkspacePolicyEvaluator,
  ORGANIZATION_SETTINGS_UPDATE_COMMAND,
  workspaceCommandAbilities,
  type OrganizationSettingsPolicyActor
} from "../policies/organization-settings.policy.js";

const owner: OrganizationSettingsPolicyActor = { kind: "user", role: "owner", guest: false };
const commandPrincipal: Principal = { userId: "owner-1", workspaceId: "workspace-1" };

void test("organization settings update is bound to its central ability and allows only the owner", () => {
  assert.equal(workspaceCommandAbilities[ORGANIZATION_SETTINGS_UPDATE_COMMAND], abilities.organizationSettingsUpdate);
  assert.deepEqual(decideOrganizationSettingsCommand(ORGANIZATION_SETTINGS_UPDATE_COMMAND, owner), {
    effect: "allow",
    ability: abilities.organizationSettingsUpdate
  });
});

void test("a member without owner rights is refused the organization settings command", () => {
  assert.deepEqual(decideOrganizationSettingsCommand(ORGANIZATION_SETTINGS_UPDATE_COMMAND, {
    kind: "user",
    role: "member",
    guest: false
  }), {
    effect: "deny",
    ability: abilities.organizationSettingsUpdate,
    reason: "insufficient-role"
  });
});

void test("a guest is refused the organization settings command", () => {
  assert.deepEqual(decideOrganizationSettingsCommand(ORGANIZATION_SETTINGS_UPDATE_COMMAND, {
    kind: "user",
    role: "owner",
    guest: true
  }), {
    effect: "deny",
    ability: abilities.organizationSettingsUpdate,
    reason: "guest"
  });
});

void test("an API key is refused the organization settings command", () => {
  assert.deepEqual(decideOrganizationSettingsCommand(ORGANIZATION_SETTINGS_UPDATE_COMMAND, {
    kind: "api-key",
    role: "owner",
    guest: false
  }), {
    effect: "deny",
    ability: abilities.organizationSettingsUpdate,
    reason: "api-key"
  });
});

void test("the command bus rejects organization settings updates without an attached policy decision", async () => {
  const handled: AllowedCommand[] = [];
  const bus = createCommandBus({
    handlers: {
      [ORGANIZATION_SETTINGS_UPDATE_COMMAND]: (command) => {
        handled.push(command);
        return Promise.resolve();
      }
    },
    logger: { warn: () => undefined }
  });

  await assert.rejects(bus.dispatch({
    name: ORGANIZATION_SETTINGS_UPDATE_COMMAND,
    payload: { settings: {} },
    principal: commandPrincipal
  }), { code: ERROR_CODES.policyDecisionRequired, status: 403 });
  assert.equal(handled.length, 0);
});

void test("the workspace policy evaluator attaches an allow decision for an owner", async () => {
  const handled: AllowedCommand[] = [];
  const buildCommand = createCommandFactory({
    evaluate: createWorkspacePolicyEvaluator({ resolveActor: () => Promise.resolve(owner) })
  });
  const bus = createCommandBus({
    handlers: {
      [ORGANIZATION_SETTINGS_UPDATE_COMMAND]: (command) => {
        handled.push(command);
        return Promise.resolve();
      }
    },
    logger: { warn: () => undefined }
  });

  const command = await buildCommand({
    name: ORGANIZATION_SETTINGS_UPDATE_COMMAND,
    payload: { settings: {} },
    principal: commandPrincipal
  });
  await bus.dispatch(command);
  assert.equal(handled.length, 1);
  assert.equal(handled[0]?.decision.effect, "allow");
});

void test("the bound command is refused by the command bus for members, guests and API keys", async () => {
  const refusedActors: ReadonlyArray<OrganizationSettingsPolicyActor> = [
    { kind: "user", role: "member", guest: false },
    { kind: "user", role: "owner", guest: true },
    { kind: "api-key", role: "owner", guest: false }
  ];

  for (const actor of refusedActors) {
    const handled: AllowedCommand[] = [];
    const buildCommand = createCommandFactory({
      evaluate: createWorkspacePolicyEvaluator({ resolveActor: () => Promise.resolve(actor) })
    });
    const bus = createCommandBus({
      handlers: {
        [ORGANIZATION_SETTINGS_UPDATE_COMMAND]: (command) => {
          handled.push(command);
          return Promise.resolve();
        }
      },
      logger: { warn: () => undefined }
    });
    const command = await buildCommand({
      name: ORGANIZATION_SETTINGS_UPDATE_COMMAND,
      payload: { settings: {} },
      principal: commandPrincipal
    });

    await assert.rejects(bus.dispatch(command), { code: ERROR_CODES.policyDenied, status: 403 });
    assert.equal(handled.length, 0);
  }
});
