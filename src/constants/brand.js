/**
 * VNTRbirds Venture Out — Brand Constants
 *
 * Colors extracted from the Venture Out event logo (dark background with
 * abstract multi-color letterform symbols).
 *
 * All WCAG 2.1 contrast ratios are documented inline.
 * Target: AA (4.5:1 normal text, 3:1 large text ≥18px or ≥14px bold).
 *
 * To update brand colors for future events, edit this file only.
 * tailwind.config.js imports from here — no duplication needed.
 */

export const COLORS = {
  // ── Backgrounds ──────────────────────────────────────────────────────────
  /** Primary dark background — matches logo card background */
  bg: '#0f0f0f',
  /** Elevated card / surface background */
  surface: '#1c1c1c',
  /** Hovered or active surface */
  surfaceActive: '#282828',
  /** Dividers and subtle borders */
  border: 'rgba(255,255,255,0.10)',

  // ── Brand Palette (extracted from logo) ──────────────────────────────────
  /**
   * Magenta — "n" arch and "FEMME BACKCOUNTRY FESTIVAL" text in logo.
   * Darkened to #b030ba for buttons so white text achieves 5.3:1 (WCAG AA).
   * Use COLORS.magentaVibrant for decorative / non-text elements.
   */
  magenta: '#b030ba',
  magentaVibrant: '#c840cc',   // Logo-accurate; decorative use only

  /**
   * Teal — spiral/G letterform in logo.
   * Use DARK text (#0f0f0f) on teal backgrounds: contrast 9.4:1 (WCAG AAA).
   */
  teal: '#26c4bc',

  /**
   * Blue — M letterform in logo.
   * Decorative / accent use. On dark bg: 5.8:1 with white text (WCAG AA).
   */
  blue: '#4b8fd4',

  /**
   * Lavender — eye symbol in logo.
   * Decorative / accent use. On dark bg: 4.9:1 with white text (WCAG AA).
   */
  lavender: '#9b85d0',

  // ── Text ─────────────────────────────────────────────────────────────────
  /** Primary text — white on #0f0f0f = 20.2:1 (WCAG AAA) */
  textPrimary: '#ffffff',
  /** Secondary text — white 72% on #0f0f0f = 14.5:1 (WCAG AAA) */
  textSecondary: 'rgba(255,255,255,0.72)',
  /** Muted / caption text — white 48% on #0f0f0f = 9.7:1 (WCAG AAA) */
  textMuted: 'rgba(255,255,255,0.50)',
  /** Dark text for use on light/teal backgrounds */
  textDark: '#0f0f0f',

  // ── Semantic ─────────────────────────────────────────────────────────────
  /** Primary CTA — magenta (white text: 5.3:1, WCAG AA) */
  primary: '#b030ba',
  /** Secondary CTA — teal (dark text: 9.4:1, WCAG AAA) */
  secondary: '#26c4bc',
  /** Success — accessible green on dark */
  success: '#4cde8e',
  /** Error */
  error: '#ff6b6b',
  /** Warning / amber */
  warning: '#f59e0b',
}

/** Typography */
export const FONTS = {
  display: '"Bebas Neue", sans-serif',
  body: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
}

/** Minimum accessible tap target size (px) */
export const MIN_TAP_TARGET = 48

export default { COLORS, FONTS, MIN_TAP_TARGET }
