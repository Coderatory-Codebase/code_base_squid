import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_ACCENT_COLOR,
  evaluateAccentColor,
  inspectOrganizationLogoBytes,
  proposeOrganizationBranding,
  validateOrganizationLogo,
  type InspectedLogo
} from "../index.js";

void test("accent rule accepts a readable colour and normalizes its casing", () => {
  const result = evaluateAccentColor("#1d4ed8");
  assert.equal(result.accepted, true);
  assert.equal(result.color, "#1D4ED8");
  assert.ok(result.contrastRatio >= 4.5);
});

void test("accent rule refuses a low-contrast colour with the measured ratio", () => {
  const result = evaluateAccentColor("#FACC15");
  assert.equal(result.accepted, false);
  assert.equal(result.reason, "insufficient-contrast");
  assert.equal(result.contrastRatio.toFixed(1), "1.5");
});

void test("accent rule refuses malformed colours and accepts the 4.5:1 boundary", () => {
  assert.deepEqual(evaluateAccentColor("blue"), { accepted: false, reason: "invalid-color" });
  assert.equal(evaluateAccentColor("#767676").accepted, true);
  assert.equal(evaluateAccentColor("#777777").accepted, false);
});

void test("branding transition resets to the default and increments the version", () => {
  const reset = proposeOrganizationBranding({ accentColor: "#1D4ED8", isDefault: false, version: 6 }, null);
  assert.deepEqual(reset, {
    ok: true,
    value: { accentColor: DEFAULT_ACCENT_COLOR, isDefault: true, version: 7 }
  });
});

const validPng: InspectedLogo = { format: "png", byteLength: 240 * 1024, width: 512, height: 512 };

void test("logo rule accepts PNG and JPEG within the size and dimension limits", () => {
  assert.equal(validateOrganizationLogo(validPng).ok, true);
  assert.equal(validateOrganizationLogo({ ...validPng, format: "jpeg" }).ok, true);
  assert.equal(validateOrganizationLogo({ ...validPng, byteLength: 1_048_576, width: 2_048, height: 64 }).ok, true);
});

void test("logo rule rejects SVG and non-image content distinctly", () => {
  assert.deepEqual(validateOrganizationLogo({ ...validPng, format: "svg" }), {
    ok: false,
    error: { code: "Invalid", reason: "unsupported-type", details: { format: "svg" } }
  });
  assert.deepEqual(validateOrganizationLogo({ ...validPng, format: "other" }), {
    ok: false,
    error: { code: "Invalid", reason: "not-image" }
  });
});

void test("logo rule rejects empty and over-limit files", () => {
  assert.equal(validateOrganizationLogo({ ...validPng, byteLength: 0 }).ok, false);
  const oversized = validateOrganizationLogo({ ...validPng, byteLength: 1_200_000 });
  assert.equal(oversized.ok, false);
  assert.equal(oversized.error.reason, "file-too-large");
});

void test("logo rule rejects dimensions outside 64 through 2048 pixels", () => {
  for (const dimensions of [{ width: 32, height: 512 }, { width: 512, height: 32 }, { width: 2_049, height: 512 }, { width: 512, height: 2_049 }]) {
    const result = validateOrganizationLogo({ ...validPng, ...dimensions });
    assert.equal(result.ok, false);
    assert.equal(result.error.reason, "dimensions");
  }
});


void test("logo inspection derives PNG dimensions from the file header", () => {
  const png = Uint8Array.from(Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/kl4AAAAASUVORK5CYII=",
    "base64"
  ));
  const result = inspectOrganizationLogoBytes(png);
  assert.ok(!result.ok);
  assert.equal(result.error.reason, "dimensions");
});

void test("logo inspection refuses text renamed as PNG based on its bytes", () => {
  const renamedText = new TextEncoder().encode("This is text, not a PNG image");
  const result = inspectOrganizationLogoBytes(renamedText);
  assert.deepEqual(result, { ok: false, error: { code: "Invalid", reason: "not-image" } });
});

void test("logo inspection detects and refuses SVG content", () => {
  const svg = new TextEncoder().encode('<?xml version="1.0"?><svg xmlns="http://www.w3.org/2000/svg"></svg>');
  const result = inspectOrganizationLogoBytes(svg);
  assert.ok(!result.ok);
  assert.equal(result.error.reason, "unsupported-type");
});


void test("logo inspection accepts real 64 by 64 PNG and JPEG byte samples", () => {
  const png = Uint8Array.from(Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAPoAAAD6AG1e1JrAAAAeElEQVR4nOXOMQEAAACDIPuXdjF2SAIwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwDuMwjnfgbUbQw7Iy86vBAAAAAElFTkSuQmCC",
    "base64"
  ));
  const jpeg = Uint8Array.from(Buffer.from(
    "/9j/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCABAAEADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAj/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFAEBAAAAAAAAAAAAAAAAAAAAAP/EABQRAQAAAAAAAAAAAAAAAAAAAAD/2gAMAwEAAhEDEQA/AKpAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAB//9k=",
    "base64"
  ));
  assert.deepEqual(inspectOrganizationLogoBytes(png), {
    ok: true,
    value: { format: "png", byteLength: png.byteLength, width: 64, height: 64 }
  });
  assert.deepEqual(inspectOrganizationLogoBytes(jpeg), {
    ok: true,
    value: { format: "jpeg", byteLength: jpeg.byteLength, width: 64, height: 64 }
  });
});

void test("logo inspection refuses bytes above the one-megabyte limit before parsing", () => {
  const result = inspectOrganizationLogoBytes(new Uint8Array(1_048_577));
  assert.ok(!result.ok);
  assert.equal(result.error.reason, "file-too-large");
});
