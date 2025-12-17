
import React from 'react';
import { Customer, CustomerStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, Users, Banknote, CalendarRange, TrendingUp, Calendar, CalendarDays } from 'lucide-react';

interface DashboardProps {
  customers: Customer[];
}

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export const Dashboard: React.FC<DashboardProps> = ({ customers }) => {
  // Use all customers for historical data (Penyaluran), filtered by disbursement date
  const now = new Date();
  
  // Helpers for date ranges
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay()); // Sunday as start
  startOfThisWeek.setHours(0,0,0,0);

  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfThisYear = new Date(now.getFullYear(), 0, 1);

  // --- STATISTIK WAKTU (PENYALURAN) ---
  let totalWeek = 0;
  let totalMonth = 0;
  let totalYear = 0;

  customers.forEach(c => {
      // Logic: Hitung berdasarkan tanggal cair (disbursementDate)
      // Abaikan status BATAL, tapi hitung Lunas/Aktif/PKA/Meninggal karena uang pernah cair
      if (c.status === CustomerStatus.CANCELLED) return;
      if (!c.nominative.disbursementDate) return;

      const cairDate = new Date(c.nominative.disbursementDate);
      const amount = c.nominative.loanAmount;

      if (cairDate >= startOfThisWeek) totalWeek += amount;
      if (cairDate >= startOfThisMonth) totalMonth += amount;
      if (cairDate >= startOfThisYear) totalYear += amount;
  });

  // --- TOP 10 PENYALURAN MARKETING (TAHUN INI) ---
  const marketingStats: Record<string, number> = {};

  customers.forEach(c => {
      if (c.status === CustomerStatus.CANCELLED) return;
      if (!c.nominative.disbursementDate) return;
      
      const cairDate = new Date(c.nominative.disbursementDate);
      if (cairDate >= startOfThisYear) {
          const mName = c.marketingName ? c.marketingName.trim().toUpperCase() : 'NON-MARKETING';
          if (!marketingStats[mName]) marketingStats[mName] = 0;
          marketingStats[mName] += c.nominative.loanAmount;
      }
  });

  // Convert to array and sort
  const marketingChartData = Object.entries(marketingStats)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10

  // Stat Card Component
  const StatCard = ({ title, value, icon: Icon, colorClass, subTitle }: any) => (
    <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-100 flex items-start justify-between">
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-xl font-bold text-slate-800">{value}</h3>
        {subTitle && <p className="text-[10px] text-slate-400 mt-1">{subTitle}</p>}
      </div>
      <div className={`p-2.5 rounded-lg ${colorClass} text-white`}>
        <Icon size={20} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. KARTU STATISTIK WAKTU */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
         <StatCard 
            title="Penyaluran Minggu Ini"
            value={formatCurrency(totalWeek)}
            icon={Calendar}
            colorClass="bg-orange-500"
            subTitle="Total pencairan minggu berjalan"
         />
         <StatCard 
            title="Penyaluran Bulan Ini"
            value={formatCurrency(totalMonth)}
            icon={CalendarDays}
            colorClass="bg-orange-600"
            subTitle={`Periode ${now.toLocaleString('default', { month: 'long' })}`}
         />
         <StatCard 
            title="Penyaluran Tahun Ini"
            value={formatCurrency(totalYear)}
            icon={CalendarRange}
            colorClass="bg-orange-700"
            subTitle={`Tahun ${now.getFullYear()}`}
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 2. CHART TOP 10 MARKETING (ORANGE STYLE) */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[450px]">
          <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-lg font-bold text-slate-800">Top 10 Penyaluran Marketing</h3>
                <p className="text-xs text-slate-500">Performa penyaluran kredit tertinggi tahun ini</p>
              </div>
              <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                  <TrendingUp size={20}/>
              </div>
          </div>
          
          <ResponsiveContainer width="100%" height="85%">
            <BarChart data={marketingChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={120} 
                tick={{fontSize: 11, fill: '#64748b', fontWeight: 600}} 
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{fill: '#fff7ed'}}
                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                formatter={(value: number) => [formatCurrency(value), 'Total Penyaluran']}
              />
              <Bar 
                dataKey="value" 
                fill="#f97316" // Orange-500
                radius={[0, 4, 4, 0]} 
                barSize={20}
                animationDuration={1500}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 3. RINGKASAN PORTFOLIO (SIDEBAR STATS) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col justify-between">
           <div>
               <h3 className="text-sm font-bold text-slate-800 mb-4 border-b pb-2">Ringkasan Portfolio</h3>
               <div className="space-y-4">
                   <div className="flex justify-between items-center">
                       <span className="text-xs text-slate-500 font-medium">Nasabah Aktif</span>
                       <span className="text-sm font-bold text-slate-800">{customers.filter(c => c.status === CustomerStatus.ACTIVE || !c.status).length} Orang</span>
                   </div>
                   <div className="flex justify-between items-center">
                       <span className="text-xs text-slate-500 font-medium">Total Asset (OS)</span>
                       <span className="text-sm font-bold text-blue-600">
                           {formatCurrency(customers.filter(c => c.status === CustomerStatus.ACTIVE || !c.status).reduce((acc, c) => acc + c.nominative.loanAmount, 0))}
                       </span>
                   </div>
                   <div className="flex justify-between items-center">
                       <span className="text-xs text-slate-500 font-medium">Est. Bunga Masuk (Bln)</span>
                       <span className="text-sm font-bold text-green-600">
                           {/* Kasar: Angsuran - (Plafon/Tenor) */}
                           {formatCurrency(customers.filter(c => c.status === CustomerStatus.ACTIVE || !c.status).reduce((acc, c) => {
                               const pokok = c.nominative.loanAmount / c.nominative.tenureMonths;
                               const bunga = c.nominative.monthlyInstallment - pokok;
                               return acc + Math.max(0, bunga);
                           }, 0))}
                       </span>
                   </div>
               </div>
           </div>

           <div className="mt-6 pt-6 border-t border-slate-100">
               <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 text-center">
                   <p className="text-xs text-orange-600 font-bold uppercase mb-1">Target Tahunan</p>
                   <p className="text-2xl font-bold text-orange-700">85%</p>
                   <div className="w-full bg-orange-200 h-1.5 rounded-full mt-2 overflow-hidden">
                       <div className="bg-orange-500 h-1.5 rounded-full w-[85%]"></div>
                   </div>
                   <p className="text-[10px] text-orange-500 mt-2">Pencapaian penyaluran vs Target</p>
               </div>
           </div>
        </div>

      </div>
    </div>
  );
};
