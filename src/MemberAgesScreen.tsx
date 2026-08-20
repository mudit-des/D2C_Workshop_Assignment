import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Typography } from "@acko/typography";
import { Button } from "@acko/button";
import { Drawer } from "@acko/drawer";
import { ChevronDown, Tick } from "@acko/icons";
import { PurchaseFlowChrome } from "./PurchaseFlowChrome";
import {
  MEMBER_LABELS,
  PARENT_KEYS_VS_SELF,
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

function adultAgeOptions(
  minAge = ADULT_MIN_AGE,
  maxAge = ADULT_MAX_AGE,
) {
  const start = Math.max(ADULT_MIN_AGE, minAge);
  const end = Math.min(ADULT_MAX_AGE, maxAge);
  const options: { value: string; label: string }[] = [];
  for (let age = start; age <= end; age += 1) {
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

const CHILD_RANGE_YEARS: Record<
  Exclude<ChildAgeValue, "">,
  { min: number; max: number }
> = {
  "3-11-months": { min: 0, max: 1 },
  "1-18-years": { min: 1, max: 18 },
  "19-25-years": { min: 19, max: 25 },
};

/** Adults a child must not be older than */
const CHILD_VS_ADULT_KEYS: MemberKey[] = [
  "self",
  "spouse",
  "father",
  "mother",
];

export class AgeRelationshipError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AgeRelationshipError";
  }
}

function comparisonAdults(
  selection: CoveredSelection,
  members: MemberAges["members"],
): { key: MemberKey; age: number }[] {
  const result: { key: MemberKey; age: number }[] = [];
  for (const key of CHILD_VS_ADULT_KEYS) {
    if (!selection.members[key]) continue;
    const age = parseAge(members[key]);
    if (age != null) {
      result.push({ key, age });
    }
  }
  return result;
}

function collectAgeErrors(
  selection: CoveredSelection,
  ages: MemberAges,
): {
  adult: Partial<Record<MemberKey, string>>;
  children: Array<string | undefined>;
} {
  const adult: Partial<Record<MemberKey, string>> = {};
  const children: Array<string | undefined> = [];
  const selfAge = parseAge(ages.members.self);

  if (selfAge != null) {
    const olderThanParents: { key: MemberKey; age: number }[] = [];
    for (const key of PARENT_KEYS_VS_SELF) {
      if (!selection.members[key]) continue;
      const parentAge = parseAge(ages.members[key]);
      if (parentAge != null && selfAge > parentAge) {
        olderThanParents.push({ key, age: parentAge });
      }
    }
    if (olderThanParents.length > 0) {
      const youngestParent = olderThanParents.reduce((min, entry) =>
        entry.age < min.age ? entry : min,
      );
      adult.self =
        `Self cannot be older than ${MEMBER_LABELS[youngestParent.key]} (${youngestParent.age})`;
    }
  }

  const adults = comparisonAdults(selection, ages.members);
  ages.children.forEach((value, index) => {
    if (!value) return;
    const bounds = CHILD_RANGE_YEARS[value];
    const olderThan = adults.filter((entry) => bounds.max > entry.age);
    if (olderThan.length === 0) return;
    const youngest = olderThan.reduce((min, entry) =>
      entry.age < min.age ? entry : min,
    );
    const label =
      selection.childCount === 1 ? "Child" : `Child ${index + 1}`;
    children[index] =
      `${label} cannot be older than ${MEMBER_LABELS[youngest.key]} (${youngest.age})`;
  });

  return { adult, children };
}

function assertAgeRelationships(
  selection: CoveredSelection,
  ages: MemberAges,
): void {
  const errors = collectAgeErrors(selection, ages);
  const firstAdult = (Object.keys(errors.adult) as MemberKey[]).find(
    (key) => errors.adult[key],
  );
  const firstChild = errors.children.find((message) => Boolean(message));
  const message = firstAdult
    ? errors.adult[firstAdult]
    : firstChild;
  if (message) {
    throw new AgeRelationshipError(message);
  }
}

export type MemberAges = {
  members: Partial<Record<MemberKey, string>>;
  children: ChildAgeValue[];
};

type AgeRow =
  | { kind: "adult"; key: MemberKey; label: string }
  | { kind: "child"; index: number; label: string };

type SheetState =
  | { type: "adult"; key: MemberKey; minAge: number; maxAge: number }
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

  rows.push({ kind: "adult", key: "self", label: MEMBER_LABELS.self });

  if (selection.members.spouse) {
    rows.push({ kind: "adult", key: "spouse", label: MEMBER_LABELS.spouse });
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

function maxSelfAgeYears(
  selection: CoveredSelection,
  members: MemberAges["members"],
): number {
  let maxAge = ADULT_MAX_AGE;
  for (const key of PARENT_KEYS_VS_SELF) {
    if (!selection.members[key]) continue;
    const parentAge = parseAge(members[key]);
    if (parentAge != null) {
      maxAge = Math.min(maxAge, parentAge);
    }
  }
  return maxAge;
}
function maxAllowedChildYears(
  selection: CoveredSelection,
  members: MemberAges["members"],
): number | null {
  const adults = comparisonAdults(selection, members);
  if (adults.length === 0) return null;
  return Math.min(...adults.map((entry) => entry.age));
}

function isChildRangeAllowed(
  value: Exclude<ChildAgeValue, "">,
  maxAgeYears: number | null,
): boolean {
  if (maxAgeYears == null) return true;
  return CHILD_RANGE_YEARS[value].max <= maxAgeYears;
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
          <Typography scale="base" color="primary" as="span">
            {display}
          </Typography>
        ) : (
          <Typography scale="base" color="secondary" as="span">
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
  maxAge,
  onClose,
  onSelect,
}: {
  open: boolean;
  value: string;
  minAge: number;
  maxAge: number;
  onClose: () => void;
  onSelect: (next: string) => void;
}) {
  const options = useMemo(
    () => adultAgeOptions(minAge, maxAge),
    [minAge, maxAge],
  );
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
      <Typography scale="lg" emphasis="bold" as="h2" className="members-age-sheet-title">
        Enter age
      </Typography>
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
                scale="base"
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
  maxAgeYears,
  onClose,
  onSelect,
}: {
  open: boolean;
  value: ChildAgeValue;
  maxAgeYears: number | null;
  onClose: () => void;
  onSelect: (next: ChildAgeValue) => void;
}) {
  const { drawerOpen, className } = useAgeSheetMotion(open, onClose);
  const options = CHILD_AGE_RANGES.filter((option) =>
    isChildRangeAllowed(option.value, maxAgeYears),
  );

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
      <Typography scale="lg" emphasis="bold" as="h2" className="members-age-sheet-title">
        Select age range
      </Typography>
      <Typography
        scale="sm"
        color="secondary"
        className="members-age-sheet-desc"
      >
        We cover children aged 3 months and above
      </Typography>
      <div
        className="flex w-full flex-col"
        role="listbox"
        aria-label="Child age range"
      >
        {options.length === 0 ? (
          <Typography scale="sm" color="error" className="px-20 py-16">
            No valid child age range. A child cannot be older than Self, Spouse,
            Father, or Mother.
          </Typography>
        ) : null}
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
                scale="sm"
                emphasis="medium"
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
  const members: Partial<Record<MemberKey, string>> = {
    self: initial?.members.self ?? "",
  };
  (Object.keys(selection.members) as MemberKey[]).forEach((key) => {
    if (key !== "self" && selection.members[key]) {
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
  const covered = useMemo(
    () => ({ ...selection, members: { ...selection.members, self: true } }),
    [selection],
  );
  const rows = useMemo(() => buildAgeRows(covered), [covered]);
  const [ages, setAges] = useState<MemberAges>(() =>
    emptyAges(covered, initialAges),
  );
  const [sheet, setSheet] = useState<SheetState>(null);

  const selfAge = parseAge(ages.members.self);
  const relationshipErrors = useMemo(
    () => collectAgeErrors(covered, ages),
    [covered, ages],
  );
  const childMaxYears = useMemo(
    () => maxAllowedChildYears(covered, ages.members),
    [covered, ages.members],
  );

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

  const hasRelationshipError =
    Object.keys(relationshipErrors.adult).length > 0 ||
    relationshipErrors.children.some(Boolean);
  const canSubmit = allFilled && !hasRelationshipError;

  const setAdultAge = (key: MemberKey, next: string) => {
    setAges((prev) => ({
      ...prev,
      members: { ...prev.members, [key]: next },
    }));
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
    assertAgeRelationships(covered, ages);
    onContinue?.(ages);
  };

  return (
    <PurchaseFlowChrome progress={75} onBack={onBack}>
      <form className="relative z-10 flex flex-1 flex-col" onSubmit={handleSubmit}>
        <main className="section-container flex flex-1 flex-col gap-48 pb-24 pt-32">
          <Typography scale="2xl" emphasis="bold" as="h1">
            How old is everyone?
          </Typography>

          {rows.length === 0 ? (
            <Typography scale="sm" color="secondary">
              No members selected. Go back and choose who to cover.
            </Typography>
          ) : (
            <div className="flex w-full flex-col gap-16">
              {rows.map((row) => {
                const isSelf = row.kind === "adult" && row.key === "self";
                const isParentVsSelf =
                  row.kind === "adult" &&
                  PARENT_KEYS_VS_SELF.includes(row.key);
                const minAge =
                  isParentVsSelf && selfAge != null ? selfAge : ADULT_MIN_AGE;
                const maxAge = isSelf
                  ? maxSelfAgeYears(covered, ages.members)
                  : ADULT_MAX_AGE;
                const error =
                  row.kind === "adult"
                    ? relationshipErrors.adult[row.key]
                    : relationshipErrors.children[row.index];

                if (row.kind === "adult") {
                  return (
                    <div
                      key={`adult-${row.key}`}
                      className="flex w-full flex-col gap-8"
                    >
                      <div className="flex w-full items-center justify-between gap-12">
                        <Typography
                          scale="sm"
                          emphasis="medium"
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
                              maxAge,
                            })
                          }
                        />
                      </div>
                      {error ? (
                        <Typography scale="xs" color="error">
                          {error}
                        </Typography>
                      ) : null}
                    </div>
                  );
                }

                return (
                  <div
                    key={`child-${row.index}`}
                    className="flex w-full flex-col gap-8"
                  >
                    <div className="flex w-full items-center justify-between gap-12">
                      <Typography
                        scale="sm"
                        emphasis="medium"
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
                        invalid={Boolean(error)}
                        onClick={() =>
                          setSheet({ type: "child", index: row.index })
                        }
                      />
                    </div>
                    {error ? (
                      <Typography scale="xs" color="error">
                        {error}
                      </Typography>
                    ) : null}
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
        maxAge={sheet?.type === "adult" ? sheet.maxAge : ADULT_MAX_AGE}
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
        maxAgeYears={childMaxYears}
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
