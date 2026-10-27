import React, { useState } from 'react';
import { AppState } from '../services/storage';
import { EducationItem, Transaction } from '../types';
import { PinModal } from '../components/PinModal';
import { GraduationCap, ShieldCheck, Check, AlertCircle, Loader2, CheckCircle2, UserCheck, BookOpen } from 'lucide-react';
import { providerService, CustomerValidationResult } from '../services/providers';
import { DoubleEntryLedgerEngine } from '../services/ledger';

interface EducationPageProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  onViewReceipt: (tx: Transaction) => void;
  language: 'en' | 'ha';
}

export const EducationPage: React.FC<EducationPageProps> = ({
  state,
  updateState,
  onViewReceipt,
  language,
}) => {
  const [category, setCategory] = useState<'all' | 'university' | 'exam_pin'>('all');
  const [selectedItem, setSelectedItem] = useState<EducationItem>(state.educationItems[0]); // BUK
  const [studentId, setStudentId] = useState<string>('BUK/23/SCI/01892');
  const [validationResult, setValidationResult] = useState<CustomerValidationResult | null>(null);
  const [validating, setValidating] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const filteredItems = state.educationItems.filter((i) => {
    if (category === 'all') return true;
    return i.category === category;
  });

  const totalToPay = selectedItem.amount + selectedItem.serviceCharge;

  const handleValidateStudent = async () => {
    if (!studentId || studentId.trim().length < 4) {
      setError('Please enter a valid Matric / Student ID / Invoice Number.');
      return;
    }
    setError('');
    setValidating(true);
    setValidationResult(null);

    try {
      const res = await providerService.validateCustomer('school', studentId, selectedItem.name);
      setValidationResult(res);
      setValidating(false);
    } catch (err: any) {
      setValidating(false);
      setError('Could not validate student invoice.');
    }
  };

  const handleInitiate = () => {
    setError('');
    if (!studentId || studentId.trim().length < 4) {
      setError('Please provide a valid Matric / Student ID.');
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
      const ref = `3PA-EDU-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const activeProvider = providerService.getActiveProviderForService('education');

      const response = await providerService.executeSchoolFeePayment(
        selectedItem.name,
        studentId,
        selectedItem.amount,
        ref
      );

      const customerName = validationResult?.customerName || 'YUSUF AHMAD TIJJANI';
      const examPin = selectedItem.category === 'exam_pin'
        ? `PIN: ${Math.floor(1000000000 + Math.random() * 9000000000)} | S/N: ${Math.floor(10000000 + Math.random() * 90000000)}`
        : undefined;

      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        reference: ref,
        idempotencyKey: `idem_edu_${Date.now()}`,
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        userPhone: state.currentUser.phone,
        type: 'school_fees',
        amount: selectedItem.amount,
        fee: selectedItem.serviceCharge,
        discount: 0,
        totalDebited: totalToPay,
        status: response.success ? 'successful' : 'failed',
        provider: activeProvider?.displayName || 'Pairgate API',
        providerReference: response.providerReference,
        productName: `${selectedItem.name} (${selectedItem.feeName})`,
        recipient: studentId,
        metadata: {
          institution: selectedItem.name,
          studentId,
          customerName,
          token: examPin,
          session: '2025/2026 Academic Session',
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
      setError(err?.message || 'Payment failed.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {language === 'ha' ? 'Kudin Makaranta da Jarabawa' : 'School Fees & Examination Payments'}
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Automated fee clearance for Bayero University Kano (BUK), Kano State Poly, and instant WAEC, JAMB, and NECO result checking tokens.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-5">
          {/* Category Tabs */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              {language === 'ha' ? 'Rukuni' : 'Category'}
            </label>
            <div className="flex gap-2">
              {[
                { id: 'all', label: 'All' },
                { id: 'university', label: 'Tertiary' },
                { id: 'exam_pin', label: 'Exam PINs' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setCategory(t.id as any)}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                    category === t.id
                      ? 'bg-slate-900 dark:bg-amber-500 dark:text-slate-950 text-white border-slate-900 dark:border-amber-500 shadow-sm'
                      : 'bg-white dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Student ID / Matric / Registration Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              {selectedItem.category === 'exam_pin'
                ? 'Candidate Phone / Reg Number'
                : 'Student Matric / Reg Number'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={studentId}
                onChange={(e) => {
                  setStudentId(e.target.value);
                  setValidationResult(null);
                }}
                placeholder="e.g. BUK/23/SCI/01892"
                className="flex-1 px-4 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-slate-900/10 dark:focus:ring-amber-400/20 focus:border-slate-900 dark:focus:border-amber-400 transition-all placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              {selectedItem.category !== 'exam_pin' && (
                <button
                  type="button"
                  onClick={handleValidateStudent}
                  disabled={validating || !studentId}
                  className="px-3 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-semibold text-xs rounded-xl transition-colors whitespace-nowrap flex items-center gap-1 disabled:opacity-50 border border-transparent dark:border-slate-700"
                >
                  {validating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <span>Verify</span>
                  )}
                </button>
              )}
            </div>

            {validationResult && (
              <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-950 dark:text-emerald-200 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">{validationResult.customerName}</div>
                  <div className="text-[11px] text-emerald-800 dark:text-emerald-300">{validationResult.package}</div>
                </div>
              </div>
            )}
          </div>

          {/* Selected Item Breakdown */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
            <div className="font-bold text-slate-900 dark:text-white">{selectedItem.name}</div>
            <div className="text-slate-500 dark:text-slate-400 text-[11px]">{selectedItem.feeName}</div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400 pt-1">
              <span>Institution Fee:</span>
              <span className="font-mono text-slate-900 dark:text-slate-200">₦{selectedItem.amount.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600 dark:text-slate-400">
              <span>NIBSS / Gateway Fee:</span>
              <span className="font-mono text-slate-900 dark:text-slate-200">₦{selectedItem.serviceCharge.toLocaleString()}</span>
            </div>
            <div className="flex justify-between font-bold text-slate-900 dark:text-white text-sm pt-2 border-t border-slate-200 dark:border-slate-800">
              <span>Total Payable:</span>
              <span className="font-mono tabular-nums text-slate-900 dark:text-amber-400">₦{totalToPay.toLocaleString()}</span>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 p-2.5 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl text-xs border border-red-100 dark:border-red-900/60">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleInitiate}
            disabled={loading}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white font-semibold text-xs rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-amber-400 dark:text-slate-950" />
                <span>Processing Payment...</span>
              </>
            ) : (
              <>
                <GraduationCap className="w-4 h-4 text-amber-400 dark:text-slate-950" />
                <span>
                  {language === 'ha' ? 'Biya Kudin Makaranta' : 'Pay Education Fee'} (₦{totalToPay.toLocaleString()})
                </span>
              </>
            )}
          </button>
        </div>

        {/* Right: Institutions & PIN Catalog */}
        <div className="lg:col-span-2 space-y-3">
          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block">
            Select Educational Institution or Exam Provider ({filteredItems.length})
          </span>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredItems.map((item) => {
              const isSelected = selectedItem.id === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSelectedItem(item);
                    setValidationResult(null);
                  }}
                  className={`p-4 rounded-2xl border text-left transition-all ${
                    isSelected
                      ? 'border-slate-900 dark:border-amber-400 bg-white dark:bg-slate-900 ring-2 ring-slate-900 dark:ring-amber-400 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono uppercase bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-1.5 py-0.5 rounded">
                        {item.shortCode}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white mt-1">{item.name}</h4>
                    </div>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">{item.state}</span>
                  </div>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-1">{item.feeName}</p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">Amount</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-amber-400 font-mono tabular-nums">
                      ₦{item.amount.toLocaleString()}
                    </span>
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
        onSuccess={handleExecutePayment}
        title="Authorize Education Payment"
        amount={totalToPay}
        recipient={`${selectedItem.name} (${studentId})`}
      />
    </div>
  );
};
