import React, { useState, useEffect } from 'react';
import {
  Bell,
  BellRing,
  X,
  Mail,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';

export interface FlightPriceAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  currentLowestFare: number;
  userEmail: string;
  cabinClass: 'Economy' | 'Business';
  preferredDate?: string;
  onSaveAlert: (alertData: {
    origin: string;
    originCity: string;
    destination: string;
    destinationCity: string;
    targetPriceNgn: number;
    email: string;
    cabinClass: 'Economy' | 'Business';
    preferredDate?: string;
  }) => void;
}

export const FlightPriceAlertModal: React.FC<FlightPriceAlertModalProps> = ({
  isOpen,
  onClose,
  origin,
  originCity,
  destination,
  destinationCity,
  currentLowestFare,
  userEmail,
  cabinClass,
  preferredDate,
  onSaveAlert,
}) => {
  const [email, setEmail] = useState<string>(userEmail || '');
  const [targetPrice, setTargetPrice] = useState<number>(() => {
    // Default to ~10% below current lowest fare rounded to nearest 500
    const benchmark = currentLowestFare > 0 ? currentLowestFare : 90000;
    return Math.max(10000, Math.round((benchmark * 0.9) / 500) * 500);
  });
  const [selectedPreset, setSelectedPreset] = useState<string>('-10%');
  const [error, setError] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Sync state when modal opens or route/fare changes
  useEffect(() => {
    if (isOpen) {
      if (userEmail && !email) {
        setEmail(userEmail);
      }
      const benchmark = currentLowestFare > 0 ? currentLowestFare : 90000;
      const initialTarget = Math.max(10000, Math.round((benchmark * 0.9) / 500) * 500);
      setTargetPrice(initialTarget);
      setSelectedPreset('-10%');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen, currentLowestFare, userEmail]);

  if (!isOpen) return null;

  const benchmarkFare = currentLowestFare > 0 ? currentLowestFare : 90000;

  // Percentage preset handler
  const handleSelectPreset = (percent: number, label: string) => {
    setSelectedPreset(label);
    const calculated = Math.max(10000, Math.round((benchmarkFare * (1 - percent / 100)) / 500) * 500);
    setTargetPrice(calculated);
    setError('');
  };

  const handleCustomPriceChange = (valueStr: string) => {
    setSelectedPreset('custom');
    const cleaned = valueStr.replace(/[^\d]/g, '');
    const num = Number(cleaned);
    setTargetPrice(num);
    if (num > 0) setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email.trim())) {
      setError('Please provide a valid email address to receive price drop notifications.');
      return;
    }

    if (!targetPrice || targetPrice < 5000) {
      setError('Please specify a valid target price threshold (minimum ₦5,000).');
      return;
    }

    setIsSubmitting(true);
    setError('');

    onSaveAlert({
      origin,
      originCity,
      destination,
      destinationCity,
      targetPriceNgn: targetPrice,
      email: email.trim(),
      cabinClass,
      preferredDate,
    });

    setIsSubmitting(false);
    onClose();
  };

  const savingsNgn = benchmarkFare - targetPrice;
  const savingsPercent = benchmarkFare > 0 ? Math.round((savingsNgn / benchmarkFare) * 100) : 0;
  const isAlreadyBelow = targetPrice >= benchmarkFare;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150"
      role="dialog"
      aria-modal="true"
      aria-labelledby="price-alert-modal-title"
    >
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
              <BellRing className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 id="price-alert-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
                Set Route Price Drop Alert
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Get notified the instant Nigerian domestic fares fall below your target.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Route Summary Benchmark Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-mono font-bold text-sm px-2.5 py-1 bg-amber-400 text-slate-950 rounded-lg">
                  {origin}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400" />
                <span className="font-mono font-bold text-sm px-2.5 py-1 bg-amber-400 text-slate-950 rounded-lg">
                  {destination}
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 ml-1">
                  {originCity} → {destinationCity}
                </span>
              </div>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                {cabinClass}
              </span>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-700/60 text-xs">
              <span className="text-slate-500 dark:text-slate-400">Current Lowest Market Fare:</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">
                ₦{benchmarkFare.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Target Price Threshold Input & Preset Shortcuts */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="target-price-input" className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <TrendingDown className="w-4 h-4 text-amber-500" />
                <span>Target Price Limit (₦ NGN) *</span>
              </label>
              {savingsNgn > 0 && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  Save ₦{savingsNgn.toLocaleString()} ({savingsPercent}% drop)
                </span>
              )}
            </div>

            {/* Presets Chips */}
            <div className="grid grid-cols-4 gap-2">
              {[
                { percent: 5, label: '-5%' },
                { percent: 10, label: '-10%' },
                { percent: 15, label: '-15%' },
                { percent: 20, label: '-20%' },
              ].map((p) => {
                const targetForPreset = Math.max(10000, Math.round((benchmarkFare * (1 - p.percent / 100)) / 500) * 500);
                const isSelected = selectedPreset === p.label;
                return (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => handleSelectPreset(p.percent, p.label)}
                    className={`py-1.5 px-2 text-xs font-bold rounded-xl border text-center transition-all ${
                      isSelected
                        ? 'bg-amber-400 border-amber-500 text-slate-950 shadow-xs'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-slate-300'
                    }`}
                  >
                    <div>{p.label}</div>
                    <div className="text-[10px] font-normal opacity-80 font-mono">
                      ₦{(targetForPreset / 1000).toFixed(0)}k
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Number Input */}
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400 dark:text-slate-500">
                ₦
              </span>
              <input
                id="target-price-input"
                type="text"
                required
                value={targetPrice ? targetPrice.toLocaleString() : ''}
                onChange={(e) => handleCustomPriceChange(e.target.value)}
                placeholder="e.g. 85,000"
                className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-bold font-mono text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>

            {/* Helper Notice if already below */}
            {isAlreadyBelow ? (
              <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-[11px] text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 shrink-0 text-amber-500" />
                <span>
                  <strong>Instant Trigger:</strong> Your target (₦{targetPrice.toLocaleString()}) is already at or above the current lowest market fare (₦{benchmarkFare.toLocaleString()}). Subscribing will trigger an immediate alert!
                </span>
              </div>
            ) : (
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                You will be notified whenever any airline publishes a fare at or below <strong>₦{targetPrice.toLocaleString()}</strong>.
              </p>
            )}
          </div>

          {/* Email Notification Destination */}
          <div className="space-y-1.5">
            <label htmlFor="price-alert-email" className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Mail className="w-4 h-4 text-amber-500" />
              <span>Notification Email Address *</span>
            </label>
            <input
              id="price-alert-email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. 3pleadata@gmail.com"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              We send instant dispatch alerts when fares drop. Zero spam. Unsubscribe anytime.
            </p>
          </div>

          {/* Trust Footnote */}
          <div className="flex items-center gap-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 rounded-xl text-emerald-900 dark:text-emerald-300 text-xs">
            <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>
              Real-time domestic route monitoring across Air Peace, Arik, Aero, Ibom Air, United Nigeria, and others.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold text-xs rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-all shadow-xs active:scale-[0.99] flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              <Bell className="w-4 h-4" />
              <span>Subscribe to Price Alert</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
