import { type ReactNode } from "react";
import { Button } from "@acko/button";
import { Progress } from "@acko/progress";
import { ArrowLeft } from "@acko/icons";

/** Shared purchase-flow chrome — back + progress + hero wash */
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
    <div className="min-h-screen bg-[var(--surfaceBase)]">
      <div className="members-flow-column relative mx-auto flex min-h-screen w-full flex-col bg-[var(--surfaceBase)]">
        <div className="members-hero-wash" aria-hidden="true">
          <div className="members-hero-wash__fade" />
        </div>

        <header className="sticky top-0 z-[var(--zSticky)] bg-transparent">
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
  );
}
