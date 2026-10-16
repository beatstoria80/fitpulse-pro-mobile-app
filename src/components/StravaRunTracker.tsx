"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';

export interface StravaRunSession {
  title: string;
  distanceKm: number;
  durationMinutes: number;
  calories: number;
  avgPace: string;
  avgHr: number;
  steps: number;
  elevationGain: number;
  capturedPhoto?: string;
}

interface StravaRunTrackerProps {
  userWeightKg?: number;
  onSaveRun?: (session: StravaRunSession) => void;
  onClose?: () => void;
}

interface RoutePoint {
  distKm: number;
  elevation: number;
  gradePct: number;
  targetPaceSec: number;
  bpm: number;
  cadence: number;
}

interface RoutePreset {
  id: string;
  name: string;
  subtitle: string;
  totalKm: number;
  elevationGain: number;
  svgPath: string; // SVG path d
  startLabel: string;
  finishLabel: string;
  splits: { km: number; paceStr: string; paceSec: number; elevation: number }[];
  profilePoints: RoutePoint[];
}

// 3 Curated Realistic Athletic Routes
const ROUTE_PRESETS: RoutePreset[] = [
  {
    id: 'gbk-loop',
    name: 'GBK Senayan Epic Loop',
    subtitle: 'Rute Ikonik Datar & Cepat • Aspal Mulus',
    totalKm: 5.0,
    elevationGain: 28,
    svgPath: 'M 45 195 C 35 150 45 95 90 60 C 145 25 210 30 270 50 C 330 70 365 110 360 160 C 355 205 310 230 250 225 C 190 220 155 185 130 190 C 100 195 70 220 45 195',
    startLabel: 'Pintu 1 Senayan (Start)',
    finishLabel: 'Plaza Barat GBK (Finish)',
    splits: [
      { km: 1, paceStr: "05:15", paceSec: 315, elevation: 14 },
      { km: 2, paceStr: "05:05", paceSec: 305, elevation: 18 },
      { km: 3, paceStr: "05:22", paceSec: 322, elevation: 26 },
      { km: 4, paceStr: "04:58", paceSec: 298, elevation: 22 },
      { km: 5, paceStr: "05:10", paceSec: 310, elevation: 16 }
    ],
    profilePoints: [
      { distKm: 0.0, elevation: 14, gradePct: 0.0, targetPaceSec: 320, bpm: 138, cadence: 165 },
      { distKm: 1.0, elevation: 16, gradePct: 0.8, targetPaceSec: 315, bpm: 148, cadence: 168 },
      { distKm: 2.0, elevation: 22, gradePct: 1.5, targetPaceSec: 305, bpm: 156, cadence: 172 },
      { distKm: 3.0, elevation: 28, gradePct: 2.1, targetPaceSec: 322, bpm: 164, cadence: 170 },
      { distKm: 4.0, elevation: 20, gradePct: -1.2, targetPaceSec: 298, bpm: 168, cadence: 178 },
      { distKm: 5.0, elevation: 15, gradePct: 0.2, targetPaceSec: 310, bpm: 162, cadence: 174 }
    ]
  },
  {
    id: 'sudirman-night',
    name: 'Sudirman - Thamrin City Sprint',
    subtitle: 'Rute Metropolitan Malam • Fast Urban Pavement',
    totalKm: 7.2,
    elevationGain: 44,
    svgPath: 'M 50 45 C 90 40 140 75 160 120 C 180 165 190 210 230 220 C 275 230 330 200 350 145 C 365 105 340 60 295 55 C 260 50 240 85 220 125 C 205 160 230 195 260 215',
    startLabel: 'Bundaran HI (Start)',
    finishLabel: 'FX Sudirman (Finish)',
    splits: [
      { km: 1, paceStr: "05:10", paceSec: 310, elevation: 18 },
      { km: 2, paceStr: "04:55", paceSec: 295, elevation: 20 },
      { km: 3, paceStr: "04:50", paceSec: 290, elevation: 24 },
      { km: 4, paceStr: "05:08", paceSec: 308, elevation: 32 },
      { km: 5, paceStr: "04:48", paceSec: 288, elevation: 26 },
      { km: 6, paceStr: "05:02", paceSec: 302, elevation: 22 },
      { km: 7.2, paceStr: "04:42", paceSec: 282, elevation: 18 }
    ],
    profilePoints: [
      { distKm: 0.0, elevation: 18, gradePct: 0.2, targetPaceSec: 315, bpm: 140, cadence: 166 },
      { distKm: 1.5, elevation: 22, gradePct: 0.5, targetPaceSec: 300, bpm: 152, cadence: 170 },
      { distKm: 3.0, elevation: 34, gradePct: 1.8, targetPaceSec: 295, bpm: 162, cadence: 174 },
      { distKm: 4.5, elevation: 42, gradePct: 2.4, targetPaceSec: 312, bpm: 169, cadence: 172 },
      { distKm: 6.0, elevation: 28, gradePct: -1.6, targetPaceSec: 292, bpm: 166, cadence: 178 },
      { distKm: 7.2, elevation: 19, gradePct: -0.4, targetPaceSec: 282, bpm: 172, cadence: 182 }
    ]
  },
  {
    id: 'dago-trail',
    name: 'Dago Hill Ridge Pakar Trail',
    subtitle: 'Rute Trail & Elevasi Menantang • Udara Sejuk',
    totalKm: 6.4,
    elevationGain: 165,
    svgPath: 'M 40 220 C 70 215 90 170 120 165 C 160 160 140 100 180 85 C 220 70 240 130 275 140 C 310 150 330 90 355 65 C 370 50 380 40 370 30',
    startLabel: 'Tahura Juanda (Start)',
    finishLabel: 'Tebing Keraton Peak (Finish)',
    splits: [
      { km: 1, paceStr: "05:45", paceSec: 345, elevation: 760 },
      { km: 2, paceStr: "06:12", paceSec: 372, elevation: 795 },
      { km: 3, paceStr: "06:35", paceSec: 395, elevation: 840 },
      { km: 4, paceStr: "06:50", paceSec: 410, elevation: 890 },
      { km: 5, paceStr: "05:55", paceSec: 355, elevation: 915 },
      { km: 6.4, paceStr: "06:20", paceSec: 380, elevation: 925 }
    ],
    profilePoints: [
      { distKm: 0.0, elevation: 760, gradePct: 3.5, targetPaceSec: 345, bpm: 145, cadence: 158 },
      { distKm: 1.5, elevation: 805, gradePct: 5.8, targetPaceSec: 375, bpm: 162, cadence: 156 },
      { distKm: 3.0, elevation: 855, gradePct: 7.2, targetPaceSec: 400, bpm: 172, cadence: 154 },
      { distKm: 4.5, elevation: 900, gradePct: 6.0, targetPaceSec: 410, bpm: 176, cadence: 152 },
      { distKm: 5.5, elevation: 918, gradePct: 2.1, targetPaceSec: 360, bpm: 168, cadence: 164 },
      { distKm: 6.4, elevation: 925, gradePct: 1.0, targetPaceSec: 380, bpm: 170, cadence: 166 }
    ]
  }
];

export const StravaRunTracker: React.FC<StravaRunTrackerProps> = ({
  userWeightKg = 69,
  onSaveRun,
  onClose
}) => {
  // Active route
  const [selectedRouteId, setSelectedRouteId] = useState<string>('gbk-loop');
  const activeRoute = useMemo(() => {
    return ROUTE_PRESETS.find(r => r.id === selectedRouteId) || ROUTE_PRESETS[0];
  }, [selectedRouteId]);

  // Run progress state (0 to 1)
  const [progress, setProgress] = useState<number>(0.28);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [mapStyle, setMapStyle] = useState<'strava' | 'neon' | 'satellite' | 'camera'>('strava');
  const [audioCues, setAudioCues] = useState<boolean>(true);
  const [autoPause, setAutoPause] = useState<boolean>(false);
  const [showSaveModal, setShowSaveModal] = useState<boolean>(false);
  const [hoveredSplitKm, setHoveredSplitKm] = useState<number | null>(null);

  // ================= CAMERA & CAPTURE STATE =================
  const [showCaptureStudio, setShowCaptureStudio] = useState<boolean>(false);
  const [cameraFacing, setCameraFacing] = useState<'environment' | 'user'>('environment');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [capturedPhotoUrl, setCapturedPhotoUrl] = useState<string | null>(null);
  const [isFlashing, setIsFlashing] = useState<boolean>(false);
  const [overlayStyle, setOverlayStyle] = useState<'classic' | 'ar-route' | 'minimal'>('classic');
  const [uploadedBgUrl, setUploadedBgUrl] = useState<string | null>(null);

  // References
  const svgPathRef = useRef<SVGPathElement | null>(null);
  const [pathLength, setPathLength] = useState<number>(1000);
  const [runnerCoord, setRunnerCoord] = useState<{ x: number; y: number; angle: number }>({ x: 45, y: 195, angle: 0 });

  // Camera Video Streams
  const mapVideoRef = useRef<HTMLVideoElement | null>(null);
  const studioVideoRef = useRef<HTMLVideoElement | null>(null);
  const activeStreamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Measure path length once mounted or route changed
  useEffect(() => {
    if (svgPathRef.current) {
      const len = svgPathRef.current.getTotalLength();
      setPathLength(len);
      updateRunnerPosition(progress, len);
    }
  }, [activeRoute, svgPathRef]);

  // Function to calculate runner (x, y) and heading angle based on progress (0 to 1)
  const updateRunnerPosition = useCallback((prog: number, totalLen: number) => {
    if (!svgPathRef.current) return;
    const clamped = Math.max(0, Math.min(1, prog));
    const currentDist = clamped * totalLen;
    const pt = svgPathRef.current.getPointAtLength(currentDist);

    const delta = Math.min(2, totalLen - currentDist);
    const nextPt = svgPathRef.current.getPointAtLength(Math.min(totalLen, currentDist + (delta > 0 ? delta : -2)));
    const angleRad = Math.atan2(nextPt.y - pt.y, nextPt.x - pt.x);
    const angleDeg = (angleRad * 180) / Math.PI;

    setRunnerCoord({ x: pt.x, y: pt.y, angle: angleDeg });
  }, []);

  useEffect(() => {
    if (pathLength > 0) {
      updateRunnerPosition(progress, pathLength);
    }
  }, [progress, pathLength, updateRunnerPosition]);

  // Live Timer & GPS Simulation Loop
  useEffect(() => {
    if (!isRunning) return;

    const intervalMs = 100;
    const stepRatio = (0.00045 * simSpeed);

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + stepRatio;
        if (next >= 1.0) {
          setIsRunning(false);
          triggerCompletionCelebration();
          return 1.0;
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isRunning, simSpeed]);

  const triggerCompletionCelebration = () => {
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {
      // fallback
    }
    setShowSaveModal(true);
  };

  // Interpolated Live Telemetry Metrics
  const telemetry = useMemo(() => {
    const currentDistKm = Number((progress * activeRoute.totalKm).toFixed(2));
    const points = activeRoute.profilePoints;
    let currElev = points[0].elevation;
    let currGrade = points[0].gradePct;
    let targetPace = points[0].targetPaceSec;
    let heartRate = points[0].bpm;
    let cadence = points[0].cadence;

    for (let i = 0; i < points.length - 1; i++) {
      const p1 = points[i];
      const p2 = points[i + 1];
      if (currentDistKm >= p1.distKm && currentDistKm <= p2.distKm) {
        const span = p2.distKm - p1.distKm || 1;
        const ratio = (currentDistKm - p1.distKm) / span;
        currElev = Math.round(p1.elevation + ratio * (p2.elevation - p1.elevation));
        currGrade = Number((p1.gradePct + ratio * (p2.gradePct - p1.gradePct)).toFixed(1));
        targetPace = Math.round(p1.targetPaceSec + ratio * (p2.targetPaceSec - p1.targetPaceSec));
        heartRate = Math.round(p1.bpm + ratio * (p2.bpm - p1.bpm));
        cadence = Math.round(p1.cadence + ratio * (p2.cadence - p1.cadence));
        break;
      }
    }

    if (isRunning) {
      const noise = (Math.sin(Date.now() / 800) * 4);
      targetPace = Math.max(240, Math.round(targetPace + noise));
      heartRate = Math.max(120, Math.round(heartRate + (noise > 0 ? 1 : -1)));
    }

    const paceMin = Math.floor(targetPace / 60);
    const paceSec = targetPace % 60;
    const paceStr = `${paceMin}'${paceSec < 10 ? '0' : ''}${paceSec}"`;

    const elapsedMinutes = (currentDistKm * (targetPace / 60));
    const totalSecs = Math.round(elapsedMinutes * 60);
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    const timeFormatted = hours > 0
      ? `${hours}:${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`
      : `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;

    const caloriesBurned = Math.round(userWeightKg * currentDistKm * 1.036);
    const stepsCounted = Math.round(currentDistKm * 1280);

    let hrZone = "Z3 Aerobik";
    let hrColor = "#10B981";
    if (heartRate >= 165) {
      hrZone = "Z5 VO2 Max (Sprint)";
      hrColor = "#EF4444";
    } else if (heartRate >= 155) {
      hrZone = "Z4 Ambang Laktat";
      hrColor = "#FF8008";
    } else if (heartRate >= 140) {
      hrZone = "Z3 Aerobik Stabil";
      hrColor = "#00F2FE";
    } else {
      hrZone = "Z2 Pemulihan";
      hrColor = "#38EF7D";
    }

    return {
      currentDistKm,
      paceStr,
      targetPace,
      timeFormatted,
      elapsedMinutes: Math.round(elapsedMinutes),
      caloriesBurned,
      stepsCounted,
      currElev,
      currGrade,
      heartRate,
      cadence,
      hrZone,
      hrColor
    };
  }, [progress, activeRoute, isRunning, userWeightKg]);

  // ================= CAMERA ACCESS & STREAM CONTROLS =================
  const startCamera = useCallback(async (videoElement: HTMLVideoElement | null, facing: 'environment' | 'user') => {
    if (!videoElement) return;

    // Stop prior stream tracks
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Kamera tidak didukung oleh peramban ini.");
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: facing,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      });

      activeStreamRef.current = stream;
      videoElement.srcObject = stream;
      await videoElement.play().catch(() => {});
      setCameraActive(true);
      setCameraError(null);
    } catch (err: any) {
      console.warn("Gagal membuka kamera:", err);
      setCameraActive(false);
      setCameraError(
        err?.message || "Izin kamera ditolak. Anda dapat menggunakan latar simulasi lari atau unggah foto."
      );
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (activeStreamRef.current) {
      activeStreamRef.current.getTracks().forEach(track => track.stop());
      activeStreamRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Sync camera when mapStyle switches to 'camera' or studio opens
  useEffect(() => {
    if (mapStyle === 'camera') {
      startCamera(mapVideoRef.current, cameraFacing);
    } else if (!showCaptureStudio) {
      stopCamera();
    }
  }, [mapStyle, showCaptureStudio, cameraFacing, startCamera, stopCamera]);

  useEffect(() => {
    if (showCaptureStudio) {
      startCamera(studioVideoRef.current, cameraFacing);
    }
  }, [showCaptureStudio, cameraFacing, startCamera]);

  // Clean up stream on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Toggle Camera Facing
  const handleToggleFacing = () => {
    const nextFacing = cameraFacing === 'environment' ? 'user' : 'environment';
    setCameraFacing(nextFacing);
  };

  // Handle Photo Upload as Background Fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedBgUrl(event.target?.result as string);
        setCameraError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  // ================= CAPTURE PHOTO WITH LIVE BACKGROUND & OVERLAY =================
  const handleCapturePhoto = () => {
    setIsFlashing(true);
    setTimeout(() => setIsFlashing(false), 300);

    // Create high-res canvas (1080x1350 for Instagram Story/Post)
    const canvas = document.createElement('canvas');
    canvas.width = 1080;
    canvas.height = 1350;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // 1. Draw Camera Frame or Uploaded Background
    let drawnBg = false;
    const currentVideo = showCaptureStudio ? studioVideoRef.current : mapVideoRef.current;

    if (currentVideo && currentVideo.readyState >= 2) {
      const vRatio = currentVideo.videoWidth / currentVideo.videoHeight;
      const cRatio = canvas.width / canvas.height;
      let sWidth = currentVideo.videoWidth;
      let sHeight = currentVideo.videoHeight;
      let sx = 0;
      let sy = 0;
      if (vRatio > cRatio) {
        sWidth = currentVideo.videoHeight * cRatio;
        sx = (currentVideo.videoWidth - sWidth) / 2;
      } else {
        sHeight = currentVideo.videoWidth / cRatio;
        sy = (currentVideo.videoHeight - sHeight) / 2;
      }
      ctx.drawImage(currentVideo, sx, sy, sWidth, sHeight, 0, 0, canvas.width, canvas.height);
      drawnBg = true;
    } else if (uploadedBgUrl) {
      const img = new Image();
      img.src = uploadedBgUrl;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      drawnBg = true;
    }

    if (!drawnBg) {
      // Atmospheric Athletic Running Background Gradient
      const grad = ctx.createLinearGradient(0, 0, 0, canvas.height);
      grad.addColorStop(0, '#0a101d');
      grad.addColorStop(0.4, '#152238');
      grad.addColorStop(1, '#05080e');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    // 2. Realistic Athletic Vignette & Shading
    const vignette = ctx.createLinearGradient(0, 0, 0, canvas.height);
    vignette.addColorStop(0, 'rgba(0, 0, 0, 0.55)');
    vignette.addColorStop(0.3, 'rgba(0, 0, 0, 0.15)');
    vignette.addColorStop(0.65, 'rgba(0, 0, 0, 0.45)');
    vignette.addColorStop(1, 'rgba(0, 0, 0, 0.92)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // 3. Header Branding Watermark
    ctx.save();
    // Orange Strava Pill
    ctx.fillStyle = '#FC5200';
    ctx.beginPath();
    ctx.roundRect(60, 60, 160, 42, 21);
    ctx.fill();

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 18px "Outfit", sans-serif';
    ctx.fillText('STRAVA GPS', 82, 88);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 32px "Outfit", sans-serif';
    ctx.fillText(activeRoute.name, 60, 150);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.font = '600 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }) +
        ' • FitPulse Pro',
      60,
      185
    );
    ctx.restore();

    // 4. Draw GPS Route Path
    ctx.save();
    const path2D = new Path2D(activeRoute.svgPath);
    ctx.translate(60, 220);
    ctx.scale(2.4, 2.4);

    // Path Shadow & Base
    ctx.lineWidth = 14;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke(path2D);

    // Path Glow
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#FC5200';
    ctx.shadowColor = '#FC5200';
    ctx.shadowBlur = 18;
    ctx.stroke(path2D);

    // Runner Dot on Canvas
    ctx.fillStyle = '#00F2FE';
    ctx.shadowColor = '#00F2FE';
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(runnerCoord.x, runnerCoord.y, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // 5. Huge Strava Telemetry HUD Card
    ctx.save();
    ctx.fillStyle = 'rgba(10, 16, 28, 0.88)';
    ctx.beginPath();
    ctx.roundRect(60, 920, 960, 360, 32);
    ctx.fill();
    ctx.strokeStyle = 'rgba(252, 82, 0, 0.4)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Distance
    ctx.fillStyle = '#94A3B8';
    ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('JARAK TEMPUH', 110, 980);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '900 86px "Outfit", sans-serif';
    ctx.fillText(`${telemetry.currentDistKm} KM`, 110, 1070);

    // Column 2: Pace, Waktu, Elevasi
    const col2X = 540;
    ctx.fillStyle = '#94A3B8';
    ctx.font = '800 20px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('PACE RATA-RATA', col2X, 980);

    ctx.fillStyle = '#00F2FE';
    ctx.font = '800 52px "Outfit", sans-serif';
    ctx.fillText(`${telemetry.paceStr} /km`, col2X, 1040);

    // Row 2 of HUD Card
    ctx.fillStyle = '#94A3B8';
    ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('WAKTU TEMPUH', 110, 1140);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '800 44px "Outfit", sans-serif';
    ctx.fillText(telemetry.timeFormatted, 110, 1195);

    ctx.fillStyle = '#94A3B8';
    ctx.font = '800 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('ELEVASI & KALORI', col2X, 1140);
    ctx.fillStyle = '#FF8008';
    ctx.font = '800 44px "Outfit", sans-serif';
    ctx.fillText(`+${telemetry.currElev}m • ${telemetry.caloriesBurned} kkal`, col2X, 1195);

    ctx.restore();

    // Convert to Image URL
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedPhotoUrl(dataUrl);

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.7 }
      });
    } catch {
      // fallback
    }
  };

  // Download Captured Photo
  const handleDownloadPhoto = () => {
    if (!capturedPhotoUrl) return;
    const a = document.createElement('a');
    a.href = capturedPhotoUrl;
    a.download = `Strava_FitPulse_${activeRoute.id}_${telemetry.currentDistKm}KM.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // Web Share API
  const handleSharePhoto = async () => {
    if (!capturedPhotoUrl) return;
    try {
      const res = await fetch(capturedPhotoUrl);
      const blob = await res.blob();
      const file = new File([blob], 'strava_run.jpg', { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: `Lari ${telemetry.currentDistKm} km bersama Strava & FitPulse!`,
          text: `Selesai lari rute ${activeRoute.name}: ${telemetry.currentDistKm} km, pace ${telemetry.paceStr}, elevasi +${telemetry.currElev}m!`,
          files: [file]
        });
      } else {
        handleDownloadPhoto();
      }
    } catch (err) {
      handleDownloadPhoto();
    }
  };

  // Jump to specific kilometer split
  const handleJumpToKm = (targetKm: number) => {
    const ratio = Math.min(1, Math.max(0, targetKm / activeRoute.totalKm));
    setProgress(ratio);
  };

  // Toggle running state
  const handleToggleRun = () => {
    if (progress >= 1.0) {
      setProgress(0);
    }
    setIsRunning(!isRunning);
  };

  // Reset tracker
  const handleReset = () => {
    setIsRunning(false);
    setProgress(0);
  };

  // Save Session to Activities Log
  const handleSaveAndLog = () => {
    const session: StravaRunSession = {
      title: `Lari ${activeRoute.name}`,
      distanceKm: telemetry.currentDistKm,
      durationMinutes: Math.max(1, telemetry.elapsedMinutes),
      calories: telemetry.caloriesBurned,
      avgPace: telemetry.paceStr,
      avgHr: telemetry.heartRate,
      steps: telemetry.stepsCounted,
      elevationGain: activeRoute.elevationGain,
      capturedPhoto: capturedPhotoUrl || undefined
    };

    if (onSaveRun) {
      onSaveRun(session);
    }
    setShowSaveModal(false);
  };

  // Compute positions of KM Markers along the path
  const splitMarkers = useMemo(() => {
    if (!svgPathRef.current || pathLength <= 0) return [];
    return activeRoute.splits.map(split => {
      const ratio = split.km / activeRoute.totalKm;
      const point = svgPathRef.current!.getPointAtLength(ratio * pathLength);
      return {
        ...split,
        x: point.x,
        y: point.y
      };
    });
  }, [activeRoute, pathLength]);

  return (
    <div className="strava-run-container">
      {/* Hidden File Input for Background Upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        style={{ display: 'none' }}
      />

      {/* Camera Shutter Flash Effect */}
      {isFlashing && <div className="camera-flash-overlay"></div>}

      {/* ================= 1. STRAVA HEADER & ROUTE SELECTOR ================= */}
      <div className="strava-header">
        <div className="strava-brand-row">
          <div className="strava-brand">
            <span className="strava-logo-icon">
              <i className="fa-solid fa-person-running"></i>
            </span>
            <div>
              <div className="strava-title-line">
                <span className="strava-title">STRAVA GPS TRACK</span>
                <span className="strava-live-pill">
                  <span className="pulse-dot"></span> LIVE GPS
                </span>
              </div>
              <span className="strava-subtitle">Jalur Telemetri & Kamera AR Lari</span>
            </div>
          </div>

          <div className="header-action-pills">
            {/* Quick Capture Studio Button */}
            <button
              className="btn-open-camera-studio"
              onClick={() => setShowCaptureStudio(true)}
              title="Buka Kamera & Capture Foto Lari"
            >
              <i className="fa-solid fa-camera"></i>
              <span>Foto Lari</span>
            </button>

            <div className="strava-gps-badge">
              <i className="fa-solid fa-satellite"></i>
              <span>3m Akurat</span>
            </div>
          </div>
        </div>

        {/* Route Selector Pills */}
        <div className="strava-route-pills">
          {ROUTE_PRESETS.map(route => (
            <button
              key={route.id}
              className={`route-pill-btn ${selectedRouteId === route.id ? 'active' : ''}`}
              onClick={() => {
                setSelectedRouteId(route.id);
                setProgress(0.25);
                setIsRunning(false);
              }}
            >
              <span className="pill-name">{route.name}</span>
              <span className="pill-km">{route.totalKm} km</span>
            </button>
          ))}
        </div>
      </div>

      {/* ================= 2. INTERACTIVE VECTOR MAP & RUN PATH (WITH CAMERA AR) ================= */}
      <div className={`strava-map-card map-${mapStyle}`}>
        {/* Map Header Toolbar */}
        <div className="map-toolbar">
          <div className="route-info-tag">
            <i className="fa-solid fa-location-dot"></i>
            <span>{activeRoute.name}</span>
          </div>

          <div className="map-actions">
            {/* Style Switcher with Camera AR Mode */}
            <div className="map-style-toggle">
              <button
                className={`style-btn ${mapStyle === 'strava' ? 'active' : ''}`}
                onClick={() => setMapStyle('strava')}
                title="Strava Orange Heatmap"
              >
                🔥 Heatmap
              </button>
              <button
                className={`style-btn ${mapStyle === 'neon' ? 'active' : ''}`}
                onClick={() => setMapStyle('neon')}
                title="Dark Cyber Neon"
              >
                ⚡ Cyber
              </button>
              <button
                className={`style-btn ${mapStyle === 'camera' ? 'active' : ''}`}
                onClick={() => setMapStyle('camera')}
                title="Latar Kamera Nyata (AR Mode)"
              >
                📷 Kamera AR
              </button>
            </div>

            {/* Camera Facing Flip button when AR is active */}
            {mapStyle === 'camera' && (
              <button
                className="map-recenter-btn"
                onClick={handleToggleFacing}
                title="Putar Kamera (Depan / Belakang)"
              >
                <i className="fa-solid fa-camera-rotate"></i>
              </button>
            )}

            {/* Instant Snap Button on Map */}
            <button
              className="map-recenter-btn highlight-camera-btn"
              onClick={handleCapturePhoto}
              title="Ambil Foto Rute dengan Latar Kamera"
            >
              <i className="fa-solid fa-camera"></i>
            </button>

            <button
              className="map-recenter-btn"
              onClick={() => updateRunnerPosition(progress, pathLength)}
              title="Pusatkan ke Pelari"
            >
              <i className="fa-solid fa-crosshairs"></i>
            </button>
          </div>
        </div>

        {/* SVG Interactive Canvas with Camera Stream Underneath */}
        <div className="map-canvas-wrapper">
          {/* Real Device Camera Background in AR Mode */}
          {mapStyle === 'camera' && (
            <div className="camera-ar-background-container">
              <video
                ref={mapVideoRef}
                className="map-camera-stream"
                autoPlay
                playsInline
                muted
              />
              <div className="camera-lens-grid"></div>
              {cameraError && (
                <div className="camera-error-banner">
                  <span>{cameraError}</span>
                  <button
                    className="btn-upload-fallback-sm"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Unggah Latar Foto
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Uploaded Background Fallback if available */}
          {uploadedBgUrl && mapStyle === 'camera' && !cameraActive && (
            <img src={uploadedBgUrl} alt="Latar Foto" className="uploaded-bg-layer" />
          )}

          {/* Subtle Grid Lines & Compass (hidden or dimmed in camera mode) */}
          {mapStyle !== 'camera' && <div className="map-grid-overlay"></div>}
          <div className="map-compass">
            <span className="compass-n">U</span>
            <div className="compass-needle"></div>
          </div>
          <div className="map-scale-bar">
            <span>200m</span>
            <div className="scale-line"></div>
          </div>

          <svg
            className="strava-svg-map"
            viewBox="0 0 400 260"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <linearGradient id="stravaOrangeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FF5722" />
                <stop offset="50%" stopColor="#FC5200" />
                <stop offset="100%" stopColor="#FFA000" />
              </linearGradient>

              <linearGradient id="cyberNeonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00F2FE" />
                <stop offset="50%" stopColor="#4FACFE" />
                <stop offset="100%" stopColor="#38EF7D" />
              </linearGradient>

              <filter id="glowEffect" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {/* Background Base Track */}
            <path
              d={activeRoute.svgPath}
              fill="none"
              stroke={mapStyle === 'camera' ? 'rgba(0, 0, 0, 0.65)' : 'rgba(255, 255, 255, 0.12)'}
              strokeWidth={mapStyle === 'camera' ? "12" : "10"}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Inner Road Guide */}
            <path
              d={activeRoute.svgPath}
              fill="none"
              stroke="rgba(0, 0, 0, 0.4)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Main Active Route Line */}
            <path
              ref={svgPathRef}
              d={activeRoute.svgPath}
              fill="none"
              stroke={mapStyle === 'neon' ? 'url(#cyberNeonGrad)' : 'url(#stravaOrangeGrad)'}
              strokeWidth={mapStyle === 'camera' ? "6" : "5"}
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glowEffect)"
            />

            {/* Progress Traveled Line */}
            <path
              d={activeRoute.svgPath}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeDasharray={`${progress * pathLength} ${pathLength}`}
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* START POINT */}
            <g className="map-pin start-pin" transform="translate(45, 195)">
              <circle r="12" fill="rgba(16, 185, 129, 0.3)" className="pulse-wave" />
              <circle r="7" fill="#10B981" stroke="#FFFFFF" strokeWidth="2" />
              <rect x="-18" y="-32" width="36" height="18" rx="9" fill="#10B981" />
              <text x="0" y="-20" textAnchor="middle" fill="#FFFFFF" fontSize="9" fontWeight="800">
                START
              </text>
            </g>

            {/* FINISH POINT */}
            <g
              className="map-pin finish-pin"
              transform={
                activeRoute.id === 'gbk-loop'
                  ? 'translate(250, 225)'
                  : activeRoute.id === 'sudirman-night'
                  ? 'translate(260, 215)'
                  : 'translate(370, 30)'
              }
            >
              <circle r="12" fill="rgba(245, 158, 11, 0.3)" className="pulse-wave" />
              <circle r="7" fill="#F59E0B" stroke="#FFFFFF" strokeWidth="2" />
              <rect x="-20" y="-32" width="40" height="18" rx="9" fill="#F59E0B" />
              <text x="0" y="-20" textAnchor="middle" fill="#0c121d" fontSize="9" fontWeight="800">
                FINISH
              </text>
            </g>

            {/* INTERACTIVE KILOMETER SPLIT MARKERS */}
            {splitMarkers.map((marker) => {
              const isPassed = progress >= marker.km / activeRoute.totalKm;
              return (
                <g
                  key={marker.km}
                  className={`split-marker ${isPassed ? 'passed' : ''}`}
                  transform={`translate(${marker.x}, ${marker.y})`}
                  onClick={() => handleJumpToKm(marker.km)}
                  onMouseEnter={() => setHoveredSplitKm(marker.km)}
                  onMouseLeave={() => setHoveredSplitKm(null)}
                  style={{ cursor: 'pointer' }}
                >
                  <circle
                    r="8"
                    fill={isPassed ? '#FC5200' : 'rgba(30, 41, 59, 0.95)'}
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="3"
                    textAnchor="middle"
                    fill="#FFFFFF"
                    fontSize="7"
                    fontWeight="800"
                  >
                    {marker.km}K
                  </text>
                </g>
              );
            })}

            {/* RUNNER POSITION BEACON */}
            <g
              className="runner-beacon"
              transform={`translate(${runnerCoord.x}, ${runnerCoord.y})`}
            >
              <circle r="18" fill="rgba(0, 242, 254, 0.25)" className="pulse-wave" />
              <circle r="11" fill="rgba(0, 242, 254, 0.45)" />
              <circle r="6" fill="#00F2FE" stroke="#FFFFFF" strokeWidth="2" />
              <polygon
                points="0,-12 4,-6 -4,-6"
                fill="#00F2FE"
                transform={`rotate(${runnerCoord.angle + 90})`}
              />
            </g>
          </svg>

          {/* Floating Runner Telemetry Tooltip */}
          <div
            className="runner-floating-hud"
            style={{
              left: `${Math.min(75, Math.max(15, (runnerCoord.x / 400) * 100))}%`,
              top: `${Math.min(75, Math.max(15, (runnerCoord.y / 260) * 100))}%`
            }}
          >
            <div className="hud-metric">
              <span className="lbl">Pace</span>
              <span className="val">{telemetry.paceStr}</span>
            </div>
            <div className="hud-divider"></div>
            <div className="hud-metric">
              <span className="lbl">Elev</span>
              <span className="val">+{telemetry.currElev}m</span>
            </div>
          </div>
        </div>

        {/* Map Footer Route Points */}
        <div className="map-footer-labels">
          <div className="label-item">
            <span className="dot dot-green"></span>
            <span className="text">{activeRoute.startLabel}</span>
          </div>
          <div className="label-item">
            <span className="dot dot-gold"></span>
            <span className="text">{activeRoute.finishLabel}</span>
          </div>
        </div>
      </div>

      {/* ================= 3. STRAVA RUNNING HUD (BIG TELEMETRY METRICS) ================= */}
      <div className="strava-hud-card">
        {/* Top Giant Distance Display */}
        <div className="hud-primary-distance">
          <span className="hud-small-lbl">JARAK TEMPUH</span>
          <div className="big-distance-row">
            <span className="big-km-number">{telemetry.currentDistKm}</span>
            <span className="big-km-unit">KM</span>
            <span className="target-km-badge">/ {activeRoute.totalKm} km</span>
          </div>
        </div>

        {/* Core Strava Metric Grid */}
        <div className="hud-metrics-grid">
          <div className="hud-tile">
            <div className="tile-top">
              <i className="fa-solid fa-stopwatch text-cyan"></i>
              <span className="tile-lbl">PACE SAAT INI</span>
            </div>
            <div className="tile-val-row">
              <span className="tile-value">{telemetry.paceStr}</span>
              <span className="tile-sub">/km</span>
            </div>
            <span className="tile-caption color-emerald">
              <i className="fa-solid fa-arrow-trend-up"></i> Optimal
            </span>
          </div>

          <div className="hud-tile">
            <div className="tile-top">
              <i className="fa-solid fa-clock text-orange"></i>
              <span className="tile-lbl">WAKTU TEMPUH</span>
            </div>
            <div className="tile-val-row">
              <span className="tile-value font-mono">{telemetry.timeFormatted}</span>
            </div>
            <span className="tile-caption text-secondary">
              Bergerak Aktif
            </span>
          </div>

          <div className="hud-tile">
            <div className="tile-top">
              <i className="fa-solid fa-heart-pulse color-rose heart-pulse-anim"></i>
              <span className="tile-lbl">DETAK JANTUNG</span>
            </div>
            <div className="tile-val-row">
              <span className="tile-value color-rose">{telemetry.heartRate}</span>
              <span className="tile-sub">bpm</span>
            </div>
            <span
              className="tile-zone-pill"
              style={{ background: `${telemetry.hrColor}22`, color: telemetry.hrColor }}
            >
              {telemetry.hrZone}
            </span>
          </div>

          <div className="hud-tile">
            <div className="tile-top">
              <i className="fa-solid fa-fire text-fire"></i>
              <span className="tile-lbl">KALORI & KADENSI</span>
            </div>
            <div className="tile-val-row">
              <span className="tile-value">{telemetry.caloriesBurned}</span>
              <span className="tile-sub">kkal</span>
            </div>
            <span className="tile-caption text-secondary">
              {telemetry.cadence} SPM (Langkah/mnt)
            </span>
          </div>
        </div>
      </div>

      {/* ================= 4. INTERACTIVE SCRUBBER & CONTROLS ================= */}
      <div className="strava-controls-card">
        {/* Scrubber Progress Slider */}
        <div className="scrubber-row">
          <div className="scrubber-header">
            <span className="scrubber-title">
              <i className="fa-solid fa-sliders"></i> Jelajahi Titik Rute (Scrub GPS)
            </span>
            <span className="scrubber-percentage">{Math.round(progress * 100)}% Selesai</span>
          </div>

          <div className="scrubber-bar-wrapper">
            <input
              type="range"
              min="0"
              max="1"
              step="0.005"
              value={progress}
              onChange={(e) => {
                setProgress(parseFloat(e.target.value));
              }}
              className="strava-range-slider"
            />
            <div
              className="scrubber-progress-fill"
              style={{ width: `${progress * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Button Actions */}
        <div className="strava-button-actions">
          <button
            className={`btn-strava-main ${isRunning ? 'running' : ''}`}
            onClick={handleToggleRun}
          >
            <i className={`fa-solid ${isRunning ? 'fa-pause' : 'fa-play'}`}></i>
            <span>{isRunning ? 'Jeda Lari' : progress === 0 ? 'Mulai Lari' : 'Lanjutkan Lari'}</span>
          </button>

          <button
            className="btn-strava-camera-action"
            onClick={() => setShowCaptureStudio(true)}
            title="Buka Kamera & Capture Foto Rute"
          >
            <i className="fa-solid fa-camera"></i>
            <span>Capture Foto</span>
          </button>

          <button
            className="btn-strava-finish"
            onClick={() => setShowSaveModal(true)}
            disabled={progress < 0.1}
          >
            <i className="fa-solid fa-flag-checkered"></i>
            <span>Catat</span>
          </button>

          <button
            className="btn-strava-reset"
            onClick={handleReset}
            title="Reset ke Awal"
          >
            <i className="fa-solid fa-rotate-left"></i>
          </button>
        </div>

        {/* Playback options row */}
        <div className="playback-options-row">
          <div className="sim-speed-selector">
            <span className="opt-label">Simulasi Kecepatan:</span>
            {[1, 2, 5, 10].map(speed => (
              <button
                key={speed}
                className={`speed-pill ${simSpeed === speed ? 'active' : ''}`}
                onClick={() => setSimSpeed(speed)}
              >
                {speed}x
              </button>
            ))}
          </div>

          <div className="toggles-group">
            <button
              className={`toggle-option-btn ${audioCues ? 'active' : ''}`}
              onClick={() => setAudioCues(!audioCues)}
              title="Suara Pemandu Kilometer"
            >
              <i className={`fa-solid ${audioCues ? 'fa-volume-high' : 'fa-volume-xmark'}`}></i>
              <span>Audio</span>
            </button>

            <button
              className={`toggle-option-btn ${autoPause ? 'active' : ''}`}
              onClick={() => setAutoPause(!autoPause)}
              title="Jeda Otomatis Saat Berhenti"
            >
              <i className="fa-solid fa-hand"></i>
              <span>Auto-Pause</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 5. INTERACTIVE STRAVA ELEVATION PROFILE CHART ================= */}
      <div className="strava-elevation-card">
        <div className="elevation-header">
          <div>
            <h4 className="elevation-title">
              <i className="fa-solid fa-mountain"></i> Profil Elevasi & Kemiringan
            </h4>
            <span className="elevation-subtitle">
              Total Tanjakan: +{activeRoute.elevationGain}m • Max Elevasi: {Math.max(...activeRoute.profilePoints.map(p => p.elevation))}m
            </span>
          </div>

          <div className="current-grade-badge">
            <span className="lbl">Gradien</span>
            <strong className="val">{telemetry.currGrade > 0 ? `+${telemetry.currGrade}%` : `${telemetry.currGrade}%`}</strong>
          </div>
        </div>

        <div className="elevation-chart-container">
          <svg className="elevation-svg" viewBox="0 0 360 80" preserveAspectRatio="none">
            <defs>
              <linearGradient id="elevationGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgba(252, 82, 0, 0.6)" />
                <stop offset="100%" stopColor="rgba(252, 82, 0, 0.0)" />
              </linearGradient>
            </defs>

            {(() => {
              const pts = activeRoute.profilePoints;
              const minE = Math.min(...pts.map(p => p.elevation)) - 4;
              const maxE = Math.max(...pts.map(p => p.elevation)) + 4;
              const rangeE = maxE - minE || 1;

              const svgCoords = pts.map(p => {
                const x = (p.distKm / activeRoute.totalKm) * 360;
                const y = 75 - ((p.elevation - minE) / rangeE) * 65;
                return `${x},${y}`;
              });

              const areaD = `M 0,80 L 0,${svgCoords[0].split(',')[1]} L ${svgCoords.join(' L ')} L 360,80 Z`;
              const lineD = `M ${svgCoords.join(' L ')}`;

              return (
                <>
                  <path d={areaD} fill="url(#elevationGrad)" />
                  <path d={lineD} fill="none" stroke="#FC5200" strokeWidth="2.5" />
                  
                  <line
                    x1={progress * 360}
                    y1="5"
                    x2={progress * 360}
                    y2="80"
                    stroke="#00F2FE"
                    strokeWidth="2"
                    strokeDasharray="3 3"
                  />
                  <circle
                    cx={progress * 360}
                    cy={75 - ((telemetry.currElev - minE) / rangeE) * 65}
                    r="4"
                    fill="#00F2FE"
                    stroke="#FFFFFF"
                    strokeWidth="1.5"
                  />
                </>
              );
            })()}
          </svg>

          <div className="elevation-labels-row">
            <span>0 km (Start)</span>
            <span>{Math.round(activeRoute.totalKm / 2)} km</span>
            <span>{activeRoute.totalKm} km (Finish)</span>
          </div>
        </div>
      </div>

      {/* ================= 6. STRAVA KILOMETER SPLITS TABLE ================= */}
      <div className="strava-splits-card">
        <div className="splits-header">
          <div>
            <h4 className="splits-title">
              <i className="fa-solid fa-list-ol"></i> Waktu Putaran (Kilometer Splits)
            </h4>
            <span className="splits-subtitle">Ketuk baris kilometer untuk melompat ke sektor rute</span>
          </div>
          <span className="splits-avg-badge">
            Target Pace: {activeRoute.splits[0].paceStr}/km
          </span>
        </div>

        <div className="splits-table">
          <div className="splits-thead">
            <span>KM</span>
            <span>PACE</span>
            <span>ELEVASI</span>
            <span>PERFORMA</span>
          </div>

          {activeRoute.splits.map((split) => {
            const isCompleted = progress >= split.km / activeRoute.totalKm;
            const isCurrent =
              progress >= (split.km - 1) / activeRoute.totalKm &&
              progress < split.km / activeRoute.totalKm;
            const diffSec = split.paceSec - 310;
            const diffStr = diffSec === 0 ? "0s" : diffSec > 0 ? `+${diffSec}s` : `${diffSec}s`;

            return (
              <div
                key={split.km}
                className={`split-row ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                onClick={() => handleJumpToKm(split.km)}
              >
                <div className="col-km">
                  <span className="km-badge">{split.km}</span>
                </div>

                <div className="col-pace">
                  <strong>{split.paceStr}</strong>
                  <div className="pace-mini-bar-bg">
                    <div
                      className="pace-mini-bar-fill"
                      style={{
                        width: `${Math.max(20, Math.min(100, 100 - (split.paceSec - 280) * 0.8))}%`,
                        background: diffSec < 0 ? '#10B981' : diffSec > 15 ? '#EF4444' : '#FC5200'
                      }}
                    ></div>
                  </div>
                </div>

                <div className="col-elev">
                  <span>+{split.elevation}m</span>
                </div>

                <div className="col-delta">
                  <span className={`delta-tag ${diffSec <= 0 ? 'faster' : 'slower'}`}>
                    {diffSec <= 0 ? (
                      <i className="fa-solid fa-bolt"></i>
                    ) : (
                      <i className="fa-solid fa-arrow-trend-up"></i>
                    )}
                    {diffStr}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= 7. DEDICATED CAMERA CAPTURE STUDIO MODAL ================= */}
      {showCaptureStudio && (
        <div className="camera-studio-modal-backdrop">
          <div className="camera-studio-dialog">
            {/* Studio Header */}
            <div className="studio-header">
              <div className="studio-brand">
                <i className="fa-solid fa-camera text-orange"></i>
                <div>
                  <h4>Kamera Cerita Lari Strava</h4>
                  <span>Ambil foto langsung dengan latar kamera HP Anda</span>
                </div>
              </div>
              <button
                className="btn-studio-close"
                onClick={() => {
                  setShowCaptureStudio(false);
                  stopCamera();
                }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Live Camera Viewfinder & AR Overlay */}
            <div className="studio-viewfinder">
              <video
                ref={studioVideoRef}
                className="studio-video-feed"
                autoPlay
                playsInline
                muted
              />

              {uploadedBgUrl && !cameraActive && (
                <img src={uploadedBgUrl} alt="Latar Upload" className="studio-uploaded-bg" />
              )}

              {/* Viewfinder Vignette & Grid */}
              <div className="viewfinder-vignette"></div>
              <div className="viewfinder-crosshairs">
                <div className="corner-bracket top-left"></div>
                <div className="corner-bracket top-right"></div>
                <div className="corner-bracket bottom-left"></div>
                <div className="corner-bracket bottom-right"></div>
              </div>

              {/* Live Overlay Elements on Top of Camera */}
              <div className="viewfinder-overlay-content">
                <div className="vo-header">
                  <span className="vo-strava-badge">STRAVA GPS</span>
                  <span className="vo-route-name">{activeRoute.name}</span>
                </div>

                {/* SVG Route Mini Map in Viewfinder */}
                <div className="vo-mini-route">
                  <svg viewBox="0 0 400 260" className="vo-svg">
                    <path
                      d={activeRoute.svgPath}
                      fill="none"
                      stroke="rgba(0, 0, 0, 0.6)"
                      strokeWidth="10"
                      strokeLinecap="round"
                    />
                    <path
                      d={activeRoute.svgPath}
                      fill="none"
                      stroke="#FC5200"
                      strokeWidth="6"
                      strokeLinecap="round"
                    />
                    <circle
                      cx={runnerCoord.x}
                      cy={runnerCoord.y}
                      r="8"
                      fill="#00F2FE"
                      stroke="#FFFFFF"
                      strokeWidth="2"
                    />
                  </svg>
                </div>

                {/* Bottom Overlay Telemetry Pill */}
                <div className="vo-hud-card">
                  <div className="vo-stat-main">
                    <span className="vo-km-val">{telemetry.currentDistKm}</span>
                    <span className="vo-km-unit">KM</span>
                  </div>
                  <div className="vo-stat-divider"></div>
                  <div className="vo-stat-secondary">
                    <div className="vo-sub-row">
                      <span className="lbl">Pace:</span>
                      <strong>{telemetry.paceStr} /km</strong>
                    </div>
                    <div className="vo-sub-row">
                      <span className="lbl">Waktu:</span>
                      <strong>{telemetry.timeFormatted}</strong>
                    </div>
                    <div className="vo-sub-row">
                      <span className="lbl">Elev:</span>
                      <strong>+{telemetry.currElev}m</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Camera Error / Fallback Guidance */}
              {cameraError && (
                <div className="studio-error-prompt">
                  <i className="fa-solid fa-triangle-exclamation"></i>
                  <p>{cameraError}</p>
                  <button
                    className="btn-upload-bg-action"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <i className="fa-solid fa-image"></i> Pilih Foto dari Perangkat
                  </button>
                </div>
              )}
            </div>

            {/* Studio Bottom Camera Controls */}
            <div className="studio-controls-bar">
              {/* Flip Camera */}
              <button
                className="btn-studio-aux"
                onClick={handleToggleFacing}
                title="Putar Kamera (Depan / Belakang)"
              >
                <i className="fa-solid fa-camera-rotate"></i>
                <span>Putar</span>
              </button>

              {/* Shutter Button (Capture Now) */}
              <button
                className="btn-studio-shutter"
                onClick={handleCapturePhoto}
                title="Ambil Foto Sekarang"
              >
                <div className="shutter-inner-circle">
                  <i className="fa-solid fa-camera"></i>
                </div>
              </button>

              {/* Upload fallback button */}
              <button
                className="btn-studio-aux"
                onClick={() => fileInputRef.current?.click()}
                title="Pilih Foto Latar dari Galeri"
              >
                <i className="fa-solid fa-images"></i>
                <span>Galeri</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 8. CAPTURED PHOTO RESULT PREVIEW MODAL ================= */}
      {capturedPhotoUrl && (
        <div className="camera-studio-modal-backdrop">
          <div className="photo-result-dialog">
            <div className="photo-result-header">
              <div>
                <h4>Foto Lari Berhasil Di-Capture! 📸</h4>
                <span>Foto dengan latar kamera & telemetri Strava siap diunduh</span>
              </div>
              <button
                className="btn-studio-close"
                onClick={() => setCapturedPhotoUrl(null)}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {/* Rendered Composite Result */}
            <div className="photo-result-frame">
              <img
                src={capturedPhotoUrl}
                alt="Hasil Capture Strava Run"
                className="photo-result-img"
              />
            </div>

            {/* Result Action Buttons */}
            <div className="photo-result-actions">
              <button
                className="btn-action-download"
                onClick={handleDownloadPhoto}
              >
                <i className="fa-solid fa-download"></i> Unduh Foto (Simpan)
              </button>

              <button
                className="btn-action-share"
                onClick={handleSharePhoto}
              >
                <i className="fa-solid fa-share-nodes"></i> Bagikan Story
              </button>

              <button
                className="btn-action-retake"
                onClick={() => {
                  setCapturedPhotoUrl(null);
                  setShowCaptureStudio(true);
                }}
              >
                <i className="fa-solid fa-rotate-left"></i> Foto Ulang
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 9. STRAVA FINISH RECAP & SAVE MODAL ================= */}
      {showSaveModal && (
        <div className="modal-backdrop">
          <div className="strava-modal-card">
            <div className="modal-trophy-banner">
              <div className="trophy-circle">
                <i className="fa-solid fa-trophy"></i>
              </div>
              <h3>Lari Selesai! Kerja Bagus! 🎉</h3>
              <p>Sesi lari Anda siap disimpan ke riwayat aktivitas FitPulse</p>
            </div>

            <div className="recap-stats-grid">
              <div className="recap-box">
                <span className="lbl">Jarak Total</span>
                <strong className="val">{telemetry.currentDistKm} km</strong>
              </div>
              <div className="recap-box">
                <span className="lbl">Waktu Total</span>
                <strong className="val">{telemetry.timeFormatted}</strong>
              </div>
              <div className="recap-box">
                <span className="lbl">Pace Rata-rata</span>
                <strong className="val">{telemetry.paceStr} /km</strong>
              </div>
              <div className="recap-box">
                <span className="lbl">Kalori Terbakar</span>
                <strong className="val color-fire">{telemetry.caloriesBurned} kkal</strong>
              </div>
            </div>

            <div className="recap-achievements">
              <div className="achieve-pill">
                <span>🏅 Rekor Pace GBK (Top 10%)</span>
              </div>
              <div className="achieve-pill">
                <span>🔥 Konsistensi Zona Kardio</span>
              </div>
            </div>

            <div className="modal-actions-col">
              <button className="btn-confirm-save" onClick={handleSaveAndLog}>
                <i className="fa-solid fa-check"></i> Simpan ke Riwayat Latihan
              </button>
              <button
                className="btn-cancel-modal"
                onClick={() => setShowSaveModal(false)}
              >
                Lanjutkan Lari / Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
