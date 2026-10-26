"use client";

import React, { useState } from 'react';
import { Cloud, X, Activity, Link2, Unlink2 } from 'lucide-react';

interface SupabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  isCloudSync: boolean;
  initialUrl?: string;
  initialKey?: string;
  onConnect: (url: string, key: string) => void;
  onDisconnect: () => void;
}

export const SupabaseModal: React.FC<SupabaseModalProps> = ({
  isOpen,
  onClose,
  isCloudSync,
  initialUrl = '',
  initialKey = '',
  onConnect,
  onDisconnect,
}) => {
  const [sbUrl, setSbUrl] = useState(initialUrl);
  const [sbKey, setSbKey] = useState(initialKey);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sbUrl.trim() || !sbKey.trim()) return;
    onConnect(sbUrl.trim(), sbKey.trim());
  };

  return (
    <div className="modal-backdrop active" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle" />
        <div className="modal-header">
          <h3>
            <Cloud size={18} className="color-cyan" /> Database Cloud (Supabase)
          </h3>
          <button className="modal-close-btn" onClick={onClose} aria-label="Tutup modal">
            <X size={18} />
          </button>
        </div>
        <div className="supabase-info-banner">
          <p>
            <strong>Kenapa Supabase?</strong> Data aktivitas, nutrisi, hidrasi, dan berat badan Anda akan tersimpan
            abadi di cloud PostgreSQL, sehingga dapat disinkronkan langsung saat dibuka di HP, laptop, atau tablet tanpa
            hilang saat cache dibersihkan.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
            <span className="schema-hint">
              <Activity size={13} /> Skrip database siap pakai: <code>schema.sql</code>
            </span>
            <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#059669', background: '#ECFDF5', padding: '2px 8px', borderRadius: '12px', border: '1px solid #A7F3D0' }}>
              ✓ Supabase Oct 30 GRANT Ready
            </span>
          </div>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Supabase Project URL</label>
            <input
              type="url"
              placeholder="https://xxxxxxxxxxxx.supabase.co"
              value={sbUrl}
              onChange={(e) => setSbUrl(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label>Supabase Anon Public Key</label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={sbKey}
              onChange={(e) => setSbKey(e.target.value)}
              required
            />
          </div>

          <div className="supabase-status-indicator">
            <span className={`status-dot ${isCloudSync ? 'success' : 'warning'}`} />
            <span>
              {isCloudSync ? 'Status: Terhubung ke Supabase Cloud' : 'Status: Menggunakan Penyimpanan Lokal (Offline)'}
            </span>
          </div>

          <div className="two-inputs-row">
            <button type="submit" className="btn-submit-action">
              <Link2 size={16} /> Sambungkan
            </button>
            {isCloudSync && (
              <button type="button" className="btn-disconnect-action" onClick={onDisconnect}>
                <Unlink2 size={16} /> Putuskan
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default SupabaseModal;
