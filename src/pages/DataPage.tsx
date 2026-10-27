import React, { useState } from 'react';
import { AppState } from '../services/storage';
import { DataPlan, Transaction } from '../types';
import { PinModal } from '../components/PinModal';
import { Wifi, ShieldCheck, Check, AlertCircle, Loader2 } from 'lucide-react';
import { providerService } from '../services/providers';
import { DoubleEntryLedgerEngine } from '../services/ledger';

interface DataPageProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  onViewReceipt: (tx: Transaction) => void;
  language: 'en' | 'ha';
}

export const DataPage: React.FC<DataPageProps> = ({
  state,
  updateState,
  onViewReceipt,
  language,
}) => {
  const [selectedNetwork, setSelectedNetwork] = useState<'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE'>('MTN');
  const [selectedPlanType, setSelectedPlanType] = useState<string>('all');
  const [phone, setPhone] = useState<string>('08149876543');
  const [selectedPlan, setSelectedPlan] = useState<DataPlan | null>(state.dataPlans[0]);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const isRetailer = state.currentUser.role === 'retailer' || state.currentUser.role === 'agent' || state.currentUser.role === 'api_reseller';

  const filteredPlans = state.dataPlans.filter((p) => {
    if (p.network !== selectedNetwork) return false;
    if (selectedPlanType !== 'all' && p.planType !== selectedPlanType) return false;
    return p.active;
  });

  const activePlanPrice = selectedPlan
    ? isRetailer
      ? selectedPlan.retailerPrice
      : selectedPlan.customerPrice
    : 0;

  const handleInitiate = () => {
    setError('');
    if (!selectedPlan) {
      setError('Please select a data bundle plan.');
      return;
    }
    if (!phone || phone.length < 11) {
      setError(language === 'ha' ? 'Shigar da lambar waya mai lamba 11 ingantacciya.' : 'Please enter a valid 11-digit phone number.');
      return;
    }
    if (state.currentUser.walletBalance < activePlanPrice) {
      setError(language === 'ha' ? 'Kudin asusunka bai isa ba. Sanya kudi a asusu.' : 'Insufficient wallet balance. Please fund your wallet.');
      return;
    }

    setShowPinModal(true);
  };

  const handleExecutePurchase = async () => {
    if (!selectedPlan) return;
    setShowPinModal(false);
    setLoading(true);
    setError('');

    try {
      const ref = `3PA-DAT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const activeProvider = providerService.getActiveProviderForService('data');

      // Call Unified Provider Adapter
      const response = await providerService.executeDataPurchase(
        selectedPlan.network,
        selectedPlan.name,
        phone,
        ref
      );

      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        reference: ref,
        idempotencyKey: `idem_dat_${Date.now()}`,
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        userPhone: state.currentUser.phone,
        type: 'data',
        amount: activePlanPrice,
        fee: 0,
        discount: 0,
        totalDebited: activePlanPrice,
        status: response.success ? 'successful' : 'failed',
        provider: activeProvider?.displayName || 'ClubKonnect VTU',
        providerReference: response.providerReference,
        productName: `${selectedPlan.name} (${selectedPlan.validity})`,
        recipient: phone,
        metadata: {
          network: selectedPlan.network,
          planType: selectedPlan.planType,
          size: selectedPlan.size,
          providerResponse: response.rawResponse,
        },
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      // Generate double entry ledger
      const ledgerEntries = DoubleEntryLedgerEngine.recordVtuPurchase(
        newTx,
        activeProvider?.displayName || 'ClubKonnect'
      );

      // Atomic balance update
      const updatedUser = {
        ...state.currentUser,
        walletBalance: state.currentUser.walletBalance - activePlanPrice,
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
      setError(err?.message || 'Data purchase failed. Please try again.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {language === 'ha' ? 'Kunshin Data na Intanet' : 'Data Bundles Top-Up'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          High-speed SME, Corporate Gifting & Direct data bundles for MTN, Airtel, Glo, and 9mobile.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form: Network & Recipient */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
          {/* Network selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {language === 'ha' ? 'Layin Sadarwa' : 'Select Network'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(['MTN', 'AIRTEL', 'GLO', '9MOBILE'] as const).map((net) => (
                <button
                  key={net}
                  type="button"
                  onClick={() => {
                    setSelectedNetwork(net);
                    // auto select first matching plan
                    const firstMatch = state.dataPlans.find((p) => p.network === net);
                    if (firstMatch) setSelectedPlan(firstMatch);
                  }}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border text-center transition-all ${
                    selectedNetwork === net
                      ? 'bg-slate-900 dark:bg-amber-500 dark:text-slate-950 text-white border-slate-900 dark:border-amber-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  {net}
                </button>
              ))}
            </div>
          </div>

          {/* Plan Type Filter */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {language === 'ha' ? 'Nauyin Data' : 'Data Category'}
            </label>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                { id: 'all', label: 'All Plans' },
                { id: 'SME', label: 'SME Data (Cheapest)' },
                { id: 'Corporate Gifting', label: 'Corporate Gifting (Fast)' },
                { id: 'Direct / Gifting', label: 'Direct / Gifting' },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedPlanType(cat.id)}
                  className={`py-1.5 px-3 text-xs font-medium rounded-lg text-left transition-all ${
                    selectedPlanType === cat.id
                      ? 'bg-amber-50 dark:bg-amber-500/15 text-amber-950 dark:text-amber-300 font-semibold border border-amber-200 dark:border-amber-500/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {language === 'ha' ? 'Lambar Waya' : 'Recipient Phone Number'}
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
                placeholder="08149876543"
                className="w-full pl-20 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-amber-400/20 focus:border-slate-900 dark:focus:border-amber-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Selected Plan Summary & Checkout Action */}
          {selectedPlan && (
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <div className="font-semibold text-slate-900 dark:text-white">{selectedPlan.name}</div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Validity:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{selectedPlan.validity}</span>
              </div>
              <div className="flex justify-between text-slate-500 dark:text-slate-400">
                <span>Category:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">{selectedPlan.planType}</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 dark:text-white pt-1.5 border-t border-slate-200 dark:border-slate-800">
                <span>Price:</span>
                <span className="font-mono tabular-nums text-sm text-slate-900 dark:text-amber-400">₦{activePlanPrice.toLocaleString()}</span>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl text-xs border border-red-100 dark:border-red-900/60">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleInitiate}
            disabled={loading || !selectedPlan}
            className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white font-semibold text-xs rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400 dark:text-slate-950" />
                <span>Activating Plan...</span>
              </>
            ) : (
              <>
                <Wifi className="w-4 h-4 text-amber-400 dark:text-slate-950" />
                <span>
                  {language === 'ha' ? 'Sayi Kunshin Data' : 'Activate Data Bundle'} (₦{activePlanPrice.toLocaleString()})
                </span>
              </>
            )}
          </button>
        </div>

        {/* Right: Plan Catalog Grid */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Available {selectedNetwork} Bundles ({filteredPlans.length})
            </span>
            {isRetailer && (
              <span className="text-[11px] text-amber-700 dark:text-amber-300 font-semibold bg-amber-50 dark:bg-amber-500/15 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-500/30">
                Wholesale Reseller Pricing Active
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredPlans.map((plan) => {
              const isSelected = selectedPlan?.id === plan.id;
              const price = isRetailer ? plan.retailerPrice : plan.customerPrice;
              return (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => setSelectedPlan(plan)}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-slate-900 dark:border-amber-400 bg-white dark:bg-slate-900 ring-2 ring-slate-900 dark:ring-amber-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-base font-extrabold text-slate-900 dark:text-white">{plan.size}</span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400 font-medium">{plan.name}</span>
                    </div>
                    <span className="text-[10px] font-semibold uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded">
                      {plan.validity}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Price</span>
                      <span className="text-base font-bold text-slate-900 dark:text-amber-400 font-mono tabular-nums">
                        ₦{price.toLocaleString()}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block uppercase">Type</span>
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{plan.planType}</span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handleExecutePurchase}
        title="Authorize Data Bundle Purchase"
        amount={activePlanPrice}
        recipient={`${selectedPlan?.name} (${phone})`}
      />
    </div>
  );
};
