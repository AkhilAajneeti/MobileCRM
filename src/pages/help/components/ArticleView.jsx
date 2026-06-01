import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import Icon from "../../../components/AppIcon";
import NoteCard from "./NoteCard";
import StepList from "./StepList";
import BulletList from "./BulletList";
import Accordion from "./Accordion";
import ScreenshotPlaceholder from "./ScreenshotPlaceholder";
import RelatedGuides from "./RelatedGuides";
import NeedHelp from "./NeedHelp";
import { getCategory } from "../content";
import { BRAND } from "../theme";

const renderSection = (section, idx) => {
  switch (section.type) {
    case "paragraph":
      return (
        <p key={idx} className="text-slate-700 leading-relaxed text-[15px]">
          {section.body}
        </p>
      );
    case "heading":
      return (
        <h3
          key={idx}
          className="text-base font-semibold text-slate-900 mt-2"
        >
          {section.text}
        </h3>
      );
    case "bullets":
      return <BulletList key={idx} items={section.items} />;
    case "steps":
      return <StepList key={idx} items={section.items} />;
    case "note":
      return (
        <NoteCard
          key={idx}
          variant={section.variant}
          title={section.title}
          body={section.body}
        />
      );
    case "screenshot":
      return (
        <ScreenshotPlaceholder
          key={idx}
          label={section.label}
          src={section.src}
          alt={section.alt}
        />
      );
    case "accordion":
      return <Accordion key={idx} items={section.items} />;
    default:
      return null;
  }
};

const ArticleView = ({ article, categoryId }) => {
  const category = getCategory(categoryId);

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-3xl"
    >
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500 mb-4">
        <Link
          to="/help"
          className="transition-colors"
          onMouseEnter={(e) => (e.currentTarget.style.color = BRAND)}
          onMouseLeave={(e) => (e.currentTarget.style.color = "")}
        >
          Help
        </Link>
        <Icon name="ChevronRight" size={12} />
        {category && (
          <>
            <Link
              to={`/help/${category.id}`}
              className="transition-colors"
              onMouseEnter={(e) => (e.currentTarget.style.color = BRAND)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "")}
            >
              {category.name}
            </Link>
            <Icon name="ChevronRight" size={12} />
          </>
        )}
        <span className="text-slate-700 truncate">{article.title}</span>
      </nav>

      {/* Title block */}
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
          {article.title}
        </h1>
        {article.description && (
          <p className="mt-2 text-[15px] text-slate-500 leading-relaxed">
            {article.description}
          </p>
        )}
        {article.lastUpdated && (
          <div className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-full">
            <Icon name="RefreshCw" size={12} />
            <span>
              Updated{" "}
              {(() => {
                try {
                  return new Date(article.lastUpdated).toLocaleDateString(
                    "en-IN",
                    { day: "2-digit", month: "short", year: "numeric" },
                  );
                } catch {
                  return article.lastUpdated;
                }
              })()}
            </span>
          </div>
        )}
      </header>

      {/* Body — rendered section by section */}
      <div className="space-y-5">
        {(article.sections || []).map(renderSection)}
      </div>

      {/* Related + Need help */}
      <RelatedGuides ids={article.related} currentCategoryId={categoryId} />
      <NeedHelp />
    </motion.article>
  );
};

export default ArticleView;
