import toast from "react-hot-toast";
import { ensureStepUp, isStepUpCancelled } from "services/stepUp.service";

/**
 * Run an export behind the step-up gate.
 *
 * Verification happens BEFORE `collectAndExport` runs, never after: asking for
 * a code at the end of a 40-second collection is a poor trade. Call sites do
 * their own selection check first, so a doomed export never prompts for a
 * code it cannot use.
 *
 * Cancelling is a deliberate choice, not a failure -- an "Export failed" toast
 * after someone backed out is noise and reads as a bug, so cancellation is
 * silent. Cancellation is recognised by a FLAG on the error, not by matching
 * its message.
 */
export const runGuardedExport = async (collectAndExport) => {
  try {
    await ensureStepUp();
  } catch (error) {
    if (!isStepUpCancelled(error)) {
      toast.error(
        error?.message || "Could not verify your identity. Please try again.",
      );
    }
    return;
  }

  await collectAndExport();
};
