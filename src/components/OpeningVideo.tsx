"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Flame,
  Footprints,
  Utensils,
  Droplet,
  Target,
  Heart,
  TrendingUp,
  Activity,
} from 'lucide-react';
import {
  VIDEO_SRC,
  CROSSFADE_START_S,
  CROSSFADE_DURATION_MS,
  VIDEO_READY_TIMEOUT_MS,
  SKIP_BUTTON_DELAY_MS,
  PHASE_1_START,
  PHASE_1_END,
  PHASE_2_START,
  PHASE_2_END,
  PHASE_3_START,
  PHASE_3_END,
  CLOSING_START,
  SURFACE_COLOR,
  markOpeningSeen,
} from '../lib/openingController';

interface OpeningVideoProps {
  onComplete: () => void;
}

/**
 * OpeningVideo — Full-bleed 3D walking character with overlay hero copy + animated feature cards.
 *
 * Layout:
 *  - Video fills entire viewport, object-fit: cover, background matched to video edges.
 *  - Hero copy (badge + headline + subtitle) overlaid at bottom-left, appears immediately.
 *  - Feature cards appear/disappear on the RIGHT side in timed phases, each relating to a real app feature.
 *  - Skip button top-right, progress bar top.
 *  - Closing VFX phase with crossfade to dashboard.
 */
const OpeningVideo: React.FC<OpeningVideoProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fading, setFading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showSkip, setShowSkip] = useState(false);

  const timeUpdateRef = useRef(false);
  const hasCompletedRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  // ── Dismiss ──────────────────────────────────────────────────────
  const triggerFade = useCallback(() => {
    if (fading || hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    setFading(true);
    markOpeningSeen();
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
      setDismissed(true);
      onComplete();
    }, CROSSFADE_DURATION_MS);
  }, [fading, onComplete]);

  // ── Skip Button Delay ────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => setShowSkip(true), SKIP_BUTTON_DELAY_MS);
    return () => clearTimeout(t);
  }, []);

  // ── 60fps rAF Loop ───────────────────────────────────────────────
  useEffect(() => {
    let active = true;
    const loop = () => {
      if (!active) return;
      const vid = videoRef.current;
      if (vid && !vid.paused && !vid.ended) {
        setCurrentTime(vid.currentTime);
        if (vid.currentTime >= CROSSFADE_START_S && !hasCompletedRef.current) {
          triggerFade();
          return;
        }
      }
      rafIdRef.current = requestAnimationFrame(loop);
    };
    rafIdRef.current = requestAnimationFrame(loop);
    return () => { active = false; if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current); };
  }, [triggerFade]);

  // ── Fallback ─────────────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    const fallback = setTimeout(() => {
      if (!timeUpdateRef.current && !hasCompletedRef.current) triggerFade();
    }, VIDEO_READY_TIMEOUT_MS + 3500);
    const p = video.play();
    if (p !== undefined) p.catch(() => { if (!hasCompletedRef.current) triggerFade(); });
    return () => clearTimeout(fallback);
  }, [triggerFade]);

  const handleTimeUpdate = useCallback(() => {
    timeUpdateRef.current = true;
    if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
  }, []);

  if (dismissed) return null;

  // ── Phase Detection ──────────────────────────────────────────────
  const t = currentTime;
  const showPhase1 = t >= PHASE_1_START && t < PHASE_1_END;
  const showPhase2 = t >= PHASE_2_START && t < PHASE_2_END;
  const showPhase3 = t >= PHASE_3_START && t < PHASE_3_END;
  const showClosing = t >= CLOSING_START;
  const showHeroCopy = t < CLOSING_START;

  const progressPercent = Math.min(100, (t / 10) * 100);

  return (
    <div
      className={`op-overlay ${fading ? 'op-fade-out' : ''}`}
      style={{ transitionDuration: `${CROSSFADE_DURATION_MS}ms`, backgroundColor: SURFACE_COLOR }}
    >
      {/* Full-bleed Video */}
      <video
        ref={videoRef}
        className="op-video"
        src={VIDEO_SRC}
        muted
        playsInline
        autoPlay
        preload="auto"
        poster={`data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='${encodeURIComponent(SURFACE_COLOR)}'/%3E%3C/svg%3E`}
        onTimeUpdate={handleTimeUpdate}
        onEnded={() => { if (!hasCompletedRef.current) triggerFade(); }}
        onCanPlay={() => { timeUpdateRef.current = true; }}
        onError={() => { if (!hasCompletedRef.current) triggerFade(); }}
      />

      {/* Progress Bar */}
      <div className="op-progress-track">
        <div className="op-progress-fill" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Skip Button */}
      {showSkip && (
        <button className="op-skip-btn" onClick={triggerFade}>
          Lewati
        </button>
      )}

      {/* ── Overlay Stage (max 430px, centered) ── */}
      <div className="op-stage">

        {/* Hero Copy — Bottom Left, appears immediately with video */}
        {showHeroCopy && (
          <div className="op-hero-copy op-anim-rise">
            <div className="op-hero-badge">
              <span className="op-badge-dot" />
              FITPULSE PRO
            </div>
            <h1 className="op-hero-headline">
              Kontrol Energi,<br />Kuasai Harimu.
            </h1>
            <p className="op-hero-sub">
              Pelacakan kalori, nutrisi & kebugaran berbasis data tubuhmu.
            </p>
          </div>
        )}

        {/* ── PHASE 1: Target Kalori & Defisit (1.4s – 4.0s) ── */}
        {showPhase1 && (
          <div className="op-card op-card-right op-anim-card-in" key="p1">
            <div className="op-card-header">
              <div className="op-card-icon op-icon-amber"><Target size={14} /></div>
              <span className="op-card-tag">TARGET KALORI</span>
            </div>
            <div className="op-card-body">
              <div className="op-card-metric">
                <span className="op-metric-val">1.800</span>
                <span className="op-metric-unit">kkal / hari</span>
              </div>
              <div className="op-card-row">
                <div className="op-mini-badge op-badge-green">
                  <TrendingUp size={10} /> Defisit 400 kkal
                </div>
                <div className="op-mini-badge op-badge-orange">
                  <Flame size={10} /> Bakar 520 kkal
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PHASE 2: Aktivitas, Langkah & Detak Jantung (4.0s – 6.8s) ── */}
        {showPhase2 && (
          <div className="op-card op-card-right-low op-anim-card-in" key="p2">
            <div className="op-card-header">
              <div className="op-card-icon op-icon-rose"><Heart size={14} /></div>
              <span className="op-card-tag">AKTIVITAS & VITAL</span>
            </div>
            <div className="op-card-body">
              <div className="op-card-split">
                <div className="op-split-item">
                  <Footprints size={13} className="op-text-orange" />
                  <span className="op-split-val">8.240</span>
                  <span className="op-split-label">langkah</span>
                </div>
                <div className="op-split-divider" />
                <div className="op-split-item">
                  <Activity size={13} className="op-text-rose" />
                  <span className="op-split-val">72</span>
                  <span className="op-split-label">bpm</span>
                </div>
              </div>
              <div className="op-card-bar-row">
                <div className="op-bar-track">
                  <div className="op-bar-fill op-fill-orange" style={{ width: '82%' }} />
                </div>
                <span className="op-bar-label">82% target</span>
              </div>
            </div>
          </div>
        )}

        {/* ── PHASE 3: Nutrisi Makro & Hidrasi (6.8s – 8.8s) ── */}
        {showPhase3 && (
          <div className="op-card op-card-center op-anim-card-in" key="p3">
            <div className="op-card-header">
              <div className="op-card-icon op-icon-emerald"><Utensils size={14} /></div>
              <span className="op-card-tag">NUTRISI & HIDRASI</span>
            </div>
            <div className="op-card-body">
              <div className="op-macro-row">
                <div className="op-macro-item">
                  <span className="op-macro-dot op-dot-green" />
                  <span className="op-macro-name">Protein</span>
                  <span className="op-macro-val">85g</span>
                </div>
                <div className="op-macro-item">
                  <span className="op-macro-dot op-dot-yellow" />
                  <span className="op-macro-name">Karbo</span>
                  <span className="op-macro-val">210g</span>
                </div>
                <div className="op-macro-item">
                  <span className="op-macro-dot op-dot-red" />
                  <span className="op-macro-name">Lemak</span>
                  <span className="op-macro-val">52g</span>
                </div>
              </div>
              <div className="op-hydration-row">
                <Droplet size={13} className="op-text-blue" />
                <div className="op-bar-track op-bar-sm">
                  <div className="op-bar-fill op-fill-blue" style={{ width: '65%' }} />
                </div>
                <span className="op-hydration-label">1.300 / 2.000 ml</span>
              </div>
            </div>
          </div>
        )}

        {/* ── CLOSING: Sync Complete (8.8s – 10s) ── */}
        {showClosing && (
          <div className="op-closing op-anim-card-in" key="closing">
            <div className="op-closing-ring" />
            <div className="op-closing-ring op-ring-delay" />
            <div className="op-closing-text">
              <span className="op-closing-badge">SYNC COMPLETE</span>
              <strong>Dashboard Siap</strong>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OpeningVideo;
