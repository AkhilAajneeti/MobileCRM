/**
 * auth.service
 *
 * Flow A of the OTP spec: login 2FA, in dual mode.
 *
 * NOTHING here decides the flow in advance. We ask the gateway and react to
 * what comes back: an OTP-capable gateway answers `{ status: "otp_required" }`,
 * the legacy one answers `{ token, user, acl }` and is already authenticated.
 * Hard-switching to the OTP flow would break sign-in the moment the app ships
 * against the legacy gateway.
 */
import {
  GATEWAY,
  GatewayError,
  apiRequest,
  isRouteAbsent,
  utf8Base64,
} from "./httpClient";
import { resetElevation } from "./stepUp.service";

/** Survives an accidental reload of the OTP screen. */
export const CHALLENGE_STORAGE_KEY = "pending_login_challenge";

/** Where the pinned gateway for this session is remembered. */
const GATEWAY_STORAGE_KEY = "auth_gateway";

/**
 * Documented stopgap: accounts that sign in without OTP, routed to the
 * no-OTP gateway. Deliberately ONE list that can be emptied, not conditionals
 * scattered through the flow. Compared trimmed + case-insensitively.
 */
const EXEMPT_USERNAMES = ["aajneeti"];

/**
 * The gateway that serves exempt accounts.
 *
 * Both constants point at the same host until the second gateway's URL is
 * known; the moment it is, change this one line. The session is pinned to
 * whichever gateway issued its token, because the token is only valid there.
 */
const LEGACY_GATEWAY = GATEWAY;

export const isExemptAccount = (username) =>
  EXEMPT_USERNAMES.includes(String(username || "").trim().toLowerCase());

export const gatewayForUsername = (username) =>
  isExemptAccount(username) ? LEGACY_GATEWAY : GATEWAY;

/** The gateway this session's token belongs to. */
export const getPinnedGateway = () => {
  try {
    return localStorage.getItem(GATEWAY_STORAGE_KEY) || GATEWAY;
  } catch {
    return GATEWAY;
  }
};

const pinGateway = (gateway) => {
  try {
    localStorage.setItem(GATEWAY_STORAGE_KEY, gateway);
  } catch {
    /* storage blocked -- requests fall back to the default gateway */
  }
};

/* ------------------------------------------------------------------ *
 * Challenge persistence
 * ------------------------------------------------------------------ */

export const loadPendingChallenge = () => {
  try {
    const raw = sessionStorage.getItem(CHALLENGE_STORAGE_KEY);
    if (!raw) return null;
    const challenge = JSON.parse(raw);
    return challenge?.challengeToken ? challenge : null;
  } catch {
    return null;
  }
};

export const savePendingChallenge = (challenge) => {
  try {
    sessionStorage.setItem(CHALLENGE_STORAGE_KEY, JSON.stringify(challenge));
  } catch {
    /* storage blocked -- a reload then costs a fresh login, nothing worse */
  }
};

export const clearPendingChallenge = () => {
  try {
    sessionStorage.removeItem(CHALLENGE_STORAGE_KEY);
  } catch {
    /* ignore */
  }
};

/** Shape the gateway's OTP payload into the challenge the UI drives from. */
const buildChallenge = (body, gateway) => ({
  challengeToken: body?.challengeToken || null,
  emailMasked: body?.emailMasked || null,
  mobileMasked: body?.mobileMasked || null,
  channels: Array.isArray(body?.channels) ? body.channels : [],
  message: body?.message || null,
  gateway,
  // Drives BOTH the 15-minute expiry and the 60-second resend cooldown, so a
  // resend restarts both by virtue of being a new timestamp.
  issuedAt: Date.now(),
});

/* ------------------------------------------------------------------ *
 * Step 1 -- username + password
 * ------------------------------------------------------------------ */

/**
 * Returns either
 *   { mode: "otp", gateway, challenge }           -- OTP gateway
 *   { mode: "legacy", gateway, token, user, acl } -- legacy gateway, done
 */
export const requestLogin = async ({ username, password }) => {
  // Trim the USERNAME only: mobile autocomplete appends a space and the
  // backend compares verbatim. The PASSWORD goes exactly as typed -- a
  // trailing space can be a real character, and stripping it locks the
  // account out.
  const user = String(username).trim();
  const gateway = gatewayForUsername(user);
  const createToken = utf8Base64(`${user}:${password}`);

  let response = await apiRequest({
    url: `${gateway}/auth`,
    method: "GET",
    headers: { "create-token": createToken },
  });

  // Only an absent route may be retried as POST. A 401 is a definitive wrong
  // password -- retrying it just burns a rate-limit slot.
  if (isRouteAbsent(response.status)) {
    response = await apiRequest({
      url: `${gateway}/auth`,
      method: "POST",
      headers: { "create-token": createToken },
      data: { username: user, password },
    });
  }

  if (response.status === 401) {
    // Prefer the gateway's own wording. It distinguishes cases this app
    // cannot -- an unknown user on this gateway reads the same as a wrong
    // password otherwise, and that cost real debugging time.
    throw new GatewayError(
      response.data?.error ||
        response.data?.message ||
        "Invalid username or password.",
      response,
    );
  }

  if (response.status < 200 || response.status >= 300) {
    throw new GatewayError(
      response.data?.error ||
        response.data?.message ||
        `Could not sign you in (HTTP ${response.status}). Please try again.`,
      response,
    );
  }

  const body = response.data;

  if (body?.status === "otp_required") {
    const challenge = buildChallenge(body, gateway);
    if (!challenge.challengeToken) {
      throw new GatewayError(
        "The server asked for a code but did not issue a challenge. Please try again.",
        response,
      );
    }
    return { mode: "otp", gateway, challenge };
  }

  // Legacy gateway: already authenticated, no OTP.
  if (body?.token) {
    return {
      mode: "legacy",
      gateway,
      token: body.token,
      user: body.user,
      acl: body.acl ?? null,
      secret: body.secret ?? null,
    };
  }

  throw new GatewayError(
    "Unexpected response from the server. Please try again.",
    response,
  );
};

/* ------------------------------------------------------------------ *
 * Step 2 -- verify / resend
 * ------------------------------------------------------------------ */

/** The gateway reads "123 456" as a wrong code, not as malformed input. */
export const toDigits = (otp) => String(otp ?? "").replace(/\D/g, "");

/**
 * Maps a 400 body's `status` to copy, and to whether the boxes stay usable.
 *
 * A wrong code is worth retyping. A dead challenge is not -- nothing typed
 * into those boxes can succeed, so leaving them live only collects another
 * failure.
 */
/**
 * Work out WHICH verify failure this is, across two response shapes.
 *
 * The spec describes `400 { status: "invalid_otp" | "otp_expired" |
 * "invalid_challenge" }`. The gateway this app actually talks to answers with
 * `error` strings instead, and uses 401 for a wrong or expired code:
 *
 *   400 { error: "Invalid or corrupted challenge token" }
 *   401 { error: "Invalid OTP code. Please try again." }
 *   401 { error: "OTP has expired. Please log in again." }
 *
 * Reading only `status` would classify every one of those as "something else",
 * and -- far worse -- a 401 would be taken for a dead session and log the user
 * out for mistyping a digit.
 */
export const classifyVerifyFailure = (body) => {
  if (body?.status) return body.status;

  const text = String(body?.error || body?.message || "").toLowerCase();
  if (!text) return null;
  if (text.includes("expired")) return "otp_expired";
  if (text.includes("challenge")) return "invalid_challenge";
  if (text.includes("otp") || text.includes("code")) return "invalid_otp";
  return null;
};

/** True when a 401 is a rejected CODE rather than a dead session. */
export const isOtpRejection = (status, body) =>
  status === 400 || (status === 401 && classifyVerifyFailure(body) !== null);

export const mapVerifyFailure = (body) => {
  switch (classifyVerifyFailure(body)) {
    case "invalid_otp":
      return {
        message: "That code is not right. Check it and try again.",
        clearBoxes: true,
        inputLive: true,
      };
    case "otp_expired":
      return {
        message: "That code has expired. Send a new one to continue.",
        clearBoxes: false,
        inputLive: false,
      };
    case "invalid_challenge":
      return {
        message:
          "This verification is no longer valid. Send a new code to continue.",
        clearBoxes: false,
        inputLive: false,
      };
    default:
      return {
        message: "Could not verify that code. Please try again.",
        clearBoxes: true,
        inputLive: true,
      };
  }
};

/** An error carrying the box/input directives above. */
export class OtpRejectedError extends Error {
  constructor({ message, clearBoxes, inputLive, status, data }) {
    super(message);
    this.name = "OtpRejectedError";
    this.clearBoxes = clearBoxes;
    this.inputLive = inputLive;
    this.status = status;
    this.data = data;
  }
}

/** POST /auth/verify -> the 30-day session token (and nothing else). */
export const verifyLoginOtp = async ({ otp, challengeToken, gateway }) => {
  const response = await apiRequest({
    url: `${gateway || GATEWAY}/auth/verify`,
    method: "POST",
    data: { otp: toDigits(otp), challengeToken },
  });

  // A wrong or expired code: the screen stays, the user never logs out. This
  // gateway reports those as 401, so status alone cannot decide it.
  if (isOtpRejection(response.status, response.data)) {
    const mapped = mapVerifyFailure(response.data);
    throw new OtpRejectedError({
      ...mapped,
      status: response.status,
      data: response.data,
    });
  }

  if (response.status < 200 || response.status >= 300 || !response.data?.token) {
    throw new GatewayError(
      response.data?.error ||
        response.data?.message ||
        `Could not verify that code (HTTP ${response.status}).`,
      response,
    );
  }

  return response.data.token;
};

/**
 * POST /auth/resend -- the returned challengeToken REPLACES the old one, and
 * the new `issuedAt` restarts both the 15-minute expiry and the 60s cooldown.
 */
export const resendLoginOtp = async ({ challengeToken, gateway }) => {
  const base = gateway || GATEWAY;
  const response = await apiRequest({
    url: `${base}/auth/resend`,
    method: "POST",
    data: { challengeToken },
  });

  if (response.status < 200 || response.status >= 300) {
    throw new GatewayError(
      response.data?.error ||
        response.data?.message ||
        `Could not send a new code (HTTP ${response.status}).`,
      response,
    );
  }

  const challenge = buildChallenge(response.data, base);
  // Keep the old token only if the gateway declined to issue a new one.
  if (!challenge.challengeToken) challenge.challengeToken = challengeToken;
  return challenge;
};

/* ------------------------------------------------------------------ *
 * Step 3 -- turn a token into a session
 * ------------------------------------------------------------------ */

/** GET /App/user -- verification returns ONLY a token, so user + ACL come from here. */
const fetchAppUser = async (token, gateway) => {
  const response = await apiRequest({
    url: `${gateway}/App/user`,
    method: "GET",
    token,
  });

  if (response.status < 200 || response.status >= 300 || !response.data) {
    throw new GatewayError(
      `Signed in, but could not load your profile (HTTP ${response.status}).`,
      response,
    );
  }

  return {
    user: response.data.user || response.data,
    acl: response.data.acl ?? null,
  };
};

/**
 * GET /User/{id} -- backfills `rolesNames`, which drives every role-gated
 * screen. Neither /auth nor /App/user is guaranteed to include them.
 *
 * Failing here is NON-FATAL: a session with no role names is still usable,
 * just one where role-gated sections stay hidden. That is the safe direction.
 */
const fetchRoleNames = async (userId, token, gateway) => {
  try {
    const response = await apiRequest({
      url: `${gateway}/User/${userId}`,
      method: "GET",
      token,
    });
    if (response.status < 200 || response.status >= 300) return [];

    const raw = response.data?.rolesNames ?? response.data?.roles;
    return (Array.isArray(raw) ? raw : Object.values(raw || {}))
      .map((role) => (typeof role === "string" ? role : role?.name))
      .filter(Boolean);
  } catch {
    return [];
  }
};

/** The session object the rest of the app reads. */
const buildLoginObject = ({ user, token, secret, acl, roles }) => ({
  id: user?.id,
  username: user?.userName,
  token,
  secret: secret ?? null,
  type: user?.type,
  acl: acl || null,
  roles,
  teamsIds: user?.teamsIds?.length
    ? user.teamsIds
    : user?.teamIds?.length
      ? user.teamIds
      : user?.defaultTeamId
        ? [user.defaultTeamId]
        : [],
  teamId: user?.teamId || user?.defaultTeamId || null,
  role: roles?.[0] || "",
  assignedUserId: user?.id,
});

/**
 * Persist a session.
 *
 * The storage key stays `auth_token`. It is read in ~123 places, each of which
 * just forwards it as the `token` header -- renaming it would mean touching
 * every one of them for no gain.
 */
export const persistSession = async ({ token, user, acl, secret, gateway }) => {
  const base = gateway || GATEWAY;
  let resolvedUser = user;
  let resolvedAcl = acl ?? null;

  if (!resolvedUser) {
    const loaded = await fetchAppUser(token, base);
    resolvedUser = loaded.user;
    resolvedAcl = loaded.acl ?? resolvedAcl;
  }

  const rolesFromAuth = Object.values(resolvedUser?.rolesNames || {}).filter(
    Boolean,
  );
  const backfilled = resolvedUser?.id
    ? await fetchRoleNames(resolvedUser.id, token, base)
    : [];
  const roles = backfilled.length ? backfilled : rolesFromAuth;

  const loginObject = buildLoginObject({
    user: resolvedUser,
    token,
    secret,
    acl: resolvedAcl,
    roles,
  });
  const jsonString = JSON.stringify(loginObject);

  pinGateway(base);
  localStorage.setItem("auth_token", token);
  localStorage.setItem("login_object", jsonString);
  localStorage.setItem("isAuthenticated", "true");
  if (resolvedAcl) localStorage.setItem("acl", JSON.stringify(resolvedAcl));

  // A fresh login is explicitly NOT a step-up: the first export after signing
  // in still asks for a code.
  resetElevation();
  clearPendingChallenge();

  // Fresh login -> let the dashboard summary alert re-appear.
  try {
    sessionStorage.removeItem("dashboardSummaryAlertDismissed");
    sessionStorage.removeItem("dashboardSummaryAlertSoundPlayed");
  } catch {
    /* sessionStorage unavailable -- alert behaves as first-visit */
  }

  return loginObject;
};
