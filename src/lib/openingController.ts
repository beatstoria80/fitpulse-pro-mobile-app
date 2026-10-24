/**
 * Opening Video Session & Configuration Controller
 * -------------------------------------------------
 * Timing, copy, colors, and session logic for the opening cinematic overlay.
 */

// ── Timing Constants ─────────────────────────────────────────────────
export const OPENING_DURATION_S = 10;
export const CROSSFADE_START_S = 9.4;
export const CROSSFADE_DURATION_MS = 600;
export const SKIP_BUTTON_DELAY_MS = 1000;
export const VIDEO_READY_TIMEOUT_MS = 300;
export const VIDEO_SRC = '/character_3d_walking.mp4';

// ── Phase Timing (seconds) ───────────────────────────────────────────
/** Hero copy appears immediately and stays until closing */
export const HERO_COPY_START_S = 0.0;
/** Feature cards phase timings */
export const PHASE_1_START = 1.4;
export const PHASE_1_END = 4.0;
export const PHASE_2_START = 4.0;
export const PHASE_2_END = 6.8;
export const PHASE_3_START = 6.8;
export const PHASE_3_END = 8.8;
export const CLOSING_START = 8.8;

// ── Surface Color (sampled from video background edges) ──────────────
export const SURFACE_COLOR = '#EAEAEA';

// ── Session Logic ────────────────────────────────────────────────────

export function shouldShowOpening(): boolean {
  if (typeof window !== 'undefined' && window.location.search.includes('forceOpening=1')) {
    return true;
  }
  if (typeof window !== 'undefined' && window.matchMedia) {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (reducedMotion.matches) return false;
  }
  if (typeof localStorage !== 'undefined') {
    const pref = localStorage.getItem('fitpulse_show_opening');
    if (pref === 'false') return false;
  }
  if (typeof sessionStorage !== 'undefined') {
    if (sessionStorage.getItem('opening_seen_session') === '1') return false;
  }
  return true;
}

export function markOpeningSeen(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem('opening_seen_session', '1');
  }
}

export function getOpeningPreference(): boolean {
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('fitpulse_show_opening') !== 'false';
  }
  return true;
}

export function setOpeningPreference(show: boolean): void {
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('fitpulse_show_opening', show ? 'true' : 'false');
  }
}
