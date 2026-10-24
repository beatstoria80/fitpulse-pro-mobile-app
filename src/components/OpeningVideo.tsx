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
  CheckCircle2,
  Sparkles,
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
 * OpeningVideo — Mobile Smartphone Framed Overlay with High-End UI/UX Telemetry Docking
 *
 * Fully contained inside a native mobile smartphone frame:
 * - On mobile: Fullscreen native 100vw / 100dvh.
 * - On desktop: Centered 440px phone container with rounded corners and ambient backdrop.
 * - Video, progress bar, skip button, hero copy, and feature cards are strictly inside the phone frame.
 * - Seamless handoff: Replaces archaic particle explosions with a sophisticated UI handshake sequence.
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
      style={{ transitionDuration: `${CROSSFADE_DURATION_MS}ms` }}
    >
      {/* ── Native Smartphone Frame Container ── */}
      <div className={`op-phone-frame ${fading ? 'op-docking-out' : ''}`}>
        {/* Full-bleed Video strictly inside phone frame */}
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

        {/* Cinematic Vignette for maximum text contrast */}
        <div className="op-vignette" />

        {/* 2px Progress Bar at very top of phone */}
        <div className="op-progress-track">
          <div className="op-progress-fill" style={{ width: `${progressPercent}%` }} />
        </div>

        {/* Skip Button inside phone frame (top-right) */}
        {showSkip && !showClosing && (
          <button className="op-skip-btn" onClick={triggerFade} aria-label="Lewati intro">
            Lewati
          </button>
        )}

        {/* ── Overlay Content Area ── */}
        <div className="op-stage">

          {/* Hero Copy — Bottom of Mobile Screen */}
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
            <div className="op-card op-card-top-right op-anim-card-in" key="p1">
              <div className="op-card-header">
                <div className="op-card-icon op-icon-amber"><Target size={13} /></div>
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
            <div className="op-card op-card-mid-right op-anim-card-in" key="p2">
              <div className="op-card-header">
                <div className="op-card-icon op-icon-rose"><Heart size={13} /></div>
                <span className="op-card-tag">AKTIVITAS & VITAL</span>
              </div>
              <div className="op-card-body">
                <div className="op-card-split">
                  <div className="op-split-item">
                    <Footprints size={12} className="op-text-orange" />
                    <span className="op-split-val">8.240</span>
                    <span className="op-split-label">langkah</span>
                  </div>
                  <div className="op-split-divider" />
                  <div className="op-split-item">
                    <Activity size={12} className="op-text-rose" />
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
            <div className="op-card op-card-bottom-deck op-anim-card-in" key="p3">
              <div className="op-card-header">
                <div className="op-card-icon op-icon-emerald"><Utensils size={13} /></div>
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
                  <Droplet size={12} className="op-text-blue" />
                  <div className="op-bar-track op-bar-sm">
                    <div className="op-bar-fill op-fill-blue" style={{ width: '65%' }} />
                  </div>
                  <span className="op-hydration-label">1.300 / 2.000 ml</span>
                </div>
              </div>
            </div>
          )}

          {/* ── CLOSING: High-End UI/UX Telemetry Handshake & Docking (8.8s – 10s) ── */}
          {showClosing && (
            <div className="op-dock-container op-anim-dock" key="closing">
              <div className="op-dock-card">
                <div className="op-dock-header">
                  <div className="op-dock-badge">
                    <Sparkles size={12} className="op-badge-spin" />
                    <span>HANDSHAKE TELEMETRI</span>
                  </div>
                  <span className="op-dock-ready-tag">SINKRONISASI</span>
                </div>

                {/* Staggered System Telemetry Chips */}
                <div className="op-dock-chips-list">
                  <div className="op-dock-chip op-chip-delay-1">
                    <CheckCircle2 size={13} className="op-chip-icon-cyan" />
                    <span className="op-chip-name">Keseimbangan Energi</span>
                    <span className="op-chip-status">Terkalibrasi</span>
                  </div>
                  <div className="op-dock-chip op-chip-delay-2">
                    <CheckCircle2 size={13} className="op-chip-icon-green" />
                    <span className="op-chip-name">Target Kalori & Defisit</span>
                    <span className="op-chip-status">1.800 kkal</span>
                  </div>
                  <div className="op-dock-chip op-chip-delay-3">
                    <CheckCircle2 size={13} className="op-chip-icon-amber" />
                    <span className="op-chip-name">Pedometer & Hidrasi</span>
                    <span className="op-chip-status">Aktif</span>
                  </div>
                </div>

                {/* Micro Telemetry Scanner Bar */}
                <div className="op-dock-footer">
                  <div className="op-dock-scanner-track">
                    <div className="op-dock-scanner-fill" />
                  </div>
                  <div className="op-dock-footer-text">
                    <span>Mempersiapkan Dashboard...</span>
                    <strong>100%</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default OpeningVideo;
