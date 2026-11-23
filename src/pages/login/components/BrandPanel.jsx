import React from "react";
import { motion, useReducedMotion } from "framer-motion";
import CountUp from "../../../components/ui/CountUp";

/**
 * The navy brand panel.
 *
 * On a phone it is a compact rounded card above the form — just logo,
 * eyebrow and a short headline, because anything more pushes the actual
 * sign-in fields below the fold. From `lg` it becomes the full-height left
 * column and earns the paragraph, the pipeline diagram and the stats row.
 */

const PIPELINE_STAGES = [
  { label: "Campaigns", detail: "META · GOOGLE" },
  { label: "Leads", detail: "CAPTURED LIVE" },
  { label: "Qualified", detail: "40–80% GUARANTEED" },
  { label: "Pipeline", detail: "ROUTED & CLOSED" },
];

const STATS = [
  { end: 10, suffix: "M+", label: "Leads delivered" },
  { range: [40, 80], suffix: "%", label: "Qualified, guaranteed" },
  { end: 2014, from: 1990, label: "Building pipelines since" },
];

// The line draws across after the copy has settled; each node lights up as
// the line reaches it, so the whole strip reads left to right.
const LINE_DELAY = 0.55;
const LINE_DURATION = 1.7;
const nodeDelay = (index) =>
  LINE_DELAY + (index / (PIPELINE_STAGES.length - 1)) * LINE_DURATION;

const Eyebrow = () => (
  <div className="flex items-center gap-3">
    <span className="h-px w-6 bg-primary lg:w-8" />
    <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#E8889A] lg:text-xs lg:tracking-[0.22em]">
      Performance Marketing × CRM
    </span>
  </div>
);

const BrandPanel = () => {
  const reduceMotion = useReducedMotion();

  return (
  <div className="relative isolate overflow-hidden bg-gradient-to-br from-[#0B1220] via-[#14203A] to-[#1D2A4C] text-white">
    {/* Grid pattern */}
    <div className="pointer-events-none absolute inset-0 opacity-[0.07] bg-[linear-gradient(#ffffff_1px,transparent_1px),linear-gradient(90deg,#ffffff_1px,transparent_1px)] bg-[size:48px_48px]" />

    {/* Brand glow — maroon, so the panel and the CTA share a family */}
    <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/25 blur-3xl" />
    <div className="pointer-events-none absolute -bottom-32 -left-20 h-80 w-80 rounded-full bg-[#1E3A8A]/30 blur-3xl" />

    <div className="relative flex h-full flex-col gap-6 p-6 lg:gap-10 lg:p-12 xl:p-16">
      {/* Logo */}
      <motion.img
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        src="/assets/images/aajneeti-logo.png"
        alt="AAJneeti"
        className="h-8 w-auto self-start object-contain lg:h-11"
      />

      {/* Headline */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, delay: 0.1 }}
        className="space-y-3 lg:space-y-6"
      >
        <Eyebrow />

        <h1 className="text-[26px] font-semibold leading-[1.15] tracking-tight lg:text-5xl xl:text-6xl">
          India's strongest
          <br className="hidden lg:block" />{" "}
          <span className="lg:hidden">sales pipeline, in one place.</span>
          <span className="hidden lg:inline">
            sales pipeline,
            <br />
            <em className="not-italic font-semibold text-[#F3C9D1] lg:italic">
              engineered end to end.
            </em>
          </span>
        </h1>

        {/* Desktop-only supporting copy */}
        <p className="hidden max-w-lg text-base leading-relaxed text-white/70 lg:block">
          A CRM is only as powerful as the engine feeding it.{" "}
          <span className="font-semibold text-white">
            AAJneeti Connect Limited
          </span>{" "}
          builds both — the campaigns that capture demand and the pipeline that
          converts it — as one continuous system.
        </p>
      </motion.div>

      {/* Pipeline diagram — desktop only */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-auto hidden lg:block"
      >
        <p className="mb-6 text-sm italic text-white/50">
          Performance marketing, wired straight into your CRM.
        </p>

        <div className="relative">
          {/* Track: a dim rail, with the brand-coloured line drawing over it */}
          <div className="absolute left-0 right-0 top-[5px] h-px overflow-hidden bg-white/10">
            <motion.div
              initial={reduceMotion ? false : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                duration: LINE_DURATION,
                delay: LINE_DELAY,
                ease: [0.2, 0.8, 0.2, 1],
              }}
              style={{ transformOrigin: "left center" }}
              className="h-full w-full bg-gradient-to-r from-primary/30 via-primary to-primary"
            />

            {/* A slow highlight travelling the line, so it stays alive
                rather than freezing once it has drawn. */}
            {!reduceMotion && (
              <motion.div
                initial={{ left: "-20%" }}
                animate={{ left: "110%" }}
                transition={{
                  duration: 3.2,
                  delay: LINE_DELAY + LINE_DURATION,
                  repeat: Infinity,
                  repeatDelay: 1.6,
                  ease: "easeInOut",
                }}
                className="absolute top-0 h-full w-[18%] bg-gradient-to-r from-transparent via-white/70 to-transparent"
              />
            )}
          </div>

          <div className="relative flex items-start justify-between">
            {PIPELINE_STAGES.map((stage, index) => {
              const isLast = index === PIPELINE_STAGES.length - 1;
              return (
                <motion.div
                  key={stage.label}
                  initial={reduceMotion ? false : { opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: nodeDelay(index) }}
                  className={`flex flex-col ${
                    index === 0
                      ? "items-start"
                      : isLast
                        ? "items-end"
                        : "items-center"
                  }`}
                >
                  <span className="relative block h-[11px] w-[11px]">
                    {/* The end of the pipeline keeps pulsing — it is the
                        state the whole strip is heading towards. */}
                    {isLast && !reduceMotion && (
                      <span className="absolute inset-0 rounded-full bg-primary motion-safe:animate-pulse-ring" />
                    )}
                    <span
                      className={`relative block h-full w-full rounded-full border-2 ${
                        isLast
                          ? "border-primary bg-primary shadow-[0_0_12px_2px_rgba(172,35,52,0.8)]"
                          : "border-white/50 bg-[#14203A]"
                      }`}
                    />
                  </span>

                  <span className="mt-4 text-sm font-semibold text-white">
                    {stage.label}
                  </span>
                  <span className="mt-1 text-[10px] font-medium uppercase tracking-[0.1em] text-white/45">
                    {stage.detail}
                  </span>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-12 grid grid-cols-3 gap-6 border-t border-white/10 pt-8">
          {STATS.map((stat, index) => {
            // Stats start counting as the line finishes its run.
            const delay = (LINE_DELAY + LINE_DURATION) * 1000 + index * 140;

            return (
              <div key={stat.label}>
                <p className="text-2xl font-semibold tabular-nums text-white xl:text-3xl">
                  {stat.range ? (
                    <>
                      <CountUp end={stat.range[0]} delay={delay} />–
                      <CountUp end={stat.range[1]} delay={delay} />
                    </>
                  ) : (
                    <CountUp end={stat.end} from={stat.from} delay={delay} />
                  )}
                  {stat.suffix}
                </p>
                <p className="mt-1 text-xs text-white/50">{stat.label}</p>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  </div>
  );
};

export default BrandPanel;
