"use client";

import React, { useState, useEffect } from 'react';

interface SupabaseModalProps {
  isOpen: boolean;
  initialUrl: string;
  initialKey: string;
  isCloudSync: boolean;
  onClose: () => void;
  onConnect: (url: string, key: string) => void;
  onDisconnect: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  initialUrl,
  initialKey,
  isCloudSync,
  onClose,
  onConnect,
  onDisconnect
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [key, setKey] = useState(initialKey);

  useEffect(() => {
    setUrl(initialUrl);
    setKey(initialKey);
  }, [initialUrl, initialKey]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConnect(url, key);
    onClose();
  };

  const handleDisconnect = () => {
    onDisconnect();
    setUrl('');
    setKey('');
    onClose();
  };

  return (
    <div className="modal-backdrop active" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle"></div>
        <div className="modal-header">
          <h3><i className="fa-solid fa-cloud color-cyan"></i> Database Cloud (Supabase)</h3>
          <button className="modal-close-btn" onClick={onClose}>
            <i className="fa-solid fa-xmark"></i>
          </button>
        </div>
        <div className="supabase-info-banner">
          <p>
            <strong>Kenapa Supabase?</strong> Data aktivitas, nutrisi, hidrasi, dan berat badan Anda akan tersimpan abadi di cloud PostgreSQL, sehingga dapat disinkronkan langsung saat dibuka di HP, laptop, atau tablet tanpa hilang saat cache dibersihkan.
          </p>
          <span className="schema-hint">
            <i className="fa-solid fa-file-code"></i> Skrip database siap pakai: <code>schema.sql</code>
          </span>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Supabase Project URL</label>
            <input
              type="url"
              placeholder="https://xxxxxxxxxxxx.supabase.co"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Supabase Anon Public Key</label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={key}
              onChange={(e) => setKey(e.target.value)}
              required
            />
          </div>

          <div className="supabase-status-indicator">
            <span className={`status-dot ${isCloudSync ? 'success' : 'warning'}`}></span>
            <span>
              {isCloudSync ? 'Status: Terhubung ke Supabase Cloud' : 'Status: Menggunakan Penyimpanan Lokal (Offline)'}
            </span>
          </div>

          <div className="two-inputs-row">
            <button type="submit" className="btn-submit-action">
              <i className="fa-solid fa-link"></i> Sambungkan
            </button>
            {isCloudSync && (
              <button type="button" className="btn-disconnect-action" onClick={handleDisconnect}>
                <i className="fa-solid fa-link-slash"></i> Putuskan
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
