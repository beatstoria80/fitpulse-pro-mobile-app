"use client";

import React from 'react';
import { Cloud, RotateCcw, Download } from 'lucide-react';

interface DesktopBarProps {
  userId: string;
  userName?: string;
  userAge: number;
  isCloudSync: boolean;
  isSyncing: boolean;
  onOpenSupabase: () => void;
  onResetTodayData: () => void;
  onExportJson: () => void;
}

export const DesktopBar: React.FC<DesktopBarProps> = ({
  userId,
  userName = 'Pengguna',
  userAge,
  isCloudSync,
  isSyncing,
  onOpenSupabase,
  onResetTodayData,
  onExportJson,
}) => {
  return (
    <aside className="desktop-bar" id="desktopBar" aria-label="Desktop Controls">
      <div className="desktop-bar-left">
        <span className="pulse-indicator" />
        <span className="desktop-title">FitPulse Pro • Health & Fitness Tracker</span>
        <span className="badge user-badge">
          {userId} ({userName} • {userAge} th)
        </span>
      </div>
      <div className="desktop-bar-actions">
        <button
          className="control-btn"
          onClick={onOpenSupabase}
          title="Hubungkan Cloud Database Supabase"
        >
          <Cloud size={14} className={isCloudSync ? 'color-cyan' : ''} />
          <span>{isSyncing ? 'Menyinkronkan...' : isCloudSync ? 'Supabase: Cloud Aktif' : 'Supabase: Lokal'}</span>
        </button>
        <button
          className="control-btn"
          onClick={onResetTodayData}
          title="Kosongkan data hari ini untuk menguji status Tanpa Data (Null)"
        >
          <RotateCcw size={14} /> Reset Data Nol
        </button>
        <button
          className="control-btn action-highlight"
          onClick={onExportJson}
          title="Unduh Data JSON Terbaru"
        >
          <Download size={14} /> Ekspor JSON
        </button>
      </div>
    </aside>
  );
};

export default DesktopBar;
