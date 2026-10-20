"use client";

import React, { useState } from 'react';
import { User, Database, ShieldCheck, Check, RefreshCw, Key, Globe } from 'lucide-react';
import { UserProfile } from '../types/fitness';

interface ProfileTabProps {
  userProfile: UserProfile;
  supabaseUrl: string;
  supabaseKey: string;
  isCloudSync: boolean;
  isSyncing: boolean;
  onSaveSupabaseConfig: (url: string, key: string) => void;
  onSyncNow: () => void;
  onUpdateProfile: (updated: UserProfile) => void;
}

export const ProfileTab: React.FC<ProfileTabProps> = ({
  userProfile,
  supabaseUrl,
  supabaseKey,
  isCloudSync,
  isSyncing,
  onSaveSupabaseConfig,
  onSyncNow
}) => {
  const [urlInput, setUrlInput] = useState(supabaseUrl);
  const [keyInput, setKeyInput] = useState(supabaseKey);
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSupabaseConfig(urlInput.trim(), keyInput.trim());
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  return (
    <div className="tab-pane active">
      <div className="section-head-row">
        <div>
          <h2 className="section-title">Profil & Pengaturan Cloud</h2>
          <span className="section-sub">Kelola identitas, data biometrik, dan integrasi Supabase</span>
        </div>
      </div>

      {/* Profile Biometrics Card */}
      <div className="profile-details-card glass-panel">
        <div className="card-top-header">
          <div className="icon-badge user-icon">
            <User size={18} />
          </div>
          <h3 className="card-title">Data Pengguna & Biometrik</h3>
        </div>

        <div className="details-table">
          <div className="detail-row">
            <span className="label">User ID:</span>
            <span className="val mono">{userProfile.user_id}</span>
          </div>
          <div className="detail-row">
            <span className="label">Nama / Panggilan:</span>
            <span className="val">{userProfile.name || 'Nandang'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Usia & Gender:</span>
            <span className="val">{userProfile.demographics.age} Tahun, {userProfile.demographics.gender === 'male' ? 'Laki-laki' : 'Perempuan'}</span>
          </div>
          <div className="detail-row">
            <span className="label">Status:</span>
            <span className="val capitalize">{userProfile.demographics.marital_status}</span>
          </div>
          <div className="detail-row">
            <span className="label">Tinggi Badan:</span>
            <span className="val">{userProfile.biometrics.height_cm} cm</span>
          </div>
          <div className="detail-row">
            <span className="label">Berat Badan Saat Ini:</span>
            <span className="val bold text-warning">{userProfile.biometrics.weight_kg} kg</span>
          </div>
          <div className="detail-row">
            <span className="label">Target Berat Badan:</span>
            <span className="val bold text-success">{userProfile.fitness_goals.target_weight_kg} kg</span>
          </div>
          <div className="detail-row">
            <span className="label">Indeks Massa Tubuh (BMI):</span>
            <span className="val">{userProfile.biometrics.bmi} ({userProfile.biometrics.bmi_status})</span>
          </div>
          <div className="detail-row">
            <span className="label">Persentase Lemak Tubuh:</span>
            <span className="val">{userProfile.biometrics.estimated_body_fat_percentage}% (Target: {userProfile.biometrics.target_body_fat_percentage}%)</span>
          </div>
        </div>
      </div>

      {/* Supabase Database Settings */}
      <div className="supabase-config-card glass-panel">
        <div className="card-top-header">
          <div className="icon-badge db-icon">
            <Database size={18} />
          </div>
          <div>
            <h3 className="card-title">Koneksi Supabase Cloud Database</h3>
            <span className="card-sub">Sinkronisasi otomatis PostgreSQL</span>
          </div>
        </div>

        <form onSubmit={handleSave} className="supabase-form">
          <div className="form-group">
            <label className="form-label">
              <Globe size={13} />
              <span>Project URL:</span>
            </label>
            <input
              type="url"
              className="form-input"
              placeholder="https://xyzcompany.supabase.co"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">
              <Key size={13} />
              <span>Anon Public Key:</span>
            </label>
            <input
              type="password"
              className="form-input"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
            />
          </div>

          <div className="btn-group-sb">
            <button type="submit" className="btn-save-sb">
              {isSaved ? <Check size={16} /> : <ShieldCheck size={16} />}
              <span>{isSaved ? 'Kredensial Tersimpan!' : 'Simpan Kredensial'}</span>
            </button>

            {isCloudSync && (
              <button
                type="button"
                onClick={onSyncNow}
                disabled={isSyncing}
                className="btn-sync-now"
              >
                <RefreshCw size={14} className={isSyncing ? 'spin-icon' : ''} />
                <span>{isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
              </button>
            )}
          </div>
        </form>

        <div className="schema-info-box">
          <span className="info-icon">💡</span>
          <p>
            Skema tabel SQL tersimpan di <code>schema.sql</code>. Pastikan Anda sudah menjalankan skrip tersebut di SQL Editor Supabase.
          </p>
        </div>
      </div>
    </div>
  );
};
