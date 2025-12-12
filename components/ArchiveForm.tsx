
import React, { useState, useEffect } from 'react';
import { Customer, CustomerDocument, PensionType, LoanType, MaritalStatus, InterestType, RepaymentType, Gender, CustomerStatus } from '../types';
import { Save, Search, UploadCloud, FileText, CheckCircle2, Trash2, ArrowLeft, FolderInput } from 'lucide-react';

interface ArchiveFormProps {
  customers: Customer[];
  initialData?: Customer | null;
  onSave: (customer: Customer) => void;
  onCancel: () => void;
}

export const ArchiveForm: React.FC<ArchiveFormProps> = ({ customers, initialData, onSave, onCancel }) => {
  // State untuk pencarian nasabah (jika mode input baru)
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(initialData?.id || null);

  // Form State (Hanya field yang relevan untuk Arsip)
  const [formData, setFormData] = useState({
    fullName: '',
    pensionNumber: '',
    skNumber: '',
    skReceivedDate: '',
    spkCode: '',
    pensionType: PensionType.TASPEN
  });

  const [uploadedFile, setUploadedFile] = useState<CustomerDocument | null>(null);

  // Inisialisasi data jika edit mode atau nasabah dipilih
  useEffect(() => {
    if (initialData) {
      loadCustomerData(initialData);
    }
  }, [initialData]);

  const loadCustomerData = (c: Customer) => {
    setSelectedCustomerId(c.id);
    setFormData({
      fullName: c.personal.fullName,
      pensionNumber: c.pension.pensionNumber,
      skNumber: c.pension.skNumber,
      skReceivedDate: c.pension.skReceivedDate || new Date().toISOString().split('T')[0],
      spkCode: c.nominative.spkCode || '',
      pensionType: c.pension.pensionType
    });
    
    // Cari dokumen SK
    const skDoc = c.documents.find(d => d.category === 'SK');
    setUploadedFile(skDoc || null);
    setSearchTerm(c.personal.fullName);
    setSearchResults([]);
  };

  // Handle Search
  useEffect(() => {
    if (!selectedCustomerId && searchTerm.length > 2) {
      const results = customers.filter(c => 
        c.personal.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.pension.pensionNumber.includes(searchTerm)
      );
      setSearchResults(results);
    } else {
      setSearchResults([]);
    }
  }, [searchTerm, customers, selectedCustomerId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      let type: 'image' | 'pdf' | 'other' = 'other';
      if (file.type.startsWith('image/')) type = 'image';
      else if (file.type === 'application/pdf') type = 'pdf';

      const newDoc: CustomerDocument = {
        id: crypto.randomUUID(),
        name: file.name,
        type,
        category: 'SK',
        url: URL.createObjectURL(file)
      };
      setUploadedFile(newDoc);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let customerToSave: Customer;

    if (selectedCustomerId) {
      // Update existing customer
      const existing = customers.find(c => c.id === selectedCustomerId);
      if (!existing) return;

      const otherDocs = existing.documents.filter(d => d.category !== 'SK');
      const newDocuments = uploadedFile ? [...otherDocs, uploadedFile] : otherDocs;

      customerToSave = {
        ...existing,
        personal: {
          ...existing.personal,
          fullName: formData.fullName
        },
        pension: {
          ...existing.pension,
          pensionNumber: formData.pensionNumber,
          skNumber: formData.skNumber,
          skReceivedDate: formData.skReceivedDate,
          pensionType: formData.pensionType as PensionType
        },
        nominative: {
          ...existing.nominative,
          spkCode: formData.spkCode
        },
        documents: newDocuments
      };
    } else {
      // Create NEW Minimal Customer (Arsip dulu, data lain menyusul)
      customerToSave = {
        id: crypto.randomUUID(),
        personal: {
          fullName: formData.fullName,
          nik: '-', // Placeholder
          birthDate: '',
          gender: Gender.MALE,
          maritalStatus: MaritalStatus.MARRIED,
          address: '-',
          phoneNumber: '-'
        },
        pension: {
          pensionNumber: formData.pensionNumber,
          formerInstitution: '-',
          pensionType: formData.pensionType as PensionType,
          skNumber: formData.skNumber,
          skIssuanceDate: '',
          skReceivedDate: formData.skReceivedDate,
          skDescription: '',
          salaryAmount: 0
        },
        nominative: {
            loanType: LoanType.NEW,
            loanDate: new Date().toISOString().split('T')[0],
            spkCode: formData.spkCode,
            loanAmount: 0,
            interestType: InterestType.ANNUITY, 
            interestRate: 0,
            tenureMonths: 0,
            monthlyInstallment: 0,
            disbursementDate: '',
            maturityDate: '',
            repaymentNotes: '',
            adminFee: 0, provisionFee: 0, marketingFee: 0, riskReserve: 0, flaggingFee: 0, principalSavings: 0, mandatorySavings: 0,
            repaymentType: RepaymentType.TOPUP, repaymentAmount: 0,
            blockedAmountSK: 0, blockedInstallmentCount: 0
        },
        documents: uploadedFile ? [uploadedFile] : [],
        status: CustomerStatus.ACTIVE,
        createdAt: new Date().toISOString()
      };
    }

    onSave(customerToSave);
  };

  return (
    <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-slide-in-up">
      <div className="bg-slate-50 border-b border-slate-200 p-6 flex items-center justify-between">
        <div>
           <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <FolderInput className="text-orange-600" />
            {initialData ? 'Edit Data Arsip' : 'Input Arsip Baru'}
          </h2>
          <p className="text-sm text-slate-500">Formulir khusus pencatatan masuk SK dan berkas fisik</p>
        </div>
        <button onClick={onCancel} className="text-slate-500 hover:text-slate-700">
            <ArrowLeft />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        
        {/* Section 1: Identitas */}
        <div className="space-y-4">
            <h3 className="text-sm uppercase tracking-wide text-orange-600 font-bold border-b pb-2">I. Identitas Nasabah</h3>
            
            {/* Search Box / Name Input */}
            <div className="relative">
                <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">Nama Nasabah</label>
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
                    <input 
                        type="text"
                        required
                        value={selectedCustomerId ? formData.fullName : searchTerm}
                        onChange={(e) => {
                            if (selectedCustomerId) {
                                setFormData(prev => ({...prev, fullName: e.target.value}));
                            } else {
                                setSearchTerm(e.target.value);
                                setFormData(prev => ({...prev, fullName: e.target.value}));
                            }
                        }}
                        className={`w-full pl-10 p-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none ${selectedCustomerId ? 'bg-orange-50 font-bold text-slate-800' : 'bg-white'}`}
                        placeholder="Ketik Nama Nasabah..."
                        autoComplete="off"
                    />
                    {selectedCustomerId && (
                        <button 
                            type="button" 
                            onClick={() => {
                                setSelectedCustomerId(null);
                                setSearchTerm('');
                                setFormData({ ...formData, fullName: '', pensionNumber: '', skNumber: '', spkCode: '' });
                                setUploadedFile(null);
                            }}
                            className="absolute right-3 top-2.5 text-slate-400 hover:text-red-500"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>

                {/* Search Results Dropdown */}
                {!selectedCustomerId && searchResults.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-slate-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                        {searchResults.map(c => (
                            <div 
                                key={c.id} 
                                onClick={() => loadCustomerData(c)}
                                className="p-3 hover:bg-orange-50 cursor-pointer border-b border-slate-50 last:border-0"
                            >
                                <div className="font-bold text-slate-800">{c.personal.fullName}</div>
                                <div className="text-xs text-slate-500 flex gap-2">
                                    <span>Nopen: {c.pension.pensionNumber}</span>
                                    <span>•</span>
                                    <span>{c.pension.pensionType}</span>
                                </div>
                            </div>
                        ))}
                        <div 
                            className="p-3 bg-slate-50 text-center text-sm text-blue-600 font-medium cursor-pointer hover:bg-slate-100"
                            onClick={() => {
                                // Create new generic
                                setSearchResults([]);
                            }}
                        >
                            + Input Sebagai Nasabah Baru
                        </div>
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">NOPEN (Nomor Pensiun)</label>
                    <input 
                        type="text" 
                        name="pensionNumber"
                        required
                        value={formData.pensionNumber}
                        onChange={handleInputChange}
                        className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Jenis Pensiun</label>
                    <select 
                        name="pensionType"
                        value={formData.pensionType}
                        onChange={handleInputChange}
                        className="w-full border border-slate-300 rounded p-2 outline-none bg-white"
                    >
                         <option value={PensionType.TASPEN}>Taspen (PNS)</option>
                         <option value={PensionType.ASABRI}>Asabri (TNI/Polri)</option>
                    </select>
                </div>
            </div>
        </div>

        {/* Section 2: Data Arsip */}
        <div className="space-y-4">
            <h3 className="text-sm uppercase tracking-wide text-orange-600 font-bold border-b pb-2">II. Data Fisik SK & Berkas</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Nomor SK Pensiun</label>
                    <input 
                        type="text" 
                        name="skNumber"
                        required
                        value={formData.skNumber}
                        onChange={handleInputChange}
                        className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-orange-500 outline-none font-medium"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Kode SPK</label>
                    <input 
                        type="text" 
                        name="spkCode"
                        value={formData.spkCode}
                        onChange={handleInputChange}
                        className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-orange-500 outline-none"
                        placeholder="Contoh: SPK-001"
                    />
                </div>
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Tanggal Masuk (Arsip)</label>
                    <input 
                        type="date" 
                        name="skReceivedDate"
                        required
                        value={formData.skReceivedDate}
                        onChange={handleInputChange}
                        className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-orange-500 outline-none"
                    />
                </div>
            </div>

            {/* Upload Section */}
            <div className="mt-4 p-4 border-2 border-dashed border-orange-200 bg-orange-50/50 rounded-xl">
                 <div className="flex justify-between items-center mb-2">
                    <label className="text-sm font-bold text-slate-700">File Tanda Terima / SK Asli</label>
                    {uploadedFile && <CheckCircle2 size={18} className="text-green-600" />}
                 </div>

                 {uploadedFile ? (
                     <div className="flex items-center justify-between bg-white p-3 rounded-lg border border-orange-100 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 text-orange-600 rounded">
                                <FileText size={20} />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-slate-800 truncate max-w-[200px]">{uploadedFile.name}</p>
                                <a href={uploadedFile.url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline">Lihat File</a>
                            </div>
                        </div>
                        <button 
                            type="button" 
                            onClick={() => setUploadedFile(null)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                        >
                            <Trash2 size={18} />
                        </button>
                     </div>
                 ) : (
                     <div className="relative group cursor-pointer h-24 bg-white rounded-lg border border-orange-100 flex flex-col items-center justify-center hover:bg-orange-50 transition">
                         <input 
                            type="file" 
                            accept="image/*,application/pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                         />
                         <UploadCloud size={24} className="text-orange-400 mb-1 group-hover:scale-110 transition"/>
                         <span className="text-xs text-slate-500 font-medium">Klik untuk upload gambar/PDF</span>
                     </div>
                 )}
            </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-slate-100">
            <button 
                type="button" 
                onClick={onCancel}
                className="flex-1 py-3 border border-slate-300 text-slate-600 rounded-lg font-medium hover:bg-slate-50 transition"
            >
                Batal
            </button>
            <button 
                type="submit" 
                className="flex-1 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 transition shadow-lg shadow-orange-200 flex items-center justify-center gap-2"
            >
                <Save size={18} />
                Simpan Arsip
            </button>
        </div>

      </form>
    </div>
  );
};
