import React, { useState, useMemo } from 'react';
import { AppState } from '../services/storage';
import { Transaction, TransactionType, TransactionStatus } from '../types';
import {
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Smartphone,
  Wifi,
  Zap,
  Tv,
  GraduationCap,
  Plane,
  Building,
  Store,
  Code2,
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  ChevronRight,
  TrendingUp,
  ShieldCheck,
  Calendar,
  RotateCcw,
  Download,
  ChevronLeft,
  SlidersHorizontal,
  ScanFace,
  QrCode,
  Scan,
  Send,
  Share2,
  CalendarClock,
  SkipForward,
} from 'lucide-react';
import { QRCodePaymentModal } from '../components/QRCodePaymentModal';
import { BiometricTrustScoreWidget } from '../components/BiometricTrustScoreWidget';
import { TransactionCategorizerWidget } from '../components/TransactionCategorizerWidget';
import { confirmTransactionClassification } from '../services/aiCategorizerAgent';

interface HomeDashboardProps {
  state: AppState;
  updateState?: (newState: Partial<AppState>) => void;
  setActiveTab: (tab: string) => void;
  onOpenFundModal: () => void;
  onViewReceipt: (tx: Transaction) => void;
  language: 'en' | 'ha';
  onTriggerBiometricTest?: () => void;
}

export const HomeDashboard: React.FC<HomeDashboardProps> = ({
  state,
  updateState,
  setActiveTab,
  onOpenFundModal,
  onViewReceipt,
  language,
  onTriggerBiometricTest,
}) => {
  // QR Payment Modal States
  const [isQRPaymentModalOpen, setIsQRPaymentModalOpen] = useState<boolean>(false);
  const [qrModalMode, setQrModalMode] = useState<'scan' | 'generate'>('scan');

  const handleOpenQRScanner = () => {
    setQrModalMode('scan');
    setIsQRPaymentModalOpen(true);
  };

  const handleOpenQRGenerator = () => {
    setQrModalMode('generate');
    setIsQRPaymentModalOpen(true);
  };

  const handleQRTransferSuccess = (
    newTx: Transaction,
    newBalance: number,
    ledgerEntries: any[]
  ) => {
    if (updateState) {
      updateState({
        currentUser: {
          ...state.currentUser,
          walletBalance: newBalance,
        },
        transactions: [newTx, ...state.transactions],
        ledger: [...state.ledger, ...ledgerEntries],
      });
    }
  };

  const handleConfirmCategoryFromTable = (tx: Transaction) => {
    const cat = tx.suggestedCategory || 'Utility';
    const type = tx.suggestedType || 'electricity';
    const updated = confirmTransactionClassification(tx.id, cat, type, state.transactions);
    if (updateState) {
      updateState({ transactions: updated });
    }
  };

  // Advanced Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRangePreset, setDateRangePreset] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Filter application
  const filteredTransactions = useMemo(() => {
    return state.transactions.filter((tx) => {
      // 1. Text Search (reference, product name, recipient, amount, provider)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          tx.reference.toLowerCase().includes(query) ||
          tx.productName.toLowerCase().includes(query) ||
          tx.recipient.toLowerCase().includes(query) ||
          tx.provider.toLowerCase().includes(query) ||
          tx.amount.toString().includes(query) ||
          tx.totalDebited.toString().includes(query);
        if (!matchesQuery) return false;
      }

      // 2. Transaction Type Filter
      if (filterType !== 'all') {
        if (filterType === 'uncategorized') {
          if (!tx.isUncategorized && tx.type !== 'uncategorized' && tx.category !== 'Uncategorized') return false;
        } else if (filterType === 'vtu') {
          if (tx.type !== 'airtime' && tx.type !== 'data') return false;
        } else if (filterType === 'wallet') {
          if (
            tx.type !== 'wallet_funding' &&
            tx.type !== 'wallet_transfer' &&
            tx.type !== 'commission_payout'
          )
            return false;
        } else if (filterType === 'bills') {
          if (tx.type !== 'electricity' && tx.type !== 'cable_tv') return false;
        } else if (filterType === 'flight') {
          if (tx.type !== 'flight_booking') return false;
        } else if (filterType === 'education') {
          if (tx.type !== 'school_fees') return false;
        } else {
          if (tx.type !== filterType) return false;
        }
      }

      // 3. Status Filter
      if (filterStatus !== 'all') {
        if (tx.status !== filterStatus) return false;
      }

      // 4. Date Range Filter
      const txDate = new Date(tx.createdAt);

      if (dateRangePreset === 'today') {
        const today = new Date();
        if (
          txDate.getDate() !== today.getDate() ||
          txDate.getMonth() !== today.getMonth() ||
          txDate.getFullYear() !== today.getFullYear()
        ) {
          return false;
        }
      } else if (dateRangePreset === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (txDate < sevenDaysAgo) return false;
      } else if (dateRangePreset === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (txDate < thirtyDaysAgo) return false;
      } else if (dateRangePreset === 'custom') {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (txDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (txDate > end) return false;
        }
      }

      return true;
    });
  }, [
    state.transactions,
    searchQuery,
    filterType,
    filterStatus,
    dateRangePreset,
    startDate,
    endDate,
  ]);

  // Aggregate metrics for filtered data
  const filteredTotalVolume = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => acc + tx.totalDebited, 0);
  }, [filteredTransactions]);

  // Pagination slicing
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filterType !== 'all' ||
    filterStatus !== 'all' ||
    dateRangePreset !== 'all' ||
    startDate !== '' ||
    endDate !== '';

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterStatus('all');
    setDateRangePreset('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = [
      'Reference',
      'Date (WAT)',
      'Type',
      'Product Name',
      'Recipient',
      'Provider',
      'Provider Ref',
      'Amount (NGN)',
      'Fee (NGN)',
      'Discount (NGN)',
      'Total Debited (NGN)',
      'Status',
    ];

    const rows = filteredTransactions.map((tx) => [
      tx.reference,
      `"${new Date(tx.createdAt).toLocaleString('en-GB', { timeZone: 'Africa/Lagos' })}"`,
      tx.type,
      `"${tx.productName.replace(/"/g, '""')}"`,
      `"${tx.recipient}"`,
      `"${tx.provider}"`,
      `"${tx.providerReference || 'N/A'}"`,
      tx.amount,
      tx.fee,
      tx.discount,
      tx.totalDebited,
      tx.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `3PLEA_Transactions_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const quickActions = [
    {
      id: 'airtime',
      name: language === 'ha' ? 'Katin Waya' : 'Airtime VTU',
      desc: '2% Cashback',
      icon: Smartphone,
      color: 'text-amber-500 bg-amber-50',
    },
    {
      id: 'data',
      name: language === 'ha' ? 'Kunshin Data' : 'Data Bundles',
      desc: 'SME & Direct 5G',
      icon: Wifi,
      color: 'text-blue-500 bg-blue-50',
    },
    {
      id: 'electricity',
      name: language === 'ha' ? 'Wutar Lantarki' : 'Electricity',
      desc: 'KEDCO & DISCOs',
      icon: Zap,
      color: 'text-emerald-500 bg-emerald-50',
    },
    {
      id: 'cable',
      name: language === 'ha' ? 'Talabijin' : 'Cable TV',
      desc: 'DSTV, GOTV, Star',
      icon: Tv,
      color: 'text-indigo-500 bg-indigo-50',
    },
    {
      id: 'schedules',
      name: language === 'ha' ? 'Jadawalin Biya' : 'Smart Schedules',
      desc: 'Auto-Bill Cycles',
      icon: CalendarClock,
      color: 'text-teal-500 bg-teal-50',
    },
    {
      id: 'education',
      name: language === 'ha' ? 'Makaranta' : 'School Fees',
      desc: 'BUK & Exam PINs',
      icon: GraduationCap,
      color: 'text-purple-500 bg-purple-50',
    },
    {
      id: 'flights',
      name: language === 'ha' ? 'Tikitin Jirgi' : 'Flights',
      desc: 'Domestic & GDS',
      icon: Plane,
      color: 'text-sky-500 bg-sky-50',
    },
    {
      id: 'estates',
      name: language === 'ha' ? 'Gidaje' : 'Real Estate',
      desc: 'Kano & Abuja Homes',
      icon: Building,
      color: 'text-rose-500 bg-rose-50',
    },
    {
      id: 'retailer',
      name: language === 'ha' ? 'Dillalai' : 'Retailer Hub',
      desc: 'Wholesale & Bulk',
      icon: Store,
      color: 'text-teal-500 bg-teal-50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome & Wallet Overview Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Main Wallet Card */}
        <div className="lg:col-span-2 relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-6 shadow-md border border-slate-800">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  {language === 'ha' ? 'Babban Asusun Kudi' : 'Primary NGN Balance'}
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded-full font-medium">
                  <ShieldCheck className="w-3 h-3" />
                  <span>Double-Entry Verified</span>
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] bg-amber-400/10 text-amber-300 border border-amber-400/20 px-2 py-0.5 rounded-full font-medium">
                  <ScanFace className="w-3 h-3" />
                  <span>Biometric Guard</span>
                </span>
              </div>
              <div className="text-3xl sm:text-4xl font-extrabold tabular-nums tracking-tight mt-2">
                ₦{state.currentUser.walletBalance.toLocaleString()}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {language === 'ha' ? 'Mai Asusu:' : 'Account Holder:'}{' '}
                <span className="text-slate-200 font-medium">{state.currentUser.name}</span> · Tarauni Kano
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 mt-1 sm:mt-0">
              <button
                type="button"
                onClick={handleOpenQRScanner}
                className="px-3.5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                title="Scan QR Code to Pay instantly"
              >
                <Scan className="w-4 h-4" />
                <span>{language === 'ha' ? 'Duba QR' : 'Scan to Pay'}</span>
              </button>

              <button
                type="button"
                onClick={handleOpenQRGenerator}
                className="px-3 py-2.5 bg-slate-800/90 hover:bg-slate-700 text-amber-300 hover:text-amber-200 border border-slate-700 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95"
                title="Display My QR Code to Receive Payments"
              >
                <QrCode className="w-4 h-4 text-amber-400" />
                <span>{language === 'ha' ? 'Lambar QR' : 'My QR'}</span>
              </button>

              <button
                type="button"
                onClick={onOpenFundModal}
                className="px-3.5 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95"
              >
                <ArrowDownLeft className="w-4 h-4" />
                <span>{language === 'ha' ? 'Sanya Kudi' : 'Fund Wallet'}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-6 mt-6 border-t border-slate-800/80 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px]">
                {language === 'ha' ? 'Kudin Lada (Bonus)' : 'Bonus Balance'}
              </span>
              <span className="text-sm font-bold tabular-nums text-slate-200">
                ₦{state.currentUser.bonusBalance.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                {language === 'ha' ? 'Kwamishin Dillali' : 'Commission Earned'}
              </span>
              <span className="text-sm font-bold tabular-nums text-emerald-400">
                ₦{state.currentUser.commissionBalance.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px]">
                {language === 'ha' ? 'Matakin KYC' : 'KYC Level'}
              </span>
              <span className="text-sm font-bold text-slate-200">
                Tier {state.currentUser.kycLevel} (BVN & NIN Verified)
              </span>
            </div>
          </div>
        </div>

        {/* Operational Status / Announcements Card */}
        <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 flex flex-col justify-between shadow-xs transition-colors">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {language === 'ha' ? 'Sanarwar Hukuma' : 'Live Platform Feed'}
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Kano Tarauni Node Online</span>
            </div>
            <div className="mt-4 space-y-3">
              <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900/40">
                <div className="flex items-center justify-between text-xs font-bold text-amber-900 dark:text-amber-200">
                  <span>MTN & Airtel SME Super Promo</span>
                  <span className="text-[10px] bg-amber-200 dark:bg-amber-900/60 text-amber-900 dark:text-amber-300 px-1.5 py-0.5 rounded">Active</span>
                </div>
                <p className="text-xs text-amber-800 dark:text-amber-300/90 mt-1">
                  Enjoy instant ₦255/GB wholesale rate on all automated SME and Corporate data plans.
                </p>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                <span className="font-semibold text-slate-800 dark:text-slate-200 block">KEDCO Kano Prepaid Tokens</span>
                Real-time automated generation via Pairgate high-throughput API gateway (1.2s avg).
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Operating Currency: ₦ NGN</span>
            <button
              onClick={() => setActiveTab('support')}
              className="font-medium text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Need Help?</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Services Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
            {language === 'ha' ? 'Ayyukan Dijital da Kudin Wutar Lantarki' : 'Quick Digital Services'}
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Select a category to begin</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => setActiveTab(action.id)}
                className="p-3.5 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 transition-all text-center group shadow-xs active:scale-95"
              >
                <div
                  className={`w-10 h-10 mx-auto rounded-xl flex items-center justify-center mb-2.5 transition-transform group-hover:scale-105 ${action.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 leading-tight">
                  {action.name}
                </span>
                <span className="block text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{action.desc}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Biometric Trust Score & Sensor Telemetry Gauge Widget */}
      <BiometricTrustScoreWidget
        language={language}
        onRunBiometricVerification={onTriggerBiometricTest}
      />

      {/* QR Code Payment Generator & Camera Scanner Hub */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800 text-white p-5 sm:p-6 shadow-md">
        {/* Background ambient glow */}
        <div className="absolute top-0 right-0 w-72 h-72 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-60 h-60 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Left: Info & User Tag */}
          <div className="max-w-xl space-y-2.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-400/15 text-amber-300 border border-amber-400/30">
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>Instant QR Payment Network</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                ₦0.00 Transfer Fee
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">· Real-time Settlement</span>
            </div>

            <div>
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight">
                {language === 'ha'
                  ? 'Biyan Kudi ta QR da Karbar Kudi Nan Take'
                  : 'QR Code Payment Hub & Camera Scanner'}
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed mt-1">
                {language === 'ha'
                  ? 'Bude kyamarar wayarka don biyan dillalai da abokan kasuwanci nan take, ko ka raba lambar QR dinka don karbar kudi.'
                  : 'Scan any 3PLE A payment code with your device camera or upload an image to execute instant internal transfers. Share your personal QR code or generate custom payment invoices.'}
              </p>
            </div>

            {/* User Account Tag quick info */}
            <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-800/80 rounded-xl border border-slate-700 font-mono">
                <span className="text-slate-400 font-sans text-[11px]">Your Tag:</span>
                <span className="text-amber-400 font-bold">
                  3PA-{state.currentUser.phone.replace(/[^0-9]/g, '').slice(-6) || '803123'}
                </span>
              </div>
              <span className="text-slate-400 text-[11px]">
                Linked to: <strong className="text-slate-200">{state.currentUser.phone}</strong>
              </span>
            </div>
          </div>

          {/* Right: Quick Action Triggers */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3 shrink-0">
            <button
              type="button"
              onClick={handleOpenQRScanner}
              className="px-5 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-bold text-xs shadow-lg transition-all flex items-center justify-center gap-2.5 active:scale-95 group"
            >
              <div className="w-7 h-7 rounded-lg bg-slate-950/20 flex items-center justify-center text-slate-950 group-hover:scale-110 transition-transform">
                <Scan className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div className="text-left">
                <span className="block leading-none text-xs font-extrabold">
                  {language === 'ha' ? 'Duba QR (Kyamara)' : 'Scan QR to Pay'}
                </span>
                <span className="block text-[10px] font-medium text-emerald-950/80 mt-0.5">
                  Camera & Image Decoder
                </span>
              </div>
            </button>

            <button
              type="button"
              onClick={handleOpenQRGenerator}
              className="px-5 py-3.5 rounded-2xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/80 hover:border-slate-600 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2.5 active:scale-95 group"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-400/20 flex items-center justify-center text-amber-300 group-hover:scale-110 transition-transform">
                <QrCode className="w-4 h-4" />
              </div>
              <div className="text-left">
                <span className="block leading-none text-xs font-extrabold text-amber-300">
                  {language === 'ha' ? 'Lambar QR Dina' : 'My QR / Invoices'}
                </span>
                <span className="block text-[10px] font-medium text-slate-400 mt-0.5">
                  Receive & Share Details
                </span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Smart Schedule & Upcoming Bill Cycles Preview Widget */}
      {state.scheduledPayments && state.scheduledPayments.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400">
                <CalendarClock className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{language === 'ha' ? 'Jadawalin Biyan Kudi Masu Zuwa' : 'Smart Schedule & Upcoming Bill Cycles'}</span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                    {state.scheduledPayments.filter((p) => p.status === 'active').length} Active
                  </span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'ha'
                    ? 'Biyan kudin wuta, data, da talabijin dake tafe a wannan watan tare da zabin tsallake zagaye.'
                    : 'Upcoming automated recurring subscriptions. Skip next cycle or modify execution dates.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('schedules')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors self-start sm:self-auto"
            >
              <span>{language === 'ha' ? 'Duba Cikakkiyar Kalanda' : 'Open Smart Schedule Calendar'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Upcoming Bills Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-4">
            {[...state.scheduledPayments]
              .sort(
                (a, b) =>
                  new Date(a.nextRunDate).getTime() - new Date(b.nextRunDate).getTime()
              )
              .slice(0, 3)
              .map((sch) => {
                const diffMs = new Date(sch.nextRunDate).getTime() - Date.now();
                const diffHours = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60)));
                const diffDays = Math.floor(diffHours / 24);
                const isSkipped = sch.status === 'skipped';

                const countdownText =
                  diffDays === 0
                    ? `Due today (${diffHours}h)`
                    : diffDays === 1
                    ? 'Due tomorrow'
                    : `Due in ${diffDays} days`;

                return (
                  <div
                    key={sch.id}
                    className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                      isSkipped
                        ? 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-70'
                        : 'bg-slate-50/60 dark:bg-slate-950/40 border-slate-200/80 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                          {sch.provider} · {sch.frequency}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            isSkipped
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                              : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          }`}
                        >
                          {isSkipped ? 'Skipped' : countdownText}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                        {sch.title}
                      </h4>

                      <div className="flex items-baseline justify-between pt-1">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white">
                          ₦{sch.amount.toLocaleString()}
                        </span>
                        <span className="text-xs text-slate-500 font-mono">
                          {sch.recipient}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 mt-3 border-t border-slate-200/60 dark:border-slate-800">
                      {isSkipped ? (
                        <button
                          type="button"
                          onClick={() => {
                            if (!updateState) return;
                            const nextList = state.scheduledPayments.map((p) =>
                              p.id === sch.id
                                ? {
                                    ...p,
                                    status: 'active' as const,
                                    nextRunDate: p.lastSkippedDate || p.nextRunDate,
                                  }
                                : p
                            );
                            updateState({ scheduledPayments: nextList });
                          }}
                          className="flex-1 py-1.5 px-2 text-xs font-semibold rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 text-center"
                        >
                          Unskip
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (!updateState) return;
                            const current = new Date(sch.nextRunDate);
                            const next = new Date(current);
                            if (sch.frequency === 'daily') next.setDate(next.getDate() + 1);
                            else if (sch.frequency === 'weekly') next.setDate(next.getDate() + 7);
                            else next.setMonth(next.getMonth() + 1);

                            const nextList = state.scheduledPayments.map((p) =>
                              p.id === sch.id
                                ? {
                                    ...p,
                                    nextRunDate: next.toISOString(),
                                    status: 'skipped' as const,
                                    lastSkippedDate: sch.nextRunDate,
                                    skippedCycles: [...(p.skippedCycles || []), sch.nextRunDate],
                                  }
                                : p
                            );
                            updateState({ scheduledPayments: nextList });
                          }}
                          className="flex-1 py-1.5 px-2 text-xs font-semibold rounded border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center gap-1"
                        >
                          <SkipForward className="w-3 h-3 text-blue-600" />
                          <span>Skip Cycle</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => setActiveTab('schedules')}
                        className="flex-1 py-1.5 px-2 text-xs font-semibold rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 text-center"
                      >
                        Modify
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* AI Financial Transaction Categorizer Widget */}
      <TransactionCategorizerWidget
        transactions={state.transactions}
        onUpdateTransactions={(updated) => {
          if (updateState) {
            updateState({ transactions: updated });
          }
        }}
        language={language}
      />

      {/* Enhanced Transaction History Section with Advanced Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {/* Section Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'ha' ? 'Harkokin Kudi na Kwanan Nan' : 'Transaction History & Ledger Activity'}
              </h3>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-transparent dark:border-slate-700">
                {filteredTransactions.length} of {state.transactions.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive double-entry verified transactions with granular filters and CSV reports
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Filtered Volume
              </span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                ₦{filteredTotalVolume.toLocaleString()}
              </span>
            </div>

            <button
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-40"
              title="Download CSV Statement"
            >
              <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>{language === 'ha' ? 'Sauke CSV' : 'Export CSV'}</span>
            </button>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                showAdvancedFilters || hasActiveFilters
                  ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 border-slate-900 dark:border-amber-400 shadow-xs font-bold'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{language === 'ha' ? 'Tace Bayanai' : 'Filters'}</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 space-y-3">
          {/* Primary Quick Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={
                  language === 'ha'
                    ? 'Bincika shaida, lamba, ko sabis...'
                    : 'Search reference, recipient, product...'
                }
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-amber-400/20 focus:border-slate-900 dark:focus:border-amber-400 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Transaction Type Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-amber-400/20 focus:border-slate-900 dark:focus:border-amber-400"
              >
                <option value="all">All Service Categories</option>
                <option value="uncategorized">🤖 Uncategorized (AI Review)</option>
                <option value="vtu">⚡ VTU (Airtime & Data)</option>
                <option value="airtime">Airtime VTU Only</option>
                <option value="data">Data Bundles Only</option>
                <option value="bills">💡 Utility Bills (Power & TV)</option>
                <option value="electricity">Electricity (DISCOs)</option>
                <option value="cable_tv">Cable TV (DSTV/GOTV)</option>
                <option value="flight">✈️ Flights & Travel</option>
                <option value="education">🎓 School Fees & Exams</option>
                <option value="wallet">💳 Wallet (Funding & Payouts)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-amber-400/20 focus:border-slate-900 dark:focus:border-amber-400"
              >
                <option value="all">All Statuses (Any)</option>
                <option value="successful">✓ Successful</option>
                <option value="pending">⏳ Pending Verification</option>
                <option value="failed">✕ Failed</option>
                <option value="reversed">↺ Reversed</option>
                <option value="refunded">↩ Refunded</option>
              </select>
            </div>

            {/* Date Range Preset Selector */}
            <div>
              <select
                value={dateRangePreset}
                onChange={(e) => {
                  setDateRangePreset(e.target.value);
                  setCurrentPage(1);
                  if (e.target.value !== 'custom') {
                    setStartDate('');
                    setEndDate('');
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-amber-400/20 focus:border-slate-900 dark:focus:border-amber-400"
              >
                <option value="all">Date: All Time</option>
                <option value="today">Date: Today</option>
                <option value="7days">Date: Last 7 Days</option>
                <option value="30days">Date: Last 30 Days</option>
                <option value="custom">Date: Custom Date Range...</option>
              </select>
            </div>
          </div>

          {/* Secondary Filter Row: Custom Dates & Reset Button */}
          {(showAdvancedFilters || dateRangePreset === 'custom' || hasActiveFilters) && (
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
              {/* Date pickers */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>Custom Range:</span>
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDateRangePreset('custom');
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
                  placeholder="Start date"
                />
                <span className="text-slate-400 dark:text-slate-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDateRangePreset('custom');
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
                  placeholder="End date"
                />
              </div>

              {/* Reset action button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors self-start sm:self-auto border border-rose-200 dark:border-rose-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Service & Product</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Recipient / Account</th>
                <th className="py-3 px-4">Provider Channel</th>
                <th className="py-3 px-4">Date & Time (WAT)</th>
                <th className="py-3 px-4 text-right">Total (₦)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Filter className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        No transactions matched your filter criteria.
                      </p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs">
                        Try adjusting your date range, clearing search terms, or resetting filters.
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 px-3 py-1.5 bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 rounded-lg text-xs font-semibold hover:bg-slate-800 dark:hover:bg-amber-300 transition-colors"
                        >
                          Clear Active Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  const isUncat = (tx.isUncategorized || tx.type === 'uncategorized' || tx.category === 'Uncategorized') && !tx.categoryConfirmed;
                  return (
                  <tr
                    key={tx.id}
                    className={`transition-colors ${
                      isUncat
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-100/50 dark:hover:bg-amber-950/30'
                        : 'hover:bg-slate-50/80 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{tx.productName}</span>
                          {isUncat && (
                            <span className="shrink-0 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-200/60 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                              Uncategorized
                            </span>
                          )}
                        </div>
                        {isUncat && tx.suggestedCategory && (
                          <div className="flex items-center gap-2 mt-1 text-[11px]">
                            <span className="text-slate-500 dark:text-slate-400 font-normal">
                              AI suggests:
                            </span>
                            <span className="font-bold text-amber-700 dark:text-amber-400">
                              {tx.suggestedCategory}
                            </span>
                            <button
                              onClick={() => handleConfirmCategoryFromTable(tx)}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white rounded text-[10px] font-bold transition-all shadow-2xs"
                              title="Single-click to confirm AI classification"
                            >
                              <CheckCircle className="w-3 h-3" />
                              <span>1-Click Confirm</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 select-all whitespace-nowrap">
                      {tx.reference}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                      {tx.recipient}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 truncate max-w-[130px]">
                      {tx.provider}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {new Date(tx.createdAt).toLocaleString('en-GB', {
                        timeZone: 'Africa/Lagos',
                        dateStyle: 'short',
                        timeStyle: 'short',
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold tabular-nums text-slate-900 dark:text-white whitespace-nowrap">
                      ₦{tx.totalDebited.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                          tx.status === 'successful'
                            ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                            : tx.status === 'pending'
                            ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                            : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                        }`}
                      >
                        {tx.status === 'successful' && <CheckCircle className="w-3 solid h-3" />}
                        {tx.status === 'pending' && <Clock className="w-3 h-3" />}
                        {tx.status === 'failed' && <XCircle className="w-3 h-3" />}
                        <span className="capitalize">{tx.status}</span>
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => onViewReceipt(tx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-semibold text-[11px]"
                      >
                        <FileText className="w-3 h-3" />
                        <span>Receipt</span>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Results Summary Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Showing{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {filteredTransactions.length === 0
                  ? 0
                  : (currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-900 dark:text-white font-mono">
                {filteredTransactions.length}
              </span>{' '}
              entries
            </span>

            {/* Per page selector */}
            <div className="flex items-center gap-1 ml-3">
              <span className="text-slate-400 dark:text-slate-500">Rows:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Page navigation buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 self-center sm:self-auto">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>

              <div className="px-2 font-mono font-semibold text-slate-800 dark:text-slate-200">
                {currentPage} / {totalPages}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* QR Code Payment Generator & Camera Scanner Modal */}
      <QRCodePaymentModal
        isOpen={isQRPaymentModalOpen}
        onClose={() => setIsQRPaymentModalOpen(false)}
        currentUser={state.currentUser}
        onTransferSuccess={handleQRTransferSuccess}
        onViewReceipt={onViewReceipt}
        initialMode={qrModalMode}
        language={language}
      />
    </div>
  );
};
