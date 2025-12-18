
export enum Gender {
  MALE = 'Laki-laki',
  FEMALE = 'Perempuan'
}

export enum MaritalStatus {
  MARRIED = 'Menikah',
  SINGLE = 'Belum Menikah',
  DIVORCED_DEATH = 'Cerai Mati',
  WIDOW = 'Janda',
  WIDOWER = 'Duda'
}

export enum PensionType {
  TASPEN = 'Taspen',
  ASABRI = 'Asabri'
}

export enum LoanType {
  NEW = 'Baru',
  TOPUP = 'Top Up',
  TAKEOVER = 'Take Over'
}

export enum InterestType {
  ANNUITY = 'Anuitas (Tahunan)',
  FLAT = 'Flat (Bulanan)'
}

export enum RepaymentType {
  TOPUP = 'Top Up',
  TAKEOVER = 'Take Over (TO)',
  PKA = 'PKA',
  OTHERS = 'Lainnya'
}

// New Enum for Status
export enum CustomerStatus {
  ACTIVE = 'Aktif',
  PKA = 'PKA (Pelunasan Dipercepat)',
  TOPUP_LUNAS = 'Lunas (Top Up)',
  LUNAS = 'Lunas Murni',
  CANCELLED = 'Batal',
  DECEASED = 'Meninggal Dunia'
}

export interface PersonalInfo {
  fullName: string;
  nik: string;
  birthDate: string;
  gender: Gender;
  maritalStatus: MaritalStatus;
  address: string;
  phoneNumber: string;
}

export interface PensionData {
  pensionNumber: string; // NOPEN
  formerInstitution: string; // Kantor Bayar / Instansi Lama
  mutationOffice?: string; // Kantor Bayar Mutasi (Tujuan)
  pensionType: PensionType;
  skNumber: string;
  skIssuanceDate: string; // Tgl Keluar SK
  skReceivedDate?: string; // Tgl Masuk Dokumen (SK Asli diterima)
  skDescription: string; // Keterangan SK / Lokasi
  salaryAmount: number; // Gaji Pensiun (Untuk hitung DBR)
}

export interface NominativeData {
  loanType: LoanType; // Baru/Topup/TO
  loanDate: string; // Tanggal Pinjaman (Akad/Pengajuan)
  spkCode: string; // SPK
  loanAmount: number; // Plafon
  
  interestType: InterestType; // Jenis Bunga
  interestRate: number; // Nilai Bunga (Bisa Tahunan atau Bulanan tergantung tipe)
  
  tenureMonths: number; // Jangka waktu bulan
  monthlyInstallment: number; // Angsuran per bulan
  disbursementDate: string; // Tanggal Cair
  maturityDate: string; // Kapan Lunas / Tanggal Pelunasan (Jadwal)
  repaymentNotes: string; // Catatan Pelunasan
  
  // Fees & Savings
  adminFee: number; // Admin Kantor
  provisionFee: number; // Admin Provisi
  marketingFee: number; // Fee Marketing
  riskReserve: number; // Cadangan Resiko
  flaggingFee: number; // Biaya Flagging
  principalSavings: number; // Simpanan Pokok
  mandatorySavings: number; // Simpanan Wajib
  
  repaymentType: RepaymentType; // Jenis Pelunasan
  repaymentAmount: number; // Pelunasan Pinjaman Lama (Untuk Topup/Takeover)

  // Blocking
  blockedAmountSK: number; // Blokir Dana SK
  blockedInstallmentCount: number; // Blokir Angsuran (bulan)
}

export type DocumentCategory = 
  | 'KTP' | 'KK' | 'SK' | 'KARIP' | 'EPOT' | 'DAPEM' | 'SLIK' | 'ASABRI' | 'NPWP' 
  | 'SLIP_GAJI' | 'REK_KORAN' | 'OTHER' | 'AUDIO' | 'VIDEO' | 'BUKTI_LUNAS' 
  | 'SURAT_KEMATIAN' | 'SURAT_PENARIKAN_BLOKIR'
  | 'SPK' | 'APLIKASI_KREDIT' | 'PERNYATAAN_DEBITUR' | 'SKKT' 
  | 'PERMOHONAN_ANGGOTA' | 'PERNYATAAN_MUTASI' | 'SURAT_KUASA' 
  | 'BUKU_ANGGOTA' | 'PERNYATAAN_BATAL' | 'TANDA_TERIMA_SK' 
  | 'NOTA_KREDIT' | 'KWITANSI' | 'KUASA_PENCAIRAN'
  | 'TANDA_PENYERAHAN' | 'SK_ASLI'
  | 'FOTO_NASABAH' | 'FOTO_NASABAH_MARKETING';

export interface CustomerDocument {
  id: string;
  name: string;
  type: 'image' | 'pdf' | 'audio' | 'video' | 'other';
  category: DocumentCategory;
  url: string; // Blob URL or Remote URL
}

export interface Customer {
  id: string;
  personal: PersonalInfo;
  pension: PensionData;
  nominative: NominativeData;
  documents: CustomerDocument[]; // List of uploaded file objects
  
  // New Field for Dashboard Grouping
  marketingName?: string; 

  // Status Tracking
  status: CustomerStatus;
  resolutionDate?: string; // Tanggal PKA/Meninggal/Batal
  resolutionNotes?: string; // Catatan tambahan
  resolutionAmount?: number; // Nominal pelunasan (utk PKA)
  
  createdAt: string;
}

export interface DashboardStats {
  totalCustomers: number;
  totalLoanPortfolio: number;
  averageLoanSize: number;
}

// Interface for the new Marketing Table Layer
export interface MarketingTarget {
  id: string;
  name: string;
  branch: string;
  noa: number; // Number of Accounts
  week1: number;
  week2: number;
  week3: number;
  week4: number;
  week5: number;
  targetAmount: number;
  period: string; // e.g., "Desember 2025"
  dailyRealization?: Record<string, number>; // key: "1" to "31"
}
