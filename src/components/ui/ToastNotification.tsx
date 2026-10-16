"use client";

import React from 'react';

interface ToastNotificationProps {
  toast: string | null;
}

export const ToastNotification: React.FC<ToastNotificationProps> = ({ toast }) => {
  if (!toast) return null;

  return (
    <div className="toast-notification" id="toast">
      <i className="fa-solid fa-circle-check"></i>
      <span>{toast}</span>
    </div>
  );
};
