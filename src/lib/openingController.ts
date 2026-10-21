/**
 * Opening Video Session Controller
 * ----------------------------------
 * Manages the once-per-cold-start session flag, user preference toggle,
 * and reduced-motion accessibility detection.
 *
 * Storage keys:
 *   - sessionStorage  "opening_seen_session"  — cleared on tab close (cold start)
 *   - localStorage    "fitpulse_show_opening"  — persistent user toggle (default: true)
 */

// ── Timing Constants (tweak here) ─────────────────────────────────────────
/** Total video duration in seconds */
export const OPENING_DURATION_S = 10;

/** Seconds into the video when the crossfade starts */
export const CROSSFADE_START_S = 9.4;

/** Duration of the crossfade transition in milliseconds */
export const CROSSFADE_DURATION_MS = 600;

/** Delay before the "Lewati" (Skip) button appears, in ms */
export const SKIP_BUTTON_DELAY_MS = 1000;

/** Max wait for video readiness before showing the white fade fallback */
export const VIDEO_READY_TIMEOUT_MS = 300;

/** Video source path (relative to public/) */
export const VIDEO_SRC = '/opening_1_3D_walking.mp4';

/** Poster image path (white first frame) */
export const VIDEO_POSTER = '';  // empty = use solid white bg as fallback

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
