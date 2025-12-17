
import React, { useState, useEffect } from 'react';
import { MarketingTarget } from '../types';
import { PlusCircle, Search, Edit, Trash2, X, Save, TrendingUp, BarChart4, Calculator, LineChart as LineChartIcon, Eye, EyeOff } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import * as XLSX from 'xlsx';

interface MarketingTargetListProps {
  targets: MarketingTarget[];
  onSave: (target: MarketingTarget) => void;
  onDelete: (id: string) => void;
}

const DEFAULT_TARGET: MarketingTarget = {
  id: '',
  name: '',
  branch: '',
  noa: 0,
  week1: 0,
  week2: 0,
  week3: 0,
  week4: 0,
  week5: 0,
  targetAmount: 0,
  period: new Date().toLocaleString('id-ID', { month: 'long', year: 'numeric' }),
  dailyRealization: {}
};

// Warna untuk garis grafik (bisa ditambah jika marketing banyak)
const COLORS = [
  '#2563eb', '#dc2626', '#16a34a', '#d97706', '#9333ea', 
  '#0891b2', '#db2777', '#4b5563', '#84cc16', '#7c3aed'
];

export const MarketingTargetList: React.FC<MarketingTargetListProps> = ({ targets, onSave, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showChart, setShowChart] = useState(false);
  const [formData, setFormData] = useState<MarketingTarget>(DEFAULT_TARGET);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Helper to init daily state if missing
  useEffect(() => {
    if (isModalOpen && !formData.dailyRealization) {
        setFormData(prev => ({ ...prev, dailyRealization: {} }));
    }
  }, [isModalOpen, formData.dailyRealization]);

  const filtered = targets.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.branch.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- PREPARE CHART DATA ---
  // Transform data: Array of 31 days. Each day object has { day: '1', 'Budi': 50000, 'Siti': 10000, ... }
  const chartData = React.useMemo(() => {
      return Array.from({ length: 31 }, (_, i) => {
          const day = (i + 1).toString();
          const dayData: any = { name: day }; // X-Axis Label
          
          filtered.forEach(target => {
              // Gunakan 0 jika tidak ada data pada tanggal tersebut
              dayData[target.name] = target.dailyRealization?.[day] || 0;
          });
          
          return dayData;
      });
  }, [filtered]);

  const handleEdit = (target: MarketingTarget) => {
    // Ensure dailyRealization exists
    setFormData({ ...target, dailyRealization: target.dailyRealization || {} });
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setFormData({ ...DEFAULT_TARGET, id: crypto.randomUUID(), dailyRealization: {} });
    setIsModalOpen(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleDailyChange = (day: string, value: string) => {
    const amount = parseFloat(value) || 0;
    const newDaily = { ...formData.dailyRealization, [day]: amount };
    
    // Recalculate weeks automatically
    let w1 = 0, w2 = 0, w3 = 0, w4 = 0, w5 = 0;
    
    Object.entries(newDaily).forEach(([d, val]) => {
        const dayNum = parseInt(d);
        if (dayNum >= 1 && dayNum <= 7) w1 += val;
        else if (dayNum >= 8 && dayNum <= 14) w2 += val;
        else if (dayNum >= 15 && dayNum <= 21) w3 += val;
        else if (dayNum >= 22 && dayNum <= 28) w4 += val;
        else if (dayNum >= 29 && dayNum <= 31) w5 += val;
    });

    setFormData(prev => ({
        ...prev,
        dailyRealization: newDaily,
        week1: w1,
        week2: w2,
        week3: w3,
        week4: w4,
        week5: w5
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsModalOpen(false);
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 }).format(val);

  const formatPercent = (realization: number, target: number) => {
    if (target === 0) return '0%';
    return ((realization / target) * 100).toFixed(1) + '%';
  };

  const calculateRealization = (t: MarketingTarget) => {
    return (t.week1 || 0) + (t.week2 || 0) + (t.week3 || 0) + (t.week4 || 0) + (t.week5 || 0);
  };

  const handleExportExcel = () => {
    const dataToExport = filtered.map((t, index) => {
      const realization = calculateRealization(t);
      const remaining = t.targetAmount - realization;
      const percentage = t.targetAmount > 0 ? (realization / t.targetAmount) * 100 : 0;
      
      return {
        "No": index + 1,
        "Marketing": t.name,
        "Cabang": t.branch,
        "NOA": t.noa,
        "Minggu 1": t.week1,
        "Minggu 2": t.week2,
        "Minggu 3": t.week3,
        "Minggu 4": t.week4,
        "Minggu 5": t.week5,
        "Realisasi": realization,
        "Sisa Target": remaining,
        "Target": t.targetAmount,
        "Persentase": `${percentage.toFixed(2)}%`
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Penyaluran Marketing");
    XLSX.writeFile(workbook, `Penyaluran_Marketing_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <BarChart4 className="text-yellow-500" />
            Data Penyaluran Marketing
          </h2>
          <p className="text-sm text-slate-500">Monitoring target dan realisasi harian/mingguan</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Cari Marketing / Cabang..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-yellow-500 outline-none w-full md:w-64"
                />
            </div>
            
            <button 
                onClick={() => setShowChart(!showChart)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition shadow-sm font-medium text-sm ${showChart ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'}`}
            >
                {showChart ? <EyeOff size={18} /> : <LineChartIcon size={18} />}
                <span className="hidden md:inline">{showChart ? 'Tutup Grafik' : 'Lihat Grafik'}</span>
            </button>

            <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow-sm font-medium text-sm"
            >
                <TrendingUp size={18} /> <span className="hidden md:inline">Export</span>
            </button>

            <button 
                onClick={handleAddNew}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition shadow-sm font-medium text-sm"
            >
                <PlusCircle size={18} /> <span className="hidden md:inline">Input Baru</span>
            </button>
        </div>
      </div>

      {/* CHART SECTION */}
      {showChart && filtered.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 animate-in fade-in slide-in-from-top-4">
              <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="font-bold text-slate-800">Grafik Penyaluran Harian</h3>
                    <p className="text-xs text-slate-500">Perbandingan realisasi pencairan per tanggal (1-31)</p>
                  </div>
                  <div className="text-xs text-slate-400 italic">
                      *Klik nama di legenda untuk menyembunyikan
                  </div>
              </div>
              <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 25 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis 
                            dataKey="name" 
                            label={{ value: 'Tanggal', position: 'insideBottom', offset: -15, fontSize: 12, fill: '#94a3b8' }} 
                            tick={{ fontSize: 12, fill: '#64748b' }}
                          />
                          <YAxis 
                            tickFormatter={(val) => `Rp ${val/1000000}jt`} 
                            tick={{ fontSize: 11, fill: '#64748b' }}
                            axisLine={false}
                            tickLine={false}
                          />
                          <Tooltip 
                             contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                             formatter={(value: number) => [`Rp ${new Intl.NumberFormat('id-ID').format(value)}`, '']}
                             labelFormatter={(label) => `Tanggal ${label}`}
                          />
                          <Legend wrapperStyle={{ paddingTop: '20px' }} />
                          {filtered.map((target, index) => (
                              <Line
                                  key={target.id}
                                  type="monotone"
                                  dataKey={target.name}
                                  stroke={COLORS[index % COLORS.length]}
                                  strokeWidth={2}
                                  dot={{ r: 3, strokeWidth: 1 }}
                                  activeDot={{ r: 6 }}
                              />
                          ))}
                      </LineChart>
                  </ResponsiveContainer>
              </div>
          </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-center text-xs border-collapse">
            <thead>
              <tr className="text-slate-800 font-bold uppercase tracking-wider">
                <th className="px-3 py-3 bg-gray-400 text-white border-r border-gray-300 w-10">No</th>
                <th className="px-4 py-3 bg-yellow-300 border-r border-yellow-400 min-w-[150px]">Marketing</th>
                <th className="px-4 py-3 bg-cyan-400 text-white border-r border-cyan-500 min-w-[120px]">Cabang</th>
                <th className="px-3 py-3 bg-gray-400 text-white border-r border-gray-300 w-16">NOA</th>
                <th className="px-3 py-3 bg-yellow-300 border-r border-yellow-400 min-w-[100px]">Minggu 1</th>
                <th className="px-3 py-3 bg-yellow-300 border-r border-yellow-400 min-w-[100px]">Minggu 2</th>
                <th className="px-3 py-3 bg-yellow-300 border-r border-yellow-400 min-w-[100px]">Minggu 3</th>
                <th className="px-3 py-3 bg-yellow-300 border-r border-yellow-400 min-w-[100px]">Minggu 4</th>
                <th className="px-3 py-3 bg-yellow-300 border-r border-yellow-400 min-w-[100px]">Minggu 5</th>
                <th className="px-3 py-3 bg-yellow-300 border-r border-yellow-400 min-w-[120px]">Realisasi</th>
                <th className="px-3 py-3 bg-lime-400 text-slate-900 border-r border-lime-500 min-w-[120px]">Sisa Target</th>
                <th className="px-3 py-3 bg-lime-400 text-slate-900 border-r border-lime-500 min-w-[120px]">Target</th>
                <th className="px-3 py-3 bg-lime-400 text-slate-900 border-r border-lime-500 w-20">Persentase</th>
                <th className="px-3 py-3 bg-slate-100 min-w-[100px]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={14} className="px-6 py-12 text-center text-slate-400">
                    Belum ada data target marketing
                  </td>
                </tr>
              ) : (
                filtered.map((target, index) => {
                  const realization = calculateRealization(target);
                  const remaining = target.targetAmount - realization;
                  const isAchieved = remaining <= 0;
                  
                  return (
                    <tr key={target.id} className="hover:bg-slate-50 transition font-medium">
                      <td className="border-r border-slate-200 bg-gray-50">{index + 1}</td>
                      <td className="px-3 py-2 text-left border-r border-slate-200 font-bold">{target.name}</td>
                      <td className="px-3 py-2 border-r border-slate-200 text-cyan-700">{target.branch}</td>
                      <td className="px-3 py-2 border-r border-slate-200 bg-gray-50">{target.noa}</td>
                      <td className="px-3 py-2 border-r border-slate-200">{formatCurrency(target.week1)}</td>
                      <td className="px-3 py-2 border-r border-slate-200">{formatCurrency(target.week2)}</td>
                      <td className="px-3 py-2 border-r border-slate-200">{formatCurrency(target.week3)}</td>
                      <td className="px-3 py-2 border-r border-slate-200">{formatCurrency(target.week4)}</td>
                      <td className="px-3 py-2 border-r border-slate-200">{formatCurrency(target.week5)}</td>
                      <td className="px-3 py-2 border-r border-slate-200 font-bold bg-yellow-50">{formatCurrency(realization)}</td>
                      <td className={`px-3 py-2 border-r border-slate-200 font-bold ${isAchieved ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(remaining)}
                      </td>
                      <td className="px-3 py-2 border-r border-slate-200 font-bold bg-lime-50">{formatCurrency(target.targetAmount)}</td>
                      <td className={`px-3 py-2 border-r border-slate-200 font-bold ${isAchieved ? 'text-green-700 bg-green-100' : 'text-slate-700'}`}>
                        {formatPercent(realization, target.targetAmount)}
                      </td>
                      <td className="px-2 py-2">
                        {deleteConfirmId === target.id ? (
                           <div className="flex items-center justify-center gap-1">
                             <button onClick={() => onDelete(target.id)} className="p-1 bg-red-600 text-white rounded">Hapus!</button>
                             <button onClick={() => setDeleteConfirmId(null)} className="p-1 bg-gray-200 rounded">Batal</button>
                           </div>
                        ) : (
                           <div className="flex items-center justify-center gap-1">
                             <button onClick={() => handleEdit(target)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"><Edit size={14}/></button>
                             <button onClick={() => setDeleteConfirmId(target.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded"><Trash2 size={14}/></button>
                           </div>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {filtered.length > 0 && (
                <tfoot className="bg-slate-100 font-bold text-slate-800 border-t-2 border-slate-300">
                    <tr>
                        <td colSpan={3} className="px-4 py-3 text-right">TOTAL KESELURUHAN</td>
                        <td className="px-3 py-3">{filtered.reduce((a,b) => a + (b.noa || 0), 0)}</td>
                        <td className="px-3 py-3">{formatCurrency(filtered.reduce((a,b) => a + (b.week1 || 0), 0))}</td>
                        <td className="px-3 py-3">{formatCurrency(filtered.reduce((a,b) => a + (b.week2 || 0), 0))}</td>
                        <td className="px-3 py-3">{formatCurrency(filtered.reduce((a,b) => a + (b.week3 || 0), 0))}</td>
                        <td className="px-3 py-3">{formatCurrency(filtered.reduce((a,b) => a + (b.week4 || 0), 0))}</td>
                        <td className="px-3 py-3">{formatCurrency(filtered.reduce((a,b) => a + (b.week5 || 0), 0))}</td>
                        <td className="px-3 py-3 bg-yellow-100">{formatCurrency(filtered.reduce((a,b) => a + calculateRealization(b), 0))}</td>
                        <td className="px-3 py-3">{formatCurrency(filtered.reduce((a,b) => a + (b.targetAmount - calculateRealization(b)), 0))}</td>
                        <td className="px-3 py-3 bg-lime-100">{formatCurrency(filtered.reduce((a,b) => a + (b.targetAmount || 0), 0))}</td>
                        <td className="px-3 py-3"></td>
                        <td></td>
                    </tr>
                </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* MODAL INPUT/EDIT */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
               <div className="bg-yellow-400 p-4 flex justify-between items-center text-slate-900 shrink-0">
                  <h3 className="font-bold text-lg flex items-center gap-2">
                      <Edit size={20} /> {formData.name ? 'Edit Data Target' : 'Input Target Baru'}
                  </h3>
                  <button onClick={() => setIsModalOpen(false)} className="hover:bg-yellow-500 p-1 rounded-full"><X size={24}/></button>
               </div>
               
               <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
                  {/* Top Section */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-500">Nama Marketing</label>
                          <input required type="text" name="name" value={formData.name} onChange={handleInputChange} className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-yellow-400 outline-none" placeholder="Nama Marketing..." />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-500">Cabang</label>
                          <input required type="text" name="branch" value={formData.branch} onChange={handleInputChange} className="w-full border border-slate-300 p-2 rounded focus:ring-2 focus:ring-cyan-400 outline-none" placeholder="Nama Cabang..." />
                      </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1 col-span-2">
                          <label className="text-xs font-bold uppercase text-slate-500">Target Total (Rp)</label>
                          <input required type="number" min="0" name="targetAmount" value={formData.targetAmount || ''} onChange={handleInputChange} className="w-full border border-lime-300 bg-lime-50 p-2 rounded font-bold" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-500">NOA</label>
                          <input type="number" min="0" name="noa" value={formData.noa || ''} onChange={handleInputChange} className="w-full border border-slate-300 p-2 rounded" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-xs font-bold uppercase text-slate-500">Periode</label>
                          <input type="text" name="period" value={formData.period} onChange={handleInputChange} className="w-full border border-slate-300 p-2 rounded" />
                      </div>
                  </div>

                  {/* Daily Input Grid */}
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                          <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                              <Calculator size={16} /> Input Penyaluran Harian
                          </h4>
                          <span className="text-xs text-slate-500">Isi nominal pada tanggal yang sesuai. Total minggu akan terhitung otomatis.</span>
                      </div>
                      
                      <div className="grid grid-cols-4 md:grid-cols-7 gap-2">
                          {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                             <div key={day} className="space-y-0.5">
                                 <label className="text-[10px] text-slate-400 uppercase font-semibold text-center block">Tgl {day}</label>
                                 <input 
                                     type="number" 
                                     placeholder="0"
                                     value={formData.dailyRealization?.[day.toString()] || ''}
                                     onChange={(e) => handleDailyChange(day.toString(), e.target.value)}
                                     className="w-full text-xs p-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-blue-500 outline-none text-right"
                                 />
                             </div>
                          ))}
                      </div>
                  </div>

                  {/* Summary Weeks (Read Only) */}
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                      <h4 className="text-xs font-bold text-yellow-800 mb-2 uppercase">Rekap Mingguan (Otomatis)</h4>
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                          {[1, 2, 3, 4, 5].map(week => (
                              <div key={week} className="space-y-1">
                                  <label className="text-[10px] font-bold uppercase text-slate-500">Minggu {week}</label>
                                  <div className="w-full bg-white border border-yellow-200 p-2 rounded text-xs font-bold text-right text-slate-700">
                                      {/* @ts-ignore */}
                                      {formatCurrency(formData[`week${week}`] || 0)}
                                  </div>
                              </div>
                          ))}
                      </div>
                      <div className="mt-3 text-right border-t border-yellow-200 pt-2">
                          <span className="text-xs text-slate-500">Total Realisasi Saat Ini: </span>
                          <span className="font-bold text-slate-800 text-lg">{formatCurrency(calculateRealization(formData))}</span>
                      </div>
                  </div>
               </form>

               <div className="p-4 bg-slate-50 border-t flex justify-end gap-3 shrink-0">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-100 rounded-lg">Batal</button>
                    <button onClick={handleSubmit} type="button" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <Save size={18} /> Simpan Data
                    </button>
               </div>
           </div>
        </div>
      )}
    </div>
  );
};
