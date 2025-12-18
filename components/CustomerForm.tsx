
import React, { useState, useEffect, useRef } from 'react';
import { Customer, Gender, PensionType, LoanType, MaritalStatus, InterestType, RepaymentType, CustomerDocument, DocumentCategory, CustomerStatus } from '../types';
import { parseCustomerData } from '../services/geminiService';
import { Save, Sparkles, Loader2, Calculator, UploadCloud, FileText, FileImage, X, Wallet, Trash2, CheckCircle2, UserCircle, Info, AlertCircle } from 'lucide-react';

interface CustomerFormProps {
  initialData?: Customer | null;
  onSave: (customer: Customer) => void;
  onCancel: () => void;
  onDelete?: (id: string) => void;
}

const DEFAULT_FORM_DATA = {
    fullName: '',
    nik: '',
    birthDate: '',
    gender: Gender.MALE,
    maritalStatus: MaritalStatus.MARRIED,
    address: '',
    phoneNumber: '',
    pensionNumber: '',
    formerInstitution: '',
    mutationOffice: '', 
    pensionType: PensionType.TASPEN,
    skNumber: '',
    skIssuanceDate: '',
    skDescription: '',
    salaryAmount: 0, 
    loanType: LoanType.NEW,
    loanDate: new Date().toISOString().split('T')[0],
    spkCode: '',
    loanAmount: 0,
    interestType: InterestType.ANNUITY, 
    interestRate: 38, 
    tenureMonths: 24,
    monthlyInstallment: 0,
    disbursementDate: new Date().toISOString().split('T')[0],
    maturityDate: '',
    repaymentNotes: '',
    adminFee: 0, 
    provisionFee: 0, 
    marketingFee: 0, 
    riskReserve: 0, 
    flaggingFee: 0, 
    principalSavings: 100000, 
    mandatorySavings: 20000,  
    repaymentType: RepaymentType.TOPUP,
    repaymentAmount: 0, 
    blockedAmountSK: 0,
    blockedInstallmentCount: 1,
    marketingName: ''
};

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];

export const CustomerForm: React.FC<CustomerFormProps> = ({ initialData, onSave, onCancel, onDelete }) => {
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);
  const [uploadedFiles, setUploadedFiles] = useState<CustomerDocument[]>([]);
  const [dobDay, setDobDay] = useState('');
  const [dobMonth, setDobMonth] = useState('');
  const [dobYear, setDobYear] = useState('');
  const [age, setAge] = useState('');
  const prevPlafon = useRef<number>(0);

  useEffect(() => {
    if (initialData) {
      const baseData = {
        ...DEFAULT_FORM_DATA,
        ...initialData.personal,
        ...initialData.pension,
        ...initialData.nominative,
        marketingName: initialData.marketingName || ''
      };
      setFormData(baseData);
      setUploadedFiles(initialData.documents || []);
      
      if (baseData.birthDate) {
          const [y, m, d] = baseData.birthDate.split('-');
          setDobYear(y); setDobMonth(parseInt(m).toString()); setDobDay(parseInt(d).toString());
          setAge((new Date().getFullYear() - parseInt(y)).toString());
      }
    }
  }, [initialData]);

  // Perhitungan Biaya Otomatis (Hanya jika plafon berubah signifikan)
  useEffect(() => {
    const plafon = formData.loanAmount || 0;
    if (plafon !== prevPlafon.current && plafon > 0) {
        setFormData(prev => ({
          ...prev,
          adminFee: Math.round(plafon * 0.075),
          provisionFee: Math.round(plafon * 0.025),
          marketingFee: Math.round(plafon * 0.05),
          riskReserve: Math.round(plafon * 0.11),
        }));
        prevPlafon.current = plafon;
    }
  }, [formData.loanAmount]);

  // Perhitungan Angsuran
  useEffect(() => {
    if (formData.loanAmount > 0 && formData.tenureMonths > 0) {
      const principal = formData.loanAmount;
      const months = formData.tenureMonths;
      let calculatedInstallment = 0;
      const monthlyInterestRate = (formData.interestRate / 100) / 12;

      if (formData.interestType === InterestType.ANNUITY) {
        calculatedInstallment = principal * (monthlyInterestRate / (1 - Math.pow(1 + monthlyInterestRate, -months)));
      } else {
        calculatedInstallment = (principal / months) + (principal * (formData.interestRate / 100 / 12));
      }

      const disburseDate = new Date(formData.disbursementDate);
      const matureDate = new Date(disburseDate);
      matureDate.setMonth(matureDate.getMonth() + formData.tenureMonths);
      
      setFormData(prev => ({ 
        ...prev, 
        monthlyInstallment: Math.round(calculatedInstallment), 
        maturityDate: matureDate.toISOString().split('T')[0] 
      }));
    }
  }, [formData.loanAmount, formData.interestRate, formData.interestType, formData.tenureMonths, formData.disbursementDate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseFloat(value) || 0 : value }));
  };

  const totalMonthlyInstallment = (formData.monthlyInstallment || 0) + (formData.mandatorySavings || 0);
  const totalPotonganAwal = (formData.riskReserve || 0) + (formData.adminFee || 0) + (formData.provisionFee || 0) + (formData.principalSavings || 0);
  const totalAngsuranDimuka = (formData.blockedInstallmentCount || 0) * totalMonthlyInstallment;
  const totalAlokasiLain = (formData.blockedAmountSK || 0) + (formData.flaggingFee || 0) + (formData.repaymentAmount || 0);
  const netReceived = (formData.loanAmount || 0) - totalPotonganAwal - totalAngsuranDimuka - totalAlokasiLain - (formData.marketingFee || 0);

  const formatIDR = (val: number) => new Intl.NumberFormat('id-ID').format(val);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      id: initialData ? initialData.id : crypto.randomUUID(),
      personal: { ...formData, gender: formData.gender as Gender, maritalStatus: formData.maritalStatus as MaritalStatus },
      pension: { ...formData, pensionType: formData.pensionType as PensionType },
      nominative: { ...formData, loanType: formData.loanType as LoanType, interestType: formData.interestType as InterestType, repaymentType: formData.repaymentType as RepaymentType },
      documents: uploadedFiles,
      status: initialData ? initialData.status : CustomerStatus.ACTIVE,
      marketingName: formData.marketingName,
      createdAt: initialData ? initialData.createdAt : new Date().toISOString()
    });
  };

  const updateBirthDate = (d: string, m: string, y: string) => {
    if (y.length === 4 && m && d) setFormData(prev => ({ ...prev, birthDate: `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}` }));
  };

  return (
    <div className="max-w-5xl mx-auto bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden animate-slide-in-up">
      <div className="bg-slate-50 border-b border-slate-200 p-6 flex justify-between items-center sticky top-0 z-10">
        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <Calculator className="text-blue-600" />
            {initialData ? 'Edit Data Nasabah' : 'Input Data Nasabah Baru'}
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h3 className="text-xs font-black text-blue-600 uppercase border-b pb-2 tracking-widest">I. Data Pribadi</h3>
                <div className="space-y-3">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Nama Lengkap</label><input required name="fullName" value={formData.fullName} onChange={handleInputChange} className="w-full border p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">NIK</label><input required name="nik" value={formData.nik} onChange={handleInputChange} className="w-full border p-2 rounded" /></div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase">Tgl Lahir & Usia</label>
                        <div className="flex gap-2">
                            <input type="number" placeholder="Tgl" value={dobDay} onChange={(e) => { setDobDay(e.target.value); updateBirthDate(e.target.value, dobMonth, dobYear); }} className="w-16 border p-2 rounded text-center" />
                            <select value={dobMonth} onChange={(e) => { setDobMonth(e.target.value); updateBirthDate(dobDay, e.target.value, dobYear); }} className="flex-1 border p-2 rounded bg-white">
                                <option value="">Bulan</option>
                                {MONTH_NAMES.map((m, idx) => <option key={m} value={idx+1}>{m}</option>)}
                            </select>
                            <input type="number" placeholder="Thn" value={dobYear} onChange={(e) => { setDobYear(e.target.value); updateBirthDate(dobDay, dobMonth, e.target.value); if(e.target.value.length === 4) setAge((new Date().getFullYear() - parseInt(e.target.value)).toString()); }} className="w-20 border p-2 rounded text-center" />
                            <input type="number" placeholder="Usia" value={age} className="w-16 border border-blue-200 bg-blue-50 p-2 rounded text-center text-blue-700 font-bold" readOnly />
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-xs font-black text-blue-600 uppercase border-b pb-2 tracking-widest">II. Data Pensiun</h3>
                <div className="space-y-3">
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">NOPEN</label><input required name="pensionNumber" value={formData.pensionNumber} onChange={handleInputChange} className="w-full border p-2 rounded font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Gaji Pensiun</label><input type="number" name="salaryAmount" value={formData.salaryAmount || ''} onChange={handleInputChange} className="w-full border border-green-200 bg-green-50 p-2 rounded font-bold" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Kantor Bayar</label><input name="formerInstitution" value={formData.formerInstitution} onChange={handleInputChange} className="w-full border p-2 rounded" /></div>
                    <div className="space-y-1"><label className="text-[10px] font-bold text-slate-400 uppercase">Marketing</label><input name="marketingName" value={formData.marketingName} onChange={handleInputChange} className="w-full border p-2 rounded" placeholder="Nama Marketing..." /></div>
                </div>
            </div>
        </div>

        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
            <h3 className="text-xs font-black text-slate-500 uppercase mb-4 tracking-widest flex items-center gap-2">
                <Calculator size={16} /> III. Nominatif & Struktur Kredit
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase">Plafon Pinjaman</label>
                        <div className="relative"><span className="absolute left-3 top-2.5 text-slate-400 text-sm">Rp</span><input type="number" name="loanAmount" value={formData.loanAmount || ''} onChange={handleInputChange} className="w-full border-2 border-blue-100 p-2.5 pl-10 rounded-xl font-black text-xl text-blue-700 focus:border-blue-500 outline-none shadow-sm" /></div>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-1"><label className="text-[10px] font-bold text-slate-400">TENOR (BLN)</label><input type="number" name="tenureMonths" value={formData.tenureMonths || ''} onChange={handleInputChange} className="w-full border p-2 rounded font-bold" /></div>
                        <div className="flex-1 space-y-1"><label className="text-[10px] font-bold text-slate-400">BUNGA %</label><input type="number" name="interestRate" value={formData.interestRate || ''} onChange={handleInputChange} className="w-full border p-2 rounded font-bold" /></div>
                    </div>
                </div>

                <div className="space-y-4 border-l border-slate-200 pl-6">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase">Angsuran Bulanan</label>
                        <div className="bg-blue-600 text-white p-3 rounded-xl font-black text-xl text-center shadow-lg shadow-blue-100">Rp {formatIDR(totalMonthlyInstallment)}</div>
                    </div>
                    <div className="text-[10px] text-slate-500 space-y-1 bg-white p-2 rounded border border-slate-100">
                        <div className="flex justify-between"><span>Angsuran Pokok+Bunga:</span><span className="font-bold">{formatIDR(formData.monthlyInstallment)}</span></div>
                        <div className="flex justify-between"><span>Simpanan Wajib:</span><span className="font-bold">{formatIDR(formData.mandatorySavings)}</span></div>
                    </div>
                </div>

                <div className="space-y-4 border-l border-slate-200 pl-6">
                    <label className="text-xs font-bold text-red-600 uppercase">Alokasi Plafond Lain</label>
                    <div className="space-y-2">
                        <div className="relative"><span className="absolute left-2 top-1.5 text-[10px] text-slate-400">Rp</span><input type="number" name="blockedAmountSK" placeholder="Blokir SK" value={formData.blockedAmountSK || ''} onChange={handleInputChange} className="w-full border border-red-100 bg-red-50/50 p-1.5 pl-7 rounded text-xs font-bold" /></div>
                        <div className="relative"><span className="absolute left-2 top-1.5 text-[10px] text-slate-400">Rp</span><input type="number" name="flaggingFee" placeholder="Flagging" value={formData.flaggingFee || ''} onChange={handleInputChange} className="w-full border border-red-100 bg-red-50/50 p-1.5 pl-7 rounded text-xs font-bold" /></div>
                        <div className="relative"><span className="absolute left-2 top-1.5 text-[10px] text-slate-400">Rp</span><input type="number" name="repaymentAmount" placeholder="Pelunasan" value={formData.repaymentAmount || ''} onChange={handleInputChange} className="w-full border border-red-100 bg-red-50/50 p-1.5 pl-7 rounded text-xs font-bold" /></div>
                    </div>
                </div>
            </div>

            <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-slate-200">
                <div className="space-y-1">
                    {/* Fix: Wrap AlertCircle icon in a span to use the title attribute for tooltips as Lucide components don't have a title prop */}
                    <label className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                      ASURANSI / CRK 
                      <span title="Bisa diedit manual">
                        <AlertCircle size={10} />
                      </span>
                    </label>
                    <input type="number" name="riskReserve" value={formData.riskReserve || ''} onChange={handleInputChange} className="w-full bg-white border border-blue-200 p-2 rounded text-xs font-black text-blue-700 focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">ADM KANTOR</label>
                    <input type="number" name="adminFee" value={formData.adminFee || ''} onChange={handleInputChange} className="w-full bg-white border border-blue-100 p-2 rounded text-xs font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">ADM PUSAT</label>
                    <input type="number" name="provisionFee" value={formData.provisionFee || ''} onChange={handleInputChange} className="w-full bg-white border border-blue-100 p-2 rounded text-xs font-bold focus:border-blue-500 outline-none" />
                </div>
                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-400">SIMP. POKOK</label>
                    <input type="number" name="principalSavings" value={formData.principalSavings || ''} onChange={handleInputChange} className="w-full bg-white border border-blue-200 p-2 rounded text-xs font-bold" />
                </div>
                
                <div className="col-span-2 p-3 bg-red-50 rounded-xl border border-red-100 flex items-center justify-between">
                    <div>
                        <label className="text-[10px] font-bold text-red-600 block">ANGSURAN DIBAYAR DIMUKA</label>
                        <span className="text-sm font-black text-red-700">Rp {formatIDR(totalAngsuranDimuka)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <input type="number" name="blockedInstallmentCount" value={formData.blockedInstallmentCount || ''} onChange={handleInputChange} className="w-10 border border-red-200 p-1 rounded text-center text-xs font-bold" />
                        <span className="text-[10px] font-bold text-slate-400">BLN</span>
                    </div>
                </div>

                <div className="col-span-2 p-3 bg-orange-50 rounded-xl border border-orange-100 flex items-center justify-between">
                    <div>
                        <label className="text-[10px] font-bold text-orange-600 uppercase block">Fee Marketing (5%)</label>
                        <div className="flex items-center gap-2">
                             <span className="text-slate-400 text-xs">Rp</span>
                             <input type="number" name="marketingFee" value={formData.marketingFee || ''} onChange={handleInputChange} className="bg-transparent border-none p-0 font-black text-orange-700 text-sm outline-none w-32" />
                        </div>
                    </div>
                    <div className="p-2 bg-orange-100 rounded-lg text-orange-600"><UserCircle size={20}/></div>
                </div>
            </div>

            <div className="mt-8 flex flex-col md:flex-row gap-4">
                <div className="flex-1 bg-green-600 p-4 rounded-2xl shadow-xl shadow-green-100 flex justify-between items-center text-white">
                    <div><p className="text-[10px] font-bold text-green-100 uppercase tracking-widest">Dana Bersih Diterima Anggota (Net)</p><p className="text-2xl font-black">Rp {formatIDR(netReceived)}</p></div>
                    <div className="p-2 bg-green-500 rounded-lg"><Wallet size={24} /></div>
                </div>
            </div>
        </div>

        <div className="flex justify-end gap-3 pt-6">
            <button type="button" onClick={onCancel} className="px-8 py-3 rounded-xl border border-slate-300 font-bold text-slate-600 hover:bg-slate-50 transition">Batal</button>
            <button type="submit" className="px-10 py-3 rounded-xl bg-blue-600 text-white font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition flex items-center gap-2"><Save size={20} /> Simpan Data Anggota</button>
        </div>
      </form>
    </div>
  );
};
