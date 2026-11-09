import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Plus,
  X,
  ArrowUpRight,
  Sparkles,
  ChevronRight,
  Zap,
} from 'lucide-react';
import {
  ALL_AVAILABLE_SHORTCUTS,
  DEFAULT_SHORTCUT_IDS,
  QuickActionsConfigModal,
  ShortcutDefinition,
} from './QuickActionsConfigModal';

const STORAGE_SHORTCUTS_KEY = '3plea_user_quick_shortcuts_v1';

interface QuickActionsSectionProps {
  setActiveTab: (tab: string) => void;
  onOpenFundModal: () => void;
  onOpenQRScanner: () => void;
  language: 'en' | 'ha';
}

export const QuickActionsSection: React.FC<QuickActionsSectionProps> = ({
  setActiveTab,
  onOpenFundModal,
  onOpenQRScanner,
  language,
}) => {
  // Load saved shortcuts from localStorage with fallback to default set
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_SHORTCUTS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to load user shortcuts:', e);
    }
    return DEFAULT_SHORTCUT_IDS;
  });

  const [isConfigModalOpen, setIsConfigModalOpen] = useState<boolean>(false);
  const [isHoveredRemoveId, setIsHoveredRemoveId] = useState<string | null>(null);

  // Save to localStorage whenever selectedIds changes
  const handleSaveShortcuts = (newIds: string[]) => {
    setSelectedIds(newIds);
    try {
      localStorage.setItem(STORAGE_SHORTCUTS_KEY, JSON.stringify(newIds));
    } catch (e) {
      console.warn('Failed to persist user shortcuts:', e);
    }
  };

  // Direct 1-tap remove shortcut from card
  const handleRemoveSingle = (e: React.MouseEvent, idToRemove: string) => {
    e.stopPropagation();
    if (selectedIds.length <= 1) return; // Keep at least 1
    const updated = selectedIds.filter((id) => id !== idToRemove);
    handleSaveShortcuts(updated);
  };

  // Resolve full shortcut definitions
  const activeShortcuts: ShortcutDefinition[] = selectedIds
    .map((id) => ALL_AVAILABLE_SHORTCUTS.find((s) => s.id === id))
    .filter((s): s is ShortcutDefinition => Boolean(s));

  const handleShortcutClick = (sc: ShortcutDefinition) => {
    if (sc.specialAction === 'fund_wallet') {
      onOpenFundModal();
    } else if (sc.specialAction === 'qr_scan') {
      onOpenQRScanner();
    } else {
      setActiveTab(sc.targetTab);
    }
  };

  return (
    <div className="space-y-6">
      {/* Configurable Quick Actions Widget */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-500">
                <Zap className="w-4 h-4 fill-current" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                {language === 'ha' ? 'Hanyoyin Gaggawa' : 'Quick Actions'}
              </h2>
              <span className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
                {activeShortcuts.length} active
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {language === 'ha'
                ? 'Gajerun hanyoyin ayyukan da kake yawan amfani da su. Zaka iya kara ko cirewa a kowane lokaci.'
                : 'Configurable shortcut buttons for your most frequent transactions. Tap to customize or reorder.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors self-start sm:self-auto"
            title="Configure and manage your shortcut buttons"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
            <span>{language === 'ha' ? 'Gyara Hanyoyi' : 'Customize Shortcuts'}</span>
          </button>
        </div>

        {/* Dynamic Grid of Configurable Shortcuts */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3 pt-5">
          {activeShortcuts.map((sc) => {
            const Icon = sc.icon;
            const name = language === 'ha' ? sc.nameHa : sc.nameEn;
            const desc = language === 'ha' ? sc.descHa : sc.descEn;

            return (
              <div
                key={`qa_${sc.id}`}
                onClick={() => handleShortcutClick(sc)}
                onMouseEnter={() => setIsHoveredRemoveId(sc.id)}
                onMouseLeave={() => setIsHoveredRemoveId(null)}
                className="group relative p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-950/40 border border-slate-200/80 dark:border-slate-800/80 hover:border-amber-400/50 dark:hover:border-amber-400/50 hover:bg-white dark:hover:bg-slate-900/90 transition-all duration-200 cursor-pointer shadow-2xs hover:shadow-md hover:-translate-y-0.5 flex flex-col justify-between min-h-[120px]"
              >
                {/* 1-Tap Quick Remove Cross Button */}
                {selectedIds.length > 1 && (
                  <button
                    type="button"
                    onClick={(e) => handleRemoveSingle(e, sc.id)}
                    className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-slate-200/80 dark:bg-slate-800 text-slate-500 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100 z-10"
                    title={language === 'ha' ? 'Cire wannan gajerar hanya' : 'Remove shortcut from dashboard'}
                    aria-label={`Remove ${name} shortcut`}
                  >
                    <X className="w-3 h-3 stroke-[2.5]" />
                  </button>
                )}

                {/* Top Row: Icon & Arrow */}
                <div className="flex items-start justify-between">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-transform group-hover:scale-105 ${sc.bgTint}`}
                  >
                    <Icon className={`w-5 h-5 ${sc.color}`} />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </div>

                {/* Bottom Row: Name & Desc */}
                <div className="pt-3">
                  <span className="block text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors line-clamp-1">
                    {name}
                  </span>
                  <span className="block text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {desc}
                  </span>
                </div>
              </div>
            );
          })}

          {/* '+ Add Shortcut' Dashed Card */}
          <button
            type="button"
            onClick={() => setIsConfigModalOpen(true)}
            className="p-4 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-400 bg-slate-50/30 dark:bg-slate-950/20 hover:bg-amber-500/5 transition-all duration-200 flex flex-col items-center justify-center text-center group min-h-[120px] active:scale-95"
            title="Add more service shortcuts to your dashboard"
          >
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 group-hover:bg-amber-500/10 text-slate-500 dark:text-slate-400 group-hover:text-amber-500 flex items-center justify-center transition-colors mb-2">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </div>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
              {language === 'ha' ? 'Kara Hanya' : 'Add Shortcut'}
            </span>
            <span className="text-[10px] text-slate-400 mt-0.5">
              {ALL_AVAILABLE_SHORTCUTS.length - activeShortcuts.length} more available
            </span>
          </button>
        </div>
      </div>

      {/* Complete Digital Services Directory (Always Accessible) */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tracking-tight">
              {language === 'ha' ? 'Dukkan Ayyukanmu na Dijital' : 'All Digital Services & Categories'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Browse full directory of VTU networks, power DISCOs, and payment solutions
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">10 services</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5 sm:gap-3">
          {ALL_AVAILABLE_SHORTCUTS.filter((s) => s.id !== 'fund_wallet' && s.id !== 'qr_scan').map((action) => {
            const Icon = action.icon;
            const name = language === 'ha' ? action.nameHa : action.nameEn;
            const isPinned = selectedIds.includes(action.id);

            return (
              <button
                key={`all_svc_${action.id}`}
                onClick={() => setActiveTab(action.targetTab)}
                className="p-3 bg-slate-50/70 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/90 rounded-2xl border border-slate-200/80 dark:border-slate-800 hover:border-amber-400/40 dark:hover:border-amber-400/40 hover:-translate-y-0.5 hover:shadow-xs transition-all duration-150 text-center group active:scale-95 flex flex-col items-center justify-between min-h-[96px]"
              >
                <div
                  className={`w-9 h-9 mx-auto rounded-xl flex items-center justify-center mb-1.5 transition-transform group-hover:scale-110 shadow-2xs border ${action.bgTint}`}
                >
                  <Icon className={`w-4 h-4 ${action.color}`} />
                </div>
                <div className="w-full">
                  <span className="block text-[11px] font-bold text-slate-900 dark:text-slate-100 leading-snug truncate">
                    {name}
                  </span>
                  {isPinned ? (
                    <span className="block text-[9px] font-semibold text-amber-600 dark:text-amber-400 mt-0.5">
                      Pinned
                    </span>
                  ) : (
                    <span className="block text-[9px] text-slate-400 mt-0.5">
                      Explore
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Modal for Customizing Shortcuts */}
      <QuickActionsConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        selectedShortcutIds={selectedIds}
        onSaveShortcuts={handleSaveShortcuts}
        language={language}
      />
    </div>
  );
};
