import React, { useState, useEffect, useRef, useMemo } from 'react';
import { NotificationItem, Transaction, User } from '../types';
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  Wallet,
  Zap,
  ShieldAlert,
  Megaphone,
  X,
  Sparkles,
  ArrowDownLeft,
  ExternalLink,
  PlusCircle,
  Volume2,
  VolumeX,
} from 'lucide-react';

export interface NotificationBellProps {
  notifications: NotificationItem[];
  onUpdateNotifications: (updated: NotificationItem[]) => void;
  onViewReceipt?: (tx: Transaction) => void;
  transactions?: Transaction[];
  currentUser: User;
  language: 'en' | 'ha';
}

// Gentle Web Audio API sound generator for incoming real-time notifications
const playChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    // Two-tone D5 -> A5 pleasing chime
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.32);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.33);
  } catch {
    // Audio context may be restricted before initial user gesture
  }
};

export const NotificationBell: React.FC<NotificationBellProps> = ({
  notifications,
  onUpdateNotifications,
  onViewReceipt,
  transactions = [],
  currentUser,
  language,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'transactions' | 'announcements'>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [hasNewAlert, setHasNewAlert] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef<number>(notifications.length);

  // Unread count
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.read).length;
  }, [notifications]);

  // Audio & Animation trigger on new incoming notification
  useEffect(() => {
    if (notifications.length > prevCountRef.current) {
      setHasNewAlert(true);
      if (soundEnabled) {
        playChime();
      }
      const timeout = setTimeout(() => setHasNewAlert(false), 2000);
      return () => clearTimeout(timeout);
    }
    prevCountRef.current = notifications.length;
  }, [notifications.length, soundEnabled]);

  // Close dropdown on click outside or ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Filtered Notifications list
  const filteredNotifications = useMemo(() => {
    return notifications.filter((item) => {
      if (activeTab === 'transactions') {
        return item.type === 'transaction';
      }
      if (activeTab === 'announcements') {
        return item.type === 'system' || item.type === 'promo' || item.type === 'security';
      }
      return true;
    });
  }, [notifications, activeTab]);

  // Mark single notification as read
  const handleMarkAsRead = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const updated = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    onUpdateNotifications(updated);
  };

  // Mark all notifications as read
  const handleMarkAllRead = () => {
    const updated = notifications.map((n) => ({ ...n, read: true }));
    onUpdateNotifications(updated);
  };

  // Clear all notifications
  const handleClearAll = () => {
    onUpdateNotifications([]);
  };

  // Delete single notification
  const handleDeleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = notifications.filter((n) => n.id !== id);
    onUpdateNotifications(updated);
  };

  // Handle clicking on notification item
  const handleClickNotification = (item: NotificationItem) => {
    handleMarkAsRead(item.id);

    // If notification contains a reference, check for matching transaction to open receipt
    if (onViewReceipt && transactions.length > 0) {
      const matched = transactions.find((tx) => {
        return (
          item.message.includes(tx.reference) ||
          item.title.includes(tx.reference) ||
          (item.id.includes(tx.id) && tx.status === 'successful')
        );
      });
      if (matched) {
        onViewReceipt(matched);
        setIsOpen(false);
      }
    }
  };

  // Quick Simulation: Trigger incoming wallet credit
  const handleSimulateWalletCredit = () => {
    const amounts = [5000, 10000, 25000, 50000];
    const amount = amounts[Math.floor(Math.random() * amounts.length)];
    const gateways = ['Monnify', 'Paystack Direct Settlement', 'Dedicated Virtual Account'];
    const gateway = gateways[Math.floor(Math.random() * gateways.length)];
    const ref = `3PA-CR-${Date.now().toString().slice(-6)}`;

    const newNotification: NotificationItem = {
      id: `notif_${Date.now()}`,
      userId: currentUser.id,
      title: language === 'ha' ? 'An Saka Kudi a Walat' : 'Wallet Credited Successfully',
      message:
        language === 'ha'
          ? `An samu nasarar saka ₦${amount.toLocaleString()} a walat dinka ta hanyar ${gateway}. Ref: ${ref}`
          : `₦${amount.toLocaleString()} credited to your wallet via ${gateway}. Ref: ${ref}`,
      type: 'transaction',
      read: false,
      createdAt: new Date().toISOString(),
    };

    onUpdateNotifications([newNotification, ...notifications]);
  };

  // Quick Simulation: Trigger platform announcement
  const handleSimulateAnnouncement = () => {
    const announcements = [
      {
        enTitle: 'Kano KEDCO Power Token Speed Update',
        enMsg: 'Token delivery latency on Pairgate DISCO route reduced to 1.1s. Instant prepaid token generation live.',
        haTitle: 'Saurin Samar da Wutar KEDCO',
        haMsg: 'An kara saurin tura lambar wutar lantarki ta KEDCO zuwa daƙiƙa 1.1. Yana aiki nan take.',
      },
      {
        enTitle: 'MTN SME & CG Data Bundle Cashback',
        enMsg: 'Special 3.5% commission active for all SME corporate gifting recharges throughout this week.',
        haTitle: 'Karin Ragi akan Data na MTN',
        haMsg: 'Karin kaso 3.5% na alawus yana aiki akan duk sayayyar Data a wannan satin.',
      },
      {
        enTitle: 'Biometric Security Protocol Activated',
        enMsg: 'Biometric verification cleared for Kano Tarauni node. Session protected with encrypted local enclave.',
        haTitle: 'Kariyar Tantance Fuska da Yatsa',
        haMsg: 'An kammala tantance tsaro a kumbon Kano Tarauni tare da ingantacciyar kariya.',
      },
    ];

    const pick = announcements[Math.floor(Math.random() * announcements.length)];
    const newNotification: NotificationItem = {
      id: `notif_${Date.now()}`,
      userId: currentUser.id,
      title: language === 'ha' ? pick.haTitle : pick.enTitle,
      message: language === 'ha' ? pick.haMsg : pick.enMsg,
      type: 'system',
      read: false,
      createdAt: new Date().toISOString(),
    };

    onUpdateNotifications([newNotification, ...notifications]);
  };

  // Format relative timestamp
  const formatTimeAgo = (isoString: string) => {
    try {
      const now = new Date();
      const past = new Date(isoString);
      const diffMs = now.getTime() - past.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffSecs < 60) return language === 'ha' ? 'Yanzu' : 'Just now';
      if (diffMins < 60) return `${diffMins}m ${language === 'ha' ? 'da suka wuce' : 'ago'}`;
      if (diffHours < 24) return `${diffHours}h ${language === 'ha' ? 'da suka wuce' : 'ago'}`;
      if (diffDays === 1) return language === 'ha' ? 'Jiya' : 'Yesterday';
      return `${diffDays}d ${language === 'ha' ? 'da suka wuce' : 'ago'}`;
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Notification Bell Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`relative p-2 rounded-xl transition-all ${
          isOpen
            ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400'
            : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
        } ${hasNewAlert ? 'ring-2 ring-amber-400 animate-bounce' : ''}`}
        title={
          language === 'ha'
            ? `Sanarwa (${unreadCount} ba a duba ba)`
            : `Notifications (${unreadCount} unread)`
        }
        aria-label="Open notifications"
        aria-expanded={isOpen}
      >
        <Bell className="w-4 h-4" />

        {/* Unread badge & pulsing indicator */}
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-extrabold text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
            <span className="absolute -inset-0.5 rounded-full bg-rose-500 opacity-60 animate-ping" />
          </span>
        )}
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 overflow-hidden flex flex-col max-h-[82vh] transition-all animate-in fade-in-0 zoom-in-95">
          {/* Popover Header */}
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/60 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {language === 'ha' ? 'Sanarwa & Sakonni' : 'Notifications & Updates'}
              </span>
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  {unreadCount} {language === 'ha' ? 'sabo' : 'new'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              {/* Sound Toggle */}
              <button
                type="button"
                onClick={() => setSoundEnabled((prev) => !prev)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
                title={soundEnabled ? 'Mute chime' : 'Enable chime'}
                aria-label="Toggle chime sound"
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              {/* Mark all as read */}
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={handleMarkAllRead}
                  className="p-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 rounded-lg transition-colors"
                  title={language === 'ha' ? 'Duba duka' : 'Mark all as read'}
                  aria-label="Mark all as read"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Clear all */}
              {notifications.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="p-1.5 text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg transition-colors"
                  title={language === 'ha' ? 'Share duka' : 'Clear all'}
                  aria-label="Clear all notifications"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Filter Pills */}
          <div className="px-3 pt-2.5 pb-2 flex gap-1.5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
            {[
              { id: 'all', label: language === 'ha' ? 'Duka' : 'All' },
              { id: 'transactions', label: language === 'ha' ? 'Ciniki & Kudi' : 'Transactions' },
              { id: 'announcements', label: language === 'ha' ? 'Sanarwa' : 'Announcements' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all ${
                  activeTab === tab.id
                    ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Notification Items List */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredNotifications.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto mb-2">
                  <Bell className="w-5 h-5 opacity-40" />
                </div>
                <div className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  {language === 'ha' ? 'Babu Sabbin Sanarwa' : 'No Notifications'}
                </div>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  {language === 'ha'
                    ? 'Duk abubuwan da suka shafi asusunka sun kammala.'
                    : "You're all caught up with your wallet & activity."}
                </p>
              </div>
            ) : (
              filteredNotifications.map((item) => {
                const isWalletOrPayment = item.type === 'transaction';
                const isSecurity = item.type === 'security';
                const isSystem = item.type === 'system' || item.type === 'promo';

                return (
                  <div
                    key={item.id}
                    onClick={() => handleClickNotification(item)}
                    className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer group ${
                      !item.read
                        ? 'bg-amber-50/40 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    {/* Notification Type Icon */}
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 border ${
                        isWalletOrPayment
                          ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800'
                          : isSecurity
                          ? 'bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-800'
                          : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                      }`}
                    >
                      {isWalletOrPayment ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : isSecurity ? (
                        <ShieldAlert className="w-4 h-4" />
                      ) : (
                        <Megaphone className="w-4 h-4" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span
                          className={`text-xs font-bold truncate ${
                            !item.read
                              ? 'text-slate-900 dark:text-white'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {item.title}
                        </span>
                        <span className="text-[10px] text-slate-400 whitespace-nowrap shrink-0">
                          {formatTimeAgo(item.createdAt)}
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>

                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100/60 dark:border-slate-800/60">
                        <span className="text-[10px] font-mono uppercase text-slate-400">
                          {item.type}
                        </span>

                        <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          {!item.read && (
                            <button
                              type="button"
                              onClick={(e) => handleMarkAsRead(item.id, e)}
                              className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                              {language === 'ha' ? 'Duba' : 'Mark Read'}
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteItem(item.id, e)}
                            className="p-1 text-slate-400 hover:text-rose-500 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Unread dot */}
                    {!item.read && (
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 mt-1 shadow-xs" />
                    )}
                  </div>
                );
              })
            )}
          </div>

          {/* Real-time Simulator / Quick Test Drawer */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-100 dark:border-slate-800 shrink-0 space-y-2">
            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                <span>Test Real-Time Events</span>
              </span>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                Live Listener Active
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleSimulateWalletCredit}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-xl text-[11px] font-semibold text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1 shadow-2xs"
              >
                <PlusCircle className="w-3 h-3 text-emerald-500" />
                <span>+ Wallet Credit</span>
              </button>

              <button
                type="button"
                onClick={handleSimulateAnnouncement}
                className="px-2.5 py-1.5 bg-white dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600 rounded-xl text-[11px] font-semibold text-slate-800 dark:text-slate-200 transition-colors flex items-center justify-center gap-1 shadow-2xs"
              >
                <Megaphone className="w-3 h-3 text-amber-500" />
                <span>+ Announcement</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
