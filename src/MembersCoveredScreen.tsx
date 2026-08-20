import { useState, type FormEvent, type ReactNode } from "react";
import { Typography } from "@acko/typography";
import { Button } from "@acko/button";
import { Card } from "@acko/card";
import { CheckboxRow } from "@acko/checkbox";
import { Alert } from "@acko/alert";
import { ArrowRight, Info, Minus, Plus } from "@acko/icons";
import { PurchaseFlowChrome } from "./PurchaseFlowChrome";
import {
  DEFAULT_COVERED_SELECTION,
  withRequiredSelf,
  type CoveredSelection,
  type MemberKey,
} from "./memberTypes";

/**
 * Members covered — purchase flow step
 * Structure from Figma; visuals from ACKO design system.
 */

const IMMEDIATE_FAMILY: { key: MemberKey; label: string }[] = [
  { key: "spouse", label: "Spouse" },
];

const ELDERS: { key: MemberKey; label: string }[] = [
  { key: "father", label: "Father" },
  { key: "mother", label: "Mother" },
  { key: "fatherInLaw", label: "Father-in-law" },
  { key: "motherInLaw", label: "Mother-in-law" },
];

function ChildStepper({
  count,
  onDecrement,
  onIncrement,
}: {
  count: number;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  const canDecrement = count > 0;

  return (
    <div className="flex items-center" role="group" aria-label="Child count">
      <Button
        variant="secondary"
        size="sm"
        iconOnly
        type="button"
        disabled={!canDecrement}
        iconLeft={<Minus />}
        aria-label="Remove child"
        onClick={onDecrement}
      >
        Decrease
      </Button>
      <div className="flex w-40 shrink-0 items-center justify-center">
        <Typography
          scale="base"
          emphasis="bold"
          color="primary"
          align="center"
          className="tabular-nums leading-none"
          aria-live="polite"
        >
          {count}
        </Typography>
      </div>
      <Button
        variant="secondary"
        size="sm"
        iconOnly
        type="button"
        iconLeft={<Plus />}
        aria-label="Add child"
        onClick={onIncrement}
      >
        Increase
      </Button>
    </div>
  );
}

function MemberGroup({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="flex w-full flex-col gap-12">
      <Typography scale="base" emphasis="medium" color="primary">
        {title}
      </Typography>
      <Card variant="primary" className="w-full overflow-hidden">
        <div className="flex flex-col px-16">{children}</div>
      </Card>
    </div>
  );
}

export default function MembersCoveredScreen({
  onContinue,
  onBack,
  initialSelection = DEFAULT_COVERED_SELECTION,
}: {
  onContinue?: (selection: CoveredSelection) => void;
  onBack?: () => void;
  initialSelection?: CoveredSelection;
}) {
  const [selected, setSelected] = useState<Record<MemberKey, boolean>>({
    ...initialSelection.members,
    self: true,
  });
  const [childCount, setChildCount] = useState(initialSelection.childCount);

  const toggle = (key: MemberKey) => (next: boolean) => {
    if (key === "self") return;
    setSelected((prev) => ({ ...prev, [key]: next }));
  };

  const handleContinue = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onContinue?.(
      withRequiredSelf({ members: { ...selected, self: true }, childCount }),
    );
  };

  return (
    <PurchaseFlowChrome progress={70} onBack={onBack}>
      <form
        className="relative z-10 flex flex-1 flex-col"
        onSubmit={handleContinue}
      >
        <main className="section-container flex flex-1 flex-col gap-40 pb-24 pt-32">
          <Typography scale="2xl" emphasis="bold" as="h1">
            Select the members you would like to cover
          </Typography>

          <div className="flex w-full flex-col gap-32">
            <MemberGroup title="Immediate family">
              <CheckboxRow
                label="Self"
                checked
                onChange={() => undefined}
                className="members-self-required"
              />
              {IMMEDIATE_FAMILY.map((member) => (
                <CheckboxRow
                  key={member.key}
                  label={member.label}
                  checked={selected[member.key]}
                  onChange={toggle(member.key)}
                />
              ))}

              <div className="members-child-row flex w-full items-center gap-12 py-16">
                <Typography
                  scale="sm"
                  emphasis="medium"
                  color="primary"
                  className="min-w-0 flex-1"
                >
                  Child
                </Typography>
                <ChildStepper
                  count={childCount}
                  onDecrement={() => setChildCount((n) => Math.max(0, n - 1))}
                  onIncrement={() => setChildCount((n) => n + 1)}
                />
              </div>
            </MemberGroup>

            <MemberGroup title="Your elders">
              {ELDERS.map((member) => (
                <CheckboxRow
                  key={member.key}
                  label={member.label}
                  checked={selected[member.key]}
                  onChange={toggle(member.key)}
                />
              ))}
            </MemberGroup>

            <Button variant="secondary" fullWidth type="button">
              Add more members
            </Button>
          </div>
        </main>

        <div className="sticky bottom-0 z-[var(--zSticky)] w-full">
          <Alert
            variant="info"
            layout="inline"
            title="Here’s something to keep in mind:"
            icon={
              <span className="size-20 shrink-0" aria-hidden="true">
                <Info />
              </span>
            }
            className="members-keep-in-mind rounded-none"
          >
            Every family member’s premium is calculated based on their age and
            health status
          </Alert>

          <div className="bottom-cta w-full bg-[var(--cardFillDefault)] px-20 pt-12">
            <Button
              variant="primary"
              size="md"
              fullWidth
              type="submit"
              iconRight={<ArrowRight />}
            >
              Continue
            </Button>
          </div>
        </div>
      </form>
    </PurchaseFlowChrome>
  );
}
