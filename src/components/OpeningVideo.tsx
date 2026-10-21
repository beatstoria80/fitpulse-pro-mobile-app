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
  Target,
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
 * OpeningVideo — 3D Camera Tracker & 2D Motion Tracked UI/UX Experience.
 *
 * Designed to emulate After Effects 3D Camera Tracker & Mocha AE:
 *  • 10% Ultra-Translucent Frosted Glassmorphism (`rgba(255, 255, 255, 0.10)`
 *    with `backdrop-filter: blur(20px)` and luminous edge).
 *  • Dynamic non-static positioning:
 *      - Phase 1 (1.0s - 3.8s): Tracks upper-left flank in 3D perspective (+12° Y-tilt)
 *        with an AR crosshair tracking anchor and connector line pointing to character.
 *      - Phase 2 (3.8s - 6.6s): Mascot turns left → Card tracks upper-right flank (-12° Y-tilt)
 *        with live ECG waveform and step shimmer bar.
 *      - Phase 3 (6.6s - 9.2s): Mascot walks back-left → Card tracks upper-left depth (+8° Y-tilt)
 *        with 3 macro nutrient tracks and water hydration meter.
 *  • Zero interference with mascot's head or face.
 *  • Completely clutter-free (no skip pill, no capsule, no duration line).
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

  // ── 60fps Animation Loop for silky smooth 3D tracking & parallax ────
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
  // 1: Feature 1 (1.0s - 3.8s) Left Flank Tracked — Calorie & Deficit
  // 2: Feature 2 (3.8s - 6.6s) Right Flank Tracked — Live ECG Vitals & Steps
  // 3: Feature 3 (6.6s - 9.2s) Left Flank Tracked — Macros & Hydration
  // 4: Seamless Climax Handoff (9.2s - 10.0s)
  let activePhase = 0;
  if (currentTime >= 9.2) activePhase = 4;
  else if (currentTime >= 6.6) activePhase = 3;
  else if (currentTime >= 3.8) activePhase = 2;
  else if (currentTime >= 1.0) activePhase = 1;

  // Subtle 3D camera drift & walking cadence (continuous floating parallax)
  const driftY = Math.sin(currentTime * 3.5) * 4;
  const driftX = Math.cos(currentTime * 2.2) * 3;

  return (
    <div
      className={`opening-overlay ${fading ? 'opening-fade-out' : ''}`}
      role="dialog"
      aria-label="Presentasi Fitur Unggulan FitPulse 3D Motion Tracked"
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

      {/* 3D Camera Tracking Stage */}
      <div className="opening-tracking-stage">

        {/* ── PHASE 0: 3D AR INTRO BEACON (0.0s - 1.0s) ── */}
        {activePhase === 0 && (
          <div
            className="tracking-node node-intro anim-track-fade"
            style={{
              transform: `translate3d(${driftX}px, ${driftY}px, 0) perspective(900px) rotateY(6deg)`,
            }}
          >
            <div className="glass-10-card card-intro-mini">
              <div className="track-header-meta">
                <span className="ar-crosshair"><Target size={10} className="text-cyan anim-spin-slow" /></span>
                <span className="ar-tag">3D_CAM_LOCK • FITPULSE PRO</span>
              </div>
              <div className="ar-intro-title">
                <Sparkles size={13} className="text-cyan" />
                <span>AI Health Companion</span>
              </div>
            </div>
          </div>
        )}

        {/* ── PHASE 1: UPPER-LEFT FLANK 3D TRACKED — TARGET KALORI (1.0s - 3.8s) ── */}
        {activePhase === 1 && (
          <div
            className="tracking-node node-flank-left anim-track-spring-left"
            style={{
              transform: `translate3d(${driftX - 2}px, ${driftY}px, 15px) perspective(900px) rotateY(9deg) rotateX(2deg)`,
            }}
          >
            {/* AR Anchor crosshair pointing towards character center */}
            <div className="ar-anchor-group anchor-to-right">
              <div className="ar-target-reticle">
                <span className="reticle-dot dot-amber" />
                <span className="reticle-ring ring-amber" />
              </div>
              <svg className="ar-line-svg" width="46" height="24" viewBox="0 0 46 24">
                <polyline
                  points="0,12 28,12 44,22"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                  className="ar-dash-anim"
                />
              </svg>
            </div>

            {/* 10% Opacity Frosted Glass Card */}
            <div className="glass-10-card card-tracked-feature border-glow-amber">
              {/* Header meta */}
              <div className="track-header-meta">
                <div className="meta-left">
                  <span className="ar-crosshair"><Target size={11} className="text-amber" /></span>
                  <span className="ar-tag text-amber">TRACK: #01_CALORIE_DEFICIT</span>
                </div>
                <span className="ar-live-pulse"><span className="pulse-dot dot-amber" /> LIVE</span>
              </div>

              {/* Body */}
              <div className="track-body-row">
                <div className="track-metric-left">
                  <span className="track-label">Target Kalori Harian</span>
                  <div className="track-hero-num">
                    <span className="hero-val">2,150</span>
                    <span className="hero-unit">kkal</span>
                  </div>
                </div>

                {/* Circular Gauge */}
                <div className="track-mini-gauge">
                  <svg className="gauge-svg" viewBox="0 0 42 42">
                    <circle cx="21" cy="21" r="17" className="gauge-bg" />
                    <circle cx="21" cy="21" r="17" className="gauge-val stroke-amber anim-gauge-fill" />
                  </svg>
                  <Flame size={13} className="gauge-icon text-amber" />
                </div>
              </div>

              {/* Bottom stats row */}
              <div className="track-bottom-badges">
                <div className="ar-badge badge-emerald">
                  <TrendingUp size={10} />
                  <span>Defisit <strong>-450 kkal</strong></span>
                </div>
                <div className="ar-badge badge-amber">
                  <Flame size={10} />
                  <span>Bakar <strong>380 kkal</strong></span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PHASE 2: UPPER-RIGHT FLANK 3D TRACKED — VITALS & ECG (3.8s - 6.6s) ── */}
        {activePhase === 2 && (
          <div
            className="tracking-node node-flank-right anim-track-spring-right"
            style={{
              transform: `translate3d(${driftX + 2}px, ${driftY}px, 15px) perspective(900px) rotateY(-9deg) rotateX(2deg)`,
            }}
          >
            {/* AR Anchor crosshair pointing towards character on the left */}
            <div className="ar-anchor-group anchor-to-left">
              <svg className="ar-line-svg" width="46" height="24" viewBox="0 0 46 24">
                <polyline
                  points="46,12 18,12 2,22"
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                  className="ar-dash-anim"
                />
              </svg>
              <div className="ar-target-reticle">
                <span className="reticle-dot dot-rose" />
                <span className="reticle-ring ring-rose" />
              </div>
            </div>

            {/* 10% Opacity Frosted Glass Card */}
            <div className="glass-10-card card-tracked-feature border-glow-rose">
              {/* Header meta */}
              <div className="track-header-meta">
                <div className="meta-left">
                  <span className="ar-crosshair"><Activity size={11} className="text-rose" /></span>
                  <span className="ar-tag text-rose">TRACK: #02_LIVE_VITALS</span>
                </div>
                <span className="ar-live-pulse"><span className="pulse-dot dot-rose" /> 60Hz</span>
              </div>

              {/* 2-Column Split: Heart Rate & Steps */}
              <div className="track-grid-split">
                {/* Heart Rate + ECG */}
                <div className="split-column">
                  <div className="split-label-row">
                    <Heart size={11} className="text-rose anim-heart-beat" />
                    <span>Detak Jantung</span>
                  </div>
                  <div className="split-val-row">
                    <span className="split-big-val">78</span>
                    <span className="split-unit">BPM</span>
                  </div>
                  {/* Realtime ECG Path */}
                  <div className="ecg-track-wrap">
                    <svg className="ecg-mini-svg" viewBox="0 0 80 16" preserveAspectRatio="none">
                      <path
                        d="M0,8 L20,8 L24,2 L28,14 L32,6 L36,10 L40,8 L80,8"
                        fill="none"
                        stroke="#F43F5E"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        className="ecg-wave-line"
                      />
                    </svg>
                  </div>
                </div>

                {/* Steps Counter */}
                <div className="split-column">
                  <div className="split-label-row">
                    <Footprints size={11} className="text-cyan" />
                    <span>Langkah Harian</span>
                  </div>
                  <div className="split-val-row">
                    <span className="split-big-val">8,420</span>
                    <span className="split-unit">/ 10k</span>
                  </div>
                  {/* Shimmering step track */}
                  <div className="track-progress-bar">
                    <div className="track-progress-fill fill-cyan" style={{ width: '84%' }}>
                      <span className="bar-sweep-light" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PHASE 3: UPPER-LEFT FLANK 3D TRACKED — MACRO NUTRISI (6.6s - 9.2s) ── */}
        {activePhase === 3 && (
          <div
            className="tracking-node node-flank-left anim-track-spring-left"
            style={{
              transform: `translate3d(${driftX - 2}px, ${driftY}px, 15px) perspective(900px) rotateY(8deg) rotateX(1deg)`,
            }}
          >
            {/* AR Anchor crosshair pointing towards character */}
            <div className="ar-anchor-group anchor-to-right">
              <div className="ar-target-reticle">
                <span className="reticle-dot dot-emerald" />
                <span className="reticle-ring ring-emerald" />
              </div>
              <svg className="ar-line-svg" width="46" height="24" viewBox="0 0 46 24">
                <polyline
                  points="0,12 28,12 44,22"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                  className="ar-dash-anim"
                />
              </svg>
            </div>

            {/* 10% Opacity Frosted Glass Card */}
            <div className="glass-10-card card-tracked-feature border-glow-emerald">
              {/* Header meta */}
              <div className="track-header-meta">
                <div className="meta-left">
                  <span className="ar-crosshair"><Utensils size={11} className="text-emerald" /></span>
                  <span className="ar-tag text-emerald">TRACK: #03_MACRO_AI</span>
                </div>
                <span className="ar-live-pulse"><span className="pulse-dot dot-emerald" /> AUTO</span>
              </div>

              {/* 3 Macro Lines */}
              <div className="track-macro-stack">
                <div className="macro-bar-line">
                  <span className="m-name"><span className="m-dot dot-protein" /> Protein</span>
                  <div className="m-bar"><div className="m-fill fill-protein" style={{ width: '82%' }} /></div>
                  <span className="m-num">140g</span>
                </div>
                <div className="macro-bar-line">
                  <span className="m-name"><span className="m-dot dot-carbs" /> Karbo</span>
                  <div className="m-bar"><div className="m-fill fill-carbs" style={{ width: '70%' }} /></div>
                  <span className="m-num">210g</span>
                </div>
                <div className="macro-bar-line">
                  <span className="m-name"><span className="m-dot dot-fat" /> Lemak</span>
                  <div className="m-bar"><div className="m-fill fill-fat" style={{ width: '58%' }} /></div>
                  <span className="m-num">52g</span>
                </div>
              </div>

              {/* Hydration bar */}
              <div className="ar-hydration-pill">
                <Droplet size={11} className="text-cyan" />
                <span>Hidrasi: <strong>2,100 ml / 2,500 ml</strong> (84%)</span>
              </div>
            </div>
          </div>
        )}

        {/* ── PHASE 4: 3D CONVERGENCE CLIMAX (9.2s - 10.0s) ── */}
        {activePhase === 4 && (
          <div className="tracking-node node-center anim-converge-out">
            <div className="glass-10-card card-converge">
              <span className="pulse-dot dot-cyan" />
              <span className="converge-text">Menyiapkan Dashboard FitPulse...</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OpeningVideo;

