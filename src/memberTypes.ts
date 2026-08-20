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

/** Parents Self cannot be older than */
export const PARENT_KEYS_VS_SELF: MemberKey[] = ["father", "mother"];

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

export class SelfRequiredError extends Error {
  constructor() {
    super("A policy cannot be issued without covering Self");
    this.name = "SelfRequiredError";
  }
}

/** Self is always covered — there is no policy without the proposer. */
export function withRequiredSelf(
  selection: CoveredSelection,
): CoveredSelection {
  if (!selection.members.self) {
    throw new SelfRequiredError();
  }
  return {
    ...selection,
    members: { ...selection.members, self: true },
  };
}
