# Build OTP verification: login 2FA + export step-up

You are adding two separate OTP features to the AAJneeti mobile CRM (Capacitor).
They share one 6-digit input component but are **different flows with different
lifetimes**. Build both exactly as specified. Do not improvise copy, colours, or
error handling — every string and hex value below is taken from the shipped web
CRM, and the two apps must match.

---

## 0. The two features in one sentence each

1. **Login 2FA** — after username + password are accepted, the gateway emails /
   WhatsApps a 6-digit code. The user enters it to receive the 30-day session
   token. Code lives **15 minutes**.
2. **Export step-up** — a user who is *already signed in* must re-verify with a
   fresh code before any export runs. Verification elevates the session for
   **5 minutes**; exports inside that window do not ask again. Code lives
   **5 minutes**.

They are independent. A fresh login is explicitly **not** a step-up: the first
export after signing in still asks for a code.

---

## 1. API contracts

Base URL = the gateway (same one the app already uses).

### Login

| Step | Call | Returns |
|---|---|---|
| 1 | `GET /auth` with header `create-token: base64("<username>:<password>")` | `{ status: "otp_required", challengeToken, emailMasked, mobileMasked, channels, message }` |
| 2 | `POST /auth/verify` body `{ otp, challengeToken }` | `{ status: "success", token }` |
| Resend | `POST /auth/resend` body `{ challengeToken }` | `{ challengeToken, emailMasked, mobileMasked, channels, message }` |

`GET /auth` may instead return `{ token, user, acl }` — that is the **legacy
gateway**, already authenticated, no OTP. Support both (see §6, dual-mode).

If `GET /auth` returns **404 / 405 / 501**, retry once as `POST /auth` with the
same `create-token` header plus body `{ username, password }`. **Never retry a
401** — that is a definitive wrong-password and a second attempt only burns a
rate-limit slot.

### Step-up

| Step | Call | Returns |
|---|---|---|
| Trigger | any protected request (`/Export`) without recent verification | `403 { status: "step_up_required" }` |
| Send code | `POST /auth/step-up` (header `token: <auth_token>`) | `{ message, challengeToken, channels, emailMasked, mobileMasked }` |
| Verify | `POST /auth/step-up/verify` body `{ otp, challengeToken }` | `{ status: "success", token, stepUpExpiresIn }` |

**There is no resend endpoint for step-up.** "Send a new code" calls
`POST /auth/step-up` again and you **must** replace the stored `challengeToken`
with the new one — issuing a code kills the previous challenge, so reusing the
old token guarantees `invalid_challenge` on the next verify.

---

## 2. Status-code rules — get these wrong and the feature is broken

| Response | Meaning | Action |
|---|---|---|
| `401` anywhere | session is dead | log out (existing behaviour) |
| `403` with `status: "step_up_required"` | needs verification | open the dialog. **NEVER log out** |
| `403` without that status | role ACL refusal | surface as-is. **Do not ask for a code** |
| `400` from `/verify` | wrong or expired code | keep the dialog open. **NEVER log out** |
| `404 / 405 / 501` from `/auth/step-up` | this gateway has no step-up | proceed with the action — there is nothing to verify against. Cache this so the next export doesn't pay for another 404 |

Treating a 403 step-up as a logout turns "confirm it is you" into "you have been
signed out" — alarming, and it loses whatever the user was doing.

Only 404/405/501 may be read as "route absent". A 400, 401 or 500 is the gateway
answering *about this request*; waving those through silently bypasses
verification.

### `/auth/step-up/verify` 400 bodies

Map `data.status` to copy, and to whether the input stays usable:

| `status` | Message | Clear boxes? | Input stays live? |
|---|---|---|---|
| `invalid_otp` | `That code is not right. Check it and try again.` | yes | yes |
| `otp_expired` | `That code has expired. Send a new one to continue.` | no | no |
| `invalid_challenge` | `This verification is no longer valid. Send a new code to continue.` | no | no |
| anything else | `Could not verify that code. Please try again.` | yes | yes |

A wrong code is worth retyping. A dead challenge is not — nothing typed into
those boxes can succeed, so leaving them live just collects another failure.

---

## 3. Flow A — login 2FA, point by point

1. User submits username + password. **Trim the username** (mobile autocomplete
   appends a space and the backend compares verbatim). **Send the password
   exactly as typed** — a trailing space can be a real character, and stripping
   it locks the account out.
2. `GET /auth`. On `otp_required`, store a challenge object:
   `{ challengeToken, emailMasked, mobileMasked, channels, message, gateway, issuedAt: Date.now() }`
3. Persist that challenge to session storage under a key like
   `pending_login_challenge`, so an accidental app reload on the OTP screen does
   not throw the code away and force a fresh login. Remove it on success or on
   "Use a different account".
4. Show the OTP screen (§5).
5. On submit: `POST /auth/verify` with the OTP **stripped to digits**
   (`String(otp).replace(/\D/g, "")`). A pasted code arrives as `"123 456"` and
   the gateway reads that as an incorrect code rather than malformed input.
6. On success you get **only a token** — no user, no ACL. You must then:
   - `GET /App/user` with header `token: <sessionToken>` → `{ user, acl }`
   - `GET /User/{id}` to backfill `rolesNames` (role names drive every
     role-gated screen, and neither `/auth` nor `/App/user` is guaranteed to
     include them). **This call failing is non-fatal** — a session with no role
     names is still usable, just one where role-gated sections stay hidden.
     That is the safe direction to fail.
   - Build the login object and persist it.
7. **Keep the storage key `auth_token`.** Do not rename it to `crm_token`. It is
   read in ~123 places and every one just forwards it as the `token` header.
8. Reset any step-up elevation on login (see §4) — a fresh login is not a
   step-up.

### Resend (login)

Calls `POST /auth/resend`, and the returned `challengeToken` **replaces** the old
one. Rebuild the challenge with a new `issuedAt`, which restarts both the
15-minute expiry and the 60-second cooldown.

---

## 4. Flow B — export step-up, point by point

### Elevation bookkeeping

Store one value: when the elevation ends.

- **Use `stepUpExpiresIn` (a duration), NOT `stepUpUntil` (a server timestamp).**
  A device whose clock is an hour behind would read the absolute timestamp as an
  hour of elevation and stop asking for codes. Read as a duration, a wrong clock
  costs nothing — both ends of the comparison are wrong by the same amount.
- `isElevated()` = `Date.now() + 15000 < storedUntil`. The **15-second margin**
  is not optional: without it a request can be authorised locally and still
  arrive at the gateway after the window shuts, producing exactly the 403 the
  ask-first check exists to avoid.
- Keep an in-memory mirror alongside the stored value, for platforms where
  storage throws.
- Reset the elevation on login, on logout, and whenever a 403 proves the local
  record was out of date.

### The gate

- Mount **one** dialog, at app root, **outside the router**. A dialog inside a
  route unmounts on navigation and leaves the awaiting promise pending forever.
- It registers an "opener" function with the service layer. A service module
  cannot render a dialog, and the dialog cannot live at each call site because
  several call sites share it.
- **One dialog at a time.** Hold a single shared pending promise. Two quick taps
  on Export, or parallel protected calls, each reach the gate independently —
  without the shared promise each opens its own dialog, and because every
  `/auth/step-up` call issues a new challengeToken and kills the previous one,
  the first dialog's code is dead before it is typed.

### `ensureStepUp()` — ask before firing

```
if (gatewayHasNoStepUp || isElevated()) -> resolve immediately
else -> send code, open dialog, await a correct code, then:
          swap the stored auth_token for the re-issued token
          record the elevation from stepUpExpiresIn
```

The token swap is **mandatory**. The re-issued token replaces the stored one; it
is an ordinary session token that keeps working for everything else after the 5
minutes lapse. Skip the swap and every protected action keeps answering 403.

### `withStepUp(send)` — the safety net

Wrap protected requests. If the response is 403 **and** the body carries
`status: "step_up_required"`: reset the elevation, run `ensureStepUp()`, then
call `send()` again — **once**. `send` must rebuild its own request each time; a
body already consumed cannot be replayed. If the second attempt is refused too,
return that response as-is; looping would reopen the dialog against a gateway
that will never be satisfied.

### Cancellation

Closing the dialog must reject with a distinguishable cancellation (a flag on the
error, not a message string). Every call site checks it and **stays silent** — a
toast saying "Export failed" after someone deliberately backed out is noise and
reads as a bug.

### Where it hooks in

Call `ensureStepUp()` **before** collecting records for an export, not after.
Verifying after a 40-second collection is a poor trade. Also check the export's
own selection cap before asking for a code, so a doomed export never prompts for
an OTP first.

---

## 5. The shared 6-digit input — exact behaviour

One component, used by both flows. Differences are **props**, and the defaults
are the login values.

| Prop | Login | Step-up |
|---|---|---|
| title / header block | `Enter the 6-digit code`, shown | header hidden (`renderHeader=false`) — the dialog draws its own |
| TTL | 15 min | 5 min |
| submit label | `Verify & sign in` | `Verify` |
| busy label | `Verifying…` | `Verifying…` |
| resend label | `Resend code` | `Send a new code` |
| back label | `Use a different account` | `Cancel` |

Behaviour that must be in the shared component, not written twice:

1. **Autofocus box 1 on mount.** Without it the user taps a 6-box row before
   typing, and on mobile the keyboard needs a second tap.
2. **Paste / autofill spreads across boxes.** Any input event delivering more
   than one character is a paste or an autofill dropping the whole code into one
   box. Strip non-digits, distribute from the current index, focus the last box
   that received a digit. Treating it as a single digit silently drops five.
3. **Typing advances** to the next box.
4. **Backspace on an empty box** steps back *and clears the previous one*.
5. **Arrow left / right** move between boxes.
6. **Focus selects** the box contents.
7. **Expiry countdown driven from a deadline** (`issuedAt + ttlMs`), ticked once
   a second — never by decrementing a counter. A backgrounded app throttles
   timers and a decrementing counter drifts far behind real time.
8. **Resend cooldown is 60 seconds, not 30.** This is a backend constraint, not a
   preference: WhatsApp refuses to re-send to the same number inside 60s while
   email re-sends immediately. At 30s a user on both channels got a fresh email
   and no WhatsApp message, so the code in the inbox and the one on the phone
   disagreed.
9. **Two separate reset triggers:**
   - a new code (`issuedAt` changes) → clear boxes, reset cooldown, restart TTL
   - a *rejected* code → clear boxes **only**. Do not touch the timers: the
     rejected code and the one still pending share a lifetime, and restarting
     the clock hands the user five minutes the gateway is not honouring.
10. **Submit disabled** unless all 6 digits are present, not loading, not
    expired.
11. **Show the server's `message` verbatim.** Do not compose your own. The code
    goes to email, WhatsApp, or both, and only the server knows which — it
    returns one of three message variants. Composing copy locally told WhatsApp
    users to check an inbox that received nothing. Fallbacks, used only when
    `message` is absent:
    - email only → `Sent to {emailMasked}. Check your spam folder if it has not arrived.`
    - mobile only → `Sent on WhatsApp to {mobileMasked}.`
    - neither → `We sent a verification code to your registered email address.`
12. **Channel icon follows the channel.** A mail icon above "sent on WhatsApp"
    reads as a mismatch, and the icon registers before the sentence does:
    - `["whatsapp"]` only → message-circle
    - both → shield-check
    - anything else / unknown → mail-check (what every older gateway used)

---

## 6. Dual-mode — do not hard-switch to OTP

2FA is served by one gateway; the other still answers the old
`{ token, user, acl }` payload. **Nothing may decide the flow in advance.** Ask
the gateway and react to what comes back. If the app simply switched to the OTP
flow, sign-in breaks the moment it ships against the legacy gateway.

Same principle for step-up: cache "this gateway has no step-up" after a
404/405/501 and proceed. A gateway without `/auth/step-up` is also not guarding
`/Export`, so proceeding is *correct*, not permissive — there is nothing to
verify against. It is **not** a way to skip verification on a gateway that has
it: that gateway answers 200, the flag never trips, and the 403 net still
catches a stale local record.

There is also an **exempt-account** mechanism: one username (`aajneeti`) signs in
without OTP, routed to the no-OTP gateway, and its session is pinned to that
gateway because the token is only valid there. Compare case-insensitively and
trimmed. This is a documented stopgap — keep it as a single list that can be
emptied, not scattered conditionals.

---

## 7. Exact design

Brand colour `#AC2334` throughout. Dark-mode variants `#E05A6B` (borders/focus)
and `#E8798A` (links).

### OTP input boxes

- 6 boxes, equal width, `grid-cols-6`, gap `8px` (`10px` at ≥640px)
- Each box: height `52px`, radius `12px`, card background, **centred**,
  `20px` font, semibold, vertical padding `0.7rem`
- Focus ring: 4px at 10% brand opacity
- Border states:
  | State | Border |
  |---|---|
  | empty | `#D5CFC8` |
  | filled | `#AC2334` @ 60% |
  | focused | `#AC2334` |
  | error | red-300, ring red-500 @ 10% |
  | dark, empty | slate-500 |
  | dark, filled | `#E05A6B` @ 70% |
- `inputMode="numeric"` for the number pad; `autocomplete="one-time-code"` on
  the **first box only**, `off` on the rest
- `aria-label` per box: `Digit {n} of 6`
- Disabled while loading or expired, at 60% opacity

### "Where the code went" block (login only)

Radius `12px`, border `#E6DFD6`, background `#FBF8F4`, padding `14px`, icon
`18px` in brand colour with `10px` gap, title 14px semibold slate-800, body 12px
slate-600 with relaxed line height and word-break on the masked address.

### Error banner

Radius `12px`, border red-200, background red-50, padding `14px`, alert-circle
icon `16px` red-500, text 14px red-700. Enters with a 6px downward slide.
`role="alert"`.

### Countdown row

`10px` below the boxes, 12px text, space-between:
- left: `Expires in <strong>m:ss</strong>` — the number in **tabular-nums** so it
  does not jitter as digits change; slate-500 label, slate-700 figure
- expired instead: `This code has expired — request a new one.` in red-600,
  medium weight
- right: resend button, semibold brand colour; disabled → slate-400 and
  `not-allowed`; labels `Sending…` / `{resendLabel} in {n}s` / `{resendLabel}`

### Submit button

Full width, radius `12px`, background `#AC2334`, vertical padding `14px`, 14px
semibold white, soft brand-tinted shadow, hover `#961e2d`, disabled 70% opacity.
Content: shield-check `16px` + label; while busy: spinning loader `18px` + busy
label. `aria-busy` while loading. Press feedback: scale 1.005 on hover, 0.99 on
tap (spring, stiffness 400, damping 25).

*(A festive variant also exists: pill radius, gradient `#8E1B2B → #A81F32 →
#7E1626`, 16px padding, 16px text. Build it switchable and leave it off by
default.)*

### Back / cancel link

Centred below the button, 12px medium slate-500, arrow-left `14px`, hover
slate-700.

### Step-up dialog shell

- Overlay: full-screen, z-index 80, `black @ 45%` + `6px` backdrop blur, fades
  in over `0.18s`
- **No tap-through dismiss.** Every other dialog in the app closes on a backdrop
  tap; this one is answering "is this really you?" and a stray tap beside the
  card must not be the answer. Cancel and the hardware back gesture are the only
  ways out.
- Card: max width `448px`, radius `16px`, 1px border, card background, padding
  `20px` (`24px` at ≥640px), heavy shadow. Enters `y: +16px, scale 0.97` over
  `0.22s` ease-out; exits `y: +8px, scale 0.98`
- Header row: `44×44` rounded-`12px` badge filled brand @ 10%, shield-check
  `20px` brand, `14px` gap
  - Title `17px` semibold: **`Confirm it is you`**
  - Subtitle `13px` muted, `4px` below: **`This action needs a fresh verification code.`**
- Server message: `16px` above the input, `13px` muted, word-break. Fallbacks:
  - mobile only → `We sent a 6-digit code on WhatsApp to {mobileMasked}.`
  - otherwise → `We sent a 6-digit verification code to your registered contact details.`
- Hardware back / Escape cancels — **but not while a verify is in flight**. That
  request is about to swap the session token, and dropping the dialog mid-way
  leaves the caller awaiting a promise that was already rejected.

### Form entry animation

Children stagger `0.06s` with `0.05s` initial delay, each rising `12px` into
place.

### Why the two screens look identical

Deliberate. The step-up form is the sign-in form at a later step — same radius,
same focus ring, same button. A different look here would read as a third-party
page asking for a code, which is exactly the shape of a phishing prompt.

---

## 8. Capacitor-specific adaptations

These differ from web and need your judgement — state what you chose:

1. **`autocomplete="one-time-code"` will not fire.** Codes arrive by email and
   WhatsApp, not SMS, so neither iOS nor Android offers them to the keyboard.
   Keep the attribute (harmless, works if SMS is added later) but do not rely on
   it — paste handling is the real path, so make sure a long-press paste into
   any box spreads correctly.
2. **Session storage semantics.** On web the elevation is deliberately scoped to
   the tab so it cannot outlive it. A Capacitor WebView has no tabs and persists
   until the app is killed. Decide explicitly whether elevation should survive
   backgrounding; the safe reading of the original intent is that it expires with
   its 5-minute window and is cleared on app resume from a cold start.
3. **Hardware back button** must map to Cancel on the step-up dialog, and to
   "Use a different account" on the login OTP screen — not to a route pop that
   leaves the dialog mounted.
4. **Keyboard overlap.** The dialog is centred; with the number pad open on a
   small device the submit button can sit under the keyboard. Make the card
   scrollable or shift it up on keyboard show.
5. **Backgrounding mid-countdown.** The deadline-driven timer already handles
   this correctly — verify it after a real background/resume, not just in a
   browser.

---

## 9. Acceptance checklist

Login:
- [ ] Wrong password → 401, error shown, **no retry**, no OTP screen
- [ ] Correct password → OTP screen, server `message` shown verbatim
- [ ] Paste a 6-digit code into box 1 → all six fill, focus lands on box 6
- [ ] Backspace from an empty box clears the previous one
- [ ] Resend disabled for 60s, label counts down, then re-enables
- [ ] Resend → boxes clear, 15:00 restarts, **old challengeToken discarded**
- [ ] Wrong code → boxes clear, countdown **does not** restart
- [ ] Let it hit 0:00 → boxes disable, expiry copy shown, resend still works
- [ ] Reload the app on the OTP screen → challenge survives
- [ ] Success → `auth_token` stored, user + ACL loaded from `/App/user`, roles
      backfilled, role-gated screens correct
- [ ] Legacy gateway (`{ token, user, acl }`) → signs in with **no** OTP screen

Step-up:
- [ ] First export after signing in **asks for a code** (fresh login ≠ step-up)
- [ ] Second export within 5 minutes does **not** ask
- [ ] Export after 5 minutes asks again
- [ ] Two fast taps on Export → **one** dialog, one code
- [ ] Cancel → no error toast, user still signed in, export abandoned
- [ ] Wrong code → dialog stays open, boxes clear, still signed in
- [ ] Expired code → dialog stays open, boxes disabled, "Send a new code" works
- [ ] "Send a new code" → new challengeToken replaces the old one
- [ ] 403 **without** `step_up_required` → plain error, **no dialog**
- [ ] 401 during verify → logs out
- [ ] Gateway with no `/auth/step-up` (404) → export proceeds, no dialog, and the
      next export does not re-probe
- [ ] Backdrop tap does **nothing**; hardware back cancels; back during an
      in-flight verify does nothing

---

## 10. Non-negotiables, restated

1. `auth_token` is the storage key. Do not rename it.
2. Use `stepUpExpiresIn` (duration), never `stepUpUntil` (timestamp).
3. Keep the 15-second elevation margin.
4. Swap in the re-issued token after a successful step-up verify.
5. Replace the `challengeToken` on every resend / new code.
6. One dialog at a time, mounted once, outside the router.
7. 403 step-up is never a logout. 400 is never a logout.
8. Strip the OTP to digits before sending.
9. Show the server's `message` verbatim.
10. Resend cooldown is 60 seconds.
11. Build dual-mode — never hard-switch to the OTP flow.
