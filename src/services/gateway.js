/**
 * gateway
 *
 * The ONE place the backend's address is written down.
 *
 * It used to be a string literal in 105 places across 19 service files, which
 * meant moving the app between gateways was a 105-site edit -- and the 2FA
 * rollout needs exactly that move, because only this gateway issues OTPs.
 *
 * The 2FA integration guide was written against
 * `test-gateway.aajneetiadvertising.com`, but that host was only ever for
 * testing -- the OTP endpoints have since been rolled out to this one, which
 * is where the app has always pointed. Its probe responses match the guide's
 * documented ones exactly (`400 Missing 'create-token' header`,
 * `401 Invalid credentials`), which confirms it now serves the OTP flow.
 *
 * Deliberately dependency-free so every service can import it without risking
 * an import cycle.
 */
export const API_BASE = "https://gateway.aajneetiadvertising.com";

/**
 * The referrer the gateway expects.
 *
 * `.social`, not `.com` -- the integration guide names
 * `https://crm.aajneeti.social/`. In a browser this is set automatically and
 * the header cannot be overridden from JS; it is declared here for the native
 * path and as the single record of what the backend is configured to accept.
 */
export const REFERER = "https://crm.aajneeti.social/";
