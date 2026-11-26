/**
 * stepUp.service
 *
 * Flow B of the OTP spec: export step-up.
 *
 * A signed-in user must re-verify with a fresh code before an export runs.
 * Verification elevates the session for ~5 minutes; exports inside that window
 * do not ask again. A fresh login is NOT a step-up.
 *
 * This module owns three things:
 *   1. the elevation bookkeeping (when does the elevation end)
 *   2. the gate: one dialog, mounted once, opened through a registered opener
 *   3. the 403 safety net for when the local record is out of date
 */
import { GatewayError, apiRequest, isRouteAbsent } from "./httpClient";
import {
  OtpRejectedError,
  getPinnedGateway,
  mapVerifyFailure,
  toDigits,
} from "./auth.service";

/**
 * Where the elevation deadline lives.
 *
 * sessionStorage, deliberately. On web the elevation is scoped to the tab so
 * it cannot outlive it. A Capacitor WebView has no tabs and keeps
 * sessionStorage until the app process is killed -- which lands exactly on the
 * safe reading of the original intent: the elevation expires with its 5-minute
 * window, and a cold start begins with no elevation at all. Backgrounding does
 * not extend it, because the deadline is absolute.
 */
const UNTIL_KEY = "step_up_until";
const UNSUPPORTED_KEY = "step_up_unsupported";

/**
 * The margin is not optional. Without it a request can be authorised locally
 * and still arrive at the gateway after the window shuts -- producing exactly
 * the 403 that asking first exists to avoid.
 */
const ELEVATION_MARGIN_MS = 15000;

/* In-memory mirrors, for platforms where storage throws. */
let memoryUntil = 0;
let memoryUnsupported = false;

/* The single mounted dialog's opener, and the single shared pending promise. */
let openDialog = null;
let pendingVerification = null;

/* ------------------------------------------------------------------ *
 * Elevation bookkeeping
 * ------------------------------------------------------------------ */

const readUntil = () => {
  try {
    const stored = Number(sessionStorage.getItem(UNTIL_KEY) || 0);
    return Number.isFinite(stored) && stored > 0 ? stored : memoryUntil;
  } catch {
    return memoryUntil;
  }
};

const writeUntil = (until) => {
  memoryUntil = until;
  try {
    sessionStorage.setItem(UNTIL_KEY, String(until));
  } catch {
    /* storage blocked -- the in-memory mirror carries it */
  }
};

/** Clear the elevation: on login, on logout, and whenever a 403 disproves it. */
export const resetElevation = () => {
  memoryUntil = 0;
  try {
    sessionStorage.removeItem(UNTIL_KEY);
  } catch {
    /* ignore */
  }
};

export const isElevated = () => Date.now() + ELEVATION_MARGIN_MS < readUntil();

/**
 * Record an elevation from `stepUpExpiresIn` -- a DURATION, never
 * `stepUpUntil`, a server timestamp. A device whose clock is an hour behind
 * would read an absolute timestamp as an hour of elevation and stop asking for
 * codes entirely. Read as a duration, a wrong clock costs nothing: both ends
 * of the comparison are wrong by the same amount.
 *
 * Units are accepted either way: gateways send seconds (300) or milliseconds
 * (300000), and a "duration" under 10000 can only sensibly be seconds.
 */
export const recordElevation = (stepUpExpiresIn) => {
  const raw = Number(stepUpExpiresIn);
  const durationMs =
    !Number.isFinite(raw) || raw <= 0
      ? 5 * 60 * 1000
      : raw < 10000
        ? raw * 1000
        : raw;
  writeUntil(Date.now() + durationMs);
};

/* ------------------------------------------------------------------ *
 * "This gateway has no step-up"
 * ------------------------------------------------------------------ */

const isUnsupported = () => {
  if (memoryUnsupported) return true;
  try {
    return sessionStorage.getItem(UNSUPPORTED_KEY) === "true";
  } catch {
    return false;
  }
};

/**
 * Cached after a 404/405/501 so the next export does not pay for another
 * probe. A gateway without /auth/step-up is also not guarding /Export, so
 * proceeding is CORRECT, not permissive -- there is nothing to verify against.
 * It is not a way to skip verification on a gateway that has it: that gateway
 * answers 200, this flag never trips, and the 403 net still catches a stale
 * local record.
 */
const markUnsupported = () => {
  memoryUnsupported = true;
  try {
    sessionStorage.setItem(UNSUPPORTED_KEY, "true");
  } catch {
    /* ignore */
  }
};

/* ------------------------------------------------------------------ *
 * Cancellation
 * ------------------------------------------------------------------ */

/**
 * Cancellation is a FLAG, not a message string, so call sites can recognise it
 * without matching on copy.
 */
export class StepUpCancelledError extends Error {
  constructor() {
    super("Verification cancelled");
    this.name = "StepUpCancelledError";
    this.stepUpCancelled = true;
  }
}

export const isStepUpCancelled = (error) => Boolean(error?.stepUpCancelled);

/* ------------------------------------------------------------------ *
 * The dialog registry
 * ------------------------------------------------------------------ */

/**
 * The dialog registers itself here. A service module cannot render a dialog,
 * and the dialog cannot live at each call site because several call sites
 * share it.
 */
export const registerStepUpOpener = (opener) => {
  openDialog = opener;
  return () => {
    if (openDialog === opener) openDialog = null;
  };
};

/* ------------------------------------------------------------------ *
 * Gateway calls
 * ------------------------------------------------------------------ */

const authToken = () => {
  try {
    return localStorage.getItem("auth_token");
  } catch {
    return null;
  }
};

/**
 * POST /auth/step-up -- issues a code and returns a challenge.
 *
 * There is NO resend endpoint for step-up: "send a new code" calls this again,
 * and the caller MUST replace the stored challengeToken with the new one.
 * Issuing a code kills the previous challenge, so reusing the old token
 * guarantees `invalid_challenge` on the next verify.
 *
 * Returns null when this gateway has no step-up route.
 */
export const sendStepUpCode = async () => {
  const response = await apiRequest({
    url: `${getPinnedGateway()}/auth/step-up`,
    method: "POST",
    token: authToken(),
  });

  // ONLY an absent route may be read as "nothing to verify against". A 400,
  // 401 or 500 is the gateway answering about this request; waving those
  // through would silently bypass verification.
  if (isRouteAbsent(response.status)) {
    markUnsupported();
    return null;
  }

  // 401 anywhere means the session itself is dead -- log out.
  if (response.status === 401) {
    clearStepUpState();
    localStorage.clear();
    window.location.hash = "#/login";
    throw new GatewayError(
      "Your session has expired. Please sign in again.",
      response,
    );
  }

  if (response.status < 200 || response.status >= 300) {
    throw new GatewayError(
      response.data?.message ||
        `Could not send a verification code (HTTP ${response.status}).`,
      response,
    );
  }

  return {
    challengeToken: response.data?.challengeToken || null,
    emailMasked: response.data?.emailMasked || null,
    mobileMasked: response.data?.mobileMasked || null,
    channels: Array.isArray(response.data?.channels)
      ? response.data.channels
      : [],
    message: response.data?.message || null,
    issuedAt: Date.now(),
  };
};

/**
 * POST /auth/step-up/verify.
 *
 * On success the re-issued token REPLACES the stored one. The swap is
 * mandatory: it is an ordinary session token that keeps working for everything
 * else after the 5 minutes lapse, and skipping the swap leaves every protected
 * action answering 403.
 */
export const verifyStepUpCode = async ({ otp, challengeToken }) => {
  const response = await apiRequest({
    url: `${getPinnedGateway()}/auth/step-up/verify`,
    method: "POST",
    data: { otp: toDigits(otp), challengeToken },
  });

  // A wrong or expired code. The dialog stays open; the user is NOT logged out.
  if (response.status === 400) {
    const mapped = mapVerifyFailure(response.data);
    throw new OtpRejectedError({ ...mapped, status: 400, data: response.data });
  }

  // 401 is the one status here that DOES end the session: the token we were
  // about to elevate is dead, so there is nothing left to verify against.
  if (response.status === 401) {
    clearStepUpState();
    localStorage.clear();
    window.location.hash = "#/login";
    throw new GatewayError("Your session has expired. Please sign in again.", response);
  }

  if (response.status < 200 || response.status >= 300 || !response.data?.token) {
    throw new GatewayError(
      response.data?.message ||
        `Could not verify that code (HTTP ${response.status}).`,
      response,
    );
  }

  localStorage.setItem("auth_token", response.data.token);
  // Keep login_object's copy of the token in step with the stored one.
  try {
    const stored = JSON.parse(localStorage.getItem("login_object") || "null");
    if (stored) {
      stored.token = response.data.token;
      localStorage.setItem("login_object", JSON.stringify(stored));
    }
  } catch {
    /* login_object unreadable -- auth_token is the credential that matters */
  }

  recordElevation(response.data.stepUpExpiresIn);

  return response.data.token;
};

/* ------------------------------------------------------------------ *
 * The gate
 * ------------------------------------------------------------------ */

/**
 * Resolve when the session is elevated, asking for a code if it is not.
 *
 * ONE dialog at a time, via a single shared pending promise. Two quick taps on
 * Export, or parallel protected calls, each reach the gate independently --
 * without the shared promise each would open its own dialog, and because every
 * /auth/step-up call issues a new challengeToken and kills the previous one,
 * the first dialog's code would be dead before it was typed.
 */
export const ensureStepUp = async () => {
  if (isUnsupported() || isElevated()) return;

  if (pendingVerification) return pendingVerification;

  pendingVerification = (async () => {
    const challenge = await sendStepUpCode();

    // No step-up on this gateway -- proceed, there is nothing to verify.
    if (!challenge) return;

    if (!openDialog) {
      throw new GatewayError(
        "Verification is unavailable right now. Please try again.",
        { status: 0 },
      );
    }

    await new Promise((resolve, reject) => {
      openDialog({ challenge, resolve, reject });
    });
  })();

  try {
    await pendingVerification;
  } finally {
    pendingVerification = null;
  }
};

/**
 * The safety net, for when the local record was out of date.
 *
 * `send` MUST rebuild its own request each time -- a body already consumed
 * cannot be replayed. Retried exactly once: looping would reopen the dialog
 * against a gateway that will never be satisfied.
 */
export const withStepUp = async (send) => {
  const first = await send();

  const needsStepUp =
    first?.status === 403 && first?.data?.status === "step_up_required";

  // A 403 WITHOUT that status is a role ACL refusal: surface it as-is, and do
  // not ask for a code.
  if (!needsStepUp) return first;

  resetElevation();
  await ensureStepUp();
  return send();
};

/** Called on logout, alongside clearing the session. */
export const clearStepUpState = () => {
  resetElevation();
  memoryUnsupported = false;
  try {
    sessionStorage.removeItem(UNSUPPORTED_KEY);
  } catch {
    /* ignore */
  }
};
