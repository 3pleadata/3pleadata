import React, { useState } from 'react';
import {
  X,
  Check,
  Plus,
  RotateCcw,
  Search,
  SlidersHorizontal,
  Smartphone,
  Wifi,
  Zap,
  Tv,
  CalendarClock,
  GraduationCap,
  Plane,
  Building,
  Store,
  Gift,
  ArrowDownLeft,
  Scan,
  ShieldCheck,
} from 'lucide-react';

export interface ShortcutDefinition {
  id: string;
  nameEn: string;
  nameHa: string;
  descEn: string;
  descHa: string;
  targetTab: string;
  specialAction?: 'fund_wallet' | 'qr_scan';
  icon: any;
  color: string;
  bgTint: string;
  category: 'vtu' | 'bills' | 'lifestyle' | 'wallet';
}

export const ALL_AVAILABLE_SHORTCUTS: ShortcutDefinition[] = [
  {
    id: 'airtime',
    nameEn: 'Buy Airtime',
    nameHa: 'Katin Waya (VTU)',
    descEn: 'Instant recharge & 2% cashback',
    descHa: 'Sanya katin waya nan take',
    targetTab: 'airtime',
    icon: Smartphone,
    color: 'text-amber-500',
    bgTint: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
    category: 'vtu',
  },
  {
    id: 'data',
    nameEn: 'Buy Data',
    nameHa: 'Kunshin Data',
    descEn: 'SME, corporate & 5G plans',
    descHa: 'Data mai sauki da sauri',
    targetTab: 'data',
    icon: Wifi,
    color: 'text-blue-500',
    bgTint: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
    category: 'vtu',
  },
  {
    id: 'electricity',
    nameEn: 'Pay Electricity',
    nameHa: 'Kudin Wutar Lantarki',
    descEn: 'KEDCO & national DISCO tokens',
    descHa: 'Siyan token na KEDCO da DISCOs',
    targetTab: 'electricity',
    icon: Zap,
    color: 'text-emerald-500',
    bgTint: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
    category: 'bills',
  },
  {
    id: 'cable',
    nameEn: 'Renew Cable TV',
    nameHa: 'Talabijin (Cable TV)',
    descEn: 'DSTV, GOTV & StarTimes bouquets',
    descHa: 'Biyan kudin DSTV da GOTV',
    targetTab: 'cable',
    icon: Tv,
    color: 'text-indigo-500',
    bgTint: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800/60',
    category: 'bills',
  },
  {
    id: 'schedules',
    nameEn: 'Smart Schedules',
    nameHa: 'Jadawalin Biyan Kudi',
    descEn: 'Automated recurring bill calendar',
    descHa: 'Tsara biyan kudi na atomatik',
    targetTab: 'schedules',
    icon: CalendarClock,
    color: 'text-teal-500',
    bgTint: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60',
    category: 'bills',
  },
  {
    id: 'education',
    nameEn: 'Pay School Fees',
    nameHa: 'Kudin Makaranta',
    descEn: 'WAEC, NECO, JAMB & BUK portal',
    descHa: 'Katin WAEC, JAMB da makaranta',
    targetTab: 'education',
    icon: GraduationCap,
    color: 'text-purple-500',
    bgTint: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60',
    category: 'lifestyle',
  },
  {
    id: 'flights',
    nameEn: 'Book Flights',
    nameHa: 'Tikitin Jirgin Sama',
    descEn: 'Domestic & regional air tickets',
    descHa: 'Tikitin Max Air, Air Peace da sauransu',
    targetTab: 'flights',
    icon: Plane,
    color: 'text-sky-500',
    bgTint: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60',
    category: 'lifestyle',
  },
  {
    id: 'estates',
    nameEn: 'Real Estate Hub',
    nameHa: 'Gidaje & Filaye',
    descEn: 'Kano & Abuja properties & rent',
    descHa: 'Hayar gidaje a Kano da Abuja',
    targetTab: 'estates',
    icon: Building,
    color: 'text-rose-500',
    bgTint: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
    category: 'lifestyle',
  },
  {
    id: 'retailer',
    nameEn: 'Retailer Portal',
    nameHa: 'Dandalin Dillalai',
    descEn: 'Wholesale margins & bulk top-ups',
    descHa: 'Rangwame na musamman ga dillalai',
    targetTab: 'retailer',
    icon: Store,
    color: 'text-emerald-600',
    bgTint: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
    category: 'lifestyle',
  },
  {
    id: 'referrals',
    nameEn: 'Refer & Earn',
    nameHa: 'Gayyato Abokai',
    descEn: 'Earn ₦750 - ₦1,200 per friend',
    descHa: 'Samun lada a kowane aboki',
    targetTab: 'referrals',
    icon: Gift,
    color: 'text-amber-500',
    bgTint: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
    category: 'wallet',
  },
  {
    id: 'fund_wallet',
    nameEn: 'Fund Wallet',
    nameHa: 'Sanya Kudi',
    descEn: 'Instant bank transfer or card top-up',
    descHa: 'Tura kudi zuwa asusun 3PLE A',
    targetTab: 'dashboard',
    specialAction: 'fund_wallet',
    icon: ArrowDownLeft,
    color: 'text-amber-600',
    bgTint: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
    category: 'wallet',
  },
  {
    id: 'qr_scan',
    nameEn: 'Scan to Pay',
    nameHa: 'Duba Lambar QR',
    descEn: 'Fast camera QR transfer scanner',
    descHa: 'Biyan kudi da kyamarar waya',
    targetTab: 'dashboard',
    specialAction: 'qr_scan',
    icon: Scan,
    color: 'text-teal-600',
    bgTint: 'bg-teal-50 dark:bg-teal-950/40 border-teal-200 dark:border-teal-800/60',
    category: 'wallet',
  },
];

export const DEFAULT_SHORTCUT_IDS: string[] = [
  'airtime',
  'data',
  'electricity',
  'cable',
  'flights',
  'fund_wallet',
];

interface QuickActionsConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedShortcutIds: string[];
  onSaveShortcuts: (newIds: string[]) => void;
  language: 'en' | 'ha';
}

export const QuickActionsConfigModal: React.FC<QuickActionsConfigModalProps> = ({
  isOpen,
  onClose,
  selectedShortcutIds,
  onSaveShortcuts,
  language,
}) => {
  const [currentSelected, setCurrentSelected] = useState<string[]>(selectedShortcutIds);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | 'vtu' | 'bills' | 'lifestyle' | 'wallet'>('all');

  if (!isOpen) return null;

  const handleToggle = (id: string) => {
    setCurrentSelected((prev) => {
      if (prev.includes(id)) {
        // Prevent removing the very last shortcut to ensure user always has at least 1
        if (prev.length <= 1) return prev;
        return prev.filter((item) => item !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const handleResetDefaults = () => {
    setCurrentSelected([...DEFAULT_SHORTCUT_IDS]);
  };

  const handleSave = () => {
    onSaveShortcuts(currentSelected);
    onClose();
  };

  const filteredShortcuts = ALL_AVAILABLE_SHORTCUTS.filter((sc) => {
    if (categoryFilter !== 'all' && sc.category !== categoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchEn = sc.nameEn.toLowerCase().includes(q) || sc.descEn.toLowerCase().includes(q);
      const matchHa = sc.nameHa.toLowerCase().includes(q) || sc.descHa.toLowerCase().includes(q);
      if (!matchEn && !matchHa) return false;
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
                <SlidersHorizontal className="w-5 h-5" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {language === 'ha' ? 'Gyara Gajerun Hanyoyi' : 'Customize Quick Actions'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'ha'
                    ? 'Zabi ayyukan da kake yawan amfani da su domin ganinsu a shafinka na gida.'
                    : 'Select your most frequently used services to appear as 1-tap shortcuts on your dashboard.'}
                </p>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Category Filter Bar */}
        <div className="p-4 sm:p-5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'ha' ? 'Nemo aiki (misali Wuta, Airtime)...' : 'Search service shortcuts...'}
              className="w-full pl-9 pr-4 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-200/60 dark:bg-slate-800 rounded-xl overflow-x-auto w-full sm:w-auto">
            <button
              onClick={() => setCategoryFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                categoryFilter === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({ALL_AVAILABLE_SHORTCUTS.length})
            </button>
            <button
              onClick={() => setCategoryFilter('vtu')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                categoryFilter === 'vtu'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              VTU
            </button>
            <button
              onClick={() => setCategoryFilter('bills')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                categoryFilter === 'bills'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bills
            </button>
            <button
              onClick={() => setCategoryFilter('lifestyle')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                categoryFilter === 'lifestyle'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Services
            </button>
            <button
              onClick={() => setCategoryFilter('wallet')}
              className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                categoryFilter === 'wallet'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Wallet
            </button>
          </div>
        </div>

        {/* Body: Shortcuts Selection Grid */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
          <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
            <span>
              {language === 'ha'
                ? `An zabi ${currentSelected.length} daga cikin ${ALL_AVAILABLE_SHORTCUTS.length}`
                : `Currently active: ${currentSelected.length} of ${ALL_AVAILABLE_SHORTCUTS.length} shortcuts`}
            </span>
            <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 font-semibold">
              Minimum 1 required
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredShortcuts.map((sc) => {
              const isSelected = currentSelected.includes(sc.id);
              const Icon = sc.icon;
              const name = language === 'ha' ? sc.nameHa : sc.nameEn;
              const desc = language === 'ha' ? sc.descHa : sc.descEn;

              return (
                <div
                  key={sc.id}
                  onClick={() => handleToggle(sc.id)}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-amber-500/5 dark:bg-amber-500/10 border-amber-400/70 dark:border-amber-500/60 shadow-xs'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${sc.bgTint}`}
                    >
                      <Icon className={`w-5 h-5 ${sc.color}`} />
                    </div>
                    <div className="min-w-0">
                      <span className="block text-xs font-bold text-slate-900 dark:text-white truncate">
                        {name}
                      </span>
                      <span className="block text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {desc}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggle(sc.id);
                    }}
                    className={`p-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1 ${
                      isSelected
                        ? 'bg-amber-500 text-slate-950 hover:bg-amber-400'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                    title={isSelected ? 'Remove shortcut' : 'Add shortcut'}
                  >
                    {isSelected ? (
                      <>
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                        <span className="text-[10px]">Added</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                        <span className="text-[10px]">Add</span>
                      </>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200/50 dark:hover:bg-slate-800 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{language === 'ha' ? 'Koma Yanayin Asali' : 'Reset to Defaults'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {language === 'ha' ? 'Soke' : 'Cancel'}
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 hover:opacity-90 transition-opacity shadow-sm"
            >
              {language === 'ha' ? 'Ajiye Hanyoyi' : 'Save Shortcuts'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
