import React from 'react';
import Icon from '../../../components/AppIcon';

/**
 * KPI card (spec 3.2).
 *
 * Everything derives from ONE accent hex: the icon tile is that accent at
 * 12%, the hover halo at 35% (exposed as `--kpi-glow`), the corner glow at
 * 22%. The halo is a CSS variable rather than a JS mouse handler, so it also
 * works under `active:` on touch, where mouseenter never fires.
 */
const withAlpha = (hex, alpha) => {
  if (!hex || typeof hex !== 'string' || !hex.startsWith('#')) return undefined;
  const value = hex.slice(1);
  const full =
    value.length === 3 ? value.split('').map((c) => c + c).join('') : value;
  const int = parseInt(full, 16);
  if (Number.isNaN(int)) return undefined;
  return `rgba(${(int >> 16) & 255}, ${(int >> 8) & 255}, ${int & 255}, ${alpha})`;
};

const KPICard = ({
  title,
  value,
  change,
  changeType,
  icon,
  accent = '#AC2334',
  comparisonLabel,
  featured = false,
  isLoading,
}) => {
  const tileBg = withAlpha(accent, 0.12);
  const glow = withAlpha(accent, 0.22);
  const halo = withAlpha(accent, 0.35);

  return (
    <div
      style={{ '--kpi-glow': halo }}
      className={`
        group relative h-full overflow-hidden rounded-2xl border
        border-[rgba(20,20,30,0.07)] bg-card p-4 sm:p-5
        shadow-kpi transition-all duration-300 ease-premium
        hover:-translate-y-1 hover:border-[rgba(20,20,30,0.12)]
        hover:shadow-[0_1px_2px_rgba(16,24,40,.04),0_20px_44px_-16px_var(--kpi-glow)]
        motion-reduce:transition-none motion-reduce:hover:translate-y-0
        ${isLoading ? 'kpi-shimmer kpi-glow' : ''}
      `}
    >
      {/* Corner glow */}
      {glow && !isLoading && (
        <div
          aria-hidden
          className={`pointer-events-none absolute -right-8 -top-8 rounded-full opacity-70 blur-2xl transition-opacity duration-300 group-hover:opacity-100 ${
            featured ? 'h-36 w-36' : 'h-28 w-28'
          }`}
          style={{ background: `radial-gradient(circle, ${glow}, transparent 70%)` }}
        />
      )}

      <div className="relative flex h-full items-center justify-between gap-3">
        <div className={`min-w-0 flex-1 ${isLoading ? 'opacity-50' : ''}`}>
          <p
            title={title}
            className="truncate text-[10.5px] font-semibold uppercase tracking-[0.07em] text-muted-foreground sm:text-[11px]"
          >
            {title || 'Loading...'}
          </p>

          <p
            className={`mt-2 font-bold leading-none tracking-tight tabular-nums text-card-foreground ${
              featured ? 'text-4xl sm:text-5xl' : 'text-3xl sm:text-4xl'
            }`}
          >
            {isLoading ? 0 : value}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1">
            <div
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                changeType === 'positive'
                  ? 'bg-success/10 text-success'
                  : changeType === 'negative'
                    ? 'bg-error/10 text-error'
                    : 'bg-muted text-muted-foreground'
              }`}
            >
              {!isLoading && changeType === 'positive' && (
                <Icon name="TrendingUp" size={12} />
              )}
              {!isLoading && changeType === 'negative' && (
                <Icon name="TrendingDown" size={12} />
              )}
              <span>{isLoading ? '--' : change}</span>
            </div>

            {comparisonLabel && (
              <span className="text-[11px] text-muted-foreground">
                vs {comparisonLabel}
              </span>
            )}
          </div>
        </div>

        {/* Icon tile — accent at 12% */}
        <div
          className={`grid shrink-0 place-items-center rounded-xl transition-transform duration-300 ease-premium group-hover:scale-105 ${
            featured ? 'h-12 w-12 md:h-14 md:w-14' : 'h-10 w-10 sm:h-11 sm:w-11'
          } ${isLoading ? 'bg-muted' : ''}`}
          style={!isLoading && tileBg ? { backgroundColor: tileBg } : undefined}
        >
          <Icon
            name={icon}
            size={featured ? 26 : 22}
            color={isLoading ? undefined : accent}
          />
        </div>
      </div>
    </div>
  );
};

export default KPICard;
