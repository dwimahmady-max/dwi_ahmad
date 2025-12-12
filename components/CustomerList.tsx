
import React, { useState } from 'react';
import { Customer, LoanType, CustomerStatus } from '../types';
import { Search, Edit, Trash2, AlertCircle, FileSpreadsheet, RefreshCw, CheckCircle, Wallet, MoreHorizontal, Settings2, Skull, FileX, Banknote } from 'lucide-react';
import * as XLSX from 'xlsx';

interface CustomerListProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onDelete: (id: string) => void;
  onTopUp: (customer: Customer) => void;
  onUpdateStatus: (customer: Customer) => void; // New Prop
}

export const CustomerList: React.FC<CustomerListProps> = ({ customers, onEdit, onDelete, onTopUp, onUpdateStatus }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = customers.filter(c => 
    c.personal.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.pension.pensionNumber.includes(searchTerm) ||
    c.personal.nik.includes(searchTerm)
  );

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const getStatusBadge = (status: CustomerStatus, maturityDate: string) => {
    // Check auto maturity first if status is active
    if (status === CustomerStatus.ACTIVE || !status) {
        const today = new Date();
        today.setHours(0,0,0,0);
        const maturity = new Date(maturityDate);
        if (today > maturity) {
             return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-green-100 text-green-700 border border-green-200"><CheckCircle size={10} /> Lunas (Jadwal)</span>;
        }
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-100 text-blue-700 border border-blue-200">Aktif</span>;
    }

    switch (status) {
        case CustomerStatus.PKA:
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200"><Banknote size={10} /> PKA</span>;
        case CustomerStatus.TOPUP_LUNAS:
            return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-100 text-indigo-700 border border-indigo-200"><RefreshCw size={10} /> Top Up (Closed)</span>;
        case CustomerStatus.CANCELLED:
             return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-red-100 text-red-700 border border-red-200"><FileX size={10} /> Batal</span>;
        case CustomerStatus.DECEASED:
             return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-slate-800 text-white border border-slate-600"><Skull size={10} /> Meninggal</span>;
        default:
             return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-gray-100 text-gray-700">Lunas</span>;
    }
  };

  const calculateNetReceived = (c: Customer) => {
    const totalFees = (c.nominative.adminFee || 0) + (c.nominative.provisionFee || 0) + (c.nominative.marketingFee || 0) + (c.nominative.riskReserve || 0) + (c.nominative.flaggingFee || 0);
    const totalSavings = (c.nominative.principalSavings || 0);
    const totalBlocking = (c.nominative.blockedAmountSK || 0) + ((c.nominative.blockedInstallmentCount || 0) * c.nominative.monthlyInstallment);
    const repayment = c.nominative.repaymentAmount || 0;
    return c.nominative.loanAmount - totalFees - totalSavings - totalBlocking - repayment;
  };

  const handleExportExcel = () => {
    const dataToExport = filtered.map((c, index) => {
      const netReceived = calculateNetReceived(c);
      return {
        "No": index + 1,
        "Status": c.status || 'Aktif',
        "Nama Nasabah": c.personal.fullName,
        "NIK": `'${c.personal.nik}`, 
        "Tgl Lahir": c.personal.birthDate,
        "Jenis Pensiun": c.pension.pensionType,
        "NOPEN": `'${c.pension.pensionNumber}`,
        "Gaji Pensiun": c.pension.salaryAmount,
        "Tipe Pinjaman": c.nominative.loanType,
        "Plafon Pinjaman": c.nominative.loanAmount,
        "Tenor (Bulan)": c.nominative.tenureMonths,
        "Angsuran/Bulan": c.nominative.monthlyInstallment,
        "Jadwal Lunas": c.nominative.maturityDate,
        "Terima Bersih": netReceived,
        "Catatan Status": c.resolutionNotes || '-'
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Nasabah");
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Data_Nasabah_Koperasi_${dateStr}.xlsx`);
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden animate-fade-in pb-20 md:pb-0">
      <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
             <Wallet className="text-blue-600" />
             Daftar Nasabah & Nominatif
          </h2>
          <p className="text-sm text-slate-500">Total {customers.length} data nasabah tersimpan</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Cari Nama / NIK / Nopen..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full md:w-64"
            />
          </div>
          
          <button 
            onClick={handleExportExcel}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow-sm font-medium text-sm whitespace-nowrap"
            title="Download Excel"
          >
            <FileSpreadsheet size={18} />
            <span>Export Excel</span>
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50 text-slate-700 font-semibold uppercase tracking-wider text-xs border-b">
            <tr>
              <th className="px-6 py-4">Nasabah</th>
              <th className="px-6 py-4">Instansi / Pensiun</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4 text-right">Plafon / Terima Bersih</th>
              <th className="px-6 py-4 text-right">Total Angsuran (Rp)</th>
              <th className="px-6 py-4 text-center">Tenor</th>
              <th className="px-6 py-4 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <AlertCircle size={32} />
                  <span>Data tidak ditemukan</span>
                </td>
              </tr>
            ) : (
              filtered.map((customer) => {
                const netReceived = calculateNetReceived(customer);
                const totalInstallment = (customer.nominative.monthlyInstallment || 0) + (customer.nominative.mandatorySavings || 0);
                
                // Cek status aktif untuk highlight baris
                const isInactive = customer.status && customer.status !== CustomerStatus.ACTIVE;
                const rowClass = isInactive ? 'bg-slate-50 opacity-80' : 'hover:bg-slate-50';

                return (
                  <tr 
                    key={customer.id} 
                    className={`transition group border-b border-slate-50 ${deleteConfirmId === customer.id ? 'bg-red-50' : rowClass}`}
                  >
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-900 flex items-center gap-2">
                        {customer.personal.fullName}
                      </div>
                      <div className="text-xs text-slate-500">NIK: {customer.personal.nik}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{customer.pension.pensionType}</div>
                      <div className="text-xs text-slate-500">{customer.pension.pensionNumber}</div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(customer.status, customer.nominative.maturityDate)}
                      <div className="text-[10px] text-slate-400 mt-1 uppercase tracking-wider font-semibold">
                         {customer.nominative.loanType}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium text-blue-600">{formatCurrency(customer.nominative.loanAmount)}</div>
                      <div className="text-xs text-green-600 font-medium bg-green-50 px-1 py-0.5 rounded inline-block mt-1">
                        Cair: {formatCurrency(netReceived)}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="font-medium text-slate-900">{formatCurrency(totalInstallment)}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                        <span className="inline-block px-2 py-1 bg-slate-100 rounded text-xs font-semibold">
                          {customer.nominative.tenureMonths} Bln
                        </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {deleteConfirmId === customer.id ? (
                        <div className="flex items-center justify-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDelete(customer.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg shadow-sm hover:bg-red-700 transition flex items-center gap-1 text-xs font-bold"
                          >
                            <Trash2 size={14} /> Yakin?
                          </button>
                          <button 
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                            className="px-3 py-1.5 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition text-xs font-medium"
                          >
                            Batal
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                           <button 
                            type="button"
                            onClick={() => onUpdateStatus(customer)}
                            className="p-1.5 text-orange-600 hover:bg-orange-50 border border-orange-200 rounded-lg transition"
                            title="Update Status / Pelunasan / Batal"
                          >
                             <Settings2 size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => onTopUp(customer)}
                            className="p-1.5 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition shadow-sm"
                            title="Proses Top Up Baru"
                          >
                             <RefreshCw size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => onEdit(customer)}
                            className="p-1.5 text-slate-600 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg transition"
                            title="Edit Data"
                          >
                            <Edit size={16} />
                          </button>
                          <button 
                            type="button"
                            onClick={() => setDeleteConfirmId(customer.id)}
                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                            title="Hapus Data"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
