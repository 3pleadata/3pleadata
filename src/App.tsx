import React, { useState, useEffect } from 'react';
import { AppState, loadAppState, saveAppState, deduplicateTransactions } from './services/storage';
import { NotificationItem, Transaction, User, UserRole } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ReceiptModal } from './components/ReceiptModal';
import { FundWalletModal } from './components/FundWalletModal';
import { AuthModal } from './pages/AuthModal';
import { FloatingAssistantButton } from './components/FloatingAssistantButton';
import { AiAssistantPanel } from './components/AiAssistantPanel';

import { HomeDashboard } from './pages/HomeDashboard';
import { AirtimePage } from './pages/AirtimePage';
import { DataPage } from './pages/DataPage';
import { ElectricityPage } from './pages/ElectricityPage';
import { CableTvPage } from './pages/CableTvPage';
import { EducationPage } from './pages/EducationPage';
import { FlightsPage } from './pages/FlightsPage';
import { EstatePage } from './pages/EstatePage';
import { RetailerPortal } from './pages/RetailerPortal';
import { AdminDashboard } from './pages/AdminDashboard';
import { DeveloperPortal } from './pages/DeveloperPortal';
import { SupportPage } from './pages/SupportPage';
import { ScheduledPaymentsPage } from './pages/ScheduledPaymentsPage';
import { LegalPage } from './pages/LegalPage';

import { DoubleEntryLedgerEngine } from './services/ledger';
import { BiometricAuthOverlay } from './components/BiometricAuthOverlay';
import { SessionLockScreen } from './components/SessionLockScreen';
import { InactivityWarningBanner } from './components/InactivityWarningBanner';
import {
  isBiometricSessionValid,
  clearBiometricSession,
  getBiometricConfig,
  BiometricTarget,
  playBiometricSound,
} from './services/biometrics';
import {
  getAutoLogoutConfig,
  isSessionLocked,
  setSessionLocked,
  recordUserActivity,
  getLastUserActivity,
} from './services/security';
import { ThemeMode, getInitialTheme, applyTheme } from './services/theme';
import {
  Language,
  getStoredLanguage,
  saveStoredLanguage,
} from './services/i18n';

export default function App() {
  const [state, setState] = useState<AppState>(loadAppState);
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [language, setLanguage] = useState<Language>(getStoredLanguage);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);

  const handleSetLanguage = (newLang: Language) => {
    setLanguage(newLang);
    saveStoredLanguage(newLang);
  };

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language;
    }
  }, [language]);

  // Session Inactivity Lock & Auto-Logout State
  const [isAppSessionLocked, setIsAppSessionLocked] = useState<boolean>(() => isSessionLocked());
  const [inactivityWarningSeconds, setInactivityWarningSeconds] = useState<number | null>(null);
  const lastUserActivityRef = React.useRef<number>(getLastUserActivity());

  // Inactivity Watchdog & Auto-Logout Timer Engine
  useEffect(() => {
    // Record initial activity
    recordUserActivity();
    lastUserActivityRef.current = Date.now();

    const updateActivity = () => {
      lastUserActivityRef.current = Date.now();
      recordUserActivity();
      setInactivityWarningSeconds(null);
    };

    // User activity listeners
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
    let throttleTimeout: any = null;

    const throttledHandler = () => {
      if (!throttleTimeout) {
        updateActivity();
        throttleTimeout = setTimeout(() => {
          throttleTimeout = null;
        }, 1200);
      }
    };

    activityEvents.forEach((ev) => window.addEventListener(ev, throttledHandler, { passive: true }));

    // 1-second interval checking elapsed inactivity
    const interval = setInterval(() => {
      const config = getAutoLogoutConfig();
      if (!config.enabled) {
        setInactivityWarningSeconds(null);
        return;
      }

      // If already locked, keep locked state synced
      if (isSessionLocked()) {
        setIsAppSessionLocked(true);
        setInactivityWarningSeconds(null);
        return;
      }

      const elapsedSeconds = Math.floor((Date.now() - lastUserActivityRef.current) / 1000);
      const timeoutSeconds = config.timeoutMinutes * 60;
      const warningThreshold = Math.max(10, config.warningSeconds || 30);

      if (elapsedSeconds >= timeoutSeconds) {
        // Exceeded inactivity timeout -> Lock session!
        setSessionLocked(true, 'inactivity');
        setIsAppSessionLocked(true);
        setInactivityWarningSeconds(null);
        clearBiometricSession();
        setBiometricTick((t) => t + 1);
        if (config.soundAlertOnLock) {
          playBiometricSound('fail');
        }
      } else if (config.warningSeconds > 0 && elapsedSeconds >= timeoutSeconds - warningThreshold) {
        // In warning countdown phase
        const remaining = timeoutSeconds - elapsedSeconds;
        setInactivityWarningSeconds(remaining);
      } else {
        setInactivityWarningSeconds(null);
      }
    }, 1000);

    // Tab blur / visibilitychange handler
    const handleBlurOrHide = () => {
      const config = getAutoLogoutConfig();
      if (config.enabled && (config.lockOnBlur || getBiometricConfig().autoLockOnBlur)) {
        setSessionLocked(true, 'blur');
        setIsAppSessionLocked(true);
        setInactivityWarningSeconds(null);
        clearBiometricSession();
        setBiometricTick((t) => t + 1);
        if (config.soundAlertOnLock) {
          playBiometricSound('fail');
        }
      }
    };

    const handleVisibility = () => {
      if (document.hidden) {
        handleBlurOrHide();
      }
    };

    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('blur', handleBlurOrHide);

    return () => {
      activityEvents.forEach((ev) => window.removeEventListener(ev, throttledHandler));
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('blur', handleBlurOrHide);
    };
  }, []);

  const handleUnlockSession = () => {
    setSessionLocked(false);
    setIsAppSessionLocked(false);
    setInactivityWarningSeconds(null);
    lastUserActivityRef.current = Date.now();
    recordUserActivity();
  };

  const handleLockSessionNow = () => {
    setSessionLocked(true, 'manual');
    setIsAppSessionLocked(true);
    setInactivityWarningSeconds(null);
    clearBiometricSession();
    setBiometricTick((t) => t + 1);
    const config = getAutoLogoutConfig();
    if (config.soundAlertOnLock) {
      playBiometricSound('fail');
    }
  };

  const handleStayLoggedIn = () => {
    lastUserActivityRef.current = Date.now();
    recordUserActivity();
    setInactivityWarningSeconds(null);
  };

  const handleToggleTheme = () => {
    const isCurrentlyDark =
      theme === 'dark' ||
      (theme === 'system' &&
        typeof window !== 'undefined' &&
        window.matchMedia('(prefers-color-scheme: dark)').matches);
    const nextTheme: ThemeMode = isCurrentlyDark ? 'light' : 'dark';
    setTheme(nextTheme);
    applyTheme(nextTheme);
  };

  const handleSetTheme = (newTheme: ThemeMode) => {
    setTheme(newTheme);
    applyTheme(newTheme);
  };

  // Modals state
  const [selectedReceiptTx, setSelectedReceiptTx] = useState<Transaction | null>(null);
  const [showFundModal, setShowFundModal] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showAiAssistant, setShowAiAssistant] = useState<boolean>(false);

  // Biometric Protection State
  const [biometricTarget, setBiometricTarget] = useState<BiometricTarget | null>(null);
  const [pendingBiometricAction, setPendingBiometricAction] = useState<(() => void) | null>(null);
  const [, setBiometricTick] = useState<number>(0);

  const isBiometricActive =
    isBiometricSessionValid('wallet_funding') || isBiometricSessionValid('admin_dashboard');

  const handleRequestBiometric = (target: BiometricTarget, onAuthorized: () => void) => {
    if (isBiometricSessionValid(target)) {
      onAuthorized();
      return;
    }
    setBiometricTarget(target);
    setPendingBiometricAction(() => onAuthorized);
  };

  const handleOpenFundModal = () => {
    handleRequestBiometric('wallet_funding', () => {
      setShowFundModal(true);
    });
  };

  const handleNavigateTab = (tab: string) => {
    if (tab === 'admin') {
      handleRequestBiometric('admin_dashboard', () => {
        setActiveTab('admin');
      });
      return;
    }
    setActiveTab(tab);
  };

  const handleBiometricSuccess = () => {
    const action = pendingBiometricAction;
    setBiometricTarget(null);
    setPendingBiometricAction(null);
    setBiometricTick((t) => t + 1);
    if (action) {
      action();
    }
  };

  const handleLockBiometrics = () => {
    clearBiometricSession();
    setBiometricTick((t) => t + 1);
    if (activeTab === 'admin') {
      setActiveTab('dashboard');
    }
  };

  const handleTriggerBiometricTest = (target: BiometricTarget = 'general') => {
    setBiometricTarget(target);
    setPendingBiometricAction(null);
  };

  // Sync state to localStorage on update
  const updateState = (newState: Partial<AppState>) => {
    setState((prev) => {
      const merged = { ...prev, ...newState };
      if (merged.transactions) {
        merged.transactions = deduplicateTransactions(merged.transactions);
      }
      if (merged.users && merged.currentUser) {
        const matched = merged.users.find((u) => u.id === merged.currentUser.id);
        if (matched) {
          merged.currentUser = matched;
        }
      }
      saveAppState(merged);
      return merged;
    });
  };

  const handleFundSuccess = (amount: number, gateway: 'paystack' | 'monnify', ref: string) => {
    const newTx: Transaction = {
      id: `tx_${Date.now()}`,
      reference: ref,
      idempotencyKey: `idem_fund_${Date.now()}`,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userPhone: state.currentUser.phone,
      type: 'wallet_funding',
      amount,
      fee: 0,
      discount: 0,
      totalDebited: amount,
      status: 'successful',
      provider: gateway === 'paystack' ? 'Paystack Gateway' : 'Monnify Virtual Account',
      providerReference: `${gateway.toUpperCase()}_SETTLE_${Math.floor(100000 + Math.random() * 900000)}`,
      productName: `Wallet Funding via ${gateway.toUpperCase()}`,
      recipient: 'Main Wallet NGN',
      metadata: { gateway, channel: 'Dedicated Virtual Account / Card Settlement' },
      createdAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
    };

    const ledgerEntries = DoubleEntryLedgerEngine.recordWalletFunding(newTx, gateway);

    const updatedUser = {
      ...state.currentUser,
      walletBalance: state.currentUser.walletBalance + amount,
    };

    const notif: NotificationItem = {
      id: `notif_${Date.now()}`,
      userId: state.currentUser.id,
      title: language === 'ha' ? 'An Saka Kudi a Walat' : 'Wallet Credited Successfully',
      message:
        language === 'ha'
          ? `An samu nasarar saka ₦${amount.toLocaleString()} a walat dinka ta hanyar ${gateway.toUpperCase()}. Ref: ${newTx.reference}`
          : `₦${amount.toLocaleString()} received via ${gateway.toUpperCase()} Channel. Ref: ${newTx.reference}`,
      type: 'transaction',
      read: false,
      createdAt: new Date().toISOString(),
    };

    updateState({
      currentUser: updatedUser,
      transactions: [newTx, ...state.transactions],
      ledger: [...state.ledger, ...ledgerEntries],
      notifications: [notif, ...(state.notifications || [])],
    });

    setSelectedReceiptTx(newTx);
  };

  const handleRoleSwitch = (newRole: UserRole) => {
    updateState({
      currentUser: { ...state.currentUser, role: newRole },
    });
  };

  const handleSwitchUser = (newUser: User) => {
    updateState({ currentUser: newUser });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-150">
      {/* Top Bar Header */}
      <Header
        currentUser={state.currentUser}
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        language={language}
        setLanguage={handleSetLanguage}
        onOpenFundModal={handleOpenFundModal}
        onOpenAuthModal={() => setShowAuthModal(true)}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onRoleSwitch={handleRoleSwitch}
        isBiometricActive={isBiometricActive}
        onLockBiometrics={handleLockBiometrics}
        onTriggerBiometricTest={() => handleTriggerBiometricTest('general')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        state={state}
        onViewReceipt={(tx) => setSelectedReceiptTx(tx)}
        updateState={updateState}
      />

      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        {/* Sidebar Navigation */}
        <Sidebar
          currentUser={state.currentUser}
          activeTab={activeTab}
          setActiveTab={handleNavigateTab}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          language={language}
          onOpenFundModal={handleOpenFundModal}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 lg:pl-64 p-4 sm:p-6 lg:p-8 min-w-0">
          {activeTab === 'dashboard' && (
            <HomeDashboard
              state={state}
              updateState={updateState}
              setActiveTab={handleNavigateTab}
              onOpenFundModal={handleOpenFundModal}
              onViewReceipt={(tx) => setSelectedReceiptTx(tx)}
              language={language}
              onTriggerBiometricTest={() => handleTriggerBiometricTest('general')}
            />
          )}

          {activeTab === 'airtime' && (
            <AirtimePage
              state={state}
              updateState={updateState}
              onViewReceipt={(tx) => setSelectedReceiptTx(tx)}
              language={language}
            />
          )}

          {activeTab === 'data' && (
            <DataPage
              state={state}
              updateState={updateState}
              onViewReceipt={(tx) => setSelectedReceiptTx(tx)}
              language={language}
            />
          )}

          {activeTab === 'electricity' && (
            <ElectricityPage
              state={state}
              updateState={updateState}
              onViewReceipt={(tx) => setSelectedReceiptTx(tx)}
              language={language}
            />
          )}

          {activeTab === 'cable' && (
            <CableTvPage
              state={state}
              updateState={updateState}
              onViewReceipt={(tx) => setSelectedReceiptTx(tx)}
              language={language}
            />
          )}

          {(activeTab === 'schedules' || activeTab === 'scheduled_payments') && (
            <ScheduledPaymentsPage
              state={state}
              updateState={updateState}
              onViewReceipt={(tx) => setSelectedReceiptTx(tx)}
              onOpenFundModal={handleOpenFundModal}
              language={language}
            />
          )}

          {activeTab === 'education' && (
            <EducationPage
              state={state}
              updateState={updateState}
              onViewReceipt={(tx) => setSelectedReceiptTx(tx)}
              language={language}
            />
          )}

          {activeTab === 'flights' && (
            <FlightsPage
              state={state}
              updateState={updateState}
              onViewReceipt={(tx) => setSelectedReceiptTx(tx)}
              language={language}
            />
          )}

          {activeTab === 'estates' && (
            <EstatePage
              state={state}
              updateState={updateState}
              language={language}
            />
          )}

          {activeTab === 'retailer' && (
            <RetailerPortal
              state={state}
              updateState={updateState}
              onViewReceipt={(tx) => setSelectedReceiptTx(tx)}
              language={language}
            />
          )}

          {activeTab === 'admin' && (
            <AdminDashboard
              state={state}
              updateState={updateState}
              onViewReceipt={(tx) => setSelectedReceiptTx(tx)}
              language={language}
              isBiometricUnlocked={isBiometricSessionValid('admin_dashboard')}
              onRequestBiometricUnlock={() =>
                handleRequestBiometric('admin_dashboard', () => {
                  setActiveTab('admin');
                })
              }
              onLockBiometric={handleLockBiometrics}
            />
          )}

          {activeTab === 'developers' && (
            <DeveloperPortal state={state} language={language} />
          )}

          {activeTab === 'support' && (
            <SupportPage
              state={state}
              updateState={updateState}
              language={language}
            />
          )}

          {activeTab === 'legal' && (
            <LegalPage
              state={state}
              updateState={updateState}
              language={language}
            />
          )}

          {/* Universal Footer with Legal & Regulatory Disclosures */}
          <footer className="mt-12 pt-8 pb-4 border-t border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 text-xs">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="text-center md:text-left">
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  © 2026 3PLE A DATA (RC 9746103) · CAC Registered.
                </p>
                <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                  Karkasara Road, Tarauni LGA, Kano State, Nigeria · Virtual Stored-Value Wallet & Digital Utility Gateway.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 text-[11px]">
                <button
                  onClick={() => handleNavigateTab('legal')}
                  className="hover:text-amber-600 dark:hover:text-amber-400 underline-offset-4 hover:underline transition-colors font-medium"
                >
                  Privacy Policy (NDPA 2023)
                </button>
                <span>·</span>
                <button
                  onClick={() => handleNavigateTab('legal')}
                  className="hover:text-amber-600 dark:hover:text-amber-400 underline-offset-4 hover:underline transition-colors font-medium"
                >
                  Terms of Service
                </button>
                <span>·</span>
                <button
                  onClick={() => handleNavigateTab('legal')}
                  className="hover:text-amber-600 dark:hover:text-amber-400 underline-offset-4 hover:underline transition-colors font-medium"
                >
                  Refund & Dispute Policy
                </button>
                <span>·</span>
                <button
                  onClick={() => handleNavigateTab('legal')}
                  className="hover:text-red-500 underline-offset-4 hover:underline transition-colors font-medium"
                >
                  Account Deletion (App Stores)
                </button>
                <span>·</span>
                <button
                  onClick={() => handleNavigateTab('support')}
                  className="hover:text-amber-600 dark:hover:text-amber-400 underline-offset-4 hover:underline transition-colors font-medium"
                >
                  Support & Help Desk
                </button>
              </div>
            </div>
          </footer>
        </main>
      </div>

      {/* Printable & Downloadable Receipt Modal */}
      <ReceiptModal
        transaction={selectedReceiptTx}
        onClose={() => setSelectedReceiptTx(null)}
        language={language}
      />

      {/* Wallet Funding Modal (Paystack / Monnify) */}
      <FundWalletModal
        isOpen={showFundModal}
        onClose={() => setShowFundModal(false)}
        onFundSuccess={handleFundSuccess}
        currentBalance={state.currentUser.walletBalance}
      />

      {/* Role / Persona / Security Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        currentUser={state.currentUser}
        onSwitchUser={handleSwitchUser}
        language={language}
        onTestBiometrics={() => handleTriggerBiometricTest('general')}
        theme={theme}
        onSetTheme={handleSetTheme}
        onLockSessionNow={handleLockSessionNow}
      />

      {/* Floating Inactivity Pre-Lock Warning Banner */}
      <InactivityWarningBanner
        isOpen={!isAppSessionLocked && inactivityWarningSeconds !== null && inactivityWarningSeconds > 0}
        secondsRemaining={inactivityWarningSeconds || 0}
        onStayLoggedIn={handleStayLoggedIn}
        onLockNow={handleLockSessionNow}
        language={language}
      />

      {/* Full-Screen Inactivity & Security Session Lock Overlay */}
      <SessionLockScreen
        isLocked={isAppSessionLocked}
        currentUser={state.currentUser}
        onUnlock={handleUnlockSession}
        onSwitchUser={() => {
          handleUnlockSession();
          setShowAuthModal(true);
        }}
        language={language}
      />

      {/* Simulated Biometric Authentication Overlay (FaceID / Fingerprint / PIN) */}
      <BiometricAuthOverlay
        isOpen={biometricTarget !== null}
        target={biometricTarget || 'general'}
        currentUser={state.currentUser}
        language={language}
        onClose={() => {
          setBiometricTarget(null);
          setPendingBiometricAction(null);
        }}
        onSuccess={handleBiometricSuccess}
      />

      {/* Floating AI & Google Chat Assistant Button */}
      <FloatingAssistantButton
        isOpen={showAiAssistant}
        onToggle={() => setShowAiAssistant((prev) => !prev)}
        language={language}
      />

      {/* Side-Panel AI Assistant & Google Chat Support Interface */}
      <AiAssistantPanel
        isOpen={showAiAssistant}
        onClose={() => setShowAiAssistant(false)}
        currentUser={state.currentUser}
        recentTransactions={state.transactions}
        activeTab={activeTab}
        onNavigateTab={(tab) => {
          handleNavigateTab(tab);
          setShowAiAssistant(false);
        }}
        onOpenFundModal={() => {
          setShowAiAssistant(false);
          handleOpenFundModal();
        }}
        language={language}
      />
    </div>
  );
}
