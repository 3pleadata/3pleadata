import React, { useState } from 'react';
import { AppState } from '../services/storage';
import { CableTvPackage, Transaction } from '../types';
import { PinModal } from '../components/PinModal';
import { Tv, ShieldCheck, Check, AlertCircle, Loader2, CheckCircle2, UserCheck } from 'lucide-react';
import { providerService, CustomerValidationResult } from '../services/providers';
import { DoubleEntryLedgerEngine } from '../services/ledger';

interface CableTvPageProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  onViewReceipt: (tx: Transaction) => void;
  language: 'en' | 'ha';
}

export const CableTvPage: React.FC<CableTvPageProps> = ({
  state,
  updateState,
  onViewReceipt,
  language,
}) => {
  const [provider, setProvider] = useState<'DSTV' | 'GOTV' | 'STARTIMES'>('DSTV');
  const [smartcard, setSmartcard] = useState<string>('7029184029');
  const [selectedPackage, setSelectedPackage] = useState<CableTvPackage>(state.cablePackages[0]);
  const [validationResult, setValidationResult] = useState<CustomerValidationResult | null>(null);
  const [validating, setValidating] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const availablePackages = state.cablePackages.filter((p) => p.provider === provider);

  const handleValidateSmartcard = async () => {
    if (!smartcard || smartcard.length < 8) {
      setError('Please enter a valid Smartcard / IUC Number.');
      return;
    }
    setError('');
    setValidating(true);
    setValidationResult(null);

    try {
      const res = await providerService.validateCustomer('cable_tv', smartcard, selectedPackage.name);
      setValidationResult(res);
      setValidating(false);
    } catch (err: any) {
      setValidating(false);
      setError('Could not validate smartcard. Check number.');
    }
  };

  const handleInitiate = () => {
    setError('');
    if (!smartcard || smartcard.length < 8) {
      setError('Please enter a valid smartcard number.');
      return;
    }
    if (state.currentUser.walletBalance < selectedPackage.price) {
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
      const ref = `3PA-CBL-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const activeProvider = providerService.getActiveProviderForService('cableTv');

      const response = await providerService.executeCableTvPayment(
        provider,
        smartcard,
        selectedPackage.name,
        selectedPackage.price,
        ref
      );

      const customerName = validationResult?.customerName || 'SHEHU BELLO (ACTIVE)';

      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        reference: ref,
        idempotencyKey: `idem_cbl_${Date.now()}`,
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        userPhone: state.currentUser.phone,
        type: 'cable_tv',
        amount: selectedPackage.price,
        fee: 0,
        discount: 0,
        totalDebited: selectedPackage.price,
        status: response.success ? 'successful' : 'failed',
        provider: activeProvider?.displayName || 'Pairgate API',
        providerReference: response.providerReference,
        productName: `${provider} Subscription - ${selectedPackage.name}`,
        recipient: smartcard,
        metadata: {
          provider,
          package: selectedPackage.name,
          customerName,
          smartcard,
          channels: selectedPackage.channels,
          providerResponse: response.rawResponse,
        },
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      const ledgerEntries = DoubleEntryLedgerEngine.recordVtuPurchase(
        newTx,
        activeProvider?.displayName || 'Pairgate'
      );

      const updatedUser = {
        ...state.currentUser,
        walletBalance: state.currentUser.walletBalance - selectedPackage.price,
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
      setError(err?.message || 'Cable TV payment failed.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {language === 'ha' ? 'Katin Talabijin na Cable TV' : 'Cable TV Subscriptions'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Instant recharge and renewal for DSTV, GOtv, and StarTimes decoders with real-time IUC validation.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        {/* Provider Tabs */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            {language === 'ha' ? 'Zabi Kamfanin Talabijin' : 'Select TV Provider'}
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(['DSTV', 'GOTV', 'STARTIMES'] as const).map((prov) => {
              const isSelected = provider === prov;
              return (
                <button
                  key={prov}
                  type="button"
                  onClick={() => {
                    setProvider(prov);
                    const first = state.cablePackages.find((p) => p.provider === prov);
                    if (first) setSelectedPackage(first);
                    setValidationResult(null);
                  }}
                  className={`py-3 px-4 rounded-xl border font-bold text-xs transition-all ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-amber-500 dark:text-slate-950 text-white border-slate-900 dark:border-amber-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {prov}
                </button>
              );
            })}
          </div>
        </div>

        {/* Smartcard / IUC input */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {language === 'ha' ? 'Lambar Smartcard / IUC' : 'Smartcard / IUC Decoder Number'}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={smartcard}
              onChange={(e) => {
                setSmartcard(e.target.value.replace(/\D/g, ''));
                setValidationResult(null);
              }}
              placeholder="e.g. 7029184029"
              className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-amber-400/20 focus:border-slate-900 dark:focus:border-amber-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <button
              type="button"
              onClick={handleValidateSmartcard}
              disabled={validating || !smartcard}
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
                  <span>{language === 'ha' ? 'Tantance Lambar' : 'Verify IUC'}</span>
                </>
              )}
            </button>
          </div>

          {validationResult && (
            <div className="mt-3 p-3.5 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">{validationResult.customerName}</div>
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
                  Smartcard Active · Validated via {provider} Gateway
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Package Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
            {language === 'ha' ? 'Zabi Kunshin Tashoshi' : 'Select Subscription Package'}
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {availablePackages.map((pkg) => {
              const isSelected = selectedPackage.id === pkg.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPackage(pkg)}
                  className={`p-3.5 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-slate-900 dark:border-amber-400 bg-white dark:bg-slate-900 ring-2 ring-slate-900 dark:ring-amber-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{pkg.name}</span>
                    <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                      {pkg.channels}+ Channels
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-bold text-slate-900 dark:text-amber-400 font-mono tabular-nums">
                    ₦{pkg.price.toLocaleString()}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Provider:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-200">{provider}</span>
          </div>
          <div className="flex justify-between text-slate-600 dark:text-slate-400">
            <span>Package:</span>
            <span className="font-semibold text-slate-900 dark:text-slate-200">{selectedPackage.name}</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 dark:text-white text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
            <span>Total Debited:</span>
            <span className="font-mono tabular-nums text-slate-900 dark:text-amber-400">₦{selectedPackage.price.toLocaleString()}</span>
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
          disabled={loading}
          className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white font-semibold text-sm rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-amber-400 dark:text-slate-950" />
              <span>Renewing Subscription...</span>
            </>
          ) : (
            <>
              <Tv className="w-4 h-4 text-amber-400 dark:text-slate-950" />
              <span>
                {language === 'ha' ? 'Biya Katin Talabijin' : 'Activate Cable TV'} (₦{selectedPackage.price.toLocaleString()})
              </span>
            </>
          )}
        </button>
      </div>

      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handleExecutePayment}
        title="Authorize Cable TV Payment"
        amount={selectedPackage.price}
        recipient={`${provider} (${smartcard})`}
      />
    </div>
  );
};
