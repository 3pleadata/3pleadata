import React, { useState } from 'react';
import { AppState } from '../services/storage';
import { AirtimeNetwork, Transaction } from '../types';
import { PinModal } from '../components/PinModal';
import { Smartphone, Zap, ShieldCheck, Check, AlertCircle, Loader2 } from 'lucide-react';
import { providerService } from '../services/providers';
import { DoubleEntryLedgerEngine } from '../services/ledger';

interface AirtimePageProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  onViewReceipt: (tx: Transaction) => void;
  language: 'en' | 'ha';
}

export const AirtimePage: React.FC<AirtimePageProps> = ({
  state,
  updateState,
  onViewReceipt,
  language,
}) => {
  const [selectedNetwork, setSelectedNetwork] = useState<AirtimeNetwork>(state.networks[0]);
  const [phone, setPhone] = useState<string>('08031234567');
  const [amount, setAmount] = useState<string>('2000');
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const numAmount = parseFloat(amount) || 0;
  // Calculate discount based on user role (retailers get higher discount)
  const discountRate =
    state.currentUser.role === 'retailer' || state.currentUser.role === 'agent'
      ? selectedNetwork.retailerDiscountPercentage
      : selectedNetwork.discountPercentage;
  const discountAmount = Math.round((numAmount * discountRate) / 100);
  const totalToPay = Math.max(0, numAmount - discountAmount);

  const presets = [200, 500, 1000, 2000, 5000, 10000];

  const handleInitiate = () => {
    setError('');
    if (!phone || phone.length < 11) {
      setError(language === 'ha' ? 'Shigar da lambar waya mai lamba 11 ingantacciya.' : 'Please enter a valid 11-digit Nigerian phone number.');
      return;
    }
    if (numAmount < selectedNetwork.minAmount || numAmount > selectedNetwork.maxAmount) {
      setError(`Amount must be between ₦${selectedNetwork.minAmount} and ₦${selectedNetwork.maxAmount.toLocaleString()}`);
      return;
    }
    if (state.currentUser.walletBalance < totalToPay) {
      setError(language === 'ha' ? 'Kudin asusunka bai isa ba. Sanya kudi a asusu.' : 'Insufficient wallet balance. Please fund your wallet.');
      return;
    }

    setShowPinModal(true);
  };

  const handleExecutePurchase = async () => {
    setShowPinModal(false);
    setLoading(true);
    setError('');

    try {
      const ref = `3PA-AIR-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const activeProvider = providerService.getActiveProviderForService('airtime');

      // Call Unified Provider Adapter
      const response = await providerService.executeAirtimePurchase(
        selectedNetwork.code,
        numAmount,
        phone,
        ref
      );

      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        reference: ref,
        idempotencyKey: `idem_air_${Date.now()}`,
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        userPhone: state.currentUser.phone,
        type: 'airtime',
        amount: numAmount,
        fee: 0,
        discount: discountAmount,
        totalDebited: totalToPay,
        status: response.success ? 'successful' : 'failed',
        provider: activeProvider?.displayName || 'Pairgate API',
        providerReference: response.providerReference,
        productName: `${selectedNetwork.name} Airtime VTU`,
        recipient: phone,
        metadata: {
          network: selectedNetwork.code,
          discountPercentage: discountRate,
          providerResponse: response.rawResponse,
        },
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      // Generate ledger entries
      const ledgerEntries = DoubleEntryLedgerEngine.recordVtuPurchase(
        newTx,
        activeProvider?.displayName || 'Pairgate'
      );

      // Update state atomically
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
      setError(err?.message || 'Transaction failed. Please try again.');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {language === 'ha' ? 'Katin Waya na VTU (Airtime)' : 'Airtime VTU Top-Up'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Instant automated VTU top-up across all Nigerian telecom networks with guaranteed cashback.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-6">
        {/* Network Selection */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2.5">
            {language === 'ha' ? 'Zabi Layin Sadarwa' : 'Select Network Operator'}
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {state.networks.map((net) => {
              const isSelected = selectedNetwork.id === net.id;
              return (
                <button
                  key={net.id}
                  type="button"
                  onClick={() => setSelectedNetwork(net)}
                  className={`p-3.5 rounded-xl border text-center transition-all relative ${
                    isSelected
                      ? 'border-slate-900 bg-slate-900 dark:border-amber-400 dark:bg-amber-500/10 text-white shadow-sm ring-1 ring-slate-900 dark:ring-amber-400'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold">{net.name}</div>
                  <div
                    className={`text-[11px] font-medium mt-0.5 ${
                      isSelected ? 'text-amber-300 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {discountRate}% {language === 'ha' ? 'Ragi' : 'Cashback'}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Phone number */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
            {language === 'ha' ? 'Lambar Waya (11 Digits)' : 'Recipient Phone Number'}
          </label>
          <div className="relative">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-mono text-xs">
              🇳🇬 +234
            </span>
            <input
              type="tel"
              maxLength={11}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
              placeholder="08031234567"
              className="w-full pl-20 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-amber-400/20 focus:border-slate-900 dark:focus:border-amber-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>
          <div className="flex gap-2 mt-2">
            {['08031234567', '08149876543', '07055566778'].map((savedNum) => (
              <button
                key={savedNum}
                type="button"
                onClick={() => setPhone(savedNum)}
                className="text-[10px] text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded transition-colors"
              >
                {savedNum}
              </button>
            ))}
          </div>
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
              min={selectedNetwork.minAmount}
              max={selectedNetwork.maxAmount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 2000"
              className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-base font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-amber-400/20 focus:border-slate-900 dark:focus:border-amber-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          {/* Quick presets */}
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-2.5">
            {presets.map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setAmount(val.toString())}
                className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all ${
                  amount === val.toString()
                    ? 'bg-slate-900 dark:bg-amber-500 dark:text-slate-950 text-white border-slate-900 dark:border-amber-500 font-bold'
                    : 'bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                ₦{val.toLocaleString()}
              </button>
            ))}
          </div>
        </div>

        {/* Order Summary Box */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Airtime Face Value:</span>
            <span className="font-mono text-slate-900 dark:text-slate-200">₦{numAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-medium">
            <span>Instant Cashback Discount ({discountRate}%):</span>
            <span className="font-mono">-₦{discountAmount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-slate-500 dark:text-slate-400">
            <span>Unified Provider Route:</span>
            <span className="text-slate-800 dark:text-slate-200 font-medium">Pairgate API / ClubKonnect</span>
          </div>
          <div className="flex justify-between font-bold text-slate-900 dark:text-white text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
            <span>Amount to Debit Wallet:</span>
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
              <span>Processing VTU Request...</span>
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-amber-400 dark:text-slate-950" />
              <span>
                {language === 'ha' ? 'Sayi Katin Waya Yanzu' : 'Purchase Airtime Now'} (₦{totalToPay.toLocaleString()})
              </span>
            </>
          )}
        </button>
      </div>

      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handleExecutePurchase}
        title="Authorize Airtime Purchase"
        amount={totalToPay}
        recipient={`${selectedNetwork.name} (${phone})`}
      />
    </div>
  );
};
