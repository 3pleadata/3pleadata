import React, { useState } from 'react';
import { Transaction } from '../types';
import { Printer, Download, CheckCircle, X, ShieldCheck, Copy, Check } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  language: 'en' | 'ha';
}

type ReceiptSizeMode = 'pos' | 'compact' | 'standard';

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  onClose,
  language,
}) => {
  const [sizeMode, setSizeMode] = useState<ReceiptSizeMode>('compact');
  const [copied, setCopied] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);

  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedReceiptText = `
========================================
         3PLE A DATA (RC 9746103)
   Karkasara Road, Tarauni, Kano State
      TRANSACTION RECEIPT (WAT)
========================================
Reference: ${transaction.reference}
Date: ${new Date(transaction.createdAt).toLocaleString('en-GB', { timeZone: 'Africa/Lagos' })}
Status: ${transaction.status.toUpperCase()}
Customer: ${transaction.userName}
Phone: ${transaction.userPhone}
Service: ${transaction.productName}
Recipient / ID: ${transaction.recipient}
Provider: ${transaction.provider}
Provider Ref: ${transaction.providerReference || 'N/A'}
Amount: NGN ${transaction.amount.toLocaleString()}
Discount: NGN ${transaction.discount.toLocaleString()}
Service Fee: NGN ${transaction.fee.toLocaleString()}
TOTAL DEBITED: NGN ${transaction.totalDebited.toLocaleString()}
========================================
Verified by 3PLE A Central Ledger
Thank you for choosing 3PLE A!
support@3plea.ng | +234 803 000 3PLE
========================================
  `.trim();

  const handleDownload = () => {
    const blob = new Blob([formattedReceiptText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `3PLEA_Receipt_${transaction.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(formattedReceiptText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyToken = (token: string) => {
    navigator.clipboard.writeText(token);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  // Dynamic max-width classes depending on chosen size mode
  const modalWidthClass =
    sizeMode === 'pos'
      ? 'max-w-[320px]'
      : sizeMode === 'standard'
      ? 'max-w-[460px]'
      : 'max-w-[390px]'; // 'compact' (Default reduced size)

  const bodyPaddingClass =
    sizeMode === 'pos' ? 'p-3.5' : sizeMode === 'standard' ? 'p-6' : 'p-4 sm:p-5';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div
        className={`relative w-full ${modalWidthClass} bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 transition-all duration-200`}
      >
        {/* Modal Header Controls (Hidden during print) */}
        <div className="no-print flex flex-col gap-2 px-4 py-2.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/95">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>{language === 'ha' ? 'Rasit na Gaskiya' : 'Official Receipt'}</span>
            </span>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handleCopyText}
                className="p-1.5 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Copy receipt details"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                title="Print Receipt"
              >
                <Printer className="w-3 h-3" />
                <span>{language === 'ha' ? 'Buga' : 'Print'}</span>
              </button>

              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-white bg-slate-900 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 rounded-lg hover:bg-slate-800 transition-colors shadow-2xs"
                title="Download .txt"
              >
                <Download className="w-3 h-3" />
                <span>{language === 'ha' ? 'Sauke' : 'Save'}</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors ml-1"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Invoice Size Reducer Control Bar */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-800/60 text-[10px]">
            <span className="text-slate-400 font-medium">Invoice Size:</span>
            <div className="inline-flex items-center bg-slate-200/70 dark:bg-slate-800 p-0.5 rounded-lg font-bold">
              <button
                type="button"
                onClick={() => setSizeMode('pos')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  sizeMode === 'pos'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Ultra-compact 58mm Thermal POS Slip"
              >
                POS (320px)
              </button>
              <button
                type="button"
                onClick={() => setSizeMode('compact')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  sizeMode === 'compact'
                    ? 'bg-amber-500 text-slate-950 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Compact Reduced Slip (Default)"
              >
                Compact (390px)
              </button>
              <button
                type="button"
                onClick={() => setSizeMode('standard')}
                className={`px-2 py-0.5 rounded-md transition-all ${
                  sizeMode === 'standard'
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-2xs'
                    : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
                title="Standard Full Size"
              >
                Standard
              </button>
            </div>
          </div>
        </div>

        {/* Printable Receipt Body (Reduced & Compact Layout) */}
        <div
          className={`${bodyPaddingClass} font-sans bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-all`}
          id="printable-receipt"
        >
          {/* Logo & Header */}
          <div className="text-center pb-2.5 border-b border-slate-100 dark:border-slate-800">
            <div className="flex justify-center mb-1">
              <img
                src="/logo.png"
                alt="3PLE A Crest"
                className="w-10 h-10 object-contain drop-shadow-2xs"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    '/public/assets/aistudio/file_00000000af208211b9b8694ca4544f0f_3769349c.png';
                }}
              />
            </div>
            <h1 className="text-base font-black tracking-tight text-slate-900 dark:text-white leading-tight">
              3PLE A DATA
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold leading-tight">
              RC 9746103 · Fintech, VTU, Travel & Utilities
            </p>
            <p className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              Karkasara Road, Tarauni LGA, Kano State, Nigeria
            </p>
          </div>

          {/* Amount Callout (Compact Box) */}
          <div className="py-2.5 my-2.5 text-center border border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl">
            <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400 mb-0.5">
              <CheckCircle className="w-3.5 h-3.5" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                {transaction.status.toUpperCase()}
              </span>
            </div>
            <div className="text-2xl font-black tabular-nums text-slate-900 dark:text-white tracking-tight">
              ₦{transaction.totalDebited.toLocaleString()}
            </div>
            <div className="text-[11px] font-medium text-slate-600 dark:text-slate-300 mt-0.5 truncate px-2">
              {transaction.productName}
            </div>
          </div>

          {/* Receipt Breakdown Grid (Tightened Spacing) */}
          <div className="space-y-1.5 text-[11px]">
            <div className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">Reference</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-200 select-all">
                {transaction.reference}
              </span>
            </div>

            <div className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">Date & Time</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">
                {new Date(transaction.createdAt).toLocaleString('en-GB', {
                  timeZone: 'Africa/Lagos',
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </span>
            </div>

            <div className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">Customer</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[190px]">
                {transaction.userName}
              </span>
            </div>

            <div className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">Recipient / ID</span>
              <span className="text-slate-900 dark:text-slate-100 font-mono font-semibold select-all truncate max-w-[190px]">
                {transaction.recipient}
              </span>
            </div>

            <div className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800/60">
              <span className="text-slate-500 dark:text-slate-400">Provider Service</span>
              <span className="text-slate-800 dark:text-slate-200 font-medium">{transaction.provider}</span>
            </div>

            {transaction.providerReference && (
              <div className="flex justify-between py-0.5 border-b border-slate-100 dark:border-slate-800/60">
                <span className="text-slate-500 dark:text-slate-400">Provider Ref</span>
                <span className="font-mono text-slate-700 dark:text-slate-300 text-[10px]">
                  {transaction.providerReference}
                </span>
              </div>
            )}

            {/* Token or Extra metadata if prepaid electricity meter */}
            {transaction.metadata?.token && (
              <div className="my-1.5 p-2 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-800/70">
                <div className="flex items-center justify-between text-[10px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-0.5">
                  <span>Electricity Token (Prepaid)</span>
                  <button
                    type="button"
                    onClick={() => handleCopyToken(transaction.metadata.token)}
                    className="text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-0.5"
                  >
                    {tokenCopied ? (
                      <Check className="w-3 h-3 text-emerald-500" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                    <span>{tokenCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="text-sm font-mono font-black text-amber-950 dark:text-amber-200 tracking-wider select-all">
                  {transaction.metadata.token}
                </div>
                {transaction.metadata.units && (
                  <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-0.5">
                    Units Credited: {transaction.metadata.units}
                  </div>
                )}
              </div>
            )}

            {/* PNR if domestic flight */}
            {transaction.metadata?.pnr && (
              <div className="my-1.5 p-2 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-800/70">
                <div className="text-[10px] font-bold text-blue-800 dark:text-blue-300 uppercase tracking-wider mb-0.5">
                  Airline Booking Ref (PNR)
                </div>
                <div className="text-base font-mono font-black text-blue-950 dark:text-blue-200 tracking-widest select-all">
                  {transaction.metadata.pnr}
                </div>
                <div className="text-[10px] text-blue-700 dark:text-blue-400 mt-0.5">
                  Supplier Ref: {transaction.metadata.supplierRef || 'Confirmed'}
                </div>
              </div>
            )}

            {/* Financial summary rows */}
            <div className="pt-1 space-y-0.5">
              <div className="flex justify-between py-0.5 text-slate-500 dark:text-slate-400">
                <span>Base Amount</span>
                <span className="tabular-nums font-mono dark:text-slate-200">
                  ₦{transaction.amount.toLocaleString()}
                </span>
              </div>
              {transaction.fee > 0 && (
                <div className="flex justify-between py-0.5 text-slate-500 dark:text-slate-400">
                  <span>Convenience Fee</span>
                  <span className="tabular-nums font-mono dark:text-slate-200">
                    ₦{transaction.fee.toLocaleString()}
                  </span>
                </div>
              )}
              {transaction.discount > 0 && (
                <div className="flex justify-between py-0.5 text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Cashback Discount</span>
                  <span className="tabular-nums font-mono">-₦{transaction.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-1.5 border-t border-slate-200 dark:border-slate-800 font-black text-slate-900 dark:text-white text-xs mt-1">
                <span>Total Debited</span>
                <span className="tabular-nums font-mono text-slate-900 dark:text-amber-400 text-sm">
                  ₦{transaction.totalDebited.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Verification Stamp & QR Code (Compact) */}
          <div className="mt-3 pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <div className="text-[10px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                  Verified Electronic Voucher
                </div>
                <div className="text-[9px] text-slate-400 dark:text-slate-500 leading-tight">
                  3PLE A Core Ledger Stamp
                </div>
              </div>
            </div>

            {/* Visual verification QR block */}
            <div className="w-8 h-8 border border-slate-300 dark:border-slate-700 p-0.5 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center shrink-0">
              <svg viewBox="0 0 24 24" className="w-full h-full fill-slate-800 dark:fill-slate-200">
                <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 2h2v4h-2v-4zm-4-4h2v2h-2v-2zm2 0h2v2h-2v-2zm2 0h4v2h-4v-2zm-4 4h2v4h-2v-4zm4 0h2v2h-2v-2zm0 2h2v2h-2v-2z" />
              </svg>
            </div>
          </div>

          <div className="text-center text-[9px] text-slate-400 dark:text-slate-500 mt-2">
            Support: support@3plea.ng · Karkasara Road, Tarauni, Kano
          </div>
        </div>
      </div>
    </div>
  );
};
