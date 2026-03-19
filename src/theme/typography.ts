/**
 * Typography scale for CalTrack AI.
 *
 * React Native respects iOS Dynamic Type by default (allowFontScaling=true).
 * This module provides:
 * - Named font size constants for consistency
 * - maxFontSizeMultiplier presets for constrained layouts
 */

/** Named font sizes (base values at 1× scale) */
export const fontSize = {
  /** 10px — micro labels (day calories, pill labels) */
  xs2: 10,
  /** 11px — small badges, macro labels */
  xs: 11,
  /** 12px — captions, meta text, footnotes */
  caption: 12,
  /** 13px — secondary text, subtitles */
  small: 13,
  /** 14px — tertiary body, list details */
  body2: 14,
  /** 15px — standard body */
  body: 15,
  /** 16px — prominent body, buttons */
  body1: 16,
  /** 17px — large body */
  callout: 17,
  /** 18px — subheadings, large buttons */
  subhead: 18,
  /** 20px — section titles, large values */
  title3: 20,
  /** 22px — screen titles */
  title2: 22,
  /** 24px — headings */
  title1: 24,
  /** 26px — step titles */
  largeTitle2: 26,
  /** 28px — hero titles */
  largeTitle: 28,
  /** 32px — feature numbers */
  display3: 32,
  /** 36px — price display */
  display2: 36,
  /** 48px — large emoji/icon */
  display1: 48,
  /** 56-80px — hero emoji/decorative (not real text) */
  jumbo: 60,
} as const;

/**
 * maxFontSizeMultiplier presets.
 *
 * Use on <Text> components in space-constrained layouts to prevent
 * overflow while still allowing meaningful scaling.
 *
 * - `tight`: 1.2× — badges, tab labels, very small chips
 * - `moderate`: 1.35× — macro pills, compact cards, stepper values
 * - `relaxed`: 1.5× — most body text in cards
 * - `none`: undefined — unconstrained (default for main content)
 */
export const maxScale = {
  tight: 1.2,
  moderate: 1.35,
  relaxed: 1.5,
} as const;
