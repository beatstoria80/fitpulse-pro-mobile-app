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
  Activity,
} from 'lucide-react';
import {
  VIDEO_SRC,
  CROSSFADE_START_S,
  CROSSFADE_DURATION_MS,
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
 * Choreographed specifically with the 3D mascot's camera angle:
 *  • Placed strictly in the TOP SAFE ZONE (Y: 16px - 140px) so it NEVER covers
 *    or touches the mascot's head or face (which sits at Y: 240px - 420px).
 *  • Completely clutter-free: No Skip button, no brand capsule, no duration line.
 *  • High-impact, dynamic motion design: Moving gradient neon borders,
 *    animated SVG ECG heartbeat waveform, interactive circular calorie gauges,
 *    and multi-macro progress bars with light-sweep effects.
 */
const OpeningVideo: React.FC<OpeningVideoProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
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

  // ── 60fps Animation Loop for silky smooth sync ─────────────────────
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

  // ── Fallback timer if autoplay fails ───────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const fallbackTimer = setTimeout(() => {
      if (!timeUpdateRef.current && !hasCompletedRef.current) {
        triggerFade();
      }
    }, VIDEO_READY_TIMEOUT_MS + 3500);

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
  // 0: Intro (0.0s - 1.0s)
  // 1: Feature 1 (1.0s - 3.8s) Calorie & Real-Time Deficit Ring
  // 2: Feature 2 (3.8s - 6.6s) Live ECG Heart Rate & Steps Tracker
  // 3: Feature 3 (6.6s - 9.2s) Precision Macro Nutrients & Hydration
  // 4: Seamless Climax Handoff (9.2s - 10s)
  let activePhase = 0;
  if (currentTime >= 9.2) activePhase = 4;
  else if (currentTime >= 6.6) activePhase = 3;
  else if (currentTime >= 3.8) activePhase = 2;
  else if (currentTime >= 1.0) activePhase = 1;

  return (
    <div
      className={`opening-overlay ${fading ? 'opening-fade-out' : ''}`}
      role="dialog"
      aria-label="Presentasi Fitur Unggulan FitPulse"
      aria-live="polite"
      onClick={triggerFade}
      title="Sentuh untuk langsung memulai"
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
        
        {/* TOP POSITIONED FLOATING HUD CARD: Sits safely between Y: 16px and 145px */}
        <div className="opening-hud-anchor">

          {/* ── PHASE 0: WELCOME & MASCOT GREETING (0.0s - 1.0s) ── */}
          {activePhase === 0 && (
            <div className="hud-card hud-card-intro anim-hud-drop">
              <div className="hud-glow-border border-cyan" />
              <div className="hud-content">
                <div className="hud-badge badge-cyan">
                  <Sparkles size={11} className="icon-sparkle" />
                  <span>SMART HEALTH COMPANION</span>
                </div>
                <div className="hud-intro-text">
                  <h2 className="hud-intro-heading">FitPulse Pro</h2>
                  <span className="hud-intro-sub">Mulai transformasi sehatmu hari ini</span>
                </div>
              </div>
            </div>
          )}

          {/* ── PHASE 1: TARGET KALORI & DEFISIT CERDAS (1.0s - 3.8s) ── */}
          {activePhase === 1 && (
            <div className="hud-card hud-card-feature anim-hud-spring">
              <div className="hud-glow-border border-amber" />
              <div className="hud-content">
                {/* Header row */}
                <div className="hud-top-meta">
                  <div className="hud-chip chip-amber">
                    <Flame size={11} />
                    <span>FITUR 01 • TARGET KALORI & DEFISIT</span>
                  </div>
                  <span className="hud-live-tag">
                    <span className="pulse-dot dot-amber" /> Realtime Defisit
                  </span>
                </div>

                {/* Hero metric row */}
                <div className="hud-calorie-body">
                  <div className="hud-metric-group">
                    <span className="hud-sub-label">Target Kalori Harian</span>
                    <div className="hud-big-num-row">
                      <span className="hud-number-hero">2,150</span>
                      <span className="hud-unit-hero">kkal</span>
                    </div>
                  </div>

                  {/* Circular Progress Gauge with Flame Core */}
                  <div className="hud-mini-gauge">
                    <svg className="hud-gauge-svg" viewBox="0 0 46 46">
                      <circle cx="23" cy="23" r="19" className="gauge-track-bg" />
                      <circle
                        cx="23"
                        cy="23"
                        r="19"
                        className="gauge-track-fill fill-amber anim-gauge-draw"
                      />
                    </svg>
                    <Flame size={14} className="gauge-center-icon icon-flame-pulsing" />
                  </div>

                  {/* Stat pills */}
                  <div className="hud-mini-stats-col">
                    <div className="hud-stat-pill pill-emerald">
                      <TrendingUp size={11} />
                      <span>-450 kkal</span>
                    </div>
                    <div className="hud-stat-pill pill-amber">
                      <Flame size={11} />
                      <span>380 aktif</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PHASE 2: LIVE ECG DETAK JANTUNG & LANGKAH (3.8s - 6.6s) ── */}
          {activePhase === 2 && (
            <div className="hud-card hud-card-feature anim-hud-spring">
              <div className="hud-glow-border border-rose" />
              <div className="hud-content">
                {/* Header row */}
                <div className="hud-top-meta">
                  <div className="hud-chip chip-rose">
                    <Heart size={11} />
                    <span>FITUR 02 • SENSOR VITAL & LANGKAH</span>
                  </div>
                  <span className="hud-live-tag">
                    <span className="pulse-dot dot-rose" /> Sensor Aktif
                  </span>
                </div>

                {/* 2-Column Vitals HUD */}
                <div className="hud-vitals-body">
                  {/* Heart Rate + Live ECG Waveform */}
                  <div className="hud-vital-pane pane-heart">
                    <div className="vital-header-row">
                      <Heart size={12} className="icon-beating text-rose" />
                      <span className="vital-header-title">Detak Jantung</span>
                    </div>
                    <div className="vital-value-row">
                      <span className="vital-big-number">78</span>
                      <span className="vital-small-unit">BPM</span>
                    </div>

                    {/* Animated SVG ECG Waveform Path */}
                    <div className="ecg-waveform-wrap">
                      <svg className="ecg-svg" viewBox="0 0 100 20" preserveAspectRatio="none">
                        <path
                          className="ecg-path"
                          d="M0,10 L25,10 L30,4 L35,16 L40,8 L45,12 L50,10 L100,10"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Step Counter + Shimmer Progress */}
                  <div className="hud-vital-pane pane-steps">
                    <div className="vital-header-row">
                      <Footprints size={12} className="text-cyan" />
                      <span className="vital-header-title">Langkah Kaki</span>
                    </div>
                    <div className="vital-value-row">
                      <span className="vital-big-number">8,420</span>
                      <span className="vital-small-unit">/ 10k</span>
                    </div>
                    {/* Shimmering Step Progress Bar */}
                    <div className="hud-step-bar-wrap">
                      <div className="hud-step-bar-fill" style={{ width: '84%' }}>
                        <span className="bar-shimmer-sweep" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PHASE 3: MAKRO NUTRISI & HIDRASI CERDAS (6.6s - 9.2s) ── */}
          {activePhase === 3 && (
            <div className="hud-card hud-card-feature anim-hud-spring">
              <div className="hud-glow-border border-emerald" />
              <div className="hud-content">
                {/* Header row */}
                <div className="hud-top-meta">
                  <div className="hud-chip chip-emerald">
                    <Utensils size={11} />
                    <span>FITUR 03 • MAKRO NUTRISI & HIDRASI</span>
                  </div>
                  <span className="hud-live-tag">
                    <span className="pulse-dot dot-emerald" /> Gizi Seimbang
                  </span>
                </div>

                {/* 3 Macro Bars Stack + Hydration Pill */}
                <div className="hud-macros-body">
                  <div className="macro-tri-stack">
                    {/* Protein */}
                    <div className="macro-compact-line">
                      <span className="macro-tag-label"><span className="dot-protein" /> Protein</span>
                      <div className="macro-line-track">
                        <div className="macro-line-fill fill-protein" style={{ width: '82%' }}>
                          <span className="glow-bullet" />
                        </div>
                      </div>
                      <span className="macro-val-label">140g</span>
                    </div>

                    {/* Karbohidrat */}
                    <div className="macro-compact-line">
                      <span className="macro-tag-label"><span className="dot-carbs" /> Karbo</span>
                      <div className="macro-line-track">
                        <div className="macro-line-fill fill-carbs" style={{ width: '70%' }}>
                          <span className="glow-bullet" />
                        </div>
                      </div>
                      <span className="macro-val-label">210g</span>
                    </div>

                    {/* Lemak */}
                    <div className="macro-compact-line">
                      <span className="macro-tag-label"><span className="dot-fat" /> Lemak</span>
                      <div className="macro-line-track">
                        <div className="macro-line-fill fill-fat" style={{ width: '58%' }}>
                          <span className="glow-bullet" />
                        </div>
                      </div>
                      <span className="macro-val-label">52g</span>
                    </div>
                  </div>

                  {/* Water Hydration Pill */}
                  <div className="hud-hydration-row">
                    <Droplet size={11} className="text-cyan icon-droplet-glow" />
                    <span className="hydration-text">Air: <strong>2,100 ml</strong> / 2,500 ml (84%)</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PHASE 4: SEAMLESS CLIMAX TRANSITION (9.2s - 10.0s) ── */}
          {activePhase === 4 && (
            <div className="hud-card hud-card-launch anim-hud-scale-out">
              <div className="hud-glow-border border-cyan" />
              <div className="hud-content hud-launch-content">
                <span className="pulse-dot dot-cyan" />
                <span className="launch-text">Membuka Dashboard FitPulse...</span>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default OpeningVideo;

