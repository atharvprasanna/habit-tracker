import { useState, type FormEvent } from "react";
import { Eye, EyeOff, Flame } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "./useAuth";
import { isSupabaseEnabled } from "../../lib/supabaseClient";

type Mode = "signin" | "signup" | "forgot" | "reset";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 8;

/** Map backend errors to short, non-revealing messages. */
function friendlyError(e: unknown, fallback: string) {
  const msg = e instanceof Error ? e.message.toLowerCase() : "";
  if (msg.includes("invalid login")) return "Incorrect email or password.";
  if (msg.includes("email not confirmed")) return "Please confirm your email first. Check your inbox.";
  if (msg.includes("rate limit") || msg.includes("too many")) return "Too many attempts. Please wait a moment and try again.";
  if (msg.includes("password") && msg.includes("least")) return `Password must be at least ${MIN_PASSWORD} characters.`;
  return fallback;
}

export default function Login() {
  const { recovering, signInWithPassword, signUpWithPassword, sendPasswordReset, updatePassword } =
    useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  // Opening a password-reset link switches to the "choose a new password" form
  const activeMode: Mode = recovering ? "reset" : mode;

  // ── Form handlers ──────────────────────────────────────────────────────────
  function switchMode(next: Mode) {
    setMode(next);
    setNotice(null);
    setPassword("");
    setConfirm("");
  }

  function validateEmail() {
    if (!EMAIL_RE.test(email.trim()) || email.length > 254) {
      toast.error("Enter a valid email address.");
      return false;
    }
    return true;
  }

  function validatePassword(value: string) {
    if (value.length < MIN_PASSWORD) {
      toast.error(`Password must be at least ${MIN_PASSWORD} characters.`);
      return false;
    }
    if (value.length > 72) {
      toast.error("Password is too long (max 72 characters).");
      return false;
    }
    return true;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (busy) return;
    const cleanEmail = email.trim().toLowerCase();

    try {
      if (activeMode === "signin") {
        if (!validateEmail() || !password) return;
        setBusy(true);
        await signInWithPassword(cleanEmail, password);
      } else if (activeMode === "signup") {
        const cleanName = name.trim();
        if (!cleanName || cleanName.length > 60) {
          toast.error("Enter your name (up to 60 characters).");
          return;
        }
        if (!validateEmail() || !validatePassword(password)) return;
        setBusy(true);
        const { needsConfirmation } = await signUpWithPassword(cleanName, cleanEmail, password);
        if (needsConfirmation) {
          setNotice("Almost done! Check your email and click the confirmation link, then sign in.");
          setMode("signin");
          setPassword("");
        }
      } else if (activeMode === "forgot") {
        if (!validateEmail()) return;
        setBusy(true);
        await sendPasswordReset(cleanEmail);
        // Same message whether or not the account exists (no account enumeration)
        setNotice("If an account exists for that email, a reset link is on its way.");
        setMode("signin");
      } else {
        if (!validatePassword(password)) return;
        if (password !== confirm) {
          toast.error("Passwords do not match.");
          return;
        }
        setBusy(true);
        await updatePassword(password);
        toast.success("Password updated.");
      }
    } catch (err) {
      toast.error(friendlyError(err, "Something went wrong. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  const titles: Record<Mode, { h: string; p: string; cta: string }> = {
    signin: { h: "Welcome back", p: "Sign in to access your habits", cta: "Sign in" },
    signup: { h: "Create your account", p: "Start building streaks today", cta: "Create account" },
    forgot: { h: "Reset your password", p: "We'll email you a reset link", cta: "Send reset link" },
    reset: { h: "Choose a new password", p: "Use at least 8 characters", cta: "Update password" },
  };
  const t = titles[activeMode];
  const fieldClass =
    "w-full h-11 rounded-xl border bg-background px-3 text-base md:text-sm outline-none focus:ring-2 focus:ring-ring";

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/40 mb-4">
            <Flame className="w-8 h-8 ht-accent-text" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Habits Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">Build streaks. Stay consistent.</p>
        </div>

        <div className="bg-card border rounded-xl p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-semibold mb-1">{t.h}</h2>
          <p className="text-sm text-muted-foreground mb-5">{t.p}</p>

          {!isSupabaseEnabled && (
            <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-xs text-destructive">
              Sign-in is not configured for this build.
            </p>
          )}

          {notice && (
            <p role="status" className="mb-4 rounded-lg bg-green-50 p-3 text-xs text-green-700 dark:bg-green-950/30 dark:text-green-400">
              {notice}
            </p>
          )}

          <form onSubmit={handleSubmit} className="space-y-3" noValidate>
            {activeMode === "signup" && (
              <input
                className={fieldClass}
                type="text"
                placeholder="Your name"
                autoComplete="name"
                maxLength={60}
                value={name}
                onChange={(e) => setName(e.target.value)}
                aria-label="Your name"
              />
            )}

            {activeMode !== "reset" && (
              <input
                className={fieldClass}
                type="email"
                placeholder="Email"
                autoComplete="email"
                inputMode="email"
                maxLength={254}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-label="Email"
              />
            )}

            {activeMode !== "forgot" && (
              <div className="relative">
                <input
                  className={`${fieldClass} pr-11`}
                  type={showPw ? "text" : "password"}
                  placeholder={activeMode === "reset" ? "New password" : "Password"}
                  autoComplete={activeMode === "signin" ? "current-password" : "new-password"}
                  maxLength={72}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-label="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-1 top-1 flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground"
                  aria-label={showPw ? "Hide password" : "Show password"}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            )}

            {activeMode === "reset" && (
              <input
                className={fieldClass}
                type={showPw ? "text" : "password"}
                placeholder="Confirm new password"
                autoComplete="new-password"
                maxLength={72}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                aria-label="Confirm new password"
              />
            )}

            <button
              type="submit"
              disabled={busy || !isSupabaseEnabled}
              className="ht-accent-btn h-11 w-full rounded-xl text-sm font-semibold text-white transition-transform active:scale-[0.98] disabled:opacity-60"
              style={{ backgroundColor: "#f97316" }}
            >
              {busy ? "Please wait…" : t.cta}
            </button>
          </form>

          {/* Mode links */}
          <div className="mt-4 space-y-2 text-center text-sm">
            {activeMode === "signin" && (
              <>
                <button type="button" className="text-muted-foreground underline-offset-2 hover:underline" onClick={() => switchMode("forgot")}>
                  Forgot password?
                </button>
                <p className="text-muted-foreground">
                  New here?{" "}
                  <button type="button" className="font-semibold ht-accent-text" onClick={() => switchMode("signup")}>
                    Create an account
                  </button>
                </p>
              </>
            )}
            {activeMode === "signup" && (
              <p className="text-muted-foreground">
                Already have an account?{" "}
                <button type="button" className="font-semibold ht-accent-text" onClick={() => switchMode("signin")}>
                  Sign in
                </button>
              </p>
            )}
            {activeMode === "forgot" && (
              <button type="button" className="font-semibold ht-accent-text" onClick={() => switchMode("signin")}>
                Back to sign in
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
