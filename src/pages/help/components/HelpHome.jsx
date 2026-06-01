import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Icon from "../../../components/AppIcon";
import NeedHelp from "./NeedHelp";
import {
  BRAND,
  BRAND_SOFT,
  BRAND_SHADOW,
  brandBg,
  brandTextGradient,
} from "../theme";
import { CATEGORIES, POPULAR_GUIDES, getArticle } from "../content";

const HelpHome = () => {
  const popular = POPULAR_GUIDES.map((ref) => {
    const [cat, art] = ref.split(":");
    const a = getArticle(cat, art);
    return a ? { ...a, categoryId: cat } : null;
  }).filter(Boolean);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-4xl"
    >
      {/* Hero */}
      <header
        className="rounded-2xl border border-border px-6 py-8 mb-8"
        style={{
          background: `linear-gradient(135deg, ${BRAND_SOFT} 0%, #ffffff 80%)`,
        }}
      >
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          <span style={brandTextGradient}>Help Center</span>
        </h1>
        <p className="mt-2 text-slate-600 max-w-2xl">
          Simple, point-to-point guides for everyday CRM tasks. Browse by category
          on the left, search above, or jump into a popular guide below.
        </p>
      </header>

      {/* Popular guides */}
      <section className="mb-10">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Popular guides
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {popular.map((a) => (
            <Link
              key={`${a.categoryId}-${a.id}`}
              to={`/help/${a.categoryId}/${a.id}`}
              className="group flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-all hover:-translate-y-0.5"
              style={{
                transition: "transform .2s, box-shadow .2s, border-color .2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = BRAND;
                e.currentTarget.style.boxShadow = BRAND_SHADOW;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 text-white"
                style={brandBg}
              >
                <Icon name="Star" size={16} />
              </div>
              <div className="min-w-0">
                <div
                  className="text-sm font-semibold text-slate-900 line-clamp-1 transition-colors"
                  style={{ "--hov": BRAND }}
                >
                  {a.title}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                  {a.description}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* All categories */}
      <section>
        <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3">
          Browse by category
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {CATEGORIES.map((c) => (
            <Link
              key={c.id}
              to={`/help/${c.id}`}
              className="group rounded-xl border border-border bg-card p-4 transition-all hover:-translate-y-0.5"
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = BRAND;
                e.currentTarget.style.boxShadow = BRAND_SHADOW;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "";
                e.currentTarget.style.boxShadow = "";
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                  style={brandBg}
                >
                  <Icon name={c.icon} size={18} />
                </div>
                <h3 className="text-sm font-semibold text-slate-900">{c.name}</h3>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                {c.description}
              </p>
              <div
                className="mt-3 text-[11px] font-medium group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1"
                style={{ color: BRAND }}
              >
                {c.articles.length} guide{c.articles.length === 1 ? "" : "s"}
                <Icon name="ArrowRight" size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <NeedHelp />
    </motion.div>
  );
};

export default HelpHome;
