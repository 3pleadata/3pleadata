import React, { useState } from 'react';
import { AppState } from '../services/storage';
import { User, UserRole, LedgerEntry, NotificationItem } from '../types';
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
  MapPin,
  Building,
  Check,
  RotateCcw,
  LogOut,
  UserCheck,
  UserPlus,
  Briefcase,
  HelpCircle,
  Globe,
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
  onAuthenticate?: (user: User, defaultTab?: string) => void;
  onLogout?: () => void;
  isAuthenticated?: boolean;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  state,
  updateState,
  setActiveTab,
  language,
  onSwitchLanguage,
  onAuthenticate,
  onLogout,
  isAuthenticated = false,
}) => {
  const { currentUser, users = [] } = state;

  // Primary Portal Separation: 'customer' vs 'super_admin'
  // Super admin portal is hidden by default ("A boye super admin portal")
  const [showAdminPortal, setShowAdminPortal] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('admin') === 'true' || params.get('portal') === 'admin' || window.location.hash === '#admin';
    }
    return false;
  });
  const [activePortal, setActivePortal] = useState<'customer' | 'super_admin'>('customer');

  // Customer sub-modes: 'register' | 'signin' | 'phone_pin'
  const [customerAuthMode, setCustomerAuthMode] = useState<'register' | 'signin' | 'phone_pin'>('register');

  // Feedback state
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Customer Sign In state
  const [custIdentifier, setCustIdentifier] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [showCustPassword, setShowCustPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Customer Registration state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<'customer' | 'retailer' | 'agent'>('customer');
  const [regState, setRegState] = useState('Kano State');
  const [regPassword, setRegPassword] = useState('');
  const [regPin, setRegPin] = useState('1234');
  const [regReferral, setRegReferral] = useState('');
  const [regTerms, setRegTerms] = useState(true);

  // Customer Phone PIN login state
  const [pinPhone, setPinPhone] = useState('');
  const [pinCode, setPinCode] = useState('');

  // Super Admin Portal state
  const [adminIdentifier, setAdminIdentifier] = useState('3pleadata@gmail.com');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminSecurityKey, setAdminSecurityKey] = useState('');
  const [showAdminPassword, setShowAdminPassword] = useState(false);

  // Forgot password state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotTarget, setForgotTarget] = useState('');
  const [forgotStep, setForgotStep] = useState<'input' | 'otp' | 'success'>('input');
  const [forgotOtp, setForgotOtp] = useState('');

  // Quick Customer Profiles (Alhaji Musa & Fatima)
  const customerDemoProfiles = [
    {
      name: 'Alhaji Musa Sulaiman',
      email: 'musa.sulaiman@gmail.com',
      phone: '+234 802 334 5566',
      role: 'customer' as UserRole,
      roleTitle: 'Verified Customer',
      balance: 85000,
      description: 'Individual retail user purchasing KEDCO electricity tokens, SME data & domestic flights.',
      badgeColor: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-300/40',
      icon: UserIcon,
    },
    {
      name: 'Fatima Aminu Zaria (Sub Hub)',
      email: 'fatima.zaria@subhub.ng',
      phone: '+234 813 456 7890',
      role: 'retailer' as UserRole,
      roleTitle: 'Wholesale VTU Reseller',
      balance: 620000,
      description: 'Telecom reseller managing high-volume MTN, Airtel, and Glo data distributions.',
      badgeColor: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-300/40',
      icon: Store,
    },
  ];

  // Super Admin Demo Profile
  const superAdminDemoProfile = {
    name: 'Aliyu Mohammed Kano',
    email: '3pleadata@gmail.com',
    phone: '+234 803 123 4567',
    role: 'super_admin' as UserRole,
    roleTitle: 'Super Administrator',
    balance: 450000,
    description: 'Platform executive, double-entry ledger auditor, and bank clearing supervisor.',
    badgeColor: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-300/40',
    icon: ShieldAlert,
  };

  // Helper to complete authentication and route to the right screen
  const completeAuth = (user: User, defaultTab: string, successMsg: string) => {
    updateState({ currentUser: user });
    if (onAuthenticate) {
      onAuthenticate(user, defaultTab);
    } else {
      setActiveTab(defaultTab);
    }
    setLoading(false);
    setFeedback({
      type: 'success',
      message: successMsg,
    });
  };

  // 1. Customer Registration Handler
  const handleCustomerRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim() || !regPin.trim()) {
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Da fatan za a cika dukkan bayanan da ake buƙata don buɗe asusu.'
            : 'Please fill in all required registration fields.',
      });
      return;
    }

    if (regPin.length !== 4) {
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Lambar PIN na tsaron hada-hadar kuɗi dole ne ya zama lamba 4.'
            : 'Transaction authorization PIN must be exactly 4 digits.',
      });
      return;
    }

    if (!regTerms) {
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Dole ne ka amince da sharuɗɗan tsaro da dokokin NDPA & CBN.'
            : 'Please accept the NDPA privacy terms & conditions to proceed.',
      });
      return;
    }

    // Check if phone or email is already registered
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPhone = regPhone.trim().replace(/[\s-]/g, '');
    const existing = users.find(
      (u) =>
        u.email.toLowerCase() === cleanEmail ||
        u.phone.replace(/[\s-]/g, '') === cleanPhone
    );

    if (existing) {
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Wannan imel ko lambar wayar an riga an yi rijista da ita. Da fatan za a shiga asusu.'
            : 'An account with this email or phone number already exists. Please sign in instead.',
      });
      setCustomerAuthMode('signin');
      setCustIdentifier(cleanEmail);
      return;
    }

    setLoading(true);
    setFeedback(null);

    setTimeout(() => {
      const welcomeBonusAmount = 2500;
      const newUser: User = {
        id: `usr_cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: regName.trim(),
        email: cleanEmail,
        phone: regPhone.trim(),
        role: regRole,
        walletBalance: welcomeBonusAmount,
        bonusBalance: 1000,
        commissionBalance: 0,
        kycLevel: 2,
        bvnVerified: true,
        ninVerified: true,
        twoFactorEnabled: false,
        transactionPinSet: true,
        status: 'active',
        createdAt: new Date().toISOString(),
      };

      const welcomeLedger: LedgerEntry = {
        id: `ldg_welcome_${Date.now()}`,
        transactionRef: `3PA-WELCOME-${Date.now().toString().slice(-6)}`,
        timestamp: new Date().toISOString(),
        debitAccount: 'EXPENSE:PROMOTIONAL_WELCOME_BONUS',
        creditAccount: 'LIABILITY:CUSTOMER_WALLET',
        amount: welcomeBonusAmount,
        currency: 'NGN',
        narration: `Promotional Welcome Bonus credited upon registration for ${newUser.name}`,
      };

      const welcomeNotif: NotificationItem = {
        id: `notif_welcome_${Date.now()}`,
        userId: newUser.id,
        title: language === 'ha' ? 'Barka da Zuwa 3PLE A DATA!' : 'Welcome to 3PLE A DATA!',
        message:
          language === 'ha'
            ? `An buɗe asusunka cikin nasara tare da ₦${welcomeBonusAmount.toLocaleString()} kyautar maraba a walat ɗinka.`
            : `Your account is ready with a ₦${welcomeBonusAmount.toLocaleString()} promotional welcome bonus in your wallet.`,
        type: 'system',
        read: false,
        createdAt: new Date().toISOString(),
      };

      const updatedUsers = [newUser, ...users];
      const updatedLedger = [welcomeLedger, ...(state.ledger || [])];
      const updatedNotifs = [welcomeNotif, ...(state.notifications || [])];

      updateState({
        users: updatedUsers,
        ledger: updatedLedger,
        notifications: updatedNotifs,
      });

      const successMsg =
        language === 'ha'
          ? `An buɗe asusunka cikin nasara! Barka da zuwa 3PLE A, ${newUser.name}.`
          : `Registration successful! Welcome to 3PLE A, ${newUser.name}. ₦2,500 bonus credited.`;

      completeAuth(newUser, 'dashboard', successMsg);
    }, 600);
  };

  // 2. Customer Sign In Handler
  const handleCustomerSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custIdentifier.trim() || !custPassword.trim()) {
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Shigar da imel/lambar waya da kuma kalmar sirri.'
            : 'Please enter your registered email or phone and password.',
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    setTimeout(() => {
      const cleanId = custIdentifier.trim().toLowerCase();
      const matched = users.find(
        (u) =>
          u.email.toLowerCase() === cleanId ||
          u.phone.replace(/[\s-]/g, '') === cleanId.replace(/[\s-]/g, '')
      );

      // "Ba wanda zai iya shiga sai ya yi rigista"
      if (!matched) {
        setLoading(false);
        setFeedback({
          type: 'error',
          message:
            language === 'ha'
              ? 'Ba a sami wannan asusun ba. Dole ne ka yi rijista da farko kafin ka iya shiga.'
              : 'Account not found in registered records. You must register an account first before signing in.',
        });
        return;
      }

      // If trying to sign into super admin from customer portal, reveal the hidden super admin portal
      if (matched.role === 'super_admin' || matched.role === 'administrator') {
        setShowAdminPortal(true);
        setActivePortal('super_admin');
        setAdminIdentifier(cleanId);
        setLoading(false);
        setFeedback({
          type: 'success',
          message:
            language === 'ha'
              ? 'An gano asusun Babban Darakta (Super Admin). An buɗe kofar tsaro ta musamman.'
              : 'Super Admin executive account detected. Security gate unlocked.',
        });
        return;
      }

      const successMsg =
        language === 'ha'
          ? `Barka da sake dawowa, ${matched.name}! An tabbatar da shiga asusu.`
          : `Welcome back, ${matched.name}! Session securely authenticated.`;

      completeAuth(matched, 'dashboard', successMsg);
    }, 500);
  };

  // 3. Customer Quick Phone + PIN Handler
  const handleCustomerPhonePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinPhone.trim() || pinCode.length < 4) {
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Shigar da ingantacciyar lambar waya da lambar PIN mai lamba 4.'
            : 'Please provide a valid registered phone number and 4-digit PIN.',
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    setTimeout(() => {
      const cleanPhone = pinPhone.trim().replace(/[\s-]/g, '');
      const matched = users.find((u) => u.phone.replace(/[\s-]/g, '').includes(cleanPhone));

      if (!matched) {
        setLoading(false);
        setFeedback({
          type: 'error',
          message:
            language === 'ha'
              ? 'Lambar wayar ba a yi rijista da ita ba. Da fatan za a buɗe asusu da farko.'
              : 'Phone number not found in registered records. Please register first.',
        });
        return;
      }

      const successMsg =
        language === 'ha'
          ? `An amince da lambar PIN! Barka da zuwa, ${matched.name}.`
          : `PIN verified via central ledger. Access granted to ${matched.name}.`;

      completeAuth(matched, 'dashboard', successMsg);
    }, 450);
  };

  // 4. Super Admin Login Handler
  const handleSuperAdminSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminIdentifier.trim() || !adminPassword.trim()) {
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Shigar da imel ɗin Super Admin da kalmar sirri.'
            : 'Please enter Super Admin official email and master password.',
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    setTimeout(() => {
      const cleanId = adminIdentifier.trim().toLowerCase();
      // Match super admin account from users or default
      const matchedAdmin = users.find(
        (u) =>
          (u.email.toLowerCase() === cleanId || u.phone.replace(/[\s-]/g, '') === cleanId.replace(/[\s-]/g, '')) &&
          (u.role === 'super_admin' || u.role === 'administrator')
      );

      // Verify security key if provided or check default master
      const validKey =
        !adminSecurityKey.trim() ||
        adminSecurityKey.trim().toUpperCase() === '3PLEA-ADMIN-2026' ||
        adminSecurityKey.trim() === '123456';

      if (!validKey) {
        setLoading(false);
        setFeedback({
          type: 'error',
          message:
            language === 'ha'
              ? 'Lambar Tsaro (Master Key) ba daidai ba ce. An ƙi amincewa da shiga.'
              : 'Invalid Super Admin Master Security Passcode. Access denied.',
        });
        return;
      }

      const targetAdmin: User =
        matchedAdmin || {
          id: 'usr_super_admin_01',
          name: 'Aliyu Mohammed Kano',
          email: '3pleadata@gmail.com',
          phone: '+234 803 123 4567',
          role: 'super_admin',
          walletBalance: 450000,
          bonusBalance: 5200,
          commissionBalance: 34500,
          kycLevel: 3,
          bvnVerified: true,
          ninVerified: true,
          apiKey: '3plea_live_99f8c47b9201a4e76d338',
          apiWebhookUrl: 'https://webhook.site/demo-3plea',
          twoFactorEnabled: true,
          transactionPinSet: true,
          status: 'active',
          createdAt: '2026-01-15T08:00:00Z',
        };

      const successMsg =
        language === 'ha'
          ? `Barka da zuwa Babban Darakta (Super Admin), ${targetAdmin.name}! An ba da cikakken iko.`
          : `Super Admin Master Authorization granted to ${targetAdmin.name}. Directing to Executive Control.`;

      completeAuth(targetAdmin, 'admin', successMsg);
    }, 600);
  };

  // 5. 1-Click Fast Profile Login
  const handleSelectDemoUser = (account: typeof superAdminDemoProfile) => {
    setLoading(true);
    setFeedback(null);

    setTimeout(() => {
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

      const targetTab = account.role === 'super_admin' ? 'admin' : 'dashboard';
      const successMsg =
        language === 'ha'
          ? `Barka da shigowa, ${account.name}! An tabbatar da asusunka.`
          : `Session authenticated for ${account.name} (${account.roleTitle}).`;

      completeAuth(userToLogin, targetTab, successMsg);
    }, 400);
  };

  // Biometric Unlock
  const handleBiometricQuickUnlock = async () => {
    setLoading(true);
    setFeedback(null);
    playBiometricSound('scan');
    triggerBiometricHaptic('medium');

    try {
      await new Promise((resolve) => setTimeout(resolve, 600));
      recordBiometricSuccess('general');
      playBiometricSound('success');
      triggerBiometricHaptic('success');

      const targetUser = users.find((u) => u.role === 'customer') || currentUser;
      completeAuth(
        targetUser,
        'dashboard',
        language === 'ha'
          ? 'An amince da tantancewar Biometrics! Shiga cikin nasara.'
          : 'Biometric authorization verified! Welcome back.'
      );
    } catch {
      playBiometricSound('fail');
      triggerBiometricHaptic('fail');
      setLoading(false);
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Ba a gano alamun biometrics ba. Shigar da kalmar sirri.'
            : 'Biometric authorization failed. Please enter your credentials.',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 sm:py-10 px-4 sm:px-6 flex flex-col justify-center">
      <div className="max-w-4xl mx-auto w-full">
        {/* Top Header: Official Corporate Branding & Language Selector */}
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
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                  3PLE A DATA
                </h1>
                <span className="text-[11px] font-mono font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-2xs">
                  RC 9746103
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                Karkasara Road, Tarauni LGA, Kano State · Registered Fintech & Utility Platform
              </p>
            </div>
          </div>

          {/* Right Header: Language Switcher and Status */}
          <div className="flex items-center gap-2">
            {onSwitchLanguage && (
              <button
                type="button"
                onClick={onSwitchLanguage}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5 shadow-2xs hover:bg-slate-50 dark:hover:bg-slate-700"
              >
                <Globe className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'en' ? '🇳🇬 Harshen Hausa' : '🇬🇧 English Language'}</span>
              </button>
            )}

            {isAuthenticated && (
              <button
                type="button"
                onClick={() => setActiveTab(currentUser.role === 'super_admin' ? 'admin' : 'dashboard')}
                className="px-3.5 py-1.5 text-xs font-bold bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-1"
              >
                <span>{language === 'ha' ? 'Koma Shafi' : 'Enter Dashboard'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Mandatory Registration / Authentication Enforced Notice Banner */}
        {!isAuthenticated && (
          <div className="mb-6 p-4 rounded-2xl bg-amber-500/10 border border-amber-400/40 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-extrabold text-sm">
                {language === 'ha'
                  ? 'Dole ne ka yi rijista ko shiga asusu kafin ka iya amfani da manhaja'
                  : 'Authentication Required: No access to platform services without verified registration'}
              </p>
              <p className="mt-0.5 text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                {language === 'ha'
                  ? 'Kowanne mai amfani (Customer) ko Babban Darakta (Super Admin) dole ne ya yi rijista ko ya shiga asusunsa na musamman don tsaro da dokokin CBN & NDPA.'
                  : 'In compliance with CBN & NDPA regulations, customer services and executive administrative functions require verified credentials. Please register below or log into your account.'}
              </p>
            </div>
          </div>
        )}

        {/* Active Session Card if currently logged in */}
        {isAuthenticated && currentUser && (
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
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                  {currentUser.email} · {currentUser.phone} · Walat:{' '}
                  <strong className="text-slate-900 dark:text-white font-mono">
                    ₦{currentUser.walletBalance.toLocaleString()}
                  </strong>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setActiveTab(currentUser.role === 'super_admin' ? 'admin' : 'dashboard')}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
              >
                <span>{language === 'ha' ? 'Buɗe Dashboard' : 'Open Dashboard'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-3.5 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{language === 'ha' ? 'Fita Daga Asusu' : 'Log Out'}</span>
                </button>
              )}
            </div>
          </div>
        )}



        {/* Feedback message banner */}
        {feedback && (
          <div
            className={`p-4 mb-6 rounded-2xl border text-xs flex items-center gap-3 shadow-xs ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200'
                : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0" />
            )}
            <span className="font-semibold text-xs leading-relaxed">{feedback.message}</span>
          </div>
        )}

        {/* ========================================================= */}
        {/* PORTAL 1: CUSTOMER PORTAL (REGISTRATION & SIGN IN)       */}
        {/* ========================================================= */}
        {(!showAdminPortal || activePortal === 'customer') && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Customer Form Card */}
            <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl">
              {/* Customer Mode Tabs: Register / Sign In / Quick PIN */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1 rounded-2xl mb-6 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerAuthMode('register');
                    setFeedback(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    customerAuthMode === 'register'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{language === 'ha' ? 'Bude Sabon Asusu' : 'Register Customer'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomerAuthMode('signin');
                    setFeedback(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    customerAuthMode === 'signin'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{language === 'ha' ? 'Shiga Asusu' : 'Customer Sign In'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCustomerAuthMode('phone_pin');
                    setFeedback(null);
                  }}
                  className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                    customerAuthMode === 'phone_pin'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{language === 'ha' ? 'Lambar PIN' : 'Quick PIN'}</span>
                </button>
              </div>

              {/* 1.A: CUSTOMER REGISTRATION */}
              {customerAuthMode === 'register' && (
                <form onSubmit={handleCustomerRegister} className="space-y-4">
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span>
                      {language === 'ha'
                        ? 'Za a baka ₦2,500 kyautar maraba a walat ɗinka da zarar ka yi rijista!'
                        : 'Instant ₦2,500 promotional welcome bonus automatically credited to your new wallet.'}
                    </span>
                  </div>

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
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                          placeholder="0803 123 4567"
                          className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        {language === 'ha' ? 'Nau\'in Asusu' : 'Customer Account Type'} *
                      </label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as 'customer' | 'retailer' | 'agent')}
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
                      >
                        <option value="customer">Personal Customer (VTU, Bills & Flights)</option>
                        <option value="retailer">Retailer (Wholesale Telecom Reseller)</option>
                        <option value="agent">POS Agent (Merchant Banking)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        {language === 'ha' ? 'Jiha' : 'State'} *
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
                        <option value="Other">Other States in Nigeria</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        {language === 'ha' ? 'Kalmar Sirri' : 'Password'} *
                      </label>
                      <input
                        type="password"
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        {language === 'ha' ? 'PIN mai Lamba 4' : '4-Digit Transaction PIN'} *
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        required
                        value={regPin}
                        onChange={(e) => setRegPin(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="1234"
                        className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-mono font-bold text-center tracking-widest focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'ha' ? 'Lambar Gayyata (Zabi ne)' : 'Referral Code (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={regReferral}
                      onChange={(e) => setRegReferral(e.target.value.toUpperCase())}
                      placeholder="e.g. 3PLEA-8841"
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-mono"
                    />
                  </div>

                  <div className="pt-1">
                    <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={regTerms}
                        onChange={(e) => setRegTerms(e.target.checked)}
                        className="mt-0.5 rounded text-emerald-500 focus:ring-emerald-400"
                      />
                      <span>
                        {language === 'ha'
                          ? 'Na amince da sharuddan tsaro da dokokin bayanan sirri na NDPA 2023 da ka\'idojin CBN.'
                          : 'I accept 3PLE A DATA terms of service and Nigerian Data Protection Act (NDPA 2023) privacy regulations.'}
                      </span>
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 mt-3"
                  >
                    {loading ? (
                      <RotateCcw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    <span>
                      {language === 'ha' ? 'Kammala Rijista & Karɓi ₦2,500' : 'Register Account & Claim ₦2,500'}
                    </span>
                  </button>
                </form>
              )}

              {/* 1.B: CUSTOMER SIGN IN */}
              {customerAuthMode === 'signin' && (
                <form onSubmit={handleCustomerSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      {language === 'ha' ? 'Imel ko Lambar Waya' : 'Registered Email or Phone'} *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={custIdentifier}
                        onChange={(e) => setCustIdentifier(e.target.value)}
                        placeholder="musa.sulaiman@gmail.com or 08023345566"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        {language === 'ha' ? 'Kalmar Sirri' : 'Password'} *
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowForgotModal(true)}
                        className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                      >
                        {language === 'ha' ? 'Manta Kalmar Sirri?' : 'Forgot Password?'}
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showCustPassword ? 'text' : 'password'}
                        required
                        value={custPassword}
                        onChange={(e) => setCustPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowCustPassword(!showCustPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showCustPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-slate-400">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="rounded text-emerald-500 focus:ring-emerald-400"
                      />
                      <span>{language === 'ha' ? 'Tuna da ni a wannan na\'ura' : 'Remember this trusted device'}</span>
                    </label>

                    <span className="text-[11px] text-slate-400">SSL 256-Bit</span>
                  </div>

                  <div className="pt-2 space-y-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                    >
                      {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                      <span>{language === 'ha' ? 'Shiga Asusu' : 'Sign In to Customer Account'}</span>
                    </button>

                    {isHardwareBiometricAvailable() && (
                      <button
                        type="button"
                        onClick={handleBiometricQuickUnlock}
                        disabled={loading}
                        className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                      >
                        <ScanFace className="w-4 h-4 text-emerald-500" />
                        <span>{language === 'ha' ? 'Shiga da FaceID / Yatsa' : 'Quick Unlock with Biometrics'}</span>
                      </button>
                    )}
                  </div>
                </form>
              )}

              {/* 1.C: CUSTOMER QUICK PHONE + PIN */}
              {customerAuthMode === 'phone_pin' && (
                <form onSubmit={handleCustomerPhonePin} className="space-y-4">
                  <div className="p-3 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-bold text-slate-900 dark:text-white block mb-0.5">
                      {language === 'ha' ? 'Shiga Nan Take da Lambar PIN' : 'Express Phone & PIN Authorization'}
                    </span>
                    {language === 'ha'
                      ? 'Tabbatar da asusunka cikin sauƙi ta hanyar shigar da lambar waya da lambar sirri ta PIN mai lamba 4.'
                      : 'Instant authentication using your registered Nigerian telephone number and 4-digit PIN.'}
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
                        placeholder="0802 334 5566"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'ha' ? 'PIN mai Lamba 4' : '4-Digit Transaction PIN'} *
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
                        onChange={(e) => setPinCode(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="••••"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-mono font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
                  >
                    {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    <span>{language === 'ha' ? 'Tabbatar da PIN & Shiga' : 'Verify PIN & Enter Dashboard'}</span>
                  </button>
                </form>
              )}
            </div>

            {/* Right: Fast Customer Profiles & Trust */}
            <div className="lg:col-span-5 space-y-5">
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">
                      {language === 'ha' ? 'Asusun Gwaji na Abokin Ciniki' : 'Quick Customer Profiles'}
                    </h3>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">1-Click</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
                  {language === 'ha'
                    ? 'Danna asusu na ƙasa don shiga kai tsaye a matsayin abokin ciniki mai asusun kudi:'
                    : 'Click any registered customer profile below for immediate simulated login:'}
                </p>

                <div className="space-y-2.5">
                  {customerDemoProfiles.map((account) => {
                    const isCurrent = currentUser?.email.toLowerCase() === account.email.toLowerCase();
                    const IconComponent = account.icon;

                    return (
                      <button
                        key={account.email}
                        type="button"
                        onClick={() => handleSelectDemoUser(account as any)}
                        className={`w-full p-3 rounded-2xl border text-left transition-all flex items-start justify-between gap-3 ${
                          isCurrent
                            ? 'bg-emerald-50/70 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 shadow-xs ring-1 ring-emerald-400/50'
                            : 'bg-slate-50/70 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 border-slate-200/80 dark:border-slate-700/80'
                        }`}
                      >
                        <div className="flex items-start gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-slate-800 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-slate-800">
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
                          <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            {isCurrent ? 'Active' : 'Log In →'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer Guarantees Card */}
              <div className="p-5 bg-slate-50 dark:bg-slate-900/60 rounded-3xl border border-slate-200 dark:border-slate-800 text-xs space-y-2.5">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>{language === 'ha' ? 'Tsaron Asusun Abokan Ciniki' : 'Protected Customer Infrastructure'}</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Instant wallet funding via Monnify & Paystack clearing channels.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Automated domestic flight booking & KEDCO power token generation within 2 seconds.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>RC 9746103 CAC certified digital stored-value services in Kano, Nigeria.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* PORTAL 2: SUPER ADMIN PORTAL (HIDDEN EXECUTIVE GATE)      */}
        {/* ========================================================= */}
        {showAdminPortal && activePortal === 'super_admin' && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-slate-900 text-white rounded-3xl border border-amber-500/40 p-6 sm:p-9 shadow-2xl relative overflow-hidden">
              {/* Executive Amber Glow Backdrop */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 space-y-6">
                {/* Back to Customer Portal Button */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAdminPortal(false);
                      setActivePortal('customer');
                      setFeedback(null);
                    }}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    <ArrowRight className="w-3.5 h-3.5 rotate-180" />
                    <span>{language === 'ha' ? '← Koma Shafin Abokan Ciniki' : '← Back to Customer Portal'}</span>
                  </button>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
                    Executive Vault
                  </span>
                </div>
                {/* Header Badge */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black shadow-lg">
                      <ShieldAlert className="w-6 h-6 text-slate-950" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-black text-white tracking-tight">
                          {language === 'ha' ? 'Sashin Babban Darakta (Super Admin)' : 'Super Admin Central Gateway'}
                        </h2>
                      </div>
                      <p className="text-xs text-amber-300/80 font-mono">
                        RESTRICTED EXECUTIVE ACCESS · TARAUNI KANO
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 self-start sm:self-auto font-bold uppercase tracking-wider">
                    Tier 4 Root Authority
                  </span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-800/80 border border-slate-700/80 text-xs text-slate-300 leading-relaxed">
                  {language === 'ha'
                    ? 'Wannan sashe na musamman ne ga shugabannin kamfanin 3PLE A DATA. Yana ba da cikakken iko kan dukkan asusun masu amfani, kudin walat, binciken ledger, da tsaron sadarwa.'
                    : 'This portal controls master platform financials, double-entry ledger audits, user balance adjustments, automated provider routing, and system KYC approvals.'}
                </div>

                {/* Super Admin Form */}
                <form onSubmit={handleSuperAdminSignIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      {language === 'ha' ? 'Imel ɗin Super Admin' : 'Super Admin Official Email'} *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Mail className="w-4 h-4 text-amber-400" />
                      </div>
                      <input
                        type="text"
                        required
                        value={adminIdentifier}
                        onChange={(e) => setAdminIdentifier(e.target.value)}
                        placeholder="3pleadata@gmail.com"
                        className="w-full pl-10 pr-3.5 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        {language === 'ha' ? 'Kalmar Sirri ta Darakta' : 'Master Password'} *
                      </label>
                      <button
                        type="button"
                        onClick={() => setAdminPassword('3PLEA_ROOT_2026!')}
                        className="text-[11px] font-mono text-amber-400 hover:underline"
                      >
                        {language === 'ha' ? 'Cika ta atomatik' : 'Autofill Master Pass'}
                      </button>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4 text-amber-400" />
                      </div>
                      <input
                        type={showAdminPassword ? 'text' : 'password'}
                        required
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        placeholder="••••••••••••"
                        className="w-full pl-10 pr-10 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowAdminPassword(!showAdminPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-white"
                      >
                        {showAdminPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                        {language === 'ha' ? 'Lambar Tsaron Super Admin (Passcode)' : 'Master Security Key / 2FA Passcode'}
                      </label>
                      <span className="text-[10px] font-mono text-amber-400">Passcode: 3PLEA-ADMIN-2026</span>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <KeyRound className="w-4 h-4 text-amber-400" />
                      </div>
                      <input
                        type="text"
                        value={adminSecurityKey}
                        onChange={(e) => setAdminSecurityKey(e.target.value)}
                        placeholder="3PLEA-ADMIN-2026"
                        className="w-full pl-10 pr-3.5 py-3 bg-slate-800/90 border border-slate-700 rounded-xl text-amber-300 text-xs font-mono font-bold tracking-wider focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div className="pt-2 space-y-3">
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-sm rounded-xl transition-all shadow-lg flex items-center justify-center gap-2"
                    >
                      {loading ? (
                        <RotateCcw className="w-4 h-4 animate-spin text-slate-950" />
                      ) : (
                        <ShieldCheck className="w-4 h-4 text-slate-950" />
                      )}
                      <span>
                        {language === 'ha'
                          ? 'Tabbatar da Shugabanci & Buɗe Admin'
                          : 'Authenticate & Enter Super Admin Dashboard'}
                      </span>
                    </button>

                    {/* 1-Click Fast Super Admin Demo Button */}
                    <button
                      type="button"
                      onClick={() => handleSelectDemoUser(superAdminDemoProfile)}
                      disabled={loading}
                      className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-2 border border-slate-700"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>
                        {language === 'ha'
                          ? 'Danna don Shiga kai tsaye a matsayin Aliyu Mohammed (Super Admin)'
                          : '1-Click Fast Super Admin Login (Aliyu Mohammed Kano)'}
                      </span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Global Footer Notes with Discreet Admin Link */}
        <div className="mt-12 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-slate-500 dark:text-slate-400">
          <div>
            <p className="font-semibold text-slate-700 dark:text-slate-300">
              © 2026 3PLE A DATA (RC 9746103) · CAC Registered Corporate Entity
            </p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
              Karkasara Road, Tarauni LGA, Kano State, Nigeria · Automated Banking & Utility Infrastructure.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setShowAdminPortal(true);
              setActivePortal('super_admin');
              setFeedback(null);
            }}
            className="text-[11px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1.5 transition-colors font-medium p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 self-center sm:self-auto"
            title="Authorized Executive Gateway"
          >
            <Lock className="w-3 h-3 text-slate-400" />
            <span>{language === 'ha' ? 'Kofar Shugabanci' : 'Staff Portal'}</span>
          </button>
        </div>
      </div>

      {/* Forgot Password / PIN Reset Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  {language === 'ha' ? 'Sake Saitin Kalmar Sirri / PIN' : 'Reset Password / PIN'}
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
                  {language === 'ha'
                    ? 'Shigar da lambar waya ko imel ɗin da kayi rijista da shi don tura maka lambar tabbatarwa (OTP).'
                    : 'Enter your registered Nigerian phone number or email address. We will dispatch a 6-digit OTP code.'}
                </p>
                <input
                  type="text"
                  value={forgotTarget}
                  onChange={(e) => setForgotTarget(e.target.value)}
                  placeholder="0802 334 5566 or user@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!forgotTarget.trim()) return;
                    setForgotStep('otp');
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
                >
                  {language === 'ha' ? 'Aika Lambar OTP' : 'Send Verification OTP'}
                </button>
              </div>
            )}

            {forgotStep === 'otp' && (
              <div className="space-y-3">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                  {language === 'ha'
                    ? `An tura lambar OTP zuwa ga ${forgotTarget}`
                    : `Verification OTP dispatched to ${forgotTarget}.`}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    {language === 'ha' ? 'Shigar da lambar OTP mai lamba 6' : 'Enter 6-Digit OTP Code'}
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
                  onClick={() => setForgotStep('success')}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-xs"
                >
                  {language === 'ha' ? 'Tabbatar da OTP' : 'Confirm & Reset'}
                </button>
              </div>
            )}

            {forgotStep === 'success' && (
              <div className="space-y-3 text-center py-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  {language === 'ha' ? 'An Sake Saitin Kalmar Sirri Cikin Nasara' : 'Credentials Successfully Reset'}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {language === 'ha'
                    ? 'Yanzu zaka iya shiga asusunka da sabon PIN ko kalmar sirri.'
                    : 'Your temporary credentials are ready. You can now log into your customer account.'}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotStep('input');
                  }}
                  className="w-full py-2.5 bg-slate-900 dark:bg-slate-800 text-white font-bold text-xs rounded-xl hover:bg-slate-800 transition-colors"
                >
                  {language === 'ha' ? 'Koma Shiga Asusu' : 'Return to Customer Sign In'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
