import React, { useState } from 'react';
import { AppState } from '../services/storage';
import { ApiResellerKey, Transaction } from '../types';
import {
  Store,
  DollarSign,
  TrendingUp,
  Percent,
  Key,
  Copy,
  Check,
  Plus,
  Play,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Send,
} from 'lucide-react';
import { DoubleEntryLedgerEngine } from '../services/ledger';

interface RetailerPortalProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  onViewReceipt: (tx: Transaction) => void;
  language: 'en' | 'ha';
}

export const RetailerPortal: React.FC<RetailerPortalProps> = ({
  state,
  updateState,
  onViewReceipt,
  language,
}) => {
  const [activeTab, setActiveTab] = useState<'pricing' | 'bulk' | 'commissions' | 'apikeys'>('pricing');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Bulk transaction state
  const [bulkService, setBulkService] = useState<'airtime' | 'data'>('airtime');
  const [bulkNetwork, setBulkNetwork] = useState<string>('MTN');
  const [bulkAmount, setBulkAmount] = useState<string>('500');
  const [bulkNumbers, setBulkNumbers] = useState<string>(
    '08031234567\n08149876543\n07055566778\n09012345678'
  );
  const [bulkResults, setBulkResults] = useState<
    Array<{ phone: string; status: 'success' | 'failed'; ref: string }>
  >([]);
  const [bulkLoading, setBulkLoading] = useState<boolean>(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleGenerateNewKey = () => {
    const newKey: ApiResellerKey = {
      id: `apk_${Date.now()}`,
      userId: state.currentUser.id,
      keyName: `API Key Generated on ${new Date().toLocaleDateString()}`,
      prefix: '3plea_live_',
      keyMasked: `3plea_live_${Math.random().toString(36).substring(2, 8)}••••••••9941`,
      environment: 'live',
      rateLimitPerMin: 120,
      totalRequests: 0,
      active: true,
      createdAt: new Date().toISOString(),
    };

    updateState({
      apiKeys: [newKey, ...state.apiKeys],
    });
  };

  const handleTransferCommissions = () => {
    if (state.currentUser.commissionBalance <= 0) return;
    const amountToTransfer = state.currentUser.commissionBalance;

    const ref = `3PA-COM-PAYOUT-${Date.now()}`;
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      reference: ref,
      idempotencyKey: `idem_com_${Date.now()}`,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userPhone: state.currentUser.phone,
      type: 'commission_payout',
      amount: amountToTransfer,
      fee: 0,
      discount: 0,
      totalDebited: amountToTransfer,
      status: 'successful',
      provider: 'Internal Commission Clearing',
      productName: 'Commission Payout to Main Wallet',
      recipient: 'Main Wallet',
      metadata: { transferType: 'commission_settlement' },
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    const updatedUser = {
      ...state.currentUser,
      walletBalance: state.currentUser.walletBalance + amountToTransfer,
      commissionBalance: 0,
    };

    updateState({
      currentUser: updatedUser,
      transactions: [newTx, ...state.transactions],
    });

    alert(`₦${amountToTransfer.toLocaleString()} in accumulated commissions successfully transferred to your available balance.`);
  };

  const handleExecuteBulk = async () => {
    const rawList = bulkNumbers
      .split('\n')
      .map((n) => n.trim())
      .filter((n) => n.length >= 11);

    if (rawList.length === 0) {
      alert('Please enter at least one valid phone number.');
      return;
    }

    const unitAmount = parseFloat(bulkAmount) || 0;
    const totalCost = unitAmount * rawList.length;

    if (state.currentUser.walletBalance < totalCost) {
      alert(`Insufficient balance. You need ₦${totalCost.toLocaleString()} to process ${rawList.length} recipients.`);
      return;
    }

    setBulkLoading(true);
    setBulkResults([]);

    const results: Array<{ phone: string; status: 'success' | 'failed'; ref: string }> = [];
    const newTxs: Transaction[] = [];

    for (let i = 0; i < rawList.length; i++) {
      const phone = rawList[i];
      await new Promise((r) => setTimeout(r, 250)); // Fast sequential execution simulation
      const ref = `3PA-BULK-${Date.now()}-${i + 1}`;
      results.push({ phone, status: 'success', ref });

      newTxs.push({
        id: `tx_blk_${Date.now()}_${i}`,
        reference: ref,
        idempotencyKey: `idem_blk_${Date.now()}_${i}`,
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        userPhone: state.currentUser.phone,
        type: 'airtime',
        amount: unitAmount,
        fee: 0,
        discount: Math.round(unitAmount * 0.035),
        totalDebited: unitAmount - Math.round(unitAmount * 0.035),
        status: 'successful',
        provider: 'Pairgate API',
        productName: `Bulk ${bulkNetwork} Airtime`,
        recipient: phone,
        metadata: { bulkBatchId: `BATCH_${Date.now()}` },
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      });
    }

    const updatedUser = {
      ...state.currentUser,
      walletBalance: state.currentUser.walletBalance - totalCost,
    };

    updateState({
      currentUser: updatedUser,
      transactions: [...newTxs, ...state.transactions],
    });

    setBulkResults(results);
    setBulkLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {language === 'ha' ? 'Dandalin Dillalai & Reseller' : 'Retailer, Agent & API Reseller Hub'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Wholesale discount margins, high-volume bulk dispensing, and sub-reseller developer keys.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold bg-amber-50 dark:bg-amber-500/15 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-500/30 px-3 py-1 rounded-full">
            Role: {state.currentUser.role.toUpperCase()}
          </span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Wholesale Balance</span>
            <DollarSign className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            ₦{state.currentUser.walletBalance.toLocaleString()}
          </div>
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 block">Prefunded balance available</span>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Accumulated Commissions</span>
            <TrendingUp className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
            ₦{state.currentUser.commissionBalance.toLocaleString()}
          </div>
          <button
            onClick={handleTransferCommissions}
            className="text-[11px] font-bold text-slate-900 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 underline mt-1 block"
          >
            Transfer to Main Wallet →
          </button>
        </div>

        <div className="p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs mb-1">
            <span>Active API Reseller Keys</span>
            <Key className="w-4 h-4 text-slate-600 dark:text-slate-400" />
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {state.apiKeys.filter((k) => k.active).length} Keys
          </div>
          <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 block">Rate Limit: 120 req/min</span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        {[
          { id: 'pricing', label: 'Wholesale Pricing Matrix' },
          { id: 'bulk', label: 'Bulk VTU Dispenser' },
          { id: 'apikeys', label: 'Reseller API Credentials' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`py-3 px-5 text-xs font-bold border-b-2 transition-all whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-slate-900 dark:border-amber-400 text-slate-900 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Wholesale Pricing Matrix */}
      {activeTab === 'pricing' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Digital Product Wholesale Margins</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Transparent breakdown of Provider Cost, Wholesale Reseller Price, Standard Customer Price, and Your Margin
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Network / Product</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Provider Cost</th>
                  <th className="py-3 px-4 text-right">Wholesale Price (You Pay)</th>
                  <th className="py-3 px-4 text-right">Retail Sell Price</th>
                  <th className="py-3 px-4 text-right text-emerald-700 dark:text-emerald-400">Your Margin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {state.dataPlans.slice(0, 10).map((plan) => {
                  const margin = plan.customerPrice - plan.retailerPrice;
                  return (
                    <tr key={plan.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                        {plan.network} {plan.name}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">{plan.planType}</td>
                      <td className="py-3 px-4 text-right font-mono text-slate-400 dark:text-slate-500">
                        ₦{plan.providerCost.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₦{plan.retailerPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-600 dark:text-slate-300">
                        ₦{plan.customerPrice.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        +₦{margin.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Bulk VTU Dispenser */}
      {activeTab === 'bulk' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Bulk Airtime & Data Dispenser</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Execute airtime top-ups to multiple phone numbers simultaneously in a single click.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Network
                </label>
                <select
                  value={bulkNetwork}
                  onChange={(e) => setBulkNetwork(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="MTN" className="dark:bg-slate-900">MTN Nigeria</option>
                  <option value="AIRTEL" className="dark:bg-slate-900">Airtel Nigeria</option>
                  <option value="GLO" className="dark:bg-slate-900">Glo Mobile</option>
                  <option value="9MOBILE" className="dark:bg-slate-900">9mobile</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Unit Amount (₦)
                </label>
                <input
                  type="number"
                  value={bulkAmount}
                  onChange={(e) => setBulkAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Recipient Phone Numbers (One Per Line)
              </label>
              <textarea
                rows={6}
                value={bulkNumbers}
                onChange={(e) => setBulkNumbers(e.target.value)}
                placeholder="08031234567&#10;08149876543"
                className="w-full px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                Total numbers:{' '}
                {
                  bulkNumbers
                    .split('\n')
                    .map((n) => n.trim())
                    .filter((n) => n.length >= 11).length
                }
              </span>
            </div>

            <button
              type="button"
              onClick={handleExecuteBulk}
              disabled={bulkLoading}
              className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
            >
              {bulkLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400 dark:text-slate-950" />
                  <span>Processing Bulk Batch...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 text-amber-400 dark:text-slate-950" />
                  <span>Execute Bulk Dispatch</span>
                </>
              )}
            </button>
          </div>

          {/* Results Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">Batch Execution Results</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Real-time per-item delivery status and reference codes
              </p>

              {bulkResults.length === 0 ? (
                <div className="py-16 text-center text-slate-400 dark:text-slate-500 text-xs">
                  No batch currently running. Click "Execute Bulk Dispatch" to start.
                </div>
              ) : (
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {bulkResults.map((r, i) => (
                    <div
                      key={i}
                      className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2 font-mono font-bold text-slate-900 dark:text-white">
                        <CheckCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span>{r.phone}</span>
                      </div>
                      <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">{r.ref}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {bulkResults.length > 0 && (
              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs">
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {bulkResults.length} / {bulkResults.length} Delivered
                </span>
                <span className="text-slate-500 dark:text-slate-400">Auto-logged in central ledger</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Reseller API Keys */}
      {activeTab === 'apikeys' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Reseller API Credentials</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Use your private reseller API keys to automate Airtime, Data, and Bills directly from your external software.
              </p>
            </div>
            <button
              onClick={handleGenerateNewKey}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Generate New Key</span>
            </button>
          </div>

          <div className="space-y-3">
            {state.apiKeys.map((k) => (
              <div
                key={k.id}
                className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900 dark:text-white">{k.keyName}</span>
                    <span className="text-[10px] bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 px-2 py-0.5 rounded font-mono uppercase">
                      {k.environment}
                    </span>
                  </div>
                  <div className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1 select-all">
                    {k.keyMasked}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Rate Limit: {k.rateLimitPerMin} req/min · Total Calls: {k.totalRequests.toLocaleString()}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleCopy(k.keyMasked, k.id)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    {copiedKey === k.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Key</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="p-4 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200">
            <span className="font-bold block">Security Notice:</span>
            Never commit raw API keys to client-side browsers or public git repositories. Pass keys via the HTTP header{' '}
            <code className="font-mono bg-amber-100 dark:bg-amber-900/60 px-1 py-0.5 rounded">Authorization: Bearer &lt;YOUR_KEY&gt;</code>.
          </div>
        </div>
      )}
    </div>
  );
};
