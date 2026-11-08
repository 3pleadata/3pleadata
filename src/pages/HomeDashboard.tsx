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
  Eye,
  EyeOff,
  Copy,
  Check,
  Gift,
} from 'lucide-react';
import { QRCodePaymentModal } from '../components/QRCodePaymentModal';

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
  // Privacy & Virtual Account State
  const [hideBalance, setHideBalance] = useState<boolean>(() => {
    try {
      return localStorage.getItem('3plea_hide_balance') === 'true';
    } catch {
      return false;
    }
  });
  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);
  const virtualAccountNumber = '9820194821';

  const handleToggleHideBalance = () => {
    setHideBalance((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('3plea_hide_balance', String(next));
      } catch {}
      return next;
    });
  };

  const handleCopyVirtualAccount = () => {
    try {
      navigator.clipboard.writeText(virtualAccountNumber);
      setCopiedAccount(true);
      setTimeout(() => setCopiedAccount(false), 2500);
    } catch {}
  };

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

  const quickActions = [
    {
      id: 'airtime',
      name: language === 'ha' ? 'Katin Waya' : 'Airtime VTU',
      desc: '2% Cashback',
      icon: Smartphone,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50',
    },
    {
      id: 'data',
      name: language === 'ha' ? 'Kunshin Data' : 'Data Bundles',
      desc: 'SME & Direct 5G',
      icon: Wifi,
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/50',
    },
    {
      id: 'electricity',
      name: language === 'ha' ? 'Wutar Lantarki' : 'Electricity',
      desc: 'KEDCO & DISCOs',
      icon: Zap,
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/50',
    },
    {
      id: 'cable',
      name: language === 'ha' ? 'Talabijin' : 'Cable TV',
      desc: 'DSTV, GOTV, Star',
      icon: Tv,
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/50',
    },
    {
      id: 'schedules',
      name: language === 'ha' ? 'Jadawalin Biya' : 'Smart Schedules',
      desc: 'Auto-Bill Cycles',
      icon: CalendarClock,
      color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/50',
    },
    {
      id: 'education',
      name: language === 'ha' ? 'Makaranta' : 'School Fees',
      desc: 'BUK & Exam PINs',
      icon: GraduationCap,
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/50',
    },
    {
      id: 'flights',
      name: language === 'ha' ? 'Tikitin Jirgi' : 'Flights',
      desc: 'Domestic & GDS',
      icon: Plane,
      color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/50',
    },
    {
      id: 'estates',
      name: language === 'ha' ? 'Gidaje' : 'Real Estate',
      desc: 'Kano & Abuja Homes',
      icon: Building,
      color: 'text-rose-500 bg-rose-50 dark:bg-rose-950/50',
    },
    {
      id: 'retailer',
      name: language === 'ha' ? 'Dillalai' : 'Retailer Hub',
      desc: 'Wholesale & Bulk',
      icon: Store,
      color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/50',
    },
    {
      id: 'referrals',
      name: language === 'ha' ? 'Gayyato Abokai' : 'Refer & Earn',
      desc: '₦750 Per Friend',
      icon: Gift,
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/50',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome & Wallet Overview Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white p-6 sm:p-7 shadow-xl border border-slate-800/90">
        {/* Ambient subtle glow backdrops */}
        <div className="absolute -top-16 -right-16 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-start justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                {language === 'ha' ? 'Babban Asusun Kudi' : 'Primary NGN Balance'}
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-medium">
                <ShieldCheck className="w-3 h-3" />
                <span>Double-Entry Verified</span>
              </span>
              <span className="inline-flex items-center gap-1 text-[10px] bg-amber-400/10 text-amber-300 border border-amber-400/20 px-2.5 py-0.5 rounded-full font-medium">
                <ScanFace className="w-3 h-3" />
                <span>Biometric Guard</span>
              </span>
            </div>

            {/* Balance with Eye Privacy Toggle */}
            <div className="flex items-center gap-3 mt-2">
              <div className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tabular-nums tracking-tight font-mono">
                {hideBalance ? '₦••••••••' : `₦${state.currentUser.walletBalance.toLocaleString()}`}
              </div>
              <button
                type="button"
                onClick={handleToggleHideBalance}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/15 text-slate-300 hover:text-white transition-all shadow-xs"
                title={hideBalance ? 'Show balance' : 'Hide balance'}
                aria-label="Toggle balance visibility"
              >
                {hideBalance ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <p className="text-xs text-slate-400 mt-1">
              {language === 'ha' ? 'Mai Asusu:' : 'Account Holder:'}{' '}
              <span className="text-slate-200 font-medium">{state.currentUser.name}</span> · Tarauni Kano
            </p>

            {/* Dedicated Virtual Bank Account Pill with 1-click copy */}
            <div className="mt-3.5 inline-flex flex-wrap items-center gap-2 p-1.5 pl-3 pr-2 bg-slate-900/90 border border-slate-700/80 rounded-xl text-xs text-slate-300 backdrop-blur-md shadow-2xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">
                {language === 'ha' ? 'Asusun Banki:' : 'Dedicated Bank Account:'}
              </span>
              <span className="font-semibold text-white">Wema Bank</span>
              <span className="font-mono text-amber-300 font-bold tracking-wider">{virtualAccountNumber}</span>
              <button
                type="button"
                onClick={handleCopyVirtualAccount}
                className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-semibold flex items-center gap-1 transition-all active:scale-95 border border-slate-700"
                title="Copy virtual account number"
              >
                {copiedAccount ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">{language === 'ha' ? 'An Kwafa!' : 'Copied!'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-400" />
                    <span>{language === 'ha' ? 'Kwafa' : 'Copy'}</span>
                  </>
                )}
              </button>
            </div>
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
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>{language === 'ha' ? 'Sanya Kudi' : 'Fund Wallet'}</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 mt-6 border-t border-slate-800/80 text-xs">
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
          <div>
            <span className="text-slate-400 block text-[11px]">
              {language === 'ha' ? 'Yankin Aiki' : 'Operational Region'}
            </span>
            <span className="text-sm font-bold text-amber-300">
              Kano & Northern Hub
            </span>
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

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5 sm:gap-3">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => setActiveTab(action.id)}
                className="p-3 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/90 rounded-2xl border border-slate-200/90 dark:border-slate-800 hover:border-amber-400/40 dark:hover:border-amber-400/40 hover:-translate-y-1 hover:shadow-md transition-all duration-200 text-center group shadow-2xs active:scale-95 flex flex-col items-center justify-between min-h-[105px]"
              >
                <div
                  className={`w-10 h-10 mx-auto rounded-2xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110 shadow-2xs ${action.color}`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="w-full">
                  <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 leading-snug truncate">
                    {action.name}
                  </span>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">{action.desc}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>


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
                    key={`home_sch_${sch.id}`}
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
