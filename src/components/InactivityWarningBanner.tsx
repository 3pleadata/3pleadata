import React from 'react';
import { AlertTriangle, Lock, ShieldCheck, Clock } from 'lucide-react';

interface InactivityWarningBannerProps {
  isOpen: boolean;
  secondsRemaining: number;
  onStayLoggedIn: () => void;
  onLockNow: () => void;
  language?: 'en' | 'ha';
}

export const InactivityWarningBanner: React.FC<InactivityWarningBannerProps> = ({
  isOpen,
  secondsRemaining,
  onStayLoggedIn,
  onLockNow,
  language = 'en',
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[90] w-full max-w-lg px-4 animate-bounce-subtle pointer-events-auto">
      <div className="p-4 rounded-2xl bg-amber-500 text-slate-950 shadow-2xl border-2 border-amber-300 dark:border-amber-400 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-slate-950 text-amber-400 shrink-0 animate-pulse">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs font-black tracking-tight uppercase flex items-center gap-1.5">
              <span>{language === 'ha' ? 'Gargadin Kullewar Asusu' : 'Inactivity Auto-Logout Warning'}</span>
              <span className="font-mono bg-slate-950 text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-bold">
                {secondsRemaining}s
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-950 leading-tight mt-0.5">
              {language === 'ha'
                ? `Za a kulle asusunka nan da dakika ${secondsRemaining} saboda ba ka taba komai ba.`
                : `Your session will lock in ${secondsRemaining} seconds due to inactivity.`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={onStayLoggedIn}
            className="px-3.5 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
          >
            {language === 'ha' ? 'Ci gaba da zama' : 'Stay Signed In'}
          </button>
          <button
            type="button"
            onClick={onLockNow}
            className="px-2.5 py-1.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/40 text-slate-950 font-bold text-xs border border-slate-950/20 transition-all flex items-center gap-1"
          >
            <Lock className="w-3 h-3" />
            <span>{language === 'ha' ? 'Kulle yanzu' : 'Lock'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
