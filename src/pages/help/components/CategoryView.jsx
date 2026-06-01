import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Icon from "../../../components/AppIcon";
import { BRAND, BRAND_SOFT, BRAND_SHADOW, brandBg } from "../theme";

const CategoryView = ({ category }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="max-w-3xl"
  >
    {/* Breadcrumb */}
    <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
      <Link
        to="/help"
        className="transition-colors hover:text-current"
        onMouseEnter={(e) => (e.currentTarget.style.color = BRAND)}
        onMouseLeave={(e) => (e.currentTarget.style.color = "")}
      >
        Help
      </Link>
      <Icon name="ChevronRight" size={12} />
      <span className="text-slate-700">{category.name}</span>
    </nav>

    {/* Header — soft crimson tint with a brand-gradient icon tile */}
    <header
      className="rounded-2xl border border-border px-6 py-6 mb-6 flex items-center gap-4"
      style={{
        background: `linear-gradient(135deg, ${BRAND_SOFT} 0%, #ffffff 80%)`,
      }}
    >
      <div
        className="w-12 h-12 rounded-xl shadow-sm flex items-center justify-center shrink-0 text-white"
        style={brandBg}
      >
        <Icon name={category.icon} size={22} />
      </div>
      <div className="min-w-0">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
          {category.name}
        </h1>
        <p className="text-sm text-slate-600 mt-0.5">{category.description}</p>
      </div>
    </header>

    {/* Article list */}
    <div className="space-y-2">
      <div className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold mb-1">
        {category.articles.length} guide
        {category.articles.length === 1 ? "" : "s"}
      </div>
      {category.articles.map((a) => (
        <Link
          key={a.id}
          to={`/help/${category.id}/${a.id}`}
          className="group flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-all"
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
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: BRAND_SOFT, color: BRAND }}
          >
            <Icon name="FileText" size={16} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-semibold text-slate-900">
              {a.title}
            </div>
            {a.description && (
              <div className="text-sm text-slate-500 mt-0.5 line-clamp-2">
                {a.description}
              </div>
            )}
          </div>
          <Icon
            name="ArrowUpRight"
            size={16}
            className="text-slate-300 mt-1.5 shrink-0 transition-colors group-hover:[color:var(--brand)]"
            style={{ "--brand": BRAND }}
          />
        </Link>
      ))}
    </div>
  </motion.div>
);

export default CategoryView;
