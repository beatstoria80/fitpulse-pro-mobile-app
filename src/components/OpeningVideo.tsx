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
  ShieldCheck,
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
 * OpeningVideo — Professional VFX 3D Motion Tracked Presentation.
 *
 * Feature Positioning:
 *  • 0.0s - 1.4s : Intro Hero Kinetic Headline (Themed relatable copy, word rise & spread).
 *  • 1.4s - 4.0s : Feature 1 — MID-RIGHT FLANK (Torso/hip level, 10% glass, amber glow, AR line).
 *  • 4.0s - 6.8s : Feature 2 — BOTTOM-LEFT (Lower body/footstep level, 10% glass, rose ECG wave).
 *  • 6.8s - 8.8s : Feature 3 — MID-CENTER (Torso level, below chin, 10% glass, emerald macro rise).
 *  • 8.8s - 10.0s: VFX CLOSING PORTAL (Shockwave optical burst, laser scan, sync complete -> Dashboard warp).
 *
 * All cards utilize:
 *  - 10% Ultra-Translucent Frosted Glassmorphism (`rgba(255, 255, 255, 0.10)`).
 *  - High-impact dynamic RISE STYLE entry for all internal text, numbers, and icons.
 *  - Zero obstruction of mascot's face and head.
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
  // 0: Intro Kinetic Headline (0.0s - 1.4s) — Top/Center
  // 1: Feature 1 (1.4s - 4.0s) — MID-RIGHT FLANK (Calorie & Deficit)
  // 2: Feature 2 (4.0s - 6.8s) — BOTTOM-LEFT (Sensor Vitals & Steps)
  // 3: Feature 3 (6.8s - 8.8s) — MID-CENTER TORSO (Macro Nutrients)
  // 4: VFX Closing Portal (8.8s - 10.0s) — Shockwave Handoff
  let activePhase = 0;
  if (currentTime >= 8.8) activePhase = 4;
  else if (currentTime >= 6.8) activePhase = 3;
  else if (currentTime >= 4.0) activePhase = 2;
  else if (currentTime >= 1.4) activePhase = 1;

  // Subtle 3D camera drift & walking cadence (continuous floating parallax)
  const driftY = Math.sin(currentTime * 3.5) * 3;
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

      {/* 3D Multi-Position Tracking Stage */}
      <div className="opening-tracking-stage">

        {/* ── PHASE 0: INTRO HERO KINETIC HEADLINE (0.0s - 1.4s) ── */}
        {activePhase === 0 && (
          <div className="intro-hero-wrapper anim-intro-hero">
            <div className="intro-hero-badge anim-rise-1">
              <Sparkles size={11} className="icon-sparkle" />
              <span>FITPULSE PRO • AI HEALTH TRACKER</span>
            </div>
            <h1 className="intro-hero-headline anim-rise-2">
              KONTROL ENERGI,<br />KUASAI HARI
            </h1>
            <p className="intro-hero-sub anim-rise-3">
              Pelacakan Kalori & Kebugaran Generasi Baru
            </p>
          </div>
        )}

        {/* ── PHASE 1: SISI TENGAH KANAN — TARGET KALORI & DEFISIT (1.4s - 4.0s) ── */}
        {activePhase === 1 && (
          <div
            className="tracking-node node-mid-right anim-rise-spring"
            style={{
              transform: `translate3d(${driftX}px, ${driftY}px, 20px) perspective(900px) rotateY(-12deg) rotateX(3deg)`,
            }}
          >
            {/* AR Anchor crosshair pointing from left edge toward character */}
            <div className="ar-anchor-group anchor-to-left">
              <svg className="ar-line-svg" width="48" height="26" viewBox="0 0 48 26">
                <polyline
                  points="48,13 18,13 2,24"
                  fill="none"
                  stroke="#F59E0B"
                  strokeWidth="1.6"
                  strokeDasharray="3 2"
                  className="ar-dash-anim"
                />
              </svg>
              <div className="ar-target-reticle">
                <span className="reticle-dot dot-amber" />
                <span className="reticle-ring ring-amber" />
              </div>
            </div>

            {/* 10% Opacity Frosted Glass Card with Rise-Style Content */}
            <div className="glass-10-card card-mid-flank border-glow-amber">
              {/* Header meta */}
              <div className="track-header-meta anim-rise-1">
                <div className="meta-left">
                  <span className="ar-crosshair"><Target size={11} className="text-amber" /></span>
                  <span className="ar-tag text-amber">TRACK: #01_CALORIE_DEFICIT</span>
                </div>
                <span className="ar-live-pulse"><span className="pulse-dot dot-amber" /> LIVE</span>
              </div>

              {/* Body */}
              <div className="track-body-row anim-rise-2">
                <div className="track-metric-left">
                  <span className="track-label">Target Kalori Harian</span>
                  <div className="track-hero-num">
                    <span className="hero-val">2,150</span>
                    <span className="hero-unit">kkal</span>
                  </div>
                </div>

                {/* Circular Gauge */}
                <div className="track-mini-gauge anim-rise-3">
                  <svg className="gauge-svg" viewBox="0 0 44 44">
                    <circle cx="22" cy="22" r="18" className="gauge-bg" />
                    <circle cx="22" cy="22" r="18" className="gauge-val stroke-amber anim-gauge-fill" />
                  </svg>
                  <Flame size={14} className="gauge-icon text-amber anim-flame-pulse" />
                </div>
              </div>

              {/* Bottom stats row */}
              <div className="track-bottom-badges anim-rise-4">
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

        {/* ── PHASE 2: SISI KIRI BAWAH — SENSOR VITAL & LANGKAH (4.0s - 6.8s) ── */}
        {activePhase === 2 && (
          <div
            className="tracking-node node-bottom-left anim-rise-spring"
            style={{
              transform: `translate3d(${driftX}px, ${driftY}px, 20px) perspective(900px) rotateY(12deg) rotateX(-3deg)`,
            }}
          >
            {/* AR Anchor crosshair pointing from right edge toward character */}
            <div className="ar-anchor-group anchor-to-right-up">
              <div className="ar-target-reticle">
                <span className="reticle-dot dot-rose" />
                <span className="reticle-ring ring-rose" />
              </div>
              <svg className="ar-line-svg" width="48" height="26" viewBox="0 0 48 26">
                <polyline
                  points="0,18 24,18 46,6"
                  fill="none"
                  stroke="#F43F5E"
                  strokeWidth="1.6"
                  strokeDasharray="3 2"
                  className="ar-dash-anim"
                />
              </svg>
            </div>

            {/* 10% Opacity Frosted Glass Card with Rise-Style Content */}
            <div className="glass-10-card card-bottom-flank border-glow-rose">
              {/* Header meta */}
              <div className="track-header-meta anim-rise-1">
                <div className="meta-left">
                  <span className="ar-crosshair"><Activity size={11} className="text-rose" /></span>
                  <span className="ar-tag text-rose">TRACK: #02_LIVE_VITALS</span>
                </div>
                <span className="ar-live-pulse"><span className="pulse-dot dot-rose" /> SENSOR</span>
              </div>

              {/* 2-Column Split: Heart Rate & Steps */}
              <div className="track-grid-split">
                {/* Heart Rate + ECG */}
                <div className="split-column anim-rise-2">
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
                <div className="split-column anim-rise-3">
                  <div className="split-label-row">
                    <Footprints size={11} className="text-cyan" />
                    <span>Langkah Kaki</span>
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

        {/* ── PHASE 3: DI TENGAH LAYAR / TORSO LEVEL — MAKRO NUTRISI (6.8s - 8.8s) ── */}
        {activePhase === 3 && (
          <div
            className="tracking-node node-mid-center anim-rise-spring"
            style={{
              transform: `translate(-50%, -50%) translate3d(${driftX}px, ${driftY}px, 20px) perspective(900px) rotateX(4deg)`,
            }}
          >
            {/* 10% Opacity Frosted Glass Card with Rise-Style Content */}
            <div className="glass-10-card card-mid-center border-glow-emerald">
              {/* Header meta */}
              <div className="track-header-meta anim-rise-1">
                <div className="meta-left">
                  <span className="ar-crosshair"><Utensils size={11} className="text-emerald" /></span>
                  <span className="ar-tag text-emerald">TRACK: #03_MACRO_AI</span>
                </div>
                <span className="ar-live-pulse"><span className="pulse-dot dot-emerald" /> PRECISI</span>
              </div>

              {/* 3 Macro Lines */}
              <div className="track-macro-stack">
                <div className="macro-bar-line anim-rise-2">
                  <span className="m-name"><span className="m-dot dot-protein" /> Protein</span>
                  <div className="m-bar"><div className="m-fill fill-protein" style={{ width: '82%' }} /></div>
                  <span className="m-num">140g</span>
                </div>
                <div className="macro-bar-line anim-rise-3">
                  <span className="m-name"><span className="m-dot dot-carbs" /> Karbo</span>
                  <div className="m-bar"><div className="m-fill fill-carbs" style={{ width: '70%' }} /></div>
                  <span className="m-num">210g</span>
                </div>
                <div className="macro-bar-line anim-rise-4">
                  <span className="m-name"><span className="m-dot dot-fat" /> Lemak</span>
                  <div className="m-bar"><div className="m-fill fill-fat" style={{ width: '58%' }} /></div>
                  <span className="m-num">52g</span>
                </div>
              </div>

              {/* Hydration bar */}
              <div className="ar-hydration-pill anim-rise-5">
                <Droplet size={11} className="text-cyan" />
                <span>Hidrasi: <strong>2,100 ml / 2,500 ml</strong> (84%)</span>
              </div>
            </div>
          </div>
        )}

        {/* ── PHASE 4: PROFESSIONAL VFX CLOSING PORTAL (8.8s - 10.0s) ── */}
        {activePhase === 4 && (
          <div className="vfx-closing-stage anim-vfx-shockwave">
            {/* Expanding Optical Energy Ring */}
            <div className="vfx-energy-ring" />
            <div className="vfx-energy-ring ring-delay" />

            {/* Laser Grid Scan Line */}
            <div className="vfx-laser-scan" />

            {/* Cinematic Sync Card */}
            <div className="glass-10-card vfx-sync-card anim-rise-spring">
              <div className="vfx-sync-icon">
                <Sparkles size={22} className="icon-zap-pulse" />
              </div>
              <span className="vfx-sync-badge">SINKRONISASI AI SELESAI</span>
              <h2 className="vfx-sync-title">MEMASUKI DASHBOARD</h2>
              <p className="vfx-sync-sub">Menyiapkan metrik kesehatan personal Anda...</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default OpeningVideo;

