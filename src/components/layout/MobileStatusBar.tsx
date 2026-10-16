"use client";

import React from 'react';

interface MobileStatusBarProps {
  clock: string;
  burnedCalories: number;
}

export const MobileStatusBar: React.FC<MobileStatusBarProps> = ({ clock, burnedCalories }) => {
  return (
    <header className="status-bar" id="statusBar">
      <div className="status-time" id="statusClock">{clock}</div>
      <div className="dynamic-island">
        <div className="island-pill">
          <i className="fa-solid fa-fire-flame-curved island-icon"></i>
          <span className="island-text">{burnedCalories} kkal terbakar</span>
        </div>
      </div>
      <div className="status-icons">
        <i className="fa-solid fa-signal"></i>
        <i className="fa-solid fa-wifi"></i>
        <i className="fa-solid fa-battery-three-quarters"></i>
      </div>
    </header>
  );
};
