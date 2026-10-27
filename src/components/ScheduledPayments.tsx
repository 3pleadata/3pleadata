import React, { useState, useMemo } from 'react';
import {
  CalendarClock,
  CalendarDays,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  PauseCircle,
  PlayCircle,
  SkipForward,
  RotateCcw,
  Edit3,
  Trash2,
  Plus,
  Zap,
  Wifi,
  Smartphone,
  Tv,
  Wallet,
  ShieldCheck,
  Search,
  Filter,
  ArrowRight,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { ScheduledPayment, ScheduleFrequency, Transaction } from '../types';
import { AppState } from '../services/storage';
import { DoubleEntryLedgerEngine } from '../services/ledger';

interface ScheduledPaymentsProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  language: 'en' | 'ha';
  onViewReceipt?: (tx: Transaction) => void;
  onOpenFundModal?: () => void;
}

type ViewMode = 'calendar' | 'cards' | 'timeline';

export const ScheduledPayments: React.FC<ScheduledPaymentsProps> = ({
  state,
  updateState,
  language,
  onViewReceipt,
  onOpenFundModal,
}) => {
  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Calendar State
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<Date | null>(new Date());

  // Modals state
  const [editingPayment, setEditingPayment] = useState<ScheduledPayment | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState<boolean>(false);
  const [skipNotice, setSkipNotice] = useState<{
    id: string;
    title: string;
    oldDate: string;
    newDate: string;
  } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // New/Edit form state
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState<'airtime' | 'data' | 'electricity' | 'cable_tv'>('electricity');
  const [formProvider, setFormProvider] = useState('');
  const [formRecipient, setFormRecipient] = useState('');
  const [formAmount, setFormAmount] = useState<number>(5000);
  const [formFrequency, setFormFrequency] = useState<ScheduleFrequency>('monthly');
  const [formDay, setFormDay] = useState<number>(28);
  const [formTime, setFormTime] = useState<string>('08:00');
  const [formAutoDebit, setFormAutoDebit] = useState<boolean>(true);
  const [formNote, setFormNote] = useState<string>('');
  const [formPlanName, setFormPlanName] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'active' | 'paused'>('active');

  // Copy helper
  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Calendar helpers
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentYear, currentMonth + 1, 1));
  };

  const handleToday = () => {
    const today = new Date();
    setCurrentDate(today);
    setSelectedCalendarDate(today);
  };

  // Generate days in month
  const calendarDays = useMemo(() => {
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
    const lastDayOfMonth = new Date(currentYear, currentMonth + 1, 0);

    const startingDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sun
    const daysInCurrentMonth = lastDayOfMonth.getDate();

    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      dayNumber: number;
      isToday: boolean;
      isoDateString: string;
    }> = [];

    // Previous month padding
    const prevMonthLastDay = new Date(currentYear, currentMonth, 0).getDate();
    for (let i = startingDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(currentYear, currentMonth - 1, prevMonthLastDay - i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dayNumber: d.getDate(),
        isToday: false,
        isoDateString: d.toISOString().split('T')[0],
      });
    }

    // Current month days
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    for (let d = 1; d <= daysInCurrentMonth; d++) {
      const dateObj = new Date(currentYear, currentMonth, d);
      const isoStr = dateObj.toISOString().split('T')[0];
      days.push({
        date: dateObj,
        isCurrentMonth: true,
        dayNumber: d,
        isToday: isoStr === todayStr,
        isoDateString: isoStr,
      });
    }

    // Next month padding to fill out 35 or 42 cells (multiple of 7)
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(currentYear, currentMonth + 1, i);
      days.push({
        date: d,
        isCurrentMonth: false,
        dayNumber: d.getDate(),
        isToday: false,
        isoDateString: d.toISOString().split('T')[0],
      });
    }

    return days;
  }, [currentYear, currentMonth]);

  // Projected Bill Cycles on Calendar
  // Check which bills occur on a specific date (either direct nextRunDate match, or projected recurrence)
  const getBillsForDate = (date: Date) => {
    const targetIso = date.toISOString().split('T')[0];
    const dayOfWeek = date.getDay(); // 0 = Sun, 1 = Mon ...
    const dayOfMonth = date.getDate();

    return state.scheduledPayments.filter((sch) => {
      // Check status
      if (sch.status === 'paused') return false;

      // Exact date match
      const nextRunIso = sch.nextRunDate.split('T')[0];
      if (nextRunIso === targetIso) {
        return true;
      }

      // Check projected recurrence if within this month
      if (sch.frequency === 'daily') {
        return true;
      }

      if (sch.frequency === 'weekly') {
        const schDay = sch.executionDay !== undefined ? sch.executionDay : new Date(sch.nextRunDate).getDay();
        return dayOfWeek === schDay;
      }

      if (sch.frequency === 'monthly') {
        const schMonthDay = sch.executionDay !== undefined ? sch.executionDay : new Date(sch.nextRunDate).getDate();
        return dayOfMonth === schMonthDay;
      }

      return false;
    });
  };

  // Filtered schedules for cards and timeline
  const filteredSchedules = useMemo(() => {
    return state.scheduledPayments.filter((sch) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches =
          sch.title.toLowerCase().includes(q) ||
          sch.provider.toLowerCase().includes(q) ||
          sch.recipient.toLowerCase().includes(q) ||
          sch.amount.toString().includes(q);
        if (!matches) return false;
      }

      if (selectedCategory !== 'all' && sch.category !== selectedCategory) {
        return false;
      }

      if (statusFilter !== 'all' && sch.status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [state.scheduledPayments, searchQuery, selectedCategory, statusFilter]);

  // Summary Metrics
  const summaryMetrics = useMemo(() => {
    let monthlyTotal = 0;
    let activeCount = 0;
    let skippedCount = 0;

    let nearestSchedule: ScheduledPayment | null = null;
    let nearestTime = Infinity;
    const nowTime = Date.now();

    state.scheduledPayments.forEach((sch) => {
      if (sch.status === 'active' || sch.status === 'skipped') {
        activeCount++;
        if (sch.frequency === 'monthly') {
          monthlyTotal += sch.amount;
        } else if (sch.frequency === 'weekly') {
          monthlyTotal += sch.amount * 4.33;
        } else if (sch.frequency === 'daily') {
          monthlyTotal += sch.amount * 30;
        }
      }

      if (sch.status === 'skipped' || (sch.skippedCycles && sch.skippedCycles.length > 0)) {
        skippedCount += sch.skippedCycles ? sch.skippedCycles.length : 1;
      }

      const runTime = new Date(sch.nextRunDate).getTime();
      if (runTime >= nowTime && runTime < nearestTime) {
        nearestTime = runTime;
        nearestSchedule = sch;
      }
    });

    return {
      monthlyTotal: Math.round(monthlyTotal),
      activeCount,
      skippedCount,
      nearestSchedule,
    };
  }, [state.scheduledPayments]);

  // ACTION 1: Direct "Skip (Next Cycle)" handler
  const handleSkipCycle = (payment: ScheduledPayment) => {
    const currentRun = new Date(payment.nextRunDate);
    const oldDateStr = currentRun.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    // Advance to next cycle
    const nextRun = new Date(currentRun);
    if (payment.frequency === 'daily') {
      nextRun.setDate(nextRun.getDate() + 1);
    } else if (payment.frequency === 'weekly') {
      nextRun.setDate(nextRun.getDate() + 7);
    } else if (payment.frequency === 'monthly') {
      nextRun.setMonth(nextRun.getMonth() + 1);
    } else {
      nextRun.setDate(nextRun.getDate() + 30);
    }

    const newDateIso = nextRun.toISOString();
    const newDateStr = nextRun.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const updatedPayment: ScheduledPayment = {
      ...payment,
      nextRunDate: newDateIso,
      status: 'skipped',
      lastSkippedDate: payment.nextRunDate,
      skippedCycles: [...(payment.skippedCycles || []), payment.nextRunDate],
    };

    const updatedList = state.scheduledPayments.map((p) =>
      p.id === payment.id ? updatedPayment : p
    );

    // Add a system notification
    const newNotification = {
      id: `notif_skip_${Date.now()}`,
      userId: state.currentUser.id,
      title: language === 'ha' ? 'An Tsallake Biyan Kudi' : 'Scheduled Cycle Skipped',
      message: `${payment.title} skipped for cycle ${oldDateStr}. Next automated cycle rescheduled to ${newDateStr}.`,
      type: 'transaction' as const,
      read: false,
      createdAt: new Date().toISOString(),
    };

    updateState({
      scheduledPayments: updatedList,
      notifications: [newNotification, ...state.notifications],
    });

    setSkipNotice({
      id: payment.id,
      title: payment.title,
      oldDate: oldDateStr,
      newDate: newDateStr,
    });

    setTimeout(() => {
      setSkipNotice((cur) => (cur?.id === payment.id ? null : cur));
    }, 6000);
  };

  // Revert/Undo Skip
  const handleUndoSkip = (paymentId: string) => {
    const payment = state.scheduledPayments.find((p) => p.id === paymentId);
    if (!payment || !payment.lastSkippedDate) return;

    const updatedPayment: ScheduledPayment = {
      ...payment,
      nextRunDate: payment.lastSkippedDate,
      status: 'active',
      lastSkippedDate: undefined,
      skippedCycles: (payment.skippedCycles || []).filter((d) => d !== payment.lastSkippedDate),
    };

    const updatedList = state.scheduledPayments.map((p) =>
      p.id === paymentId ? updatedPayment : p
    );

    updateState({ scheduledPayments: updatedList });
    setSkipNotice(null);
  };

  // ACTION 2: Direct "Modify" handler - Open modal
  const handleOpenModifyModal = (payment: ScheduledPayment) => {
    setEditingPayment(payment);
    setFormTitle(payment.title);
    setFormCategory(payment.category);
    setFormProvider(payment.provider);
    setFormRecipient(payment.recipient);
    setFormAmount(payment.amount);
    setFormFrequency(payment.frequency);
    setFormDay(payment.executionDay || 28);
    setFormTime(payment.executionTime || '08:00');
    setFormAutoDebit(payment.autoDebitWallet);
    setFormNote(payment.note || '');
    setFormPlanName(payment.planName || '');
    setFormStatus(payment.status === 'paused' ? 'paused' : 'active');
    setIsCreatingNew(false);
  };

  // Open "Create New Schedule" modal
  const handleOpenCreateModal = () => {
    setEditingPayment(null);
    setFormTitle('');
    setFormCategory('electricity');
    setFormProvider('KEDCO');
    setFormRecipient('');
    setFormAmount(10000);
    setFormFrequency('monthly');
    setFormDay(28);
    setFormTime('08:00');
    setFormAutoDebit(true);
    setFormNote('');
    setFormPlanName('');
    setFormStatus('active');
    setIsCreatingNew(true);
  };

  // Save modified or new schedule
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formTitle.trim() || !formRecipient.trim() || formAmount <= 0) {
      alert('Please fill out the title, recipient identifier, and a valid amount.');
      return;
    }

    if (isCreatingNew) {
      // Calculate nextRunDate based on frequency & day
      const now = new Date();
      let nextRun = new Date();
      if (formFrequency === 'daily') {
        nextRun.setDate(now.getDate() + 1);
      } else if (formFrequency === 'weekly') {
        const daysToAdd = (formDay - now.getDay() + 7) % 7 || 7;
        nextRun.setDate(now.getDate() + daysToAdd);
      } else {
        // Monthly
        nextRun.setDate(formDay);
        if (nextRun < now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
      }

      const newSchedule: ScheduledPayment = {
        id: `sch_${Date.now()}`,
        userId: state.currentUser.id,
        title: formTitle.trim(),
        category: formCategory,
        provider: formProvider || (formCategory === 'electricity' ? 'KEDCO' : 'MTN'),
        recipient: formRecipient.trim(),
        amount: Number(formAmount),
        frequency: formFrequency,
        executionDay: Number(formDay),
        executionTime: formTime,
        nextRunDate: nextRun.toISOString(),
        status: formStatus,
        autoDebitWallet: formAutoDebit,
        totalExecutions: 0,
        createdAt: new Date().toISOString(),
        note: formNote.trim(),
        planName: formPlanName.trim() || undefined,
      };

      updateState({
        scheduledPayments: [newSchedule, ...state.scheduledPayments],
      });
      setIsCreatingNew(false);
    } else if (editingPayment) {
      const updated: ScheduledPayment = {
        ...editingPayment,
        title: formTitle.trim(),
        category: formCategory,
        provider: formProvider,
        recipient: formRecipient.trim(),
        amount: Number(formAmount),
        frequency: formFrequency,
        executionDay: Number(formDay),
        executionTime: formTime,
        autoDebitWallet: formAutoDebit,
        note: formNote.trim(),
        planName: formPlanName.trim() || undefined,
        status: formStatus,
      };

      const updatedList = state.scheduledPayments.map((p) =>
        p.id === editingPayment.id ? updated : p
      );
      updateState({ scheduledPayments: updatedList });
      setEditingPayment(null);
    }
  };

  // ACTION 3: Run Now (Execute Immediately)
  const handleRunNow = (payment: ScheduledPayment) => {
    if (state.currentUser.walletBalance < payment.amount) {
      alert(
        `Insufficient balance. Your wallet balance is ₦${state.currentUser.walletBalance.toLocaleString()}, but ₦${payment.amount.toLocaleString()} is required.`
      );
      if (onOpenFundModal) onOpenFundModal();
      return;
    }

    const txRef = `3PA-SCH-${Date.now().toString().slice(-6)}`;
    const newTx: Transaction = {
      id: `tx_sch_${Date.now()}`,
      reference: txRef,
      idempotencyKey: `idem_sch_${payment.id}_${Date.now()}`,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userPhone: state.currentUser.phone,
      type:
        payment.category === 'electricity'
          ? 'electricity'
          : payment.category === 'data'
          ? 'data'
          : payment.category === 'cable_tv'
          ? 'cable_tv'
          : 'airtime',
      amount: payment.amount,
      fee: payment.category === 'electricity' ? 100 : 0,
      discount: 0,
      totalDebited: payment.amount + (payment.category === 'electricity' ? 100 : 0),
      status: 'successful',
      provider: payment.provider,
      providerReference: `EXEC_${payment.provider}_${Math.floor(100000 + Math.random() * 900000)}`,
      productName: payment.title,
      recipient: payment.recipient,
      metadata: {
        channel: 'Smart Scheduled Auto-Run',
        scheduleId: payment.id,
        frequency: payment.frequency,
      },
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    const ledgerEntries = DoubleEntryLedgerEngine.recordVtuPurchase(
      newTx,
      payment.provider
    );

    // Advance nextRunDate
    const currentRun = new Date(payment.nextRunDate);
    const nextRun = new Date(currentRun);
    if (payment.frequency === 'daily') nextRun.setDate(nextRun.getDate() + 1);
    else if (payment.frequency === 'weekly') nextRun.setDate(nextRun.getDate() + 7);
    else if (payment.frequency === 'monthly') nextRun.setMonth(nextRun.getMonth() + 1);

    const updatedPayment: ScheduledPayment = {
      ...payment,
      nextRunDate: nextRun.toISOString(),
      lastRunDate: new Date().toISOString(),
      totalExecutions: (payment.totalExecutions || 0) + 1,
      status: 'active',
    };

    const updatedUser = {
      ...state.currentUser,
      walletBalance: state.currentUser.walletBalance - newTx.totalDebited,
    };

    updateState({
      currentUser: updatedUser,
      scheduledPayments: state.scheduledPayments.map((p) =>
        p.id === payment.id ? updatedPayment : p
      ),
      transactions: [newTx, ...state.transactions],
      ledger: [...state.ledger, ...ledgerEntries],
    });

    if (onViewReceipt) {
      onViewReceipt(newTx);
    }
  };

  // ACTION 4: Toggle Pause / Resume
  const handleTogglePause = (payment: ScheduledPayment) => {
    const nextStatus: 'active' | 'paused' = payment.status === 'paused' ? 'active' : 'paused';
    const updatedList: ScheduledPayment[] = state.scheduledPayments.map((p) =>
      p.id === payment.id ? { ...p, status: nextStatus } : p
    );
    updateState({ scheduledPayments: updatedList });
  };

  // ACTION 5: Delete Schedule
  const handleDeleteSchedule = (id: string, title: string) => {
    if (confirm(`Are you sure you want to delete the schedule "${title}"?`)) {
      updateState({
        scheduledPayments: state.scheduledPayments.filter((p) => p.id !== id),
      });
    }
  };

  // Category styling helpers
  const getCategoryStyles = (category: string) => {
    switch (category) {
      case 'electricity':
        return {
          icon: Zap,
          text: 'text-amber-600 dark:text-amber-400',
          bg: 'bg-amber-50 dark:bg-amber-950/40',
          border: 'border-amber-200 dark:border-amber-800/60',
          dot: 'bg-amber-500',
          badgeText: language === 'ha' ? 'Wuta' : 'Electricity',
        };
      case 'data':
        return {
          icon: Wifi,
          text: 'text-blue-600 dark:text-blue-400',
          bg: 'bg-blue-50 dark:bg-blue-950/40',
          border: 'border-blue-200 dark:border-blue-800/60',
          dot: 'bg-blue-500',
          badgeText: language === 'ha' ? 'Data' : 'Data',
        };
      case 'airtime':
        return {
          icon: Smartphone,
          text: 'text-emerald-600 dark:text-emerald-400',
          bg: 'bg-emerald-50 dark:bg-emerald-950/40',
          border: 'border-emerald-200 dark:border-emerald-800/60',
          dot: 'bg-emerald-500',
          badgeText: language === 'ha' ? 'Kati' : 'Airtime',
        };
      case 'cable_tv':
      default:
        return {
          icon: Tv,
          text: 'text-purple-600 dark:text-purple-400',
          bg: 'bg-purple-50 dark:bg-purple-950/40',
          border: 'border-purple-200 dark:border-purple-800/60',
          dot: 'bg-purple-500',
          badgeText: language === 'ha' ? 'Cable TV' : 'Cable TV',
        };
    }
  };

  // Countdown formatter
  const formatCountdown = (isoDate: string) => {
    const diffMs = new Date(isoDate).getTime() - Date.now();
    if (diffMs <= 0) return language === 'ha' ? 'Lokaci ya yi' : 'Due Now';
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days === 0) {
      return language === 'ha' ? `A yau (${hours}h)` : `Today in ${hours}h`;
    }
    if (days === 1) {
      return language === 'ha' ? 'Gobe' : 'Tomorrow';
    }
    return language === 'ha' ? `Cikin kwanaki ${days}` : `In ${days} days`;
  };

  const selectedDateBills = selectedCalendarDate ? getBillsForDate(selectedCalendarDate) : [];

  return (
    <div className="space-y-6">
      {/* Top Banner & Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <CalendarClock className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {language === 'ha' ? 'Jadawalin Biyan Kudin Hidima' : 'Smart Schedules & Bill Cycles'}
              </h1>
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {language === 'ha'
                ? 'Kula da kwanakin biyan wuta, data, katin waya da cable TV a kalanda, da zabin tsallake zagaye ko gyara jadawali.'
                : 'Interactive bill calendar with single-click cycle skipping, in-line modifications, and automated wallet debit protection.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* View Switcher */}
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-800 p-1 bg-slate-50 dark:bg-slate-950/60">
              <button
                type="button"
                onClick={() => setViewMode('calendar')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'calendar'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                <span>{language === 'ha' ? 'Kalanda' : 'Smart Calendar'}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('cards')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <CalendarIcon className="w-3.5 h-3.5" />
                <span>{language === 'ha' ? 'Katinan Jadawali' : 'Schedule Cards'}</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode('timeline')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
                  viewMode === 'timeline'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>{language === 'ha' ? 'Lokaci' : 'Upcoming Timeline'}</span>
              </button>
            </div>

            {/* New Schedule Button */}
            <button
              type="button"
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ha' ? 'Sanya Sabo' : 'New Schedule'}</span>
            </button>
          </div>
        </div>

        {/* Global Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-5 mt-5 border-t border-slate-100 dark:border-slate-800 text-left">
          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              {language === 'ha' ? 'Kudin Biyan Kowane Wata' : 'Monthly Bill Commitment'}
            </span>
            <span className="text-lg font-bold text-slate-900 dark:text-white">
              ₦{summaryMetrics.monthlyTotal.toLocaleString()}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              {language === 'ha' ? 'Jadawalai Masu Aiki' : 'Active Schedules'}
            </span>
            <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
              {summaryMetrics.activeCount} {language === 'ha' ? 'aiki' : 'active'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              {language === 'ha' ? 'Kudin da Ke Tafe' : 'Next Due Payment'}
            </span>
            {summaryMetrics.nearestSchedule ? (
              <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate block">
                {(summaryMetrics.nearestSchedule as ScheduledPayment).provider} · ₦
                {(summaryMetrics.nearestSchedule as ScheduledPayment).amount.toLocaleString()} (
                {formatCountdown((summaryMetrics.nearestSchedule as ScheduledPayment).nextRunDate)})
              </span>
            ) : (
              <span className="text-xs text-slate-400">None upcoming</span>
            )}
          </div>

          <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 dark:text-slate-400 block">
              {language === 'ha' ? 'Asusun Wallet / Kariya' : 'Wallet Reserve Cover'}
            </span>
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 block truncate">
              ₦{state.currentUser.walletBalance.toLocaleString()} (
              {state.currentUser.walletBalance >= summaryMetrics.monthlyTotal
                ? '100% Covered'
                : 'Partial Coverage'}
              )
            </span>
          </div>
        </div>
      </div>

      {/* Skip Notice Toast / Banner */}
      {skipNotice && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900 text-blue-900 dark:text-blue-100 flex items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <SkipForward className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-sm">
              <span className="font-semibold">{skipNotice.title}</span> cycle for{' '}
              <span className="underline">{skipNotice.oldDate}</span> has been skipped. Next automated
              charge is scheduled for <span className="font-semibold">{skipNotice.newDate}</span>.
            </p>
          </div>
          <button
            type="button"
            onClick={() => handleUndoSkip(skipNotice.id)}
            className="px-3 py-1 text-xs font-semibold rounded-md bg-blue-600 hover:bg-blue-700 text-white shrink-0 transition-colors"
          >
            {language === 'ha' ? 'Maida Shi' : 'Undo Skip'}
          </button>
        </div>
      )}

      {/* FILTER & SEARCH ROW */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'ha'
                ? 'Bincika da suna, mita, waya, ko lamba...'
                : 'Search scheduled bills by title, recipient, or provider...'
            }
            className="w-full pl-9 pr-4 py-2 text-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>

        {/* Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: language === 'ha' ? 'Duka' : 'All Bills' },
            { id: 'electricity', label: language === 'ha' ? 'Wuta' : 'Electricity' },
            { id: 'data', label: language === 'ha' ? 'Data' : 'Data' },
            { id: 'airtime', label: language === 'ha' ? 'Kati' : 'Airtime' },
            { id: 'cable_tv', label: language === 'ha' ? 'Talabijin' : 'Cable TV' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap transition-colors ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* VIEW 1: SMART CALENDAR VIEW */}
      {viewMode === 'calendar' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Calendar Grid (2 Cols on lg) */}
          <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            {/* Calendar Controls */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  {currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                </h2>
                <button
                  type="button"
                  onClick={handleToday}
                  className="px-2.5 py-1 text-xs font-medium rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  {language === 'ha' ? 'Yau' : 'Today'}
                </button>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  aria-label="Previous Month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                  aria-label="Next Month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Day Header Row */}
            <div className="grid grid-cols-7 gap-1 pt-3 pb-2 text-center text-xs font-semibold text-slate-400">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d} className="py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarDays.map((dayItem, idx) => {
                const billsOnDay = getBillsForDate(dayItem.date);
                const isSelected =
                  selectedCalendarDate &&
                  dayItem.isoDateString === selectedCalendarDate.toISOString().split('T')[0];

                return (
                  <div
                    key={idx}
                    onClick={() => setSelectedCalendarDate(dayItem.date)}
                    className={`min-h-[86px] sm:min-h-[105px] p-1.5 sm:p-2 rounded-lg border text-left cursor-pointer transition-all flex flex-col justify-between ${
                      dayItem.isCurrentMonth
                        ? 'bg-slate-50/50 dark:bg-slate-950/30 border-slate-100 dark:border-slate-800/80 hover:border-slate-300 dark:hover:border-slate-700'
                        : 'bg-transparent border-transparent text-slate-300 dark:text-slate-600 opacity-60'
                    } ${
                      dayItem.isToday
                        ? 'ring-2 ring-emerald-500/50 dark:ring-emerald-500/60 font-semibold'
                        : ''
                    } ${
                      isSelected
                        ? 'border-emerald-600 dark:border-emerald-500 bg-emerald-50/40 dark:bg-emerald-950/30'
                        : ''
                    }`}
                  >
                    {/* Day number & count */}
                    <div className="flex items-center justify-between">
                      <span
                        className={`text-xs ${
                          dayItem.isToday
                            ? 'inline-flex items-center justify-center w-5 h-5 rounded-full bg-emerald-600 text-white'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {dayItem.dayNumber}
                      </span>
                      {billsOnDay.length > 0 && (
                        <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                          {billsOnDay.length} {billsOnDay.length === 1 ? 'bill' : 'bills'}
                        </span>
                      )}
                    </div>

                    {/* Bill Indicators on Calendar Day */}
                    <div className="space-y-1 mt-1 overflow-hidden">
                      {billsOnDay.slice(0, 2).map((b) => {
                        const style = getCategoryStyles(b.category);
                        const isSkippedThisCycle =
                          b.status === 'skipped' ||
                          (b.skippedCycles &&
                            b.skippedCycles.some(
                              (sc) => sc.split('T')[0] === dayItem.isoDateString
                            ));

                        return (
                          <div
                            key={b.id}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1 ${
                              isSkippedThisCycle
                                ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 line-through'
                                : `${style.bg} ${style.text} border ${style.border}`
                            }`}
                            title={`${b.title} - ₦${b.amount.toLocaleString()} (${b.provider})`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${style.dot} shrink-0`} />
                            <span className="truncate">
                              {b.provider} ₦{(b.amount / 1000).toFixed(0)}k
                            </span>
                          </div>
                        );
                      })}
                      {billsOnDay.length > 2 && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium pl-1 block">
                          +{billsOnDay.length - 2} more
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Calendar Legend */}
            <div className="flex flex-wrap items-center gap-4 pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-700 dark:text-slate-300">
                {language === 'ha' ? 'Rarrabuwar Launi:' : 'Categories:'}
              </span>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Electricity</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Data</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Airtime</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500" />
                <span>Cable TV</span>
              </div>
            </div>
          </div>

          {/* Selected Date Inspector & Quick Actions (1 Col on lg) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                    {language === 'ha' ? 'Ranar da Aka Zaba' : 'Selected Date'}
                  </h3>
                  <p className="text-base font-bold text-slate-900 dark:text-white">
                    {selectedCalendarDate?.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  {selectedDateBills.length} {selectedDateBills.length === 1 ? 'cycle' : 'cycles'}
                </span>
              </div>

              {selectedDateBills.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
                    <CalendarClock className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    {language === 'ha'
                      ? 'Babu biyan kudi da aka tsara a wannan ranar.'
                      : 'No scheduled bills due on this date.'}
                  </p>
                  <button
                    type="button"
                    onClick={handleOpenCreateModal}
                    className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                  >
                    + Schedule a bill for this date
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {selectedDateBills.map((payment) => {
                    const style = getCategoryStyles(payment.category);
                    const CategoryIcon = style.icon;
                    const isSkipped = payment.status === 'skipped';

                    return (
                      <div
                        key={payment.id}
                        className={`p-3.5 rounded-lg border transition-all ${
                          isSkipped
                            ? 'bg-slate-50 dark:bg-slate-950/40 border-slate-200 dark:border-slate-800 opacity-70'
                            : `${style.bg} ${style.border}`
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`p-1.5 rounded-md ${style.bg} ${style.text}`}>
                              <CategoryIcon className="w-4 h-4" />
                            </span>
                            <div>
                              <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                                {payment.title}
                              </h4>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {payment.provider} · {payment.recipient}
                              </span>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-slate-900 dark:text-white whitespace-nowrap">
                            ₦{payment.amount.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2.5 mt-2 border-t border-slate-200/50 dark:border-slate-800">
                          <span>
                            {payment.frequency.toUpperCase()} · At {payment.executionTime}
                          </span>
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {payment.autoDebitWallet ? 'Auto-debit' : 'Manual'}
                          </span>
                        </div>

                        {/* Interactive Direct Actions */}
                        <div className="flex items-center gap-2 pt-3 mt-2 border-t border-slate-200/50 dark:border-slate-800">
                          {isSkipped ? (
                            <button
                              type="button"
                              onClick={() => handleUndoSkip(payment.id)}
                              className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 text-slate-700 dark:text-slate-200 transition-colors"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{language === 'ha' ? 'Maida Shi' : 'Unskip'}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleSkipCycle(payment)}
                              className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                            >
                              <SkipForward className="w-3.5 h-3.5 text-blue-600" />
                              <span>{language === 'ha' ? 'Tsallake' : 'Skip Cycle'}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleOpenModifyModal(payment)}
                            className="flex-1 inline-flex items-center justify-center gap-1 py-1.5 text-xs font-semibold rounded bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-colors"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>{language === 'ha' ? 'Gyara' : 'Modify'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Smart Advice Box */}
            <div className="mt-4 p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              <span>
                {language === 'ha'
                  ? 'Kudaden da aka tsara suna biyan kansu ta asusunka. Za a sanar da kai kafin da bayan kowane biya.'
                  : 'Automated debits run through pairgate/clubkonnect with multi-layer verification. Receipts are stored offline for immediate download.'}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SCHEDULE CARDS VIEW */}
      {viewMode === 'cards' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchedules.map((payment) => {
            const style = getCategoryStyles(payment.category);
            const CategoryIcon = style.icon;
            const isSkipped = payment.status === 'skipped';
            const isPaused = payment.status === 'paused';

            return (
              <div
                key={payment.id}
                className={`bg-white dark:bg-slate-900 border rounded-xl p-5 shadow-xs transition-all flex flex-col justify-between ${
                  isSkipped
                    ? 'border-blue-300 dark:border-blue-900 ring-1 ring-blue-400/20'
                    : isPaused
                    ? 'border-slate-300 dark:border-slate-800 opacity-75'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Top Section */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`p-2 rounded-lg ${style.bg} ${style.text}`}>
                        <CategoryIcon className="w-4 h-4" />
                      </span>
                      <div>
                        <span className="text-xs font-bold tracking-wider uppercase text-slate-500 dark:text-slate-400">
                          {payment.provider}
                        </span>
                        <span className="mx-1.5 text-slate-300 dark:text-slate-600">·</span>
                        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                          {style.badgeText}
                        </span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <span
                      className={`px-2 py-0.5 text-[11px] font-semibold rounded-md ${
                        isSkipped
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300'
                          : isPaused
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                          : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                      }`}
                    >
                      {isSkipped
                        ? 'Skipped Next Cycle'
                        : isPaused
                        ? 'Paused'
                        : 'Active Automated'}
                    </span>
                  </div>

                  {/* Card Title & Note */}
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                      {payment.title}
                    </h3>
                    {payment.note && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                        {payment.note}
                      </p>
                    )}
                  </div>

                  {/* Recipient Number */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-950/50 border border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">
                        {payment.category === 'electricity'
                          ? 'Meter:'
                          : payment.category === 'cable_tv'
                          ? 'Smartcard:'
                          : 'Phone:'}
                      </span>
                      <span className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                        {payment.recipient}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(payment.recipient, payment.id)}
                      className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      title="Copy recipient"
                    >
                      {copiedId === payment.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Amount & Frequency */}
                  <div className="flex items-baseline justify-between pt-1">
                    <div>
                      <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
                        ₦{payment.amount.toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 ml-1.5">
                        /{payment.frequency}
                      </span>
                    </div>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      {payment.totalExecutions || 0} renewals
                    </span>
                  </div>

                  {/* Next Execution Date & Countdown */}
                  <div className="p-2.5 rounded-lg bg-slate-50/70 dark:bg-slate-950/40 border border-slate-100 dark:border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Next Bill:
                      </span>
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                        {formatCountdown(payment.nextRunDate)}
                      </span>
                    </div>
                    <div className="text-xs font-medium text-slate-800 dark:text-slate-200">
                      {new Date(payment.nextRunDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })}{' '}
                      at {payment.executionTime}
                    </div>
                  </div>
                </div>

                {/* DIRECT ACTION BUTTONS (Skip & Modify) */}
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Skip / Unskip Button */}
                    {isSkipped ? (
                      <button
                        type="button"
                        onClick={() => handleUndoSkip(payment.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>{language === 'ha' ? 'Maida Biyan' : 'Unskip'}</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleSkipCycle(payment)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                        title="Skip this upcoming bill cycle"
                      >
                        <SkipForward className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        <span>{language === 'ha' ? 'Tsallake' : 'Skip Cycle'}</span>
                      </button>
                    )}

                    {/* Modify Button */}
                    <button
                      type="button"
                      onClick={() => handleOpenModifyModal(payment)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{language === 'ha' ? 'Gyara' : 'Modify'}</span>
                    </button>
                  </div>

                  {/* Secondary Actions Row */}
                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <button
                      type="button"
                      onClick={() => handleRunNow(payment)}
                      className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 font-medium inline-flex items-center gap-1 hover:underline"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>{language === 'ha' ? 'Biya Yanzu' : 'Run Now'}</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => handleTogglePause(payment)}
                        className="hover:text-slate-800 dark:hover:text-slate-200"
                        title={isPaused ? 'Resume Schedule' : 'Pause Schedule'}
                      >
                        {isPaused ? 'Resume' : 'Pause'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteSchedule(payment.id, payment.title)}
                        className="text-rose-500 hover:text-rose-600"
                        title="Delete schedule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: UPCOMING BILL CYCLES TIMELINE */}
      {viewMode === 'timeline' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'ha' ? 'Jerin Lokutan Biyan Kudi' : 'Chronological Bill Timeline'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sorted by upcoming execution date for the next 30 days.
              </p>
            </div>
            <span className="text-xs text-slate-400">
              Total: {filteredSchedules.length} schedules
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {[...filteredSchedules]
              .sort(
                (a, b) =>
                  new Date(a.nextRunDate).getTime() - new Date(b.nextRunDate).getTime()
              )
              .map((payment) => {
                const style = getCategoryStyles(payment.category);
                const CategoryIcon = style.icon;
                const isSkipped = payment.status === 'skipped';

                return (
                  <div
                    key={payment.id}
                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3">
                      <span className={`p-2.5 rounded-xl ${style.bg} ${style.text} shrink-0`}>
                        <CategoryIcon className="w-5 h-5" />
                      </span>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                            {payment.title}
                          </h4>
                          {isSkipped && (
                            <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300">
                              Skipped
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                          {payment.provider} · {payment.recipient} · {payment.frequency} cycle at{' '}
                          {payment.executionTime}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                      <div className="text-right">
                        <span className="text-base font-extrabold text-slate-900 dark:text-white block">
                          ₦{payment.amount.toLocaleString()}
                        </span>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 block">
                          {formatCountdown(payment.nextRunDate)} (
                          {new Date(payment.nextRunDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                          )
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {isSkipped ? (
                          <button
                            type="button"
                            onClick={() => handleUndoSkip(payment.id)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 transition-colors"
                          >
                            Unskip
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSkipCycle(payment)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                          >
                            Skip
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenModifyModal(payment)}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90 transition-opacity"
                        >
                          Modify
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {/* MODIFY / CREATE SCHEDULE MODAL */}
      {(editingPayment || isCreatingNew) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-5 my-8">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {isCreatingNew
                    ? language === 'ha'
                      ? 'Kirkiri Sabon Jadawali'
                      : 'Create Smart Schedule'
                    : language === 'ha'
                    ? 'Gyara Jadawalin Biyan Kudi'
                    : 'Modify Scheduled Bill'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingPayment(null);
                  setIsCreatingNew(false);
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-semibold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveSchedule} className="space-y-4">
              {/* Category Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Service Category
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { id: 'electricity', label: 'Electricity', icon: Zap },
                    { id: 'data', label: 'Data', icon: Wifi },
                    { id: 'airtime', label: 'Airtime', icon: Smartphone },
                    { id: 'cable_tv', label: 'Cable TV', icon: Tv },
                  ].map((cat) => {
                    const CatIcon = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => {
                          setFormCategory(cat.id as any);
                          if (cat.id === 'electricity') setFormProvider('KEDCO');
                          else if (cat.id === 'data') setFormProvider('MTN');
                          else if (cat.id === 'airtime') setFormProvider('MTN');
                          else setFormProvider('DSTV');
                        }}
                        className={`p-2.5 rounded-lg border text-xs font-semibold flex flex-col items-center gap-1 transition-all ${
                          formCategory === cat.id
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <CatIcon className="w-4 h-4" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Title & Provider */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Schedule Title
                  </label>
                  <input
                    type="text"
                    required
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="e.g. Monthly Home Electricity"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Provider
                  </label>
                  <input
                    type="text"
                    required
                    value={formProvider}
                    onChange={(e) => setFormProvider(e.target.value)}
                    placeholder="e.g. KEDCO, MTN, DSTV"
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Recipient & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Recipient Identifier
                  </label>
                  <input
                    type="text"
                    required
                    value={formRecipient}
                    onChange={(e) => setFormRecipient(e.target.value)}
                    placeholder={
                      formCategory === 'electricity'
                        ? '0428-9921-504 (Meter)'
                        : formCategory === 'cable_tv'
                        ? '4102938471 (Smartcard)'
                        : '08031234567 (Phone)'
                    }
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Debit Amount (₦)
                  </label>
                  <input
                    type="number"
                    min="100"
                    step="50"
                    required
                    value={formAmount}
                    onChange={(e) => setFormAmount(Number(e.target.value))}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Frequency & Execution Day */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Frequency
                  </label>
                  <select
                    value={formFrequency}
                    onChange={(e) => setFormFrequency(e.target.value as ScheduleFrequency)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="daily">Daily</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {formFrequency === 'weekly' ? 'Day of Week' : 'Day of Month'}
                  </label>
                  {formFrequency === 'weekly' ? (
                    <select
                      value={formDay}
                      onChange={(e) => setFormDay(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                    >
                      <option value={1}>Monday</option>
                      <option value={2}>Tuesday</option>
                      <option value={3}>Wednesday</option>
                      <option value={4}>Thursday</option>
                      <option value={5}>Friday</option>
                      <option value={6}>Saturday</option>
                      <option value={0}>Sunday</option>
                    </select>
                  ) : (
                    <input
                      type="number"
                      min="1"
                      max="31"
                      value={formDay}
                      onChange={(e) => setFormDay(Number(e.target.value))}
                      className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                    />
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Execution Time
                  </label>
                  <input
                    type="time"
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Note / Memo */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Note / Memo (Optional)
                </label>
                <input
                  type="text"
                  value={formNote}
                  onChange={(e) => setFormNote(e.target.value)}
                  placeholder="e.g. Tarauni Kano Residence primary meter"
                  className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-white"
                />
              </div>

              {/* Auto Debit Toggle */}
              <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">
                    Automatic Wallet Debit
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">
                    Debit wallet automatically without prompting for PIN on due date
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={formAutoDebit}
                  onChange={(e) => setFormAutoDebit(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setEditingPayment(null);
                    setIsCreatingNew(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                >
                  {isCreatingNew ? 'Create Schedule' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
