import { useState } from "react";
import MembersCoveredScreen from "./MembersCoveredScreen";
import MemberAgesScreen, { type MemberAges } from "./MemberAgesScreen";
import {
  DEFAULT_COVERED_SELECTION,
  type CoveredSelection,
} from "./memberTypes";

type Step = "members" | "ages";

/**
 * Buy-redesign flow
 * Members selection drives which age fields appear next.
 */
function App() {
  const [step, setStep] = useState<Step>("members");
  const [selection, setSelection] = useState<CoveredSelection>(
    DEFAULT_COVERED_SELECTION,
  );
  const [ages, setAges] = useState<MemberAges | null>(null);

  if (step === "ages") {
    return (
      <MemberAgesScreen
        selection={selection}
        initialAges={ages ?? undefined}
        onBack={() => setStep("members")}
        onContinue={(next) => setAges(next)}
      />
    );
  }

  return (
    <MembersCoveredScreen
      initialSelection={selection}
      onContinue={(next) => {
        setSelection(next);
        // Drop stale ages when the covered set changes
        setAges(null);
        setStep("ages");
      }}
    />
  );
}

export default App;
