
import React from 'react';
import { Customer, CustomerStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, Calendar, CalendarDays, Calculator, Landmark, Building2, FileSpreadsheet } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DashboardProps {
  customers: Customer[];
}

const formatCurrency = (val: number) => 
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

export const Dashboard: React.FC<DashboardProps> = ({ customers }) => {
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  startOfThisWeek.setHours(0,0,0,0);
  const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const startOfThisYear = new Date(now.getFullYear(), 0, 1);

  // LOGIKA HITUNG NET SAMA DENGAN FORM & LIST
  const calculateNet = (c: Customer) => {
    const nom = c.nominative;
    const totalMonthly = (nom.monthlyInstallment || 0) + (nom.mandatorySavings || 0);
    const totalPotonganAwal = (nom.riskReserve || 0) + (nom.adminFee || 0) + (nom.provisionFee || 0) + (nom.principalSavings || 0);
    const totalAngsuranDimuka = (nom.blockedInstallmentCount || 0) * totalMonthly;
    const totalAlokasiLain = (nom.blockedAmountSK || 0) + (nom.flaggingFee || 0) + (nom.repaymentAmount || 0);
    return nom.loanAmount - totalPotonganAwal - totalAngsuranDimuka - totalAlokasiLain - (nom.marketingFee || 0);
  };

  const handleExportMaster = () => {
    if (customers.length === 0) {
      alert("Tidak ada data untuk diexport.");
      return;
    }

    const dataToExport = customers.map((c, index) => {
      const nom = c.nominative;
      const pen = c.pension;
      const net = calculateNet(c);
      
      return {
        "No": index + 1,
        "Status": c.status || 'Aktif',
        "Nama Nasabah": c.personal.fullName,
        "NIK": `'${c.personal.nik}`,
        "NOPEN": `'${pen.pensionNumber}`,
        "Kantor Bayar": pen.formerInstitution || '-',
        "Jenis Pensiun": pen.pensionType,
        "No SK": pen.skNumber || '-',
        "Tgl Keluar SK": pen.skIssuanceDate || '-',
        "Tgl Terima Arsip": pen.skReceivedDate || '-',
        "Plafon": nom.loanAmount,
        "Tenor": nom.tenureMonths,
        "Angsuran": nom.monthlyInstallment,
        "Simp Wajib": nom.mandatorySavings,
        "Total Potongan": (nom.riskReserve || 0) + (nom.adminFee || 0) + (nom.provisionFee || 0) + (nom.principalSavings || 0),
        "Angsuran Dimuka": (nom.blockedInstallmentCount || 0) * (nom.monthlyInstallment + nom.mandatorySavings),
        "Pelunasan Lama": nom.repaymentAmount || 0,
        "Terima Bersih (Net)": net,
        "Tgl Cair": nom.disbursementDate || '-',
        "Marketing": c.marketingName || '-',
        "Catatan Arsip": pen.skDescription || '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Master Database KJAM");
    
    // Auto-width adjustment
    const wscols = Object.keys(dataToExport[0]).map(() => ({ wch: 20 }));
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Laporan_Master_KJAM_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  let totalWeekNet = 0;
  let totalMonthNet = 0;
  let totalYearPlafon = 0;

  const institutionStats = {
    pos: 0,
    smbc: 0,
    bri: 0,
    mantap: 0,
    dpTaspen: 0,
    lainnya: 0
  };

  customers.forEach(c => {
      if (c.status !== CustomerStatus.CANCELLED) {
        const inst = (c.pension.formerInstitution || '').toLowerCase();
        if (inst.includes('pos')) institutionStats.pos++;
        else if (inst.includes('smbc') || inst.includes('btpn')) institutionStats.smbc++;
        else if (inst.includes('bri')) institutionStats.bri++;
        else if (inst.includes('mantap')) institutionStats.mantap++;
        else if (inst.includes('dp taspen') || inst.includes('dp-taspen')) institutionStats.dpTaspen++;
        else institutionStats.lainnya++;
      }

      if (c.status === CustomerStatus.CANCELLED) return;
      if (!c.nominative.disbursementDate) return;
      const cairDate = new Date(c.nominative.disbursementDate);
      const net = calculateNet(c);

      if (cairDate >= startOfThisWeek) totalWeekNet += net;
      if (cairDate >= startOfThisMonth) totalMonthNet += net;
      if (cairDate >= startOfThisYear) totalYearPlafon += c.nominative.loanAmount;
  });

  const StatCard = ({ title, value, icon: Icon, colorClass, subTitle }: any) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-start justify-between transition-transform hover:scale-[1.02]">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
        <h3 className="text-2xl font-black text-slate-800">{value}</h3>
        {subTitle && <p className="text-[10px] text-slate-400 mt-1">{subTitle}</p>}
      </div>
      <div className={`p-3 rounded-xl ${colorClass} text-white shadow-lg`}>
        <Icon size={24} />
      </div>
    </div>
  );

  const InstitutionBadge = ({ label, count, color }: { label: string, count: number, color: string }) => (
    <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 bg-slate-50/50">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${color}`}></div>
        <span className="text-xs font-bold text-slate-600 uppercase">{label}</span>
      </div>
      <span className="text-sm font-black text-slate-800">{count}</span>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <StatCard title="Penyaluran Bersih Minggu Ini" value={formatCurrency(totalWeekNet)} icon={Calendar} colorClass="bg-blue-600" subTitle="Total dana bersih cair ke anggota" />
         <StatCard title="Penyaluran Bersih Bulan Ini" value={formatCurrency(totalMonthNet)} icon={CalendarDays} colorClass="bg-green-600" subTitle={`${now.toLocaleString('default', { month: 'long' })} ${now.getFullYear()}`} />
         <StatCard title="Total Plafon Tahun Ini" value={formatCurrency(totalYearPlafon)} icon={TrendingUp} colorClass="bg-orange-600" subTitle="Akumulasi plafon kotor" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-blue-100 text-blue-600 rounded-2xl"><Building2 size={24}/></div>
              <div>
                  <h3 className="text-xl font-black text-slate-800">Distribusi Kantor Bayar</h3>
                  <p className="text-sm text-slate-500">Pemetaan jumlah nasabah berdasarkan instansi bayar</p>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <InstitutionBadge label="PT POS" count={institutionStats.pos} color="bg-orange-500" />
              <InstitutionBadge label="BTPN / SMBC" count={institutionStats.smbc} color="bg-blue-500" />
              <InstitutionBadge label="BRI" count={institutionStats.bri} color="bg-blue-800" />
              <InstitutionBadge label="Bank Mantap" count={institutionStats.mantap} color="bg-teal-500" />
              <InstitutionBadge label="DP Taspen" count={institutionStats.dpTaspen} color="bg-blue-400" />
              <InstitutionBadge label="Lainnya" count={institutionStats.lainnya} color="bg-slate-400" />
          </div>

          <div className="mt-10 h-[250px] flex items-center justify-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
             <p className="text-slate-400 font-medium italic">Sistem Pelaporan Terintegrasi Aktif</p>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 flex flex-col justify-between">
            <div className="space-y-6">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest border-b pb-4">Kesehatan Portofolio</h3>
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-bold uppercase">Total Nasabah Terdaftar</span>
                        <span className="text-lg font-black text-slate-800">{customers.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-bold uppercase">Total OS Plafon</span>
                        <span className="text-lg font-black text-blue-600">{formatCurrency(customers.reduce((a,c) => a+c.nominative.loanAmount, 0))}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-xs text-slate-500 font-bold uppercase">Rata-rata Plafon</span>
                        <span className="text-lg font-black text-slate-800">
                          {customers.length > 0 ? formatCurrency(Math.round(customers.reduce((a,c) => a+c.nominative.loanAmount, 0) / customers.length)) : 'Rp 0'}
                        </span>
                    </div>
                </div>
            </div>
            <div className="mt-8 pt-8 border-t border-slate-100">
                <button 
                  onClick={handleExportMaster}
                  className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-black transition uppercase tracking-widest text-xs flex items-center justify-center gap-2 group"
                >
                  <FileSpreadsheet size={18} className="text-green-400 group-hover:scale-110 transition" /> 
                  Cetak Laporan Lengkap (.xlsx)
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
