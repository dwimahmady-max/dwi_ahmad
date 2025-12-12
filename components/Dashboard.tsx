
import React from 'react';
import { Customer, CustomerStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Wallet, Users, Banknote, TrendingUp, Clock, FileX, Skull, CheckCircle2, Building2, ArrowRightLeft } from 'lucide-react';

interface DashboardProps {
  customers: Customer[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export const Dashboard: React.FC<DashboardProps> = ({ customers }) => {
  // Filter only Active Customers for financial stats
  const activeCustomers = customers.filter(c => c.status === CustomerStatus.ACTIVE || !c.status);

  // Calculate Specific Status Counts
  const today = new Date();
  today.setHours(0,0,0,0);

  // 1. Lunas Otomatis: Status Aktif TAPI Tanggal Jadwal Lunas sudah lewat hari ini
  const autoPaidCount = activeCustomers.filter(c => {
    if (!c.nominative.maturityDate) return false;
    const maturity = new Date(c.nominative.maturityDate);
    return today > maturity;
  }).length;

  // 2. PKA (Pelunasan Dipercepat)
  const pkaCount = customers.filter(c => c.status === CustomerStatus.PKA).length;

  // 3. Pembatalan
  const cancelledCount = customers.filter(c => c.status === CustomerStatus.CANCELLED).length;

  // 4. Meninggal Dunia
  const deceasedCount = customers.filter(c => c.status === CustomerStatus.DECEASED).length;

  // --- KANTOR BAYAR STATISTICS ---
  const kbStats = {
      POS: 0,
      BTPN: 0,
      BRI: 0,
      MANTAP: 0,
      TASPEN: 0,
      MUTASI: 0
  };

  activeCustomers.forEach(c => {
      const kb = (c.pension.formerInstitution || '').toUpperCase();
      const desc = (c.pension.skDescription || '').toUpperCase();
      const mutationTarget = (c.pension.mutationOffice || '').trim();
      
      // Categorize Kantor Bayar (Heuristic Matching)
      if (kb.includes('POS') || kb.includes('POSINDO')) {
          kbStats.POS++;
      } else if (kb.includes('BTPN') || kb.includes('SMBC') || kb.includes('WOORI')) {
          kbStats.BTPN++;
      } else if (kb.includes('BRI') && !kb.includes('ASABRI')) { // Prevent matching 'ASABRI' word
          kbStats.BRI++;
      } else if (kb.includes('MANTAP') || kb.includes('MANDIRI TASPEN')) {
          kbStats.MANTAP++;
      } else if (kb.includes('TASPEN') || kb.includes('BP TASPEN')) {
          kbStats.TASPEN++;
      }

      // Check Mutasi Status (Keyword Search OR New mutationOffice field)
      if (kb.includes('MUTASI') || desc.includes('MUTASI') || mutationTarget.length > 0) {
          kbStats.MUTASI++;
      }
  });

  const kbChartData = [
      { name: 'POS', value: kbStats.POS },
      { name: 'BTPN', value: kbStats.BTPN },
      { name: 'BRI', value: kbStats.BRI },
      { name: 'MANTAP', value: kbStats.MANTAP },
      { name: 'BP TASPEN', value: kbStats.TASPEN },
  ];

  // Aggregate data for Active Portfolio
  const totalCustomers = activeCustomers.length;
  const totalLoan = activeCustomers.reduce((acc, curr) => acc + curr.nominative.loanAmount, 0);
  const totalInstallments = activeCustomers.reduce((acc, curr) => acc + curr.nominative.monthlyInstallment, 0);
  
  // Prepare chart data for Pension Type
  const typeData = [
    { name: 'Taspen', value: activeCustomers.filter(c => c.pension.pensionType === 'Taspen').length },
    { name: 'Asabri', value: activeCustomers.filter(c => c.pension.pensionType === 'Asabri').length },
  ].filter(d => d.value > 0);

  const loanDistribution = activeCustomers.map(c => ({
    name: c.personal.fullName.split(' ')[0], // First name only for brevity
    plafon: c.nominative.loanAmount,
    angsuran: c.nominative.monthlyInstallment
  })).slice(0, 10); // Show top 10 recent

  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex items-center space-x-4">
      <div className={`p-3 rounded-full ${color} text-white`}>
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm text-slate-500 font-medium">{title}</p>
        <h3 className="text-2xl font-bold text-slate-800">{value}</h3>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Main Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Nasabah Aktif" 
          value={totalCustomers} 
          icon={Users} 
          color="bg-blue-500" 
        />
        <StatCard 
          title="Portofolio Aktif" 
          value={formatCurrency(totalLoan)} 
          icon={Wallet} 
          color="bg-emerald-500" 
        />
        <StatCard 
          title="Est. Omzet Bulanan" 
          value={formatCurrency(totalInstallments)} 
          icon={Banknote} 
          color="bg-indigo-500" 
        />
         <StatCard 
          title="Rata-rata Tenor" 
          value={`${activeCustomers.length > 0 ? Math.round(activeCustomers.reduce((a,c) => a+c.nominative.tenureMonths,0)/activeCustomers.length) : 0} Bulan`} 
          icon={TrendingUp} 
          color="bg-orange-500" 
        />
      </div>

      {/* Kantor Bayar Stats */}
      <div>
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 ml-1 flex items-center gap-2">
              <Building2 size={16} /> Sebaran Kantor Bayar
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
               <div className="bg-white p-3 rounded-lg border border-orange-100 shadow-sm">
                   <p className="text-[10px] text-slate-500 font-bold uppercase">Kantor POS</p>
                   <p className="text-lg font-bold text-orange-600">{kbStats.POS}</p>
               </div>
               <div className="bg-white p-3 rounded-lg border border-indigo-100 shadow-sm">
                   <p className="text-[10px] text-slate-500 font-bold uppercase">SMBC / BTPN</p>
                   <p className="text-lg font-bold text-indigo-600">{kbStats.BTPN}</p>
               </div>
               <div className="bg-white p-3 rounded-lg border border-blue-100 shadow-sm">
                   <p className="text-[10px] text-slate-500 font-bold uppercase">Bank BRI</p>
                   <p className="text-lg font-bold text-blue-600">{kbStats.BRI}</p>
               </div>
               <div className="bg-white p-3 rounded-lg border border-yellow-100 shadow-sm">
                   <p className="text-[10px] text-slate-500 font-bold uppercase">Bank MANTAP</p>
                   <p className="text-lg font-bold text-yellow-600">{kbStats.MANTAP}</p>
               </div>
               <div className="bg-white p-3 rounded-lg border border-green-100 shadow-sm">
                   <p className="text-[10px] text-slate-500 font-bold uppercase">BP TASPEN</p>
                   <p className="text-lg font-bold text-green-600">{kbStats.TASPEN}</p>
               </div>
               <div className="bg-slate-800 p-3 rounded-lg border border-slate-700 shadow-sm text-white">
                   <div className="flex items-center gap-1 mb-1">
                      <ArrowRightLeft size={12} className="text-cyan-400" />
                      <p className="text-[10px] font-bold uppercase text-cyan-100">Sedang Mutasi</p>
                   </div>
                   <p className="text-lg font-bold">{kbStats.MUTASI}</p>
               </div>
          </div>
      </div>

      {/* Secondary Stats Row: Resolution Status */}
      <div>
        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-3 ml-1">Status Penyelesaian & Non-Aktif</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Lunas Otomatis */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <Clock size={24} />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Lunas (Jadwal)</p>
                    <p className="text-xl font-bold text-slate-800">{autoPaidCount}</p>
                </div>
            </div>

            {/* Pelunasan PKA */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <CheckCircle2 size={24} />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Pelunasan PKA</p>
                    <p className="text-xl font-bold text-slate-800">{pkaCount}</p>
                </div>
            </div>

            {/* Pembatalan */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                <div className="p-2 bg-red-100 text-red-600 rounded-lg">
                    <FileX size={24} />
                </div>
                <div>
                    <p className="text-xs text-slate-500 font-bold uppercase">Pembatalan</p>
                    <p className="text-xl font-bold text-slate-800">{cancelledCount}</p>
                </div>
            </div>

            {/* Meninggal Dunia */}
            <div className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex items-center gap-3">
                <div className="p-2 bg-slate-800 text-white rounded-lg">
                    <Skull size={24} />
                </div>
                <div>
                    <p className="text-xs text-slate-400 font-bold uppercase">Meninggal Dunia</p>
                    <p className="text-xl font-bold text-slate-800">{deceasedCount}</p>
                </div>
            </div>

        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Loan Distribution Chart */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Top 10 Pinjaman Aktif Terakhir</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={loanDistribution} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="plafon" fill="#3b82f6" name="Plafon Pinjaman" radius={[4, 4, 0, 0]} />
              <Bar dataKey="angsuran" fill="#10b981" name="Angsuran" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pension Type Distribution */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 h-[400px]">
          <h3 className="text-lg font-bold text-slate-800 mb-4">Sebaran Jenis Pensiun</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={typeData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {typeData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
