/**
 * httpClient
 *
 * One request path for the auth + step-up flows.
 *
 * Why this calls CapacitorHttp directly on a device rather than using `fetch`:
 * the gateway expects a `Referer`. A browser sends it automatically, which is
 * why sign-in works there; inside the WebView the origin is
 * `https://localhost`, and `Referer` is a FORBIDDEN header, so the patched
 * `fetch()` that CapacitorHttp installs strips it during header
 * normalization and it never reaches the gateway. `CapacitorHttp.request()`
 * passes headers through untouched.
 *
 * Probing the gateway with bad credentials returns the same 401 with or
 * without a `Referer`, so the header cannot be ruled out that way -- a bad
 * password fails for its own reason either way. It only matters on the
 * credentials that would otherwise succeed, which is precisely the
 * browser-works/device-fails split.
 *
 * These helpers never throw on an HTTP status -- every status in the OTP spec
 * (400 / 401 / 403 / 404 / 405 / 501) means something specific to the caller,
 * so the status is returned and the caller decides.
 */
import { Capacitor, CapacitorHttp } from "@capacitor/core";

import { API_BASE, REFERER } from "./gateway";

/** Kept as a named export because the auth + step-up services read it. */
export const GATEWAY = API_BASE;

export { REFERER };

/** Parse defensively: an empty 204/500 body must not throw on JSON.parse(""). */
export const safeParse = (value) => {
  if (value == null) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

/**
 * base64 of a UTF-8 string.
 *
 * Plain `btoa` throws `InvalidCharacterError` on any character outside
 * Latin-1, so a password with an accented or non-Latin character would fail
 * before a request was ever made -- surfacing as an unexplained error rather
 * than a wrong password.
 */
export const utf8Base64 = (input) => {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
};

/**
 * Perform a request and return `{ status, data, raw }`.
 *
 * `data` is the parsed body (null when absent/unparseable); `raw` is the text,
 * kept so an error can quote what the gateway actually said.
 */
export const apiRequest = async ({
  url,
  method = "GET",
  headers = {},
  data,
  token,
}) => {
  const finalHeaders = {
    "Content-Type": "application/json",
    Accept: "application/json",
    Referer: REFERER,
    ...headers,
  };
  if (token) finalHeaders.token = token;

  // On a device, send the headers verbatim so `Referer` survives.
  if (Capacitor.isNativePlatform()) {
    const response = await CapacitorHttp.request({
      url,
      method,
      headers: finalHeaders,
      ...(data === undefined ? {} : { data }),
    });
    const raw =
      typeof response.data === "string"
        ? response.data
        : JSON.stringify(response.data ?? "");
    return { status: response.status, data: safeParse(response.data), raw };
  }

  const response = await fetch(url, {
    method,
    headers: finalHeaders,
    referrer: REFERER,
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const raw = await response.text();
  return { status: response.status, data: safeParse(raw), raw };
};

/** True for the only statuses that may be read as "this route is absent". */
export const isRouteAbsent = (status) =>
  status === 404 || status === 405 || status === 501;

/** An error that carries the gateway's status and parsed body. */
export class GatewayError extends Error {
  constructor(message, { status, data, raw } = {}) {
    super(message);
    this.name = "GatewayError";
    this.status = status;
    this.data = data;
    this.raw = raw;
  }
}
