
import React, { useState, useEffect } from 'react';
import { Customer, Gender, PensionType, LoanType, MaritalStatus, InterestType, RepaymentType, CustomerDocument, DocumentCategory, CustomerStatus } from '../types';
import { parseCustomerData } from '../services/geminiService';
import { Save, Sparkles, Loader2, Calculator, UploadCloud, FileText, FileImage, AlertTriangle, AlertCircle, X, CalendarClock, Percent, Wallet, Eye, Trash2, Mic, Square, Video, FileVideo, CheckCircle2, PlayCircle, FileAudio, ExternalLink, Maximize2, UserCircle, Info, Calendar, MoreHorizontal } from 'lucide-react';

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
    mutationOffice: '', 
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
    interestRate: 38, // Default updated to 38 based on request
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
    principalSavings: 100000, // Default Updated
    mandatorySavings: 20000,  // Default Updated
    repaymentType: RepaymentType.TOPUP,
    repaymentAmount: 0, 

    // Blocking
    blockedAmountSK: 0,
    blockedInstallmentCount: 1,

    // Marketing
    marketingName: ''
};

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni", 
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

export const CustomerForm: React.FC<CustomerFormProps> = ({ initialData, onSave, onCancel, onDelete }) => {
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiInput, setAiInput] = useState('');
  const [showAiModal, setShowAiModal] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<CustomerDocument[]>([]);
  const [hasDraft, setHasDraft] = useState(false);
  const [previewFile, setPreviewFile] = useState<CustomerDocument | null>(null);
  const [equivalentFlatRate, setEquivalentFlatRate] = useState<string>('0');

  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  // Helper State for Birth Date Split Inputs
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [age, setAge] = useState('');

  const draftKey = initialData ? `koperasi_draft_${initialData.id}` : 'koperasi_draft_new';

  useEffect(() => {
    const savedDraft = localStorage.getItem(draftKey);
    let draftObj = null;
    if (savedDraft) {
        try { draftObj = JSON.parse(savedDraft); } catch(e) {}
    }

    if (initialData) {
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
        mutationOffice: initialData.pension.mutationOffice || '',
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

        marketingName: initialData.marketingName || ''
      };

      if (draftObj) {
          setFormData({ ...baseData, ...draftObj });
          setHasDraft(true);
      } else {
          setFormData(baseData);
      }
      setUploadedFiles(initialData.documents || []);

    } else {
      if (draftObj) {
          setFormData(draftObj);
          setHasDraft(true);
      } else {
          setFormData(DEFAULT_FORM_DATA);
          setUploadedFiles([]);
      }
    }
  }, [initialData, draftKey]);

  // Sync Birth Date String (YYYY-MM-DD) to Split Inputs
  useEffect(() => {
    if (formData.birthDate) {
        const [y, m, d] = formData.birthDate.split('-');
        if (y && m && d) {
            setDobYear(y);
            setDobMonth(parseInt(m).toString()); // Remove leading zero
            setDobDay(parseInt(d).toString()); // Remove leading zero
            
            // Calc Age
            const currentYear = new Date().getFullYear();
            setAge((currentYear - parseInt(y)).toString());
        }
    } else {
        setDobYear('');
        setDobMonth('');
        setDobDay('');
        setAge('');
    }
  }, [formData.birthDate]);

  useEffect(() => {
      const timer = setTimeout(() => {
          localStorage.setItem(draftKey, JSON.stringify(formData));
      }, 500); 
      return () => clearTimeout(timer);
  }, [formData, draftKey]);

  useEffect(() => {
    const plafon = formData.loanAmount || 0;
    setFormData(prev => ({
      ...prev,
      adminFee: plafon > 0 ? plafon * 0.075 : 0,     
      provisionFee: plafon > 0 ? plafon * 0.025 : 0, 
      marketingFee: plafon > 0 ? plafon * 0.05 : 0,  
      riskReserve: plafon > 0 ? plafon * 0.11 : 0,   
    }));
  }, [formData.loanAmount]);

  // CALCULATION LOGIC UPDATE FOR ANNUITY FORMULA
  useEffect(() => {
    if (formData.loanAmount > 0 && formData.tenureMonths > 0) {
      const principal = formData.loanAmount;
      const months = formData.tenureMonths;
      let calculatedInstallment = 0;
      let flatRateEquivalent = 0;

      if (formData.interestType === InterestType.ANNUITY) {
        // Rumus Anuitas
        const annualRate = formData.interestRate;
        const monthlyInterestRate = (annualRate / 100) / 12;

        if (monthlyInterestRate === 0) {
          calculatedInstallment = principal / months;
        } else {
          const numerator = monthlyInterestRate;
          const denominator = 1 - Math.pow(1 + monthlyInterestRate, -months);
          calculatedInstallment = principal * (numerator / denominator);
        }

        const totalPayment = calculatedInstallment * months;
        const totalInterest = totalPayment - principal;
        const monthlyInterestNominal = totalInterest / months;
        flatRateEquivalent = (monthlyInterestNominal / principal) * 100;

      } else {
        // Rumus Flat
        const monthlyRatePct = formData.interestRate; 
        const monthlyRate = monthlyRatePct / 100;
        
        const principalInstallment = principal / months;
        const interestInstallment = principal * monthlyRate;
        calculatedInstallment = principalInstallment + interestInstallment;
        
        flatRateEquivalent = monthlyRatePct;
      }
      
      setEquivalentFlatRate(flatRateEquivalent.toFixed(2));

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
    } else {
        setEquivalentFlatRate('0');
    }
  }, [formData.loanAmount, formData.interestRate, formData.interestType, formData.tenureMonths, formData.disbursementDate]);

  const dbrPercentage = formData.salaryAmount > 0 ? (formData.monthlyInstallment / formData.salaryAmount) * 100 : 0;
  const isDbrHigh = dbrPercentage > 98;

  const totalFees = (formData.adminFee || 0) + (formData.provisionFee || 0) + (formData.marketingFee || 0) + (formData.riskReserve || 0) + (formData.flaggingFee || 0);
  
  // NOTE: Simpanan Pokok dan Wajib dimasukkan ke dalam total potongan (mengurangi terima bersih) sesuai permintaan.
  const totalSavings = (formData.principalSavings || 0) + (formData.mandatorySavings || 0); 
  
  const blockedInstallmentNominal = (formData.blockedInstallmentCount || 0) * ((formData.monthlyInstallment || 0) + (formData.mandatorySavings || 0));
  const totalBlocking = (formData.blockedAmountSK || 0) + blockedInstallmentNominal;
  const totalPelunasan = formData.repaymentAmount || 0;
  
  // Total Potongan (Termasuk Simpanan)
  const totalDeductions = totalFees + totalSavings + totalBlocking + totalPelunasan;
  const netReceived = (formData.loanAmount || 0) - totalDeductions;
  
  const totalMonthlyPayment = (formData.monthlyInstallment || 0) + (formData.mandatorySavings || 0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) || 0 : value
    }));
  };

  // --- Date Handling Logic ---
  const updateBirthDate = (d: string, m: string, y: string) => {
      // Pad with zeros
      const day = d.padStart(2, '0');
      const month = m.padStart(2, '0');
      const year = y;
      
      if (y.length === 4 && m && d) {
          setFormData(prev => ({ ...prev, birthDate: `${year}-${month}-${day}` }));
      }
  };

  const handleDayChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      let val = e.target.value;
      if (parseInt(val) > 31) val = '31';
      setDobDay(val);
      updateBirthDate(val, dobMonth, dobYear);
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const val = e.target.value;
      setDobMonth(val);
      updateBirthDate(dobDay, val, dobYear);
  };

  const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setDobYear(val);
      updateBirthDate(dobDay, dobMonth, val);
      
      if (val.length === 4) {
          setAge((new Date().getFullYear() - parseInt(val)).toString());
      }
  };

  const handleAgeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setAge(val);
      if (val && parseInt(val) > 0) {
          const calcYear = (new Date().getFullYear() - parseInt(val)).toString();
          setDobYear(calcYear);
          // If Day/Month empty, default to Jan 1st
          const newDay = dobDay || '1';
          const newMonth = dobMonth || '1';
          
          if (!dobDay) setDobDay('1');
          if (!dobMonth) setDobMonth('1');
          
          updateBirthDate(newDay, newMonth, calcYear);
      }
  };
  // ---------------------------

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, category: DocumentCategory) => {
    if (e.target.files) {
      // Support Multiple Files
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
      status: initialData ? initialData.status : CustomerStatus.ACTIVE,
      marketingName: formData.marketingName,
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

  const DocumentSlot = ({ 
    category, 
    label, 
    acceptedTypes = "image/*,application/pdf", 
    multiple = false,
    maxCount = 5 
  }: { 
    category: DocumentCategory, 
    label: string, 
    acceptedTypes?: string, 
    multiple?: boolean,
    maxCount?: number
  }) => {
    const files = uploadedFiles.filter(f => f.category === category);
    
    return (
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex flex-col h-full">
        <div className="flex justify-between items-center mb-2">
          <label className="text-xs font-bold text-slate-700 uppercase flex items-center gap-1">
            {label}
            {multiple && <span className="text-[10px] bg-slate-200 px-1 rounded text-slate-500 font-normal">Max {maxCount}</span>}
          </label>
          {files.length > 0 && <CheckCircle2 size={16} className="text-green-500" />}
        </div>
        
        <div className="flex-1 space-y-2 mb-2">
          {files.map(file => (
            <div key={file.id} className="flex items-center justify-between bg-white p-2 rounded border border-slate-100 text-xs shadow-sm">
               <div className="flex items-center gap-2 truncate max-w-[75%] cursor-pointer group" onClick={() => setPreviewFile(file)}>
                 {file.type === 'image' && <FileImage size={14} className="text-purple-500"/>}
                 {file.type === 'video' && <FileVideo size={14} className="text-pink-500"/>}
                 {file.type === 'audio' && <FileAudio size={14} className="text-yellow-500"/>}
                 {(file.type === 'pdf' || file.type === 'other') && <FileText size={14} className="text-red-500"/>}
                 
                 <span className="truncate group-hover:text-blue-600 group-hover:underline" title={file.name}>{file.name}</span>
               </div>
               <button type="button" onClick={() => removeFile(file.id)} className="text-slate-400 hover:text-red-600"><Trash2 size={14}/></button>
            </div>
          ))}
          {files.length === 0 && <div className="text-[10px] text-slate-400 italic text-center py-4">Belum ada file</div>}
        </div>

        <div className="mt-auto relative">
          <input 
            type="file" 
            accept={acceptedTypes} 
            multiple={multiple}
            onChange={(e) => handleFileChange(e, category)} 
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
          />
          <button type="button" className="w-full py-2 border-2 border-dashed border-blue-200 text-blue-600 rounded bg-blue-50/30 hover:bg-blue-100 transition text-xs font-medium flex items-center justify-center gap-1">
            <UploadCloud size={14} /> Upload
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
            <span className="font-semibold text-slate-700 truncate">{previewFile.name}</span>
            <div className="flex items-center gap-2">
              <a href={previewFile.url} target="_blank" rel="noreferrer" className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"><ExternalLink size={20} /></a>
              <button onClick={() => setPreviewFile(null)} className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"><X size={24} /></button>
            </div>
          </div>
          <div className="flex-1 overflow-auto bg-slate-900 flex items-center justify-center p-4">
            {isImage && <img src={previewFile.url} alt={previewFile.name} className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg" />}
            {isVideo && <video src={previewFile.url} controls className="max-w-full max-h-[70vh] rounded-lg shadow-lg w-full" autoPlay />}
            {isAudio && <div className="bg-white p-8 rounded-full shadow-lg"><audio src={previewFile.url} controls className="w-full max-w-md" autoPlay /></div>}
            {isPdf && <iframe src={previewFile.url} className="w-full h-[70vh] bg-white rounded-lg" title="PDF Preview"></iframe>}
            {!isImage && !isVideo && !isAudio && !isPdf && (
              <div className="text-white text-center">
                <p className="mb-4">Preview tidak tersedia.</p>
                <a href={previewFile.url} target="_blank" rel="noreferrer" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Download</a>
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
             {/* Simple inputs... */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">Nama Lengkap</label>
              <input required name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase">NIK (KTP)</label>
              <input required name="nik" value={formData.nik} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 focus:ring-1 focus:ring-blue-500 outline-none" />
            </div>
            
            {/* --- IMPROVED BIRTH DATE INPUT (SPLIT & AGE) --- */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase flex justify-between">
                <span>Tanggal Lahir</span>
                <span className="text-blue-600 cursor-pointer text-[10px]" title="Otomatis hitung tahun lahir">Isi Umur?</span>
              </label>
              <div className="flex gap-2">
                  {/* Tanggal */}
                  <div className="relative w-20">
                    <input 
                        type="number" 
                        placeholder="Tgl" 
                        min="1" max="31"
                        value={dobDay} 
                        onChange={handleDayChange}
                        className="w-full border border-slate-300 rounded p-2 text-center outline-none focus:ring-1 focus:ring-blue-500" 
                    />
                  </div>
                  {/* Bulan */}
                  <div className="relative flex-1">
                    <select 
                        value={dobMonth} 
                        onChange={handleMonthChange}
                        className="w-full border border-slate-300 rounded p-2 outline-none bg-white focus:ring-1 focus:ring-blue-500"
                    >
                        <option value="">- Bulan -</option>
                        {MONTH_NAMES.map((m, idx) => (
                            <option key={m} value={idx + 1}>{m}</option>
                        ))}
                    </select>
                  </div>
                  {/* Tahun */}
                  <div className="relative w-24">
                    <input 
                        type="number" 
                        placeholder="Tahun" 
                        min="1900" max="2100"
                        value={dobYear} 
                        onChange={handleYearChange}
                        className="w-full border border-slate-300 rounded p-2 text-center outline-none focus:ring-1 focus:ring-blue-500" 
                    />
                  </div>
                  {/* Umur Shortcut */}
                   <div className="relative w-20">
                    <div className="absolute -top-5 right-0 text-[10px] text-slate-400">Umur</div>
                    <input 
                        type="number" 
                        placeholder="Usia" 
                        value={age} 
                        onChange={handleAgeChange}
                        className="w-full border border-blue-200 bg-blue-50 rounded p-2 text-center outline-none text-blue-700 font-bold" 
                    />
                  </div>
              </div>
            </div>
            {/* ------------------------------------------------ */}

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
            
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase text-blue-600">Mutasi Kantor Bayar (Tujuan)</label>
              <input name="mutationOffice" value={formData.mutationOffice} onChange={handleInputChange} className="w-full border border-blue-200 bg-blue-50 rounded p-2 outline-none" placeholder="Isi jika sedang mutasi..." />
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
          
          {/* MARKETING INPUT ADDED HERE */}
          <div className="mb-4">
             <label className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1 mb-1">
                <UserCircle size={14} className="text-blue-600"/> Nama Marketing (AO)
             </label>
             <input 
                type="text" 
                name="marketingName"
                value={formData.marketingName} 
                onChange={handleInputChange} 
                className="w-full md:w-1/2 border border-blue-300 rounded p-2 outline-none bg-white font-medium placeholder:text-slate-300"
                placeholder="Masukkan nama marketing..."
             />
          </div>

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
                
                {/* INTEREST INPUT & EQUIVALENT FLAT */}
                <div className="flex gap-4">
                  <div className="space-y-1 w-1/2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Tenor (Bln)</label>
                    <input type="number" min="1" required name="tenureMonths" value={formData.tenureMonths || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 outline-none" />
                  </div>
                  <div className="space-y-1 w-1/2">
                    <label className="text-xs font-semibold text-slate-500 uppercase">
                        {formData.interestType === InterestType.ANNUITY ? 'Bunga % (Thn)' : 'Bunga % (Bln)'}
                    </label>
                    <input type="number" step="0.01" required name="interestRate" value={formData.interestRate || ''} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 outline-none" />
                    
                    {/* Equivalent Flat Display */}
                    {formData.interestType === InterestType.ANNUITY && formData.loanAmount > 0 && (
                        <div className="text-[10px] text-orange-600 font-bold mt-1 flex items-center gap-1 bg-orange-50 px-1 py-0.5 rounded">
                           <Info size={10} /> Setara Flat: {equivalentFlatRate}% / bln
                        </div>
                    )}
                  </div>
                </div>
                
                <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-500 uppercase">Tipe Bunga</label>
                     <select name="interestType" value={formData.interestType} onChange={handleInputChange} className="w-full border border-slate-300 rounded p-2 outline-none bg-white text-xs">
                        <option value={InterestType.ANNUITY}>Anuitas (Bunga Menurun)</option>
                        <option value={InterestType.FLAT}>Flat (Bunga Tetap)</option>
                    </select>
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
                  <label className="text-xs font-semibold text-slate-500 uppercase text-red-600">Blokir Angsuran</label>
                   <div className="flex gap-2">
                       <div className="relative w-20">
                           <input type="number" min="0" name="blockedInstallmentCount" value={formData.blockedInstallmentCount || ''} onChange={handleInputChange} className="w-full border border-red-200 bg-red-50 rounded p-2 outline-none text-sm text-center" />
                           <span className="absolute right-2 top-2 text-xs text-slate-400">x</span>
                       </div>
                       <div className="flex-1 bg-red-50 border border-red-100 rounded p-2 flex items-center justify-end">
                           <span className="text-xs font-bold text-red-700">Rp {formatIDR(blockedInstallmentNominal)}</span>
                       </div>
                   </div>
                   <div className="text-[10px] text-slate-400 mt-1 italic text-right">*Mengikuti Angsuran Total</div>
                </div>
             </div>
          </div>
          
          {/* Biaya & Simpanan */}
          <div className="mt-6 pt-4 border-t border-blue-200">
             <h4 className="text-xs font-bold text-slate-700 uppercase mb-3">Rincian Potongan</h4>
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-1"><label className="text-[10px] uppercase text-slate-500">Admin</label><input readOnly value={formatIDR(formData.adminFee)} className="w-full text-xs p-2 bg-slate-100 rounded" /></div>
                <div className="space-y-1"><label className="text-[10px] uppercase text-slate-500">Provisi</label><input readOnly value={formatIDR(formData.provisionFee)} className="w-full text-xs p-2 bg-slate-100 rounded" /></div>
                
                {/* Marketing Fee READONLY */}
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-500">Marketing (5%)</label>
                    <input readOnly value={formatIDR(formData.marketingFee)} className="w-full text-xs p-2 bg-slate-100 text-slate-500 rounded" />
                </div>
                
                <div className="space-y-1"><label className="text-[10px] uppercase text-slate-500">CR (11%)</label><input type="number" name="riskReserve" value={formData.riskReserve || ''} onChange={handleInputChange} className="w-full text-xs p-2 border border-slate-300 rounded" /></div>
                
                {/* NEW FLAGGING COLUMN */}
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-500 font-bold text-blue-600">Flagging</label>
                    <input type="number" name="flaggingFee" value={formData.flaggingFee || ''} onChange={handleInputChange} className="w-full text-xs p-2 border border-blue-300 rounded bg-blue-50" placeholder="0" />
                </div>

                <div className="space-y-1"><label className="text-[10px] uppercase text-slate-500">Simp. Pokok</label><input type="number" name="principalSavings" value={formData.principalSavings || ''} onChange={handleInputChange} className="w-full text-xs p-2 border border-slate-300 rounded" /></div>
                
                 {/* Simpanan Wajib READONLY */}
                <div className="space-y-1">
                    <label className="text-[10px] uppercase text-slate-500">Simp. Wajib</label>
                    <input readOnly value={formatIDR(formData.mandatorySavings)} className="w-full text-xs p-2 bg-slate-100 text-slate-500 rounded" />
                </div>

                <div className="space-y-1">
                   <label className="text-[10px] uppercase text-red-600">Pelunasan</label>
                   <input type="number" name="repaymentAmount" value={formData.repaymentAmount || ''} onChange={handleInputChange} className="w-full text-xs p-2 border border-red-300 rounded bg-red-50" />
                </div>
             </div>
          </div>

          <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-5 flex justify-between items-center">
             <div><h4 className="text-sm font-bold text-green-800">Terima Bersih (Net)</h4><p className="text-xs text-green-600">Plafon - Biaya (Admin,Provisi,Mkt,CR,Flagging) - Simpanan - Pelunasan - Blokir</p></div>
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
              <DocumentSlot category="SK" label="SK Pensiun (Max 5)" multiple={true} maxCount={5} />
              <DocumentSlot category="KARIP" label="Karip / Buku Pensiun" />

              {/* Added Documents */}
              <DocumentSlot category="EPOT" label="e-Pot / Potongan" />
              <DocumentSlot category="DAPEM" label="Dapem / Gaji Berkala" />
              <DocumentSlot category="SLIK" label="SLIK OJK (Max 5)" multiple={true} maxCount={5} />
              <DocumentSlot category="ASABRI" label="Dokumen Asabri (Max 5)" multiple={true} maxCount={5} />

              {/* NEW Documents Slots */}
              <DocumentSlot category="NPWP" label="NPWP" />
              <DocumentSlot category="SLIP_GAJI" label="Slip Gaji Terakhir" />
              <DocumentSlot category="REK_KORAN" label="Rekening Koran (Max 5)" multiple={true} maxCount={5} />
              
              {/* Media & Others */}
              <DocumentSlot category="VIDEO" label="Video Survey/Wawancara" acceptedTypes="video/*" />
              <DocumentSlot category="AUDIO" label="Rekaman Suara" acceptedTypes="audio/*" />
              <DocumentSlot category="OTHER" label="Dokumen Tambahan" multiple={true} maxCount={7} />
           </div>
           
           {/* Additional Uploads Code... (omitted for brevity as it's just repeating UI) */}
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
