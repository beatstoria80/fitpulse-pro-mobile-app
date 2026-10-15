# ⚡ FitPulse Pro • Mobile Health & Fitness Tracker (Next.js 16)

A high-precision, Cyber-Athletic mobile health and fitness tracker web application built with **Next.js 16 (App Router)**, **TypeScript**, **React 19**, and **Supabase Cloud Database**.

![FitPulse Pro Banner](https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=1200&auto=format&fit=crop&q=80)

---

## 🌟 Key Features

- **📱 Mobile Cyber-Athletic Experience**: Sleek obsidian glassmorphism UI with responsive mobile simulator and fullscreen toggle.
- **🎯 Intelligent Target Weight Tracking**:
  - Initial: 72.0 kg | Current: **69.0 kg** | Target: **58.5 kg**
  - Live BMI calculation (**26.95**) & Body Fat Percentage (**26.7%** &rarr; **22.0%** target).
- **🔥 Physical Activity Logging**:
  - Pre-loaded with **Skateboard session** (45 mins, 280 kcal, 125 bpm).
  - Auto calorie burn calculation based on MET values and workout intensity.
- **🥗 Nutrition & Macro Tracker**:
  - Real-time Protein (120g target), Carbs (180g target), and Fat (50g target) breakdown.
  - **Healthy Lunch Recommender**: One-click balanced Indonesian high-protein lunch suggestion (+485 kcal, 38g Protein).
- **💧 Hydration Tracker**:
  - Interactive water meter tracking daily goal (2500 ml).
  - Quick-add buttons: `+250 ml`, `+500 ml`, `+750 ml` and custom input.
- **☁️ Supabase Cloud Database Integration**:
  - Automated PostgreSQL cloud synchronization for profiles, activities, nutrition, and water intake.
  - Complete SQL migration script provided in `schema.sql`.
- **📥 JSON Data Export**: Instant backup and export of all health metrics.

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack / Webpack)
- **Library**: [React 19](https://react.dev)
- **Language**: [TypeScript](https://www.typescriptlang.org)
- **Database**: [Supabase](https://supabase.com) (PostgreSQL)
- **Styling**: Modern CSS Design System (Glassmorphism & Cyber-Athletic Dark Mode)
- **Icons & Effects**: [Lucide React](https://lucide.dev) & [Canvas Confetti](https://github.com/catdad/canvas-confetti)

---

## 🚀 Getting Started

### 1. Clone & Install
```bash
git clone https://github.com/beatstoria80/fitpulse-pro-mobile-app.git
cd fitpulse-pro-mobile-app
npm install --legacy-peer-deps
```

### 2. Run Locally
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Build for Production
```bash
npm run build
npm start
```

---

## 🗄️ Database Setup (Supabase)

1. Create a project at [supabase.com](https://supabase.com).
2. Go to **SQL Editor** &rarr; run the contents of [`schema.sql`](./schema.sql).
3. Copy your **Project URL** and **Anon Key** from **Settings &rarr; API**.
4. In the app, open the **Supabase** modal or go to the **Profil** tab, paste credentials, and click **Sambungkan**.

---

## 🌐 Deploy to Vercel

The fastest way to deploy this Next.js 16 app is with Vercel:
1. Go to [vercel.com/new](https://vercel.com/new).
2. Import `beatstoria80/fitpulse-pro-mobile-app`.
3. Click **Deploy**. Vercel will automatically detect Next.js 16!
