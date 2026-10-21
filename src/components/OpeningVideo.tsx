"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Flame,
  Heart,
  Footprints,
  Utensils,
  Droplet,
  Sparkles,
  TrendingUp,
  ChevronRight,
  Check,
} from 'lucide-react';
import {
  VIDEO_SRC,
  CROSSFADE_START_S,
  CROSSFADE_DURATION_MS,
  SKIP_BUTTON_DELAY_MS,
  VIDEO_READY_TIMEOUT_MS,
  markOpeningSeen,
} from '../lib/openingController';

interface OpeningVideoProps {
  /** Called when the opening is fully dismissed (video ended or skipped) */
  onComplete: () => void;
}

/**
 * OpeningVideo — Cinematic UI/UX Presentation Video Showcase.
 * 
 * Synchronized with the 10-second 3D mascot walk:
 *  • 0.0s - 1.2s : Intro & App Welcome Badge ("FitPulse Pro Companion")
 *  • 1.2s - 4.0s : Feature 1 — Smart Calorie Deficit & Target Balance Ring
 *  • 4.0s - 6.8s : Feature 2 — Live Vitals (Heart Rate BPM) & Daily Steps Counter
 *  • 6.8s - 9.2s : Feature 3 — Precision Macro Nutrients (Protein, Karbo, Lemak) & Hydration
 *  • 9.2s - 10.0s: Seamless Climax Handoff into Live Dashboard
 */
const OpeningVideo: React.FC<OpeningVideoProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSkip, setShowSkip] = useState(false);
  const [fading, setFading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const timeUpdateRef = useRef<boolean>(false);
  const hasCompletedRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  // ── Trigger the crossfade & cleanup ────────────────────────────────
  const triggerFade = useCallback(() => {
    if (fading || hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    setFading(true);
    markOpeningSeen();

    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

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

  // ── 60fps Animation Loop for silky smooth story bars & UI sync ─────
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

    return () => {
      active = false;
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [triggerFade]);

  // ── Setup & fallback timer ────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const fallbackTimer = setTimeout(() => {
      if (!timeUpdateRef.current && !hasCompletedRef.current) {
        triggerFade();
      }
    }, VIDEO_READY_TIMEOUT_MS + 3500);

    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, SKIP_BUTTON_DELAY_MS);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        if (!hasCompletedRef.current) {
          triggerFade();
        }
      });
    }

    return () => {
      clearTimeout(fallbackTimer);
      clearTimeout(skipTimer);
    };
  }, [triggerFade]);

  const handleTimeUpdate = useCallback(() => {
    timeUpdateRef.current = true;
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  const handleEnded = useCallback(() => {
    if (!hasCompletedRef.current) {
      triggerFade();
    }
  }, [triggerFade]);

  const handleCanPlay = useCallback(() => {
    timeUpdateRef.current = true;
  }, []);

  const handleError = useCallback(() => {
    if (!hasCompletedRef.current) {
      triggerFade();
    }
  }, [triggerFade]);

  if (dismissed) return null;

  // ── Determine Current Showcase Phase ─────────────────────────────
  // 0: Intro (0 - 1.0s)
  // 1: Feature 1 (1.0s - 3.8s) Calorie & Deficit
  // 2: Feature 2 (3.8s - 6.6s) Activity & Vitals
  // 3: Feature 3 (6.6s - 9.2s) Macros & Hydration
  // 4: Transition Handoff (9.2s - 10s)
  let activePhase = 0;
  if (currentTime >= 9.2) activePhase = 4;
  else if (currentTime >= 6.6) activePhase = 3;
  else if (currentTime >= 3.8) activePhase = 2;
  else if (currentTime >= 1.0) activePhase = 1;

  // Story progress calculation (0 to 100%) for the 3 segments
  const calcStoryFill = (start: number, end: number) => {
    if (currentTime < start) return '0%';
    if (currentTime >= end) return '100%';
    const pct = ((currentTime - start) / (end - start)) * 100;
    return `${Math.min(100, Math.max(0, pct))}%`;
  };

  return (
    <div
      className={`opening-overlay ${fading ? 'opening-fade-out' : ''}`}
      role="dialog"
      aria-label="Presentasi Fitur Unggulan FitPulse"
      aria-live="polite"
      style={{
        transitionDuration: `${CROSSFADE_DURATION_MS}ms`,
      }}
    >
      {/* 3D Mascot Walking Video */}
      <video
        ref={videoRef}
        className="opening-video"
        src={VIDEO_SRC}
        muted
        playsInline
        autoPlay
        preload="auto"
        poster="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='100%25' height='100%25' fill='%23FFFFFF'/%3E%3C/svg%3E"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onCanPlay={handleCanPlay}
        onError={handleError}
      />

      {/* Cinematic Showcase Container (bounded to smartphone aspect ratio) */}
      <div className="opening-stage">
        
        {/* TOP BAR: Instagram-Story-Style Segmented Scrubber & Brand Header */}
        <div className="opening-top-header">
          {/* Segmented 3-Part Story Timeline */}
          <div className="opening-story-timeline" aria-label="Progress Fitur">
            <div className="story-segment">
              <div
                className="story-fill"
                style={{ width: calcStoryFill(1.0, 3.8) }}
              />
            </div>
            <div className="story-segment">
              <div
                className="story-fill"
                style={{ width: calcStoryFill(3.8, 6.6) }}
              />
            </div>
            <div className="story-segment">
              <div
                className="story-fill"
                style={{ width: calcStoryFill(6.6, 9.2) }}
              />
            </div>
          </div>

          {/* Brand Row: Badge + Skip Pill */}
          <div className="opening-nav-row">
            <div className="opening-brand-badge">
              <span className="opening-live-dot" />
              <span className="opening-brand-name">FitPulse</span>
              <span className="opening-brand-sub">PREVIEW</span>
            </div>

            {showSkip && !fading && (
              <button
                className="opening-skip-btn"
                onClick={triggerFade}
                aria-label="Lewati presentasi pembuka"
              >
                <span>Lewati</span>
                <ChevronRight size={13} className="skip-arrow" />
              </button>
            )}
          </div>
        </div>

        {/* FLOATING UI SHOWCASE AREA (Upper-Middle, framing mascot seamlessly) */}
        <div className="opening-cards-stage">

          {/* ── PHASE 0: WELCOME & MASCOT GREETING (0.0s - 1.2s) ── */}
          {activePhase === 0 && (
            <div className="opening-card opening-card-intro anim-slide-down">
              <div className="intro-pill">
                <Sparkles size={14} className="icon-sparkle" />
                <span>Smart Health & Calorie Tracker</span>
              </div>
              <h2 className="intro-title">Mulai Gaya Hidup Sehatmu</h2>
              <p className="intro-sub">Bersama asisten nutrisi & kebugaran cerdas.</p>
            </div>
          )}

          {/* ── PHASE 1: TARGET KALORI & DEFISIT CERDAS (1.2s - 4.0s) ── */}
          {activePhase === 1 && (
            <div className="opening-card opening-card-feature anim-spring-in">
              <div className="card-feature-header">
                <div className="feature-chip chip-amber">
                  <Flame size={12} />
                  <span>FITUR UNGGULAN #1</span>
                </div>
                <span className="feature-status-live">
                  <span className="live-dot-green" /> Realtime Defisit
                </span>
              </div>

              <div className="card-feature-body">
                <div className="feature-metric-hero">
                  <div className="metric-left">
                    <span className="metric-label">Target Kalori Harian</span>
                    <div className="metric-value-row">
                      <span className="metric-big-num">2,150</span>
                      <span className="metric-unit">kkal</span>
                    </div>
                  </div>

                  {/* Visual Circular Gauge Mini */}
                  <div className="mini-gauge-wrap">
                    <svg className="mini-gauge-svg" viewBox="0 0 44 44">
                      <circle cx="22" cy="22" r="18" className="mini-gauge-bg" />
                      <circle
                        cx="22"
                        cy="22"
                        r="18"
                        className="mini-gauge-val ring-cal-fill"
                      />
                    </svg>
                    <Flame size={15} className="mini-gauge-icon text-amber" />
                  </div>
                </div>

                <div className="feature-pill-stats">
                  <div className="stat-pill">
                    <TrendingUp size={12} className="text-emerald" />
                    <span>Defisit: <strong>-450 kkal</strong></span>
                  </div>
                  <div className="stat-pill">
                    <Flame size={12} className="text-amber" />
                    <span>Terbakar: <strong>380 kkal</strong></span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PHASE 2: LIVE ACTIVITY & HEART RATE VITAL (4.0s - 6.8s) ── */}
          {activePhase === 2 && (
            <div className="opening-card opening-card-feature anim-spring-in">
              <div className="card-feature-header">
                <div className="feature-chip chip-rose">
                  <Heart size={12} />
                  <span>FITUR UNGGULAN #2</span>
                </div>
                <span className="feature-status-live">
                  <span className="live-dot-rose" /> Sensor Aktif
                </span>
              </div>

              <div className="card-feature-body">
                <div className="feature-grid-vitals">
                  {/* Heart Rate Card */}
                  <div className="vital-item-box vital-heart">
                    <div className="vital-top">
                      <Heart size={14} className="icon-beating text-rose" />
                      <span className="vital-name">Detak Jantung</span>
                    </div>
                    <div className="vital-num-row">
                      <span className="vital-num">78</span>
                      <span className="vital-unit">BPM</span>
                    </div>
                    <span className="vital-tag tag-rose">Zona Sehat</span>
                  </div>

                  {/* Daily Steps Card */}
                  <div className="vital-item-box vital-steps">
                    <div className="vital-top">
                      <Footprints size={14} className="text-cyan" />
                      <span className="vital-name">Langkah Kaki</span>
                    </div>
                    <div className="vital-num-row">
                      <span className="vital-num">8,420</span>
                      <span className="vital-unit">/ 10k</span>
                    </div>
                    <span className="vital-tag tag-cyan">84% Tercapai</span>
                  </div>
                </div>

                {/* Live progress indicator bar */}
                <div className="vital-progress-bar">
                  <div className="vital-progress-fill" style={{ width: '84%' }} />
                </div>
              </div>
            </div>
          )}

          {/* ── PHASE 3: MAKRO NUTRISI & HIDRASI (6.8s - 9.2s) ── */}
          {activePhase === 3 && (
            <div className="opening-card opening-card-feature anim-spring-in">
              <div className="card-feature-header">
                <div className="feature-chip chip-emerald">
                  <Utensils size={12} />
                  <span>FITUR UNGGULAN #3</span>
                </div>
                <span className="feature-status-live">
                  <span className="live-dot-green" /> Nutrisi Seimbang
                </span>
              </div>

              <div className="card-feature-body">
                <div className="macro-breakdown-showcase">
                  {/* Protein */}
                  <div className="macro-mini-row">
                    <div className="macro-mini-info">
                      <span className="macro-mini-dot dot-protein" />
                      <span className="macro-mini-title">Protein</span>
                      <span className="macro-mini-val">140g / 150g</span>
                    </div>
                    <div className="macro-mini-track">
                      <div className="macro-mini-fill bar-protein" style={{ width: '82%' }} />
                    </div>
                  </div>

                  {/* Karbohidrat */}
                  <div className="macro-mini-row">
                    <div className="macro-mini-info">
                      <span className="macro-mini-dot dot-carbs" />
                      <span className="macro-mini-title">Karbohidrat</span>
                      <span className="macro-mini-val">210g / 240g</span>
                    </div>
                    <div className="macro-mini-track">
                      <div className="macro-mini-fill bar-carbs" style={{ width: '70%' }} />
                    </div>
                  </div>

                  {/* Lemak */}
                  <div className="macro-mini-row">
                    <div className="macro-mini-info">
                      <span className="macro-mini-dot dot-fat" />
                      <span className="macro-mini-title">Lemak Baik</span>
                      <span className="macro-mini-val">52g / 65g</span>
                    </div>
                    <div className="macro-mini-track">
                      <div className="macro-mini-fill bar-fat" style={{ width: '60%' }} />
                    </div>
                  </div>
                </div>

                {/* Water hydration mini pill */}
                <div className="hydration-pill-showcase">
                  <Droplet size={13} className="text-cyan" />
                  <span>Hidrasi Harian: <strong>2,100 ml / 2,500 ml</strong> (84%)</span>
                </div>
              </div>
            </div>
          )}

          {/* ── PHASE 4: CLIMAX & LAUNCH DASHBOARD (9.2s - 10.0s) ── */}
          {activePhase === 4 && (
            <div className="opening-card opening-card-launch anim-spring-in">
              <div className="launch-icon-wrap">
                <Check size={20} className="text-emerald" />
              </div>
              <h3 className="launch-title">Menyiapkan Dashboard Anda...</h3>
              <p className="launch-sub">Data tersinkronisasi secara real-time</p>
            </div>
          )}

        </div>

        {/* BOTTOM BRAND FOOTER (Floats subtly below mascot) */}
        <div className="opening-bottom-footer">
          <div className="bottom-tag-pill">
            <span className="tag-pulse-ring" />
            <span>AI Healthy Lifestyle Companion</span>
          </div>
        </div>

      </div>
    </div>
  );
};

export default OpeningVideo;

