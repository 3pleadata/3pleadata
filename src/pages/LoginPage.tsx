import React, { useState } from 'react';
import { AppState } from '../services/storage';
import { User, UserRole } from '../types';
import {
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  Eye,
  EyeOff,
  User as UserIcon,
  Store,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ScanFace,
  Sparkles,
  KeyRound,
  Fingerprint,
  MapPin,
  Building,
  Check,
  RotateCcw,
  LogOut,
  Laptop,
} from 'lucide-react';
import { Language, t } from '../services/i18n';
import {
  isHardwareBiometricAvailable,
  recordBiometricSuccess,
  playBiometricSound,
  triggerBiometricHaptic,
} from '../services/biometrics';

interface LoginPageProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  setActiveTab: (tab: string) => void;
  language: Language;
  onSwitchLanguage?: () => void;
  onOpenFundModal?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  state,
  updateState,
  setActiveTab,
  language,
  onSwitchLanguage,
}) => {
  const { currentUser, users = [] } = state;

  const [authMode, setAuthMode] = useState<'signin' | 'register' | 'phone_pin'>('signin');
  const [identifier, setIdentifier] = useState('3pleadata@gmail.com');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(
    null
  );

  // Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<UserRole>('customer');
  const [regPassword, setRegPassword] = useState('');
  const [regPin, setRegPin] = useState('1234');
  const [regState, setRegState] = useState('Kano State');
  const [regTerms, setRegTerms] = useState(true);

  // Phone PIN Quick Login state
  const [pinPhone, setPinPhone] = useState('+234 803 123 4567');
  const [pinCode, setPinCode] = useState('1234');

  // Forgot password dialog
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotTarget, setForgotTarget] = useState('');
  const [forgotStep, setForgotStep] = useState<'input' | 'otp' | 'success'>('input');
  const [forgotOtp, setForgotOtp] = useState('');

  const demoAccounts = [
    {
      name: 'Aliyu Mohammed Kano',
      email: '3pleadata@gmail.com',
      phone: '+234 803 123 4567',
      role: 'super_admin' as UserRole,
      roleTitle: 'Super Administrator',
      balance: 450000,
      description: 'Platform executive, double-entry ledger auditor, and bank clearing supervisor.',
      badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300/40',
      icon: ShieldAlert,
    },
    {
      name: 'Fatima Aminu Zaria',
      email: 'fatima.zaria@subhub.ng',
      phone: '+234 813 456 7890',
      role: 'retailer' as UserRole,
      roleTitle: 'Wholesale VTU Reseller',
      balance: 620000,
      description: 'Telecom reseller managing high-volume MTN, Airtel, and Glo data distributions.',
      badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40',
      icon: Store,
    },
    {
      name: 'Ibrahim Bello Karkasara',
      email: 'ibrahim.karkasara@yahoo.com',
      phone: '+234 806 778 9901',
      role: 'agent' as UserRole,
      roleTitle: 'Agency & POS Cashier',
      balance: 195000,
      description: 'Kano municipal agency banking, utility tokens clearing, and merchant cash deposits.',
      badgeColor: 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-300/40',
      icon: Building,
    },
    {
      name: 'Alhaji Musa Sulaiman',
      email: 'musa.sulaiman@gmail.com',
      phone: '+234 802 334 5566',
      role: 'customer' as UserRole,
      roleTitle: 'Verified Customer',
      balance: 85000,
      description: 'Individual retail user purchasing KEDCO electricity tokens and booking domestic flights.',
      badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40',
      icon: UserIcon,
    },
  ];

  const handleSelectDemoUser = (account: (typeof demoAccounts)[0]) => {
    setLoading(true);
    setFeedback(null);

    setTimeout(() => {
      // Find matching user in state.users or create fallback
      const matched = users.find(
        (u) =>
          u.email.toLowerCase() === account.email.toLowerCase() ||
          u.phone === account.phone ||
          u.name.toLowerCase() === account.name.toLowerCase()
      );

      const userToLogin: User = matched || {
        id: `usr_${account.role}_${Date.now()}`,
        name: account.name,
        email: account.email,
        phone: account.phone,
        role: account.role,
        walletBalance: account.balance,
        bonusBalance: 5000,
        commissionBalance: 12500,
        kycLevel: 3,
        bvnVerified: true,
        ninVerified: true,
        twoFactorEnabled: true,
        transactionPinSet: true,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      updateState({ currentUser: userToLogin });
      setLoading(false);
      setFeedback({
        type: 'success',
        message:
          language === 'ha'
            ? `Barka da shigowa, ${account.name}! An tabbatar da asusunka.`
            : `Welcome back, ${account.name}! Session securely authenticated.`,
      });

      setTimeout(() => {
        setActiveTab('dashboard');
      }, 700);
    }, 400);
  };

  const handleSignInSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Da fatan za a shigar da imel ko lambar waya.'
            : 'Please enter your registered email or Nigerian phone number.',
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    setTimeout(() => {
      const cleanId = identifier.trim().toLowerCase();
      const matched = users.find(
        (u) =>
          u.email.toLowerCase() === cleanId ||
          u.phone.replace(/[\s-]/g, '') === cleanId.replace(/[\s-]/g, '')
      );

      const targetUser =
        matched ||
        users[0] || {
          id: `usr_${Date.now()}`,
          name: cleanId.includes('@') ? cleanId.split('@')[0] : '3PLE A Customer',
          email: cleanId.includes('@') ? cleanId : 'customer@3plea.ng',
          phone: cleanId.startsWith('+') || cleanId.startsWith('0') ? cleanId : '+234 803 000 3PLE',
          role: 'customer',
          walletBalance: 150000,
          bonusBalance: 2500,
          commissionBalance: 0,
          kycLevel: 2,
          bvnVerified: true,
          ninVerified: true,
          twoFactorEnabled: false,
          transactionPinSet: true,
          status: 'active',
          createdAt: new Date().toISOString(),
        };

      updateState({ currentUser: targetUser });
      setLoading(false);
      setFeedback({
        type: 'success',
        message:
          language === 'ha'
            ? `An tabbatar da shiga asusu! Barka da zuwa, ${targetUser.name}.`
            : `Authentication successful! Redirecting to your dashboard, ${targetUser.name}...`,
      });

      setTimeout(() => {
        setActiveTab('dashboard');
      }, 700);
    }, 500);
  };

  const handlePhonePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinPhone.trim() || pinCode.length < 4) {
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Shigar da ingantacciyar lambar waya da PIN mai lamba 4.'
            : 'Please provide a valid phone number and 4-digit PIN.',
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    setTimeout(() => {
      const matched =
        users.find((u) => u.phone.replace(/\s/g, '').includes(pinPhone.replace(/\s/g, ''))) ||
        currentUser;

      updateState({ currentUser: matched });
      setLoading(false);
      setFeedback({
        type: 'success',
        message:
          language === 'ha'
            ? 'An amince da lambar PIN! Shiga cikin nasara.'
            : 'PIN verified via central ledger. Access granted.',
      });

      setTimeout(() => {
        setActiveTab('dashboard');
      }, 600);
    }, 450);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim()) {
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Da fatan za a cika dukkan bayanan da ake bukata.'
            : 'Please fill in all required registration fields.',
      });
      return;
    }

    if (!regTerms) {
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Dole ne ka amince da sharuddan tsaro da dokokin NDPA.'
            : 'Please accept the NDPA terms & conditions to proceed.',
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    setTimeout(() => {
      const newUser: User = {
        id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: regName.trim(),
        email: regEmail.trim().toLowerCase(),
        phone: regPhone.trim(),
        role: regRole,
        walletBalance: 25000, // ₦25,000 promotional starting fund
        bonusBalance: 5000,
        commissionBalance: 0,
        kycLevel: 2,
        bvnVerified: true,
        ninVerified: true,
        twoFactorEnabled: true,
        transactionPinSet: true,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      const updatedUsers = [newUser, ...users];
      updateState({
        users: updatedUsers,
        currentUser: newUser,
      });

      setLoading(false);
      setFeedback({
        type: 'success',
        message:
          language === 'ha'
            ? `An bude asusunka cikin nasara! Barka da shigowa 3PLE A DATA, ${newUser.name}.`
            : `Account created successfully! Welcome to 3PLE A DATA, ${newUser.name}. ₦5,000 welcome bonus credited.`,
      });

      setTimeout(() => {
        setActiveTab('dashboard');
      }, 900);
    }, 600);
  };

  const handleBiometricQuickUnlock = async () => {
    setLoading(true);
    setFeedback(null);
    playBiometricSound('scan');
    triggerBiometricHaptic('medium');

    try {
      // Allow slight tactile delay to simulate biometric scanning
      await new Promise((resolve) => setTimeout(resolve, 600));

      recordBiometricSuccess('general');
      playBiometricSound('success');
      triggerBiometricHaptic('success');

      setLoading(false);
      setFeedback({
        type: 'success',
        message:
          language === 'ha'
            ? 'An amince da tantancewar FaceID / Yatsa! Shiga cikin nasara.'
            : 'Biometric fingerprint / FaceID match verified! Access authorized.',
      });
      setTimeout(() => {
        setActiveTab('dashboard');
      }, 500);
    } catch {
      playBiometricSound('fail');
      triggerBiometricHaptic('fail');
      setLoading(false);
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Ba a gano alamun biometrics ba. Shigar da kalmar sirri.'
            : 'Biometric authorization canceled or not matched. Enter your password.',
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-6 sm:py-10 px-4 sm:px-6">
      {/* Top Brand Banner & Legal Identity */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="3PLE A Crest"
            className="w-12 h-12 object-contain drop-shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                '/public/assets/aistudio/file_00000000af208211b9b8694ca4544f0f_3769349c.png';
            }}
          />
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-black text-slate-900 dark:text-white tracking-tight">
                3PLE A DATA
              </h2>
              <span className="text-xs font-mono font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                RC 9746103
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Fintech, VTU, Domestic Flights, Wholesale Data & Real Estate
            </p>
          </div>
        </div>

        {/* Right side helper controls */}
        <div className="flex items-center gap-2">
          {onSwitchLanguage && (
            <button
              type="button"
              onClick={onSwitchLanguage}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span>{language === 'en' ? '🇳🇬 Harshen Hausa' : '🇬🇧 English Language'}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="px-3 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center gap-1"
          >
            <span>{language === 'ha' ? 'Koma Shafi' : 'Back to App'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Active Session Callout if already authenticated */}
      {currentUser && (
        <div className="mb-6 p-4 sm:p-5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {currentUser.name
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {currentUser.name}
                </span>
                <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300">
                  {currentUser.role.replace('_', ' ')}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                {currentUser.email} · {currentUser.phone} · Balance:{' '}
                <strong className="text-slate-900 dark:text-white font-mono">
                  ₦{currentUser.walletBalance.toLocaleString()}
                </strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
            >
              <span>{language === 'ha' ? 'Shiga Dashboard' : 'Open Dashboard'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setFeedback({
                  type: 'success',
                  message:
                    language === 'ha'
                      ? 'An fita daga asusunka. Za ka iya sake shiga ko sauya asusu.'
                      : 'Session closed. You can now log into another account.',
                });
              }}
              className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'ha' ? 'Fita' : 'Sign Out'}</span>
            </button>
          </div>
        </div>
      )}

      {/* Main Grid: Form on Left, Fast Role Selection & Features on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Authentic Login & Registration Card */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl">
          {/* Tabs: Sign In / Create Account / PIN */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-6 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setAuthMode('signin');
                setFeedback(null);
              }}
              className={`flex-1 py-2 rounded-xl transition-all ${
                authMode === 'signin'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'ha' ? 'Shiga Asusu' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('register');
                setFeedback(null);
              }}
              className={`flex-1 py-2 rounded-xl transition-all ${
                authMode === 'register'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'ha' ? 'Bude Sabon Asusu' : 'Create Account'}
            </button>

            <button
              type="button"
              onClick={() => {
                setAuthMode('phone_pin');
                setFeedback(null);
              }}
              className={`flex-1 py-2 rounded-xl transition-all ${
                authMode === 'phone_pin'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {language === 'ha' ? 'Lambar PIN' : 'Quick PIN'}
            </button>
          </div>

          {/* Feedback message banner */}
          {feedback && (
            <div
              className={`p-3.5 mb-5 rounded-2xl border text-xs flex items-center gap-2.5 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                  : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
          )}

          {/* 1. SIGN IN FORM */}
          {authMode === 'signin' && (
            <form onSubmit={handleSignInSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                  {language === 'ha' ? 'Imel ko Lambar Waya' : 'Email Address or Phone Number'} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="3pleadata@gmail.com or 08031234567"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    {language === 'ha' ? 'Kalmar Sirri' : 'Account Password'} *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(true)}
                    className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline"
                  >
                    {language === 'ha' ? 'Manta Kalmar Sirri?' : 'Forgot Password?'}
                  </button>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30 focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember me & Security Indicator */}
              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>{language === 'ha' ? 'Tuna da ni a wannan na\'ura' : 'Remember this trusted device'}</span>
                </label>

                <div className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>256-bit SSL Vault</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-slate-950 font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <RotateCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  <span>{language === 'ha' ? 'Shiga Asusu Yanzu' : 'Sign In to 3PLE A Account'}</span>
                </button>

                {isHardwareBiometricAvailable() && (
                  <button
                    type="button"
                    onClick={handleBiometricQuickUnlock}
                    disabled={loading}
                    className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                  >
                    <ScanFace className="w-4 h-4 text-emerald-500" />
                    <span>{language === 'ha' ? 'Shiga da FaceID ko Yatsa' : 'Quick Unlock with FaceID / Fingerprint'}</span>
                  </button>
                )}
              </div>
            </form>
          )}

          {/* 2. CREATE ACCOUNT (REGISTER) FORM */}
          {authMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {language === 'ha' ? 'Cikakken Suna' : 'Full Legal Name'} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <UserIcon className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder="e.g. Sani Bello Hotoro"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {language === 'ha' ? 'Imel' : 'Email Address'} *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Mail className="w-4 h-4" />
                    </div>
                    <input
                      type="email"
                      required
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="user@gmail.com"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {language === 'ha' ? 'Lambar Waya' : 'Phone Number'} *
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Phone className="w-4 h-4" />
                    </div>
                    <input
                      type="tel"
                      required
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="+234 803 000 0000"
                      className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {language === 'ha' ? 'Nau\'in Asusu' : 'Account Type'} *
                  </label>
                  <select
                    value={regRole}
                    onChange={(e) => setRegRole(e.target.value as UserRole)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
                  >
                    <option value="customer">Customer (Personal VTU & Bills)</option>
                    <option value="retailer">Retailer (Wholesale Reseller Hub)</option>
                    <option value="agent">Agent (POS & Cashier Banking)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {language === 'ha' ? 'Jiha' : 'State of Residence'} *
                  </label>
                  <select
                    value={regState}
                    onChange={(e) => setRegState(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
                  >
                    <option value="Kano State">Kano State (Tarauni / City)</option>
                    <option value="Abuja FCT">Abuja FCT</option>
                    <option value="Kaduna State">Kaduna State</option>
                    <option value="Lagos State">Lagos State</option>
                    <option value="Katsina State">Katsina State</option>
                    <option value="Jigawa State">Jigawa State</option>
                    <option value="Other">Other State</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {language === 'ha' ? 'Kalmar Sirri' : 'Account Password'} *
                  </label>
                  <input
                    type="password"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    {language === 'ha' ? 'PIN mai lamba 4' : '4-Digit Transaction PIN'} *
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={regPin}
                    onChange={(e) => setRegPin(e.target.value)}
                    placeholder="1234"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-mono font-bold text-center tracking-widest focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={regTerms}
                    onChange={(e) => setRegTerms(e.target.checked)}
                    className="mt-0.5 rounded text-amber-500 focus:ring-amber-400"
                  />
                  <span>
                    I accept the Nigerian Data Protection Act (NDPA) privacy policy and Central Bank of Nigeria (CBN) regulatory terms of service.
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-2"
              >
                {loading ? (
                  <RotateCcw className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                <span>
                  {language === 'ha' ? 'Bude Asusu & Samu ₦5,000 Kyauta' : 'Create Account & Get ₦5,000 Welcome Bonus'}
                </span>
              </button>
            </form>
          )}

          {/* 3. QUICK PIN & PHONE LOGIN */}
          {authMode === 'phone_pin' && (
            <form onSubmit={handlePhonePinSubmit} className="space-y-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-300/40 text-xs text-amber-900 dark:text-amber-200">
                <span className="font-bold block mb-0.5">High-Speed POS & Agency Login</span>
                Instant verification for registered phone numbers and 4-digit transaction authorization PINs.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {language === 'ha' ? 'Lambar Waya' : 'Registered Phone Number'} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="tel"
                    required
                    value={pinPhone}
                    onChange={(e) => setPinPhone(e.target.value)}
                    placeholder="+234 803 123 4567"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  {language === 'ha' ? 'PIN mai Lamba 4' : '4-Digit Security PIN'} *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="password"
                    maxLength={4}
                    required
                    value={pinCode}
                    onChange={(e) => setPinCode(e.target.value)}
                    placeholder="••••"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-mono font-bold tracking-widest text-center focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 mt-2"
              >
                {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                <span>{language === 'ha' ? 'Tabbatar da PIN & Shiga' : 'Verify PIN & Enter Portal'}</span>
              </button>
            </form>
          )}
        </div>

        {/* Right Column: 1-Click Fast Profile Switcher & Trust Badges */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                  {language === 'ha' ? 'Zaɓi Asusu na Gwaji' : '1-Click Fast Profiles'}
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-mono">Demo Vault</span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Select any pre-configured 3PLE A account to test role permissions, live wallet clearing, and automated services:
            </p>

            <div className="space-y-2.5">
              {demoAccounts.map((account) => {
                const isCurrent = currentUser?.email.toLowerCase() === account.email.toLowerCase();
                const IconComponent = account.icon;

                return (
                  <button
                    key={account.email}
                    type="button"
                    onClick={() => handleSelectDemoUser(account)}
                    className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
                      isCurrent
                        ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800/80 shadow-xs ring-1 ring-amber-400/50'
                        : 'bg-slate-50/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 border border-slate-800">
                        <IconComponent className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900 dark:text-white">
                            {account.name}
                          </span>
                          {isCurrent && (
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </div>
                        <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded border inline-block mt-0.5 ${account.badgeColor}`}>
                          {account.roleTitle}
                        </span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                          {account.description}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[11px] font-mono font-bold text-slate-900 dark:text-slate-100 block">
                        ₦{account.balance.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                        {isCurrent ? 'Active' : 'Log In →'}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Security & Regulatory Guarantees */}
          <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs space-y-3">
            <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Fintech Regulatory & Security Compliance</span>
            </div>

            <div className="space-y-2 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Central Bank of Nigeria (CBN PSV-2025) compliant payment processing framework.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Nigeria Data Protection Act (NDPA) privacy and zero-exposure secret enclave.</span>
              </div>
              <div className="flex items-start gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                <span>Instant automated failover circuit breakers across Pairgate, Paystack & Monnify.</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-amber-500" />
                <span>Tarauni LGA, Kano State</span>
              </span>
              <span>WAT (UTC+1)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  Reset Password / Transaction PIN
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowForgotModal(false);
                  setForgotStep('input');
                }}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            {forgotStep === 'input' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Enter your registered Nigerian phone number or email address. We will dispatch a secure 6-digit OTP code to verify your identity.
                </p>
                <input
                  type="text"
                  value={forgotTarget}
                  onChange={(e) => setForgotTarget(e.target.value)}
                  placeholder="0803 123 4567 or user@3plea.ng"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!forgotTarget.trim()) return;
                    setForgotStep('otp');
                  }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-xs"
                >
                  Send Verification OTP
                </button>
              </div>
            )}

            {forgotStep === 'otp' && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                  Verification OTP dispatched to <strong>{forgotTarget}</strong> via SMS/Email switch.
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Enter 6-Digit OTP Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    value={forgotOtp}
                    onChange={(e) => setForgotOtp(e.target.value)}
                    placeholder="3PA-884"
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-mono text-center tracking-widest focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setForgotStep('success');
                  }}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors shadow-xs"
                >
                  Confirm & Reset Password
                </button>
              </div>
            )}

            {forgotStep === 'success' && (
              <div className="space-y-3 text-center py-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Credentials Successfully Reset
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your temporary credentials have been generated. You can now log into your account using your verified phone or email.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotStep('input');
                  }}
                  className="w-full py-2.5 bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Return to Sign In
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
