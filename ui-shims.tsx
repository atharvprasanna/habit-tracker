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
          "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background",
          variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : 
          variant === "outline" ? "border border-input hover:bg-accent hover:text-accent-foreground" :
          variant === "ghost" ? "hover:bg-accent hover:text-accent-foreground" :
          "bg-primary text-primary-foreground hover:bg-primary/90",
          size === "sm" ? "h-9 px-3 rounded-md" : size === "lg" ? "h-11 px-8 rounded-md" : "h-10 py-2 px-4",
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
          "flex h-10 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
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
export const AvatarFallback = ({ children, className }: any) => <div className={cn("flex h-full w-full items-center justify-center rounded-full bg-muted", className)}>{children}</div>
export const DropdownMenu = ({ children }: any) => children
export const DropdownMenuTrigger = ({ children, asChild }: any) => children
export const DropdownMenuContent = ({ children }: any) => <div className="z-50 min-w-[8rem] overflow-hidden rounded-md border bg-popover p-1 text-popover-foreground shadow-md">{children}</div>
export const DropdownMenuItem = ({ children, onClick, className }: any) => <div onClick={onClick} className={cn("relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground", className)}>{children}</div>
export const SidebarProvider = ({ children }: any) => <div className="flex min-h-screen w-full">{children}</div>
export const Sidebar = ({ children }: any) => <aside className="hidden border-r bg-card md:block w-64">{children}</aside>
export const SidebarHeader = ({ children }: any) => <div className="flex h-14 items-center border-b px-4">{children}</div>
export const SidebarContent = ({ children }: any) => <div className="flex-1 overflow-auto py-2">{children}</div>
export const SidebarFooter = ({ children }: any) => <div className="border-t p-4">{children}</div>
export const SidebarMenu = ({ children }: any) => <nav className="grid items-start px-2 text-sm font-medium">{children}</nav>
export const SidebarMenuItem = ({ children }: any) => <div>{children}</div>
export const SidebarMenuButton = ({ children, onClick, className, isActive }: any) => (
  <button onClick={onClick} className={cn("flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary", isActive ? "bg-muted text-primary" : "text-muted-foreground", className)}>
    {children}
  </button>
)
export const SidebarInset = ({ children }: any) => <main className="flex flex-1 flex-col overflow-hidden">{children}</main>
export const SidebarTrigger = () => null
export const useSidebar = () => ({ open: true, setOpen: () => {}, isMobile: false })
export const useIsMobile = () => false
export const Card = ({ children, className }: any) => <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)}>{children}</div>
