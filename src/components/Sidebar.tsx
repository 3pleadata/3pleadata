import React from 'react';
import { User } from '../types';
import {
  LayoutDashboard,
  Smartphone,
  Wifi,
  Zap,
  Tv,
  GraduationCap,
  Plane,
  Building,
  Store,
  ShieldAlert,
  Code2,
  Headphones,
  MapPin,
  X,
  CreditCard,
  CalendarClock,
} from 'lucide-react';
import { Language, t } from '../services/i18n';

interface SidebarProps {
  currentUser: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onOpenFundModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  activeTab,
  setActiveTab,
  isOpen,
  onClose,
  language,
  onOpenFundModal,
}) => {
  const navItems = [
    {
      id: 'dashboard',
      label: t('navDashboard', language),
      icon: LayoutDashboard,
    },
    {
      id: 'airtime',
      label: t('navAirtime', language),
      icon: Smartphone,
    },
    {
      id: 'data',
      label: t('navData', language),
      icon: Wifi,
    },
    {
      id: 'electricity',
      label: t('navElectricity', language),
      icon: Zap,
    },
    {
      id: 'cable',
      label: t('navCable', language),
      icon: Tv,
    },
    {
      id: 'schedules',
      label: t('navSchedules', language),
      icon: CalendarClock,
    },
    {
      id: 'education',
      label: t('navEducation', language),
      icon: GraduationCap,
    },
    {
      id: 'flights',
      label: t('navFlights', language),
      icon: Plane,
    },
    {
      id: 'estates',
      label: t('navRealEstate', language),
      icon: Building,
    },
    {
      id: 'retailer',
      label: t('navRetailerHub', language),
      icon: Store,
    },
    {
      id: 'developers',
      label: t('navDeveloperApi', language),
      icon: Code2,
    },
    {
      id: 'support',
      label: t('navSupport', language),
      icon: Headphones,
    },
  ];

  if (currentUser.role === 'administrator' || currentUser.role === 'super_admin') {
    navItems.push({
      id: 'admin',
      label: t('navAdmin', language),
      icon: ShieldAlert,
    });
  }

  const handleSelect = (id: string) => {
    setActiveTab(id);
    onClose();
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-all duration-200 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Sidebar Brand Lockup */}
        <div className="flex items-center justify-between px-6 h-16 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="3PLE A Logo"
              className="w-8 h-8 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  '/public/assets/aistudio/file_00000000af208211b9b8694ca4544f0f_3769349c.png';
              }}
            />
            <div>
              <span className="font-extrabold text-base tracking-tight text-slate-900 dark:text-white block leading-tight">
                3PLE A
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-medium">Fintech & Services</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg lg:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Mini Card */}
        <div className="p-4 mx-3 my-3 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {t('walletBalance', language)}
            </span>
            <span className="text-[10px] font-mono uppercase bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 px-1.5 py-0.5 rounded font-bold">
              {currentUser.role.replace('_', ' ')}
            </span>
          </div>
          <div className="text-lg font-bold text-slate-900 dark:text-white tabular-nums">
            ₦{currentUser.walletBalance.toLocaleString()}
          </div>
          <button
            onClick={onOpenFundModal}
            className="mt-2.5 w-full py-1.5 px-3 bg-slate-900 hover:bg-slate-800 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors shadow-xs active:scale-95"
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>{t('fundWallet', language)}</span>
          </button>
        </div>

        {/* Navigation list */}
        <div className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                  isActive
                    ? 'bg-slate-900 dark:bg-slate-800 text-white dark:text-amber-300 shadow-sm border border-transparent dark:border-slate-700'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60'
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${
                    isActive ? 'text-amber-400' : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Kano Business Address Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40">
          <div className="flex items-start gap-2 text-slate-500 dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-tight">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">3PLE A HQ</span>
              Karkasara Road, Tarauni LGA, Kano State, Nigeria.
            </div>
          </div>
          <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-2">
            Time: Africa/Lagos (WAT)
          </div>
        </div>
      </aside>
    </>
  );
};
