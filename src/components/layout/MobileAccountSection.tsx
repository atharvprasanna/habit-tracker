import { LogOut } from "lucide-react";
import { useAuth } from "../../features/auth/useAuth";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/ui-shims";

/**
 * Phone-only replacement for the side navigation: who is signed in and Sign out. Shown at the top of the Settings dialog.
 */
export default function MobileAccountSection() {
  const { user, logout } = useAuth();

  return (
    <section className="mb-6 rounded-2xl border bg-muted/30 p-4">
      <div className="flex items-center gap-3">
        <Avatar className="h-12 w-12 border">
          <AvatarImage src={user?.picture} alt={user?.name} />
          <AvatarFallback className="text-sm font-medium">
            {user?.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{user?.name || "-"}</p>
          {user?.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
        </div>
        <button
          onClick={logout}
          className="flex h-10 items-center gap-1.5 rounded-xl border px-3 text-xs font-medium text-destructive active:scale-95"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign out
        </button>
      </div>

    </section>
  );
}
