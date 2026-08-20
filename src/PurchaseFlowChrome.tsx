import { type ReactNode } from "react";
import { Button } from "@acko/button";
import { Progress } from "@acko/progress";
import { ArrowLeft, Tick } from "@acko/icons";
import { Typography } from "@acko/typography";

const JOURNEY_STEPS = [
  "Family details",
  "Existing policy",
  "Coverage",
  "Health conditions",
  "Select plan and customise",
  "Review and pay",
] as const;

/** Shared purchase-flow chrome — responsive journey navigation + mobile progress */
export function PurchaseFlowChrome({
  progress,
  onBack,
  children,
}: {
  progress: number;
  onBack?: () => void;
  children: ReactNode;
}) {
  return (
    <div className="members-flow-page min-h-screen bg-[var(--surfaceBase)]">
      <header className="members-flow-desktop-header hidden lg:flex">
        <img
          src="https://pub-c050457d48794d5bb9ffc2b4649de2c1.r2.dev/ACKO%20logo%20horizontal%20Light%20BG.svg"
          alt="ACKO"
          width={68}
          height={24}
        />
      </header>

      <div className="members-flow-layout">
        <aside className="members-flow-sidebar" aria-label="Purchase journey">
          <nav>
            <ol className="flex flex-col gap-8">
              {JOURNEY_STEPS.map((step, index) => {
                const complete = index < 2;
                const current = index === 2;
                return (
                  <li
                    key={step}
                    className={[
                      "members-journey-step flex items-center gap-12",
                      current ? "members-journey-step-current" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    aria-current={current ? "step" : undefined}
                  >
                    <span
                      className="members-journey-step-marker inline-flex size-20 shrink-0 items-center justify-center"
                      aria-hidden="true"
                    >
                      {complete ? <Tick /> : index + 1}
                    </span>
                    <Typography
                      scale="sm"
                      emphasis={current ? "medium" : "normal"}
                      color={current ? "primary" : "secondary"}
                    >
                      {step}
                    </Typography>
                  </li>
                );
              })}
            </ol>
          </nav>
        </aside>

        <div className="members-flow-column relative mx-auto flex min-h-screen w-full flex-col bg-[var(--surfaceBase)]">
          <div className="members-hero-wash" aria-hidden="true">
            <div className="members-hero-wash__fade" />
          </div>

          <header className="members-flow-mobile-header sticky top-0 z-[var(--zSticky)] bg-transparent">
            <div className="flex flex-col gap-20 pt-12">
              <div className="section-container flex items-center">
                <Button
                  variant="ghost"
                  size="sm"
                  iconOnly
                  iconLeft={<ArrowLeft />}
                  aria-label="Go back"
                  type="button"
                  onClick={onBack}
                >
                  Back
                </Button>
              </div>
              <Progress
                value={progress}
                max={100}
                variant="bar"
                size="sm"
                color="primary"
                className="members-journey-progress"
                aria-label="Purchase progress"
              />
            </div>
          </header>

          {children}
        </div>
      </div>
    </div>
  );
}
