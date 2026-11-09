import React from 'react';
import { AppState } from '../services/storage';
import { Transaction, User } from '../types';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  LogOut,
  Eye,
  Globe,
  Server,
  Database,
  Lock,
  ArrowRight,
  Sparkles,
  Wifi,
  Coins,
} from 'lucide-react';
import { Language, t } from '../services/i18n';
import { AdminDashboard } from '../pages/AdminDashboard';

interface SuperAdminStandaloneLayoutProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  onViewReceipt: (tx: Transaction) => void;
  language: Language;
  onSwitchLanguage: () => void;
  onLogout: () => void;
  onPreviewCustomerApp: () => void;
  isBiometricUnlocked?: boolean;
  onRequestBiometricUnlock?: () => void;
  onLockBiometric?: () => void;
}

export const SuperAdminStandaloneLayout: React.FC<SuperAdminStandaloneLayoutProps> = ({
  state,
  updateState,
  onViewReceipt,
  language,
  onSwitchLanguage,
  onLogout,
  onPreviewCustomerApp,
  isBiometricUnlocked = true,
  onRequestBiometricUnlock,
  onLockBiometric,
}) => {
  const adminUser = state.currentUser;

  // Calculate live system telemetry for the header
  const totalUsers = state.users?.length || 0;
  const activeProviders = state.providers?.filter((p) => p.status === 'active').length || 0;
  const totalVolume = (state.transactions || [])
    .filter((t) => t.status === 'successful')
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top Executive Header */}
      <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-amber-500/30 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Left: Brand & Executive Identity */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="relative">
                <img
                  src="/logo.png"
                  alt="3PLE A Crest"
                  className="w-10 h-10 object-contain drop-shadow-md"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      '/public/assets/aistudio/file_00000000af208211b9b8694ca4544f0f_3769349c.png';
                  }}
                />
                <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 bg-amber-400 border-2 border-slate-900 rounded-full flex items-center justify-center">
                  <span className="w-1.5 h-1.5 bg-slate-950 rounded-full animate-ping" />
                </span>
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base sm:text-lg font-black tracking-tight text-white leading-none">
                    3PLE A DATA
                  </span>
                  <span className="text-[10px] font-mono font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-2xs">
                    RC 9746103
                  </span>
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-mono font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 px-2 py-0.5 rounded-full uppercase tracking-wider">
                    <ShieldAlert className="w-3 h-3 text-rose-400" />
                    Standalone Admin
                  </span>
                </div>
                <p className="text-[10px] font-mono text-slate-400 leading-tight mt-0.5">
                  Tarauni Kano · Central Financial Ledger & System Infrastructure
                </p>
              </div>
            </div>

            {/* Middle: Live Telemetry Status Pills (Desktop) */}
            <div className="hidden xl:flex items-center gap-2.5 text-[11px] font-mono">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-emerald-400">
                <Server className="w-3.5 h-3.5" />
                <span>Pairgate: 99.98%</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-emerald-400">
                <Database className="w-3.5 h-3.5" />
                <span>Ledger: Balanced</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/80 text-amber-300">
                <Coins className="w-3.5 h-3.5" />
                <span>Vol: ₦{(totalVolume / 1000000).toFixed(2)}M</span>
              </div>
            </div>

            {/* Right: Actions, Language Switcher, Customer Preview & Logout */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* Language Switcher */}
              <button
                type="button"
                onClick={onSwitchLanguage}
                className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                title={language === 'en' ? 'Switch to Hausa' : 'Switch to English'}
              >
                <Globe className="w-3.5 h-3.5 text-amber-400" />
                <span className="font-mono">{language === 'en' ? 'HA' : 'EN'}</span>
              </button>

              {/* Preview Customer App Button */}
              <button
                type="button"
                onClick={onPreviewCustomerApp}
                className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-700 border border-amber-400/40 hover:border-amber-400 text-amber-300 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 active:scale-95 shadow-sm"
                title="View customer application"
              >
                <Eye className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">
                  {language === 'ha' ? 'Duba App ɗin Masu Amfani' : 'Customer View'}
                </span>
                <span className="sm:hidden">App</span>
              </button>

              {/* Admin Profile Mini Pill */}
              <div className="hidden md:flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="w-8 h-8 rounded-lg bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xs shadow-xs">
                  {adminUser.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')}
                </div>
                <div className="text-left text-xs">
                  <span className="font-bold text-white block leading-tight truncate max-w-[120px]">
                    {adminUser.name}
                  </span>
                  <span className="text-[10px] font-mono text-amber-400 block leading-tight">
                    Super Admin
                  </span>
                </div>
              </div>

              {/* Log Out Button */}
              <button
                type="button"
                onClick={onLogout}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:border-rose-500/60 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 active:scale-95"
                title="Sign out of Super Admin"
              >
                <LogOut className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">
                  {language === 'ha' ? 'Fita' : 'Lock Session'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Standalone Admin Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <AdminDashboard
          state={state}
          updateState={updateState}
          onViewReceipt={onViewReceipt}
          language={language}
          isBiometricUnlocked={isBiometricUnlocked}
          onRequestBiometricUnlock={onRequestBiometricUnlock}
          onLockBiometric={onLockBiometric}
        />
      </main>

      {/* Standalone Admin Footer */}
      <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>© 2026 3PLE A DATA (RC 9746103) · Super Admin Enterprise Management Console</span>
          <span className="font-mono text-[11px] text-amber-400">
            Node: Karkasara, Tarauni Kano · Bank Float & Double-Entry Clearing Root
          </span>
        </div>
      </footer>
    </div>
  );
};
