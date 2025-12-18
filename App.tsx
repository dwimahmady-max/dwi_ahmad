
import React, { useState, useEffect, useRef } from 'react';
import { Customer, LoanType, MaritalStatus, InterestType, RepaymentType, CustomerStatus, MarketingTarget } from './types';
import { CustomerForm } from './components/CustomerForm';
import { CustomerList } from './components/CustomerList';
import { DocumentArchive } from './components/DocumentArchive';
import { ArchiveForm } from './components/ArchiveForm';
import { Dashboard } from './components/Dashboard';
import { MarketingTargetList } from './components/MarketingTargetList';
import { RepaymentModal } from './components/RepaymentModal';
import { SettledCustomerList } from './components/SettledCustomerList';
import { LayoutDashboard, Users, PlusCircle, Landmark, FolderArchive, FolderInput, BarChart3, Cloud, Download, Upload, Database, AlertTriangle, History } from 'lucide-react';

const App = () => {
  // Initialize State from LocalStorage
  const [customers, setCustomers] = useState<Customer[]>(() => {
    try {
      const savedData = localStorage.getItem('koperasi_customers_db');
      if (savedData !== null) {
        return JSON.parse(savedData);
      }
    } catch (error) {
      console.error("Gagal memuat data dari penyimpanan:", error);
      return []; 
    }
    return [];
  });

  // State for Marketing Targets
  const [marketingTargets, setMarketingTargets] = useState<MarketingTarget[]>(() => {
    try {
        const saved = localStorage.getItem('koperasi_marketing_targets');
        return saved ? JSON.parse(saved) : [];
    } catch(e) { return []; }
  });

  // Persist Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'files' | 'input' | 'archiveInput' | 'marketingTargets' | 'settled'>(() => {
    return (localStorage.getItem('koperasi_ui_tab') as any) || 'dashboard';
  });

  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [editingArchive, setEditingArchive] = useState<Customer | null>(null);
  const [statusUpdateCustomer, setStatusUpdateCustomer] = useState<Customer | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect: Save DB
  useEffect(() => {
    localStorage.setItem('koperasi_customers_db', JSON.stringify(customers));
  }, [customers]);

  // Effect: Save Marketing Targets
  useEffect(() => {
    localStorage.setItem('koperasi_marketing_targets', JSON.stringify(marketingTargets));
  }, [marketingTargets]);

  useEffect(() => {
    localStorage.setItem('koperasi_ui_tab', activeTab);
  }, [activeTab]);

  const handleSaveCustomer = (customerData: Customer) => {
    setCustomers(prev => {
        const exists = prev.some(c => c.id === customerData.id);
        if (exists) return prev.map(c => c.id === customerData.id ? customerData : c);
        return [customerData, ...prev];
    });
    setEditingCustomer(null);
    setActiveTab('list');
  };
  
  const handleSaveArchive = (customerData: Customer) => {
    setCustomers(prev => {
        const exists = prev.some(c => c.id === customerData.id);
        if (exists) {
            return prev.map(c => c.id === customerData.id ? customerData : c);
        } else {
            return [customerData, ...prev];
        }
    });
    setEditingArchive(null);
    setActiveTab('files');
  };

  const handleUpdateStatus = (updatedCustomer: Customer) => {
      setCustomers(prev => prev.map(c => c.id === updatedCustomer.id ? updatedCustomer : c));
      setStatusUpdateCustomer(null);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setActiveTab('input');
  };

  const handleTopUpCustomer = (customer: Customer) => {
    const today = new Date();
    const loanDate = new Date(customer.nominative.loanDate);
    let monthsPassed = (today.getFullYear() - loanDate.getFullYear()) * 12 + (today.getMonth() - loanDate.getMonth());
    if (today.getDate() < loanDate.getDate()) monthsPassed--;
    monthsPassed = Math.max(0, monthsPassed);
    const remainingMonths = Math.max(0, customer.nominative.tenureMonths - monthsPassed);
    const estimatedPayoffAmount = remainingMonths * customer.nominative.monthlyInstallment;

    const topUpData: Customer = {
        ...customer,
        status: CustomerStatus.ACTIVE,
        nominative: {
            ...customer.nominative,
            loanType: LoanType.TOPUP,
            loanDate: today.toISOString().split('T')[0],
            disbursementDate: today.toISOString().split('T')[0],
            spkCode: '',
            repaymentType: RepaymentType.TOPUP,
            repaymentAmount: estimatedPayoffAmount, 
            loanAmount: 0,
            maturityDate: ''
        }
    };
    setEditingCustomer(topUpData);
    setActiveTab('input');
  };

  const handleEditArchive = (customer: Customer) => {
    setEditingArchive(customer);
    setActiveTab('archiveInput');
  };

  const handleAddNewArchive = () => {
    setEditingArchive(null);
    setActiveTab('archiveInput');
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const handleSaveTarget = (target: MarketingTarget) => {
      setMarketingTargets(prev => {
          const exists = prev.some(t => t.id === target.id);
          if (exists) return prev.map(t => t.id === target.id ? target : t);
          return [...prev, target];
      });
  };

  const handleDeleteTarget = (id: string) => {
      setMarketingTargets(prev => prev.filter(t => t.id !== id));
  };

  // BACKUP & RESTORE
  const handleExportData = () => {
      const backupData = { customers, marketingTargets };
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_koperasi_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          try {
              const json = JSON.parse(event.target?.result as string);
              if (json.customers) setCustomers(json.customers);
              if (json.marketingTargets) setMarketingTargets(json.marketingTargets);
              alert("Data berhasil dipulihkan!");
              setActiveTab('list');
          } catch (err) { alert("File tidak valid."); }
      };
      reader.readAsText(file);
  };

  const NavItem = ({ tab, label, icon: Icon, subItem = false }: any) => (
    <button
      onClick={() => { setActiveTab(tab); if(tab!=='input')setEditingCustomer(null); if(tab!=='archiveInput')setEditingArchive(null); }}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl w-full transition-all duration-300 ${
        activeTab === tab 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 font-bold' 
          : 'text-slate-500 hover:bg-blue-50 hover:text-blue-600'
      } ${subItem ? 'pl-8 text-xs' : 'text-sm'}`}
    >
      <Icon size={subItem ? 16 : 20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex bg-[#FFFBEB]">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-10 shadow-sm">
        <div className="p-8 flex items-center gap-3">
          <div className="p-2.5 bg-blue-600 rounded-2xl text-white shadow-lg shadow-blue-100">
            <Landmark size={24} />
          </div>
          <div>
            <h1 className="font-black text-slate-800 leading-tight text-lg tracking-tighter italic">KJAM<br/><span className="text-[10px] not-italic font-bold text-slate-400 uppercase tracking-[0.2em]">Mandiri</span></h1>
          </div>
        </div>
        
        <nav className="px-4 space-y-2 flex-1 overflow-y-auto">
          <div className="mb-6">
              <p className="px-4 text-[10px] font-black text-slate-300 uppercase mb-3 tracking-widest">Analytics</p>
              <NavItem tab="dashboard" label="Dashboard" icon={LayoutDashboard} />
          </div>

          <div className="mb-6">
              <p className="px-4 text-[10px] font-black text-slate-300 uppercase mb-3 tracking-widest">Nasabah</p>
              <NavItem tab="list" label="Database" icon={Users} />
              <NavItem tab="settled" label="Nasabah Lunas" icon={History} />
              <NavItem tab="input" label={editingCustomer ? "Edit Nasabah" : "Input Baru"} icon={PlusCircle} subItem />
          </div>

          <div className="mb-6">
              <p className="px-4 text-[10px] font-black text-slate-300 uppercase mb-3 tracking-widest">Arsip Fisik</p>
              <NavItem tab="files" label="Daftar SK" icon={FolderArchive} />
              <NavItem tab="archiveInput" label={editingArchive ? "Update Arsip" : "Input Arsip"} icon={FolderInput} subItem />
          </div>

          <div className="mb-6">
              <p className="px-4 text-[10px] font-black text-slate-300 uppercase mb-3 tracking-widest">Marketing</p>
              <NavItem tab="marketingTargets" label="Monitoring Target" icon={BarChart3} />
          </div>
        </nav>

        <div className="p-6 border-t border-slate-100">
            <div className="space-y-2">
                <button onClick={handleExportData} className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition"><Download size={14} /> Backup DB</button>
                <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center justify-between px-4 py-2 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition"><Upload size={14} /> Restore DB</button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".json" className="hidden" />
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-8">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && <Dashboard customers={customers} />}
          {activeTab === 'list' && (
            <CustomerList 
              customers={customers.filter(c => c.status === CustomerStatus.ACTIVE || !c.status)} 
              onEdit={handleEditCustomer}
              onDelete={handleDeleteCustomer}
              onTopUp={handleTopUpCustomer}
              onUpdateStatus={setStatusUpdateCustomer}
            />
          )}
          {activeTab === 'settled' && (
             <SettledCustomerList 
                customers={customers} 
                onUpdateStatus={handleUpdateStatus}
                onViewProfile={handleEditCustomer} 
                onDelete={handleDeleteCustomer}
             />
          )}
          {activeTab === 'files' && (
            <DocumentArchive 
              customers={customers} 
              onEdit={handleEditArchive}
              onAddNew={handleAddNewArchive}
              onViewProfile={handleEditCustomer} 
              onDelete={handleDeleteCustomer} 
            />
          )}
          {activeTab === 'input' && (
            <CustomerForm 
              initialData={editingCustomer}
              onSave={handleSaveCustomer} 
              onCancel={() => {setEditingCustomer(null); setActiveTab('list');}} 
            />
          )}
          {activeTab === 'archiveInput' && (
             <ArchiveForm 
                customers={customers}
                initialData={editingArchive}
                onSave={handleSaveArchive}
                onCancel={() => {setEditingArchive(null); setActiveTab('files');}}
             />
          )}
          {activeTab === 'marketingTargets' && (
             <MarketingTargetList 
                targets={marketingTargets}
                onSave={handleSaveTarget}
                onDelete={handleDeleteTarget}
             />
          )}
        </div>
      </main>

      {statusUpdateCustomer && (
        <RepaymentModal 
          customer={statusUpdateCustomer}
          onSave={handleUpdateStatus}
          onClose={() => setStatusUpdateCustomer(null)}
        />
      )}
    </div>
  );
};

export default App;
