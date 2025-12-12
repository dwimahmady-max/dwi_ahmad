
import React, { useState, useEffect } from 'react';
import { Customer, LoanType, MaritalStatus, InterestType, RepaymentType, CustomerStatus } from './types';
import { CustomerForm } from './components/CustomerForm';
import { CustomerList } from './components/CustomerList';
import { DocumentArchive } from './components/DocumentArchive';
import { ArchiveForm } from './components/ArchiveForm';
import { Dashboard } from './components/Dashboard';
import { RepaymentModal } from './components/RepaymentModal';
import { LayoutDashboard, Users, PlusCircle, Landmark, FolderArchive, FolderInput } from 'lucide-react';

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
      return []; // Return empty array on error to prevent zombie data
    }
    
    // Default Data Dummy (Only runs if localStorage is completely empty)
    const initialData = [{
      id: '1',
      personal: {
        fullName: 'H. Soedirman',
        nik: '3301123456780001',
        birthDate: '1955-08-17',
        gender: 'Laki-laki' as any,
        maritalStatus: MaritalStatus.MARRIED,
        address: 'Jl. Merdeka No. 45, Purwokerto',
        phoneNumber: '08123456789'
      },
      pension: {
        pensionNumber: '11002233',
        formerInstitution: 'Dinas Pendidikan',
        mutationOffice: '', 
        pensionType: 'Taspen' as any,
        skNumber: 'SK/2020/PENS/001',
        skIssuanceDate: '2020-01-15',
        skReceivedDate: '2023-09-20',
        skDescription: 'SK Asli di Bank Jateng',
        salaryAmount: 4500000
      },
      nominative: {
        loanType: LoanType.NEW,
        loanDate: '2023-09-25',
        spkCode: 'SPK-001',
        loanAmount: 50000000,
        interestType: InterestType.ANNUITY,
        interestRate: 35, 
        tenureMonths: 24,
        monthlyInstallment: 2900000, 
        disbursementDate: '2023-10-01',
        maturityDate: '2025-10-01',
        repaymentNotes: '',
        adminFee: 3750000, 
        provisionFee: 1250000, 
        marketingFee: 2500000, 
        riskReserve: 5500000, 
        flaggingFee: 50000, 
        principalSavings: 20000, 
        mandatorySavings: 100000, 
        repaymentType: RepaymentType.TOPUP,
        repaymentAmount: 0, 
        blockedAmountSK: 0,
        blockedInstallmentCount: 1
      },
      documents: [],
      status: CustomerStatus.ACTIVE,
      createdAt: new Date().toISOString()
    }];
    
    return initialData;
  });

  // Persist Active Tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'list' | 'files' | 'input' | 'archiveInput'>(() => {
    return (localStorage.getItem('koperasi_ui_tab') as any) || 'dashboard';
  });

  // Persist Editing Customer
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(() => {
    const editingId = localStorage.getItem('koperasi_ui_editing_id');
    if (editingId) {
      // Find in current state is safer than reading localStorage again
      try {
        const dbStr = localStorage.getItem('koperasi_customers_db');
        if (dbStr) {
          const db = JSON.parse(dbStr);
          return db.find((c: Customer) => c.id === editingId) || null;
        }
      } catch (e) { return null; }
    }
    return null;
  });

  // Persist Editing Archive
  const [editingArchive, setEditingArchive] = useState<Customer | null>(null);

  // New State for Repayment/Status Update
  const [statusUpdateCustomer, setStatusUpdateCustomer] = useState<Customer | null>(null);
  
  // Effect: Save DB to LocalStorage (Single Source of Truth)
  // This ensures that whatever is in 'customers' state is EXACTLY what is in localStorage.
  useEffect(() => {
    localStorage.setItem('koperasi_customers_db', JSON.stringify(customers));
  }, [customers]);

  // Effect: Listen for storage changes (for multiple tabs)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'koperasi_customers_db' && e.newValue) {
        setCustomers(JSON.parse(e.newValue));
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Effect: Save UI State (Tab)
  useEffect(() => {
    localStorage.setItem('koperasi_ui_tab', activeTab);
  }, [activeTab]);

  // Effect: Save UI State (Editing ID)
  useEffect(() => {
    if (editingCustomer) {
      localStorage.setItem('koperasi_ui_editing_id', editingCustomer.id);
    } else {
      localStorage.removeItem('koperasi_ui_editing_id');
    }
  }, [editingCustomer]);

  const handleSaveCustomer = (customerData: Customer) => {
    if (!customerData.status) customerData.status = CustomerStatus.ACTIVE;

    setCustomers(prevCustomers => {
        const exists = prevCustomers.some(c => c.id === customerData.id);
        if (exists) {
            return prevCustomers.map(c => c.id === customerData.id ? customerData : c);
        } else {
            return [customerData, ...prevCustomers];
        }
    });

    setEditingCustomer(null);
    setActiveTab('list');
  };
  
  const handleSaveArchive = (customerData: Customer) => {
    setCustomers(prevCustomers => {
        const exists = prevCustomers.some(c => c.id === customerData.id);
        if (exists) {
            return prevCustomers.map(c => c.id === customerData.id ? customerData : c);
        } else {
            return [customerData, ...prevCustomers];
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

  // LOGIKA TOP UP OTOMATIS
  const handleTopUpCustomer = (customer: Customer) => {
    const today = new Date();
    const loanDate = new Date(customer.nominative.loanDate);
    
    let monthsPassed = (today.getFullYear() - loanDate.getFullYear()) * 12 + (today.getMonth() - loanDate.getMonth());
    if (today.getDate() < loanDate.getDate()) {
        monthsPassed--;
    }
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
            adminFee: 0, provisionFee: 0, marketingFee: 0, riskReserve: 0, flaggingFee: 0,
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
    const isEditing = editingCustomer?.id === id;
    localStorage.removeItem(`koperasi_draft_${id}`);
    
    // Gunakan functional update untuk menjamin integritas data saat delete
    setCustomers(prevCustomers => prevCustomers.filter(c => c.id !== id));
    
    if (isEditing) {
      setEditingCustomer(null);
      localStorage.removeItem('koperasi_ui_editing_id');
      setActiveTab('list');
    }
  };

  const handleCancelForm = () => {
    setEditingCustomer(null);
    setActiveTab('list');
  };

  const handleCancelArchive = () => {
    setEditingArchive(null);
    setActiveTab('files');
  };

  const handleTabChange = (tab: any) => {
    setActiveTab(tab);
    if (tab !== 'input') setEditingCustomer(null);
    if (tab !== 'archiveInput') setEditingArchive(null);
  };

  const NavItem = ({ tab, label, icon: Icon, subItem = false }: any) => (
    <button
      onClick={() => handleTabChange(tab)}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg w-full transition-all duration-200 ${
        activeTab === tab 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-200 font-medium' 
          : 'text-slate-600 hover:bg-blue-50 hover:text-blue-600'
      } ${subItem ? 'pl-8 text-sm' : ''}`}
    >
      <Icon size={subItem ? 18 : 20} />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="min-h-screen flex bg-[#FFFBEB]">
      
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col fixed h-full z-10">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="p-2 bg-blue-600 rounded-lg text-white">
            <Landmark size={24} />
          </div>
          <div>
            <h1 className="font-bold text-slate-800 leading-tight">Koperasi<br/>Anugerah Mandiri</h1>
          </div>
        </div>
        
        <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
          <div className="mb-4">
              <p className="px-4 text-xs font-semibold text-slate-400 uppercase mb-2">Utama</p>
              <NavItem tab="dashboard" label="Dashboard" icon={LayoutDashboard} />
          </div>

          <div className="mb-4">
              <p className="px-4 text-xs font-semibold text-slate-400 uppercase mb-2">Nasabah & Kredit</p>
              <NavItem tab="list" label="Data Nasabah" icon={Users} />
              <NavItem tab="input" label={editingCustomer ? "Edit / Top Up" : "Input Baru"} icon={PlusCircle} subItem />
          </div>

          <div className="mb-4">
              <p className="px-4 text-xs font-semibold text-slate-400 uppercase mb-2">Arsip & Dokumen</p>
              <NavItem tab="files" label="Daftar Arsip" icon={FolderArchive} />
              <NavItem tab="archiveInput" label={editingArchive ? "Edit Arsip" : "Input Arsip"} icon={FolderInput} subItem />
          </div>
        </nav>

        <div className="p-6 border-t border-slate-100">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <p className="text-xs text-slate-500 font-medium mb-1">Status Sistem</p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-sm text-green-700 font-medium">Online & Saved</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 p-4 md:p-8 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-slate-200 mb-6">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <Landmark size={20} className="text-blue-600" />
            Koperasi Anugerah
          </div>
          <div className="flex gap-2">
            <button onClick={() => handleTabChange('dashboard')} className={`p-2 rounded ${activeTab === 'dashboard' ? 'bg-blue-100 text-blue-600' : 'text-slate-500'}`}><LayoutDashboard size={20}/></button>
            <button onClick={() => handleTabChange('list')} className={`p-2 rounded ${activeTab === 'list' ? 'bg-blue-100 text-blue-600' : 'text-slate-500'}`}><Users size={20}/></button>
            <button onClick={() => handleTabChange('files')} className={`p-2 rounded ${activeTab === 'files' ? 'bg-blue-100 text-blue-600' : 'text-slate-500'}`}><FolderArchive size={20}/></button>
          </div>
        </div>

        <div className="max-w-6xl mx-auto">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
               <div>
                <h1 className="text-2xl font-bold text-slate-800">Ringkasan Eksekutif</h1>
                <p className="text-slate-500">Statistik performa Koperasi hari ini</p>
              </div>
              <Dashboard customers={customers} />
            </div>
          )}

          {activeTab === 'list' && (
            <div className="space-y-6">
              <CustomerList 
                customers={customers} 
                onEdit={handleEditCustomer}
                onDelete={handleDeleteCustomer}
                onTopUp={handleTopUpCustomer}
                onUpdateStatus={setStatusUpdateCustomer} // Pass handler
              />
            </div>
          )}

          {activeTab === 'files' && (
            <div className="space-y-6">
              <DocumentArchive 
                customers={customers} 
                onEdit={handleEditArchive}
                onAddNew={handleAddNewArchive}
              />
            </div>
          )}

          {activeTab === 'input' && (
            <div className="space-y-6">
              <CustomerForm 
                initialData={editingCustomer}
                onSave={handleSaveCustomer} 
                onCancel={handleCancelForm} 
                onDelete={handleDeleteCustomer}
              />
            </div>
          )}

          {activeTab === 'archiveInput' && (
             <div className="space-y-6">
                <ArchiveForm 
                    customers={customers}
                    initialData={editingArchive}
                    onSave={handleSaveArchive}
                    onCancel={handleCancelArchive}
                />
             </div>
          )}
        </div>
      </main>

      {/* Repayment / Status Modal */}
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
