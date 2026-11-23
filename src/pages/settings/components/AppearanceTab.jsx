import React from "react";
import Icon from "../../../components/AppIcon";
import { useTheme } from "../../../ThemeContext";

/**
 * Appearance settings -- the three-way theme choice.
 *
 * The header toggle is deliberately binary: it flips to the opposite of
 * what is on screen, because a control that cycles through three states
 * sometimes changes nothing visible, which reads as broken. "Follow system"
 * therefore needs a home, and this is it.
 */
const OPTIONS = [
  {
    value: "light",
    label: "Light",
    icon: "Sun",
    hint: "The warm off-white theme, whatever the device is set to.",
  },
  {
    value: "dark",
    label: "Dark",
    icon: "Moon",
    hint: "Easier on the eyes at night and on a late site visit.",
  },
  {
    value: "system",
    label: "Follow system",
    icon: "SmartphoneCharging",
    hint: "Matches the phone's own light / dark setting, including its schedule.",
  },
];

const AppearanceTab = () => {
  const { theme, resolved, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">Appearance</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Applies to this device only -- the choice is stored on the phone, not
          on the account, so a shared login can be light on one handset and
          dark on another.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {OPTIONS.map((option) => {
          const isActive = theme === option.value;

          return (
            <button
              key={option.value}
              type="button"
              onClick={() => setTheme(option.value)}
              aria-pressed={isActive}
              className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all duration-200 active:scale-[0.98] ${
                isActive
                  ? "border-primary bg-primary/10 shadow-sm"
                  : "border-border bg-card hover:border-primary/40"
              }`}
            >
              <span
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                <Icon name={option.icon} size={18} />
              </span>

              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-foreground">
                    {option.label}
                  </span>
                  {isActive && (
                    <Icon name="Check" size={14} className="text-primary" />
                  )}
                </span>
                <span className="mt-1 block text-xs leading-relaxed text-muted-foreground">
                  {option.hint}
                </span>
                {/* Only on "Follow system": the other two say what they do in
                    their own label, but this one's effect depends on the
                    device, so it states what it has currently resolved to. */}
                {option.value === "system" && theme === "system" && (
                  <span className="mt-1.5 block text-[11px] font-medium text-primary">
                    Currently {resolved}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default AppearanceTab;
