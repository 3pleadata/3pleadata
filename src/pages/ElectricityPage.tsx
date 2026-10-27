import React, { useState } from 'react';
import { AppState } from '../services/storage';
import { ElectricityDisco, Transaction } from '../types';
import { PinModal } from '../components/PinModal';
import { Zap, ShieldCheck, Check, AlertCircle, Loader2, CheckCircle2, UserCheck } from 'lucide-react';
import { providerService, CustomerValidationResult } from '../services/providers';
import { DoubleEntryLedgerEngine } from '../services/ledger';

interface ElectricityPageProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  onViewReceipt: (tx: Transaction) => void;
  language: 'en' | 'ha';
}

export const ElectricityPage: React.FC<ElectricityPageProps> = ({
  state,
  updateState,
  onViewReceipt,
  language,
}) => {
  const [selectedDisco, setSelectedDisco] = useState<ElectricityDisco>(state.discos[0]); // KEDCO Kano
  const [meterType, setMeterType] = useState<'prepaid' | 'postpaid'>('prepaid');
  const [meterNumber, setMeterNumber] = useState<string>('04192847562');
  const [amount, setAmount] = useState<string>('10000');
  const [validationResult, setValidationResult] = useState<CustomerValidationResult | null>(null);
  const [validating, setValidating] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const numAmount = parseFloat(amount) || 0;
  const convenienceFee = selectedDisco.convenienceFee;
  const totalToPay = numAmount + convenienceFee;

  const handleValidateMeter = async () => {
    if (!meterNumber || meterNumber.length < 8) {
      setError('Please enter a valid meter number (at least 8-11 digits).');
      return;
    }
    setError('');
    setValidating(true);
    setValidationResult(null);

    try {
      const res = await providerService.validateCustomer('electricity', meterNumber, selectedDisco.code);
      setValidationResult(res);
      setValidating(false);
    } catch (err: any) {
      setValidating(false);
      setError('Could not validate meter number. Please verify input.');
    }
  };

  const handleInitiate = () => {
    setError('');
    if (!meterNumber || meterNumber.length < 8) {
      setError('Please enter a valid meter number.');
      return;
    }
    if (numAmount < 1000) {
      setError('Minimum electricity recharge amount is ₦1,000.');
      return;
    }
    if (state.currentUser.walletBalance < totalToPay) {
      setError(language === 'ha' ? 'Kudin asusunka bai isa ba. Sanya kudi a asusu.' : 'Insufficient wallet balance. Please fund your wallet.');
      return;
    }

    setShowPinModal(true);
  };

  const handleExecutePayment = async () => {
    setShowPinModal(false);
    setLoading(true);
    setError('');

    try {
      const ref = `3PA-ELC-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const activeProvider = providerService.getActiveProviderForService('electricity');

      // Call Unified Provider Adapter
      const response = await providerService.executeElectricityPayment(
        selectedDisco.code,
        meterNumber,
        numAmount,
        ref,
        meterType === 'prepaid'
      );

      const customerName = validationResult?.customerName || 'ALHAJI MUSA SULAIMAN - TARAUNI KANO';
      const token = response.data?.token || '4928-1193-8472-0021';
      const units = response.data?.units || '44.4 kWh';

      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        reference: ref,
        idempotencyKey: `idem_elc_${Date.now()}`,
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        userPhone: state.currentUser.phone,
        type: 'electricity',
        amount: numAmount,
        fee: convenienceFee,
        discount: 0,
        totalDebited: totalToPay,
        status: response.success ? 'successful' : 'failed',
        provider: activeProvider?.displayName || 'Pairgate API',
        providerReference: response.providerReference,
        productName: `${selectedDisco.name} (${meterType.toUpperCase()})`,
        recipient: meterNumber,
        metadata: {
          disco: selectedDisco.code,
          meterNumber,
          customerName,
          token,
          units,
          providerResponse: response.rawResponse,
        },
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      // Ledger entry
      const ledgerEntries = DoubleEntryLedgerEngine.recordVtuPurchase(
        newTx,
        activeProvider?.displayName || 'Pairgate'
      );

      // Atomic balance update
      const updatedUser = {
        ...state.currentUser,
        walletBalance: state.currentUser.walletBalance - totalToPay,
      };

      updateState({
        currentUser: updatedUser,
        transactions: [newTx, ...state.transactions],
        ledger: [...state.ledger, ...ledgerEntries],
      });

      setLoading(false);
      onViewReceipt(newTx);
    } catch (err: any) {
      setLoading(false);
      setError(err?.message || 'Payment failed. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {language === 'ha' ? 'Kudin Wutar Lantarki (DISCOs)' : 'Electricity Bill Payment'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Pay KEDCO Kano Electric, AEDC Abuja, EKEDC, and other Nigerian electricity distribution companies with instant prepaid token generation.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        {/* DISCO selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            {language === 'ha' ? 'Kamfanin Wutar Lantarki (DISCO)' : 'Select Electricity Distribution Company'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {state.discos.map((disco) => {
              const isSelected = selectedDisco.id === disco.id;
              return (
                <button
                  key={disco.id}
                  type="button"
                  onClick={() => {
                    setSelectedDisco(disco);
                    setValidationResult(null);
                  }}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-slate-900 dark:border-amber-400 bg-slate-900 dark:bg-amber-500/15 text-white ring-1 ring-slate-900 dark:ring-amber-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 hover:border-slate-300 dark:hover:border-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div className="text-xs font-bold truncate">{disco.code}</div>
                  <div className={`text-[10px] truncate ${isSelected ? 'text-slate-300 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'}`}>
                    {disco.state}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Meter Type Toggle */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            {language === 'ha' ? 'Nauyin Mita' : 'Meter Account Type'}
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setMeterType('prepaid')}
              className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                meterType === 'prepaid'
                  ? 'bg-slate-900 dark:bg-amber-500 dark:text-slate-950 text-white border-slate-900 dark:border-amber-500 shadow-sm'
                  : 'bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {language === 'ha' ? 'Katin Caji (Prepaid Token)' : 'Prepaid (Instant Token)'}
            </button>
            <button
              type="button"
              onClick={() => setMeterType('postpaid')}
              className={`flex-1 py-2.5 px-4 rounded-xl border text-xs font-bold transition-all ${
                meterType === 'postpaid'
                  ? 'bg-slate-900 dark:bg-amber-500 dark:text-slate-950 text-white border-slate-900 dark:border-amber-500 shadow-sm'
                  : 'bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              {language === 'ha' ? 'Biyan Wata (Postpaid Bill)' : 'Postpaid (Monthly Bill)'}
            </button>
          </div>
        </div>

        {/* Meter Number with Customer Verification */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {language === 'ha' ? 'Lambar Mita' : 'Meter / Account Number'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={meterNumber}
              onChange={(e) => {
                setMeterNumber(e.target.value.replace(/\D/g, ''));
                setValidationResult(null);
              }}
              placeholder="e.g. 04192847562"
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-amber-400/20 focus:border-slate-900 dark:focus:border-amber-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={handleValidateMeter}
              disabled={validating || !meterNumber}
              className="px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors whitespace-nowrap flex items-center gap-1.5 disabled:opacity-50 border border-transparent dark:border-slate-700"
            >
              {validating ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Validating...</span>
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{language === 'ha' ? 'Tantance Mita' : 'Verify Customer'}</span>
                </>
              )}
            </button>
          </div>

          {/* Validation Result Box */}
          {validationResult && (
            <div className="mt-3 p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">{validationResult.customerName}</div>
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  Address: {validationResult.address} · Verified via {selectedDisco.code} API
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {language === 'ha' ? 'Adadin Kudi (NGN ₦)' : 'Recharge Amount (NGN ₦)'}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold text-base">
              ₦
            </span>
            <input
              type="number"
              min="1000"
              step="500"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 10000"
              className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-amber-400/20 focus:border-slate-900 dark:focus:border-amber-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {[2000, 5000, 10000, 20000].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(v.toString())}
                className="py-1 text-xs font-medium border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              >
                ₦{v.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-2">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Electricity Value:</span>
            <span className="font-mono text-slate-900 dark:text-slate-200">₦{numAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>DISCO Convenience Fee:</span>
            <span className="font-mono text-slate-900 dark:text-slate-200">₦{convenienceFee.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Estimated Power Units:</span>
            <span className="font-medium text-emerald-700 dark:text-emerald-400">~{(numAmount / 225).toFixed(1)} kWh</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 dark:text-white text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
            <span>Total Debited:</span>
            <span className="font-mono tabular-nums text-slate-900 dark:text-amber-400">₦{totalToPay.toLocaleString()}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl text-xs border border-red-100 dark:border-red-900/60">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleInitiate}
          disabled={loading || numAmount <= 0}
          className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white font-semibold text-sm rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-400 dark:text-slate-950" />
              <span>Generating Electricity Token...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-amber-400 dark:text-slate-950" />
              <span>
                {language === 'ha' ? 'Biya Kudin Wuta Yanzu' : 'Pay Electricity Bill'} (₦{totalToPay.toLocaleString()})
              </span>
            </>
          )}
        </button>
      </div>

      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handleExecutePayment}
        title="Authorize Electricity Payment"
        amount={totalToPay}
        recipient={`${selectedDisco.code} (${meterNumber})`}
      />
    </div>
  );
};
