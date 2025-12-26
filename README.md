# Sistem Fuzzy Logic - Performance Analysis

Aplikasi web untuk analisis tingkat performa menggunakan metode Fuzzy Logic Tsukamoto. Sistem ini menggunakan 4 variabel input dan 81 rule base lengkap untuk menghasilkan output kategori performa (Rendah, Sedang, Tinggi).

## Fitur Utama

- **Input Data Interaktif**: Form input untuk 4 parameter (Total Anamnesis, Derajat Merokok, Usia, Doubting Time)
- **Sample Data**: Tombol quick load untuk data sample dari jurnal
- **Grafik Membership Functions**: Visualisasi lengkap dengan line chart untuk setiap variabel input
- **Grafik Output**: Visualisasi output membership functions dengan marker CoG
- **Tabel Inferensi**: Menampilkan semua rule yang aktif beserta nilai alpha-cut
- **Hasil Defuzzifikasi**: Output akhir menggunakan metode Center of Gravity (CoG)
- **UI Modern**: Desain clean dan responsive dengan Tailwind CSS

## Variabel Input

1. **Total Anamnesis** (0-100)
   - Ringan: 0-40
   - Sedang: 20-60
   - Berat: 40-100

2. **Derajat Merokok** (0-800)
   - Ringan: 0-300
   - Sedang: 100-600
   - Berat: 400-800+

3. **Usia** (tahun)
   - Remaja: 10-30
   - Dewasa: 20-40
   - Lansia: 30-60+

4. **Doubting Time** (0-16 jam)
   - Cepat/Rendah: 0-8
   - Sedang: 4-12
   - Lambat/Tinggi: 8-16+

## Output

- **Rendah**: Nilai output ≤ 40
- **Sedang**: Nilai output 40-70
- **Tinggi**: Nilai output > 70

## Teknologi

- **Next.js 16** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization library
- **Turbopack** - Fast bundler

## Cara Menjalankan

1. Install dependencies:
```bash
npm install
```

2. Jalankan development server:
```bash
npm run dev
```

3. Buka browser di [http://localhost:3000](http://localhost:3000)

## Cara Menggunakan

1. **Input Data**: Masukkan nilai untuk keempat parameter, atau gunakan tombol "Sample" untuk load data contoh
2. **Proses**: Klik tombol "Proses Perhitungan"
3. **Lihat Hasil**: Sistem akan otomatis menampilkan hasil defuzzifikasi
4. **Eksplorasi**: Gunakan tab untuk melihat detail:
   - **Fuzzifikasi**: Nilai membership function untuk setiap input
   - **Inferensi**: Rule yang aktif dan nilai alpha-cut
   - **Hasil**: Output akhir dan interpretasi

## Rule Base

Sistem menggunakan 81 rules lengkap (semua kombinasi) yang mengikuti pola:
```
IF [Total Anamnesis] AND [Derajat Merokok] AND [Usia] AND [Doubting Time] 
THEN [Output]
```

Contoh rule:
- IF Ringan AND Sedang AND Dewasa AND Sedang THEN Sedang
- IF Berat AND Berat AND Dewasa AND Sedang THEN Tinggi
- dll.

## Metode Defuzzifikasi

Menggunakan **Center of Gravity (CoG)** / Centroid Method:

```
Output = (Σ(μi × zi)) / (Σμi)
```

Dimana:
- μi = nilai membership maksimal untuk setiap kategori output
- zi = nilai center dari membership function output

## Sample Data

### Sample 1
- Total Anamnesis: 25
- Derajat Merokok: 500
- Usia: 28
- Doubting Time: 10
- **Expected Output**: Sedang (42.86)

### Sample 2
- Total Anamnesis: 80
- Derajat Merokok: 600
- Usia: 20
- Doubting Time: 6

### Sample 3
- Total Anamnesis: 80
- Derajat Merokok: 100
- Usia: 20
- Doubting Time: 5

## Struktur Project

```
fuzzy-logic-nextjs/
├── app/
│   ├── page.tsx          # Main application component
│   ├── layout.tsx        # Root layout
│   └── globals.css       # Global styles
├── public/               # Static assets
├── package.json          # Dependencies
└── README.md            # Documentation
```

## Build untuk Production

```bash
npm run build
npm start
```

## License

MIT

## Author

Developed with Next.js and Fuzzy Logic Tsukamoto Method
