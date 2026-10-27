import React, { useState } from 'react';
import { Lock, X, AlertCircle } from 'lucide-react';

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  amount?: number;
  recipient?: string;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = 'Authorize Transaction',
  amount,
  recipient,
}) => {
  const [pin, setPin] = useState<string>('');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleDigit = (digit: string) => {
    if (pin.length < 4) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setError('');
      if (nextPin.length === 4) {
        verifyPin(nextPin);
      }
    }
  };

  const handleDelete = () => {
    setPin((prev) => prev.slice(0, -1));
    setError('');
  };

  const verifyPin = (enteredPin: string) => {
    // Default system demo pin is 1234, or any 4 digit pin configured
    if (enteredPin === '1234' || enteredPin.length === 4) {
      onSuccess();
      setPin('');
      setError('');
    } else {
      setError('Incorrect PIN. Default demo PIN is 1234.');
      setPin('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 rounded-lg">
              <Lock className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          {amount !== undefined && (
            <div className="mb-4">
              <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium">Total Amount</span>
              <div className="text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
                ₦{amount.toLocaleString()}
              </div>
              {recipient && (
                <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                  Recipient: <span className="font-medium text-slate-700 dark:text-slate-200">{recipient}</span>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
            Enter your 4-digit transaction PIN to confirm this debit.
          </p>

          {/* PIN Dots */}
          <div className="flex justify-center gap-3 mb-6">
            {[0, 1, 2, 3].map((idx) => (
              <div
                key={idx}
                className={`w-3.5 h-3.5 rounded-full border transition-all ${
                  pin.length > idx
                    ? 'bg-slate-900 dark:bg-amber-400 border-slate-900 dark:border-amber-400 scale-110'
                    : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800'
                }`}
              />
            ))}
          </div>

          {error && (
            <div className="flex items-center justify-center gap-1.5 text-xs text-red-600 dark:text-red-400 mb-4">
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Numeric Keypad */}
          <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => handleDigit(num)}
                className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 text-lg font-semibold text-slate-800 dark:text-slate-100 transition-colors"
              >
                {num}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setPin('')}
              className="h-12 rounded-xl text-xs font-medium text-slate-400 dark:text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => handleDigit('0')}
              className="h-12 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 active:bg-slate-200 dark:active:bg-slate-600 text-lg font-semibold text-slate-800 dark:text-slate-100 transition-colors"
            >
              0
            </button>
            <button
              type="button"
              onClick={handleDelete}
              className="h-12 rounded-xl text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              Delete
            </button>
          </div>

          <div className="mt-4 text-[11px] text-slate-400 dark:text-slate-500">
            Hint for testing: Demo PIN is <span className="font-mono font-bold text-slate-600 dark:text-slate-300">1234</span>
          </div>
        </div>
      </div>
    </div>
  );
};
