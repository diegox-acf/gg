"use client";

import { useState } from "react";
import { cn } from "@gg/ui";

interface IconBtnProps {
  onClick?: () => void;
  badge?: number;
  label: string;
  children: React.ReactNode;
  className?: string;
}

export function IconBtn({
  onClick,
  badge,
  label,
  children,
  className,
}: IconBtnProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      aria-label={label}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={cn(
        "relative flex items-center p-2",
        "transition-all duration-150",
        "cursor-pointer border-none",
        hovered
          ? "bg-primary-muted text-primary clip-cyber-badge"
          : "bg-transparent text-fg-2",
        className,
      )}
    >
      {children}
      {badge != null && badge > 0 && (
        <span
          aria-label={`${badge} items`}
          className="absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-primary text-fg-inverse"
          style={{
            fontFamily: "var(--font-display)",
            fontSize: 9,
            fontWeight: 900,
          }}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      )}
    </button>
  );
}
