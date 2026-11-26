import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Checkbox } from "../../../components/ui/Checkbox";
import Icon from "../../../components/AppIcon";
import OtpCodeForm from "../../../components/otp/OtpCodeForm";
import {
  clearPendingChallenge,
  loadPendingChallenge,
  persistSession,
  requestLogin,
  resendLoginOtp,
  savePendingChallenge,
  verifyLoginOtp,
} from "services/auth.service";

/**
 * LoginForm -- credentials, then (where the gateway asks for one) a 6-digit
 * code.
 *
 * Dual-mode on purpose: nothing here decides the flow in advance. We ask the
 * gateway and react to what comes back, because 2FA is served by one gateway
 * while the other still answers the old `{ token, user, acl }` payload. An app
 * that simply switched to the OTP flow would break sign-in the moment it
 * shipped against the legacy gateway.
 */

const LOGIN_OTP_TTL_MS = 15 * 60 * 1000;

const LoginForm = () => {
  const navigate = useNavigate();

  const [step, setStep] = useState("credentials");
  const [challenge, setChallenge] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  /* Already signed in? */
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const isAuthenticated = localStorage.getItem("isAuthenticated");

    if (token && isAuthenticated === "true") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  /**
   * Restore a challenge left behind by an accidental reload of the OTP
   * screen, so the code already sent is not thrown away and the user is not
   * forced through a fresh login.
   */
  useEffect(() => {
    const pending = loadPendingChallenge();
    if (pending) {
      setChallenge(pending);
      setStep("otp");
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 4) {
      newErrors.password = "Password must be at least 5 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /** Shared by both modes: a session exists, go to the dashboard. */
  const finishLogin = useCallback(
    async (session) => {
      await persistSession(session);
      navigate("/dashboard");
    },
    [navigate],
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const result = await requestLogin({
        username: formData.username,
        password: formData.password,
      });

      if (result.mode === "otp") {
        setChallenge(result.challenge);
        savePendingChallenge(result.challenge);
        setStep("otp");
        return;
      }

      // Legacy gateway: already authenticated, no OTP screen.
      await finishLogin({
        token: result.token,
        user: result.user,
        acl: result.acl,
        secret: result.secret,
        gateway: result.gateway,
      });
    } catch (err) {
      // A 401 is a definitive wrong password: the message is shown and the
      // request is NOT retried -- a second attempt only burns a rate-limit
      // slot.
      setErrors({ general: err.message || "Could not sign you in." });
    } finally {
      setIsLoading(false);
    }
  };

  /* ---------------------------------------------------------------- *
   * OTP step
   * ---------------------------------------------------------------- */

  const handleVerify = useCallback(
    async (code) => {
      // Verification returns ONLY a token -- no user, no ACL -- so the session
      // is assembled from /App/user and /User/{id} inside persistSession.
      const token = await verifyLoginOtp({
        otp: code,
        challengeToken: challenge?.challengeToken,
        gateway: challenge?.gateway,
      });

      await finishLogin({ token, gateway: challenge?.gateway });
    },
    [challenge, finishLogin],
  );

  const handleResend = useCallback(async () => {
    // The returned challengeToken REPLACES the old one, and the new issuedAt
    // restarts both the 15-minute expiry and the 60-second cooldown.
    const fresh = await resendLoginOtp({
      challengeToken: challenge?.challengeToken,
      gateway: challenge?.gateway,
    });
    setChallenge(fresh);
    savePendingChallenge(fresh);
  }, [challenge]);

  const useDifferentAccount = useCallback(() => {
    clearPendingChallenge();
    setChallenge(null);
    setStep("credentials");
    setErrors({});
    setFormData((prev) => ({ ...prev, password: "" }));
  }, []);

  /**
   * Hardware back on the OTP screen means "use a different account" -- not a
   * route pop, which would leave the half-finished sign-in behind.
   */
  useEffect(() => {
    if (step !== "otp" || !Capacitor.isNativePlatform()) return;

    let remove = null;
    let cancelled = false;

    import("@capacitor/app")
      .then(({ App }) => App.addListener("backButton", useDifferentAccount))
      .then((handle) => {
        if (cancelled) handle.remove();
        else remove = handle;
      })
      .catch(() => {
        /* plugin unavailable -- the on-screen link still works */
      });

    return () => {
      cancelled = true;
      remove?.remove?.();
    };
  }, [step, useDifferentAccount]);

  // 48px-tall field with a leading icon. Built inline rather than through the
  // shared Input so the icon can be centred against the control itself --
  // Input renders its own label and error inside the same wrapper, which
  // would throw an absolutely-positioned icon off-centre.
  const fieldClasses = (hasError) =>
    `h-12 w-full rounded-xl border bg-card pl-11 pr-4 text-[15px] text-foreground
     placeholder:text-muted-foreground/45 transition-shadow
     focus:outline-none focus:ring-2 focus:ring-offset-0
     disabled:cursor-not-allowed disabled:opacity-60
     ${hasError
      ? "border-destructive focus:ring-destructive/40"
      : "border-border focus:border-primary/40 focus:ring-primary/25"
    }`;

  if (step === "otp") {
    return (
      <OtpCodeForm
        challenge={challenge}
        ttlMs={LOGIN_OTP_TTL_MS}
        onSubmit={handleVerify}
        onResend={handleResend}
        onBack={useDifferentAccount}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5" noValidate>
      {errors.general && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4"
        >
          <Icon
            name="AlertCircle"
            size={16}
            className="mt-0.5 shrink-0 text-red-500"
          />
          <p className="break-words text-sm text-red-700">{errors.general}</p>
        </div>
      )}

      {/* Username */}
      <div>
        <label
          htmlFor="login-username"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Username
          <span className="ml-1 text-destructive">*</span>
        </label>

        <div className="relative">
          <Icon
            name="User"
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/45"
          />
          <input
            id="login-username"
            type="text"
            name="username"
            value={formData.username}
            onChange={handleInputChange}
            disabled={isLoading}
            placeholder="you@aajneeti.social"
            aria-invalid={Boolean(errors.username)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            spellCheck={false}
            className={fieldClasses(errors.username)}
          />
        </div>

        {errors.username && (
          <p className="mt-1.5 text-sm text-destructive">{errors.username}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label
          htmlFor="login-password"
          className="mb-2 block text-sm font-medium text-foreground"
        >
          Password
          <span className="ml-1 text-destructive">*</span>
        </label>

        <div className="relative">
          <Icon
            name="Lock"
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground/45"
          />
          <input
            id="login-password"
            type={showPassword ? "text" : "password"}
            name="password"
            value={formData.password}
            onChange={handleInputChange}
            disabled={isLoading}
            placeholder="Enter your password"
            aria-invalid={Boolean(errors.password)}
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="current-password"
            spellCheck={false}
            className={`${fieldClasses(errors.password)} !pr-12`}
          />

          {/* 44px tap target, per the mobile touch-size rule */}
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-lg text-muted-foreground/60 transition-colors active:text-primary"
          >
            <Icon name={showPassword ? "EyeOff" : "Eye"} size={18} />
          </button>
        </div>

        {errors.password && (
          <p className="mt-1.5 text-sm text-destructive">{errors.password}</p>
        )}
      </div>

      <div className="flex items-center justify-between pt-1">
        <Checkbox
          label="Keep me signed in"
          name="rememberMe"
          checked={formData.rememberMe}
          onChange={handleInputChange}
          disabled={isLoading}
        />
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex min-h-[52px] w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-cta-glow transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:shadow-none"
      >
        {isLoading && (
          <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {isLoading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
};

export default LoginForm;
