import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: string; size?: string }>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(
          "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
          variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" :
          variant === "outline" ? "border border-input hover:bg-accent hover:text-accent-foreground" :
          variant === "ghost" ? "hover:bg-accent hover:text-accent-foreground" :
          "bg-primary text-primary-foreground hover:bg-primary/90",
          size === "sm" ? "h-9 px-3 rounded-xl" : size === "lg" ? "h-11 px-8 rounded-xl" : "h-10 py-2 px-4",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)

export const ThemeSettings = () => null
export const Avatar = ({ children, className }: any) => <div className={cn("relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full", className)}>{children}</div>
export const AvatarImage = ({ src, alt, className }: any) => src ? <img src={src} alt={alt} className={cn("absolute inset-0 h-full w-full object-cover rounded-full", className)} /> : null
export const AvatarFallback = ({ children, className }: any) => <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}>{children}</div>
// ── DropdownMenu ──────────────────────────────────────────────────────────────
const DropdownContext = React.createContext<{ open: boolean; setOpen: (v: boolean) => void }>({ open: false, setOpen: () => {} });

export const DropdownMenu = ({ children }: any) => {
  const [open, setOpen] = React.useState(false);
  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div className="relative">{children}</div>
    </DropdownContext.Provider>
  );
};
export const DropdownMenuTrigger = ({ children, asChild }: any) => {
  const { setOpen, open } = React.useContext(DropdownContext);
  const child = React.Children.only(children) as React.ReactElement<any>;
  return React.cloneElement(child, { onClick: (e: any) => { e.stopPropagation(); setOpen(!open); } });
};
export const DropdownMenuContent = ({ children, align }: any) => {
  const { open, setOpen } = React.useContext(DropdownContext);
  React.useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [open, setOpen]);
  if (!open) return null;
  return (
    <div className={cn("absolute z-50 min-w-[8rem] overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-md bottom-full mb-1", align === "end" ? "right-0" : "left-0")}>
      {children}
    </div>
  );
};
export const DropdownMenuItem = ({ children, onClick, className }: any) => {
  const { setOpen } = React.useContext(DropdownContext);
  return (
    <div
      onClick={(e) => { e.stopPropagation(); setOpen(false); onClick?.(); }}
      className={cn("relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground", className)}
    >
      {children}
    </div>
  );
};
// ── Sidebar context ──────────────────────────────────────────────────────────
interface SidebarCtx {
  open: boolean;
  setOpen: (v: boolean) => void;
  toggleSidebar: () => void;
  state: "expanded" | "collapsed";
}
const SidebarContext = React.createContext<SidebarCtx>({
  open: true,
  setOpen: () => {},
  toggleSidebar: () => {},
  state: "expanded",
});

export const useSidebar = () => React.useContext(SidebarContext);
export const useIsMobile = () => false;

export const SidebarProvider = ({ children, style }: any) => {
  const [open, setOpen] = React.useState(true);
  const toggleSidebar = () => setOpen(v => !v);
  const state: "expanded" | "collapsed" = open ? "expanded" : "collapsed";
  return (
    <SidebarContext.Provider value={{ open, setOpen, toggleSidebar, state }}>
      <div className="flex min-h-screen w-full" style={style}>{children}</div>
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({ children, className, disableTransition }: any) => {
  const { open } = useSidebar();
  return (
    <aside
      className={cn(
        "bg-card flex flex-col overflow-hidden",
        disableTransition ? "" : "transition-all duration-300",
        open ? "w-64" : "w-14",
        className
      )}
      data-state={open ? "expanded" : "collapsed"}
    >
      {children}
    </aside>
  );
};

export const SidebarHeader = ({ children, className }: any) => (
  <div className={cn("flex h-16 items-center shrink-0", className)}>{children}</div>
);
export const SidebarContent = ({ children, className }: any) => (
  <div className={cn("flex-1 overflow-auto py-2", className)}>{children}</div>
);
export const SidebarFooter = ({ children, className }: any) => (
  <div className={cn("p-3 shrink-0", className)}>{children}</div>
);
export const SidebarMenu = ({ children, className }: any) => (
  <nav className={cn("grid items-start text-sm font-medium", className)}>{children}</nav>
);
export const SidebarMenuItem = ({ children }: any) => <div>{children}</div>;
export const SidebarMenuButton = ({ children, onClick, className, isActive, tooltip }: any) => {
  const { open } = useSidebar();
  return (
    <button
      onClick={onClick}
      title={!open ? tooltip : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 w-full transition-all hover:text-primary",
        isActive ? "bg-muted text-primary" : "text-muted-foreground",
        !open && "justify-center px-2",
        className
      )}
    >
      {open ? children : React.Children.toArray(children)[0]}
    </button>
  );
};
export const SidebarInset = ({ children }: any) => (
  <main className="flex flex-1 flex-col overflow-hidden min-w-0">{children}</main>
);
export const SidebarTrigger = ({ className }: any) => {
  const { toggleSidebar } = useSidebar();
  return (
    <button onClick={toggleSidebar} className={cn("p-2 rounded-lg hover:bg-accent", className)}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M2 4h12M2 8h12M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      </svg>
    </button>
  );
};
export const Card = ({ children, className }: any) => <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>{children}</div>
