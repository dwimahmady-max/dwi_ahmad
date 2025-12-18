
import React, { useState, useEffect } from 'react';
import { Customer, CustomerStatus, CustomerDocument, DocumentCategory } from '../types';
import { Search, FileCheck, CheckCircle2, Skull, RefreshCw, FileText, FileSpreadsheet, Calendar, User, History, PlusCircle, UserPlus, ArrowRight, Save, X, Trash2, Edit, UploadCloud, FileImage, AlertCircle, RotateCcw, Eye } from 'lucide-react';
import * as XLSX from 'xlsx';

interface SettledCustomerListProps {
  customers: Customer[];
  onUpdateStatus: (customer: Customer) => void;
  onViewProfile: (customer: Customer) => void;
  onDelete: (id: string) => void;
}

export const SettledCustomerList: React.FC<SettledCustomerListProps> = ({ customers, onUpdateStatus, onViewProfile, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | CustomerStatus>('ALL');
  
  // State untuk Quick Process (Input/Edit Lunas)
  const [showInputArea, setShowInputArea] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quickSearch, setQuickSearch] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [processData, setProcessData] = useState({
    status: CustomerStatus.LUNAS,
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    notes: ''
  });
  const [settlementFiles, setSettlementFiles] = useState<CustomerDocument[]>([]);

  // Filter nasabah yang statusnya BUKAN ACTIVE untuk tabel utama
  const settledCustomers = customers.filter(c => c.status !== CustomerStatus.ACTIVE && c.status !== undefined);

  // Pencarian untuk tabel utama
  const filtered = settledCustomers.filter(c => {
    const matchesSearch = c.personal.fullName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          c.pension.pensionNumber.includes(searchTerm);
    const matchesTab = activeFilter === 'ALL' || c.status === activeFilter;
    return matchesSearch && matchesTab;
  });

  // Logic Pencarian Nasabah Aktif untuk Quick Process
  useEffect(() => {
    if (quickSearch.length >= 2 && !selectedCustomer && !editingId) {
      const activeCustomers = customers.filter(c => 
        (c.status === CustomerStatus.ACTIVE || !c.status) &&
        (c.personal.fullName.toLowerCase().includes(quickSearch.toLowerCase()) || 
         c.pension.pensionNumber.includes(quickSearch))
      );
      setSearchResults(activeCustomers);
    } else {
      setSearchResults([]);
    }
  }, [quickSearch, customers, selectedCustomer, editingId]);

  const handleSelectCustomer = (c: Customer) => {
    setSelectedCustomer(c);
    setProcessData(prev => ({ ...prev, amount: c.nominative.loanAmount }));
    setSearchResults([]);
    setQuickSearch(c.personal.fullName);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const category: DocumentCategory = processData.status === CustomerStatus.DECEASED ? 'SURAT_KEMATIAN' : 'BUKTI_LUNAS';
      const maxLimit = category === 'SURAT_KEMATIAN' ? 10 : 3;
      
      const currentFiles = settlementFiles.filter(f => f.category === category);
      if (currentFiles.length + e.target.files.length > maxLimit) {
        alert(`Maksimal upload untuk ${category} adalah ${maxLimit} file.`);
        return;
      }

      const newDocs: CustomerDocument[] = Array.from(e.target.files).map(file => ({
        id: crypto.randomUUID(),
        name: file.name,
        type: file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'other',
        category: category,
        url: URL.createObjectURL(file)
      }));
      setSettlementFiles(prev => [...prev, ...newDocs]);
    }
  };

  const removeFile = (id: string) => {
    setSettlementFiles(prev => prev.filter(f => f.id !== id));
  };

  const viewFile = (url: string) => {
    window.open(url, '_blank');
  };

  const handleSaveProcess = () => {
    if (!selectedCustomer) return;
    
    // Simpan dokumen kategori lain yang sudah ada, timpa kategori yang sedang diproses
    const categoriesToReplace = ['BUKTI_LUNAS', 'SURAT_KEMATIAN'];
    const otherDocs = selectedCustomer.documents.filter(d => !categoriesToReplace.includes(d.category));
    const updatedDocuments = [...otherDocs, ...settlementFiles];

    const updated: Customer = {
      ...selectedCustomer,
      status: processData.status,
      resolutionDate: processData.date,
      resolutionAmount: processData.amount,
      resolutionNotes: processData.notes,
      documents: updatedDocuments
    };
    
    onUpdateStatus(updated);
    resetForm();
  };

  const resetForm = () => {
    setSelectedCustomer(null);
    setEditingId(null);
    setQuickSearch('');
    setShowInputArea(false);
    setSettlementFiles([]);
    setProcessData({
      status: CustomerStatus.LUNAS,
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      notes: ''
    });
  };

  const handleEditSettlement = (c: Customer) => {
    setEditingId(c.id);
    setSelectedCustomer(c);
    setQuickSearch(c.personal.fullName);
    setProcessData({
      status: c.status,
      date: c.resolutionDate || new Date().toISOString().split('T')[0],
      amount: c.resolutionAmount || 0,
      notes: c.resolutionNotes || ''
    });
    setSettlementFiles(c.documents.filter(d => d.category === 'BUKTI_LUNAS' || d.category === 'SURAT_KEMATIAN'));
    setShowInputArea(true);
  };

  const handleRevertStatus = (c: Customer) => {
    if (confirm(`Kembalikan nasabah ${c.personal.fullName} ke status AKTIF? Data pelunasan/kematian akan dihapus.`)) {
      const updated: Customer = {
        ...c,
        status: CustomerStatus.ACTIVE,
        resolutionDate: undefined,
        resolutionAmount: undefined,
        resolutionNotes: undefined,
        documents: c.documents.filter(d => d.category !== 'BUKTI_LUNAS' && d.category !== 'SURAT_KEMATIAN')
      };
      onUpdateStatus(updated);
    }
  };

  const handleDeletePermanently = (id: string, name: string) => {
    if (confirm(`PERINGATAN: Hapus permanen nasabah ${name} dari database? Tindakan ini tidak dapat dibatalkan.`)) {
      onDelete(id);
    }
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);

  const handleExportExcel = () => {
    const dataToExport = filtered.map((c, index) => ({
      "No": index + 1,
      "Nama Nasabah": c.personal.fullName,
      "NOPEN": `'${c.pension.pensionNumber}`,
      "Status Akhir": c.status,
      "Tanggal Selesai": c.resolutionDate || '-',
      "Plafon Terakhir": c.nominative.loanAmount,
      "Nominal Pelunasan": c.resolutionAmount || 0,
      "Catatan Penutupan": c.resolutionNotes || '-'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Nasabah Lunas");
    XLSX.writeFile(workbook, `Laporan_Nasabah_Lunas_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const StatusTab = ({ label, status, icon: Icon, color }: any) => (
    <button 
      onClick={() => setActiveFilter(status)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
        activeFilter === status 
          ? `${color} border-transparent shadow-md scale-105` 
          : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
      }`}
    >
      <Icon size={14} />
      {label}
      <span className="ml-1 opacity-60">({settledCustomers.filter(c => status === 'ALL' ? true : c.status === status).length})</span>
    </button>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-3">
              <History className="text-blue-400" />
              LAYER NASABAH SELESAI
            </h2>
            <p className="text-slate-400 text-sm mt-1 font-medium">Monitoring otomatis nasabah lunas, topup, dan penutupan akun.</p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => { if(showInputArea) resetForm(); else setShowInputArea(true); }} 
              className={`px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all ${showInputArea ? 'bg-red-500 hover:bg-red-600 shadow-red-200' : 'bg-orange-500 hover:bg-orange-600 shadow-orange-200'} shadow-lg`}
            >
              {showInputArea ? <X size={18} /> : <PlusCircle size={18} />}
              {showInputArea ? 'BATAL' : 'PROSES PENYELESAIAN'}
            </button>
            <button onClick={handleExportExcel} className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-2xl font-black text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-200">
              <FileSpreadsheet size={18} /> EXPORT
            </button>
          </div>
        </div>
        <div className="absolute top-[-20%] right-[-5%] w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* QUICK PROCESS AREA */}
      {showInputArea && (
        <div className="bg-white p-8 rounded-3xl border-2 border-orange-200 shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3 text-orange-600">
               <div className="p-3 bg-orange-100 rounded-2xl"><UserPlus size={24} /></div>
               <div>
                  <h3 className="font-black text-lg uppercase tracking-tight">{editingId ? 'Edit Data Penyelesaian' : 'Proses Penutupan Akun Baru'}</h3>
                  <p className="text-xs text-slate-400 font-bold">Input detail nominal pelunasan dan bukti bayar</p>
               </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div className="lg:col-span-1 space-y-4">
              <div className="relative">
                <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Cari Nasabah Aktif</label>
                <div className="relative">
                  <Search className={`absolute left-3 top-3.5 ${selectedCustomer ? 'text-green-500' : 'text-slate-300'}`} size={18} />
                  <input 
                    type="text" 
                    disabled={!!editingId}
                    value={quickSearch}
                    onChange={(e) => {
                      setQuickSearch(e.target.value);
                      if (selectedCustomer) setSelectedCustomer(null);
                    }}
                    className={`w-full pl-10 pr-4 py-3.5 rounded-2xl border-2 outline-none transition-all ${selectedCustomer ? 'border-green-500 bg-green-50 font-black text-green-800' : 'border-slate-100 focus:border-orange-400 bg-slate-50'}`}
                    placeholder="Nama / NOPEN..."
                  />
                </div>
                
                {!editingId && searchResults.length > 0 && (
                  <div className="absolute z-30 w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-2xl max-h-48 overflow-y-auto">
                    {searchResults.map(c => (
                      <div 
                        key={c.id} 
                        onClick={() => handleSelectCustomer(c)}
                        className="p-4 hover:bg-orange-50 cursor-pointer border-b last:border-0 flex justify-between items-center group"
                      >
                        <div>
                          <p className="font-black text-slate-800 text-sm group-hover:text-orange-600">{c.personal.fullName}</p>
                          <p className="text-[10px] text-slate-400 font-mono">NOPEN: {c.pension.pensionNumber}</p>
                        </div>
                        <ArrowRight size={14} className="text-slate-300 group-hover:text-orange-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase block flex justify-between">
                  <span>{processData.status === CustomerStatus.DECEASED ? 'Berkas Meninggal (Max 10)' : 'Upload Bukti Lunas'}</span>
                  <span className="text-orange-500 font-bold">
                    {settlementFiles.length}/{processData.status === CustomerStatus.DECEASED ? 10 : 3}
                  </span>
                </label>
                <div className="relative group cursor-pointer h-32 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center hover:border-orange-300 hover:bg-orange-50 transition-all">
                   <input 
                      type="file" 
                      multiple
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                   />
                   {processData.status === CustomerStatus.DECEASED ? <Skull size={32} className="text-slate-300 group-hover:text-red-500 transition-all"/> : <UploadCloud size={32} className="text-slate-300 group-hover:scale-110 group-hover:text-orange-500 transition-all"/>}
                   <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Klik / Seret File</span>
                </div>
                
                <div className="space-y-2 max-h-40 overflow-y-auto mt-2">
                   {settlementFiles.map(file => (
                     <div key={file.id} className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-2 overflow-hidden">
                           {file.category === 'SURAT_KEMATIAN' ? <Skull size={14} className="text-red-500 shrink-0" /> : <FileImage size={14} className="text-orange-500 shrink-0" />}
                           <span className="text-[10px] font-bold text-slate-600 truncate">{file.name}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button onClick={() => viewFile(file.url)} className="p-1 text-blue-400 hover:text-blue-600"><Eye size={14} /></button>
                          <button onClick={() => removeFile(file.id)} className="p-1 text-red-400 hover:text-red-600"><X size={14} /></button>
                        </div>
                     </div>
                   ))}
                </div>
              </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Jenis Pelunasan</label>
                    <select 
                      value={processData.status}
                      onChange={(e) => {
                         const newStatus = e.target.value as CustomerStatus;
                         setProcessData({...processData, status: newStatus});
                         // Reset files if status category switches significantly
                         setSettlementFiles([]);
                      }}
                      className="w-full p-3.5 rounded-2xl border-2 border-slate-100 bg-white font-black text-sm outline-none focus:border-orange-400 shadow-sm"
                    >
                      <option value={CustomerStatus.LUNAS}>Lunas Murni</option>
                      <option value={CustomerStatus.PKA}>PKA / Take Over (TO)</option>
                      <option value={CustomerStatus.TOPUP_LUNAS}>Pelunasan Top Up</option>
                      <option value={CustomerStatus.DECEASED}>Meninggal Dunia</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Tanggal Penyelesaian</label>
                    <input 
                      type="date" 
                      value={processData.date}
                      onChange={(e) => setProcessData({...processData, date: e.target.value})}
                      className="w-full p-3.5 rounded-2xl border-2 border-slate-100 font-black text-sm outline-none focus:border-orange-400 shadow-sm bg-white"
                    />
                  </div>
               </div>

               <div className="md:col-span-2 space-y-4">
                  <div className="relative">
                    <label className="text-[10px] font-black text-blue-600 uppercase mb-1.5 block">Nominal Pelunasan Akhir (Rp)</label>
                    <div className="relative">
                      <span className="absolute left-4 top-4 text-blue-300 font-black text-lg">Rp</span>
                      <input 
                        type="number" 
                        value={processData.amount || ''}
                        onChange={(e) => setProcessData({...processData, amount: parseFloat(e.target.value) || 0})}
                        className="w-full pl-12 pr-6 py-4 rounded-2xl border-2 border-blue-100 font-black text-blue-700 text-2xl outline-none focus:border-blue-400 bg-blue-50/30"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase mb-1.5 block">Catatan Penutupan</label>
                    <textarea 
                      rows={3}
                      value={processData.notes}
                      onChange={(e) => setProcessData({...processData, notes: e.target.value})}
                      className="w-full p-4 rounded-2xl border-2 border-slate-100 text-sm font-medium outline-none focus:border-orange-400 bg-white resize-none"
                      placeholder="Detail alasan..."
                    />
                  </div>
               </div>
               
               <div className="md:col-span-3 flex justify-end gap-3 pt-4 border-t border-slate-100">
                  <button type="button" onClick={resetForm} className="px-8 py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600">Batal</button>
                  <button 
                    onClick={handleSaveProcess}
                    disabled={!selectedCustomer}
                    className="px-10 py-4 bg-green-600 hover:bg-green-700 disabled:bg-slate-100 disabled:text-slate-300 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl shadow-green-100"
                  >
                    <Save size={20} /> {editingId ? 'SIMPAN PERUBAHAN' : 'SELESAIKAN PROSES'}
                  </button>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2">
         <StatusTab label="Semua" status="ALL" icon={FileText} color="bg-slate-700 text-white" />
         <StatusTab label="Top Up" status={CustomerStatus.TOPUP_LUNAS} icon={RefreshCw} color="bg-blue-600 text-white" />
         <StatusTab label="PKA / Pelunasan" status={CustomerStatus.PKA} icon={CheckCircle2} color="bg-green-600 text-white" />
         <StatusTab label="Lunas Murni" status={CustomerStatus.LUNAS} icon={FileCheck} color="bg-teal-600 text-white" />
         <StatusTab label="Meninggal" status={CustomerStatus.DECEASED} icon={Skull} color="bg-red-600 text-white" />
      </div>

      {/* Table Section */}
      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-50 flex items-center gap-4">
            <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                <input 
                    type="text" 
                    placeholder="Cari Nasabah Lunas..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-6 py-3 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                />
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-2xl">
               <AlertCircle size={16} className="text-blue-500" />
               <span className="text-[10px] font-black text-blue-700 uppercase tracking-tight">{filtered.length} Terdaftar</span>
            </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50/50 text-slate-400 font-black uppercase text-[10px] tracking-[0.15em] border-b border-slate-100">
                <th className="px-8 py-5">Nasabah</th>
                <th className="px-6 py-5">Status Akhir</th>
                <th className="px-6 py-5">Tgl Selesai</th>
                <th className="px-6 py-5 text-right">Nominal Akhir</th>
                <th className="px-6 py-5">Keterangan</th>
                <th className="px-8 py-5 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-24 text-center text-slate-400 font-black uppercase tracking-widest text-xs">Belum Ada Data</td></tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition-all group">
                    <td className="px-8 py-6">
                      <div className="font-black text-slate-900 group-hover:text-blue-600 transition-colors">{c.personal.fullName}</div>
                      <div className="text-[10px] text-slate-400 font-bold uppercase mt-1">NOPEN: {c.pension.pensionNumber}</div>
                    </td>
                    <td className="px-6 py-6">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border shadow-sm ${
                        c.status === CustomerStatus.TOPUP_LUNAS ? 'bg-blue-50 text-blue-700 border-blue-100' :
                        c.status === CustomerStatus.PKA ? 'bg-green-50 text-green-700 border-green-100' :
                        c.status === CustomerStatus.DECEASED ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-6 py-6 font-black text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Calendar size={14} className="text-slate-300" />
                        {c.resolutionDate || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-6 text-right font-black text-slate-800 text-sm">
                      {formatCurrency(c.resolutionAmount || 0)}
                    </td>
                    <td className="px-6 py-6 max-w-xs">
                      <p className="text-xs text-slate-500 font-medium truncate" title={c.resolutionNotes}>{c.resolutionNotes || '-'}</p>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => onViewProfile(c)} className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-xl transition border border-transparent hover:border-slate-100 shadow-sm" title="Lihat Profil"><User size={18} /></button>
                         <button onClick={() => handleEditSettlement(c)} className="p-2.5 text-slate-400 hover:text-orange-600 hover:bg-white rounded-xl transition border border-transparent hover:border-slate-100 shadow-sm" title="Edit Data Selesai"><Edit size={18} /></button>
                         <button onClick={() => handleRevertStatus(c)} className="p-2.5 text-slate-400 hover:text-green-600 hover:bg-white rounded-xl transition border border-transparent hover:border-slate-100 shadow-sm" title="Kembalikan ke Aktif"><RotateCcw size={18} /></button>
                         <button onClick={() => handleDeletePermanently(c.id, c.personal.fullName)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-white rounded-xl transition border border-transparent hover:border-slate-100 shadow-sm" title="Hapus Permanen"><Trash2 size={18} /></button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
