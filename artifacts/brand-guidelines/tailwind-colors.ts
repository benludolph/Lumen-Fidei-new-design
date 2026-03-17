/**
 * Lumen Fidei — Tailwind Color Config
 * Direction A: Radiance
 *
 * Drop this into tailwind.config.ts → theme.extend.colors
 * (or theme.colors to replace entirely).
 *
 * Pairs with the CSS custom properties in tokens.css.
 * Uses the hsl(var(--token)) convention consistent with the
 * existing shadcn-ui Tailwind setup.
 */

export const lumenfideiColors = {
  /* ── Semantic tokens (shadcn-compatible) ─────────────────── */
  background:   "hsl(var(--background))",
  foreground:   "hsl(var(--foreground))",

  card: {
    DEFAULT:    "hsl(var(--card))",
    foreground: "hsl(var(--card-foreground))",
  },
  popover: {
    DEFAULT:    "hsl(var(--popover))",
    foreground: "hsl(var(--popover-foreground))",
  },
  primary: {
    DEFAULT:    "hsl(var(--primary))",
    foreground: "hsl(var(--primary-foreground))",
  },
  secondary: {
    DEFAULT:    "hsl(var(--secondary))",
    foreground: "hsl(var(--secondary-foreground))",
  },
  accent: {
    DEFAULT:    "hsl(var(--accent))",
    foreground: "hsl(var(--accent-foreground))",
  },
  muted: {
    DEFAULT:    "hsl(var(--muted))",
    foreground: "hsl(var(--muted-foreground))",
  },
  destructive: {
    DEFAULT:    "hsl(var(--destructive))",
    foreground: "hsl(var(--destructive-foreground))",
  },

  border: "hsl(var(--border))",
  input:  "hsl(var(--input))",
  ring:   "hsl(var(--ring))",

  /* ── Orange (primary) scale ──────────────────────────────── */
  orange: {
    "50":  "hsl(var(--orange-50))",   /* #FFF7F0 */
    "100": "hsl(var(--orange-100))",  /* #FFE9D6 */
    "200": "hsl(var(--orange-200))",  /* #FFD0A8 */
    "300": "hsl(var(--orange-300))",  /* #FCA974 */
    "400": "hsl(var(--orange-400))",  /* #FA8F51 */
    "500": "hsl(var(--orange-500))",  /* #F07830 ★ primary */
    "600": "hsl(var(--orange-600))",  /* #E56120 */
    "700": "hsl(var(--orange-700))",  /* #BE4C14 */
    "800": "hsl(var(--orange-800))",  /* #8E380E */
    "900": "hsl(var(--orange-900))",  /* #5E230A */
  },

  /* ── Golden (accent) scale ───────────────────────────────── */
  gold: {
    "50":  "hsl(var(--gold-50))",     /* #FFFBF0 */
    "100": "hsl(var(--gold-100))",    /* #FFF1C4 */
    "200": "hsl(var(--gold-200))",    /* #FFE475 */
    "300": "hsl(var(--gold-300))",    /* #FDD44A */
    "400": "hsl(var(--gold-400))",    /* #FBCB30 */
    "500": "hsl(var(--gold-500))",    /* #F5C030 ★ accent */
    "600": "hsl(var(--gold-600))",    /* #E0A010 */
    "700": "hsl(var(--gold-700))",    /* #B87D08 */
    "800": "hsl(var(--gold-800))",    /* #875B05 */
    "900": "hsl(var(--gold-900))",    /* #573903 */
  },

  /* ── Cool gray (neutral) scale ───────────────────────────── */
  gray: {
    "50":  "hsl(var(--gray-50))",     /* #F9FAFB */
    "100": "hsl(var(--gray-100))",    /* #F3F4F6 */
    "200": "hsl(var(--gray-200))",    /* #E5E7EB */
    "300": "hsl(var(--gray-300))",    /* #D1D5DB */
    "400": "hsl(var(--gray-400))",    /* #9CA3AF */
    "500": "hsl(var(--gray-500))",    /* #6B7280 */
    "600": "hsl(var(--gray-600))",    /* #4B5563 */
    "700": "hsl(var(--gray-700))",    /* #374151 */
    "800": "hsl(var(--gray-800))",    /* #1F2937 */
    "900": "hsl(var(--gray-900))",    /* #111827 */
  },

  /* ── Chart palette ───────────────────────────────────────── */
  chart: {
    "1": "hsl(var(--chart-1))",
    "2": "hsl(var(--chart-2))",
    "3": "hsl(var(--chart-3))",
    "4": "hsl(var(--chart-4))",
    "5": "hsl(var(--chart-5))",
  },
};

/**
 * Font family additions for tailwind.config.ts → theme.extend.fontFamily:
 *
 * fontFamily: {
 *   sans:    ["Plus Jakarta Sans", "Inter", "system-ui", "sans-serif"],
 *   mono:    ["Geist Mono", "ui-monospace", "monospace"],
 * }
 */
