import { useEffect, useRef, useState } from "react";
import { Flame } from "lucide-react";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

const CLIENT_ID =
  "899372708157-vn5plgqrkm655msh7o1uei0dtjdsbvfu.apps.googleusercontent.com";

export default function Login() {
  const { login } = useAuth();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [gisReady, setGisReady] = useState(false);
  const [loading, setLoading] = useState(false);

  // Wait for the GIS script to load, then render the Google button
  useEffect(() => {
    function init() {
      const g = (window as any).google;
      if (!g?.accounts?.id) return;

      g.accounts.id.initialize({
        client_id: CLIENT_ID,
        callback: handleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });

      if (buttonRef.current) {
        g.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: 280,
          text: "signin_with",
          shape: "rectangular",
          logo_alignment: "left",
        });
      }
      setGisReady(true);
    }

    // GIS might already be loaded or still loading
    if ((window as any).google?.accounts?.id) {
      init();
    } else {
      const interval = setInterval(() => {
        if ((window as any).google?.accounts?.id) {
          clearInterval(interval);
          init();
        }
      }, 100);
      return () => clearInterval(interval);
    }
  }, []);

  async function handleCredential(response: { credential: string }) {
    setLoading(true);
    try {
      // Decode the JWT ID token (payload is base64url encoded)
      const [, payload] = response.credential.split(".");
      const decoded = JSON.parse(atob(payload.replace(/-/g, "+").replace(/_/g, "/")));

      login({
        id: decoded.sub,
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
      });
    } catch {
      toast.error("Sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/40 mb-4">
            <Flame className="w-8 h-8 ht-accent-text" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Habits Tracker</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Build streaks. Stay consistent.
          </p>
        </div>

        {/* Card */}
        <div className="bg-card border rounded-xl p-8 shadow-sm">
          <h2 className="text-lg font-semibold mb-1">Welcome back</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Sign in to access your habits
          </p>

          {/* Google button rendered by GIS */}
          <div className="flex justify-center min-h-[44px]">
            {loading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-4 h-4 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
                Signing in…
              </div>
            ) : (
              <div ref={buttonRef} />
            )}
            {!gisReady && !loading && (
              <div className="text-xs text-muted-foreground">Loading…</div>
            )}
          </div>

          <p className="text-xs text-center text-muted-foreground mt-6">
            Your habit data is stored locally on this device.
          </p>
        </div>
      </div>
    </div>
  );
}
