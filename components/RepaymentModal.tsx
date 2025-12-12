
import React, { useState } from 'react';
import { Customer, CustomerStatus } from '../types';
import { X, Save, AlertTriangle, Skull, FileX, CheckCircle2, Banknote, Calendar } from 'lucide-react';

interface RepaymentModalProps {
  customer: Customer;
  onSave: (updatedCustomer: Customer) => void;
  onClose: () => void;
}

export const RepaymentModal: React.FC<RepaymentModalProps> = ({ customer, onSave, onClose }) => {
  const [statusType, setStatusType] = useState<CustomerStatus>(CustomerStatus.PKA);
  const [resolutionDate, setResolutionDate] = useState(new Date().toISOString().split('T')[0]);
  const [resolutionAmount, setResolutionAmount] = useState<number>(0);
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Auto-fill amount logic based on status
  React.useEffect(() => {
    if (statusType === CustomerStatus.PKA) {
        // Simple logic: remaining principal roughly (not accurate actuarial calc)
        // Just a placeholder suggestion
        setResolutionAmount(customer.nominative.loanAmount * 0.5); 
    } else {
        setResolutionAmount(0);
    }
  }, [statusType, customer.nominative.loanAmount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedCustomer: Customer = {
      ...customer,
      status: statusType,
      resolutionDate,
      resolutionNotes,
      resolutionAmount: statusType === CustomerStatus.PKA ? resolutionAmount : 0
    };
    onSave(updatedCustomer);
  };

  const renderFormContent = () => {
    switch (statusType) {
      case CustomerStatus.PKA:
        return (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 text-sm text-green-800 flex gap-2">
              <Banknote size={20} />
              <div>
                <strong>Pelunasan Kredit Dipercepat (PKA)</strong>
                <p>Status nasabah akan berubah menjadi lunas. Pastikan dana pelunasan sudah diterima.</p>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-500">Tanggal Pelunasan</label>
              <input type="date" required value={resolutionDate} onChange={e => setResolutionDate(e.target.value)} className="w-full border p-2 rounded" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-500">Nominal Pelunasan (Rp)</label>
              <input type="number" required value={resolutionAmount} onChange={e => setResolutionAmount(Number(e.target.value))} className="w-full border p-2 rounded font-bold text-slate-800" />
            </div>
          </div>
        );
      case CustomerStatus.DECEASED:
        return (
           <div className="space-y-4 animate-in fade-in">
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 text-sm text-white flex gap-2">
              <Skull size={20} className="text-red-400" />
              <div>
                <strong>Nasabah Meninggal Dunia</strong>
                <p>Pinjaman akan dihentikan penagihan (Write-off) atau dialihkan ke asuransi/ahli waris.</p>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-500">Tanggal Meninggal</label>
              <input type="date" required value={resolutionDate} onChange={e => setResolutionDate(e.target.value)} className="w-full border p-2 rounded" />
            </div>
            <div className="space-y-1">
               <label className="text-xs font-semibold uppercase text-slate-500">Ahli Waris / Keterangan</label>
               <input type="text" placeholder="Nama Ahli Waris..." value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} className="w-full border p-2 rounded" />
            </div>
          </div>
        );
      case CustomerStatus.CANCELLED:
         return (
           <div className="space-y-4 animate-in fade-in">
            <div className="bg-red-50 p-4 rounded-lg border border-red-200 text-sm text-red-800 flex gap-2">
              <FileX size={20} />
              <div>
                <strong>Pembatalan Pinjaman</strong>
                <p>Data pinjaman akan ditandai batal. Pastikan uang pencairan sudah dikembalikan (jika sudah cair).</p>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-500">Tanggal Pembatalan</label>
              <input type="date" required value={resolutionDate} onChange={e => setResolutionDate(e.target.value)} className="w-full border p-2 rounded" />
            </div>
          </div>
        );
       case CustomerStatus.TOPUP_LUNAS:
         return (
           <div className="space-y-4 animate-in fade-in">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 text-sm text-blue-800 flex gap-2">
              <CheckCircle2 size={20} />
              <div>
                <strong>Pelunasan via Top Up</strong>
                <p>Pinjaman ini dianggap lunas karena diperbarui dengan pinjaman Top Up baru. Gunakan menu "Input Baru" untuk memasukkan data pinjaman barunya.</p>
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold uppercase text-slate-500">Tanggal Top Up</label>
              <input type="date" required value={resolutionDate} onChange={e => setResolutionDate(e.target.value)} className="w-full border p-2 rounded" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden">
        <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
          <h3 className="font-bold text-slate-800">Update Status Nasabah</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            <div>
               <label className="text-xs font-semibold uppercase text-slate-500 block mb-2">Pilih Jenis Proses</label>
               <div className="grid grid-cols-2 gap-2">
                  <button 
                    type="button"
                    onClick={() => setStatusType(CustomerStatus.PKA)}
                    className={`p-2 text-xs font-bold rounded border ${statusType === CustomerStatus.PKA ? 'bg-green-600 text-white border-green-600' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    PKA (Lunas Cepat)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setStatusType(CustomerStatus.TOPUP_LUNAS)}
                    className={`p-2 text-xs font-bold rounded border ${statusType === CustomerStatus.TOPUP_LUNAS ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    Lunas (Top Up)
                  </button>
                  <button 
                    type="button"
                    onClick={() => setStatusType(CustomerStatus.CANCELLED)}
                    className={`p-2 text-xs font-bold rounded border ${statusType === CustomerStatus.CANCELLED ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    Pembatalan
                  </button>
                  <button 
                    type="button"
                    onClick={() => setStatusType(CustomerStatus.DECEASED)}
                    className={`p-2 text-xs font-bold rounded border ${statusType === CustomerStatus.DECEASED ? 'bg-slate-800 text-white border-slate-800' : 'bg-white text-slate-600 hover:bg-slate-50'}`}
                  >
                    Meninggal Dunia
                  </button>
               </div>
            </div>

            {renderFormContent()}

            <div className="space-y-1">
                <label className="text-xs font-semibold uppercase text-slate-500">Catatan Tambahan</label>
                <textarea 
                    rows={2} 
                    value={resolutionNotes} 
                    onChange={e => setResolutionNotes(e.target.value)} 
                    className="w-full border p-2 rounded text-sm resize-none"
                    placeholder="Keterangan..."
                />
            </div>
          </div>

          <div className="p-4 border-t bg-slate-50 flex justify-end gap-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg">Batal</button>
            <button type="submit" className="px-4 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2">
                <Save size={16} /> Simpan Status
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
