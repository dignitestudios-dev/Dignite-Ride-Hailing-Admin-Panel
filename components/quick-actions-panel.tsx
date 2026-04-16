"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  Settings,
  Megaphone,
  Wallet,
  ClipboardList,
  Car,
} from "lucide-react";

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
    label: "Manage Vehicle Categories",
    href: "/dashboard/vehicle-categories",
    icon: Car,
  },
];

export function QuickActionsPanel() {
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
        {quickActions.map((action, index) => (
          <div
            key={action.label}
            className={`flex items-center gap-3 transition-all duration-300 ${
              open ? "opacity-100 translate-y-0 scale-100" : "pointer-events-none opacity-0 translate-y-3 scale-95"
            } ${open ? "quick-action-bubble" : ""}`}
            style={{ transitionDelay: `${index * 60}ms`, animationDelay: `${index * 60}ms` }}
          >
            <Link
              href={action.href}
              onClick={handleActionClick}
              className="pointer-events-auto whitespace-nowrap rounded-lg bg-zinc-700 px-3 py-1.5 text-sm font-medium text-white shadow"
            >
              {action.label}
            </Link>
            <Link
              href={action.href}
              onClick={handleActionClick}
              className="pointer-events-auto flex h-10 w-10 items-center justify-center rounded-full border border-primary/20 bg-white text-primary shadow-lg"
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
