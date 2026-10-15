"use client";

import React from 'react';
import { Home, Flame, Utensils, Droplet, User } from 'lucide-react';

export type TabType = 'summary' | 'activity' | 'nutrition' | 'hydration' | 'profile';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab
}) => {
  return (
    <nav className="bottom-nav-bar">
      <button
        onClick={() => onChangeTab('summary')}
        className={`nav-tab-item ${activeTab === 'summary' ? 'active' : ''}`}
      >
        <Home size={20} />
        <span>Ringkasan</span>
      </button>

      <button
        onClick={() => onChangeTab('activity')}
        className={`nav-tab-item ${activeTab === 'activity' ? 'active' : ''}`}
      >
        <Flame size={20} />
        <span>Aktivitas</span>
      </button>

      <button
        onClick={() => onChangeTab('nutrition')}
        className={`nav-tab-item ${activeTab === 'nutrition' ? 'active' : ''}`}
      >
        <Utensils size={20} />
        <span>Nutrisi</span>
      </button>

      <button
        onClick={() => onChangeTab('hydration')}
        className={`nav-tab-item ${activeTab === 'hydration' ? 'active' : ''}`}
      >
        <Droplet size={20} />
        <span>Hidrasi</span>
      </button>

      <button
        onClick={() => onChangeTab('profile')}
        className={`nav-tab-item ${activeTab === 'profile' ? 'active' : ''}`}
      >
        <User size={20} />
        <span>Profil</span>
      </button>
    </nav>
  );
};
