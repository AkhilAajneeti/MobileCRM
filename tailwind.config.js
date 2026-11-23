/**
 * Build a colour that can carry an opacity modifier.
 * `<alpha-value>` is substituted by Tailwind: 1 for a plain utility,
 * 0.1 for `/10`, and so on.
 */
const withAlpha = (variable) => `rgb(var(${variable}) / <alpha-value>)`;

/** @type {import('tailwindcss').Config} */
export default {
  // Class strategy, not `media`: the theme is a USER choice persisted in
  // localStorage, not a read of the OS setting. A rep who prefers the light
  // UI on a phone that is in dark mode after sunset must keep the light UI.
  // "Follow system" is still offered -- it resolves to the same class.
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Colours resolve through the `*-rgb` channel variables so that opacity
      // modifiers (`bg-primary/10`, `bg-foreground/15`) actually compile.
      // Pointing these at an opaque `var(--color-x)` makes Tailwind emit
      // nothing for every `/opacity` variant -- silently, with no build error.
      colors: {
        border: withAlpha('--color-border-rgb'),
        input: withAlpha('--color-input-rgb'),
        ring: withAlpha('--color-ring-rgb'),
        background: withAlpha('--color-background-rgb'), // #FAF8F6 warm off-white
        foreground: withAlpha('--color-foreground-rgb'),
        sidebar: withAlpha('--color-sidebar-rgb'),
        mahroon: "#fee0df",
        primary: {
          DEFAULT: withAlpha('--color-primary-rgb'), // #AC2334 brand maroon
          foreground: withAlpha('--color-primary-foreground-rgb'),
        },
        secondary: {
          DEFAULT: withAlpha('--color-secondary-rgb'),
          foreground: withAlpha('--color-secondary-foreground-rgb'),
        },
        destructive: {
          DEFAULT: withAlpha('--color-destructive-rgb'),
          foreground: withAlpha('--color-destructive-foreground-rgb'),
        },
        muted: {
          DEFAULT: withAlpha('--color-muted-rgb'),
          foreground: withAlpha('--color-muted-foreground-rgb'),
        },
        accent: {
          DEFAULT: withAlpha('--color-accent-rgb'),
          foreground: withAlpha('--color-accent-foreground-rgb'),
        },
        popover: {
          DEFAULT: withAlpha('--color-popover-rgb'),
          foreground: withAlpha('--color-popover-foreground-rgb'),
        },
        card: {
          DEFAULT: withAlpha('--color-card-rgb'),
          foreground: withAlpha('--color-card-foreground-rgb'),
        },
        success: {
          DEFAULT: withAlpha('--color-success-rgb'),
          foreground: withAlpha('--color-success-foreground-rgb'),
        },
        warning: {
          DEFAULT: withAlpha('--color-warning-rgb'),
          foreground: withAlpha('--color-warning-foreground-rgb'),
        },
        error: {
          DEFAULT: withAlpha('--color-error-rgb'),
          foreground: withAlpha('--color-error-foreground-rgb'),
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        'xs': ['0.75rem', { lineHeight: '1rem' }],
        'sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'base': ['1rem', { lineHeight: '1.5rem' }],
        'lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'xl': ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      fontWeight: {
        normal: '400',
        medium: '500',
        semibold: '600',
        // Spec 1.2: no 700+ weight -- "bold" maps to 600.
        bold: '600',
      },
      borderRadius: {
        sm: '0.25rem',   // 4px  checkbox
        md: '0.375rem',  // 6px  buttons
        lg: '0.5rem',    // 8px  inputs, selects, nav tiles
        xl: '0.75rem',   // 12px nav rows, section cards
        '2xl': '1rem',   // 16px lead cards, KPI cards, sheet buttons
      },
      boxShadow: {
        'elevation-1': '0 1px 3px rgba(0, 0, 0, 0.1)',
        'elevation-2': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'card': '0 1px 2px rgba(16,24,40,0.04), 0 2px 6px rgba(16,24,40,0.05)',
        'list-card': '0 1px 2px rgba(16,24,40,0.04), 0 4px 16px rgba(16,24,40,0.06)',
        'kpi': '0 1px 2px rgba(16,24,40,0.04), 0 2px 8px rgba(16,24,40,0.05)',
        'sheet': '0 -8px 50px rgba(20,20,40,0.22)',
        'cta-glow': '0 8px 24px -8px var(--color-primary)',
        'nav-active': '0 6px 18px -8px rgba(172,35,52,0.75)',
        'nav-tile': '0 1px 2px rgba(16,24,40,0.07)',
      },
      transitionTimingFunction: {
        'premium': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-in': 'slideIn 300ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'pulse-ring': 'pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bell-swing': 'bellSwing 900ms ease-out 1',
        'bell-vibrate': 'bellVibrate 450ms ease-out 1',
        'sheet-up': 'sheetUp 320ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'bloom': 'bloom 450ms ease-out forwards',
        'screen-in': 'screenIn 300ms ease-out',
        // Theme toggle: the two night stars. Long and gentle -- a fast blink
        // on a header control reads as a rendering fault, not as sky.
        'twinkle': 'twinkle 2.6s ease-in-out infinite',
      },
      keyframes: {
        twinkle: {
          '0%, 100%': { opacity: '0.35', transform: 'scale(0.85)' },
          '50%': { opacity: '1', transform: 'scale(1.15)' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        // Active-status dot: scale 1 -> 2.6, opacity .55 -> 0
        pulseRing: {
          '0%': { transform: 'scale(1)', opacity: '0.55' },
          '100%': { transform: 'scale(2.6)', opacity: '0' },
        },
        // New notification: +/-18deg decaying swing
        bellSwing: {
          '0%': { transform: 'rotate(0deg)' },
          '15%': { transform: 'rotate(18deg)' },
          '30%': { transform: 'rotate(-14deg)' },
          '45%': { transform: 'rotate(10deg)' },
          '60%': { transform: 'rotate(-6deg)' },
          '75%': { transform: 'rotate(3deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        // Press feedback: +/-11deg decaying
        bellVibrate: {
          '0%': { transform: 'rotate(0deg)' },
          '20%': { transform: 'rotate(11deg)' },
          '40%': { transform: 'rotate(-8deg)' },
          '60%': { transform: 'rotate(5deg)' },
          '80%': { transform: 'rotate(-2deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
        sheetUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        bloom: {
          '0%': { opacity: '0', transform: 'scale(0.75)' },
          '100%': { opacity: '0.4', transform: 'scale(1)' },
        },
        screenIn: {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
      },
      zIndex: {
        '30': '30',
        '40': '40',
        '50': '50',
        '60': '60',
        '70': '70',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('tailwindcss-animate'),
  ],
}
