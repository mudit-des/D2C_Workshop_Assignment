export type MemberKey =
  | "self"
  | "spouse"
  | "father"
  | "mother"
  | "fatherInLaw"
  | "motherInLaw";

export type CoveredSelection = {
  members: Record<MemberKey, boolean>;
  childCount: number;
};

export const MEMBER_LABELS: Record<MemberKey, string> = {
  self: "Self",
  spouse: "Spouse",
  father: "Father",
  mother: "Mother",
  fatherInLaw: "Father-in-law",
  motherInLaw: "Mother-in-law",
};

/** Elders that must be at least as old as Self */
export const ELDER_KEYS_VS_SELF: MemberKey[] = ["father", "mother"];

export const DEFAULT_COVERED_SELECTION: CoveredSelection = {
  members: {
    self: true,
    spouse: true,
    father: true,
    mother: false,
    fatherInLaw: false,
    motherInLaw: false,
  },
  childCount: 0,
};
