function decodeBase64Url(value) {
  const normalizedValue = value
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  const paddedValue = normalizedValue.padEnd(
    Math.ceil(normalizedValue.length / 4) * 4,
    "=",
  );

  const binaryValue = window.atob(paddedValue);

  const bytes = Uint8Array.from(
    binaryValue,
    (character) => character.charCodeAt(0),
  );

  return new TextDecoder().decode(bytes);
}

export function decodeJwtPayload(token) {
  try {
    if (!token || typeof token !== "string") {
      return null;
    }

    const tokenParts = token.split(".");

    if (tokenParts.length !== 3) {
      return null;
    }

    const decodedPayload = decodeBase64Url(tokenParts[1]);

    return JSON.parse(decodedPayload);
  } catch {
    return null;
  }
}

export function getJwtPermissions(token) {
  const payload = decodeJwtPayload(token);

  if (!payload) {
    return [];
  }

  const permissionValue =
    payload.permission ?? payload.permissions ?? [];

  if (Array.isArray(permissionValue)) {
    return permissionValue.filter(Boolean);
  }

  return permissionValue ? [permissionValue] : [];
}