"use client";

import React from 'react';
import { LayoutDashboard, Activity, Utensils, Trophy } from 'lucide-react';

export type TabType = 'tabDashboard' | 'tabActivities' | 'tabNutrition' | 'tabAnalytics';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  dashboardVfxActive?: boolean;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onTabChange,
  dashboardVfxActive = false,
}) => {
  return (
    <nav
      className={`bottom-nav${dashboardVfxActive ? ' stagger-reveal delay-6' : ''}`}
      id="bottomNav"
      aria-label="Navigasi Menu Utama"
    >
      <button
        className={`nav-item ${activeTab === 'tabDashboard' ? 'active' : ''}`}
        onClick={() => onTabChange('tabDashboard')}
        aria-label="Tab Ringkasan Dashboard"
      >
        <div className="nav-icon-wrap">
          <LayoutDashboard size={20} />
        </div>
        <span className="nav-label">Ringkasan</span>
        <div className="active-dot" />
      </button>

      <button
        className={`nav-item ${activeTab === 'tabActivities' ? 'active' : ''}`}
        onClick={() => onTabChange('tabActivities')}
        aria-label="Tab Aktivitas"
      >
        <div className="nav-icon-wrap">
          <Activity size={20} />
        </div>
        <span className="nav-label">Aktivitas</span>
        <div className="active-dot" />
      </button>

      <button
        className={`nav-item ${activeTab === 'tabNutrition' ? 'active' : ''}`}
        onClick={() => onTabChange('tabNutrition')}
        aria-label="Tab Nutrisi"
      >
        <div className="nav-icon-wrap">
          <Utensils size={20} />
        </div>
        <span className="nav-label">Nutrisi</span>
        <div className="active-dot" />
      </button>

      <button
        className={`nav-item ${activeTab === 'tabAnalytics' ? 'active' : ''}`}
        onClick={() => onTabChange('tabAnalytics')}
        aria-label="Tab Roadmap Analisis"
      >
        <div className="nav-icon-wrap">
          <Trophy size={20} />
        </div>
        <span className="nav-label">Roadmap</span>
        <div className="active-dot" />
      </button>
    </nav>
  );
};

export default BottomNav;
