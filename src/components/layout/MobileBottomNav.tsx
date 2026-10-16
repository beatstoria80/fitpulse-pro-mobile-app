"use client";

import React from 'react';

export type TabId = 'tabDashboard' | 'tabActivities' | 'tabNutrition' | 'tabAnalytics';

interface MobileBottomNavProps {
  activeTab: TabId;
  setActiveTab: (tab: TabId) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ activeTab, setActiveTab }) => {
  return (
    <nav className="bottom-nav" id="bottomNav">
      <button
        className={`nav-item ${activeTab === 'tabDashboard' ? 'active' : ''}`}
        onClick={() => setActiveTab('tabDashboard')}
      >
        <div className="nav-icon-wrap">
          <i className="fa-solid fa-house"></i>
        </div>
        <span className="nav-label">Ringkasan</span>
        <div className="active-dot"></div>
      </button>

      <button
        className={`nav-item ${activeTab === 'tabActivities' ? 'active' : ''}`}
        onClick={() => setActiveTab('tabActivities')}
      >
        <div className="nav-icon-wrap">
          <i className="fa-solid fa-person-running"></i>
        </div>
        <span className="nav-label">Aktivitas</span>
        <div className="active-dot"></div>
      </button>

      <button
        className={`nav-item ${activeTab === 'tabNutrition' ? 'active' : ''}`}
        onClick={() => setActiveTab('tabNutrition')}
      >
        <div className="nav-icon-wrap">
          <i className="fa-solid fa-utensils"></i>
        </div>
        <span className="nav-label">Nutrisi</span>
        <div className="active-dot"></div>
      </button>

      <button
        className={`nav-item ${activeTab === 'tabAnalytics' ? 'active' : ''}`}
        onClick={() => setActiveTab('tabAnalytics')}
      >
        <div className="nav-icon-wrap">
          <i className="fa-solid fa-chart-line"></i>
        </div>
        <span className="nav-label">Roadmap</span>
        <div className="active-dot"></div>
      </button>
    </nav>
  );
};
