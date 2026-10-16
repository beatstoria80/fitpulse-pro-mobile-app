"use client";

import React from 'react';
import { UserProfile } from '../../types/fitness';

interface DesktopSidebarProps {
  userProfile: UserProfile;
  isFullView: boolean;
  setIsFullView: (val: boolean) => void;
  isCloudSync: boolean;
  isSyncing: boolean;
  onOpenSupabaseModal: () => void;
  onExportJson: () => void;
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({
  userProfile,
  isFullView,
  setIsFullView,
  isCloudSync,
  isSyncing,
  onOpenSupabaseModal,
  onExportJson
}) => {
  return (
    <aside className="desktop-bar" id="desktopBar" aria-label="Device Preview Controls">
      <div className="desktop-bar-left">
        <span className="pulse-indicator"></span>
        <span className="desktop-title">FitPulse Pro • Mobile App Simulator (Next.js 16)</span>
        <span className="badge user-badge">
          {userProfile.user_id} ({userProfile.name || 'Nandang'} • {userProfile.demographics.age} th)
        </span>
      </div>
      <div className="desktop-bar-actions">
        <button
          className={`control-btn ${!isFullView ? 'active' : ''}`}
          onClick={() => setIsFullView(false)}
          title="Tampilan Mockup Mobile"
        >
          <i className="fa-solid fa-mobile-screen"></i> Mode HP
        </button>
        <button
          className={`control-btn ${isFullView ? 'active' : ''}`}
          onClick={() => setIsFullView(true)}
          title="Tampilan Layar Penuh"
        >
          <i className="fa-solid fa-expand"></i> Layar Penuh
        </button>
        <button
          className="control-btn"
          onClick={onOpenSupabaseModal}
          title="Hubungkan Cloud Database Supabase"
        >
          <i className={`fa-solid fa-cloud ${isCloudSync ? 'color-cyan' : ''}`}></i>
          <span>{isSyncing ? 'Menyinkronkan...' : isCloudSync ? 'Supabase: Cloud Aktif' : 'Supabase: Lokal'}</span>
        </button>
        <button
          className="control-btn action-highlight"
          onClick={onExportJson}
          title="Unduh Data JSON Terbaru"
        >
          <i className="fa-solid fa-download"></i> Ekspor JSON
        </button>
      </div>
    </aside>
  );
};
