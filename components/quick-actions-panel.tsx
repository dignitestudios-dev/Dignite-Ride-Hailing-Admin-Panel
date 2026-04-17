"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Settings,
  Megaphone,
  Wallet,
  ClipboardList,
  ShieldAlert,
  LayoutPanelTop,
  PanelLeftClose,
  ArrowLeftRight,
  RotateCcw,
} from "lucide-react";
import {
  SIDEBAR_COLLAPSIBLE_OPTIONS,
  SIDEBAR_SIDE_OPTIONS,
  SIDEBAR_VARIANT_OPTIONS,
} from "@/contexts/sidebar-context";
import { useSidebarConfig } from "@/hooks/use-sidebar-config";

const quickActions = [
  {
    label: "Send Notification",
    href: "/dashboard/notifications",
    icon: Megaphone,
  },
  {
    label: "Review Driver Requests",
    href: "/dashboard/driver-requests",
    icon: ClipboardList,
  },
  {
    label: "View Revenue",
    href: "/dashboard/revenue/subscription",
    icon: Wallet,
  },
  {
    label: "Manage Reports",
    href: "/dashboard/reports",
    icon: ShieldAlert,
  },
];

export function QuickActionsPanel() {
  const { config, setConfigOption, resetConfig } = useSidebarConfig();
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);
  const draggingRef = useRef(false);
  const movedRef = useRef(false);
  const startPointerRef = useRef({ x: 0, y: 0 });
  const startPositionRef = useRef({ x: 0, y: 0 });

  const clampPosition = (x: number, y: number) => {
    if (typeof window === "undefined") return { x, y };

    const min = 12;
    const maxX = Math.max(min, window.innerWidth - 72);
    const maxY = Math.max(min, window.innerHeight - 72);

    return {
      x: Math.min(maxX, Math.max(min, x)),
      y: Math.min(maxY, Math.max(min, y)),
    };
  };

  useEffect(() => {
    const initialPosition = clampPosition(
      window.innerWidth - 64,
      window.innerHeight - 64
    );
    setPosition(initialPosition);
    setIsReady(true);

    const onPointerMove = (event: PointerEvent) => {
      if (!draggingRef.current) return;

      const deltaX = event.clientX - startPointerRef.current.x;
      const deltaY = event.clientY - startPointerRef.current.y;

      if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) {
        movedRef.current = true;
      }

      const nextPosition = clampPosition(
        startPositionRef.current.x + deltaX,
        startPositionRef.current.y + deltaY
      );
      setPosition(nextPosition);
    };

    const onPointerUp = () => {
      draggingRef.current = false;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);

    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  const handlePointerDown = (event: React.PointerEvent<HTMLButtonElement>) => {
    draggingRef.current = true;
    movedRef.current = false;
    startPointerRef.current = { x: event.clientX, y: event.clientY };
    startPositionRef.current = { ...position };
  };

  const handleFabClick = () => {
    if (movedRef.current) {
      movedRef.current = false;
      return;
    }
    setOpen((prev) => !prev);
  };

  const handleActionClick = () => {
    setOpen(false);
  };

  if (!isReady) return null;

  return (
    <div
      className="fixed z-40 hidden lg:block"
      style={{ left: position.x, top: position.y }}
      aria-label="Quick actions panel"
    >
      <div className="pointer-events-none absolute right-0 bottom-20 flex flex-col items-end gap-3">
        <div
          className={`w-[18rem] rounded-xl border border-primary/20 bg-background/95 p-3 shadow-xl backdrop-blur transition-all duration-300 ${
            open
              ? "pointer-events-auto opacity-100 translate-y-0 scale-100"
              : "pointer-events-none opacity-0 translate-y-3 scale-95"
          }`}
          style={{ transitionDelay: "20ms" }}
        >
          <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Sidebar Config
          </p>

          <div className="space-y-2.5">
            <div>
              <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase">
                <LayoutPanelTop className="size-3.5" />
                Variant
              </p>
              <div className="grid grid-cols-3 gap-1">
                {SIDEBAR_VARIANT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setConfigOption("variant", option.value)}
                    className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                      config.variant === option.value
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/80 bg-background text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase">
                <PanelLeftClose className="size-3.5" />
                Collapsible
              </p>
              <div className="grid grid-cols-3 gap-1">
                {SIDEBAR_COLLAPSIBLE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setConfigOption("collapsible", option.value)}
                    className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                      config.collapsible === option.value
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/80 bg-background text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="mb-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground uppercase">
                <ArrowLeftRight className="size-3.5" />
                Side
              </p>
              <div className="grid grid-cols-2 gap-1">
                {SIDEBAR_SIDE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setConfigOption("side", option.value)}
                    className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                      config.side === option.value
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border/80 bg-background text-muted-foreground hover:bg-muted/70"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={resetConfig}
            className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-md border border-border/80 bg-background px-2 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted/70"
          >
            <RotateCcw className="size-3.5" />
            Reset Default
          </button>
        </div>

        {quickActions.map((action, index) => (
          <div
            key={action.label}
            className={`flex items-center gap-3 transition-all duration-300 ${
              open
                ? "pointer-events-auto opacity-100 translate-y-0 scale-100"
                : "pointer-events-none opacity-0 translate-y-3 scale-95"
            } ${open ? "quick-action-bubble" : ""}`}
            style={{ transitionDelay: `${index * 60}ms`, animationDelay: `${index * 60}ms` }}
          >
            <Link
              href={action.href}
              onClick={handleActionClick}
              className={`whitespace-nowrap rounded-lg bg-zinc-700 px-3 py-1.5 text-sm font-medium text-white shadow ${
                open ? "pointer-events-auto" : "pointer-events-none"
              }`}
            >
              {action.label}
            </Link>
            <Link
              href={action.href}
              onClick={handleActionClick}
              className={`flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-white text-primary shadow-lg ${
                open ? "pointer-events-auto" : "pointer-events-none"
              }`}
              aria-label={action.label}
              title={action.label}
            >
              <action.icon className="h-4 w-4" />
            </Link>
          </div>
        ))}
      </div>

      <button
        type="button"
        onPointerDown={handlePointerDown}
        onClick={handleFabClick}
        className="cursor-grab rounded-full bg-primary p-3 text-primary-foreground shadow-lg active:cursor-grabbing"
        aria-label={open ? "Close quick actions" : "Open quick actions"}
        title={open ? "Close quick actions" : "Open quick actions"}
      >
        <Settings
          className={`h-5 w-5 transition-transform duration-300 ${open ? "rotate-180" : "rotate-0"}`}
        />
      </button>
    </div>
  );
}
