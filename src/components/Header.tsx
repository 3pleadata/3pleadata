import React from 'react';
import { User, UserRole, Transaction } from '../types';
import { AppState } from '../services/storage';
import { Globe, Menu } from 'lucide-react';
import { ThemeMode } from '../services/theme';
import { Language, t } from '../services/i18n';
import { NotificationBell } from './NotificationBell';

interface HeaderProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
  onOpenFundModal?: () => void;
  onOpenAuthModal?: () => void;
  onToggleSidebar: () => void;
  onRoleSwitch?: (role: UserRole) => void;
  isBiometricActive?: boolean;
  onLockBiometrics?: () => void;
  onTriggerBiometricTest?: () => void;
  theme?: ThemeMode;
  onToggleTheme?: () => void;
  state?: AppState;
  onViewReceipt?: (tx: Transaction) => void;
  updateState?: (newState: Partial<AppState>) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  setActiveTab,
  language,
  setLanguage,
  onToggleSidebar,
  state,
  onViewReceipt,
  updateState,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 h-16">
          {/* Brand Logo, Name & Mobile Menu Toggle */}
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
              <div className="flex flex-col">
                <span className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 leading-none">
                  3PLE A DATA
                </span>
                <span className="text-[9px] font-mono font-semibold text-amber-600 dark:text-amber-400 leading-tight mt-0.5">
                  RC 9746103
                </span>
              </div>
            </button>
          </div>

          {/* Right Zone: Babu komai sai Notification Button da Switch Language Button */}
          <div className="flex items-center gap-2.5 sm:gap-3 shrink-0">
            {/* Notification Button */}
            {state && (
              <NotificationBell
                notifications={state.notifications || []}
                onUpdateNotifications={(updated) => updateState?.({ notifications: updated })}
                onViewReceipt={onViewReceipt}
                transactions={state.transactions || []}
                currentUser={currentUser}
                language={language}
              />
            )}

            {/* Switch Language Button (EN / HA) */}
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
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
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
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all ${
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
          </div>
        </div>
      </div>
    </header>
  );
};
