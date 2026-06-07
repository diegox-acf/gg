"use client";

import { createContext, Fragment, useContext } from "react";
import { Check } from "lucide-react";
import { cn } from "@gg/ui";

/* Compound Component: Stepper.Root shares step state implicitly with
   Stepper.Indicator and Stepper.Panel via context. */

interface StepperContextValue {
  current: number;
  steps: string[];
  goTo: (index: number) => void;
}

const StepperContext = createContext<StepperContextValue | null>(null);

function useStepper() {
  const ctx = useContext(StepperContext);
  if (!ctx) throw new Error("Stepper.* must be used within <Stepper.Root>");
  return ctx;
}

function Root({
  current,
  steps,
  goTo,
  children,
}: StepperContextValue & { children: React.ReactNode }) {
  return (
    <StepperContext.Provider value={{ current, steps, goTo }}>
      {children}
    </StepperContext.Provider>
  );
}

function Indicator() {
  const { current, steps, goTo } = useStepper();

  return (
    <div className="mb-9 flex items-center">
      {steps.map((label, i) => {
        const done = i < current;
        const active = i === current;
        const reachable = i <= current;

        return (
          <Fragment key={label}>
            <button
              type="button"
              disabled={!reachable}
              onClick={() => reachable && goTo(i)}
              className={cn(
                "flex items-center gap-2.5 transition-opacity duration-300",
                reachable ? "opacity-100" : "opacity-40",
                reachable && !active ? "cursor-pointer" : "cursor-default",
              )}
            >
              <span
                className={cn(
                  "clip-cyber-xs flex size-7 items-center justify-center border",
                  "font-[family-name:var(--font-display)] text-[10px] font-extrabold",
                  done || active
                    ? "border-primary bg-primary text-fg-inverse"
                    : "border-border-strong bg-transparent text-fg-2",
                )}
              >
                {done ? <Check size={13} /> : `0${i + 1}`}
              </span>
              <span
                className={cn(
                  "hidden font-[family-name:var(--font-display)] text-[11px] font-semibold uppercase tracking-[0.1em] sm:inline",
                  active ? "text-fg-1" : "text-fg-3",
                )}
              >
                {label}
              </span>
            </button>

            {i < steps.length - 1 && (
              <div
                className={cn(
                  "mx-3 h-px flex-1 transition-colors duration-300 sm:mx-4",
                  i < current ? "bg-primary" : "bg-border",
                )}
              />
            )}
          </Fragment>
        );
      })}
    </div>
  );
}

function Panel({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  const { current } = useStepper();
  if (current !== index) return null;
  return <div className="animate-[fadeInUp_250ms_ease_both]">{children}</div>;
}

export const Stepper = { Root, Indicator, Panel };
