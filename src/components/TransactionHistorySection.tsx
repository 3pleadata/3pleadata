import React, { useState, useMemo } from 'react';
import { AppState } from '../services/storage';
import { Transaction } from '../types';
import {
  Search,
  Filter,
  CheckCircle,
  Clock,
  XCircle,
  FileText,
  ChevronRight,
  ChevronLeft,
  Calendar,
  RotateCcw,
  Download,
  SlidersHorizontal,
} from 'lucide-react';

interface TransactionHistorySectionProps {
  transactions: Transaction[];
  updateState?: (newState: Partial<AppState>) => void;
  onViewReceipt: (tx: Transaction) => void;
  language: 'en' | 'ha';
}

export const TransactionHistorySection: React.FC<TransactionHistorySectionProps> = ({
  transactions,
  updateState,
  onViewReceipt,
  language,
}) => {
  // Advanced Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [dateRangePreset, setDateRangePreset] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  // Filter application (deduplicated by tx.id)
  const filteredTransactions = useMemo(() => {
    const seenIds = new Set<string>();
    return transactions.filter((tx) => {
      if (!tx || !tx.id || seenIds.has(tx.id)) return false;
      seenIds.add(tx.id);

      // 1. Text Search (reference, product name, recipient, amount, provider)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesQuery =
          tx.reference.toLowerCase().includes(query) ||
          tx.productName.toLowerCase().includes(query) ||
          tx.recipient.toLowerCase().includes(query) ||
          tx.provider.toLowerCase().includes(query) ||
          tx.amount.toString().includes(query) ||
          tx.totalDebited.toString().includes(query);
        if (!matchesQuery) return false;
      }

      // 2. Transaction Type Filter
      if (filterType !== 'all') {
        if (filterType === 'vtu') {
          if (tx.type !== 'airtime' && tx.type !== 'data') return false;
        } else if (filterType === 'wallet') {
          if (
            tx.type !== 'wallet_funding' &&
            tx.type !== 'wallet_transfer' &&
            tx.type !== 'commission_payout'
          )
            return false;
        } else if (filterType === 'bills') {
          if (tx.type !== 'electricity' && tx.type !== 'cable_tv') return false;
        } else if (filterType === 'flight') {
          if (tx.type !== 'flight_booking') return false;
        } else if (filterType === 'education') {
          if (tx.type !== 'school_fees') return false;
        } else {
          if (tx.type !== filterType) return false;
        }
      }

      // 3. Status Filter
      if (filterStatus !== 'all') {
        if (tx.status !== filterStatus) return false;
      }

      // 4. Date Range Filter
      const txDate = new Date(tx.createdAt);

      if (dateRangePreset === 'today') {
        const today = new Date();
        if (
          txDate.getDate() !== today.getDate() ||
          txDate.getMonth() !== today.getMonth() ||
          txDate.getFullYear() !== today.getFullYear()
        ) {
          return false;
        }
      } else if (dateRangePreset === '7days') {
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        if (txDate < sevenDaysAgo) return false;
      } else if (dateRangePreset === '30days') {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        if (txDate < thirtyDaysAgo) return false;
      } else if (dateRangePreset === 'custom') {
        if (startDate) {
          const start = new Date(startDate);
          start.setHours(0, 0, 0, 0);
          if (txDate < start) return false;
        }
        if (endDate) {
          const end = new Date(endDate);
          end.setHours(23, 59, 59, 999);
          if (txDate > end) return false;
        }
      }

      return true;
    });
  }, [
    transactions,
    searchQuery,
    filterType,
    filterStatus,
    dateRangePreset,
    startDate,
    endDate,
  ]);

  // Aggregate metrics for filtered data
  const filteredTotalVolume = useMemo(() => {
    return filteredTransactions.reduce((acc, tx) => acc + tx.totalDebited, 0);
  }, [filteredTransactions]);

  // Pagination slicing
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage) || 1;
  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTransactions.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTransactions, currentPage, itemsPerPage]);

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    filterType !== 'all' ||
    filterStatus !== 'all' ||
    dateRangePreset !== 'all' ||
    startDate !== '' ||
    endDate !== '';

  const handleResetFilters = () => {
    setSearchQuery('');
    setFilterType('all');
    setFilterStatus('all');
    setDateRangePreset('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;

    const headers = [
      'Reference',
      'Date (WAT)',
      'Type',
      'Product Name',
      'Recipient',
      'Provider',
      'Provider Ref',
      'Amount (NGN)',
      'Fee (NGN)',
      'Discount (NGN)',
      'Total Debited (NGN)',
      'Status',
    ];

    const rows = filteredTransactions.map((tx) => [
      tx.reference,
      `"${new Date(tx.createdAt).toLocaleString('en-GB', { timeZone: 'Africa/Lagos' })}"`,
      tx.type,
      `"${tx.productName.replace(/"/g, '""')}"`,
      `"${tx.recipient}"`,
      `"${tx.provider}"`,
      `"${tx.providerReference || 'N/A'}"`,
      tx.amount,
      tx.fee,
      tx.discount,
      tx.totalDebited,
      tx.status,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `3PLEA_Transactions_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* Enhanced Transaction History Section with Advanced Filters */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-colors">
        {/* Section Header */}
        <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'ha' ? 'Harkokin Kudi na Kwanan Nan' : 'Transaction History & Ledger Activity'}
              </h3>
              <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full border border-transparent dark:border-slate-700">
                {filteredTransactions.length} of {transactions.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Comprehensive double-entry verified transactions with granular filters and CSV reports
            </p>
          </div>

          {/* Quick Metrics & Actions */}
          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                Filtered Volume
              </span>
              <span className="text-sm font-bold font-mono text-slate-900 dark:text-white tabular-nums">
                ₦{filteredTotalVolume.toLocaleString()}
              </span>
            </div>

            <button
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors disabled:opacity-40"
              title="Download CSV Statement"
            >
              <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-400" />
              <span>{language === 'ha' ? 'Sauke CSV' : 'Export CSV'}</span>
            </button>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                showAdvancedFilters || hasActiveFilters
                  ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 border-slate-900 dark:border-amber-400 shadow-xs font-bold'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/60'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{language === 'ha' ? 'Tace Bayanai' : 'Filters'}</span>
              {hasActiveFilters && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 space-y-3">
          {/* Primary Quick Filter Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={
                  language === 'ha'
                    ? 'Bincika shaida, lamba, ko sabis...'
                    : 'Search reference, recipient, product...'
                }
                className="w-full pl-9 pr-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-amber-400/20 focus:border-slate-900 dark:focus:border-amber-400 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>

            {/* Transaction Type Filter */}
            <div>
              <select
                value={filterType}
                onChange={(e) => {
                  setFilterType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-amber-400/20 focus:border-slate-900 dark:focus:border-amber-400"
              >
                <option value="all">All Service Categories</option>
                <option value="vtu">⚡ VTU (Airtime & Data)</option>
                <option value="airtime">Airtime VTU Only</option>
                <option value="data">Data Bundles Only</option>
                <option value="bills">💡 Utility Bills (Power & TV)</option>
                <option value="electricity">Electricity (DISCOs)</option>
                <option value="cable_tv">Cable TV (DSTV/GOTV)</option>
                <option value="flight">✈️ Flights & Travel</option>
                <option value="education">🎓 School Fees & Exams</option>
                <option value="wallet">💳 Wallet (Funding & Payouts)</option>
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={filterStatus}
                onChange={(e) => {
                  setFilterStatus(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-amber-400/20 focus:border-slate-900 dark:focus:border-amber-400"
              >
                <option value="all">All Statuses (Any)</option>
                <option value="successful">✓ Successful</option>
                <option value="pending">⏳ Pending Verification</option>
                <option value="failed">✕ Failed</option>
                <option value="reversed">↺ Reversed</option>
                <option value="refunded">↩ Refunded</option>
              </select>
            </div>

            {/* Date Range Preset Selector */}
            <div>
              <select
                value={dateRangePreset}
                onChange={(e) => {
                  setDateRangePreset(e.target.value);
                  setCurrentPage(1);
                  if (e.target.value !== 'custom') {
                    setStartDate('');
                    setEndDate('');
                  }
                }}
                className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-slate-200 font-medium focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-amber-400/20 focus:border-slate-900 dark:focus:border-amber-400"
              >
                <option value="all">Date: All Time</option>
                <option value="today">Date: Today</option>
                <option value="7days">Date: Last 7 Days</option>
                <option value="30days">Date: Last 30 Days</option>
                <option value="custom">Date: Custom Date Range...</option>
              </select>
            </div>
          </div>

          {/* Secondary Filter Row: Custom Dates & Reset Button */}
          {(showAdvancedFilters || dateRangePreset === 'custom' || hasActiveFilters) && (
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-200/60 dark:border-slate-700/60 text-xs">
              {/* Date pickers */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-slate-500 dark:text-slate-400 font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                  <span>Custom Range:</span>
                </span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setDateRangePreset('custom');
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
                  placeholder="Start date"
                />
                <span className="text-slate-400 dark:text-slate-500">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setDateRangePreset('custom');
                    setCurrentPage(1);
                  }}
                  className="px-2.5 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 text-xs focus:outline-none"
                  placeholder="End date"
                />
              </div>

              {/* Reset action button */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors self-start sm:self-auto border border-rose-200 dark:border-rose-800"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Transactions Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4">Service & Product</th>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Recipient / Account</th>
                <th className="py-3 px-4">Provider Channel</th>
                <th className="py-3 px-4">Date & Time (WAT)</th>
                <th className="py-3 px-4 text-right">Total (₦)</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedTransactions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <div className="max-w-xs mx-auto space-y-2">
                      <Filter className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                      <p className="font-semibold text-slate-700 dark:text-slate-300 text-sm">
                        No transactions matched your filter criteria.
                      </p>
                      <p className="text-slate-400 dark:text-slate-500 text-xs">
                        Try adjusting your date range, clearing search terms, or resetting filters.
                      </p>
                      {hasActiveFilters && (
                        <button
                          onClick={handleResetFilters}
                          className="mt-2 px-3 py-1.5 bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 rounded-lg text-xs font-semibold hover:bg-slate-800 dark:hover:bg-amber-300 transition-colors"
                        >
                          Clear Active Filters
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedTransactions.map((tx) => {
                  return (
                    <tr
                      key={`home_tx_row_${tx.id}`}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        <span className="truncate block max-w-xs">{tx.productName}</span>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-500 dark:text-slate-400 select-all whitespace-nowrap">
                        {tx.reference}
                      </td>
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300 font-mono whitespace-nowrap">
                        {tx.recipient}
                      </td>
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 truncate max-w-[130px]">
                        {tx.provider}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {new Date(tx.createdAt).toLocaleString('en-GB', {
                          timeZone: 'Africa/Lagos',
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold tabular-nums text-slate-900 dark:text-white whitespace-nowrap">
                        ₦{tx.totalDebited.toLocaleString()}
                      </td>
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                            tx.status === 'successful'
                              ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : tx.status === 'pending'
                              ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                              : 'bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800'
                          }`}
                        >
                          {tx.status === 'successful' && <CheckCircle className="w-3 solid h-3" />}
                          {tx.status === 'pending' && <Clock className="w-3 h-3" />}
                          {tx.status === 'failed' && <XCircle className="w-3 h-3" />}
                          <span className="capitalize">{tx.status}</span>
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          onClick={() => onViewReceipt(tx)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors font-semibold text-[11px]"
                        >
                          <FileText className="w-3 h-3" />
                          <span>Receipt</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Results Summary Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span>
              Showing{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {filteredTransactions.length === 0
                  ? 0
                  : (currentPage - 1) * itemsPerPage + 1}
              </span>{' '}
              to{' '}
              <span className="font-semibold text-slate-900 dark:text-white">
                {Math.min(currentPage * itemsPerPage, filteredTransactions.length)}
              </span>{' '}
              of{' '}
              <span className="font-semibold text-slate-900 dark:text-white font-mono">
                {filteredTransactions.length}
              </span>{' '}
              entries
            </span>

            {/* Per page selector */}
            <div className="flex items-center gap-1 ml-3">
              <span className="text-slate-400 dark:text-slate-500">Rows:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value, 10));
                  setCurrentPage(1);
                }}
                className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-slate-200"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          {/* Page navigation buttons */}
          {totalPages > 1 && (
            <div className="flex items-center gap-1 self-center sm:self-auto">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                aria-label="Previous Page"
              >
                <ChevronLeft className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>

              <div className="px-2 font-mono font-semibold text-slate-800 dark:text-slate-200">
                {currentPage} / {totalPages}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="p-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
                aria-label="Next Page"
              >
                <ChevronRight className="w-4 h-4 text-slate-700 dark:text-slate-300" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
