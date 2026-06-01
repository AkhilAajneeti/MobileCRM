import React from "react";
import { Link } from "react-router-dom";
import Icon from "../../../components/AppIcon";
import { ALL_ARTICLES } from "../content";
import { BRAND, BRAND_SOFT, BRAND_SHADOW } from "../theme";

/**
 * Resolves related-article ids to objects and renders compact cards.
 * Accepted id formats:
 *   "article-id"                 → searches within the current category
 *   "categoryId:article-id"      → cross-category link
 */
const resolveRelated = (ids = [], currentCategoryId) =>
  ids
    .map((raw) => {
      const [cat, art] = raw.includes(":")
        ? raw.split(":")
        : [currentCategoryId, raw];
      return ALL_ARTICLES.find((a) => a.categoryId === cat && a.id === art);
    })
    .filter(Boolean);

const RelatedGuides = ({ ids, currentCategoryId }) => {
  const list = resolveRelated(ids, currentCategoryId);
  if (list.length === 0) return null;

  return (
    <section className="mt-10 pt-8 border-t border-border">
      <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">
        Related guides
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {list.map((a) => (
          <Link
            key={`${a.categoryId}-${a.id}`}
            to={`/help/${a.categoryId}/${a.id}`}
            className="group flex items-start gap-3 rounded-xl border border-border bg-card px-4 py-3 transition-all"
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
              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: BRAND_SOFT, color: BRAND }}
            >
              <Icon name="BookOpen" size={16} />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-slate-900 transition-colors">
                {a.title}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                {a.description}
              </div>
            </div>
            <Icon
              name="ArrowUpRight"
              size={14}
              className="text-slate-300 transition-colors mt-1 shrink-0"
            />
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedGuides;
