import React, { useState, useEffect, useRef } from 'react';
import { Transaction, TransactionType } from '../types';
import {
  loadAgentConfig,
  saveAgentConfig,
  runCategorizationAudit,
  confirmTransactionClassification,
  confirmAllTransactionClassifications,
  createSampleUncategorizedTransaction,
  AgentConfig,
  loadAuditReports,
} from '../services/aiCategorizerAgent';
import {
  Sparkles,
  Bot,
  CheckCircle2,
  Clock,
  RefreshCw,
  Sliders,
  ChevronDown,
  ChevronUp,
  Tag,
  Plus,
  History,
  Zap,
  Smartphone,
  Wifi,
  Tv,
  GraduationCap,
  Plane,
  Wallet,
  ArrowRightLeft,
  Check,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface TransactionCategorizerWidgetProps {
  transactions: Transaction[];
  onUpdateTransactions: (updated: Transaction[]) => void;
  language: 'en' | 'ha';
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Airtime': <Smartphone className="w-3.5 h-3.5 text-amber-500" />,
  'Data': <Wifi className="w-3.5 h-3.5 text-emerald-500" />,
  'Utility': <Zap className="w-3.5 h-3.5 text-yellow-500" />,
  'Cable TV': <Tv className="w-3.5 h-3.5 text-sky-500" />,
  'Education': <GraduationCap className="w-3.5 h-3.5 text-indigo-500" />,
  'Flight': <Plane className="w-3.5 h-3.5 text-blue-500" />,
  'Wallet Funding': <Wallet className="w-3.5 h-3.5 text-teal-500" />,
  'Internal Transfer': <ArrowRightLeft className="w-3.5 h-3.5 text-purple-500" />,
};

const ALL_CATEGORY_OPTIONS: Array<{ label: string; type: TransactionType }> = [
  { label: 'Utility', type: 'electricity' },
  { label: 'Airtime', type: 'airtime' },
  { label: 'Data', type: 'data' },
  { label: 'Cable TV', type: 'cable_tv' },
  { label: 'Education', type: 'school_fees' },
  { label: 'Flight', type: 'flight_booking' },
  { label: 'Wallet Funding', type: 'wallet_funding' },
  { label: 'Internal Transfer', type: 'wallet_transfer' },
];

export const TransactionCategorizerWidget: React.FC<TransactionCategorizerWidgetProps> = ({
  transactions,
  onUpdateTransactions,
  language,
}) => {
  const [config, setConfig] = useState<AgentConfig>(loadAgentConfig);
  const [isAuditing, setIsAuditing] = useState(false);
  const [lastAuditTime, setLastAuditTime] = useState<Date | null>(null);
  const [secondsUntilNextScan, setSecondsUntilNextScan] = useState(config.reviewIntervalSeconds);
  const [showSettings, setShowSettings] = useState(false);
  const [showAuditLogs, setShowAuditLogs] = useState(false);
  const [justConfirmedId, setJustConfirmedId] = useState<string | null>(null);

  // Filter uncategorized transactions
  const uncategorizedList = transactions.filter(
    (t) => (t.isUncategorized || t.type === 'uncategorized' || t.category === 'Uncategorized') && !t.categoryConfirmed
  );

  const categorizedCount = transactions.filter((t) => !t.isUncategorized && t.type !== 'uncategorized').length;
  const accuracyPercentage = transactions.length > 0 ? Math.round((categorizedCount / transactions.length) * 100) : 100;

  // Ref to hold transactions without causing interval re-creation
  const transactionsRef = useRef(transactions);
  useEffect(() => {
    transactionsRef.current = transactions;
  }, [transactions]);

  // Execute an audit pass
  const handleRunAudit = async (mode: 'autonomous' | 'manual' = 'manual') => {
    if (isAuditing) return;
    setIsAuditing(true);
    try {
      const result = await runCategorizationAudit(transactionsRef.current, mode);
      onUpdateTransactions(result.updatedTransactions);
      setLastAuditTime(new Date());
      setSecondsUntilNextScan(config.reviewIntervalSeconds);
    } catch (err) {
      console.error('Audit run failed:', err);
    } finally {
      setIsAuditing(false);
    }
  };

  // Background Periodic Review Interval
  useEffect(() => {
    if (!config.autoReviewEnabled) return;

    // Run once on mount if there are uncategorized transactions with missing suggestions
    const needsInitialScan = transactionsRef.current.some(
      (t) => (t.isUncategorized || t.type === 'uncategorized') && !t.suggestedCategory
    );
    if (needsInitialScan) {
      handleRunAudit('autonomous');
    }

    const timer = setInterval(() => {
      setSecondsUntilNextScan((prev) => {
        if (prev <= 1) {
          handleRunAudit('autonomous');
          return config.reviewIntervalSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [config.autoReviewEnabled, config.reviewIntervalSeconds]);

  // Handle 1-Click Individual Confirmation
  const handleConfirmOne = (txId: string, category: string, type: TransactionType) => {
    setJustConfirmedId(txId);
    setTimeout(() => setJustConfirmedId(null), 1200);

    const updated = confirmTransactionClassification(txId, category, type, transactions);
    onUpdateTransactions(updated);
  };

  // Handle 1-Click Confirm All
  const handleConfirmAll = () => {
    const updated = confirmAllTransactionClassifications(transactions);
    onUpdateTransactions(updated);

    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {
      // Ignored if confetti fails
    }
  };

  // Add sample uncategorized transaction
  const handleAddSample = () => {
    const sample = createSampleUncategorizedTransaction();
    const updated = [sample, ...transactions];
    onUpdateTransactions(updated);
    // Trigger immediate audit for the new transaction
    setTimeout(() => {
      handleRunAudit('manual');
    }, 200);
  };

  const handleUpdateConfig = (newConfig: Partial<AgentConfig>) => {
    const merged = { ...config, ...newConfig };
    setConfig(merged);
    saveAgentConfig(merged);
    setSecondsUntilNextScan(merged.reviewIntervalSeconds);
  };

  const auditReports = loadAuditReports();

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden mb-6">
      {/* Top Banner / Agent Status Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 text-white">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 border border-amber-400/30 flex items-center justify-center shrink-0 text-amber-400">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm sm:text-base tracking-tight text-white flex items-center gap-2">
                <span>{language === 'ha' ? "Wakilin AI Na Binciken Kuɗi" : 'AI Financial Categorizer Agent'}</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-semibold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 rounded-md">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  {config.autoReviewEnabled ? (language === 'ha' ? 'Yana Aiki' : 'Active') : (language === 'ha' ? 'A Tsaya' : 'Paused')}
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-300 dark:text-slate-400 mt-0.5">
              {language === 'ha'
                ? "Binciken ma'amalolin da ba su da rukunin sabis don inganta lissafin kuɗi."
                : 'Periodically reviews uncategorized bank and POS debits with 1-click classification.'}
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Periodic Countdown Indicator */}
          {config.autoReviewEnabled && (
            <div className="text-xs font-mono px-2.5 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 text-slate-300 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>{language === 'ha' ? 'Bincike a:' : 'Next scan:'}</span>
              <span className="font-bold text-amber-400 tabular-nums">{secondsUntilNextScan}s</span>
            </div>
          )}

          {/* Audit Now Button */}
          <button
            onClick={() => handleRunAudit('manual')}
            disabled={isAuditing}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-amber-400 text-slate-950 hover:bg-amber-300 active:scale-95 transition-all disabled:opacity-50"
            title="Trigger instant AI categorization scan"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isAuditing ? 'animate-spin' : ''}`} />
            <span>{isAuditing ? (language === 'ha' ? 'Ana Bincike...' : 'Scanning...') : (language === 'ha' ? 'Bincika Yanzu' : 'Scan Now')}</span>
          </button>

          {/* Settings Toggle */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-xl border text-xs font-medium transition-colors ${
              showSettings
                ? 'bg-slate-800 text-amber-400 border-amber-400/40'
                : 'bg-slate-800/60 text-slate-300 border-slate-700 hover:bg-slate-800'
            }`}
            title="Agent preferences & interval"
          >
            <Sliders className="w-4 h-4" />
          </button>

          {/* Add Sample Uncategorized */}
          <button
            onClick={handleAddSample}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/60 hover:bg-slate-800 border border-slate-700 rounded-xl transition-colors"
            title="Generate a test uncategorized transaction"
          >
            <Plus className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">{language === 'ha' ? 'Gwaji' : 'Add Test'}</span>
          </button>
        </div>
      </div>

      {/* Settings Drawer (Collapsible) */}
      {showSettings && (
        <div className="p-4 bg-slate-50 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={config.autoReviewEnabled}
                  onChange={(e) => handleUpdateConfig({ autoReviewEnabled: e.target.checked })}
                  className="rounded text-amber-500 focus:ring-amber-400 w-4 h-4"
                />
                <span className="font-semibold text-slate-800 dark:text-slate-200">
                  {language === 'ha' ? 'Kunna Binciken AI Na Kai-tsaye' : 'Autonomous Periodic Background Review'}
                </span>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {language === 'ha' ? 'Lokacin Bincike:' : 'Review Interval:'}
              </span>
              <div className="flex items-center gap-1 bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                {[15, 30, 60, 120].map((interval) => (
                  <button
                    key={interval}
                    onClick={() => handleUpdateConfig({ reviewIntervalSeconds: interval })}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold transition-colors ${
                      config.reviewIntervalSeconds === interval
                        ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 font-bold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {interval}s
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowAuditLogs(!showAuditLogs)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <History className="w-3.5 h-3.5 text-slate-400" />
                <span>{showAuditLogs ? (language === 'ha' ? 'Rufe Tarihi' : 'Hide Logs') : (language === 'ha' ? 'Tarihin Bincike' : 'Audit Logs')}</span>
              </button>
            </div>
          </div>

          {/* Audit Logs Sub-panel */}
          {showAuditLogs && (
            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {language === 'ha' ? 'Tarihin Binciken Agent (20 Na Ƙarshe)' : 'Recent Agent Audit Log (Last 20 Runs)'}
                </span>
                <span className="text-[10px] text-slate-400">Model: Gemini 3.8 Flash + Domain Rules</span>
              </div>
              {auditReports.length === 0 ? (
                <p className="text-slate-400 text-[11px] py-2">No audit reports recorded yet.</p>
              ) : (
                <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700">
                  {auditReports.slice(0, 8).map((rpt, idx) => (
                    <div key={idx} className="p-2 flex items-center justify-between text-[11px]">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-slate-400">
                          {new Date(rpt.lastRunAt).toLocaleTimeString('en-GB')}
                        </span>
                        <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold ${
                          rpt.mode === 'autonomous' ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300' : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                        }`}>
                          {rpt.mode}
                        </span>
                        <span className="text-slate-700 dark:text-slate-300">
                          Found {rpt.uncategorizedFound} uncategorized, generated {rpt.suggestionsGenerated} suggestions
                        </span>
                      </div>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">✓ Completed</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Main Body: Uncategorized Items Tray or 100% Tracking Banner */}
      <div className="p-4 sm:p-5">
        {uncategorizedList.length > 0 ? (
          <div>
            {/* Header with Batch Confirm */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500" />
                </span>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  {uncategorizedList.length}{' '}
                  {language === 'ha'
                    ? "Ma'amalolin Da Ke Bukatar Raba Rukuni"
                    : 'Uncategorized Transactions Awaiting Review'}
                </h4>
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium hidden md:inline">
                  (Single-click to approve classification)
                </span>
              </div>

              {/* 1-Click Confirm All Button */}
              <button
                onClick={handleConfirmAll}
                className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white transition-all shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {language === 'ha'
                    ? `Tabbatar Da Duka (${uncategorizedList.length})`
                    : `1-Click Confirm All (${uncategorizedList.length})`}
                </span>
              </button>
            </div>

            {/* List of Pending Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {uncategorizedList.map((tx) => {
                const isConfirmed = justConfirmedId === tx.id;
                const suggestedCat = tx.suggestedCategory || 'Utility';
                const suggestedType = tx.suggestedType || 'electricity';
                const confidencePct = tx.categoryConfidence ? Math.round(tx.categoryConfidence * 100) : 96;

                return (
                  <div
                    key={tx.id}
                    className={`p-3.5 rounded-xl border transition-all ${
                      isConfirmed
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 hover:bg-slate-100/70 dark:hover:bg-slate-800/80 border-slate-200/90 dark:border-slate-700/80'
                    }`}
                  >
                    {/* Item Top: Product & Amount */}
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="min-w-0">
                        <p className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                          {tx.productName}
                        </p>
                        <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-0.5">
                          Ref: {tx.reference} • {tx.recipient}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-bold font-mono text-xs sm:text-sm text-slate-900 dark:text-white tabular-nums">
                          ₦{tx.totalDebited.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* AI Suggestion Box */}
                    <div className="my-2.5 p-2 rounded-lg bg-white dark:bg-slate-900/90 border border-slate-200/70 dark:border-slate-700/70 text-xs">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="p-1 rounded bg-slate-100 dark:bg-slate-800">
                            {CATEGORY_ICONS[suggestedCat] || <Tag className="w-3.5 h-3.5 text-slate-400" />}
                          </span>
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {language === 'ha' ? 'Rukuni:' : 'Suggested Category:'}{' '}
                            <span className="text-amber-600 dark:text-amber-400 font-bold">{suggestedCat}</span>
                          </span>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {confidencePct}% Match
                        </span>
                      </div>

                      {tx.categoryReasoning && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                          "{tx.categoryReasoning}"
                        </p>
                      )}
                    </div>

                    {/* 1-Click Action Buttons */}
                    <div className="flex items-center justify-between gap-2 pt-1">
                      {/* Primary 1-Click Confirm Button */}
                      <button
                        onClick={() => handleConfirmOne(tx.id, suggestedCat, suggestedType)}
                        disabled={isConfirmed}
                        className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                          isConfirmed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-amber-300 active:scale-95'
                        }`}
                      >
                        {isConfirmed ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>{language === 'ha' ? 'An Tabbatar!' : 'Confirmed!'}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 dark:text-slate-950" />
                            <span>
                              {language === 'ha' ? `Tabbatar: ${suggestedCat}` : `Confirm ${suggestedCat}`}
                            </span>
                          </>
                        )}
                      </button>

                      {/* Alternate Category Selector Dropdown */}
                      <div className="relative">
                        <select
                          aria-label="Select alternative category"
                          value=""
                          onChange={(e) => {
                            const selected = ALL_CATEGORY_OPTIONS.find((c) => c.label === e.target.value);
                            if (selected) {
                              handleConfirmOne(tx.id, selected.label, selected.type);
                            }
                          }}
                          className="px-2 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-slate-900"
                        >
                          <option value="" disabled>
                            {language === 'ha' ? 'Wani Rukuni...' : 'Change Category...'}
                          </option>
                          {ALL_CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt.label} value={opt.label}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Empty / All Categorized State */
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <span>{language === 'ha' ? "Dukkan Ma'amaloli An Raba Rukuninsu" : 'All Transactions Accurately Categorized'}</span>
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    100% Tracking
                  </span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {language === 'ha'
                    ? "Wakilin AI yana ci gaba da kula da sabbin biyan kuɗi daga POS, banki, ko katin kuɗi."
                    : 'The AI agent is monitoring incoming transfers and utility bills in the background.'}
                </p>
              </div>
            </div>

            <button
              onClick={handleAddSample}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5 text-amber-500" />
              <span>{language === 'ha' ? "Saka Ma'amalar Gwaji" : 'Simulate Uncategorized Transaction'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
