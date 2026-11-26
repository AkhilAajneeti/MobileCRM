import React, { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Capacitor } from "@capacitor/core";
import Icon from "./AppIcon";
import OtpCodeForm from "./otp/OtpCodeForm";
import {
  StepUpCancelledError,
  registerStepUpOpener,
  sendStepUpCode,
  verifyStepUpCode,
} from "../services/stepUp.service";

/**
 * StepUpDialog -- the single step-up prompt.
 *
 * Mounted ONCE, at app root, OUTSIDE the router. A dialog inside a route
 * unmounts on navigation and leaves the awaiting promise pending forever, so
 * the export that triggered it would hang with no way back.
 *
 * It registers an opener with the service layer: a service module cannot
 * render a dialog, and the dialog cannot live at each call site because
 * several call sites share it.
 */

const BRAND = "#AC2334";
const STEP_UP_TTL_MS = 5 * 60 * 1000;

/** Used only when the gateway sent no `message`. */
const fallbackMessage = (challenge) => {
  const channels = (challenge?.channels || []).map((channel) =>
    String(channel).toLowerCase(),
  );
  const mobileOnly =
    channels.includes("whatsapp") &&
    !channels.includes("email") &&
    challenge?.mobileMasked;

  if (mobileOnly) {
    return `We sent a 6-digit code on WhatsApp to ${challenge.mobileMasked}.`;
  }
  return "We sent a 6-digit verification code to your registered contact details.";
};

const StepUpDialog = () => {
  const [request, setRequest] = useState(null);
  const [challenge, setChallenge] = useState(null);

  // Blocks Escape / hardware back mid-verify: that request is about to swap
  // the session token, and dropping the dialog then would leave the caller
  // awaiting a promise that was already rejected.
  const verifyInFlight = useRef(false);

  useEffect(
    () =>
      registerStepUpOpener(({ challenge: initial, resolve, reject }) => {
        setChallenge(initial);
        setRequest({ resolve, reject });
      }),
    [],
  );

  const close = useCallback(() => {
    setRequest(null);
    setChallenge(null);
    verifyInFlight.current = false;
  }, []);

  const cancel = useCallback(() => {
    if (verifyInFlight.current) return;
    const pending = request;
    close();
    pending?.reject?.(new StepUpCancelledError());
  }, [request, close]);

  const handleSubmit = useCallback(
    async (code) => {
      verifyInFlight.current = true;
      try {
        // Swaps in the re-issued token and records the elevation.
        await verifyStepUpCode({
          otp: code,
          challengeToken: challenge?.challengeToken,
        });
        const pending = request;
        close();
        pending?.resolve?.();
      } catch (failure) {
        verifyInFlight.current = false;
        // Re-thrown so the shared form can apply the box/input directives.
        throw failure;
      }
    },
    [challenge, request, close],
  );

  /**
   * There is no resend endpoint for step-up: this issues a NEW code, and the
   * new challengeToken MUST replace the old one. Issuing a code kills the
   * previous challenge, so reusing the old token would guarantee
   * `invalid_challenge` on the next verify.
   */
  const handleResend = useCallback(async () => {
    const fresh = await sendStepUpCode();
    if (fresh) setChallenge(fresh);
  }, []);

  /* Escape cancels. */
  useEffect(() => {
    if (!request) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") cancel();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [request, cancel]);

  /* Hardware back maps to Cancel -- not to a route pop that would leave the
     dialog mounted over whatever page the user landed on. */
  useEffect(() => {
    if (!request || !Capacitor.isNativePlatform()) return;

    let remove = null;
    let cancelled = false;

    import("@capacitor/app")
      .then(({ App }) =>
        App.addListener("backButton", () => {
          cancel();
        }),
      )
      .then((handle) => {
        if (cancelled) handle.remove();
        else remove = handle;
      })
      .catch(() => {
        /* plugin unavailable -- Cancel is still reachable on screen */
      });

    return () => {
      cancelled = true;
      remove?.remove?.();
    };
  }, [request, cancel]);

  return (
    <AnimatePresence>
      {request && (
        <motion.div
          key="step-up-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          // Every other dialog in the app closes on a backdrop tap. This one is
          // answering "is this really you?", and a stray tap beside the card
          // must not be the answer -- so there is deliberately no onClick here.
          className="fixed inset-0 flex items-center justify-center overflow-y-auto p-4"
          style={{
            zIndex: 80,
            background: "rgba(0, 0, 0, 0.45)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="step-up-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            // `my-auto` + the scrollable overlay keeps the submit button
            // reachable when the number pad is open on a small device.
            className="my-auto w-full border border-border bg-card p-[20px] sm:p-[24px]"
            style={{
              maxWidth: "448px",
              borderRadius: "16px",
              boxShadow: "0 24px 60px -12px rgba(0, 0, 0, 0.45)",
            }}
          >
            {/* Header */}
            <div className="flex items-start" style={{ gap: "14px" }}>
              <div
                className="flex shrink-0 items-center justify-center"
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "12px",
                  background: "rgba(172, 35, 52, 0.1)",
                }}
              >
                <Icon name="ShieldCheck" size={20} style={{ color: BRAND }} />
              </div>
              <div className="min-w-0">
                <h2
                  id="step-up-title"
                  className="font-semibold text-foreground"
                  style={{ fontSize: "17px" }}
                >
                  Confirm it is you
                </h2>
                <p
                  className="text-muted-foreground"
                  style={{ fontSize: "13px", marginTop: "4px" }}
                >
                  This action needs a fresh verification code.
                </p>
              </div>
            </div>

            {/* The server's own message, verbatim where it sent one. */}
            <p
              className="break-words text-muted-foreground"
              style={{ fontSize: "13px", marginTop: "16px" }}
            >
              {challenge?.message || fallbackMessage(challenge)}
            </p>

            <div style={{ marginTop: "16px" }}>
              <OtpCodeForm
                challenge={challenge}
                ttlMs={STEP_UP_TTL_MS}
                renderHeader={false}
                submitLabel="Verify"
                resendLabel="Send a new code"
                backLabel="Cancel"
                onSubmit={handleSubmit}
                onResend={handleResend}
                onBack={cancel}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default StepUpDialog;
