import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Checkbox } from "../../../components/ui/Checkbox";
import Icon from "../../../components/AppIcon";
import { fetchUser } from "services/user.service";
import { Capacitor, CapacitorHttp } from "@capacitor/core";

// Parse a JSON string defensively; returns null on empty/invalid bodies so the
// caller can surface the raw status instead of throwing on `JSON.parse("")`.
const safeParse = (value) => {
  if (value == null) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const LoginForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false,
  });

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  useEffect(() => {
    const token = localStorage.getItem("auth_token");
    const isAuthenticated =
      localStorage.getItem("isAuthenticated");

    if (token && isAuthenticated === "true") {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      // Trim the username — mobile keyboards often append a trailing space
      // via autocomplete/autocorrect, which the server rejects.
      const username = formData.username.trim();
      const password = formData.password;

      // 🔐 Step 1: create login token (username + password)
      const loginToken = btoa(`${username}:${password}`);

      const url = "https://gateway.aajneetiadvertising.com/auth";
      const headers = {
        "Content-Type": "application/json",
        "create-token": loginToken,
        // The server authorizes requests by their referrer. A browser sends it
        // automatically; inside the app the origin is `https://localhost`, so we
        // set it explicitly.
        Referer: "https://crm.aajneeti.com/",
      };
      const payload = { username, password };

      // On a device we call native HTTP DIRECTLY instead of fetch(). The patched
      // fetch() that CapacitorHttp installs runs headers through browser
      // normalization, which silently drops the forbidden `Referer` header — so
      // it never reached the server (hence HTTP 401). CapacitorHttp.request
      // sends the headers untouched. On web we keep using fetch().
      let status, rawBody, data;
      if (Capacitor.isNativePlatform()) {
        const resp = await CapacitorHttp.request({
          url,
          method: "POST",
          headers,
          data: payload,
        });
        status = resp.status;
        rawBody =
          typeof resp.data === "string"
            ? resp.data
            : JSON.stringify(resp.data ?? "");
        data = safeParse(resp.data);
      } else {
        const res = await fetch(url, {
          method: "POST",
          headers,
          referrer: "https://crm.aajneeti.com/",
          body: JSON.stringify(payload),
        });
        status = res.status;
        rawBody = await res.text();
        data = safeParse(rawBody);
      }

      // --- TEMP DIAGNOSTICS: surface the real status + body on screen. ---
      console.log("LOGIN STATUS:", status, "RAW:", rawBody);

      if (status < 200 || status >= 300 || !data) {
        throw new Error(
          `HTTP ${status} — ${data?.message || rawBody?.slice(0, 300) || "empty response"}`,
        );
      }
      //

      /* STEP 2: get logged in user */
      const user = data.user;
      // 🔐 Step 2: create login object from response
      const loginObj = {
        id: user.id,
        username: user.userName,
        token: data.token,
        secret: data.secret,
        type: user.type,
        acl: data.acl || null,
        roles: Object.values(user.rolesNames || {}),
        teamsIds:
          user.teamsIds?.length
            ? user.teamsIds
            : user.teamIds?.length
              ? user.teamIds
              : user.defaultTeamId
                ? [user.defaultTeamId]
                : [],

        teamId:
          user.teamId ||
          user.defaultTeamId ||
          null,

        // Role
        role:
          Object.values(user.rolesNames || {})?.[0] ||
          "",
        assignedUserId: user.id,
      };

      // 🔐 Step 3: stringify + base64 encode
      const jsonString = JSON.stringify(loginObj);
      const myToken = btoa(jsonString);

      // ✅ Store everything
      localStorage.setItem("auth_token", myToken); // MAIN TOKEN
      localStorage.setItem("login_object", jsonString); // optional (debug/use)
      localStorage.setItem("isAuthenticated", "true");
      if (data.acl) {
        localStorage.setItem("acl", JSON.stringify(data.acl));
      }

      // 🔐 Step 4: resolve the user's roles from their own User record.
      //
      // The /auth response does not always carry `rolesNames`, which left
      // `roles` empty and every role-gated check (My Campaigns in the
      // sidebar, for one) failing for people who do hold a role. Reading
      // /User/{id} gives the authoritative list.
      //
      // Deliberately NOT using fetchUserById: that helper clears localStorage
      // and redirects to /login on 401/403, which would wipe the session we
      // just created and bounce a successful login straight back out.
      //
      // Only `login_object` is rewritten — `auth_token` is the credential the
      // gateway was handed and is left exactly as issued.
      try {
        const userRes = await fetch(
          `https://gateway.aajneetiadvertising.com/User/${user.id}`,
          {
            method: "GET",
            headers: { "Content-Type": "application/json", token: myToken },
          },
        );

        if (userRes.ok) {
          const detail = safeParse(await userRes.text());
          // EspoCRM returns link-multiple fields as an { id: name } map, but
          // accept a plain array too rather than silently finding nothing.
          const rawRoles = detail?.rolesNames ?? detail?.roles;
          const resolvedRoles = (
            Array.isArray(rawRoles) ? rawRoles : Object.values(rawRoles || {})
          )
            .map((role) => (typeof role === "string" ? role : role?.name))
            .filter(Boolean);

          if (resolvedRoles.length) {
            const withRoles = {
              ...loginObj,
              roles: resolvedRoles,
              role: resolvedRoles[0],
            };
            localStorage.setItem("login_object", JSON.stringify(withRoles));
            console.log("Resolved user roles:", resolvedRoles);
          } else {
            // The call succeeded but carried no role names — most likely the
            // field is ACL-restricted for this user, or the role is attached
            // to their team rather than to them. Name the role-bearing keys
            // so the cause is visible instead of silently falling back.
            console.warn(
              "No roles on the User record. Role-bearing fields were:",
              {
                rolesNames: detail?.rolesNames,
                rolesIds: detail?.rolesIds,
                teamsNames: detail?.teamsNames,
                type: detail?.type,
              },
            );
          }
        } else {
          console.warn("User lookup failed with status", userRes.status);
        }
      } catch (roleError) {
        // Never block a successful login on this — the app falls back to
        // whatever roles the auth response provided.
        console.error("Could not resolve user roles:", roleError);
      }

      // Fresh login → let the Dashboard summary alert re-appear (and re-chime)
      // even if it was dismissed in a previous session that left flags behind.
      try {
        sessionStorage.removeItem("dashboardSummaryAlertDismissed");
        sessionStorage.removeItem("dashboardSummaryAlertSoundPlayed");
      } catch {
        // sessionStorage unavailable — alert will just behave as if first-visit
      }

      navigate("/dashboard");
    } catch (err) {
      console.error("Login error:", err);
      setErrors({ general: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  // 48px-tall field with a leading icon. Built inline rather than through the
  // shared Input so the icon can be centred against the control itself —
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
