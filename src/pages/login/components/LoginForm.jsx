import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import { Checkbox } from "../../../components/ui/Checkbox";
import Icon from "../../../components/AppIcon";
import { fetchUser } from "services/user.service";

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
      // 🔐 Step 1: create login token (username + password)
      const loginToken = btoa(`${formData.username}:${formData.password}`);

      const res = await fetch("https://gateway.aajneetiadvertising.com/auth", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "create-token": loginToken,
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });

      const data = await res.json();
      console.log("LOGIN RESPONSE:", data);

      if (!res.ok) {
        throw new Error(data?.message || "Invalid credentials");
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {errors.general && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <Icon name="AlertCircle" size={16} className="text-red-500" />
            <p className="text-sm text-red-700">{errors.general}</p>
          </div>
        </div>
      )}

      <Input
        label="Username"
        name="username"
        value={formData.username}
        onChange={handleInputChange}
        error={errors.username}
        disabled={isLoading}
        required
      />

      <div className="relative">
        <Input
          label="Password"
          type={showPassword ? "text" : "password"}
          name="password"
          value={formData.password}
          onChange={handleInputChange}
          error={errors.password}
          disabled={isLoading}
          required
        />

        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-9 text-muted-foreground hover:text-primary"
        >
          <Icon name={showPassword ? "EyeOff" : "Eye"} size={18} />
        </button>
      </div>

      <div className="flex items-center justify-between">
        <Checkbox
          label="Keep me signed in"
          name="rememberMe"
          checked={formData.rememberMe}
          onChange={handleInputChange}
          disabled={isLoading}
        />
      </div>

      <Button type="submit" fullWidth loading={isLoading} disabled={isLoading}>
        {isLoading ? "Signing In..." : "Sign In"}
      </Button>
    </form>
  );
};

export default LoginForm;
