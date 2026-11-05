import React from 'react';
import { Sparkles, MessageSquare } from 'lucide-react';
import { Language } from '../services/i18n';

interface FloatingAssistantButtonProps {
  isOpen: boolean;
  onToggle: () => void;
  language: Language;
}

export const FloatingAssistantButton: React.FC<FloatingAssistantButtonProps> = ({
  isOpen,
  onToggle,
  language,
}) => {
  return (
    <aside
      aria-label="Assistant & Support"
      className="fixed bottom-6 right-6 z-40"
    >
      <button
        type="button"
        onClick={onToggle}
        className={`group relative flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl transition-all duration-200 transform hover:scale-105 active:scale-95 cursor-pointer ${
          isOpen
            ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 ring-4 ring-amber-400/30'
            : 'bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 dark:from-slate-800 dark:via-slate-800 dark:to-slate-850 text-white border border-slate-700/80 hover:border-amber-400/80'
        }`}
        title={
          language === 'ha'
            ? 'Bude Mataimakin AI da Google Chat Support'
            : 'Open Gemini AI Assistant & Google Chat Support'
        }
        aria-label="Toggle AI Assistant & Support Chat"
        aria-expanded={isOpen}
      >
        {/* Glowing Beacon Indicator */}
        <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white dark:border-slate-900" />
        </span>

        {/* Gemini Sparkles & Chat Icons */}
        <div className="flex items-center gap-1">
          <div className="p-1 rounded-lg bg-amber-400/20 text-amber-400">
            <Sparkles className="w-4 h-4 animate-pulse" />
          </div>
          <div className="p-1 rounded-lg bg-emerald-400/20 text-emerald-400">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Button Text Label */}
        <div className="text-left hidden sm:block">
          <div className="text-xs font-bold leading-tight flex items-center gap-1.5">
            <span>{language === 'ha' ? 'Mataimaki & Chat' : 'AI & Support'}</span>
            <span className="text-[9px] font-mono uppercase bg-amber-400/20 text-amber-400 border border-amber-400/40 px-1 py-0.2 rounded font-bold">
              Gemini
            </span>
          </div>
          <div className="text-[10px] text-slate-400 leading-tight">
            {language === 'ha' ? 'Taimakon Nan Take' : 'Instant Help & Google Chat'}
          </div>
        </div>
      </button>
    </aside>
  );
};
