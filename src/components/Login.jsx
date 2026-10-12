import { useState } from "react";
import { supabase, isSupabaseConfigured } from "../lib/supabase";

// Styles are kept in this file so the login page can be updated on its own.
const css = `
.lg-wrap {
  min-height: calc(100vh - 160px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 0;
}
.lg-card {
  width: 100%;
  max-width: 820px;
  display: grid;
  grid-template-columns: 1fr 1fr;
  background: var(--surface);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(15,23,42,0.06), 0 12px 32px rgba(15,23,42,0.10);
}

/* ---- left: brand panel ---- */
.lg-brand {
  background: var(--seller-bg);
  color: #e2e8f0;
  padding: 36px 32px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}
.lg-mark { display: flex; align-items: center; gap: 10px; }
.lg-mark-badge {
  background: #fff;
  color: var(--seller-bg);
  font-weight: 900;
  font-size: 15px;
  letter-spacing: 1px;
  padding: 3px 9px;
  border-radius: 4px;
}
.lg-mark-text { font-weight: 600; font-size: 15px; }
.lg-brand h1 {
  font-size: 24px;
  line-height: 1.25;
  font-weight: 700;
  color: #fff;
  margin-top: 8px;
}
.lg-brand p { font-size: 14px; line-height: 1.55; color: #94a3b8; max-width: 300px; }

/* paper bill illustration */
.lg-paper {
  margin-top: auto;
  background: #fff;
  border-radius: 6px;
  padding: 14px 16px 12px;
  transform: rotate(-2deg);
  box-shadow: 0 10px 24px rgba(0,0,0,0.35);
  max-width: 280px;
}
.lg-paper-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}
.lg-paper-title { font-size: 9px; font-weight: 800; color: #1a1d23; letter-spacing: 0.3px; }
.lg-paper-date { width: 46px; height: 2px; background: #cbd5e1; }
.lg-paper-row { display: flex; gap: 8px; margin-bottom: 7px; }
.lg-paper-line { height: 2px; background: #e2e8f0; flex: 1; }
.lg-paper-line.short { flex: 0 0 38%; }
.lg-paper-grid {
  border: 1.5px solid #1a1d23;
  height: 26px;
  margin: 10px 0 8px;
  display: grid;
  grid-template-columns: 1fr 1fr 2fr 2fr 1fr;
}
.lg-paper-grid span { border-right: 1px solid #1a1d23; }
.lg-paper-grid span:last-child { border-right: none; background: #f1f5f9; }
.lg-paper-sig { position: relative; height: 28px; width: 62%; }
.lg-paper-sig svg { position: absolute; left: 8px; bottom: 1px; width: 92px; height: 26px; }
.lg-paper-sig-line { position: absolute; left: 0; right: 0; bottom: 3px; height: 1.5px; background: #1a1d23; }

/* ---- right: form ---- */
.lg-form { padding: 40px 36px; display: flex; flex-direction: column; justify-content: center; }
.lg-form h2 { font-size: 22px; font-weight: 700; color: var(--text); }
.lg-sub { font-size: 14px; color: var(--text-muted); margin: 4px 0 24px; }
.lg-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 16px; }
.lg-field label { font-size: 13px; font-weight: 600; color: var(--text); }
.lg-input {
  width: 100%;
  padding: 11px 12px;
  border: 1.5px solid var(--border);
  border-radius: 8px;
  font-size: 15px;
  font-family: var(--font);
  color: var(--text);
  background: #fff;
  transition: border-color 0.15s, box-shadow 0.15s;
}
.lg-input:focus { outline: none; border-color: var(--primary); box-shadow: 0 0 0 3px var(--primary-light); }
.lg-pass { position: relative; }
.lg-pass .lg-input { padding-right: 64px; }
.lg-toggle {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  border: none;
  background: transparent;
  color: var(--primary);
  font-size: 13px;
  font-weight: 600;
  font-family: var(--font);
  padding: 6px 8px;
  border-radius: 6px;
  cursor: pointer;
}
.lg-toggle:hover { background: var(--primary-light); }
.lg-toggle:focus-visible, .lg-btn:focus-visible { outline: 2px solid var(--primary); outline-offset: 2px; }
.lg-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: var(--danger);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 13px;
  margin-bottom: 14px;
}
.lg-btn {
  width: 100%;
  padding: 12px;
  border: none;
  border-radius: 8px;
  background: var(--primary);
  color: #fff;
  font-size: 15px;
  font-weight: 600;
  font-family: var(--font);
  cursor: pointer;
  transition: background 0.15s;
  margin-top: 4px;
}
.lg-btn:hover:not(:disabled) { background: var(--primary-hover); }
.lg-btn:disabled { opacity: 0.55; cursor: not-allowed; }
.lg-note { font-size: 12px; color: var(--text-muted); margin-top: 18px; line-height: 1.5; }
.lg-form code {
  background: var(--surface-alt);
  border: 1px solid var(--border-light);
  padding: 1px 5px;
  border-radius: 4px;
  font-size: 12px;
}

@media (max-width: 720px) {
  .lg-wrap { min-height: auto; align-items: flex-start; padding: 8px 0; }
  .lg-card { grid-template-columns: 1fr; }
  .lg-brand { padding: 24px; gap: 8px; }
  .lg-brand h1 { font-size: 20px; margin-top: 4px; }
  .lg-paper { display: none; }
  .lg-form { padding: 28px 24px; }
}
@media (prefers-reduced-motion: reduce) {
  .lg-input, .lg-btn { transition: none; }
}
`;

function BrandPanel() {
  return (
    <div className="lg-brand">
      <div className="lg-mark">
        <span className="lg-mark-badge">UCDA</span>
        <span className="lg-mark-text">Wholesale Bill of Sale</span>
      </div>
      <h1>Dealer-to-dealer sales, filled and signed in minutes.</h1>
      <p>Pick the seller, decode the VIN, and download a ready-to-sign bill. Every bill is saved to your history.</p>

      <div className="lg-paper" aria-hidden="true">
        <div className="lg-paper-top">
          <span className="lg-paper-title">WHOLESALE BILL OF SALE</span>
          <span className="lg-paper-date" />
        </div>
        <div className="lg-paper-row">
          <span className="lg-paper-line" />
          <span className="lg-paper-line" />
        </div>
        <div className="lg-paper-row">
          <span className="lg-paper-line" />
          <span className="lg-paper-line short" />
        </div>
        <div className="lg-paper-grid">
          <span /><span /><span /><span /><span />
        </div>
        <div className="lg-paper-sig">
          <svg viewBox="0 0 92 26" fill="none">
            <path
              d="M4 20c6-14 10-16 12-8s-2 10 2 4 6-12 9-6-1 9 4 5 5-8 8-5 2 6 6 3 6-6 9-4 4 3 8 1 8-4 14-3"
              stroke="#1e3a8a"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
          <span className="lg-paper-sig-line" />
        </div>
      </div>
    </div>
  );
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const handleLogin = async (e) => {
    e?.preventDefault();
    if (!email || !password || busy) return;
    setError("");
    setBusy(true);
    const { error: err } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (err) {
      setError(
        err.message === "Invalid login credentials"
          ? "Email or password is incorrect. Check both and try again."
          : err.message
      );
    }
    setBusy(false);
  };

  return (
    <div className="lg-wrap">
      <style>{css}</style>
      <div className="lg-card">
        <BrandPanel />

        {!isSupabaseConfigured ? (
          <div className="lg-form">
            <h2>Database not connected</h2>
            <p className="lg-sub">
              Add <code>VITE_SUPABASE_URL</code> and <code>VITE_SUPABASE_ANON_KEY</code> to{" "}
              <code>.env.local</code> (on your computer) or to Render → Environment (live site), then
              restart or redeploy.
            </p>
          </div>
        ) : (
          <form className="lg-form" onSubmit={handleLogin} noValidate>
            <h2>Sign in</h2>
            <p className="lg-sub">Use the email and password your admin set up for you.</p>

            <div className="lg-field">
              <label htmlFor="lg-email">Email</label>
              <input
                id="lg-email"
                className="lg-input"
                type="email"
                value={email}
                autoComplete="username"
                autoFocus
                placeholder="name@company.com"
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="lg-field">
              <label htmlFor="lg-pass">Password</label>
              <div className="lg-pass">
                <input
                  id="lg-pass"
                  className="lg-input"
                  type={showPass ? "text" : "password"}
                  value={password}
                  autoComplete="current-password"
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="lg-toggle"
                  onClick={() => setShowPass((v) => !v)}
                  aria-label={showPass ? "Hide password" : "Show password"}
                >
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error && (
              <div className="lg-error" role="alert">
                {error}
              </div>
            )}

            <button className="lg-btn" type="submit" disabled={busy || !email || !password}>
              {busy ? "Signing in…" : "Sign in"}
            </button>

            <p className="lg-note">
              Don’t have an account? Ask your admin to add you in Supabase under Authentication → Users.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}