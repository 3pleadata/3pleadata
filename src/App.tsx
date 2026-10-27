import React, { useState, useEffect } from 'react';
import { AppState, loadAppState, saveAppState } from './services/storage';
import { Transaction, User, UserRole } from './types';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { ReceiptModal } from './components/ReceiptModal';
import { FundWalletModal } from './components/FundWalletModal';
import { AuthModal } from './pages/AuthModal';

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

import { DoubleEntryLedgerEngine } from './services/ledger';
import { BiometricAuthOverlay } from './components/BiometricAuthOverlay';
import {
  isBiometricSessionValid,
  clearBiometricSession,
  getBiometricConfig,
  BiometricTarget,
} from './services/biometrics';
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

  // Auto-lock on blur / tab inactivity when enabled in Security preferences
  useEffect(() => {
    const handleInactivity = () => {
      const config = getBiometricConfig();
      if (config.autoLockOnBlur) {
        clearBiometricSession();
        setBiometricTick((t) => t + 1);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        handleInactivity();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleInactivity);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleInactivity);
    };
  }, []);

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

    updateState({
      currentUser: updatedUser,
      transactions: [newTx, ...state.transactions],
      ledger: [...state.ledger, ...ledgerEntries],
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
    </div>
  );
}
