import React from 'react';
import { User, UserRole } from '../types';
import {
  Globe,
  Plus,
  Menu,
  User as UserIcon,
  ScanFace,
  Sun,
  Moon,
} from 'lucide-react';
import { ThemeMode } from '../services/theme';
import { Language, t } from '../services/i18n';

interface HeaderProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onOpenFundModal: () => void;
  onOpenAuthModal: () => void;
  onToggleSidebar: () => void;
  onRoleSwitch: (role: UserRole) => void;
  isBiometricActive?: boolean;
  onLockBiometrics?: () => void;
  onTriggerBiometricTest?: () => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  language,
  setLanguage,
  onOpenFundModal,
  onOpenAuthModal,
  onToggleSidebar,
  onRoleSwitch,
  isBiometricActive = false,
  onLockBiometrics,
  onTriggerBiometricTest,
  theme = 'light',
  onToggleTheme,
}) => {
  const isDark =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 md:gap-8 h-16">
          {/* Zone 1: Brand wordmark & mobile menu trigger */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={onToggleSidebar}
              className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Toggle navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <img
                src="/logo.png"
                alt="3PLE A Crest"
                className="w-9 h-9 object-contain shrink-0 group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    '/public/assets/aistudio/file_00000000af208211b9b8694ca4544f0f_3769349c.png';
                }}
              />
              <span className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0">
                3PLE A
              </span>
            </button>
          </div>

          {/* Zone 2: Navigation links driven reactively by translation map */}
          <nav className="hidden md:flex items-center gap-5 lg:gap-6 text-sm font-medium text-slate-600 dark:text-slate-400">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'dashboard' ? 'text-slate-900 dark:text-white font-semibold' : ''
              }`}
            >
              {t('navServices', language)}
            </button>

            <button
              onClick={() => setActiveTab('flights')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'flights' ? 'text-slate-900 dark:text-white font-semibold' : ''
              }`}
            >
              {t('navFlights', language)}
            </button>

            <button
              onClick={() => setActiveTab('estates')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'estates' ? 'text-slate-900 dark:text-white font-semibold' : ''
              }`}
            >
              {t('navRealEstate', language)}
            </button>

            <button
              onClick={() => setActiveTab('retailer')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'retailer' ? 'text-slate-900 dark:text-white font-semibold' : ''
              }`}
            >
              {t('navRetailerHub', language)}
            </button>

            <button
              onClick={() => setActiveTab('developers')}
              className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 py-1 ${
                activeTab === 'developers' ? 'text-slate-900 dark:text-white font-semibold' : ''
              }`}
            >
              {t('navDeveloperApi', language)}
            </button>

            {(currentUser.role === 'administrator' || currentUser.role === 'super_admin') && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`hover:text-amber-800 dark:hover:text-amber-300 transition-colors whitespace-nowrap shrink-0 py-1 ${
                  activeTab === 'admin'
                    ? 'text-amber-700 dark:text-amber-400 font-bold'
                    : 'text-amber-600 dark:text-amber-400'
                }`}
              >
                {t('navAdmin', language)}
              </button>
            )}
          </nav>

          {/* Zone 3: Actions cluster */}
          <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
            {/* Persistent Language Switcher */}
            <div
              className="inline-flex items-center p-0.5 sm:p-1 bg-slate-100 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700/80 shadow-2xs transition-colors"
              role="group"
              aria-label={t('headerSwitchLang', language)}
            >
              <div
                className="pl-1.5 pr-1 text-slate-400 dark:text-slate-500 hidden sm:flex items-center"
                title={t('headerSwitchLang', language)}
              >
                <Globe className="w-3.5 h-3.5" />
              </div>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                  language === 'en'
                    ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={t('headerSwitchToEnglish', language)}
                aria-pressed={language === 'en'}
                aria-label="English"
              >
                EN
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ha')}
                className={`px-2 py-1 text-xs font-bold rounded-lg transition-all ${
                  language === 'ha'
                    ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
                title={t('headerSwitchToHausa', language)}
                aria-pressed={language === 'ha'}
                aria-label="Harshen Hausa"
              >
                HA
              </button>
            </div>

            {/* Quick Theme Toggle (Light / Dark) */}
            {onToggleTheme && (
              <button
                type="button"
                onClick={onToggleTheme}
                className="p-2 text-slate-600 dark:text-slate-300 hover:text-amber-500 dark:hover:text-amber-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={t('headerThemeToggle', language)}
                aria-label="Toggle dark mode theme"
              >
                {isDark ? (
                  <Sun className="w-4 h-4 text-amber-400" />
                ) : (
                  <Moon className="w-4 h-4 text-slate-600" />
                )}
              </button>
            )}

            {/* Biometric Security Vault Indicator & Quick Lock/Test */}
            <button
              type="button"
              onClick={isBiometricActive ? onLockBiometrics : onTriggerBiometricTest}
              className={`hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl transition-all border ${
                isBiometricActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/80 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
              title={
                isBiometricActive
                  ? t('headerBiometricsActive', language)
                  : t('headerBiometricsInactive', language)
              }
            >
              <ScanFace
                className={`w-3.5 h-3.5 ${
                  isBiometricActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-400'
                }`}
              />
              <span>
                {isBiometricActive
                  ? t('headerVaultUnlocked', language)
                  : t('headerBiometrics', language)}
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isBiometricActive
                    ? 'bg-emerald-500 animate-pulse shadow-[0_0_6px_#10b981]'
                    : 'bg-slate-400 dark:bg-slate-500'
                }`}
              />
            </button>

            {/* Quick Wallet Summary & Fund Action */}
            <div className="hidden sm:flex items-center bg-slate-900 dark:bg-slate-800 text-white rounded-xl pl-3 pr-1 py-1 shadow-sm border border-slate-800 dark:border-slate-700">
              <div className="mr-3">
                <div className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">
                  {t('headerBalance', language)}
                </div>
                <div className="text-xs font-bold tabular-nums">
                  ₦{currentUser.walletBalance.toLocaleString()}
                </div>
              </div>
              <button
                onClick={onOpenFundModal}
                className="p-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg transition-colors"
                title={t('fundWallet', language)}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Mobile fund button */}
            <button
              onClick={onOpenFundModal}
              className="sm:hidden px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-slate-800 rounded-xl hover:bg-slate-800 transition-colors"
            >
              ₦{currentUser.walletBalance.toLocaleString()}
            </button>

            {/* Account / Role profile */}
            <button
              onClick={onOpenAuthModal}
              className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title={t('headerAccount', language)}
            >
              <UserIcon className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

