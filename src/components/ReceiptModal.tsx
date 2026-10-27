import React from 'react';
import { Transaction } from '../types';
import { Printer, Download, CheckCircle, X, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  language: 'en' | 'ha';
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  onClose,
  language,
}) => {
  if (!transaction) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // Generate simple text receipt download
    const content = `
========================================
           3PLE A PLATFORM
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
    `;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `3PLEA_Receipt_${transaction.reference}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8">
        {/* Modal Header Controls (Hidden during print) */}
        <div className="no-print flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {language === 'ha' ? 'Rasit na Gaskiya' : 'Official Transaction Receipt'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-sm"
              title="Print"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{language === 'ha' ? 'Buga' : 'Print'}</span>
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 rounded-lg hover:bg-slate-800 transition-colors shadow-sm"
              title="Download text"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{language === 'ha' ? 'Sauke' : 'Download'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-8 font-sans bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100" id="printable-receipt">
          {/* Logo & Header */}
          <div className="text-center pb-6 border-b border-slate-100 dark:border-slate-800">
            <div className="flex justify-center mb-2">
              <img
                src="/logo.png"
                alt="3PLE A Crest"
                className="w-16 h-16 object-contain"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    '/public/assets/aistudio/file_00000000af208211b9b8694ca4544f0f_3769349c.png';
                }}
              />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">3PLE A</h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Fintech, VTU, Travel, Retail & Estate Platform</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Karkasara Road, Tarauni Local Government Area, Kano State, Nigeria
            </p>
          </div>

          {/* Amount Callout */}
          <div className="py-6 text-center border-b border-dashed border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 my-4 rounded-xl">
            <div className="flex items-center justify-center gap-1.5 text-emerald-600 dark:text-emerald-400 mb-1">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                {transaction.status.toUpperCase()}
              </span>
            </div>
            <div className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">
              ₦{transaction.totalDebited.toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">{transaction.productName}</div>
          </div>

          {/* Receipt Breakdown Grid */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/70">
              <span className="text-slate-500 dark:text-slate-400">Transaction Reference</span>
              <span className="font-mono font-medium text-slate-900 dark:text-slate-200 select-all">
                {transaction.reference}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/70">
              <span className="text-slate-500 dark:text-slate-400">Date & Time (Africa/Lagos)</span>
              <span className="text-slate-900 dark:text-slate-200 font-medium">
                {new Date(transaction.createdAt).toLocaleString('en-GB', {
                  timeZone: 'Africa/Lagos',
                  dateStyle: 'medium',
                  timeStyle: 'short',
                })}
              </span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/70">
              <span className="text-slate-500 dark:text-slate-400">Customer Name</span>
              <span className="text-slate-900 dark:text-slate-200 font-medium">{transaction.userName}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/70">
              <span className="text-slate-500 dark:text-slate-400">Recipient / Identifier</span>
              <span className="text-slate-900 dark:text-slate-200 font-medium font-mono">{transaction.recipient}</span>
            </div>

            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/70">
              <span className="text-slate-500 dark:text-slate-400">Provider Service</span>
              <span className="text-slate-900 dark:text-slate-200 font-medium">{transaction.provider}</span>
            </div>

            {transaction.providerReference && (
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800/70">
                <span className="text-slate-500 dark:text-slate-400">Provider Ref</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{transaction.providerReference}</span>
              </div>
            )}

            {/* Token or Extra metadata if prepaid meter */}
            {transaction.metadata?.token && (
              <div className="my-2 p-3 bg-amber-50 dark:bg-amber-950/40 rounded-lg border border-amber-200 dark:border-amber-800/70">
                <div className="text-[11px] font-semibold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                  Electricity Token (KEDCO / DISCO)
                </div>
                <div className="text-base font-mono font-bold text-amber-950 dark:text-amber-200 mt-0.5 tracking-wider select-all">
                  {transaction.metadata.token}
                </div>
                {transaction.metadata.units && (
                  <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1">
                    Units Credited: {transaction.metadata.units}
                  </div>
                )}
              </div>
            )}

            {/* PNR if flight */}
            {transaction.metadata?.pnr && (
              <div className="my-2 p-3 bg-blue-50 dark:bg-blue-950/40 rounded-lg border border-blue-200 dark:border-blue-800/70">
                <div className="text-[11px] font-semibold text-blue-800 dark:text-blue-300 uppercase tracking-wider">
                  Airline Booking Reference (PNR)
                </div>
                <div className="text-lg font-mono font-bold text-blue-950 dark:text-blue-200 mt-0.5 tracking-widest select-all">
                  {transaction.metadata.pnr}
                </div>
                <div className="text-[11px] text-blue-700 dark:text-blue-400 mt-1">
                  Supplier Ref: {transaction.metadata.supplierRef || 'Confirmed'}
                </div>
              </div>
            )}

            <div className="pt-2">
              <div className="flex justify-between py-0.5 text-slate-500 dark:text-slate-400">
                <span>Base Amount</span>
                <span className="tabular-nums font-mono dark:text-slate-200">₦{transaction.amount.toLocaleString()}</span>
              </div>
              {transaction.fee > 0 && (
                <div className="flex justify-between py-0.5 text-slate-500 dark:text-slate-400">
                  <span>Convenience Fee</span>
                  <span className="tabular-nums font-mono dark:text-slate-200">₦{transaction.fee.toLocaleString()}</span>
                </div>
              )}
              {transaction.discount > 0 && (
                <div className="flex justify-between py-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                  <span>Instant Cashback / Discount</span>
                  <span className="tabular-nums font-mono">-₦{transaction.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between py-2 border-t border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white text-sm mt-1">
                <span>Total Paid</span>
                <span className="tabular-nums font-mono text-slate-900 dark:text-amber-400">₦{transaction.totalDebited.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Verification Stamp & QR Code */}
          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              <div>
                <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200">Verified Electronic Receipt</div>
                <div className="text-[10px] text-slate-400 dark:text-slate-500">Authentic 3PLE A Ledger Record</div>
              </div>
            </div>

            {/* Visual verification QR block */}
            <div className="w-12 h-12 border border-slate-300 dark:border-slate-700 p-0.5 rounded bg-white dark:bg-slate-800 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-full h-full fill-slate-800 dark:fill-slate-200">
                <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm14 2h2v4h-2v-4zm-4-4h2v2h-2v-2zm2 0h2v2h-2v-2zm2 0h4v2h-4v-2zm-4 4h2v4h-2v-4zm4 0h2v2h-2v-2zm0 2h2v2h-2v-2z" />
              </svg>
            </div>
          </div>

          <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 mt-4">
            For support or reconciliation inquiries, contact support@3plea.ng or visit Karkasara Road, Tarauni, Kano.
          </div>
        </div>
      </div>
    </div>
  );
};
