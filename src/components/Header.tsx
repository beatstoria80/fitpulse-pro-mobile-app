"use client";

import React, { useState, useEffect } from 'react';
import { Cloud, CloudOff, RefreshCw, Maximize2, Download } from 'lucide-react';
import { UserProfile } from '../types/fitness';

interface HeaderProps {
  userProfile: UserProfile;
  isCloudSync: boolean;
  isSyncing: boolean;
  onOpenSupabaseModal: () => void;
  onExportJson: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  userProfile,
  isCloudSync,
  isSyncing,
  onOpenSupabaseModal,
  onExportJson,
  onToggleFullscreen,
  isFullscreen
}) => {
  const [greeting, setGreeting] = useState('Selamat Pagi');

  useEffect(() => {
    const timer = setTimeout(() => {
      const hour = new Date().getHours();
      if (hour < 11) setGreeting('Selamat Pagi');
      else if (hour < 15) setGreeting('Selamat Siang');
      else if (hour < 18) setGreeting('Selamat Sore');
      else setGreeting('Selamat Malam');
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  return (
    <header className="app-header">
      {/* Top utility bar */}
      <div className="top-util-bar">
        <button
          onClick={onOpenSupabaseModal}
          className={`cloud-status-pill ${isCloudSync ? 'connected' : 'disconnected'}`}
          title="Status database cloud Supabase"
        >
          {isSyncing ? (
            <RefreshCw size={13} className="spin-icon" />
          ) : isCloudSync ? (
            <Cloud size={13} />
          ) : (
            <CloudOff size={13} />
          )}
          <span>{isCloudSync ? 'Supabase: Cloud Aktif' : 'Supabase: Lokal'}</span>
        </button>

        <div className="header-actions">
          <button
            onClick={onToggleFullscreen}
            className="util-btn"
            title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
          >
            <Maximize2 size={14} />
            <span>{isFullscreen ? 'Kecilkan' : 'Layar Penuh'}</span>
          </button>
          <button
            onClick={onExportJson}
            className="util-btn"
            title="Ekspor Data JSON"
          >
            <Download size={14} />
            <span>Ekspor</span>
          </button>
        </div>
      </div>

      {/* Profile Bar */}
      <div className="profile-hero-bar">
        <div className="profile-left">
          <div className="avatar-wrap">
            <div className="avatar-ring">
              <span className="avatar-initials">ND</span>
            </div>
            <span className="online-indicator"></span>
          </div>
          <div className="user-text">
            <span className="greeting-sub">{greeting},</span>
            <h1 className="user-name">{userProfile.name || 'Nandang'}</h1>
            <span className="user-id-badge">ID: {userProfile.user_id} • 46 Th</span>
          </div>
        </div>

        <div className="profile-right-badge">
          <span className="pro-badge">PRO</span>
          <span className="streak-badge">🔥 3 Hari</span>
        </div>
      </div>
    </header>
  );
};
