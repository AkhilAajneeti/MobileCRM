import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import Icon from "../AppIcon";

/**
 * OtpCodeForm -- the shared 6-digit input.
 *
 * ONE component for both OTP flows. The differences between login 2FA and
 * export step-up are PROPS, and the defaults are the login values. Every
 * behaviour below lives here rather than at the two call sites, so the two
 * screens cannot drift apart:
 *
 *   - autofocus box 1, typing advances, arrows move, focus selects
 *   - paste / autofill spreads across the boxes
 *   - backspace on an empty box steps back AND clears the previous one
 *   - the countdown is driven from a DEADLINE, never a decremented counter
 *   - resend cooldown is 60s (a backend constraint, not a preference)
 *   - a new code resets boxes + timers; a REJECTED code resets boxes only
 *
 * Design values are the shipped web CRM's, written as literals on purpose:
 * the two apps must match, and a token that is later re-themed would silently
 * break that.
 */

const BRAND = "#AC2334";
const BRAND_HOVER = "#961E2D";

const LENGTH = 6;
const RESEND_COOLDOWN_MS = 60 * 1000;
const DEFAULT_TTL_MS = 15 * 60 * 1000;

/** m:ss, so the figure can sit in tabular-nums and not jitter. */
const formatRemaining = (ms) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

/**
 * The icon follows the channel. A mail icon above "sent on WhatsApp" reads as
 * a mismatch, and the icon registers before the sentence does.
 */
const channelIcon = (channels) => {
  const list = (channels || []).map((channel) =>
    String(channel).toLowerCase(),
  );
  const hasWhatsapp = list.includes("whatsapp");
  const hasEmail = list.includes("email");

  if (hasWhatsapp && hasEmail) return "ShieldCheck";
  if (hasWhatsapp && list.length === 1) return "MessageCircle";
  return "MailCheck";
};

/**
 * Only used when the server sent no `message`. The code goes to email,
 * WhatsApp, or both, and only the server knows which -- composing copy
 * locally once told WhatsApp users to check an inbox that received nothing.
 */
const fallbackMessage = ({ channels, emailMasked, mobileMasked }) => {
  const list = (channels || []).map((channel) =>
    String(channel).toLowerCase(),
  );
  const hasWhatsapp = list.includes("whatsapp");
  const hasEmail = list.includes("email");

  if (hasEmail && !hasWhatsapp && emailMasked) {
    return `Sent to ${emailMasked}. Check your spam folder if it has not arrived.`;
  }
  if (hasWhatsapp && !hasEmail && mobileMasked) {
    return `Sent on WhatsApp to ${mobileMasked}.`;
  }
  return "We sent a verification code to your registered email address.";
};

const emptyDigits = () => Array(LENGTH).fill("");

const OtpCodeForm = ({
  challenge,
  ttlMs = DEFAULT_TTL_MS,
  renderHeader = true,
  title = "Enter the 6-digit code",
  submitLabel = "Verify & sign in",
  busyLabel = "Verifying…",
  resendLabel = "Resend code",
  backLabel = "Use a different account",
  onSubmit,
  onResend,
  onBack,
  festive = false,
}) => {
  const [digits, setDigits] = useState(emptyDigits);
  const [error, setError] = useState(null);
  const [inputLive, setInputLive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  const inputsRef = useRef([]);
  const issuedAt = challenge?.issuedAt || 0;

  /* ---------------------------------------------------------------- *
   * Timers -- both derived from the deadline, never decremented.
   *
   * A backgrounded app throttles timers, so a decrementing counter drifts far
   * behind real time; recomputing from `issuedAt` is correct the instant the
   * app resumes.
   * ---------------------------------------------------------------- */
  useEffect(() => {
    const tick = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(tick);
  }, []);

  const expiresAt = issuedAt + ttlMs;
  const remainingMs = Math.max(0, expiresAt - now);
  const isExpired = issuedAt > 0 && remainingMs <= 0;

  const cooldownMs = Math.max(0, issuedAt + RESEND_COOLDOWN_MS - now);
  const cooldownSeconds = Math.ceil(cooldownMs / 1000);
  const resendBlocked = cooldownMs > 0 || isResending;

  /* ---------------------------------------------------------------- *
   * Two separate reset triggers.
   *
   * A NEW code (issuedAt changes) clears the boxes and restarts both timers.
   * A REJECTED code clears the boxes only -- the rejected code and the one
   * still pending share a lifetime, and restarting the clock would hand the
   * user minutes the gateway is not honouring. That reset happens where the
   * rejection is handled, not here.
   * ---------------------------------------------------------------- */
  useEffect(() => {
    if (!issuedAt) return;
    setDigits(emptyDigits());
    setError(null);
    setInputLive(true);
    setNow(Date.now());
    // Autofocus box 1: without it the user taps a 6-box row before typing,
    // and on mobile the keyboard needs a second tap.
    requestAnimationFrame(() => inputsRef.current[0]?.focus());
  }, [issuedAt]);

  const code = digits.join("");
  const isComplete = code.length === LENGTH && !digits.includes("");
  const inputsDisabled = isSubmitting || isExpired || !inputLive;
  const canSubmit = isComplete && !isSubmitting && !isExpired && inputLive;

  const focusBox = useCallback((index) => {
    const target = inputsRef.current[Math.max(0, Math.min(LENGTH - 1, index))];
    target?.focus();
    target?.select();
  }, []);

  /**
   * Any input event delivering more than one character is a paste or an
   * autofill dropping the whole code into one box. Treating it as a single
   * digit silently drops five.
   */
  const handleChange = (index, rawValue) => {
    const incoming = String(rawValue ?? "").replace(/\D/g, "");
    if (!incoming) {
      setDigits((prev) => {
        const next = [...prev];
        next[index] = "";
        return next;
      });
      return;
    }

    // Computed outside the updater: focusing is a side effect, and a state
    // updater can be invoked more than once for the same event.
    const next = [...digits];
    let cursor = index;
    for (const character of incoming) {
      if (cursor >= LENGTH) break;
      next[cursor] = character;
      cursor += 1;
    }

    setDigits(next);
    setError(null);
    // Focus the last box that received a digit.
    focusBox(Math.min(cursor, LENGTH - 1));
  };

  const handleKeyDown = (index, event) => {
    if (event.key === "Backspace") {
      if (digits[index]) {
        setDigits((prev) => {
          const next = [...prev];
          next[index] = "";
          return next;
        });
        return;
      }
      // Empty box: step back AND clear the previous one.
      if (index > 0) {
        event.preventDefault();
        setDigits((prev) => {
          const next = [...prev];
          next[index - 1] = "";
          return next;
        });
        focusBox(index - 1);
      }
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      focusBox(index - 1);
      return;
    }

    if (event.key === "ArrowRight" && index < LENGTH - 1) {
      event.preventDefault();
      focusBox(index + 1);
    }
  };

  const handlePaste = (index, event) => {
    const pasted = event.clipboardData?.getData("text");
    if (!pasted) return;
    event.preventDefault();
    handleChange(index, pasted);
  };

  /* ---------------------------------------------------------------- *
   * Submit / resend
   * ---------------------------------------------------------------- */

  const submit = async (event) => {
    event?.preventDefault?.();
    if (!canSubmit) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit?.(code);
    } catch (rejection) {
      setError(
        rejection?.message || "Could not verify that code. Please try again.",
      );
      // The rejection decides whether the boxes are worth retyping into.
      if (rejection?.clearBoxes !== false) {
        setDigits(emptyDigits());
        requestAnimationFrame(() => focusBox(0));
      }
      if (rejection?.inputLive === false) setInputLive(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resend = async () => {
    if (resendBlocked) return;
    setIsResending(true);
    setError(null);
    try {
      // The caller replaces the challenge; the new `issuedAt` restarts the
      // boxes, the TTL and this cooldown through the effect above.
      await onResend?.();
    } catch (failure) {
      setError(failure?.message || "Could not send a new code.");
    } finally {
      setIsResending(false);
    }
  };

  const serverMessage = useMemo(
    () => challenge?.message || fallbackMessage(challenge || {}),
    [challenge],
  );

  const resendText = isResending
    ? "Sending…"
    : cooldownSeconds > 0
      ? `${resendLabel} in ${cooldownSeconds}s`
      : resendLabel;

  /* ---------------------------------------------------------------- *
   * Render
   * ---------------------------------------------------------------- */

  const container = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
  };
  const child = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.form
      onSubmit={submit}
      variants={container}
      initial="hidden"
      animate="visible"
      noValidate
    >
      {renderHeader && (
        <motion.div variants={child} className="mb-4">
          <h2 className="text-[17px] font-semibold text-foreground">{title}</h2>
        </motion.div>
      )}

      {/* "Where the code went" -- login only; the step-up dialog draws its own. */}
      {renderHeader && (
        <motion.div
          variants={child}
          // Colours live in `.otp-note` rather than inline, so the dark layer
          // can reach them: an inline hex cannot be overridden by a
          // stylesheet, which left this block unreadable on a dark page.
          className="otp-note mb-4 flex items-start"
          style={{
            borderRadius: "12px",
            padding: "14px",
            gap: "10px",
          }}
        >
          <Icon
            name={channelIcon(challenge?.channels)}
            size={18}
            className="otp-note__icon mt-0.5 shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-800">
              Where the code went
            </p>
            <p className="break-words text-xs leading-relaxed text-slate-600">
              {serverMessage}
            </p>
          </div>
        </motion.div>
      )}

      <AnimatePresence initial={false}>
        {error && (
          <motion.div
            key="otp-error"
            role="alert"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="mb-4 flex items-start gap-2.5 border border-red-200 bg-red-50"
            style={{ borderRadius: "12px", padding: "14px" }}
          >
            <Icon
              name="AlertCircle"
              size={16}
              className="mt-0.5 shrink-0 text-red-500"
            />
            <p className="break-words text-sm text-red-700">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The boxes */}
      <motion.div
        variants={child}
        className="grid grid-cols-6 gap-[8px] sm:gap-[10px]"
      >
        {digits.map((digit, index) => {
          const isFocusTarget = Boolean(digit);
          return (
            <input
              key={index}
              ref={(element) => {
                inputsRef.current[index] = element;
              }}
              value={digit}
              onChange={(event) => handleChange(index, event.target.value)}
              onKeyDown={(event) => handleKeyDown(index, event)}
              onPaste={(event) => handlePaste(index, event)}
              onFocus={(event) => event.target.select()}
              disabled={inputsDisabled}
              inputMode="numeric"
              type="text"
              // Kept even though email/WhatsApp codes are never offered to the
              // keyboard: harmless, and it works if SMS is ever added. Paste
              // handling is the real path.
              autoComplete={index === 0 ? "one-time-code" : "off"}
              aria-label={`Digit ${index + 1} of 6`}
              maxLength={LENGTH}
              className={`otp-box text-center font-semibold text-foreground bg-card outline-none transition-shadow ${
                error ? "otp-box--error" : ""
              } ${isFocusTarget ? "otp-box--filled" : ""}`}
              style={{
                height: "52px",
                borderRadius: "12px",
                fontSize: "20px",
                paddingTop: "0.7rem",
                paddingBottom: "0.7rem",
                opacity: inputsDisabled ? 0.6 : 1,
              }}
            />
          );
        })}
      </motion.div>

      {/* Countdown row */}
      <motion.div
        variants={child}
        className="flex items-center justify-between text-xs"
        style={{ marginTop: "10px" }}
      >
        {isExpired ? (
          <span className="font-medium text-red-600">
            This code has expired &mdash; request a new one.
          </span>
        ) : (
          <span className="text-slate-500">
            Expires in{" "}
            <strong className="font-semibold tabular-nums text-slate-700">
              {formatRemaining(remainingMs)}
            </strong>
          </span>
        )}

        <button
          type="button"
          onClick={resend}
          disabled={resendBlocked}
          // A link, so it takes the brand's dark-mode LINK variant (#E8798A)
          // rather than the border variant -- see `.otp-resend` in index.css.
          className={`otp-resend font-semibold ${
            resendBlocked ? "otp-resend--off" : ""
          }`}
          style={{ cursor: resendBlocked ? "not-allowed" : "pointer" }}
        >
          {resendText}
        </button>
      </motion.div>

      {/* Submit */}
      <motion.div variants={child} style={{ marginTop: "16px" }}>
        <motion.button
          type="submit"
          disabled={!canSubmit}
          aria-busy={isSubmitting}
          whileHover={canSubmit ? { scale: 1.005 } : undefined}
          whileTap={canSubmit ? { scale: 0.99 } : undefined}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="flex w-full items-center justify-center gap-2 font-semibold text-white"
          style={{
            borderRadius: festive ? "9999px" : "12px",
            background: festive
              ? "linear-gradient(90deg, #8E1B2B 0%, #A81F32 50%, #7E1626 100%)"
              : BRAND,
            paddingTop: festive ? "16px" : "14px",
            paddingBottom: festive ? "16px" : "14px",
            fontSize: festive ? "16px" : "14px",
            boxShadow: "0 8px 24px -8px rgba(172, 35, 52, 0.45)",
            opacity: canSubmit ? 1 : 0.7,
          }}
          onMouseEnter={(event) => {
            if (canSubmit && !festive) {
              event.currentTarget.style.background = BRAND_HOVER;
            }
          }}
          onMouseLeave={(event) => {
            if (!festive) event.currentTarget.style.background = BRAND;
          }}
        >
          {isSubmitting ? (
            <>
              <span className="inline-flex animate-spin">
                <Icon name="Loader2" size={18} />
              </span>
              {busyLabel}
            </>
          ) : (
            <>
              <Icon name="ShieldCheck" size={16} />
              {submitLabel}
            </>
          )}
        </motion.button>
      </motion.div>

      {/* Back / cancel */}
      {onBack && (
        <motion.div variants={child} className="mt-3 flex justify-center">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-medium text-slate-500 transition-colors hover:text-slate-700"
          >
            <Icon name="ArrowLeft" size={14} />
            {backLabel}
          </button>
        </motion.div>
      )}
    </motion.form>
  );
};

export default OtpCodeForm;
