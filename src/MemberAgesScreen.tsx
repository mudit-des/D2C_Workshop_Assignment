import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Typography } from "@acko/typography";
import { Button } from "@acko/button";
import { Drawer } from "@acko/drawer";
import { ChevronDown, Tick } from "@acko/icons";
import { PurchaseFlowChrome } from "./PurchaseFlowChrome";
import {
  ELDER_KEYS_VS_SELF,
  MEMBER_LABELS,
  type CoveredSelection,
  type MemberKey,
} from "./memberTypes";

/**
 * How old is everyone? + age bottom sheets
 * Adult sheet title: "Enter age"
 * Child sheet: "Select age range" + coverage copy (Figma)
 * No header divider / close icon — titles live in the sheet body.
 *
 * Drawer always mounts a header (with divider + X) when dismissible is true,
 * so age sheets use dismissible={false} and restore backdrop/Escape here.
 *
 * Motion: acko-motion-system `motion.surface.open` / `motion.surface.close`.
 * Package Drawer unmounts immediately on close, so presence is held for the exit.
 */
const MOTION_SURFACE_CLOSE_MS = 400;
const MOTION_REDUCED_MS = 160;

function surfaceCloseMs() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? MOTION_REDUCED_MS
    : MOTION_SURFACE_CLOSE_MS;
}

function useAgeSheetMotion(open: boolean, onClose: () => void) {
  const [mounted, setMounted] = useState(open);
  const [entered, setEntered] = useState(false);
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      setMounted(true);
      setClosing(false);
      return undefined;
    }
    if (!mounted) {
      return undefined;
    }
    setClosing(true);
    setEntered(false);
    const id = window.setTimeout(() => {
      setMounted(false);
      setClosing(false);
    }, surfaceCloseMs());
    return () => window.clearTimeout(id);
  }, [open, mounted]);

  useEffect(() => {
    if (!open || !mounted || closing) {
      return undefined;
    }
    const id = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => setEntered(true));
    });
    return () => window.cancelAnimationFrame(id);
  }, [open, mounted, closing]);

  useEffect(() => {
    if (!open || closing) {
      return undefined;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.stopPropagation();
        onClose();
      }
    };

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.classList.contains("acko-drawer-backdrop")
      ) {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, closing, onClose]);

  const className = [
    "members-age-sheet",
    entered ? "members-age-sheet-entered" : "",
    closing ? "members-age-sheet-closing" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return { drawerOpen: mounted, className };
}

const ADULT_MIN_AGE = 18;
const ADULT_MAX_AGE = 100;

function adultAgeOptions(minAge = ADULT_MIN_AGE) {
  const start = Math.max(ADULT_MIN_AGE, minAge);
  const options: { value: string; label: string }[] = [];
  for (let age = start; age <= ADULT_MAX_AGE; age += 1) {
    options.push({ value: String(age), label: String(age) });
  }
  return options;
}

const CHILD_AGE_RANGES = [
  { value: "3-11-months", label: "3-11 months" },
  { value: "1-18-years", label: "1-18 years" },
  { value: "19-25-years", label: "19-25 years" },
] as const;

type ChildAgeValue = (typeof CHILD_AGE_RANGES)[number]["value"] | "";

export type MemberAges = {
  members: Partial<Record<MemberKey, string>>;
  children: ChildAgeValue[];
};

type AgeRow =
  | { kind: "adult"; key: MemberKey; label: string }
  | { kind: "child"; index: number; label: string };

type SheetState =
  | { type: "adult"; key: MemberKey; minAge: number }
  | { type: "child"; index: number }
  | null;

function buildAgeRows(selection: CoveredSelection): AgeRow[] {
  const rows: AgeRow[] = [];
  const order: MemberKey[] = [
    "self",
    "spouse",
    "father",
    "mother",
    "fatherInLaw",
    "motherInLaw",
  ];

  for (const key of ["self", "spouse"] as MemberKey[]) {
    if (selection.members[key]) {
      rows.push({ kind: "adult", key, label: MEMBER_LABELS[key] });
    }
  }

  for (let i = 0; i < selection.childCount; i += 1) {
    rows.push({
      kind: "child",
      index: i,
      label: selection.childCount === 1 ? "Child" : `Child ${i + 1}`,
    });
  }

  for (const key of order) {
    if (key === "self" || key === "spouse") continue;
    if (selection.members[key]) {
      rows.push({ kind: "adult", key, label: MEMBER_LABELS[key] });
    }
  }

  return rows;
}

function childAgeLabel(value: ChildAgeValue): string {
  return CHILD_AGE_RANGES.find((r) => r.value === value)?.label ?? "";
}

function parseAge(value: string | undefined): number | null {
  if (!value) return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

function AgeFieldTrigger({
  display,
  placeholder,
  expanded,
  onClick,
  invalid,
}: {
  display: string;
  placeholder: string;
  expanded: boolean;
  onClick: () => void;
  invalid?: boolean;
}) {
  return (
    <button
      type="button"
      className="members-age-trigger flex h-48 w-[160px] shrink-0 items-center justify-between gap-8 rounded-full border bg-[var(--surfaceFillHighlight)] px-16 text-left"
      style={{
        borderColor: invalid
          ? "var(--borderError)"
          : "var(--borderSubtle)",
      }}
      aria-haspopup="dialog"
      aria-expanded={expanded}
      onClick={onClick}
    >
      <span className="min-w-0 flex-1">
        {display ? (
          <Typography variant="body-md" color="primary" as="span">
            {display}
          </Typography>
        ) : (
          <Typography variant="body-md" color="secondary" as="span">
            {placeholder}
          </Typography>
        )}
      </span>
      <span className="size-24 shrink-0" aria-hidden="true">
        <ChevronDown />
      </span>
    </button>
  );
}

/** Adult ages — title "Enter age", numeric list, no header chrome */
function EnterAgeDrawer({
  open,
  value,
  minAge,
  onClose,
  onSelect,
}: {
  open: boolean;
  value: string;
  minAge: number;
  onClose: () => void;
  onSelect: (next: string) => void;
}) {
  const options = useMemo(() => adultAgeOptions(minAge), [minAge]);
  const { drawerOpen, className } = useAgeSheetMotion(open, onClose);

  return (
    <Drawer
      open={drawerOpen}
      onClose={onClose}
      side="bottom"
      size="lg"
      dismissible={false}
      scrollable
      className={className}
      bodyClassName="members-age-sheet-body"
    >
      <p className="members-age-sheet-title">Enter age</p>
      <div className="flex w-full flex-col" role="listbox" aria-label="Enter age">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={selected}
              className="flex w-full items-center justify-between gap-12 bg-transparent px-20 py-16 text-left"
              onClick={() => {
                onSelect(option.value);
                onClose();
              }}
            >
              <Typography
                variant="body-md"
                color={selected ? "brand" : "primary"}
                className="min-w-0 flex-1"
              >
                {option.label}
              </Typography>
              {selected ? (
                <span
                  className="size-24 shrink-0 text-[var(--fillBrand)]"
                  aria-hidden="true"
                >
                  <Tick />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </Drawer>
  );
}

/** Child ages — Figma copy, no header chrome */
function SelectAgeRangeDrawer({
  open,
  value,
  onClose,
  onSelect,
}: {
  open: boolean;
  value: ChildAgeValue;
  onClose: () => void;
  onSelect: (next: ChildAgeValue) => void;
}) {
  const { drawerOpen, className } = useAgeSheetMotion(open, onClose);

  return (
    <Drawer
      open={drawerOpen}
      onClose={onClose}
      side="bottom"
      size="md"
      dismissible={false}
      scrollable={false}
      className={className}
      bodyClassName="members-age-sheet-body"
    >
      <p className="members-age-sheet-title">Select age range</p>
      <p className="members-age-sheet-desc">
        We cover children aged 3 months and above
      </p>
      <div
        className="flex w-full flex-col"
        role="listbox"
        aria-label="Child age range"
      >
        {CHILD_AGE_RANGES.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={selected}
              className="flex w-full items-center justify-between gap-12 bg-transparent px-20 py-16 text-left"
              onClick={() => {
                onSelect(option.value);
                onClose();
              }}
            >
              <Typography
                variant="label-lg"
                color={selected ? "brand" : "primary"}
                className="min-w-0 flex-1"
              >
                {option.label}
              </Typography>
              {selected ? (
                <span
                  className="size-24 shrink-0 text-[var(--fillBrand)]"
                  aria-hidden="true"
                >
                  <Tick />
                </span>
              ) : (
                <span className="size-24 shrink-0" aria-hidden="true" />
              )}
            </button>
          );
        })}
      </div>
    </Drawer>
  );
}

function emptyAges(selection: CoveredSelection, initial?: MemberAges): MemberAges {
  const members: Partial<Record<MemberKey, string>> = {};
  (Object.keys(selection.members) as MemberKey[]).forEach((key) => {
    if (selection.members[key]) {
      members[key] = initial?.members[key] ?? "";
    }
  });

  const children = Array.from({ length: selection.childCount }, (_, i) => {
    return initial?.children[i] ?? "";
  });

  return { members, children };
}

export default function MemberAgesScreen({
  selection,
  onBack,
  onContinue,
  initialAges,
}: {
  selection: CoveredSelection;
  onBack?: () => void;
  onContinue?: (ages: MemberAges) => void;
  initialAges?: MemberAges;
}) {
  const rows = useMemo(() => buildAgeRows(selection), [selection]);
  const [ages, setAges] = useState<MemberAges>(() =>
    emptyAges(selection, initialAges),
  );
  const [sheet, setSheet] = useState<SheetState>(null);

  const selfAge = parseAge(ages.members.self);

  const elderErrors = useMemo(() => {
    const errors: Partial<Record<MemberKey, string>> = {};
    if (selfAge == null) return errors;

    for (const key of ELDER_KEYS_VS_SELF) {
      if (!selection.members[key]) continue;
      const elderAge = parseAge(ages.members[key]);
      if (elderAge != null && elderAge < selfAge) {
        errors[key] =
          `${MEMBER_LABELS[key]} cannot be younger than Self (${selfAge})`;
      }
    }
    return errors;
  }, [ages.members, selection.members, selfAge]);

  const allFilled = useMemo(() => {
    for (const row of rows) {
      if (row.kind === "adult") {
        if (!ages.members[row.key]) return false;
      } else if (!ages.children[row.index]) {
        return false;
      }
    }
    return rows.length > 0;
  }, [ages, rows]);

  const canSubmit = allFilled && Object.keys(elderErrors).length === 0;

  const setAdultAge = (key: MemberKey, next: string) => {
    setAges((prev) => {
      const members = { ...prev.members, [key]: next };

      if (key === "self") {
        const newSelf = parseAge(next);
        if (newSelf != null) {
          for (const elderKey of ELDER_KEYS_VS_SELF) {
            const elder = parseAge(members[elderKey]);
            if (elder != null && elder < newSelf) {
              members[elderKey] = "";
            }
          }
        }
      }

      return { ...prev, members };
    });
  };

  const setChildAge = (index: number, value: ChildAgeValue) => {
    setAges((prev) => {
      const children = [...prev.children];
      children[index] = value;
      return { ...prev, children };
    });
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;
    onContinue?.(ages);
  };

  return (
    <PurchaseFlowChrome progress={75} onBack={onBack}>
      <form className="relative z-10 flex flex-1 flex-col" onSubmit={handleSubmit}>
        <main className="section-container flex flex-1 flex-col gap-48 pb-24 pt-32">
          <Typography variant="heading-xl" as="h1">
            How old is everyone?
          </Typography>

          {rows.length === 0 ? (
            <Typography variant="body-md" color="secondary">
              No members selected. Go back and choose who to cover.
            </Typography>
          ) : (
            <div className="flex w-full flex-col gap-16">
              {rows.map((row) => {
                const isElderVsSelf =
                  row.kind === "adult" &&
                  ELDER_KEYS_VS_SELF.includes(row.key) &&
                  selection.members.self;
                const minAge =
                  isElderVsSelf && selfAge != null ? selfAge : ADULT_MIN_AGE;
                const error =
                  row.kind === "adult" ? elderErrors[row.key] : undefined;

                if (row.kind === "adult") {
                  return (
                    <div
                      key={`adult-${row.key}`}
                      className="flex w-full flex-col gap-8"
                    >
                      <div className="flex w-full items-center justify-between gap-12">
                        <Typography
                          variant="label-lg"
                          color="primary"
                          className="min-w-0 shrink-0"
                        >
                          {row.label}
                        </Typography>
                        <AgeFieldTrigger
                          display={ages.members[row.key] ?? ""}
                          placeholder="Enter age"
                          expanded={
                            sheet?.type === "adult" && sheet.key === row.key
                          }
                          invalid={Boolean(error)}
                          onClick={() =>
                            setSheet({
                              type: "adult",
                              key: row.key,
                              minAge,
                            })
                          }
                        />
                      </div>
                      {error ? (
                        <Typography variant="caption" color="error">
                          {error}
                        </Typography>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <div
                    key={`child-${row.index}`}
                    className="flex w-full items-center justify-between gap-12"
                  >
                    <Typography
                      variant="label-lg"
                      color="primary"
                      className="min-w-0 shrink-0"
                    >
                      {row.label}
                    </Typography>
                    <AgeFieldTrigger
                      display={childAgeLabel(ages.children[row.index] ?? "")}
                      placeholder="Enter age"
                      expanded={
                        sheet?.type === "child" && sheet.index === row.index
                      }
                      onClick={() =>
                        setSheet({ type: "child", index: row.index })
                      }
                    />
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <div className="sticky bottom-0 z-[var(--zSticky)] w-full">
          <div className="bottom-cta w-full bg-[var(--cardFillDefault)] px-20 pt-12">
            <Button
              variant="primary"
              size="md"
              fullWidth
              type="submit"
              disabled={!canSubmit}
            >
              Continue
            </Button>
          </div>
        </div>
      </form>

      <EnterAgeDrawer
        open={sheet?.type === "adult"}
        value={
          sheet?.type === "adult" ? (ages.members[sheet.key] ?? "") : ""
        }
        minAge={sheet?.type === "adult" ? sheet.minAge : ADULT_MIN_AGE}
        onClose={() => setSheet(null)}
        onSelect={(next) => {
          if (sheet?.type === "adult") {
            setAdultAge(sheet.key, next);
          }
        }}
      />

      <SelectAgeRangeDrawer
        open={sheet?.type === "child"}
        value={
          sheet?.type === "child"
            ? (ages.children[sheet.index] ?? "")
            : ""
        }
        onClose={() => setSheet(null)}
        onSelect={(next) => {
          if (sheet?.type === "child") {
            setChildAge(sheet.index, next);
          }
        }}
      />
    </PurchaseFlowChrome>
  );
}
