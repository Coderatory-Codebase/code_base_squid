export const DEFAULT_ACCENT_COLOR = "#4B5563" as const;
export const MINIMUM_WHITE_CONTRAST = 4.5;
export const MAXIMUM_LOGO_BYTES = 1_048_576;
export const MINIMUM_LOGO_DIMENSION = 64;
export const MAXIMUM_LOGO_DIMENSION = 2_048;

export type OrganizationBrandingState = Readonly<{
  accentColor: string;
  isDefault: boolean;
  version: number;
}>;

export type Result<Value, Failure> =
  | Readonly<{ ok: true; value: Value }>
  | Readonly<{ ok: false; error: Failure }>;

export type OrganizationBrandingError =
  | Readonly<{ code: "Invalid"; reason: "invalid-color" }>
  | Readonly<{ code: "Invalid"; reason: "insufficient-contrast"; contrastRatio: number }>;

export type AccentColorEvaluation =
  | Readonly<{ accepted: true; color: string; contrastRatio: number; isDefault: boolean }>
  | Readonly<{ accepted: false; reason: "invalid-color" }>
  | Readonly<{ accepted: false; reason: "insufficient-contrast"; contrastRatio: number }>;

const channelToLinear = (channel: number): number => {
  const srgb = channel / 255;
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
};

export const contrastAgainstWhite = (color: string): number | undefined => {
  if (!/^#[\da-f]{6}$/i.test(color)) return undefined;
  const red = Number.parseInt(color.slice(1, 3), 16);
  const green = Number.parseInt(color.slice(3, 5), 16);
  const blue = Number.parseInt(color.slice(5, 7), 16);
  const luminance = 0.2126 * channelToLinear(red) + 0.7152 * channelToLinear(green) + 0.0722 * channelToLinear(blue);
  return 1.05 / (luminance + 0.05);
};

export const evaluateAccentColor = (color: string): AccentColorEvaluation => {
  const ratio = contrastAgainstWhite(color);
  if (ratio === undefined) return Object.freeze({ accepted: false, reason: "invalid-color" });
  if (ratio < MINIMUM_WHITE_CONTRAST) {
    return Object.freeze({ accepted: false, reason: "insufficient-contrast", contrastRatio: ratio });
  }
  const normalized = color.toUpperCase();
  return Object.freeze({
    accepted: true,
    color: normalized,
    contrastRatio: ratio,
    isDefault: normalized === DEFAULT_ACCENT_COLOR
  });
};

export const proposeOrganizationBranding = (
  current: OrganizationBrandingState,
  requestedColor: string | null
): Result<OrganizationBrandingState, OrganizationBrandingError> => {
  const evaluated = evaluateAccentColor(requestedColor ?? DEFAULT_ACCENT_COLOR);
  if (!evaluated.accepted) {
    return evaluated.reason === "insufficient-contrast"
      ? Object.freeze({ ok: false, error: Object.freeze({ code: "Invalid", reason: evaluated.reason, contrastRatio: evaluated.contrastRatio }) })
      : Object.freeze({ ok: false, error: Object.freeze({ code: "Invalid", reason: evaluated.reason }) });
  }
  return Object.freeze({
    ok: true,
    value: Object.freeze({
      accentColor: evaluated.color,
      isDefault: requestedColor === null || evaluated.isDefault,
      version: current.version + 1
    })
  });
};

export type DetectedLogoFormat = "png" | "jpeg" | "svg" | "other";

/** Metadata must come from inspecting uploaded bytes, never from a file name or request header. */
export type InspectedLogo = Readonly<{
  format: DetectedLogoFormat;
  byteLength: number;
  width: number;
  height: number;
}>;

export type LogoValidationError = Readonly<{
  code: "Invalid";
  reason: "unsupported-type" | "not-image" | "file-too-large" | "dimensions";
  details?: Readonly<Record<string, number | string>>;
}>;


const pngSignature = Object.freeze([137, 80, 78, 71, 13, 10, 26, 10]);
const pngUint32 = (bytes: Uint8Array, offset: number): number | undefined => {
  if (offset < 0 || offset + 4 > bytes.byteLength) return undefined;
  return (bytes[offset] ?? 0) * 0x1000000 + ((bytes[offset + 1] ?? 0) << 16) + ((bytes[offset + 2] ?? 0) << 8) + (bytes[offset + 3] ?? 0);
};
const matchesPngSignature = (bytes: Uint8Array): boolean =>
  pngSignature.every((value, index) => bytes[index] === value);

const inspectPng = (bytes: Uint8Array): InspectedLogo | undefined => {
  if (bytes.byteLength < 24 || !matchesPngSignature(bytes)) return undefined;
  const headerLength = pngUint32(bytes, 8);
  const width = pngUint32(bytes, 16);
  const height = pngUint32(bytes, 20);
  const header = new TextDecoder().decode(bytes.subarray(12, 16));
  if (headerLength !== 13 || header !== "IHDR" || !width || !height) return undefined;
  return Object.freeze({ format: "png", byteLength: bytes.byteLength, width, height });
};

const isStartOfFrame = (marker: number): boolean =>
  [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);

const inspectJpeg = (bytes: Uint8Array): InspectedLogo | undefined => {
  if (bytes.byteLength < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return undefined;
  let offset = 2;
  while (offset < bytes.byteLength) {
    if (bytes[offset] !== 0xff) return undefined;
    while (bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset];
    if (marker === undefined || marker === 0x00 || marker === 0xda || marker === 0xd9) return undefined;
    offset += 1;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const segmentLength = (bytes[offset] ?? 0) * 256 + (bytes[offset + 1] ?? 0);
    if (segmentLength < 2 || offset + segmentLength > bytes.byteLength) return undefined;
    if (isStartOfFrame(marker)) {
      if (segmentLength < 8) return undefined;
      const height = (bytes[offset + 3] ?? 0) * 256 + (bytes[offset + 4] ?? 0);
      const width = (bytes[offset + 5] ?? 0) * 256 + (bytes[offset + 6] ?? 0);
      if (!width || !height) return undefined;
      return Object.freeze({ format: "jpeg", byteLength: bytes.byteLength, width, height });
    }
    offset += segmentLength;
  }
  return undefined;
};

const isSvg = (bytes: Uint8Array): boolean => {
  const prefix = new TextDecoder().decode(bytes.subarray(0, Math.min(bytes.byteLength, 2_048)))
    .replace(/^\uFEFF/, "")
    .trimStart()
    .toLowerCase();
  if (prefix.startsWith("<svg")) return true;
  return prefix.startsWith("<?xml") && prefix.indexOf("<svg") >= 0;
};

/** Derive image type and dimensions from uploaded bytes, never a filename or request MIME type. */
export const inspectOrganizationLogoBytes = (bytes: Uint8Array): Result<InspectedLogo, LogoValidationError> => {
  if (bytes.byteLength === 0 || bytes.byteLength > MAXIMUM_LOGO_BYTES) {
    return Object.freeze({ ok: false, error: Object.freeze({
      code: "Invalid",
      reason: "file-too-large",
      details: Object.freeze({ maximumBytes: MAXIMUM_LOGO_BYTES, actualBytes: bytes.byteLength })
    }) });
  }
  const inspected = inspectPng(bytes) ?? inspectJpeg(bytes);
  if (inspected) return validateOrganizationLogo(inspected);
  if (isSvg(bytes)) {
    return validateOrganizationLogo({ format: "svg", byteLength: bytes.byteLength, width: 0, height: 0 });
  }
  return validateOrganizationLogo({ format: "other", byteLength: bytes.byteLength, width: 0, height: 0 });
};

export const validateOrganizationLogo = (
  image: InspectedLogo
): Result<InspectedLogo, LogoValidationError> => {
  if (image.format === "svg") {
    return Object.freeze({ ok: false, error: Object.freeze({ code: "Invalid", reason: "unsupported-type", details: Object.freeze({ format: image.format }) }) });
  }
  if (image.format === "other") {
    return Object.freeze({ ok: false, error: Object.freeze({ code: "Invalid", reason: "not-image" }) });
  }
  if (image.byteLength <= 0 || image.byteLength > MAXIMUM_LOGO_BYTES) {
    return Object.freeze({ ok: false, error: Object.freeze({
      code: "Invalid",
      reason: "file-too-large",
      details: Object.freeze({ maximumBytes: MAXIMUM_LOGO_BYTES, actualBytes: image.byteLength })
    }) });
  }
  if (image.width < MINIMUM_LOGO_DIMENSION || image.height < MINIMUM_LOGO_DIMENSION
    || image.width > MAXIMUM_LOGO_DIMENSION || image.height > MAXIMUM_LOGO_DIMENSION) {
    return Object.freeze({ ok: false, error: Object.freeze({
      code: "Invalid",
      reason: "dimensions",
      details: Object.freeze({ minimum: MINIMUM_LOGO_DIMENSION, maximum: MAXIMUM_LOGO_DIMENSION, width: image.width, height: image.height })
    }) });
  }
  return Object.freeze({ ok: true, value: Object.freeze({ ...image }) });
};
