import React, { useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Icon from "../../../components/AppIcon";
import { CATEGORIES, searchArticles } from "../content";
import { BRAND, BRAND_SOFT, brandBg } from "../theme";

const HelpSidebar = () => {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const results = useMemo(() => searchArticles(query), [query]);
  const showResults = query.trim().length > 0;

  // Path parsing — works for /help, /help/:cat, /help/:cat/:article
  const segments = location.pathname
    .replace(/^\/help\/?/, "")
    .split("/")
    .filter(Boolean);
  const activeCategoryId = segments[0] || null;

  return (
    <aside className="w-full lg:w-72 lg:shrink-0">
      <div className="lg:sticky lg:top-20 space-y-4">
        {/* Search */}
        <div className="relative">
          <Icon
            name="Search"
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="Search help articles…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border bg-card text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none transition"
            style={{
              borderColor: focused ? BRAND : undefined,
              boxShadow: focused ? `0 0 0 3px ${BRAND}1a` : undefined,
            }}
          />
        </div>

        {/* Search results overlay */}
        {showResults ? (
          <div className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border">
              {results.length} result{results.length === 1 ? "" : "s"}
            </div>
            {results.length === 0 ? (
              <div className="px-3 py-6 text-sm text-slate-500 text-center">
                Nothing matched "{query}"
              </div>
            ) : (
              <ul className="max-h-[420px] overflow-y-auto">
                {results.map((a) => (
                  <li key={`${a.categoryId}-${a.id}`}>
                    <button
                      type="button"
                      onClick={() => {
                        setQuery("");
                        navigate(`/help/${a.categoryId}/${a.id}`);
                      }}
                      className="w-full text-left px-3 py-2.5 transition-colors border-b border-border/60 last:border-0"
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.background = BRAND_SOFT)
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = "")
                      }
                    >
                      <div className="text-sm font-medium text-slate-900 truncate">
                        {a.title}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        {a.categoryName}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        ) : (
          <>
            {/* Categories */}
            <nav className="rounded-xl border border-border bg-card overflow-hidden">
              <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-border">
                Categories
              </div>
              <ul>
                {CATEGORIES.map((c) => {
                  const isActive = activeCategoryId === c.id;
                  return (
                    <li key={c.id}>
                      <Link
                        to={`/help/${c.id}`}
                        className={`relative flex items-center gap-3 px-3 py-2.5 text-sm transition-colors border-b border-border/60 last:border-0 ${
                          isActive
                            ? "font-semibold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                        style={
                          isActive
                            ? { background: BRAND_SOFT, color: BRAND }
                            : undefined
                        }
                      >
                        {isActive && (
                          <span
                            className="absolute left-0 top-0 bottom-0 w-1"
                            style={brandBg}
                          />
                        )}
                        <Icon
                          name={c.icon}
                          size={16}
                          style={{ color: isActive ? BRAND : "#94A3B8" }}
                        />
                        <span className="truncate">{c.name}</span>
                        <span className="ml-auto text-[10px] text-slate-400 tabular-nums">
                          {c.articles.length}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Home link */}
            <Link
              to="/help"
              className="flex items-center gap-2 text-xs font-medium text-slate-500 transition-colors px-1"
              onMouseEnter={(e) => (e.currentTarget.style.color = BRAND)}
              onMouseLeave={(e) => (e.currentTarget.style.color = "")}
            >
              <Icon name="ArrowLeft" size={14} />
              Help home
            </Link>
          </>
        )}
      </div>
    </aside>
  );
};

export default HelpSidebar;
