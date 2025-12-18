
import React, { useState, useEffect } from 'react';
import { Customer, CustomerDocument, PensionType, LoanType, MaritalStatus, InterestType, RepaymentType, Gender, CustomerStatus, DocumentCategory } from '../types';
import { Save, Search, UploadCloud, FileText, Trash2, ArrowLeft, FolderInput, Link as LinkIcon, UserCheck, Plus, AlertCircle, CheckCircle2, FileCheck, X, MessageSquare, Eye, Play, Mic, Video, File, Calendar, Camera, User, Image as ImageIcon, Skull } from 'lucide-react';

interface ArchiveFormProps {
  customers: Customer[];
  initialData?: Customer | null;
  onSave: (customer: Customer) => void;
  onCancel: () => void;
}

// Definisi Struktur Group Dokumen untuk UI
const DOCUMENT_GROUPS = [
  {
    title: "Identitas & Pensiun",
    color: "border-blue-100 bg-blue-50/30",
    categories: [
      { id: 'KTP' as DocumentCategory, label: 'KTP' },
      { id: 'KK' as DocumentCategory, label: 'KK' },
      { id: 'KARIP' as DocumentCategory, label: 'KARIP' },
      { id: 'NPWP' as DocumentCategory, label: 'NPWP' },
      { id: 'SK' as DocumentCategory, label: 'SK Pensiun' },
      { id: 'SK_ASLI' as DocumentCategory, label: 'SK Asli (Scan/Foto)' },
      { id: 'DAPEM' as DocumentCategory, label: 'DAPEM' },
      { id: 'EPOT' as DocumentCategory, label: 'Epot Pos' },
      { id: 'ASABRI' as DocumentCategory, label: 'Asabri' },
    ]
  },
  {
    title: "Aplikasi & SPK",
    color: "border-orange-100 bg-orange-50/30",
    categories: [
      { id: 'SPK' as DocumentCategory, label: 'SPK' },
      { id: 'APLIKASI_KREDIT' as DocumentCategory, label: 'Aplikasi Kredit' },
      { id: 'SKKT' as DocumentCategory, label: 'SKKT' },
      { id: 'PERMOHONAN_ANGGOTA' as DocumentCategory, label: 'Permohonan Anggota' },
      { id: 'BUKU_ANGGOTA' as DocumentCategory, label: 'Buku Daftar Anggota' },
      { id: 'TANDA_TERIMA_SK' as DocumentCategory, label: 'Tanda Terima SK' },
      { id: 'TANDA_PENYERAHAN' as DocumentCategory, label: 'Tanda Penyerahan Berkas' },
    ]
  },
  {
    title: "Data Pendukung & Foto",
    color: "border-rose-100 bg-rose-50/30",
    categories: [
      { id: 'SLIP_GAJI' as DocumentCategory, label: 'Slip Gaji (Max 5)' },
      { id: 'REK_KORAN' as DocumentCategory, label: 'Rekening Koran' },
      { id: 'FOTO_NASABAH' as DocumentCategory, label: 'Foto Nasabah' },
      { id: 'FOTO_NASABAH_MARKETING' as DocumentCategory, label: 'Nasabah + Marketing' },
      { id: 'SLIK' as DocumentCategory, label: 'Hasil SLIK' },
    ]
  },
  {
    title: "Status Khusus & Penutupan",
    color: "border-slate-200 bg-slate-50/50",
    categories: [
      { id: 'SURAT_KEMATIAN' as DocumentCategory, label: 'Berkas Meninggal (Max 10)' },
      { id: 'BUKTI_LUNAS' as DocumentCategory, label: 'Bukti Pelunasan' },
      { id: 'SURAT_PENARIKAN_BLOKIR' as DocumentCategory, label: 'Penarikan Blokir' },
    ]
  },
  {
    title: "Surat Pernyataan",
    color: "border-purple-100 bg-purple-50/30",
    categories: [
      { id: 'PERNYATAAN_DEBITUR' as DocumentCategory, label: 'Pernyataan Debitur' },
      { id: 'PERNYATAAN_MUTASI' as DocumentCategory, label: 'Tidak Pindah Kantor' },
      { id: 'PERNYATAAN_BATAL' as DocumentCategory, label: 'Tidak Membatalkan' },
      { id: 'SURAT_KUASA' as DocumentCategory, label: 'Surat Kuasa' },
      { id: 'KUASA_PENCAIRAN' as DocumentCategory, label: 'Kuasa Pencairan' },
    ]
  },
  {
    title: "Dokumentasi Media & Keuangan",
    color: "border-green-100 bg-green-50/30",
    categories: [
      { id: 'VIDEO' as DocumentCategory, label: 'Video Akad/Verifikasi' },
      { id: 'AUDIO' as DocumentCategory, label: 'Voice Record/Audio' },
      { id: 'NOTA_KREDIT' as DocumentCategory, label: 'Nota Kredit Pensiun' },
      { id: 'KWITANSI' as DocumentCategory, label: 'Kwitansi Penerimaan' },
    ]
  }
];

export const ArchiveForm: React.FC<ArchiveFormProps> = ({ customers, initialData, onSave, onCancel }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(initialData || null);

  const [formData, setFormData] = useState({
    fullName: '',
    pensionNumber: '',
    skNumber: '',
    skIssuanceDate: '', 
    skReceivedDate: new Date().toISOString().split('T')[0],
    spkCode: '',
    pensionType: PensionType.TASPEN,
    blockedAmountSK: 0,
    skDescription: ''
  });

  const [allDocs, setAllDocs] = useState<Record<string, CustomerDocument[]>>({});

  useEffect(() => {
    if (initialData) {
      loadCustomerData(initialData);
    }
  }, [initialData]);

  const loadCustomerData = (c: Customer) => {
    setSelectedCustomer(c);
    setFormData({
      fullName: c.personal.fullName,
      pensionNumber: c.pension.pensionNumber,
      skNumber: c.pension.skNumber,
      skIssuanceDate: c.pension.skIssuanceDate || '',
      skReceivedDate: c.pension.skReceivedDate || new Date().toISOString().split('T')[0],
      spkCode: c.nominative.spkCode || '',
      pensionType: c.pension.pensionType,
      blockedAmountSK: c.nominative.blockedAmountSK || 0,
      skDescription: c.pension.skDescription || ''
    });
    
    const grouped: Record<string, CustomerDocument[]> = {};
    c.documents.forEach(d => {
      if (!grouped[d.category]) grouped[d.category] = [];
      grouped[d.category].push(d);
    });
    setAllDocs(grouped);
    
    setSearchTerm(c.personal.fullName);
    setSearchResults([]);
  };

  useEffect(() => {
    if (!selectedCustomer && searchTerm.length >= 2) {
      const results = customers.filter(c => 
        c.personal.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.pension.pensionNumber.includes(searchTerm)
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, customers, selectedCustomer]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, category: DocumentCategory) => {
    if (e.target.files && e.target.files.length > 0) {
      const currentFiles = allDocs[category] || [];
      const maxLimit = category === 'SURAT_KEMATIAN' ? 10 : category === 'SLIP_GAJI' ? 5 : 3;
      
      if (currentFiles.length + e.target.files.length > maxLimit) {
        alert(`Maksimal upload untuk ${category} adalah ${maxLimit} file.`);
        return;
      }

      const newDocs: CustomerDocument[] = Array.from(e.target.files).map(file => {
        let type: 'image' | 'pdf' | 'audio' | 'video' | 'other' = 'other';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type === 'application/pdf') type = 'pdf';
        else if (file.type.startsWith('audio/')) type = 'audio';
        else if (file.type.startsWith('video/')) type = 'video';

        return {
          id: crypto.randomUUID(),
          name: file.name,
          type: type,
          category,
          url: URL.createObjectURL(file)
        };
      });

      setAllDocs(prev => ({
        ...prev,
        [category]: [...currentFiles, ...newDocs]
      }));
    }
  };

  const removeFile = (id: string, category: DocumentCategory) => {
    setAllDocs(prev => ({
      ...prev,
      [category]: prev[category].filter(f => f.id !== id)
    }));
  };

  const viewFile = (url: string) => {
    window.open(url, '_blank');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let customerToSave: Customer;
    const combinedDocuments = Object.values(allDocs).flat();

    if (selectedCustomer) {
      const existing = customers.find(c => c.id === selectedCustomer.id);
      if (!existing) return;

      customerToSave = {
        ...existing,
        pension: {
          ...existing.pension,
          pensionNumber: formData.pensionNumber,
          skNumber: formData.skNumber,
          skIssuanceDate: formData.skIssuanceDate,
          skReceivedDate: formData.skReceivedDate,
          pensionType: formData.pensionType as PensionType,
          skDescription: formData.skDescription
        },
        nominative: {
          ...existing.nominative,
          spkCode: formData.spkCode,
          blockedAmountSK: formData.blockedAmountSK
        },
        documents: combinedDocuments
      };
    } else {
      customerToSave = {
        id: crypto.randomUUID(),
        personal: { fullName: formData.fullName, nik: '-', birthDate: '', gender: Gender.MALE, maritalStatus: MaritalStatus.MARRIED, address: '-', phoneNumber: '-' },
        pension: { pensionNumber: formData.pensionNumber, formerInstitution: '-', pensionType: formData.pensionType as PensionType, skNumber: formData.skNumber, skIssuanceDate: formData.skIssuanceDate, skReceivedDate: formData.skReceivedDate, skDescription: formData.skDescription, salaryAmount: 0 },
        nominative: { loanType: LoanType.NEW, loanDate: new Date().toISOString().split('T')[0], spkCode: formData.spkCode, loanAmount: 0, interestType: InterestType.ANNUITY, interestRate: 0, tenureMonths: 0, monthlyInstallment: 0, disbursementDate: '', maturityDate: '', repaymentNotes: '', adminFee: 0, provisionFee: 0, marketingFee: 0, riskReserve: 0, flaggingFee: 0, principalSavings: 0, mandatorySavings: 0, repaymentType: RepaymentType.TOPUP, repaymentAmount: 0, blockedAmountSK: formData.blockedAmountSK, blockedInstallmentCount: 0 },
        documents: combinedDocuments,
        status: CustomerStatus.ACTIVE,
        createdAt: new Date().toISOString()
      };
    }

    onSave(customerToSave);
  };

  const UploadBox = ({ category, label }: { category: DocumentCategory, label: string }) => {
    const files = allDocs[category] || [];
    const maxLimit = category === 'SURAT_KEMATIAN' ? 10 : category === 'SLIP_GAJI' ? 5 : 3;
    
    const getFileIcon = (type: string, cat: string) => {
      if (cat === 'SURAT_KEMATIAN') return <Skull size={12} className="text-red-600" />;
      if (cat === 'FOTO_NASABAH' || cat === 'FOTO_NASABAH_MARKETING') return <Camera size={12} className="text-rose-500" />;
      switch(type) {
        case 'image': return <ImageIcon size={12} className="text-blue-500" />;
        case 'pdf': return <FileText size={12} className="text-red-500" />;
        case 'audio': return <Mic size={12} className="text-purple-500" />;
        case 'video': return <Video size={12} className="text-green-500" />;
        default: return <File size={12} className="text-slate-400" />;
      }
    };

    return (
      <div className={`p-3 rounded-xl border transition-all ${files.length > 0 ? 'bg-white border-green-200 shadow-sm' : 'bg-white/50 border-slate-100 border-dashed'}`}>
        <div className="flex justify-between items-start mb-2">
          <label className="text-[10px] font-black text-slate-500 uppercase leading-tight">{label}</label>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded ${files.length === maxLimit ? 'bg-red-100 text-red-600' : files.length > 0 ? 'bg-green-100 text-green-600' : 'bg-slate-100 text-slate-400'}`}>
            {files.length}/{maxLimit}
          </span>
        </div>
        
        {files.length < maxLimit && (
          <div className="relative group h-8 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-center cursor-pointer hover:bg-orange-50 hover:border-orange-200 transition-all">
            <input 
              type="file" 
              accept={category === 'VIDEO' ? 'video/*' : category === 'AUDIO' ? 'audio/*' : category === 'FOTO_NASABAH' || category === 'FOTO_NASABAH_MARKETING' ? 'image/*' : 'image/*,application/pdf'} 
              multiple 
              onChange={(e) => handleFileChange(e, category)} 
              className="absolute inset-0 opacity-0 cursor-pointer z-10" 
            />
            {category === 'SURAT_KEMATIAN' ? <Skull size={14} className="text-slate-400 group-hover:text-red-600" /> : category.includes('FOTO') ? <Camera size={14} className="text-slate-400 group-hover:text-rose-500" /> : <Plus size={14} className="text-slate-400 group-hover:text-orange-500" />}
          </div>
        )}

        <div className="mt-2 space-y-1">
          {files.map(f => (
            <div key={f.id} className="flex items-center justify-between gap-1 bg-slate-50 p-1.5 rounded border border-slate-100 group/file">
               <div className="flex items-center gap-1.5 flex-1 min-w-0">
                  {getFileIcon(f.type, category)}
                  <span className="text-[9px] font-bold text-slate-600 truncate" title={f.name}>{f.name}</span>
               </div>
               <div className="flex items-center gap-1">
                  <button type="button" onClick={() => viewFile(f.url)} className="text-blue-400 hover:text-blue-600 p-0.5" title="Lihat Berkas"><Eye size={10}/></button>
                  <button type="button" onClick={() => removeFile(f.id, category)} className="text-red-300 hover:text-red-500 p-0.5" title="Hapus"><X size={10}/></button>
               </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-in-up">
      <div className="bg-slate-900 p-8 flex items-center justify-between text-white">
        <div>
           <h2 className="text-2xl font-black flex items-center gap-3">
            <FolderInput size={28} className="text-orange-400" />
            {initialData ? 'PERBARUI ARSIP DIGITAL' : 'INPUT ARSIP DIGITAL BARU'}
          </h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Sistem Digitalisasi Berkas Fisik & Foto Dokumentasi</p>
        </div>
        <button onClick={onCancel} className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition">
            <ArrowLeft size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-10">
        
        {/* I. Koneksi Database */}
        <section className="space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">I. Identifikasi Nasabah</h3>
                {selectedCustomer && <span className="bg-green-500 text-white text-[10px] px-3 py-1 rounded-full font-black flex items-center gap-1 shadow-lg shadow-green-100"><UserCheck size={12}/> TERHUBUNG</span>}
            </div>
            
            <div className="relative">
                <Search className={`absolute left-4 top-4 ${selectedCustomer ? 'text-green-500' : 'text-slate-400'}`} size={20} />
                <input 
                    type="text" required
                    value={selectedCustomer ? formData.fullName : searchTerm}
                    onChange={(e) => {
                        if (selectedCustomer) setFormData(prev => ({...prev, fullName: e.target.value}));
                        else { setSearchTerm(e.target.value); setFormData(prev => ({...prev, fullName: e.target.value})); }
                    }}
                    className={`w-full pl-12 pr-6 py-4 rounded-2xl border-2 transition-all outline-none text-lg ${selectedCustomer ? 'bg-green-50 border-green-200 font-black text-green-900' : 'bg-slate-50 border-slate-100 focus:border-orange-500 focus:bg-white'}`}
                    placeholder="Masukkan Nama Nasabah..."
                />
                {!selectedCustomer && searchResults.length > 0 && (
                    <div className="absolute z-50 w-full bg-white border border-slate-200 rounded-2xl shadow-2xl mt-2 max-h-64 overflow-y-auto overflow-x-hidden">
                        {searchResults.map(c => (
                            <div key={c.id} onClick={() => loadCustomerData(c)} className="p-4 hover:bg-orange-50 cursor-pointer border-b last:border-0 flex justify-between items-center group">
                                <div>
                                    <div className="font-black text-slate-800 group-hover:text-orange-600">{c.personal.fullName}</div>
                                    <div className="text-[10px] text-slate-400 font-bold uppercase">Nopen: {c.pension.pensionNumber} • {c.pension.pensionType}</div>
                                </div>
                                <LinkIcon size={16} className="text-slate-300 group-hover:text-orange-400" />
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">NOPEN</label>
                    <input type="text" name="pensionNumber" required value={formData.pensionNumber} onChange={handleInputChange} className="w-full border-2 border-slate-100 p-3 rounded-xl font-bold focus:border-orange-300" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Nomor SK</label>
                    <input type="text" name="skNumber" required value={formData.skNumber} onChange={handleInputChange} className="w-full border-2 border-slate-100 p-3 rounded-xl font-bold focus:border-orange-300" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Tgl Keluar SK</label>
                    <input type="date" name="skIssuanceDate" value={formData.skIssuanceDate} onChange={handleInputChange} className="w-full border-2 border-slate-100 p-3 rounded-xl font-bold focus:border-orange-300" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">SPK</label>
                    <input type="text" name="spkCode" value={formData.spkCode} onChange={handleInputChange} className="w-full border-2 border-slate-100 p-3 rounded-xl font-bold focus:border-orange-300" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase">Tgl Terima Arsip</label>
                    <input type="date" name="skReceivedDate" required value={formData.skReceivedDate} onChange={handleInputChange} className="w-full border-2 border-slate-100 p-3 rounded-xl font-bold focus:border-orange-300" />
                </div>
            </div>

            <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase flex items-center gap-1.5">
                    <MessageSquare size={12} className="text-slate-400" /> Catatan Arsip / Keterangan Berkas Fisik
                </label>
                <textarea 
                    name="skDescription"
                    value={formData.skDescription}
                    onChange={handleInputChange}
                    rows={2}
                    className="w-full border-2 border-slate-100 p-3 rounded-xl font-medium text-sm focus:border-orange-300 outline-none resize-none bg-slate-50/50"
                    placeholder="Contoh: SK Asli masih di kantor bayar lama, atau Berkas masih kurang KTP Pasangan..."
                />
            </div>
        </section>

        {/* II. Digitalisasi Dokumen & Media - GRID AREA */}
        <section className="space-y-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">II. Digitalisasi Dokumen & Dokumentasi Foto</h3>
            
            <div className="space-y-10">
                {DOCUMENT_GROUPS.map(group => (
                    <div key={group.title} className="space-y-4">
                        <div className="flex items-center gap-3">
                            <h4 className="text-sm font-black text-slate-700 whitespace-nowrap">{group.title}</h4>
                            <div className="h-px bg-slate-100 w-full"></div>
                        </div>
                        <div className={`grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 p-4 rounded-3xl border ${group.color}`}>
                            {group.categories.map(cat => (
                                <UploadBox key={cat.id} category={cat.id} label={cat.label} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </section>

        {/* Form Actions */}
        <div className="flex gap-4 pt-10 border-t border-slate-100">
            <button type="button" onClick={onCancel} className="flex-1 py-4 text-slate-400 font-black uppercase tracking-widest text-xs hover:text-slate-600">Batal</button>
            <button type="submit" className="flex-[2] py-4 bg-orange-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-orange-700 transition shadow-2xl shadow-orange-100 flex items-center justify-center gap-3">
                <Save size={20} /> SIMPAN SEMUA ARSIP
            </button>
        </div>

      </form>
    </div>
  );
};
