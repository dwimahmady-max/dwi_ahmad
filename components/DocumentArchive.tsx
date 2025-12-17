
import React, { useState } from 'react';
import { Customer, DocumentCategory } from '../types';
import { Search, FolderArchive, FileText, CheckCircle2, FileCheck, Calendar, AlertCircle, FileSpreadsheet, Edit, PlusCircle, XCircle, User, Trash2 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface DocumentArchiveProps {
  customers: Customer[];
  onEdit: (customer: Customer) => void;
  onAddNew: () => void;
  onViewProfile: (customer: Customer) => void; 
  onDelete: (id: string) => void; // New Prop
}

export const DocumentArchive: React.FC<DocumentArchiveProps> = ({ customers, onEdit, onAddNew, onViewProfile, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const filtered = customers.filter(c => 
    c.personal.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.pension.skNumber.toLowerCase().includes(searchTerm) ||
    c.pension.pensionNumber.includes(searchTerm) ||
    (c.nominative.spkCode && c.nominative.spkCode.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getDocument = (c: Customer, category: DocumentCategory) => {
    return c.documents.find(d => d.category === category);
  };

  const hasSkDocument = (c: Customer) => {
      return c.documents.some(d => d.category === 'SK');
  };

  const handleExportExcel = () => {
    const dataToExport = filtered.map((c, index) => {
        const skDoc = getDocument(c, 'SK');
        return {
            "No": index + 1,
            "Nama Pemilik SK": c.personal.fullName,
            "NOPEN": `'${c.pension.pensionNumber}`,
            "Nomor SK Pensiun": c.pension.skNumber,
            "No SPK": c.nominative.spkCode || '-',
            "Tgl Masuk (Arsip)": c.pension.skReceivedDate || '-',
            "Status Tanda Terima": skDoc ? "Ada File" : "Belum Upload"
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const wscols = Object.keys(dataToExport[0] || {}).map(() => ({ wch: 25 }));
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Arsip Dokumen");
    
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.writeFile(workbook, `Data_Arsip_SK_${dateStr}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row justify-between md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FolderArchive className="text-orange-500" />
            Daftar Arsip & SK Asli
          </h2>
          <p className="text-sm text-slate-500">Monitoring fisik SK dan kelengkapan dokumen digital</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder="Cari Nama / No SK / SPK..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-orange-500 outline-none w-full md:w-64"
                />
            </div>
            
            <button 
                onClick={handleExportExcel}
                className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg transition shadow-sm font-medium text-sm whitespace-nowrap"
                title="Download Excel"
            >
                <FileSpreadsheet size={18} />
                <span className="hidden md:inline">Export</span>
            </button>
            
            <button 
                onClick={onAddNew}
                className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg transition shadow-sm font-medium text-sm whitespace-nowrap"
            >
                <PlusCircle size={18} />
                <span>Input Arsip Baru</span>
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><FileText size={20}/></div>
            <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Total Berkas SK</p>
                <p className="text-xl font-bold text-slate-800">{customers.length}</p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="p-3 bg-green-100 text-green-600 rounded-lg"><CheckCircle2 size={20}/></div>
            <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Tanda Terima Ada</p>
                <p className="text-xl font-bold text-slate-800">
                    {customers.filter(c => hasSkDocument(c)).length}
                </p>
            </div>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-3">
            <div className="p-3 bg-red-100 text-red-600 rounded-lg"><AlertCircle size={20}/></div>
            <div>
                <p className="text-xs text-slate-500 font-bold uppercase">Belum Upload</p>
                <p className="text-xl font-bold text-slate-800">
                     {customers.length - customers.filter(c => hasSkDocument(c)).length}
                </p>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-orange-50 text-orange-800 font-semibold uppercase tracking-wider text-xs border-b border-orange-100">
              <tr>
                <th className="px-6 py-4 w-[25%]">Pemilik SK / Nopen</th>
                <th className="px-6 py-4 w-[20%]">Nomor SK Pensiun</th>
                <th className="px-6 py-4 w-[15%]">No SPK</th>
                <th className="px-6 py-4 w-[15%]">Tgl. Masuk (Arsip)</th>
                <th className="px-6 py-4 text-center w-[15%]">Berkas</th>
                <th className="px-6 py-4 text-center w-[10%]">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    Data tidak ditemukan
                  </td>
                </tr>
              ) : (
                filtered.map((customer) => {
                  const skDoc = getDocument(customer, 'SK');
                  
                  return (
                    <tr key={customer.id} className={`transition border-b border-slate-50 ${deleteConfirmId === customer.id ? 'bg-red-50' : 'hover:bg-slate-50'}`}>
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-800">{customer.personal.fullName}</div>
                        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                             <span className="bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">Nopen: {customer.pension.pensionNumber}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="font-medium text-slate-700 bg-orange-50 px-2 py-1 rounded text-xs border border-orange-100">
                            {customer.pension.skNumber || '-'}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs">
                         {customer.nominative.spkCode || '-'}
                      </td>
                      <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                             <Calendar size={14} className="text-blue-500"/>
                             <span className="text-slate-700 font-medium">{customer.pension.skReceivedDate || '-'}</span>
                          </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                         {skDoc ? (
                             <a 
                                href={skDoc.url} 
                                target="_blank" 
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-[10px] font-bold hover:bg-green-100 transition"
                                title={skDoc.name}
                            >
                                <FileCheck size={12} /> Ada
                            </a>
                         ) : (
                            <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 text-red-500 border border-red-100 rounded-full text-[10px] font-medium">
                                <XCircle size={12} /> Kosong
                            </span>
                         )}
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
                               className="px-2 py-1.5 bg-red-600 text-white rounded shadow-sm hover:bg-red-700 transition flex items-center gap-1 text-[10px] font-bold"
                             >
                               Hapus?
                             </button>
                             <button 
                               type="button"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 setDeleteConfirmId(null);
                               }}
                               className="px-2 py-1.5 bg-white border border-slate-300 text-slate-600 rounded hover:bg-slate-50 transition text-[10px] font-medium"
                             >
                               Batal
                             </button>
                           </div>
                        ) : (
                            <div className="flex justify-center gap-1">
                                <button 
                                    onClick={() => onViewProfile(customer)}
                                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition border border-transparent hover:border-slate-200"
                                    title="Lihat Profil Lengkap"
                                >
                                    <User size={16} />
                                </button>
                                <button 
                                    onClick={() => onEdit(customer)}
                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition border border-transparent hover:border-blue-200"
                                    title="Edit Data Arsip"
                                >
                                    <Edit size={16} />
                                </button>
                                <button 
                                    onClick={() => setDeleteConfirmId(customer.id)}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition border border-transparent hover:border-red-200"
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
    </div>
  );
};
