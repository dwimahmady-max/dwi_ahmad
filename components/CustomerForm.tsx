
import React, { useState, useEffect } from 'react';
import { Customer, Gender, PensionType, LoanType, MaritalStatus, InterestType, RepaymentType, CustomerDocument, DocumentCategory, CustomerStatus } from '../types';
import { parseCustomerData } from '../services/geminiService';
import { Save, Sparkles, Loader2, Calculator, UploadCloud, FileText, FileImage, AlertTriangle, AlertCircle, X, CalendarClock, Percent, Wallet, Eye, Trash2, Mic, Square, Video, FileVideo, CheckCircle2, PlayCircle, FileAudio, ExternalLink, Maximize2 } from 'lucide-react';

interface CustomerFormProps {
  initialData?: Customer | null;
  onSave: (customer: Customer) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

const DEFAULT_FORM_DATA = {
    // Personal
    fullName: '',
    nik: '',
    birthDate: '',
    gender: Gender.MALE,
    maritalStatus: MaritalStatus.MARRIED,
    address: '',
    phoneNumber: '',
    
    // Pension
    pensionNumber: '',
    formerInstitution: '',
    mutationOffice: '', // Added field
    pensionType: PensionType.TASPEN,
    skNumber: '',
    skIssuanceDate: '',
    skDescription: '',
    salaryAmount: 0, 

    // Nominative
    loanType: LoanType.NEW,
    loanDate: new Date().toISOString().split('T')[0],
    spkCode: '',
    loanAmount: 0,
    interestType: InterestType.ANNUITY, 
    interestRate: 35,
    tenureMonths: 24,
    monthlyInstallment: 0,
    disbursementDate: new Date().toISOString().split('T')[0],
    maturityDate: '',
    repaymentNotes: '',

    // Fees & Savings
    adminFee: 0,
    provisionFee: 0,
    marketingFee: 0,
    riskReserve: 0, 
    flaggingFee: 0, 
    principalSavings: 0,
    mandatorySavings: 0,
    repaymentType: RepaymentType.TOPUP,
    repaymentAmount: 0, 

    // Blocking
    blockedAmountSK: 0,
    blockedInstallmentCount: 0,
};

export const CustomerForm: React.FC<CustomerFormProps> = ({ initialData, onSave, onCancel, onDelete }) => {
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<CustomerDocument[]>([]);
  const [hasDraft, setHasDraft] = useState(false);
  
  // Preview Modal State
  const [previewFile, setPreviewFile] = useState<CustomerDocument | null>(null);

  // Form State
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  // KEY for LocalStorage Draft
  const draftKey = initialData ? `koperasi_draft_${initialData.id}` : 'koperasi_draft_new';

  // Load Initial Data AND Check for Drafts
  useEffect(() => {
    // Check for saved draft first
    const savedDraft = localStorage.getItem(draftKey);
    let draftObj = null;
    if (savedDraft) {
        try { draftObj = JSON.parse(savedDraft); } catch(e) {}
    }

    if (initialData) {
      // Editing Mode: Populate generic data
      const baseData = {
        fullName: initialData.personal.fullName,
        nik: initialData.personal.nik,
        birthDate: initialData.personal.birthDate,
        gender: initialData.personal.gender,
        maritalStatus: initialData.personal.maritalStatus,
        address: initialData.personal.address,
        phoneNumber: initialData.personal.phoneNumber,
        
        pensionNumber: initialData.pension.pensionNumber,
        formerInstitution: initialData.pension.formerInstitution,
        mutationOffice: initialData.pension.mutationOffice || '', // Load mutationOffice
        pensionType: initialData.pension.pensionType,
        skNumber: initialData.pension.skNumber,
        skIssuanceDate: initialData.pension.skIssuanceDate,
        skDescription: initialData.pension.skDescription,
        salaryAmount: initialData.pension.salaryAmount,

        loanType: initialData.nominative.loanType,
        loanDate: initialData.nominative.loanDate || new Date().toISOString().split('T')[0],
        spkCode: initialData.nominative.spkCode,
        loanAmount: initialData.nominative.loanAmount,
        interestType: initialData.nominative.interestType || InterestType.ANNUITY,
        interestRate: initialData.nominative.interestRate,
        tenureMonths: initialData.nominative.tenureMonths,
        monthlyInstallment: initialData.nominative.monthlyInstallment,
        disbursementDate: initialData.nominative.disbursementDate,
        maturityDate: initialData.nominative.maturityDate,
        repaymentNotes: initialData.nominative.repaymentNotes,

        adminFee: initialData.nominative.adminFee,
        provisionFee: initialData.nominative.provisionFee,
        marketingFee: initialData.nominative.marketingFee,
        riskReserve: initialData.nominative.riskReserve || 0,
        flaggingFee: initialData.nominative.flaggingFee || 0,
        principalSavings: initialData.nominative.principalSavings,
        mandatorySavings: initialData.nominative.mandatorySavings,
        repaymentType: initialData.nominative.repaymentType || RepaymentType.TOPUP,
        repaymentAmount: initialData.nominative.repaymentAmount || 0,
        
        blockedAmountSK: initialData.nominative.blockedAmountSK,
        blockedInstallmentCount: initialData.nominative.blockedInstallmentCount,
      };

      if (draftObj) {
          setFormData({ ...baseData, ...draftObj });
          setHasDraft(true);
      } else {
          setFormData(baseData);
      }
      setUploadedFiles(initialData.documents || []);

    } else {
      // New Mode
      if (draftObj) {
          setFormData(draftObj);
          setHasDraft(true);
      } else {
          setFormData(DEFAULT_FORM_DATA);
          setUploadedFiles([]);
      }
    }
  }, [initialData, draftKey]);

  // Save Draft on Change (Debounced)
  useEffect(() => {
      const timer = setTimeout(() => {
          localStorage.setItem(draftKey, JSON.stringify(formData));
      }, 500); 
      return () => clearTimeout(timer);
  }, [formData, draftKey]);

  // Auto-calculate Fees
  useEffect(() => {
    const plafon = formData.loanAmount || 0;
    setFormData(prev => ({
      ...prev,
      adminFee: plafon > 0 ? plafon * 0.075 : 0,     
      provisionFee: plafon > 0 ? plafon * 0.025 : 0, 
      marketingFee: plafon > 0 ? plafon * 0.05 : 0,  
      riskReserve: plafon > 0 ? plafon * 0.11 : 0,   
      principalSavings: plafon > 0 ? 20000 : 0,      
      mandatorySavings: plafon > 0 ? 100000 : 0      
    }));
  }, [formData.loanAmount]);

  // Calculate fields (Installments)
  useEffect(() => {
    if (formData.loanAmount > 0 && formData.tenureMonths > 0) {
      const principal = formData.loanAmount;
      const months = formData.tenureMonths;
      let calculatedInstallment = 0;

      if (formData.interestType === InterestType.ANNUITY) {
        const yearlyRate = formData.interestRate / 100;
        const monthlyRate = yearlyRate / 12;
        if (monthlyRate === 0) {
          calculatedInstallment = principal / months;
        } else {
          calculatedInstallment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / (Math.pow(1 + monthlyRate, months) - 1);
        }
      } else {
        const monthlyRate = formData.interestRate / 100;
        const principalInstallment = principal / months;
        const interestInstallment = principal * monthlyRate;
        calculatedInstallment = principalInstallment + interestInstallment;
      }
      
      const disburseDate = new Date(formData.disbursementDate);
      if (!isNaN(disburseDate.getTime())) {
        const matureDate = new Date(disburseDate);
        matureDate.setMonth(matureDate.getMonth() + formData.tenureMonths);
        
        setFormData(prev => ({
          ...prev,
          monthlyInstallment: Math.round(calculatedInstallment),
          maturityDate: matureDate.toISOString().split('T')[0]
        }));
      }
    }
  }, [formData.loanAmount, formData.interestRate, formData.interestType, formData.tenureMonths, formData.disbursementDate]);

  // Calculations variables
  const dbrPercentage = formData.salaryAmount > 0 ? (formData.monthlyInstallment / formData.salaryAmount) * 100 : 0;
  const isDbrHigh = dbrPercentage > 98;

  const totalFees = (formData.adminFee || 0) + (formData.provisionFee || 0) + (formData.marketingFee || 0) + (formData.riskReserve || 0) + (formData.flaggingFee || 0);
  const totalSavings = (formData.principalSavings || 0); 
  const totalBlocking = (formData.blockedAmountSK || 0) + ((formData.blockedInstallmentCount || 0) * formData.monthlyInstallment);
  const totalPelunasan = formData.repaymentAmount || 0;
  const totalDeductions = totalFees + totalSavings + totalBlocking + totalPelunasan;
  const netReceived = (formData.loanAmount || 0) - totalDeductions;
  const totalMonthlyPayment = (formData.monthlyInstallment || 0) + (formData.mandatorySavings || 0);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, category: DocumentCategory) => {
    if (e.target.files) {
      const newFiles: CustomerDocument[] = Array.from(e.target.files).map(file => {
        let type: 'image' | 'pdf' | 'video' | 'audio' | 'other' = 'other';
        if (file.type.startsWith('image/')) type = 'image';
        else if (file.type === 'application/pdf') type = 'pdf';
        else if (file.type.startsWith('video/')) type = 'video';
        else if (file.type.startsWith('audio/')) type = 'audio';

        return {
          id: crypto.randomUUID(),
          name: file.name,
          type,
          category,
          url: URL.createObjectURL(file) 
        };
      });
      setUploadedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== id));
  };

  const handleAISubmit = async () => {
    if (!aiInput.trim()) return;
    setIsProcessingAI(true);
    try {
      const result = await parseCustomerData(aiInput);
      setFormData(prev => ({ ...prev, ...result }));
      setShowAiModal(false);
      setAiInput('');
    } catch (error) {
      alert("Gagal memproses teks dengan AI.");
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const customerData: Customer = {
      id: initialData ? initialData.id : crypto.randomUUID(),
      personal: { ...formData, gender: formData.gender as Gender, maritalStatus: formData.maritalStatus as MaritalStatus },
      pension: { ...formData, pensionType: formData.pensionType as PensionType },
      nominative: { ...formData, loanType: formData.loanType as LoanType, interestType: formData.interestType as InterestType, repaymentType: formData.repaymentType as RepaymentType },
      documents: uploadedFiles,
      status: initialData ? initialData.status : CustomerStatus.ACTIVE, // Keep existing status or Default to ACTIVE
      createdAt: initialData ? initialData.createdAt : new Date().toISOString()
    };
    
    localStorage.removeItem(draftKey);
    onSave(customerData);
  };

  const handleCancel = () => {
      if (window.confirm("Batalkan perubahan? Draft yang belum disimpan akan dihapus.")) {
        localStorage.removeItem(draftKey);
        onCancel();
      }
  };

  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID').format(val);

  // Components
  const DocumentSlot = ({ category, label, acceptedTypes = "image/*,application/pdf" }: { category: DocumentCategory, label: string, acceptedTypes?: string }) => {
    const files = uploadedFiles.filter(f => f.category === category);
    
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col h-full">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-bold text-slate-700 uppercase">{label}</label>
          {files.length > 0 && <CheckCircle2 size={16} className="text-green-500" />}
        </div>
        
        <div className="flex-1 space-y-2">
          {files.map(file => (
            <div key={file.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-100 text-xs">
               <div className="flex items-center gap-2 truncate max-w-[70%] cursor-pointer group" onClick={() => setPreviewFile(file)}>
                 {file.type === 'image' ? <FileImage size={14} className="text-purple-500"/> : <FileText size={14} className="text-red-500"/>}
                 <span className="truncate group-hover:text-blue-600 group-hover:underline" title={file.name}>{file.name}</span>
               </div>
               <button type="button" onClick={() => removeFile(file.id)} className="text-red-500 hover:text-red-700"><Trash2 size={14}/></button>
            </div>
          ))}
        </div>

        <div className="mt-3 relative">
          <input 
            type="file" 
            accept={acceptedTypes} 
            onChange={(e) => handleFileChange(e, category)} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          />
          <button type="button" className="w-full py-1.5 border-2 border-dashed border-blue-200 text-blue-600 rounded bg-blue-50/50 hover:bg-blue-100 transition text-xs font-medium flex items-center justify-center gap-1">
            <UploadCloud size={14} /> Upload {label}
          </button>
        </div>
      </div>
    );
  };

  const PreviewModal = () => {
    if (!previewFile) return null;

    const isImage = previewFile.type === 'image';
    const isVideo = previewFile.type === 'video';
    const isAudio = previewFile.type === 'audio';
    const isPdf = previewFile.type === 'pdf';

    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
          <div className="flex justify-between items-center p-4 border-b border-slate-100 bg-slate-50">
            <div className="flex items-center gap-2 overflow-hidden">
              {isImage && <FileImage size={20} className="text-purple-600" />}
              {isVideo && <FileVideo size={20} className="text-purple-600" />}
              {isAudio && <FileAudio size={20} className="text-blue-600" />}
              {isPdf && <FileText size={20} className="text-red-600" />}
              <span className="font-semibold text-slate-700 truncate">{previewFile.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <a 
                href={previewFile.url} 
                target="_blank" 
                rel="noreferrer" 
                className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                title="Buka di Tab Baru"
              >
                <ExternalLink size={20} />
              </a>
              <button onClick={() => setPreviewFile(null)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                <X size={24} />
              </button>
            </div>
          </div>
          
          <div className="flex-1 overflow-auto bg-slate-900 flex items-center justify-center p-4">
            {isImage && (
              <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" />
            )}
            {isVideo && (
              <video src={previewFile.url} controls className="max-w-full max-h-[70vh] rounded-lg shadow-lg w-full" autoPlay />
            )}
            {isAudio && (
              <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center gap-4 w-full max-w-md">
                 <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 mb-2">
                   <PlayCircle size={40} />
                 </div>
                 <h4 className="font-medium text-slate-800 text-center">{previewFile.name}</h4>
                 <audio src={previewFile.url} controls className="w-full" autoPlay />
              </div>
            )}
            {isPdf && (
               <iframe src={previewFile.url} className="w-full h-[70vh] bg-white rounded-lg" title="PDF Preview"></iframe>
            )}
            {!isImage && !isVideo && !isAudio && !isPdf && (
              <div className="text-white text-center">
                <p className="mb-4">Preview tidak tersedia untuk format ini.</p>
                <a href={previewFile.url} target="_blank" rel="noreferrer" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Download File</a>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-slide-in-up">
      {/* Header */}
      <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 z-10">
        <div>
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            {initialData ? 'Edit Data Nasabah' : 'Input Data Nasabah Baru'}
            {hasDraft && <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-200 font-normal">Draft Dipulihkan</span>}
          </h2>
          <p className="text-sm text-slate-500">Lengkapi formulir lengkap dengan data nominatif, potongan, dan dokumen.</p>
        </div>
        {!initialData && (
          <button 
            onClick={() => setShowAiModal(true)}
            className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium shadow-sm"
          >
            <Sparkles size={16} /> AI Auto-Fill
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        
        {/* I. Data Pribadi */}
        <div>
          <h3 className="text-sm uppercase tracking-wide text-blue-600 font-bold mb-4 border-b pb-2">I. Data Pribadi</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Nama Lengkap</label>
              <input required name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">NIK (KTP)</label>
              <input required name="nik" value={formData.nik} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Tanggal Lahir</label>
              <input type="date" required name="birthDate" value={formData.birthDate} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 outline-none" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Jenis Kelamin</label>
                <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 outline-none bg-white">
                  <option value={Gender.MALE}>Laki-laki</option>
                  <option value={Gender.FEMALE}>Perempuan</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase">Status</label>
                <select name="maritalStatus" value={formData.maritalStatus} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 outline-none bg-white">
                  <option value={MaritalStatus.MARRIED}>Menikah</option>
                  <option value={MaritalStatus.SINGLE}>Belum Menikah</option>
                  <option value={MaritalStatus.DIVORCED_DEATH}>Cerai Mati</option>
                  <option value={MaritalStatus.WIDOW}>Janda</option>
                  <option value={MaritalStatus.WIDOWER}>Duda</option>
                </select>
              </div>
            </div>
            <div className="md:col-span-2 space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Alamat Lengkap</label>
              <textarea required name="address" value={formData.address} onChange={handleInputChange} rows={2} className="w-full border border-slate-300 rounded p-2 outline-none resize-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">No. Handphone</label>
              <input required name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 outline-none" />
            </div>
          </div>
        </div>

        {/* II. Data Kepensiunan */}
        <div>
          <h3 className="text-sm uppercase tracking-wide text-blue-600 font-bold mb-4 border-b pb-2">II. Data Kepensiunan & SK</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Jenis Pensiun</label>
              <select name="pensionType" value={formData.pensionType} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 outline-none bg-white">
                <option value={PensionType.TASPEN}>Taspen (PNS)</option>
                <option value={PensionType.ASABRI}>Asabri (TNI/Polri)</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">NOPEN</label>
              <input required name="pensionNumber" value={formData.pensionNumber} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Kantor Bayar</label>
              <input required name="formerInstitution" value={formData.formerInstitution} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 outline-none" />
            </div>
            
            {/* Added Mutation Office Field */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase text-blue-600">Mutasi Kantor Bayar (Tujuan)</label>
              <input 
                name="mutationOffice" 
                value={formData.mutationOffice} 
                onChange={handleInputChange} 
                className="w-full border border-blue-200 bg-blue-50 rounded p-2 outline-none"
                placeholder="Isi jika sedang mutasi..." 
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Nomor SK Pensiun</label>
              <input required name="skNumber" value={formData.skNumber} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Tanggal SK</label>
              <input type="date" name="skIssuanceDate" value={formData.skIssuanceDate} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 outline-none" />
            </div>
             <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase text-green-700">Gaji Pensiun</label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-500 text-sm">Rp</span>
                <input type="number" min="0" required name="salaryAmount" value={formData.salaryAmount || ''} onChange={handleInputChange} className="w-full border border-green-300 bg-green-50 rounded p-2 pl-9 outline-none font-medium" />
              </div>
            </div>
            <div className="md:col-span-3 space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Keterangan SK</label>
              <input name="skDescription" value={formData.skDescription} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 outline-none" placeholder="Lokasi SK Asli..." />
            </div>
          </div>
        </div>

        {/* III. Data Nominatif Pinjaman */}
        <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
          <h3 className="text-sm uppercase tracking-wide text-blue-800 font-bold mb-4 flex items-center gap-2">
            <Calculator size={18}/> III. Nominatif & Struktur Kredit
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Jenis Pinjaman</label>
              <select name="loanType" value={formData.loanType} onChange={handleInputChange} className="w-full border border-blue-300 rounded p-2 outline-none bg-white font-medium">
                <option value={LoanType.NEW}>Pinjaman Baru</option>
                <option value={LoanType.TOPUP}>Top Up</option>
                <option value={LoanType.TAKEOVER}>Take Over</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Tanggal Pinjaman</label>
              <input type="date" required name="loanDate" value={formData.loanDate} onChange={handleInputChange} className="w-full border border-blue-300 rounded p-2 outline-none" />
            </div>
             <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Kode SPK</label>
              <input name="spkCode" value={formData.spkCode} onChange={handleInputChange} className="w-full border border-blue-300 rounded p-2 outline-none" />
            </div>
             <div className="space-y-1">
               <label className="text-xs font-semibold text-slate-500 uppercase">Tanggal Cair</label>
               <input type="date" required name="disbursementDate" value={formData.disbursementDate} onChange={handleInputChange} className="w-full border border-blue-300 rounded p-2 outline-none" />
            </div>
             <div className="space-y-1">
               <label className="text-xs font-semibold text-slate-500 uppercase">Jadwal Lunas</label>
               <input type="date" readOnly name="maturityDate" value={formData.maturityDate} className="w-full border border-slate-200 bg-slate-100 text-slate-500 rounded p-2 outline-none cursor-not-allowed" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-white rounded-lg border border-blue-100 shadow-sm">
             {/* Kolom 1 */}
             <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Plafon Pinjaman</label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-slate-500 text-sm">Rp</span>
                    <input type="number" min="0" required name="loanAmount" value={formData.loanAmount || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 pl-9 outline-none font-bold text-lg" />
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="space-y-1 w-1/2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Tenor (Bln)</label>
                    <input type="number" min="1" required name="tenureMonths" value={formData.tenureMonths || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 outline-none" />
                  </div>
                  <div className="space-y-1 w-1/2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Bunga % (Thn)</label>
                    <input type="number" step="0.01" required name="interestRate" value={formData.interestRate || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 outline-none" />
                  </div>
                </div>
             </div>

             {/* Kolom 2 */}
             <div className="space-y-4 border-l pl-4 md:border-l-slate-100">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Angsuran per Bulan</label>
                  <div className="w-full bg-blue-600 border border-blue-700 rounded p-2.5 text-white font-bold text-lg shadow-sm">
                    Rp {formatIDR(totalMonthlyPayment)}
                  </div>
                </div>
                
                {/* DBR */}
                <div className={`p-3 rounded-lg border ${isDbrHigh ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold uppercase text-slate-600">DBR Ratio</span>
                    <span className={`text-sm font-bold ${isDbrHigh ? 'text-red-600' : 'text-green-600'}`}>{dbrPercentage.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-white rounded-full h-2.5 mb-1">
                    <div className={`h-2.5 rounded-full ${isDbrHigh ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(dbrPercentage, 100)}%` }}></div>
                  </div>
                  <div className="text-[10px] text-slate-500">{isDbrHigh ? 'Melebihi batas (98%)' : 'Aman (Max 98%)'}</div>
                </div>
             </div>

             {/* Kolom 3 */}
             <div className="space-y-4 border-l pl-4 md:border-l-slate-100">
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase text-red-600">Blokir Dana SK</label>
                  <div className="relative">
                     <span className="absolute left-3 top-2 text-slate-400 text-xs">Rp</span>
                     <input type="number" min="0" name="blockedAmountSK" value={formData.blockedAmountSK || ''} onChange={handleInputChange} className="w-full border border-red-200 bg-red-50 rounded p-2 pl-9 outline-none text-sm" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-500 uppercase text-red-600">Blokir Angsuran (Bln)</label>
                   <input type="number" min="0" name="blockedInstallmentCount" value={formData.blockedInstallmentCount || ''} onChange={handleInputChange} className="w-full border border-red-200 bg-red-50 rounded p-2 outline-none text-sm" />
                </div>
             </div>
          </div>
          
          {/* Biaya & Simpanan */}
          <div className="mt-6 pt-4 border-t border-blue-200">
             <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Rincian Potongan</h4>
             <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="space-y-1"><label className="text-[10px] uppercase text-slate-500">Admin</label><input readOnly value={formatIDR(formData.adminFee)} className="w-full text-xs p-2 bg-slate-100 rounded" /></div>
                <div className="space-y-1"><label className="text-[10px] uppercase text-slate-500">Provisi</label><input readOnly value={formatIDR(formData.provisionFee)} className="w-full text-xs p-2 bg-slate-100 rounded" /></div>
                <div className="space-y-1"><label className="text-[10px] uppercase text-slate-500">Marketing</label><input readOnly value={formatIDR(formData.marketingFee)} className="w-full text-xs p-2 bg-slate-100 rounded" /></div>
                <div className="space-y-1"><label className="text-[10px] uppercase text-slate-500">CR (11%)</label><input readOnly value={formatIDR(formData.riskReserve)} className="w-full text-xs p-2 bg-slate-100 rounded" /></div>
                <div className="space-y-1"><label className="text-[10px] uppercase text-slate-500">Simp. Pokok</label><input readOnly value={formatIDR(formData.principalSavings)} className="w-full text-xs p-2 bg-slate-100 rounded" /></div>
                <div className="space-y-1">
                   <label className="text-[10px] uppercase text-red-600">Pelunasan</label>
                   <input type="number" name="repaymentAmount" value={formData.repaymentAmount || ''} onChange={handleInputChange} className="w-full text-xs p-2 border border-red-300 rounded bg-red-50" />
                </div>
             </div>
          </div>

          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5 flex justify-between items-center">
             <div><h4 className="text-sm font-bold text-green-800">Terima Bersih (Net)</h4><p className="text-xs text-green-600">Setelah dikurangi semua potongan</p></div>
             <div className="text-3xl font-bold text-green-700">Rp {formatIDR(netReceived)}</div>
          </div>
        </div>

        {/* IV. Dokumen & Media */}
        <div>
           <h3 className="text-sm uppercase tracking-wide text-blue-600 font-bold mb-4 border-b pb-2">IV. Dokumen & Media</h3>
           
           {/* Dokumen Wajib */}
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <DocumentSlot category="KTP" label="KTP (Wajib)" />
              <DocumentSlot category="KK" label="Kartu Keluarga" />
              <DocumentSlot category="SK" label="SK Pensiun" />
              <DocumentSlot category="KARIP" label="Karip / Buku Pensiun" />

              {/* Added Documents */}
              <DocumentSlot category="EPOT" label="e-Pot / Potongan" />
              <DocumentSlot category="DAPEM" label="Dapem / Gaji Berkala" />
              <DocumentSlot category="SLIK" label="SLIK OJK (BI Checking)" />
              <DocumentSlot category="ASABRI" label="Dokumen Asabri" />

              {/* NEW Documents Slots */}
              <DocumentSlot category="NPWP" label="NPWP" />
              <DocumentSlot category="SLIP_GAJI" label="Slip Gaji Terakhir" />
              <DocumentSlot category="REK_KORAN" label="Rekening Koran (3 Bln)" />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Voice Upload */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                 <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
                   <FileAudio size={18} /> Rekaman Suara (Wawancara)
                 </h4>
                 <div className="border-2 border-dashed border-slate-300 bg-white rounded-lg h-40 flex flex-col items-center justify-center relative hover:bg-slate-50 transition group">
                    <input 
                      type="file" 
                      accept="audio/*" 
                      onChange={(e) => handleFileChange(e, 'AUDIO')} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <FileAudio size={32} className="text-slate-400 mb-2 group-hover:text-blue-500 transition"/>
                    <span className="text-xs text-slate-500 font-medium group-hover:text-blue-600">Upload Audio (MP3/WAV)</span>
                 </div>
                 {/* List Audio Files */}
                 <div className="mt-3 space-y-2">
                    {uploadedFiles.filter(f => f.category === 'AUDIO').map(file => (
                       <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded border text-xs">
                          <div className="flex items-center gap-2 flex-1 overflow-hidden cursor-pointer" onClick={() => setPreviewFile(file)}>
                            <div className="p-1.5 bg-blue-100 rounded-full text-blue-600">
                                <PlayCircle size={16} />
                            </div>
                            <span className="truncate hover:text-blue-600 hover:underline font-medium">{file.name}</span>
                          </div>
                          {/* Mini inline player just in case, but modal is better for listening */}
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setPreviewFile(file)} className="text-blue-500 hover:bg-blue-50 p-1 rounded" title="Dengarkan">
                                <Maximize2 size={14}/>
                            </button>
                            <button type="button" onClick={() => removeFile(file.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14}/></button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

              {/* Video Upload */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                 <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2 mb-3">
                   <Video size={18} /> Video Survei / Verifikasi
                 </h4>
                 <div className="border-2 border-dashed border-slate-300 bg-white rounded-lg h-40 flex flex-col items-center justify-center relative hover:bg-slate-50 transition group">
                    <input 
                      type="file" 
                      accept="video/*" 
                      onChange={(e) => handleFileChange(e, 'VIDEO')} 
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <FileVideo size={32} className="text-slate-400 mb-2 group-hover:text-purple-500 transition"/>
                    <span className="text-xs text-slate-500 font-medium group-hover:text-purple-600">Upload Video (MP4/MOV)</span>
                 </div>
                 {/* List Video Files */}
                 <div className="mt-3 space-y-2">
                    {uploadedFiles.filter(f => f.category === 'VIDEO').map(file => (
                       <div key={file.id} className="flex items-center justify-between p-2 bg-white rounded border text-xs">
                          <div className="flex items-center gap-2 flex-1 overflow-hidden cursor-pointer" onClick={() => setPreviewFile(file)}>
                            <div className="p-1.5 bg-purple-100 rounded-full text-purple-600">
                                <FileVideo size={16} />
                            </div>
                            <span className="truncate hover:text-purple-600 hover:underline font-medium">{file.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setPreviewFile(file)} className="text-purple-600 hover:bg-purple-50 p-1 rounded font-medium flex items-center gap-1">
                                <Maximize2 size={14}/>
                            </button>
                            <button type="button" onClick={() => removeFile(file.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 size={14}/></button>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>
           </div>

           {/* Dokumen Tambahan */}
           <div className="mt-6">
              <h4 className="text-sm font-bold text-slate-700 mb-2">Dokumen Tambahan Lainnya</h4>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:bg-slate-50 transition relative bg-slate-50/50">
                  <input type="file" multiple onChange={(e) => handleFileChange(e, 'OTHER')} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <UploadCloud size={30} className="text-blue-400" />
                    <p className="font-medium text-sm">Upload Dokumen Lain (Slip Gaji, Rekening Koran, dll)</p>
                  </div>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                 {uploadedFiles.filter(f => f.category === 'OTHER').map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-2 bg-white border rounded text-xs">
                       <div className="flex items-center gap-2 truncate cursor-pointer hover:text-blue-600" onClick={() => setPreviewFile(file)}>
                          <FileText size={14} className="text-slate-400"/>
                          <span className="truncate">{file.name}</span>
                       </div>
                       <button type="button" onClick={() => removeFile(file.id)} className="text-red-500"><Trash2 size={14}/></button>
                    </div>
                 ))}
              </div>
           </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col-reverse md:flex-row justify-between gap-4 pt-6 border-t">
          <div>
            {initialData && onDelete && (
              <button 
                type="button" 
                onClick={() => {
                  if (window.confirm('Hapus permanen data ini?')) {
                    localStorage.removeItem(draftKey);
                    onDelete(initialData.id);
                  }
                }}
                className="w-full md:w-auto px-4 py-2.5 rounded-lg border border-red-200 text-red-600 font-medium hover:bg-red-50 transition flex items-center justify-center gap-2"
              >
                <Trash2 size={18} /> Hapus Data
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button type="button" onClick={handleCancel} className="flex-1 md:flex-none px-6 py-2.5 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition">
              Batal
            </button>
            <button type="submit" className="flex-1 md:flex-none px-6 py-2.5 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
              <Save size={18} />
              {initialData ? 'Perbarui Data' : 'Simpan Data Lengkap'}
            </button>
          </div>
        </div>
      </form>

      {/* AI Modal */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white flex justify-between items-center">
              <h3 className="text-lg font-bold flex items-center gap-2">
                <Sparkles size={20} /> AI Smart Import
              </h3>
              <button onClick={() => setShowAiModal(false)} className="text-white/80 hover:text-white"><X size={20}/></button>
            </div>
            <div className="p-6 space-y-4">
              <textarea
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                className="w-full h-40 border border-slate-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-purple-500 outline-none resize-none"
                placeholder="Tempelkan teks mentah di sini..."
              />
              <div className="flex justify-end gap-2">
                <button 
                  onClick={handleAISubmit} 
                  disabled={isProcessingAI || !aiInput.trim()}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessingAI ? <Loader2 className="animate-spin" size={18} /> : <Sparkles size={18} />} Proses
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      <PreviewModal />
    </div>
  );
};
