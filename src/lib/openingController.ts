/**
 * Opening Hero Session & Configuration Controller
 * -----------------------------------------------
 * Central configuration for the mobile app opening & hero experience.
 * All timing constants, copy strings, colors, and session flags are exported here.
 */

// ── Timing Constants (editable) ─────────────────────────────────────────
/** Total video duration in seconds */
export const OPENING_DURATION_S = 10.0;

/** Timestamp (in seconds) when cinematic phase ends and handoff begins */
export const CINEMATIC_END_S = 8.5;

/** Timestamp (in seconds) when hero settles into final frontal resting state */
export const HERO_SETTLE_S = 10.0;

/** Duration of the video stage upward shift transition in milliseconds */
export const STAGE_TRANSFORM_DURATION_MS = 700;

/** Delay before the "Lewati" (Skip) button appears, in milliseconds */
export const SKIP_BUTTON_DELAY_MS = 1000;

/** Duration of the final crossfade transition to the dashboard in milliseconds */
export const CROSSFADE_DURATION_MS = 500;

/** Max wait for video readiness before showing fallback */
export const VIDEO_READY_TIMEOUT_MS = 3000;

/** Video source path (relative to public/) */
export const VIDEO_SRC = '/character_3d_walking.mp4';

// ── Design Tokens & Colors (editable) ───────────────────────────────────
export const HERO_THEME = {
  /** Sampled background color of the character 3D video */
  surface: '#EAEAEA',
  /** Primary ink text color (#0F172A) */
  ink: '#0F172A',
  /** 70% ink color for subtitle text */
  inkSecondary: 'rgba(15, 23, 42, 0.70)',
  /** Mascot brand blue accent for primary CTA and progress fill */
  brandBlue: '#4F7FD0',
  /** Progress line background track */
  progressTrack: '#A9C8F2',
  /** Pure white */
  white: '#FFFFFF',
};

// ── Copy Strings (editable, Indonesian) ──────────────────────────────────
export const HERO_COPY = {
  /** App wordmark displayed above headline */
  wordmark: 'FitPulse',
  /** Headline (max 2 lines, sentence case, tight tracking) */
  headline: 'Catat makan, hitung kalori, tetap konsisten.',
  /** Subtitle (1 sentence, max 2 lines, 70% ink) */
  subtitle: 'Target harianmu dihitung dari tubuh dan aktivitasmu, bukan angka tebakan.',
  /** Primary CTA label */
  cta: 'Mulai sekarang',
  /** Secondary text link label */
  secondary: 'Sudah punya akun? Masuk',
  /** Skip button label */
  skip: 'Lewati',
};

// ── Session Logic ─────────────────────────────────────────────────────────

/**
 * Returns true if the opening should play on this launch.
 * - Plays on first cold start (new tab session).
 * - Does NOT replay after returning from background or tab switches.
 * - Respects the user preference toggle "fitpulse_show_opening".
 * - Skips if the user has "reduce motion" enabled.
 */
export function shouldShowOpening(): boolean {
  // Allow ?forceOpening=1 for testing & reviewing
  if (typeof window !== 'undefined' && window.location.search.includes('forceOpening=1')) {
    return true;
  }

  // 1. Respect prefers-reduced-motion
  if (typeof window !== 'undefined' && window.matchMedia) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return false;
  }

  // 2. Check user preference toggle
  if (typeof localStorage !== 'undefined') {
    const pref = localStorage.getItem('fitpulse_show_opening');
    if (pref === 'false') return false;
  }

  // 3. Check session flag — once per cold start
  if (typeof sessionStorage !== 'undefined') {
    if (sessionStorage.getItem('opening_seen_session') === '1') return false;
  }

  return true;
}

/**
 * Mark the opening as seen for this session.
 */
export function markOpeningSeen(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('opening_seen_session', '1');
  }
}

/**
 * Get the user preference for showing the opening animation.
 * Default: true (show).
 */
export function getOpeningPreference(): boolean {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('fitpulse_show_opening') !== 'false';
  }
  return true;
}

/**
 * Set the user preference for showing the opening animation.
 */
export function setOpeningPreference(show: boolean): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('fitpulse_show_opening', show ? 'true' : 'false');
  }
}
