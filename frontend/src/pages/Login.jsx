import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../services/backendCompatibility";

const MODES = {
  SIGN_IN: "signin",
  SIGN_UP: "signup",
  RECOVER: "recover",
};

const USER_ROLE = "user";
const ADMIN_ROLE = "admin";
const DEFAULT_ADMIN_INVITE_KEY = (import.meta.env.VITE_ADMIN_INVITE_KEY || "").trim();

const DEMO_ACCOUNTS = [
  { username: "admin", password: "admin123", label: "Admin Demo" },
  { username: "user", password: "user123", label: "User Demo" },
];

const DEMO_SIGNUP_PAYLOADS = [
  {
    username: "admin",
    email: "admin_demo@eventhub.local",
    password: "admin123",
    role: ADMIN_ROLE,
  },
  {
    username: "user",
    email: "user_demo@eventhub.local",
    password: "user123",
    role: USER_ROLE,
  },
];

async function parseApiResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const body = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (typeof body === "object" && body?.error) ||
      (typeof body === "object" && body?.message) ||
      (typeof body === "string" && body) ||
      `Request failed with status ${response.status}`;
    throw new Error(Array.isArray(message) ? message.join(", ") : message);
  }

  return body;
}

function Login({ onLogin }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState(MODES.SIGN_IN);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: null, text: "" });

  const [signinData, setSigninData] = useState({
    username: "",
    password: "",
  });
  const [signupData, setSignupData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: USER_ROLE,
    adminInviteKey: "",
  });
  const [recoverData, setRecoverData] = useState({
    username: "",
    email: "",
    newPassword: "",
    confirmNewPassword: "",
  });

  const [errors, setErrors] = useState({});

  const resetFeedback = () => {
    setMessage({ type: null, text: "" });
    setErrors({});
  };

  const switchMode = (nextMode) => {
    setMode(nextMode);
    resetFeedback();
  };

  const setField = (setter, field, value, errorKey = field) => {
    setter((prev) => ({ ...prev, [field]: value }));
    if (errors[errorKey]) {
      setErrors((prev) => ({ ...prev, [errorKey]: "" }));
    }
    if (message.text) {
      setMessage({ type: null, text: "" });
    }
  };

  const validateSignIn = () => {
    const nextErrors = {};
    if (!signinData.username.trim()) nextErrors.username = "Username is required";
    if (!signinData.password.trim()) nextErrors.password = "Password is required";
    return nextErrors;
  };

  const validateSignUp = () => {
    const nextErrors = {};
    if (!signupData.username.trim()) nextErrors.signupUsername = "Username is required";
    if (!signupData.email.trim()) nextErrors.signupEmail = "Email is required";
    if (!signupData.password.trim()) nextErrors.signupPassword = "Password is required";
    if (signupData.password.length > 0 && signupData.password.length < 6) {
      nextErrors.signupPassword = "Password must be at least 6 characters";
    }
    if (!signupData.confirmPassword.trim()) {
      nextErrors.signupConfirmPassword = "Confirm your password";
    }
    if (
      signupData.password.trim() &&
      signupData.confirmPassword.trim() &&
      signupData.password !== signupData.confirmPassword
    ) {
      nextErrors.signupConfirmPassword = "Passwords do not match";
    }
    if (![USER_ROLE, ADMIN_ROLE].includes(signupData.role)) {
      nextErrors.signupRole = "Please select a valid role";
    }
    if (signupData.role === ADMIN_ROLE && !signupData.adminInviteKey.trim()) {
      nextErrors.signupAdminInviteKey = "Admin invite key is required";
    }
    return nextErrors;
  };

  const validateRecovery = () => {
    const nextErrors = {};
    if (!recoverData.username.trim()) nextErrors.recoverUsername = "Username is required";
    if (!recoverData.email.trim()) nextErrors.recoverEmail = "Email is required";
    if (!recoverData.newPassword.trim()) nextErrors.recoverNewPassword = "New password is required";
    if (recoverData.newPassword.length > 0 && recoverData.newPassword.length < 6) {
      nextErrors.recoverNewPassword = "Password must be at least 6 characters";
    }
    if (!recoverData.confirmNewPassword.trim()) {
      nextErrors.recoverConfirmNewPassword = "Confirm your new password";
    }
    if (
      recoverData.newPassword.trim() &&
      recoverData.confirmNewPassword.trim() &&
      recoverData.newPassword !== recoverData.confirmNewPassword
    ) {
      nextErrors.recoverConfirmNewPassword = "Passwords do not match";
    }
    return nextErrors;
  };

  const handleSignIn = async (e) => {
    e.preventDefault();
    const validationErrors = validateSignIn();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: null, text: "" });
      const response = await fetch(`${API_BASE_URL}/users/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: signinData.username.trim(),
          password: signinData.password,
        }),
      });
      const payload = await parseApiResponse(response);

      onLogin({
        id: payload.user?.id,
        username: payload.user?.username || signinData.username.trim(),
        role: payload.user?.role || USER_ROLE,
        email: payload.user?.email || null,
      });
      navigate("/home");
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e) => {
    e.preventDefault();
    const validationErrors = validateSignUp();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: null, text: "" });

      const payload = {
        username: signupData.username.trim(),
        email: signupData.email.trim().toLowerCase(),
        password: signupData.password,
        role: signupData.role,
      };
      if (signupData.role === ADMIN_ROLE) {
        payload.adminInviteKey = signupData.adminInviteKey.trim();
      }

      await parseApiResponse(
        await fetch(`${API_BASE_URL}/users/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        })
      );

      setSigninData({
        username: signupData.username.trim(),
        password: "",
      });
      setSignupData({
        username: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: USER_ROLE,
        adminInviteKey: "",
      });
      switchMode(MODES.SIGN_IN);
      setMessage({ type: "success", text: "Registration successful. Please sign in." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleRecover = async (e) => {
    e.preventDefault();
    const validationErrors = validateRecovery();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    try {
      setLoading(true);
      setMessage({ type: null, text: "" });
      await parseApiResponse(
        await fetch(`${API_BASE_URL}/users/recover-password`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: recoverData.username.trim(),
            email: recoverData.email.trim().toLowerCase(),
            newPassword: recoverData.newPassword,
          }),
        })
      );

      setSigninData({
        username: recoverData.username.trim(),
        password: recoverData.newPassword,
      });
      setRecoverData({
        username: "",
        email: "",
        newPassword: "",
        confirmNewPassword: "",
      });
      switchMode(MODES.SIGN_IN);
      setMessage({ type: "success", text: "Password reset successful. You can sign in now." });
    } catch (error) {
      setMessage({ type: "error", text: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleProvisionDemoAccounts = async () => {
    try {
      setLoading(true);
      setMessage({ type: null, text: "" });

      const resolvedAdminInviteKey =
        signupData.adminInviteKey.trim() || DEFAULT_ADMIN_INVITE_KEY;

      const results = await Promise.all(
        DEMO_SIGNUP_PAYLOADS.map(async (account) => {
          const payload = {
            username: account.username,
            email: account.email,
            password: account.password,
            role: account.role,
          };

          if (account.role === ADMIN_ROLE && resolvedAdminInviteKey) {
            payload.adminInviteKey = resolvedAdminInviteKey;
          }

          try {
            await parseApiResponse(
              await fetch(`${API_BASE_URL}/users/signup`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
              })
            );
            return { status: "created", username: account.username };
          } catch (error) {
            const lowered = error.message.toLowerCase();
            if (lowered.includes("already") || lowered.includes("taken")) {
              return { status: "exists", username: account.username };
            }
            return { status: "failed", username: account.username, error: error.message };
          }
        })
      );

      const created = results.filter((entry) => entry.status === "created");
      const existing = results.filter((entry) => entry.status === "exists");
      const failed = results.filter((entry) => entry.status === "failed");

      if (failed.length > 0) {
        const prefixParts = [];
        if (created.length > 0) {
          prefixParts.push(`created: ${created.map((entry) => entry.username).join(", ")}`);
        }
        if (existing.length > 0) {
          prefixParts.push(`existing: ${existing.map((entry) => entry.username).join(", ")}`);
        }
        const failureText = failed
          .map((entry) => `${entry.username}: ${entry.error}`)
          .join(" | ");

        setMessage({
          type: "error",
          text: `${prefixParts.join(" | ")}${prefixParts.length ? " | " : ""}${failureText}`,
        });
        return;
      }

      const summary = [];
      if (created.length > 0) {
        summary.push(`created: ${created.map((entry) => entry.username).join(", ")}`);
      }
      if (existing.length > 0) {
        summary.push(`existing: ${existing.map((entry) => entry.username).join(", ")}`);
      }

      setMessage({
        type: "success",
        text: summary.length
          ? `Demo account setup complete (${summary.join(" | ")}).`
          : "Demo accounts are ready.",
      });
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = (account) => {
    setSigninData({
      username: account.username,
      password: account.password,
    });
    switchMode(MODES.SIGN_IN);
  };

  const inputBaseClasses =
    "w-full px-4 py-2.5 border rounded-xl bg-white text-black placeholder-gray-500 focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-400 transition-all outline-none";
  const errorInputClasses = "border-red-500 bg-red-50";
  const normalInputClasses = "border-slate-300 hover:border-cyan-400/60";

  const withErrorClass = (errorKey) =>
    `${inputBaseClasses} ${errors[errorKey] ? errorInputClasses : normalInputClasses}`;

  const ModeButton = ({ value, children }) => (
    <button
      type="button"
      onClick={() => switchMode(value)}
      className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
        mode === value
          ? "bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-sm"
          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
      }`}
    >
      {children}
    </button>
  );

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="max-w-lg w-full">
        <div className="surface-card gradient-border rounded-xl shadow-lg p-6 md:p-8">
          <div className="text-center mb-6">
            <div className="bg-gradient-to-r from-indigo-500 via-cyan-500 to-pink-500 text-white p-3 rounded-lg inline-block mb-3 shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold gradient-text">EventHub Authentication</h1>
            <p className="text-slate-500 mt-2">
              Sign in, create an account, or recover your password.
            </p>
          </div>

          <div className="flex flex-wrap gap-2 justify-center mb-5">
            <ModeButton value={MODES.SIGN_IN}>Sign In</ModeButton>
            <ModeButton value={MODES.SIGN_UP}>Register</ModeButton>
            <ModeButton value={MODES.RECOVER}>Forgot Password</ModeButton>
          </div>

          {message.text && (
            <div
              className={`mb-4 rounded-lg px-3 py-2 text-sm ${
                message.type === "error"
                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                  : "bg-emerald-50 text-emerald-700 border border-emerald-200"
              }`}
            >
              {message.text}
            </div>
          )}

          {mode === MODES.SIGN_IN && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label htmlFor="signin-username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="signin-username"
                  type="text"
                  placeholder="Enter username"
                  value={signinData.username}
                  onChange={(e) => setField(setSigninData, "username", e.target.value)}
                  className={withErrorClass("username")}
                />
                {errors.username && <p className="text-red-500 text-xs mt-1">{errors.username}</p>}
              </div>

              <div>
                <label htmlFor="signin-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="signin-password"
                  type="password"
                  placeholder="Enter password"
                  value={signinData.password}
                  onChange={(e) => setField(setSigninData, "password", e.target.value)}
                  className={withErrorClass("password")}
                />
                {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password}</p>}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gradient px-6 py-3 rounded-lg font-medium transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Signing In..." : "Sign In"}
              </button>
            </form>
          )}

          {mode === MODES.SIGN_UP && (
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label htmlFor="signup-username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="signup-username"
                  type="text"
                  placeholder="Choose a username"
                  value={signupData.username}
                  onChange={(e) => setField(setSignupData, "username", e.target.value, "signupUsername")}
                  className={withErrorClass("signupUsername")}
                />
                {errors.signupUsername && <p className="text-red-500 text-xs mt-1">{errors.signupUsername}</p>}
              </div>

              <div>
                <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  id="signup-email"
                  type="email"
                  placeholder="Enter email"
                  value={signupData.email}
                  onChange={(e) => setField(setSignupData, "email", e.target.value, "signupEmail")}
                  className={withErrorClass("signupEmail")}
                />
                {errors.signupEmail && <p className="text-red-500 text-xs mt-1">{errors.signupEmail}</p>}
              </div>

              <div>
                <label htmlFor="signup-role" className="block text-sm font-medium text-gray-700 mb-1">
                  Role
                </label>
                <select
                  id="signup-role"
                  value={signupData.role}
                  onChange={(e) => setField(setSignupData, "role", e.target.value, "signupRole")}
                  className={withErrorClass("signupRole")}
                >
                  <option value={USER_ROLE}>User</option>
                  <option value={ADMIN_ROLE}>Admin</option>
                </select>
                {errors.signupRole && <p className="text-red-500 text-xs mt-1">{errors.signupRole}</p>}
              </div>

              {signupData.role === ADMIN_ROLE && (
                <div>
                  <label htmlFor="signup-admin-key" className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Invite Key
                  </label>
                  <input
                    id="signup-admin-key"
                    type="password"
                    placeholder="Enter admin invite key"
                    value={signupData.adminInviteKey}
                    onChange={(e) => setField(setSignupData, "adminInviteKey", e.target.value, "signupAdminInviteKey")}
                    className={withErrorClass("signupAdminInviteKey")}
                  />
                  {errors.signupAdminInviteKey && (
                    <p className="text-red-500 text-xs mt-1">{errors.signupAdminInviteKey}</p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="signup-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <input
                  id="signup-password"
                  type="password"
                  placeholder="Create password"
                  value={signupData.password}
                  onChange={(e) => setField(setSignupData, "password", e.target.value, "signupPassword")}
                  className={withErrorClass("signupPassword")}
                />
                {errors.signupPassword && <p className="text-red-500 text-xs mt-1">{errors.signupPassword}</p>}
              </div>

              <div>
                <label htmlFor="signup-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password
                </label>
                <input
                  id="signup-confirm-password"
                  type="password"
                  placeholder="Confirm password"
                  value={signupData.confirmPassword}
                  onChange={(e) => setField(setSignupData, "confirmPassword", e.target.value, "signupConfirmPassword")}
                  className={withErrorClass("signupConfirmPassword")}
                />
                {errors.signupConfirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.signupConfirmPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gradient px-6 py-3 rounded-lg font-medium transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>
          )}

          {mode === MODES.RECOVER && (
            <form onSubmit={handleRecover} className="space-y-4">
              <div>
                <label htmlFor="recover-username" className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <input
                  id="recover-username"
                  type="text"
                  placeholder="Enter your username"
                  value={recoverData.username}
                  onChange={(e) => setField(setRecoverData, "username", e.target.value, "recoverUsername")}
                  className={withErrorClass("recoverUsername")}
                />
                {errors.recoverUsername && <p className="text-red-500 text-xs mt-1">{errors.recoverUsername}</p>}
              </div>

              <div>
                <label htmlFor="recover-email" className="block text-sm font-medium text-gray-700 mb-1">
                  Registered Email
                </label>
                <input
                  id="recover-email"
                  type="email"
                  placeholder="Enter your registered email"
                  value={recoverData.email}
                  onChange={(e) => setField(setRecoverData, "email", e.target.value, "recoverEmail")}
                  className={withErrorClass("recoverEmail")}
                />
                {errors.recoverEmail && <p className="text-red-500 text-xs mt-1">{errors.recoverEmail}</p>}
              </div>

              <div>
                <label htmlFor="recover-password" className="block text-sm font-medium text-gray-700 mb-1">
                  New Password
                </label>
                <input
                  id="recover-password"
                  type="password"
                  placeholder="Set a new password"
                  value={recoverData.newPassword}
                  onChange={(e) => setField(setRecoverData, "newPassword", e.target.value, "recoverNewPassword")}
                  className={withErrorClass("recoverNewPassword")}
                />
                {errors.recoverNewPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.recoverNewPassword}</p>
                )}
              </div>

              <div>
                <label htmlFor="recover-confirm-password" className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm New Password
                </label>
                <input
                  id="recover-confirm-password"
                  type="password"
                  placeholder="Confirm the new password"
                  value={recoverData.confirmNewPassword}
                  onChange={(e) => setField(setRecoverData, "confirmNewPassword", e.target.value, "recoverConfirmNewPassword")}
                  className={withErrorClass("recoverConfirmNewPassword")}
                />
                {errors.recoverConfirmNewPassword && (
                  <p className="text-red-500 text-xs mt-1">{errors.recoverConfirmNewPassword}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-gradient px-6 py-3 rounded-lg font-medium transition-all shadow-md disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? "Updating Password..." : "Reset Password"}
              </button>
            </form>
          )}

          <div className="mt-6 p-4 rounded-xl soft-gradient-panel border border-white/70">
            <div className="flex items-center justify-between gap-3 mb-3">
              <p className="text-sm text-slate-700 font-semibold">Demo Accounts</p>
              <button
                type="button"
                onClick={handleProvisionDemoAccounts}
                disabled={loading}
                className="text-xs px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-60"
              >
                Prepare Demo Accounts
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.username}
                  type="button"
                  onClick={() => fillDemoCredentials(account)}
                  className="text-left text-xs rounded-lg border border-slate-200 bg-white px-3 py-2 hover:border-cyan-300 hover:bg-cyan-50/40 transition-colors"
                >
                  <p className="font-semibold text-slate-700">{account.label}</p>
                  <p className="text-slate-500">username: {account.username}</p>
                  <p className="text-slate-500">password: {account.password}</p>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-3">
              For admin signup/demo, provide an admin invite key in the Register form.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
