import React from "react";
import { useAuth } from "../../features/auth/useAuth";
import {
  Avatar,
  AvatarImage,
  AvatarFallback,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
  useIsMobile
} from "../ui/ui-shims";
import { BookOpen, ChevronDown, ChevronRight, LayoutDashboard, LogOut, PanelLeft, Sparkles, TrendingUp, X } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { createPortal } from "react-dom";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
];

// ── Info modal content ────────────────────────────────────────────────────────
interface InfoTopic {
  id: string;
  icon: React.ReactNode;
  title: string;
  accent: string;
  sections: { heading?: string; items: { icon: string; text: string }[] }[];
  quote?: { text: string; author: string };
}

const INFO_TOPICS: InfoTopic[] = [
  {
    id: "what",
    icon: <BookOpen className="w-6 h-6" />,
    title: "What is Habit Tracker?",
    accent: "#3b82f6",
    sections: [
      {
        items: [
          { icon: "📅", text: "A visual calendar grid that shows every day of the month — tick off each habit as you go." },
          { icon: "🔥", text: "Tracks streaks automatically so you always know how many days in a row you've been consistent." },
          { icon: "🎯", text: "Set a monthly goal per habit and watch your Achievement column fill up in real time." },
          { icon: "📊", text: "Progress section gives you a bar chart, completion rate, and goal tracker — all in one view." },
          { icon: "🔒", text: "Your data lives entirely on your device. No cloud sync, no tracking — just you and your habits." },
        ],
      },
    ],
  },
  {
    id: "how",
    icon: <Sparkles className="w-6 h-6" />,
    title: "How does it work?",
    accent: "#10b981",
    sections: [
      {
        heading: "Getting started",
        items: [
          { icon: "➕", text: "Click Add New Habit and give it a name — exercise, reading, meditation, anything you want to build." },
          { icon: "🎨", text: "Tap the ⋮ menu on a habit to rename it, pick a colour, or reorder it in the list." },
        ],
      },
      {
        heading: "Daily use",
        items: [
          { icon: "✅", text: "Each day's column has a checkbox. Tick it when you complete the habit — the streak updates instantly." },
          { icon: "🔢", text: "Enter your monthly Goal for each habit. The Achievement column shows how close you are." },
          { icon: "⬅️", text: "Use the month arrows to travel back in time and fill in any days you forgot." },
        ],
      },
      {
        heading: "Progress view",
        items: [
          { icon: "📈", text: "Select any habit from the Progress dropdown to see a full bar chart of completed vs missed days." },
          { icon: "💡", text: "Grey bars = missed days. Coloured bars = completed. Faded area = days still to come." },
        ],
      },
    ],
  },
  {
    id: "why",
    icon: <TrendingUp className="w-6 h-6" />,
    title: "Why does it work?",
    accent: "#f59e0b",
    quote: { text: "What gets measured, gets managed.", author: "Peter Drucker" },
    sections: [
      {
        items: [
          { icon: "👁️", text: "Visibility creates accountability. When you can see blank squares staring back at you, skipping feels costly." },
          { icon: "⛓️", text: "The \"don't break the chain\" effect — streaks build a psychological momentum that makes quitting harder than continuing." },
          { icon: "🧠", text: "Checking a box triggers a small dopamine reward. Over time, the habit itself becomes the reward." },
          { icon: "📐", text: "Measurement removes ambiguity. \"I exercise regularly\" is vague; \"I've hit the gym 18 of 31 days\" is a fact you can act on." },
          { icon: "🔄", text: "Seeing all habits together encourages habit stacking — completing one makes you more likely to complete the next." },
        ],
      },
    ],
  },
];

function InfoModal({ topic, onClose }: { topic: InfoTopic; onClose: () => void }) {
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-card border rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center gap-4 p-6 rounded-t-2xl"
          style={{ background: `linear-gradient(135deg, ${topic.accent}22 0%, ${topic.accent}08 100%)`, borderBottom: `2px solid ${topic.accent}33` }}
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${topic.accent}22`, color: topic.accent }}
          >
            {topic.icon}
          </div>
          <h2 className="text-xl font-bold flex-1">{topic.title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quote */}
        {topic.quote && (
          <div
            className="mx-6 mt-5 px-4 py-3 rounded-xl border-l-4 italic text-sm"
            style={{ borderColor: topic.accent, backgroundColor: `${topic.accent}10`, color: topic.accent }}
          >
            <div className="font-medium">"{topic.quote.text}"</div>
            <div className="text-xs mt-1 opacity-70 not-italic">— {topic.quote.author}</div>
          </div>
        )}

        {/* Sections */}
        <div className="p-6 space-y-5">
          {topic.sections.map((section, si) => (
            <div key={si}>
              {section.heading && (
                <div
                  className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: topic.accent }}
                >
                  {section.heading}
                </div>
              )}
              <ul className="space-y-3">
                {section.items.map((item, ii) => (
                  <li key={ii} className="flex items-start gap-3">
                    <span className="text-lg leading-tight shrink-0 mt-0.5">{item.icon}</span>
                    <span className="text-sm text-foreground/85 leading-relaxed">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
            style={{ backgroundColor: topic.accent }}
          >
            Got it!
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 280;
const MIN_WIDTH = 200;
const MAX_WIDTH = 480;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state, toggleSidebar, setOpen } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const [infoExpanded, setInfoExpanded] = useState(true);
  const [activeTopic, setActiveTopic] = useState<InfoTopic | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const activeMenuItem = menuItems.find(item => item.path === location);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <>
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r-0"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-16 justify-center">
            <div className="flex items-center gap-3 px-2 transition-all w-full">
              <button
                onClick={toggleSidebar}
                className="h-8 w-8 flex items-center justify-center hover:bg-accent rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring shrink-0"
                aria-label="Toggle navigation"
              >
                <PanelLeft className="h-4 w-4 text-muted-foreground" />
              </button>
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <span className="font-semibold tracking-tight truncate">
                    Navigation
                  </span>
                </div>
              ) : null}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-0">
            <SidebarMenu className="px-2 py-1">
              {/* Dashboard nav item */}
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={location === "/"}
                  onClick={() => {
                    if (isCollapsed) { setOpen(true); return; }
                    setLocation("/");
                    setInfoExpanded(v => !v);
                  }}
                  tooltip="Dashboard"
                  className="h-10 transition-all font-normal"
                >
                  <LayoutDashboard className={`h-4 w-4 ${location === "/" ? "text-primary" : ""}`} />
                  <span className="flex-1">Dashboard</span>
                  {!isCollapsed && (
                    infoExpanded
                      ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                      : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </SidebarMenuButton>
              </SidebarMenuItem>

              {/* Info sub-items — only shown when sidebar is expanded */}
              {!isCollapsed && infoExpanded && (
                <div className="ml-3 pl-3 border-l border-border/60 mt-0.5 space-y-0.5">
                  {INFO_TOPICS.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => setActiveTopic(topic)}
                      className="w-full flex items-center gap-2.5 px-2 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-accent/60 transition-colors text-left"
                    >
                      <span style={{ color: topic.accent }} className="shrink-0">
                        {topic.icon}
                      </span>
                      <span className="truncate">{topic.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </SidebarMenu>
          </SidebarContent>

          {/* Info modal */}
          {activeTopic && (
            <InfoModal topic={activeTopic} onClose={() => setActiveTopic(null)} />
          )}

          <SidebarFooter className="p-3">
            {isCollapsed ? (
              <button
                onClick={() => setOpen(true)}
                className="flex items-center justify-center rounded-lg p-1 hover:bg-accent/50 transition-colors w-full"
                title={user?.name ?? "Expand navigation"}
              >
                <Avatar className="h-9 w-9 border shrink-0">
                  <AvatarImage src={(user as any)?.picture} alt={user?.name} />
                  <AvatarFallback className="text-xs font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </button>
            ) : (
              <div className="flex items-center gap-3 rounded-lg px-1 py-1 w-full">
                <Avatar className="h-9 w-9 border shrink-0">
                  <AvatarImage src={(user as any)?.picture} alt={user?.name} />
                  <AvatarFallback className="text-xs font-medium">
                    {user?.name?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate leading-none">
                    {user?.name || "-"}
                  </p>
                  {(user as any)?.email && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {(user as any).email}
                    </p>
                  )}
                  <button
                    onClick={logout}
                    className="flex items-center gap-1 mt-1.5 text-xs text-destructive hover:opacity-75 transition-opacity"
                  >
                    <LogOut className="h-3 w-3" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </SidebarFooter>
        </Sidebar>
        <div
          className={`absolute top-0 right-0 w-1 h-full cursor-col-resize hover:bg-primary/20 transition-colors ${isCollapsed ? "hidden" : ""}`}
          onMouseDown={() => {
            if (isCollapsed) return;
            setIsResizing(true);
          }}
          style={{ zIndex: 50 }}
        />
      </div>

      <SidebarInset>
        {isMobile && (
          <div className="flex border-b h-14 items-center justify-between bg-background/95 px-2 backdrop-blur supports-[backdrop-filter]:backdrop-blur sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger className="h-9 w-9 rounded-lg bg-background" />
              <div className="flex items-center gap-3">
                <div className="flex flex-col gap-1">
                  <span className="tracking-tight text-foreground">
                    {activeMenuItem?.label ?? "Menu"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
        <main className="flex-1 p-4">{children}</main>
      </SidebarInset>
    </>
  );
}
