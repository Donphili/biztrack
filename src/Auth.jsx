import { useState } from "react";
import { ChartNoAxesCombined } from "lucide-react";
import { supabase } from "./supabaseClient";
import "./Auth.css";

export default function AuthScreen() {
  const [mode, setMode] = useState("login");
  const [businessName, setBusinessName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const isSignup = mode === "signup";
  const isForgot = mode === "forgot";

  async function handleSubmit(event) {
    event.preventDefault();
    setBusy(true);
    setMessage({ type: "", text: "" });

    if (isForgot) {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin,
      });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else {
        setMessage({
          type: "success",
          text: "If that email has an account, a reset link is on its way. Check your inbox and spam folder.",
        });
      }
    } else if (isSignup) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { business_name: businessName.trim() } },
      });
      if (error) {
        setMessage({ type: "error", text: error.message });
      } else if (!data.session) {
        setMessage({
          type: "success",
          text: "Account created. Check your email and click the confirmation link, then log in.",
        });
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setMessage({ type: "error", text: error.message });
    }

    setBusy(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark"><ChartNoAxesCombined size={23} strokeWidth={2.6} /></div>
          <span>biz<span className="brand-light">track</span></span>
        </div>
        <h1>{isForgot ? "Reset your password" : isSignup ? "Create your account" : "Welcome back"}</h1>
        <p className="auth-sub">
          {isForgot
            ? "Enter your email and we will send you a link to choose a new password."
            : isSignup
              ? "Start your 14-day free trial. No card needed."
              : "Log in to manage your sales, stock and customer debts."}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {isSignup && (
            <label>
              Business name
              <input value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="e.g. Salem Mobile Accessories" required />
            </label>
          )}
          <label>
            Email
            <input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required />
          </label>
          {!isForgot && (
            <label>
              Password
              <input type="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required />
            </label>
          )}
          {mode === "login" && (
            <button type="button" className="auth-link" onClick={() => { setMode("forgot"); setMessage({ type: "", text: "" }); }}>
              Forgot password?
            </button>
          )}

          {message.text && <div className={`auth-message ${message.type}`}>{message.text}</div>}

          <button className="primary-button auth-submit" type="submit" disabled={busy}>
            {busy ? "Please wait..." : isForgot ? "Send reset link" : isSignup ? "Start free trial" : "Log in"}
          </button>
        </form>

        <p className="auth-switch">
          {isForgot ? "Remembered it?" : isSignup ? "Already have an account?" : "New to BizTrack?"}{" "}
          <button type="button" onClick={() => { setMode(isSignup || isForgot ? "login" : "signup"); setMessage({ type: "", text: "" }); }}>
            {isSignup || isForgot ? "Log in" : "Create an account"}
          </button>
        </p>
      </div>
    </div>
  );
}

export function ResetPassword({ onDone }) {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  async function handleSubmit(event) {
    event.preventDefault();
    if (password !== confirm) {
      setMessage({ type: "error", text: "The two passwords do not match." });
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      onDone();
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark"><ChartNoAxesCombined size={23} strokeWidth={2.6} /></div>
          <span>biz<span className="brand-light">track</span></span>
        </div>
        <h1>Choose a new password</h1>
        <p className="auth-sub">Enter a new password for your account.</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label>
            New password
            <input type="password" autoComplete="new-password" minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 6 characters" required />
          </label>
          <label>
            Confirm new password
            <input type="password" autoComplete="new-password" minLength={6} value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
          </label>
          {message.text && <div className={`auth-message ${message.type}`}>{message.text}</div>}
          <button className="primary-button auth-submit" type="submit" disabled={busy}>
            {busy ? "Please wait..." : "Save new password"}
          </button>
        </form>
      </div>
    </div>
  );
}
