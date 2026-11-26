/**
 * httpClient
 *
 * One request path for the auth + step-up flows.
 *
 * Why this exists rather than bare `fetch`: the gateway authorizes requests by
 * their referrer. In a browser that header is automatic; inside the Capacitor
 * WebView the origin is `https://localhost`, so it has to be set explicitly --
 * and the patched `fetch()` that CapacitorHttp installs runs headers through
 * browser normalization, which silently DROPS `Referer` because it is a
 * forbidden header. That is what produced the 401 on device. CapacitorHttp's
 * own `request()` sends headers untouched, so on a device we call it directly.
 *
 * These helpers never throw on an HTTP status -- every status in the OTP spec
 * (400 / 401 / 403 / 404 / 405 / 501) means something specific to the caller,
 * so the status is returned and the caller decides.
 */
import { Capacitor, CapacitorHttp } from "@capacitor/core";

export const GATEWAY = "https://gateway.aajneetiadvertising.com";

/**
 * The referrer the gateway expects. Shared with the rest of the app's
 * services, which rely on the browser/WebView sending it for them.
 */
export const REFERER = "https://crm.aajneeti.com/";

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
    return {
      status: response.status,
      data: safeParse(response.data),
      raw,
    };
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
