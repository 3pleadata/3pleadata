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
  Send,
  Share2,
  Eye,
  EyeOff,
  Copy,
  Check,
  Gift,
} from 'lucide-react';
import { QRCodePaymentModal } from '../components/QRCodePaymentModal';
import { QuickActionsSection } from '../components/QuickActionsSection';

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
              onClick={onOpenFundModal}
              className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>{language === 'ha' ? 'Sanya Kudi' : 'Fund Wallet'}</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('wallet')}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-bold text-xs rounded-xl transition-all shadow-md flex items-center gap-1.5 active:scale-95"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              <span>{language === 'ha' ? 'Tura Kudi' : 'Transfer'}</span>
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

      {/* Configurable Quick Actions & Full Digital Services Directory */}
      <QuickActionsSection
        setActiveTab={setActiveTab}
        onOpenFundModal={onOpenFundModal}
        onOpenQRScanner={handleOpenQRScanner}
        language={language}
      />


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
