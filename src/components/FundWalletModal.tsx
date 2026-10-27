import React, { useState } from 'react';
import { CreditCard, Building2, Smartphone, ShieldCheck, X, Check, Loader2 } from 'lucide-react';

interface FundWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFundSuccess: (amount: number, gateway: 'paystack' | 'monnify', ref: string) => void;
  currentBalance: number;
}

export const FundWalletModal: React.FC<FundWalletModalProps> = ({
  isOpen,
  onClose,
  onFundSuccess,
  currentBalance,
}) => {
  const [amount, setAmount] = useState<string>('50000');
  const [gateway, setGateway] = useState<'paystack' | 'monnify'>('paystack');
  const [loading, setLoading] = useState<boolean>(false);
  const [step, setStep] = useState<'select' | 'processing' | 'done'>('select');

  if (!isOpen) return null;

  const presets = [5000, 10000, 20000, 50000, 100000, 250000];

  const handleFund = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount < 100) return;

    setLoading(true);
    setStep('processing');

    // Simulate Paystack / Monnify server side verification and webhook settlement
    setTimeout(() => {
      const ref = `3PA-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      setLoading(false);
      setStep('done');
      setTimeout(() => {
        onFundSuccess(numAmount, gateway, ref);
        onClose();
        setStep('select');
      }, 1000);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Fund Your 3PLE A Wallet</h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">Current Balance: ₦{currentBalance.toLocaleString()}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {step === 'processing' ? (
          <div className="p-10 text-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400 mx-auto mb-3" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">Contacting {gateway === 'paystack' ? 'Paystack' : 'Monnify'} Gateway</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Verifying server-side webhook signature and reserving ledger entries...</p>
          </div>
        ) : step === 'done' ? (
          <div className="p-10 text-center">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h4 className="text-base font-bold text-slate-900 dark:text-white">Payment Verified!</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">₦{parseFloat(amount).toLocaleString()} added to your wallet balance.</p>
          </div>
        ) : (
          <div className="p-6 space-y-5">
            {/* Amount input */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Enter Amount (NGN ₦)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-base">
                  ₦
                </span>
                <input
                  type="number"
                  min="100"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="e.g. 50,000"
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-lg font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                />
              </div>

              {/* Presets */}
              <div className="grid grid-cols-3 gap-1.5 mt-2.5">
                {presets.map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setAmount(val.toString())}
                    className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all ${
                      amount === val.toString()
                        ? 'bg-slate-900 dark:bg-amber-400 border-slate-900 dark:border-amber-400 text-white dark:text-slate-950 shadow-sm font-bold'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    ₦{val.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>

            {/* Gateway selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                Select Approved Payment Gateway
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setGateway('paystack')}
                  className={`p-3 text-left rounded-xl border transition-all ${
                    gateway === 'paystack'
                      ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-600 dark:ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Paystack</span>
                    {gateway === 'paystack' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Debit Card, Apple Pay, Bank USSD</p>
                </button>

                <button
                  type="button"
                  onClick={() => setGateway('monnify')}
                  className={`p-3 text-left rounded-xl border transition-all ${
                    gateway === 'monnify'
                      ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30 ring-1 ring-emerald-600 dark:ring-emerald-500'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-900 dark:text-white">Monnify</span>
                    {gateway === 'monnify' && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">Dedicated Virtual NUBAN Account</p>
                </button>
              </div>
            </div>

            {/* Virtual NUBAN Account information if Monnify is chosen */}
            {gateway === 'monnify' && (
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-semibold">
                  <Building2 className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                  <span>3PLE A Dynamic Virtual Account</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Bank Name:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Wema Bank PLC</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Account Number:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-amber-400 select-all">9840291084</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Beneficiary:</span>
                  <span className="font-medium text-slate-800 dark:text-slate-200">3PLE A / Aliyu M. Kano</span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span>PCI-DSS Level 1 Encrypted & Central Bank of Nigeria compliant gateway channels.</span>
            </div>

            <button
              type="button"
              onClick={handleFund}
              disabled={loading || !amount || parseFloat(amount) <= 0}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 font-bold text-sm rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
            >
              Proceed to Fund ₦{parseFloat(amount || '0').toLocaleString()}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
