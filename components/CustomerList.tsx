
import React, { useState } from 'react';
import { Customer, CustomerStatus } from '../types';
import { Search, Edit, Trash2, AlertCircle, FileSpreadsheet, RefreshCw, Wallet, Settings2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onTopUp: (customer: Customer) => void;
  onUpdateStatus: (customer: Customer) => void;
}

export const CustomerList: React.FC<CustomerListProps> = ({ customers, onEdit, onDelete, onTopUp, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = customers.filter(c => 
    c.personal.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.pension.pensionNumber.includes(searchTerm) ||
    c.personal.nik.includes(searchTerm)
  );

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  // LOGIKA PERHITUNGAN SINKRON
  const calculateFinalNet = (c: Customer) => {
    const nom = c.nominative;
    const totalMonthly = (nom.monthlyInstallment || 0) + (nom.mandatorySavings || 0);
    const totalPotonganAwal = (nom.riskReserve || 0) + (nom.adminFee || 0) + (nom.provisionFee || 0) + (nom.principalSavings || 0);
    const totalAngsuranDimuka = (nom.blockedInstallmentCount || 0) * totalMonthly;
    const totalAlokasiLain = (nom.blockedAmountSK || 0) + (nom.flaggingFee || 0) + (nom.repaymentAmount || 0);
    const feeMarketing = nom.marketingFee || 0;

    return nom.loanAmount - totalPotonganAwal - totalAngsuranDimuka - totalAlokasiLain - feeMarketing;
  };

  const handleExportExcel = () => {
    const dataToExport = filtered.map((c, index) => {
      const nom = c.nominative;
      const net = calculateFinalNet(c);
      const totalMonthly = (nom.monthlyInstallment || 0) + (nom.mandatorySavings || 0);
      
      return {
        "No": index + 1,
        "Nama Nasabah": c.personal.fullName,
        "NOPEN": `'${c.pension.pensionNumber}`,
        "NIK": `'${c.personal.nik}`,
        "Plafon": nom.loanAmount,
        "Tenor": nom.tenureMonths,
        "Angsuran Bulanan": totalMonthly,
        "Potongan Awal": (nom.riskReserve || 0) + (nom.adminFee || 0) + (nom.provisionFee || 0) + (nom.principalSavings || 0),
        "Angsuran Dimuka": (nom.blockedInstallmentCount || 0) * totalMonthly,
        "Alokasi Lain": (nom.blockedAmountSK || 0) + (nom.flaggingFee || 0) + (nom.repaymentAmount || 0),
        "Fee Marketing": nom.marketingFee || 0,
        "Terima Bersih (Net)": net,
        "Marketing": c.marketingName || '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Database Nasabah");
    XLSX.writeFile(workbook, `Database_Koperasi_Anugerah_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in">
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4 bg-slate-50/50">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2"><Wallet className="text-blue-600" />Data Nominatif Pinjaman</h2>
          <p className="text-sm text-slate-500">Monitoring penyaluran dan perhitungan terima bersih</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input type="text" placeholder="Cari..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 pr-4 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64 bg-white" />
          </div>
          <button onClick={handleExportExcel} className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-green-700 transition"><FileSpreadsheet size={18} /> Export</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="bg-slate-100 text-slate-700 font-black uppercase text-[10px] tracking-widest border-b border-slate-200">
              <th className="px-6 py-4">Nasabah / Nopen</th>
              <th className="px-6 py-4 text-right">Plafon</th>
              <th className="px-6 py-4 text-right">Terima Bersih (Net)</th>
              <th className="px-6 py-4 text-right">Angsuran + Wajib</th>
              <th className="px-6 py-4 text-center">Tenor</th>
              <th className="px-6 py-4 text-center">Status</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-medium">Data tidak ditemukan</td></tr>
            ) : (
              filtered.map((c) => (
                <tr key={c.id} className="hover:bg-blue-50/30 transition group">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900 group-hover:text-blue-700 transition">{c.personal.fullName}</div>
                    <div className="text-[10px] text-slate-500 font-mono">NOPEN: {c.pension.pensionNumber}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-slate-700">{formatCurrency(c.nominative.loanAmount)}</div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-black text-green-700 bg-green-50 px-2 py-1 rounded-lg inline-block border border-green-100">
                      {formatCurrency(calculateFinalNet(c))}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="font-bold text-slate-900">{formatCurrency((c.nominative.monthlyInstallment || 0) + (c.nominative.mandatorySavings || 0))}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-600 border border-slate-200">{c.nominative.tenureMonths} BLN</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                      c.status === CustomerStatus.ACTIVE ? 'bg-blue-100 text-blue-700 border border-blue-200' : 'bg-orange-100 text-orange-700 border border-orange-200'
                    }`}>
                      {c.status || 'Aktif'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-1 opacity-60 group-hover:opacity-100 transition">
                      <button onClick={() => onUpdateStatus(c)} className="p-2 text-orange-600 hover:bg-white rounded-lg border border-transparent hover:border-orange-100"><Settings2 size={16} /></button>
                      <button onClick={() => onTopUp(c)} className="p-2 text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-blue-100"><RefreshCw size={16} /></button>
                      <button onClick={() => onEdit(c)} className="p-2 text-slate-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-100"><Edit size={16} /></button>
                      <button onClick={() => onDelete(c.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
