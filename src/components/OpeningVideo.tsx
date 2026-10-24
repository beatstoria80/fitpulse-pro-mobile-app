"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  OPENING_DURATION_S,
  CINEMATIC_END_S,
  HERO_SETTLE_S,
  STAGE_TRANSFORM_DURATION_MS,
  SKIP_BUTTON_DELAY_MS,
  CROSSFADE_DURATION_MS,
  VIDEO_READY_TIMEOUT_MS,
  VIDEO_SRC,
  HERO_THEME,
  HERO_COPY,
  markOpeningSeen,
} from '../lib/openingController';

interface OpeningVideoProps {
  /** Called when the opening is fully dismissed (CTA clicked, skipped, or ended) */
  onComplete: () => void;
}

/**
 * OpeningHero — Senior Product Design & Front-End Engineered Hero Experience.
 *
 * Core Principle:
 *  - Phase A (0.0s - 8.5s, Cinematic): Full-bleed video, no frame, no text over character.
 *    Only (1) "Lewati" skip button top-right (after 1s) and (2) 2px progress bar along the top.
 *  - Phase B (8.5s - 10.0s, Handoff): Smooth 700ms upward transform & scale so full character
 *    (head to sneakers) occupies top 60%. Solid bottom panel (sampled #EAEAEA) holds copy.
 *  - Phase C (10.0s+, Resting Hero): Video settles frontal, bottom panel copy staggers in.
 *    High contrast typography, strict 8px grid stack, 56px CTA, secondary link, zero scroll on 360x640.
 */
const OpeningVideo: React.FC<OpeningVideoProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [fading, setFading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [showSkipButton, setShowSkipButton] = useState(false);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  const hasCompletedRef = useRef(false);
  const timeUpdateRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  // ── Dismiss & Handoff to Dashboard ───────────────────────────────────
  const triggerDismiss = useCallback(() => {
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

  // ── Check Accessibility (prefers-reduced-motion) ─────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
      if (mediaQuery.matches) {
        setIsReducedMotion(true);
        setCurrentTime(HERO_SETTLE_S);
        setShowSkipButton(true);
      }
    }
  }, []);

  // ── Show Skip Button after Delay ─────────────────────────────────────
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSkipButton(true);
    }, SKIP_BUTTON_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // ── 60fps Animation Loop for silky smooth progress & choreography ─────
  useEffect(() => {
    if (isReducedMotion) return;

    let active = true;

    const loop = () => {
      if (!active) return;
      const vid = videoRef.current;
      if (vid && !vid.paused && !vid.ended) {
        const time = vid.currentTime;
        setCurrentTime(time);

        // When reaching 10.0s, keep character resting / subtle 1s loop at the hero frontal angle
        if (time >= HERO_SETTLE_S) {
          vid.currentTime = 9.1; // subtly loop the frontal hero stance
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
  }, [isReducedMotion]);

  // ── Fallback timer if autoplay fails ─────────────────────────────────
  useEffect(() => {
    if (isReducedMotion) return;

    const video = videoRef.current;
    if (!video) return;

    const fallbackTimer = setTimeout(() => {
      if (!timeUpdateRef.current && !hasCompletedRef.current) {
        // Autoplay blocked: jump to resting hero state
        setCurrentTime(HERO_SETTLE_S);
      }
    }, VIDEO_READY_TIMEOUT_MS);

    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked by browser policy: settle into resting hero layout
        setCurrentTime(HERO_SETTLE_S);
      });
    }

    return () => clearTimeout(fallbackTimer);
  }, [isReducedMotion]);

  const handleTimeUpdate = useCallback(() => {
    timeUpdateRef.current = true;
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
    }
  }, []);

  if (dismissed) return null;

  // ── Phases ───────────────────────────────────────────────────────────
  // Phase A: 0.0s - 8.5s (Cinematic)
  // Phase B: 8.5s - 10.0s (Handoff to Hero)
  // Phase C: 10.0s+ (Resting Hero)
  const isHeroPhase = isReducedMotion || currentTime >= CINEMATIC_END_S;
  const progressPercent = Math.min(100, (currentTime / OPENING_DURATION_S) * 100);

  return (
    <div
      className={`hero-viewport-container ${fading ? 'hero-fade-out' : ''}`}
      style={{
        backgroundColor: HERO_THEME.surface,
        transitionDuration: `${CROSSFADE_DURATION_MS}ms`,
      }}
      role="region"
      aria-label="FitPulse App Hero"
    >
      {/* 2px Progress Line Along Top */}
      <div
        className="hero-progress-track"
        style={{ backgroundColor: HERO_THEME.progressTrack }}
        aria-hidden="true"
      >
        <div
          className="hero-progress-fill"
          style={{
            width: `${progressPercent}%`,
            backgroundColor: HERO_THEME.brandBlue,
          }}
        />
      </div>

      {/* Top Safe-Area Skip Button (Appears after 1s, min 44x44px hit area) */}
      {showSkipButton && (
        <button
          className="hero-skip-btn"
          onClick={triggerDismiss}
          aria-label="Lewati intro dan masuk ke aplikasi"
        >
          {HERO_COPY.skip}
        </button>
      )}

      {/* Hero Content Wrapper (Mobile constrained on desktop, full-bleed on mobile) */}
      <div className={`hero-mobile-frame ${isHeroPhase ? 'phase-hero' : 'phase-cinematic'}`}>
        {/* ── Top 60% Stage: 3D Character Video ── */}
        <div
          className={`hero-video-stage ${isHeroPhase ? 'stage-shifted' : 'stage-cinematic'}`}
          style={{
            transitionDuration: `${STAGE_TRANSFORM_DURATION_MS}ms`,
          }}
        >
          <video
            ref={videoRef}
            className="hero-video-element"
            src={VIDEO_SRC}
            muted
            playsInline
            autoPlay
            preload="auto"
            onTimeUpdate={handleTimeUpdate}
            onError={() => setCurrentTime(HERO_SETTLE_S)}
          />
        </div>

        {/* ── Bottom 40% Panel: Solid Surface, High-Contrast Typography & CTA ── */}
        <div
          className={`hero-bottom-panel ${isHeroPhase ? 'panel-visible' : 'panel-hidden'}`}
          style={{
            backgroundColor: HERO_THEME.surface,
          }}
        >
          <div className="hero-copy-stack">
            {/* 1. Small Wordmark / App Name (13px semibold) */}
            <span className="hero-wordmark anim-stagger-1">
              {HERO_COPY.wordmark}
            </span>

            {/* 2. Headline (32/36px, weight 700, sentence case, tight tracking) */}
            <h1 className="hero-headline anim-stagger-2">
              {HERO_COPY.headline}
            </h1>

            {/* 3. Subtitle (16/24px, regular, 70% ink color) */}
            <p className="hero-subtitle anim-stagger-3">
              {HERO_COPY.subtitle}
            </p>

            {/* 4 & 5. 24px gap + Full-Width Primary CTA (56px height, 14px radius, brand blue) */}
            <div className="hero-cta-wrapper anim-stagger-4">
              <button
                className="hero-primary-cta"
                onClick={triggerDismiss}
                style={{
                  backgroundColor: HERO_THEME.brandBlue,
                  color: HERO_THEME.white,
                }}
              >
                {HERO_COPY.cta}
              </button>
            </div>

            {/* 6. Secondary Text Link (15px, 44px hit area) */}
            <div className="hero-secondary-wrapper anim-stagger-5">
              <button
                className="hero-secondary-link"
                onClick={triggerDismiss}
                style={{ color: HERO_THEME.ink }}
              >
                {HERO_COPY.secondary}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OpeningVideo;
