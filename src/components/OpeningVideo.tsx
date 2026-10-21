"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
 * OpeningVideo — Full-screen, cinematic splash that plays the mascot MP4.
 *
 * Behaviour:
 *  • Autoplays muted + inline so it works on iOS Safari & Android Chrome.
 *  • White background blends seamlessly with the video's white studio BG.
 *  • At CROSSFADE_START_S the overlay fades out via CSS opacity transition.
 *  • "Lewati" (Skip) pill appears after 1 s; tapping triggers the same fade.
 *  • Fallback: if the video can't play within VIDEO_READY_TIMEOUT_MS, or
 *    autoplay is blocked, it silently fades to the app.
 *  • After dismissal the <video> element is released (src='') to free memory.
 */
const OpeningVideo: React.FC<OpeningVideoProps> = ({ onComplete }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showSkip, setShowSkip] = useState(false);
  const [fading, setFading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const timeUpdateRef = useRef<boolean>(false);
  const hasCompletedRef = useRef(false);

  // ── Trigger the crossfade & cleanup ────────────────────────────────
  const triggerFade = useCallback(() => {
    if (fading || hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    setFading(true);
    markOpeningSeen();

    setTimeout(() => {
      // Release the video element to free memory
      if (videoRef.current) {
        videoRef.current.pause();
        videoRef.current.removeAttribute('src');
        videoRef.current.load();
      }
      setDismissed(true);
      onComplete();
    }, CROSSFADE_DURATION_MS);
  }, [fading, onComplete]);

  // ── Setup & fallback timer ────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    // Fallback: if video isn't playing within VIDEO_READY_TIMEOUT_MS, fade in app
    const fallbackTimer = setTimeout(() => {
      if (!timeUpdateRef.current && !hasCompletedRef.current) {
        triggerFade();
      }
    }, VIDEO_READY_TIMEOUT_MS + 3000); // Give some extra room beyond the 300ms poster

    // Show "Lewati" button after delay
    const skipTimer = setTimeout(() => {
      setShowSkip(true);
    }, SKIP_BUTTON_DELAY_MS);

    // Attempt autoplay
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay blocked → silently fade to app
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

  // ── Listen for the crossfade trigger point ────────────────────────
  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    timeUpdateRef.current = true;

    if (video.currentTime >= CROSSFADE_START_S && !hasCompletedRef.current) {
      triggerFade();
    }
  }, [triggerFade]);

  // ── Video ended (safety net if timeupdate fires late) ─────────────
  const handleEnded = useCallback(() => {
    if (!hasCompletedRef.current) {
      triggerFade();
    }
  }, [triggerFade]);

  // ── Video is playing, mark it as ready ────────────────────────────
  const handleCanPlay = useCallback(() => {
    timeUpdateRef.current = true;
  }, []);

  // ── Error handler: silently fall back ─────────────────────────────
  const handleError = useCallback(() => {
    if (!hasCompletedRef.current) {
      triggerFade();
    }
  }, [triggerFade]);

  if (dismissed) return null;

  return (
    <div
      className={`opening-overlay ${fading ? 'opening-fade-out' : ''}`}
      role="dialog"
      aria-label="Animasi pembuka FitPulse"
      aria-live="polite"
      style={{
        transitionDuration: `${CROSSFADE_DURATION_MS}ms`,
      }}
    >
      {/* Video element */}
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

      {/* "Lewati" (Skip) button */}
      {showSkip && !fading && (
        <button
          className="opening-skip-btn"
          onClick={triggerFade}
          aria-label="Lewati animasi pembuka"
        >
          Lewati
        </button>
      )}
    </div>
  );
};

export default OpeningVideo;
