import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import BrandPanel from "./components/BrandPanel";
import LoginHeader from "./components/LoginHeader";
import LoginForm from "./components/LoginForm";

/**
 * Sign-in screen.
 *
 * Mobile is the primary target: the brand panel shrinks to a compact card so
 * the username field stays above the fold, and the footer stacks instead of
 * letting the copyright collide with the "powered by" mark.
 *
 * From `lg` it becomes the two-column split — brand panel left, form right.
 */
const LoginPage = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is already authenticated
    const isAuthenticated = localStorage.getItem("auth_token");
    if (isAuthenticated === "true") {
      navigate("/dashboard");
    }
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Sign In - CRM</title>
        <meta
          name="description"
          content="Sign in to your Aajneeti Crm account to access your sales pipeline, customer data, and CRM tools."
        />
      </Helmet>

      <div className="min-h-dvh bg-background lg:grid lg:min-h-screen lg:grid-cols-[1.15fr_minmax(440px,0.85fr)]">
        {/* ---------------- Brand panel ---------------- */}
        {/* Phone: a rounded card that sits above the form.
            Desktop: the full-bleed left column. */}
        <div className="px-4 pt-safe-gap lg:px-0 lg:pt-0">
          <div className="overflow-hidden rounded-3xl lg:h-full lg:rounded-none">
            <BrandPanel />
          </div>
        </div>

        {/* ---------------- Form panel ---------------- */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.2, 0.8, 0.2, 1] }}
          // Bottom padding is at least 2rem, growing to clear the home bar.
          // `max()` rather than a plain `pb-safe`, which would otherwise
          // shrink the gap to 1rem on devices with no inset.
          className="flex flex-col px-5 pt-8 pb-[max(2rem,env(safe-area-inset-bottom))] sm:px-8 lg:justify-center lg:px-12 lg:pt-12 xl:px-16"
        >
          <div className="mx-auto w-full max-w-md lg:mx-0">
            <LoginHeader />
            <LoginForm />
          </div>

          {/* Footer — stacked on mobile so nothing overlaps, split on desktop */}
          <div className="mx-auto mt-10 w-full max-w-md lg:mx-0 lg:mt-16">
            <div className="border-t border-border pt-6">
              <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-center text-xs text-muted-foreground sm:text-left">
                  © {new Date().getFullYear()} AAJneeti Connect Limited. All
                  rights reserved.
                </p>

                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/50">
                    Powered by
                  </span>
                  <img
                    src="/assets/images/aajneeti-favicon.png"
                    alt="AAJneeti"
                    className="h-5 w-auto object-contain opacity-70"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default LoginPage;
