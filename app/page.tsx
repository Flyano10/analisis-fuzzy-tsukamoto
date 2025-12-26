'use client';
import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface FuzzResultTriple {
  ringan: number;
  sedang: number;
  berat: number;
  [key: string]: number | undefined;
}

interface FuzzResultAge {
  remaja: number;
  dewasa: number;
  lansia: number;
  ringan?: number;
  sedang?: number;
  [key: string]: number | undefined;
}

interface FuzzResultTime {
  rendah: number;
  sedang: number;
  tinggi: number;
  ringan?: number;
  [key: string]: number | undefined;
}

interface FuzzificationResult {
  anamnesis: FuzzResultTriple;
  merokok: FuzzResultTriple;
  usia: FuzzResultAge;
  doubting: FuzzResultTime;
}

interface InferenceRule {
  rule: string;
  alpha: number;
  output: string;
}

export default function FuzzyLogicApp() {
  const [activeTab, setActiveTab] = useState('input');
  const [dataInput, setDataInput] = useState({
    totalAnamnesis: '',
    derajatMerokok: '',
    usia: '',
    doubtingTime: ''
  });
  const [fuzzificationResult, setFuzzificationResult] = useState<FuzzificationResult | null>(null);
  const [inferenceResult, setInferenceResult] = useState<InferenceRule[] | null>(null);
  const [defuzzificationResult, setDefuzzificationResult] = useState<number | null>(null);

  // Fungsi Fuzzifikasi Total Anamnesis (Ringan, Sedang, Berat)
  const fuzzifyTotalAnamnesis = (value: string) => {
    const v = parseFloat(value);
    let ringan = 0, sedang = 0, berat = 0;

    // Ringan: 0-40 (peak di 0-20, turun ke 40)
    if (v <= 20) ringan = 1;
    else if (v > 20 && v < 40) ringan = (40 - v) / 20;
    else ringan = 0;

    // Sedang: 20-60 (naik dari 20, peak di 40, turun ke 60)
    if (v <= 20) sedang = 0;
    else if (v > 20 && v <= 40) sedang = (v - 20) / 20;
    else if (v > 40 && v < 60) sedang = (60 - v) / 20;
    else sedang = 0;

    // Berat: 40-100 (naik dari 40, peak di 80-100)
    if (v <= 40) berat = 0;
    else if (v > 40 && v <= 80) berat = (v - 40) / 40;
    else berat = 1;

    return { ringan, sedang, berat };
  };

  // Fungsi Fuzzifikasi Derajat Merokok (Ringan, Sedang, Berat)
  const fuzzifyDerajatMerokok = (value: string) => {
    const v = parseFloat(value);
    let ringan = 0, sedang = 0, berat = 0;

    // Ringan: 0-300 (peak di 0-100, turun ke 300)
    if (v <= 100) ringan = 1;
    else if (v > 100 && v < 300) ringan = (300 - v) / 200;
    else ringan = 0;

    // Sedang: 100-600 (naik dari 100, peak di 350, turun ke 600)
    if (v <= 100) sedang = 0;
    else if (v > 100 && v <= 350) sedang = (v - 100) / 250;
    else if (v > 350 && v < 600) sedang = (600 - v) / 250;
    else sedang = 0;

    // Berat: 400-800+ (naik dari 400, peak di 600+)
    if (v <= 400) berat = 0;
    else if (v > 400 && v <= 600) berat = (v - 400) / 200;
    else berat = 1;

    return { ringan, sedang, berat };
  };

  // Fungsi Fuzzifikasi Usia (Remaja, Dewasa, Lansia)
  const fuzzifyUsia = (value: string) => {
    const v = parseFloat(value);
    let remaja = 0, dewasa = 0, lansia = 0;

    // Remaja: 10-30 (peak di 10-20, turun ke 30)
    if (v <= 10) remaja = 0;
    else if (v > 10 && v <= 20) remaja = (v - 10) / 10;
    else if (v > 20 && v < 30) remaja = (30 - v) / 10;
    else remaja = 0;

    // Dewasa: 20-40 (naik dari 20, peak di 30, turun ke 40)
    if (v <= 20) dewasa = 0;
    else if (v > 20 && v <= 30) dewasa = (v - 20) / 10;
    else if (v > 30 && v < 40) dewasa = (40 - v) / 10;
    else dewasa = 0;

    // Lansia: 30-60 (naik dari 30, peak di 50-60)
    if (v <= 30) lansia = 0;
    else if (v > 30 && v <= 50) lansia = (v - 30) / 20;
    else lansia = 1;

    return { remaja, dewasa, lansia };
  };

  // Fungsi Fuzzifikasi Doubting Time (Rendah/Cepat, Sedang, Tinggi/Lambat)
  const fuzzifyDoubtingTime = (value: string) => {
    const v = parseFloat(value);
    let rendah = 0, sedang = 0, tinggi = 0;

    // Rendah/Cepat: 0-8 (peak di 0-4, turun ke 8)
    if (v <= 4) rendah = 1;
    else if (v > 4 && v < 8) rendah = (8 - v) / 4;
    else rendah = 0;

    // Sedang: 4-12 (naik dari 4, peak di 8, turun ke 12)
    if (v <= 4) sedang = 0;
    else if (v > 4 && v <= 8) sedang = (v - 4) / 4;
    else if (v > 8 && v <= 12) sedang = (12 - v) / 4;  // FIX: tambah = untuk include 12
    else sedang = 0;

    // Tinggi/Lambat: 8-16 (naik dari 8, peak di 12-16)
    if (v <= 8) tinggi = 0;
    else if (v > 8 && v < 16) tinggi = (v - 8) / 8;  // FIX: slope 8 agar smooth
    else tinggi = 1;

    return { rendah, sedang, tinggi };
  };

  // Rule Base - 81 Rules Complete (semua kombinasi)
  const applyRules = (fuzz: FuzzificationResult) => {
    const rules = [
      // ========== TOTAL ANAMNESIS: RINGAN (27 rules) ==========
      // Ringan + Ringan Merokok
      { condition: ['ringan', 'ringan', 'remaja', 'rendah'], result: 'rendah' },
      { condition: ['ringan', 'ringan', 'remaja', 'sedang'], result: 'rendah' },
      { condition: ['ringan', 'ringan', 'remaja', 'tinggi'], result: 'rendah' },
      { condition: ['ringan', 'ringan', 'dewasa', 'rendah'], result: 'rendah' },
      { condition: ['ringan', 'ringan', 'dewasa', 'sedang'], result: 'rendah' },
      { condition: ['ringan', 'ringan', 'dewasa', 'tinggi'], result: 'rendah' },
      { condition: ['ringan', 'ringan', 'lansia', 'rendah'], result: 'rendah' },
      { condition: ['ringan', 'ringan', 'lansia', 'sedang'], result: 'rendah' },
      { condition: ['ringan', 'ringan', 'lansia', 'tinggi'], result: 'sedang' },
      
      // Ringan + Sedang Merokok
      { condition: ['ringan', 'sedang', 'remaja', 'rendah'], result: 'rendah' },
      { condition: ['ringan', 'sedang', 'remaja', 'sedang'], result: 'sedang' },
      { condition: ['ringan', 'sedang', 'remaja', 'tinggi'], result: 'sedang' },
      { condition: ['ringan', 'sedang', 'dewasa', 'rendah'], result: 'rendah' },
      { condition: ['ringan', 'sedang', 'dewasa', 'sedang'], result: 'sedang' },
      { condition: ['ringan', 'sedang', 'dewasa', 'tinggi'], result: 'sedang' },
      { condition: ['ringan', 'sedang', 'lansia', 'rendah'], result: 'sedang' },
      { condition: ['ringan', 'sedang', 'lansia', 'sedang'], result: 'sedang' },
      { condition: ['ringan', 'sedang', 'lansia', 'tinggi'], result: 'sedang' },
      
      // Ringan + Berat Merokok
      { condition: ['ringan', 'berat', 'remaja', 'rendah'], result: 'sedang' },
      { condition: ['ringan', 'berat', 'remaja', 'sedang'], result: 'sedang' },
      { condition: ['ringan', 'berat', 'remaja', 'tinggi'], result: 'sedang' },
      { condition: ['ringan', 'berat', 'dewasa', 'rendah'], result: 'sedang' },
      { condition: ['ringan', 'berat', 'dewasa', 'sedang'], result: 'sedang' },
      { condition: ['ringan', 'berat', 'dewasa', 'tinggi'], result: 'tinggi' },
      { condition: ['ringan', 'berat', 'lansia', 'rendah'], result: 'sedang' },
      { condition: ['ringan', 'berat', 'lansia', 'sedang'], result: 'sedang' },
      { condition: ['ringan', 'berat', 'lansia', 'tinggi'], result: 'tinggi' },
      
      // ========== TOTAL ANAMNESIS: SEDANG (27 rules) ==========
      // Sedang + Ringan Merokok
      { condition: ['sedang', 'ringan', 'remaja', 'rendah'], result: 'rendah' },
      { condition: ['sedang', 'ringan', 'remaja', 'sedang'], result: 'sedang' },
      { condition: ['sedang', 'ringan', 'remaja', 'tinggi'], result: 'sedang' },
      { condition: ['sedang', 'ringan', 'dewasa', 'rendah'], result: 'sedang' },
      { condition: ['sedang', 'ringan', 'dewasa', 'sedang'], result: 'sedang' },
      { condition: ['sedang', 'ringan', 'dewasa', 'tinggi'], result: 'sedang' },
      { condition: ['sedang', 'ringan', 'lansia', 'rendah'], result: 'sedang' },
      { condition: ['sedang', 'ringan', 'lansia', 'sedang'], result: 'sedang' },
      { condition: ['sedang', 'ringan', 'lansia', 'tinggi'], result: 'sedang' },
      
      // Sedang + Sedang Merokok
      { condition: ['sedang', 'sedang', 'remaja', 'rendah'], result: 'sedang' },
      { condition: ['sedang', 'sedang', 'remaja', 'sedang'], result: 'sedang' },
      { condition: ['sedang', 'sedang', 'remaja', 'tinggi'], result: 'sedang' },
      { condition: ['sedang', 'sedang', 'dewasa', 'rendah'], result: 'sedang' },
      { condition: ['sedang', 'sedang', 'dewasa', 'sedang'], result: 'sedang' },
      { condition: ['sedang', 'sedang', 'dewasa', 'tinggi'], result: 'tinggi' },
      { condition: ['sedang', 'sedang', 'lansia', 'rendah'], result: 'sedang' },
      { condition: ['sedang', 'sedang', 'lansia', 'sedang'], result: 'tinggi' },
      { condition: ['sedang', 'sedang', 'lansia', 'tinggi'], result: 'tinggi' },
      
      // Sedang + Berat Merokok
      { condition: ['sedang', 'berat', 'remaja', 'rendah'], result: 'sedang' },
      { condition: ['sedang', 'berat', 'remaja', 'sedang'], result: 'tinggi' },
      { condition: ['sedang', 'berat', 'remaja', 'tinggi'], result: 'tinggi' },
      { condition: ['sedang', 'berat', 'dewasa', 'rendah'], result: 'tinggi' },
      { condition: ['sedang', 'berat', 'dewasa', 'sedang'], result: 'tinggi' },
      { condition: ['sedang', 'berat', 'dewasa', 'tinggi'], result: 'tinggi' },
      { condition: ['sedang', 'berat', 'lansia', 'rendah'], result: 'tinggi' },
      { condition: ['sedang', 'berat', 'lansia', 'sedang'], result: 'tinggi' },
      { condition: ['sedang', 'berat', 'lansia', 'tinggi'], result: 'tinggi' },
      
      // ========== TOTAL ANAMNESIS: BERAT (27 rules) ==========
      // Berat + Ringan Merokok
      { condition: ['berat', 'ringan', 'remaja', 'rendah'], result: 'sedang' },
      { condition: ['berat', 'ringan', 'remaja', 'sedang'], result: 'sedang' },
      { condition: ['berat', 'ringan', 'remaja', 'tinggi'], result: 'tinggi' },
      { condition: ['berat', 'ringan', 'dewasa', 'rendah'], result: 'sedang' },
      { condition: ['berat', 'ringan', 'dewasa', 'sedang'], result: 'tinggi' },
      { condition: ['berat', 'ringan', 'dewasa', 'tinggi'], result: 'tinggi' },
      { condition: ['berat', 'ringan', 'lansia', 'rendah'], result: 'tinggi' },
      { condition: ['berat', 'ringan', 'lansia', 'sedang'], result: 'tinggi' },
      { condition: ['berat', 'ringan', 'lansia', 'tinggi'], result: 'tinggi' },
      
      // Berat + Sedang Merokok
      { condition: ['berat', 'sedang', 'remaja', 'rendah'], result: 'sedang' },
      { condition: ['berat', 'sedang', 'remaja', 'sedang'], result: 'tinggi' },
      { condition: ['berat', 'sedang', 'remaja', 'tinggi'], result: 'tinggi' },
      { condition: ['berat', 'sedang', 'dewasa', 'rendah'], result: 'tinggi' },
      { condition: ['berat', 'sedang', 'dewasa', 'sedang'], result: 'tinggi' },
      { condition: ['berat', 'sedang', 'dewasa', 'tinggi'], result: 'tinggi' },
      { condition: ['berat', 'sedang', 'lansia', 'rendah'], result: 'tinggi' },
      { condition: ['berat', 'sedang', 'lansia', 'sedang'], result: 'tinggi' },
      { condition: ['berat', 'sedang', 'lansia', 'tinggi'], result: 'tinggi' },
      
      // Berat + Berat Merokok
      { condition: ['berat', 'berat', 'remaja', 'rendah'], result: 'tinggi' },
      { condition: ['berat', 'berat', 'remaja', 'sedang'], result: 'tinggi' },
      { condition: ['berat', 'berat', 'remaja', 'tinggi'], result: 'tinggi' },
      { condition: ['berat', 'berat', 'dewasa', 'rendah'], result: 'tinggi' },
      { condition: ['berat', 'berat', 'dewasa', 'sedang'], result: 'tinggi' },
      { condition: ['berat', 'berat', 'dewasa', 'tinggi'], result: 'tinggi' },
      { condition: ['berat', 'berat', 'lansia', 'rendah'], result: 'tinggi' },
      { condition: ['berat', 'berat', 'lansia', 'sedang'], result: 'tinggi' },
      { condition: ['berat', 'berat', 'lansia', 'tinggi'], result: 'tinggi' }
    ];

    const activatedRules = [];
    
    for (const rule of rules) {
      const [total, derajat, usia, doubting] = rule.condition;
      
      const totalVal = fuzz.anamnesis[total] || 0;
      const derajatVal = fuzz.merokok[derajat] || 0;
      const usiaVal = fuzz.usia[usia] || 0;
      const doubtingVal = fuzz.doubting[doubting] || 0;
      
      const alpha = Math.min(totalVal, derajatVal, usiaVal, doubtingVal);
      
      if (alpha > 0) {
        activatedRules.push({
          rule: rule.condition.join(' AND '),
          alpha: alpha,
          output: rule.result
        });
      }
    }

    return activatedRules;
  };

  // Defuzzifikasi menggunakan Center of Gravity (CoG)
  const defuzzify = (rules: InferenceRule[]) => {
    // Output membership function centers
    const outputSets: Record<string, { center: number }> = {
      rendah: { center: 25 },  // Low performance center
      sedang: { center: 50 },  // Medium performance center
      tinggi: { center: 75 }   // High performance center
    };

    let numerator = 0;
    let denominator = 0;

    // Group rules by output
    const grouped: Record<string, number[]> = {};
    rules.forEach(rule => {
      if (!grouped[rule.output]) {
        grouped[rule.output] = [];
      }
      grouped[rule.output].push(rule.alpha);
    });

    // Calculate CoG using max alpha for each output category
    Object.keys(grouped).forEach(output => {
      const maxAlpha = Math.max(...grouped[output]);
      const center = outputSets[output]?.center || 50;
      numerator += maxAlpha * center;
      denominator += maxAlpha;
    });

    return denominator > 0 ? numerator / denominator : 0;
  };

  const handleCalculate = () => {
    if (!dataInput.totalAnamnesis || !dataInput.derajatMerokok || 
        !dataInput.usia || !dataInput.doubtingTime) {
      alert('Mohon isi semua data input terlebih dahulu!');
      return;
    }

    // Validasi range (optional warning, tetap bisa proses)
    const warnings = [];
    const ta = parseFloat(dataInput.totalAnamnesis);
    const dm = parseFloat(dataInput.derajatMerokok);
    const u = parseFloat(dataInput.usia);
    const dt = parseFloat(dataInput.doubtingTime);

    if (ta < 0 || ta > 100) warnings.push('Total Anamnesis sebaiknya 0-100');
    if (dm < 0 || dm > 800) warnings.push('Derajat Merokok sebaiknya 0-800');
    if (u < 10 || u > 70) warnings.push('Usia sebaiknya 10-70 tahun');
    if (dt < 0 || dt > 16) warnings.push('Doubting Time sebaiknya 0-16 jam');

    if (warnings.length > 0) {
      const proceed = confirm(`Peringatan:\n${warnings.join('\n')}\n\nLanjutkan perhitungan?`);
      if (!proceed) return;
    }

    // Fuzzifikasi semua input
    const anamnesis = fuzzifyTotalAnamnesis(dataInput.totalAnamnesis);
    const merokok = fuzzifyDerajatMerokok(dataInput.derajatMerokok);
    const usia = fuzzifyUsia(dataInput.usia);
    const doubting = fuzzifyDoubtingTime(dataInput.doubtingTime);

    const fuzzResult = { anamnesis, merokok, usia, doubting };
    setFuzzificationResult(fuzzResult);

    // Inferensi - apply rule base
    const rules = applyRules(fuzzResult);
    setInferenceResult(rules);

    // Defuzzifikasi
    const crisp = defuzzify(rules);
    setDefuzzificationResult(crisp);
    
    // Auto switch to result tab
    setActiveTab('defuzzifikasi');
  };

  const loadSampleData = (sampleNumber: number) => {
    const samples: Record<number, typeof dataInput> = {
      1: { totalAnamnesis: '25', derajatMerokok: '500', usia: '28', doubtingTime: '10' },
      2: { totalAnamnesis: '80', derajatMerokok: '600', usia: '20', doubtingTime: '6' },
      3: { totalAnamnesis: '80', derajatMerokok: '100', usia: '20', doubtingTime: '5' },
      4: { totalAnamnesis: '60', derajatMerokok: '400', usia: '40', doubtingTime: '12' }
    };
    setDataInput(samples[sampleNumber]);
  };

  const getOutputCategory = (value: number) => {
    if (value <= 40) return 'Rendah';
    if (value <= 70) return 'Sedang';
    return 'Tinggi';
  };

  // Generate data untuk grafik membership functions
  const generateChartData = (type: string, inputValue: number | null = null) => {
    const data = [];
    
    if (type === 'anamnesis') {
      for (let x = 0; x <= 100; x += 2) {
        let ringan = 0, sedang = 0, berat = 0;
        if (x <= 20) ringan = 1;
        else if (x > 20 && x < 40) ringan = (40 - x) / 20;
        
        if (x > 20 && x <= 40) sedang = (x - 20) / 20;
        else if (x > 40 && x < 60) sedang = (60 - x) / 20;
        
        if (x > 40 && x <= 80) berat = (x - 40) / 40;
        else if (x > 80) berat = 1;
        
        data.push({ x, ringan, sedang, berat });
      }
    } else if (type === 'merokok') {
      for (let x = 0; x <= 800; x += 10) {
        let ringan = 0, sedang = 0, berat = 0;
        if (x <= 100) ringan = 1;
        else if (x > 100 && x < 300) ringan = (300 - x) / 200;
        
        if (x > 100 && x <= 350) sedang = (x - 100) / 250;
        else if (x > 350 && x < 600) sedang = (600 - x) / 250;
        
        if (x > 400 && x <= 600) berat = (x - 400) / 200;
        else if (x > 600) berat = 1;
        
        data.push({ x, ringan, sedang, berat });
      }
    } else if (type === 'usia') {
      for (let x = 0; x <= 70; x += 1) {
        let remaja = 0, dewasa = 0, lansia = 0;
        if (x > 10 && x <= 20) remaja = (x - 10) / 10;
        else if (x > 20 && x < 30) remaja = (30 - x) / 10;
        
        if (x > 20 && x <= 30) dewasa = (x - 20) / 10;
        else if (x > 30 && x < 40) dewasa = (40 - x) / 10;
        
        if (x > 30 && x <= 50) lansia = (x - 30) / 20;
        else if (x > 50) lansia = 1;
        
        data.push({ x, remaja, dewasa, lansia });
      }
    } else if (type === 'doubting') {
      for (let x = 0; x <= 16; x += 0.5) {
        let rendah = 0, sedang = 0, tinggi = 0;
        if (x <= 4) rendah = 1;
        else if (x > 4 && x < 8) rendah = (8 - x) / 4;
        
        if (x > 4 && x <= 8) sedang = (x - 4) / 4;
        else if (x > 8 && x < 12) sedang = (12 - x) / 4;
        
        if (x > 8 && x <= 12) tinggi = (x - 8) / 4;
        else if (x > 12) tinggi = 1;
        
        data.push({ x, rendah, sedang, tinggi });
      }
    } else if (type === 'output') {
      for (let x = 0; x <= 100; x += 2) {
        let rendah = 0, sedang = 0, tinggi = 0;
        if (x <= 25) rendah = 1;
        else if (x > 25 && x < 40) rendah = (40 - x) / 15;
        
        if (x > 40 && x <= 50) sedang = (x - 40) / 10;
        else if (x > 50 && x < 70) sedang = (70 - x) / 20;
        
        if (x > 60 && x <= 75) tinggi = (x - 60) / 15;
        else if (x > 75) tinggi = 1;
        
        data.push({ x, rendah, sedang, tinggi, inputValue: inputValue !== null && x === Math.round(inputValue) ? 1 : 0 });
      }
    }
    
    return data;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-3 sm:px-6 py-4 sm:py-5">
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">
            Sistem Fuzzy Logic - Performance Analysis
          </h1>
          <p className="text-slate-600 mt-1 text-xs sm:text-sm">
            Analisis tingkat performa menggunakan metode Tsukamoto
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 mt-4 sm:mt-6">
        <div className="bg-white rounded-t-lg border-b overflow-x-auto">
          <div className="flex space-x-1 p-1 min-w-max">
            {['input', 'fuzzifikasi', 'inferensi', 'defuzzifikasi'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded transition-all duration-200 whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-slate-800 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {tab === 'input' ? 'Input Data' : 
                 tab === 'fuzzifikasi' ? 'Fuzzifikasi' :
                 tab === 'inferensi' ? 'Inferensi' : 'Hasil'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 pb-6 sm:pb-8">
        {activeTab === 'input' && (
          <div className="bg-white rounded-b-lg shadow-sm border border-t-0 p-4 sm:p-6 animate-fade-in">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0 mb-4 sm:mb-5">
              <h2 className="text-base sm:text-lg font-semibold text-slate-800">
                Input Data Pasien
              </h2>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => loadSampleData(1)}
                  className="px-2.5 sm:px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors duration-150"
                >
                  Sample 1
                </button>
                <button
                  onClick={() => loadSampleData(2)}
                  className="px-2.5 sm:px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors duration-150"
                >
                  Sample 2
                </button>
                <button
                  onClick={() => loadSampleData(3)}
                  className="px-2.5 sm:px-3 py-1.5 text-xs bg-slate-100 text-slate-700 rounded hover:bg-slate-200 transition-colors duration-150"
                >
                  Sample 3
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Total Anamnesis <span className="text-slate-400 text-xs">(disarankan: 0-100)</span>
                </label>
                <input
                  type="number"
                  value={dataInput.totalAnamnesis}
                  onChange={(e) => setDataInput({...dataInput, totalAnamnesis: e.target.value})}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
                  placeholder="Masukkan nilai (misal: 25)"
                  step="any"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Derajat Merokok <span className="text-slate-400 text-xs">(disarankan: 0-800)</span>
                </label>
                <input
                  type="number"
                  value={dataInput.derajatMerokok}
                  onChange={(e) => setDataInput({...dataInput, derajatMerokok: e.target.value})}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
                  placeholder="Masukkan nilai (misal: 500)"
                  step="any"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Usia <span className="text-slate-400 text-xs">(disarankan: 10-70 tahun)</span>
                </label>
                <input
                  type="number"
                  value={dataInput.usia}
                  onChange={(e) => setDataInput({...dataInput, usia: e.target.value})}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
                  placeholder="Masukkan usia (misal: 28)"
                  step="any"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Doubting Time <span className="text-slate-400 text-xs">(disarankan: 0-16 jam)</span>
                </label>
                <input
                  type="number"
                  value={dataInput.doubtingTime}
                  onChange={(e) => setDataInput({...dataInput, doubtingTime: e.target.value})}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-transparent text-sm"
                  placeholder="Masukkan waktu (misal: 10)"
                  step="any"
                />
              </div>
            </div>

            <div className="mt-5 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-3">
              <button
                onClick={handleCalculate}
                className="px-5 sm:px-6 py-2.5 bg-slate-800 text-white text-sm font-medium rounded-md hover:bg-slate-700 transition-all duration-200 hover:shadow-md"
              >
                Proses Perhitungan
              </button>
              <button
                onClick={() => setDataInput({ totalAnamnesis: '', derajatMerokok: '', usia: '', doubtingTime: '' })}
                className="px-5 sm:px-6 py-2.5 bg-slate-100 text-slate-700 text-sm font-medium rounded-md hover:bg-slate-200 transition-all duration-200"
              >
                Reset
              </button>
            </div>

            <div className="mt-5 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-xs sm:text-sm font-medium text-blue-900 mb-2">ℹ️ Informasi Input:</h3>
              <ul className="text-xs text-blue-800 space-y-1">
                <li><strong>Total Anamnesis:</strong> Skor total dari hasil anamnesis pasien (disarankan: 0-100)</li>
                <li><strong>Derajat Merokok:</strong> Tingkat kebiasaan merokok dalam satuan tertentu (disarankan: 0-800)</li>
                <li><strong>Usia:</strong> Usia pasien dalam tahun (disarankan: 10-70)</li>
                <li><strong>Doubting Time:</strong> Waktu doubting dalam jam (disarankan: 0-16)</li>
              </ul>
              <p className="text-xs text-blue-700 mt-2 pt-2 border-t border-blue-300">
                💡 <strong>Catatan:</strong> Input bebas, tapi nilai di luar range disarankan akan diberi peringatan
              </p>
            </div>
          </div>
        )}

        {activeTab === 'fuzzifikasi' && (
          <div className="bg-white rounded-b-lg shadow-sm border border-t-0 p-4 sm:p-6 animate-fade-in">
            <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-4 sm:mb-5">
              Hasil Fuzzifikasi
            </h2>
            
            {fuzzificationResult ? (
              <div className="space-y-6">
                {/* Grafik Total Anamnesis */}
                <div className="border border-slate-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
                  <h3 className="font-medium text-slate-800 mb-2 sm:mb-3 text-xs sm:text-sm">Total Anamnesis (Input: {dataInput.totalAnamnesis})</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={generateChartData('anamnesis')}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="x" stroke="#64748b" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '11px' }} domain={[0, 1]} />
                      <Tooltip contentStyle={{ fontSize: '12px', backgroundColor: '#fff', border: '1px solid #e2e8f0' }} />
                      <Line type="monotone" dataKey="ringan" stroke="#10b981" strokeWidth={2} dot={false} name="Ringan" />
                      <Line type="monotone" dataKey="sedang" stroke="#f59e0b" strokeWidth={2} dot={false} name="Sedang" />
                      <Line type="monotone" dataKey="berat" stroke="#ef4444" strokeWidth={2} dot={false} name="Berat" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center">
                      <div className="text-xs text-slate-600">Ringan</div>
                      <div className="text-sm font-semibold text-emerald-600">{(fuzzificationResult.anamnesis.ringan || 0).toFixed(3)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-600">Sedang</div>
                      <div className="text-sm font-semibold text-amber-600">{(fuzzificationResult.anamnesis.sedang || 0).toFixed(3)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-600">Berat</div>
                      <div className="text-sm font-semibold text-rose-600">{(fuzzificationResult.anamnesis.berat || 0).toFixed(3)}</div>
                    </div>
                  </div>
                </div>

                {/* Grafik Derajat Merokok */}
                <div className="border border-slate-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
                  <h3 className="font-medium text-slate-800 mb-2 sm:mb-3 text-xs sm:text-sm">Derajat Merokok (Input: {dataInput.derajatMerokok})</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={generateChartData('merokok')}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="x" stroke="#64748b" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '11px' }} domain={[0, 1]} />
                      <Tooltip contentStyle={{ fontSize: '12px', backgroundColor: '#fff', border: '1px solid #e2e8f0' }} />
                      <Line type="monotone" dataKey="ringan" stroke="#10b981" strokeWidth={2} dot={false} name="Ringan" />
                      <Line type="monotone" dataKey="sedang" stroke="#f59e0b" strokeWidth={2} dot={false} name="Sedang" />
                      <Line type="monotone" dataKey="berat" stroke="#ef4444" strokeWidth={2} dot={false} name="Berat" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center">
                      <div className="text-xs text-slate-600">Ringan</div>
                      <div className="text-sm font-semibold text-emerald-600">{(fuzzificationResult.merokok.ringan || 0).toFixed(3)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-600">Sedang</div>
                      <div className="text-sm font-semibold text-amber-600">{(fuzzificationResult.merokok.sedang || 0).toFixed(3)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-600">Berat</div>
                      <div className="text-sm font-semibold text-rose-600">{(fuzzificationResult.merokok.berat || 0).toFixed(3)}</div>
                    </div>
                  </div>
                </div>

                {/* Usia */}
                <div className="border border-slate-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
                  <h3 className="font-medium text-slate-800 mb-2 sm:mb-3 text-xs sm:text-sm">Usia (Input: {dataInput.usia})</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={generateChartData('usia')}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="x" stroke="#64748b" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '11px' }} domain={[0, 1]} />
                      <Tooltip contentStyle={{ fontSize: '12px', backgroundColor: '#fff', border: '1px solid #e2e8f0' }} />
                      <Line type="monotone" dataKey="remaja" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Remaja" />
                      <Line type="monotone" dataKey="dewasa" stroke="#8b5cf6" strokeWidth={2} dot={false} name="Dewasa" />
                      <Line type="monotone" dataKey="lansia" stroke="#64748b" strokeWidth={2} dot={false} name="Lansia" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center">
                      <div className="text-xs text-slate-600">Remaja</div>
                      <div className="text-sm font-semibold text-sky-600">{(fuzzificationResult.usia.remaja || 0).toFixed(3)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-600">Dewasa</div>
                      <div className="text-sm font-semibold text-violet-600">{(fuzzificationResult.usia.dewasa || 0).toFixed(3)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-600">Lansia</div>
                      <div className="text-sm font-semibold text-slate-600">{(fuzzificationResult.usia.lansia || 0).toFixed(3)}</div>
                    </div>
                  </div>
                </div>

                {/* Doubting Time */}
                <div className="border border-slate-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow duration-200">
                  <h3 className="font-medium text-slate-800 mb-2 sm:mb-3 text-xs sm:text-sm">Doubting Time (Input: {dataInput.doubtingTime})</h3>
                  <ResponsiveContainer width="100%" height={160}>
                    <LineChart data={generateChartData('doubting')}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="x" stroke="#64748b" style={{ fontSize: '11px' }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '11px' }} domain={[0, 1]} />
                      <Tooltip contentStyle={{ fontSize: '12px', backgroundColor: '#fff', border: '1px solid #e2e8f0' }} />
                      <Line type="monotone" dataKey="rendah" stroke="#10b981" strokeWidth={2} dot={false} name="Cepat" />
                      <Line type="monotone" dataKey="sedang" stroke="#f59e0b" strokeWidth={2} dot={false} name="Sedang" />
                      <Line type="monotone" dataKey="tinggi" stroke="#ef4444" strokeWidth={2} dot={false} name="Lambat" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="text-center">
                      <div className="text-xs text-slate-600">Cepat</div>
                      <div className="text-sm font-semibold text-emerald-600">{(fuzzificationResult.doubting.rendah || 0).toFixed(3)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-600">Sedang</div>
                      <div className="text-sm font-semibold text-amber-600">{(fuzzificationResult.doubting.sedang || 0).toFixed(3)}</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xs text-slate-600">Lambat</div>
                      <div className="text-sm font-semibold text-rose-600">{(fuzzificationResult.doubting.tinggi || 0).toFixed(3)}</div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Silakan input data terlebih dahulu pada tab Input Data</p>
            )}
          </div>
        )}

        {activeTab === 'inferensi' && (
          <div className="bg-white rounded-b-lg shadow-sm border border-t-0 p-4 sm:p-6 animate-fade-in">
            <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-4 sm:mb-5">
              Hasil Inferensi (Rule Base)
            </h2>
            
            {inferenceResult ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-slate-200">
                      <th className="text-left py-2.5 px-3 font-medium text-slate-700">No</th>
                      <th className="text-left py-2.5 px-3 font-medium text-slate-700">Rule</th>
                      <th className="text-left py-2.5 px-3 font-medium text-slate-700">Alpha (μ)</th>
                      <th className="text-left py-2.5 px-3 font-medium text-slate-700">Output</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inferenceResult.map((rule, idx) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition">
                        <td className="py-2.5 px-3 text-slate-600">{idx + 1}</td>
                        <td className="py-2.5 px-3 text-slate-700 font-mono text-xs">{rule.rule}</td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">{rule.alpha.toFixed(4)}</td>
                        <td className="py-2.5 px-3">
                          <span className={`px-2.5 py-1 rounded text-xs font-medium ${
                            rule.output === 'rendah' ? 'bg-emerald-100 text-emerald-700' :
                            rule.output === 'sedang' ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {rule.output.charAt(0).toUpperCase() + rule.output.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Silakan input data terlebih dahulu pada tab Input Data</p>
            )}
          </div>
        )}

        {activeTab === 'defuzzifikasi' && (
          <div className="bg-white rounded-b-lg shadow-sm border border-t-0 p-4 sm:p-6 animate-fade-in">
            <h2 className="text-base sm:text-lg font-semibold text-slate-800 mb-4 sm:mb-5">
              Hasil Akhir (Defuzzifikasi)
            </h2>
            
            {defuzzificationResult !== null ? (
              <div>
                {/* Grafik Output Membership Functions */}
                <div className="border border-slate-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-5 hover:shadow-md transition-shadow duration-200">
                  <h3 className="font-medium text-slate-800 mb-2 sm:mb-3 text-xs sm:text-sm">Output Membership Functions</h3>
                  <ResponsiveContainer width="100%" height={220}>
                    <LineChart data={generateChartData('output', defuzzificationResult)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                      <XAxis dataKey="x" stroke="#64748b" style={{ fontSize: '11px' }} label={{ value: 'Performance Score', position: 'insideBottom', offset: -5, style: { fontSize: '11px' } }} />
                      <YAxis stroke="#64748b" style={{ fontSize: '11px' }} domain={[0, 1]} />
                      <Tooltip contentStyle={{ fontSize: '12px', backgroundColor: '#fff', border: '1px solid #e2e8f0' }} />
                      <Line type="monotone" dataKey="rendah" stroke="#10b981" strokeWidth={2} dot={false} name="Rendah" />
                      <Line type="monotone" dataKey="sedang" stroke="#f59e0b" strokeWidth={2} dot={false} name="Sedang" />
                      <Line type="monotone" dataKey="tinggi" stroke="#ef4444" strokeWidth={2} dot={false} name="Tinggi" />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="flex justify-center mt-2">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded text-xs">
                      <div className="w-0.5 h-8 bg-slate-800"></div>
                      <span className="font-medium">CoG: {defuzzificationResult.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 text-center">
                  <p className="text-slate-600 text-sm mb-2">Nilai Output (CoG)</p>
                  <p className="text-4xl font-bold text-slate-800 mb-4">
                    {defuzzificationResult.toFixed(2)}
                  </p>
                  <div className="w-full bg-slate-200 h-2 rounded-full mb-4">
                    <div 
                      className="h-2 rounded-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500"
                      style={{width: `${defuzzificationResult}%`}}
                    ></div>
                  </div>
                  <p className="text-slate-600 text-xs mb-2">Kategori Performa</p>
                  <span className={`inline-block px-5 py-2 rounded-lg text-base font-semibold ${
                    getOutputCategory(defuzzificationResult) === 'Rendah' ? 'bg-emerald-100 text-emerald-800' :
                    getOutputCategory(defuzzificationResult) === 'Sedang' ? 'bg-amber-100 text-amber-800' :
                    'bg-rose-100 text-rose-800'
                  }`}>
                    {getOutputCategory(defuzzificationResult)}
                  </span>
                </div>

                <div className="mt-5 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                  <h3 className="font-medium text-slate-800 mb-2 text-sm">Interpretasi Hasil:</h3>
                  <p className="text-slate-700 text-sm leading-relaxed">
                    {getOutputCategory(defuzzificationResult) === 'Rendah' && 
                      'Tingkat performa pasien berada pada kategori rendah. Kondisi ini menunjukkan resiko yang relatif rendah, namun tetap memerlukan monitoring berkala untuk memastikan tidak ada perubahan kondisi yang signifikan.'}
                    {getOutputCategory(defuzzificationResult) === 'Sedang' && 
                      'Tingkat performa pasien berada pada kategori sedang. Kondisi ini memerlukan perhatian lebih intensif dan evaluasi berkala untuk mencegah penurunan kondisi lebih lanjut.'}
                    {getOutputCategory(defuzzificationResult) === 'Tinggi' && 
                      'Tingkat performa pasien berada pada kategori tinggi. Kondisi ini menunjukkan resiko yang cukup serius dan memerlukan tindakan medis yang lebih intensif serta pemantauan ketat.'}
                  </p>
                </div>

                {inferenceResult && (
                  <div className="mt-5 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-3 text-sm">Detail Perhitungan CoG:</h3>
                    <div className="text-xs text-blue-800 space-y-2">
                      <p className="font-mono">
                        Jumlah rule aktif: <strong>{inferenceResult.length}</strong>
                      </p>
                      <div className="mt-2">
                        <p className="mb-1">Agregasi output:</p>
                        {(() => {
                          const grouped: Record<string, number[]> = {};
                          inferenceResult.forEach(rule => {
                            if (!grouped[rule.output]) grouped[rule.output] = [];
                            grouped[rule.output].push(rule.alpha);
                          });
                          return Object.keys(grouped).map(output => {
                            const maxAlpha = Math.max(...grouped[output]);
                            return (
                              <div key={output} className="ml-3 font-mono">
                                • {output.charAt(0).toUpperCase() + output.slice(1)}: max(α) = {maxAlpha.toFixed(4)}
                              </div>
                            );
                          });
                        })()}
                      </div>
                      <p className="mt-2 pt-2 border-t border-blue-300">
                        <strong>Metode:</strong> Center of Gravity (CoG) / Centroid Method
                      </p>
                    </div>
                  </div>
                )}

                <div className="mt-5 flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveTab('input')}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors duration-150"
                  >
                    Input Baru
                  </button>
                  <button
                    onClick={() => setActiveTab('fuzzifikasi')}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors duration-150"
                  >
                    Lihat Fuzzifikasi
                  </button>
                  <button
                    onClick={() => setActiveTab('inferensi')}
                    className="px-3 sm:px-4 py-2 text-xs sm:text-sm bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200 transition-colors duration-150"
                  >
                    Lihat Inferensi
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-slate-500 text-sm">Silakan input data terlebih dahulu pada tab Input Data</p>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="max-w-6xl mx-auto px-3 sm:px-6 py-5 sm:py-6 mt-6 sm:mt-8">
        <div className="border-t border-slate-200 pt-5 sm:pt-6">
          <div className="text-center text-xs sm:text-sm text-slate-600">
            <p className="mb-1 sm:mb-2">Sistem Fuzzy Logic menggunakan Metode Tsukamoto</p>
            <p className="text-xs text-slate-500">
              Dengan 4 variabel input (Total Anamnesis, Derajat Merokok, Usia, Doubting Time) dan 81 rule base lengkap
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}