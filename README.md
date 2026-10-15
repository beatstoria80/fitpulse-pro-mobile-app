# FitPulse Pro • Mobile Health, Nutrition & Fitness Tracker

Aplikasi Web Mobile interaktif dan responsif berdesain **Cyber-Athletic Obsidian Glass** yang dibangun khusus untuk melacak biometrik, nutrisi, dan aktivitas harian **Pak Nandang (USR-4616069)**.

---

## 📱 Fitur Utama Aplikasi

1. **Dashboard & Calorie Engine**:
   - **Hero Energy Ring**: Indikator cincin SVG dinamis (Target 1.800 kkal, Sisa 1.495 kkal, Terbakar 430 kkal).
   - **Macro Breakdown**: Pelacak *Protein (35g / 135g)*, *Karbohidrat (28g / 180g)*, dan *Lemak (4.5g / 50g)*.
   - **Biometrik Tile**: Pemantauan Berat Badan (69.0 kg ➔ 58.5 kg), Estimasi Lemak Tubuh (26.7% ➔ 22.0%), dan status BMI.
   - **Interactive Hydration Tracker**: Tambah cepat +250 ml (Gelas) / +500 ml (Botol) dengan animasi ketinggian air.
   - **Dynamic Island**: Menampilkan status pembakaran kalori aktif secara real-time.

2. **Aktivitas Fisik & Heart Rate Zones**:
   - Log sesi latihan (Skateboard 45 mnt, Power Walking 30 mnt).
   - Sensor detak jantung & visualisasi Zona Latihan (Zone 1 Warmup, Zone 2 Fat Burn, Zone 3 Cardio).
   - Formulir pencatatan aktivitas baru dengan kalkulator pembakaran energi berbasis rumus **METs** dan bobot tubuh 69 kg.

3. **Nutrisi & Pencatat Makanan**:
   - Rincian per waktu makan: Sarapan (Breakfast), Makan Siang (Lunch), Camilan (Snack), Makan Malam (Dinner).
   - Preset makanan sehat Indonesia (Ikan Kembung Bakar, Dada Ayam Panggang, Nasi Merah, Sayur Bayam, Tempe Kukus, Telur Rebus).
   - Tombol pintar: Rekomendasi Menu Siang Sehat Otomatis.

4. **Roadmap & Proyeksi Penurunan Berat Badan**:
   - Jalur penurunan aman (~0.4 - 0.5 kg/minggu) menuju berat ideal 58.5 kg (~21–24 minggu).
   - Strategi komposisi tubuh untuk memangkas lemak dari 26.7% ke 22.0% di usia 46 tahun seraya melindungi massa otot.
   - Live JSON Data Inspector & Tombol **Ekspor / Salin JSON**.

5. **Pilihan Tampilan (Desktop Simulator Bar)**:
   - **Mode HP**: Menampilkan frame bezel iPhone dengan notch dynamic island.
   - **Layar Penuh**: Tampilan responsif penuh layar untuk tablet atau desktop.

---

## 🚀 Cara Menjalankan Aplikasi

Aplikasi ini menggunakan teknologi murni **Vanilla HTML5, CSS3, dan ES6 JavaScript** tanpa ketergantungan paket berat, sehingga dapat dibuka langsung di browser:

### Opsi 1: Menjalankan Server Lokal (Disarankan)
Buka terminal PowerShell pada direktori ini, lalu jalankan:
```powershell
python -m http.server 4321
```
Buka browser di: [http://localhost:4321](http://localhost:4321)

### Opsi 2: Buka Langsung File HTML
Buka file `index.html` langsung dengan klik dua kali atau melalui browser (Chrome, Edge, Safari).
