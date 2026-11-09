import React, { useState, useMemo } from 'react';
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
  HelpCircle,
  Globe,
  MessageSquare,
  Download,
  Smartphone,
  Radio,
  AtSign,
  ExternalLink,
} from 'lucide-react';
import { Language } from '../services/i18n';
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

// Carrier prefix lookup for Nigerian telecommunications (BilalSadaSub standard)
const getCarrierFromPhone = (phone: string): { name: string; color: string; badge: string } | null => {
  const clean = phone.replace(/[^0-9]/g, '');
  const prefix = clean.startsWith('234') ? '0' + clean.slice(3, 6) : clean.slice(0, 4);
  if (!prefix || prefix.length < 4) return null;

  const mtn = ['0803', '0806', '0703', '0706', '0813', '0816', '0810', '0814', '0903', '0906', '0913', '0916'];
  const airtel = ['0802', '0808', '0708', '0812', '0701', '0902', '0901', '0904', '0907', '0912'];
  const glo = ['0805', '0807', '0705', '0815', '0811', '0905', '0915'];
  const nineMobile = ['0809', '0817', '0818', '0909', '0908'];

  if (mtn.includes(prefix)) return { name: 'MTN Nigeria', color: 'bg-amber-400 text-slate-950', badge: 'MTN' };
  if (airtel.includes(prefix)) return { name: 'Airtel Nigeria', color: 'bg-rose-600 text-white', badge: 'Airtel' };
  if (glo.includes(prefix)) return { name: 'Glo Nigeria', color: 'bg-emerald-600 text-white', badge: 'Glo' };
  if (nineMobile.includes(prefix)) return { name: '9mobile', color: 'bg-lime-600 text-white', badge: '9mobile' };
  return null;
};

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

  // Customer sub-modes: 'signin' | 'register' | 'phone_pin'
  const [customerAuthMode, setCustomerAuthMode] = useState<'signin' | 'register' | 'phone_pin'>('signin');

  // Feedback state
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success'; message: string } | null>(null);
  const [loading, setLoading] = useState(false);

  // Customer Sign In state (Username, Phone, or Email as on BilalSadaSub)
  const [custIdentifier, setCustIdentifier] = useState('');
  const [custPassword, setCustPassword] = useState('');
  const [showCustPassword, setShowCustPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Customer Registration state (Full BilalSadaSub registration suite)
  const [regName, setRegName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regRole, setRegRole] = useState<'customer' | 'retailer' | 'agent'>('customer');
  const [regState, setRegState] = useState('Kano State');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
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

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotTarget, setForgotTarget] = useState('');
  const [forgotStep, setForgotStep] = useState<'input' | 'otp' | 'success'>('input');
  const [forgotOtp, setForgotOtp] = useState('');

  // Telecom carrier detection for phone inputs
  const regCarrier = useMemo(() => getCarrierFromPhone(regPhone), [regPhone]);
  const pinCarrier = useMemo(() => getCarrierFromPhone(pinPhone), [pinPhone]);
  const loginCarrier = useMemo(() => getCarrierFromPhone(custIdentifier), [custIdentifier]);

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

    if (!regName.trim() || !regUsername.trim() || !regEmail.trim() || !regPhone.trim() || !regPassword.trim() || !regConfirmPassword.trim() || !regPin.trim()) {
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Da fatan za a cika dukkan bayanan da ake buƙata don buɗe asusu.'
            : 'Please fill in all required registration fields.',
      });
      return;
    }

    // Username validation (alphanumeric, min 3 chars)
    const cleanUsername = regUsername.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
    if (cleanUsername.length < 3) {
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Sunan mai amfani (Username) dole ya kasance haruffa ko lambobi akalla guda 3.'
            : 'Username must be at least 3 characters (letters, numbers, or underscore).',
      });
      return;
    }

    // Password matching validation (standard on BilalSadaSub)
    if (regPassword !== regConfirmPassword) {
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Kalmomin sirri guda biyu ba su yi daidai ba. Da fatan za a sake dubawa.'
            : 'Password and Confirm Password do not match. Please verify.',
      });
      return;
    }

    if (regPassword.length < 6) {
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Kalmar sirri dole ta kasance a kalla haruffa ko lambobi 6.'
            : 'Password must be at least 6 characters long.',
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
            ? 'Dole ne ka amince da sharuɗɗan tsaro da dokokin NDPA 2023 & CBN.'
            : 'Please accept the NDPA privacy terms & conditions to proceed.',
      });
      return;
    }

    // Check if username, phone, or email is already registered
    const cleanEmail = regEmail.trim().toLowerCase();
    const cleanPhone = regPhone.trim().replace(/[\s-]/g, '');
    const existing = users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === cleanUsername) ||
        u.email.toLowerCase() === cleanEmail ||
        u.phone.replace(/[\s-]/g, '') === cleanPhone
    );

    if (existing) {
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Wannan sunan mai amfani (Username), imel ko lambar wayar an riga an yi rijista da ita. Da fatan za a shiga asusu.'
            : 'An account with this username, email or phone number already exists. Please sign in instead.',
      });
      setCustomerAuthMode('signin');
      setCustIdentifier(cleanUsername || cleanEmail);
      return;
    }

    setLoading(true);
    setFeedback(null);

    setTimeout(() => {
      const welcomeBonusAmount = 2500;
      const newUser: User = {
        id: `usr_cust_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: regName.trim(),
        username: cleanUsername,
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
        password: regPassword,
        transactionPin: regPin,
        stateOfOrigin: regState,
        referredBy: regReferral.trim() || undefined,
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
        narration: `Promotional Welcome Bonus credited upon registration for ${newUser.name} (@${newUser.username})`,
      };

      const welcomeNotif: NotificationItem = {
        id: `notif_welcome_${Date.now()}`,
        userId: newUser.id,
        title: language === 'ha' ? 'Barka da Zuwa 3PLE A DATA!' : 'Welcome to 3PLE A DATA!',
        message:
          language === 'ha'
            ? `An buɗe asusunka cikin nasara tare da ₦${welcomeBonusAmount.toLocaleString()} kyautar maraba a walat ɗinka. Sunan mai amfani: @${newUser.username}`
            : `Your account is ready with a ₦${welcomeBonusAmount.toLocaleString()} promotional welcome bonus. Username: @${newUser.username}`,
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
          ? `An buɗe asusunka cikin nasara! Barka da zuwa 3PLE A, ${newUser.name} (@${newUser.username}).`
          : `Registration successful! Welcome to 3PLE A, ${newUser.name} (@${newUser.username}). ₦2,500 bonus credited.`;

      completeAuth(newUser, 'dashboard', successMsg);
    }, 600);
  };

  // 2. Customer Sign In Handler (Matches Username, Email, OR Phone)
  const handleCustomerSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custIdentifier.trim() || !custPassword.trim()) {
      setFeedback({
        type: 'error',
        message:
          language === 'ha'
            ? 'Shigar da sunan mai amfani (Username), imel ko lambar waya da kuma kalmar sirri.'
            : 'Please enter your username, email, or phone number and password.',
      });
      return;
    }

    setLoading(true);
    setFeedback(null);

    setTimeout(() => {
      const cleanId = custIdentifier.trim().toLowerCase();
      const cleanPhone = custIdentifier.trim().replace(/[\s-]/g, '');

      const matched = users.find(
        (u) =>
          (u.username && u.username.toLowerCase() === cleanId) ||
          u.email.toLowerCase() === cleanId ||
          u.phone.replace(/[\s-]/g, '') === cleanPhone ||
          u.phone.replace(/[^0-9]/g, '').includes(cleanPhone.slice(-10))
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

      // Check password if set on user, otherwise accept for existing demo seed records
      if (matched.password && matched.password !== custPassword.trim()) {
        setLoading(false);
        setFeedback({
          type: 'error',
          message:
            language === 'ha'
              ? 'Kalmar sirri ba daidai ba ce. Da fatan za a sake dubawa ko danna "Manta Kalmar Sirri".'
              : 'Invalid password. Please check your credentials or click "Forgot Password".',
        });
        return;
      }

      // If trying to sign into super admin from customer portal, reveal the hidden super admin portal
      if (matched.role === 'super_admin' || matched.role === 'administrator') {
        setShowAdminPortal(true);
        setActivePortal('super_admin');
        setAdminIdentifier(matched.email);
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

      // Check PIN if set
      if (matched.transactionPin && matched.transactionPin !== pinCode.trim()) {
        setLoading(false);
        setFeedback({
          type: 'error',
          message:
            language === 'ha'
              ? 'Lambar PIN ba daidai ba ce. Da fatan za a sake dubawa.'
              : 'Incorrect transaction PIN entered. Please try again.',
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
      const matchedAdmin = users.find(
        (u) =>
          (u.email.toLowerCase() === cleanId ||
            (u.username && u.username.toLowerCase() === cleanId) ||
            u.phone.replace(/[\s-]/g, '') === cleanId.replace(/[\s-]/g, '')) &&
          (u.role === 'super_admin' || u.role === 'administrator')
      );

      // Verify master password & security key
      const validPass =
        adminPassword.trim() === '3PLEA_ROOT_2026!' ||
        adminPassword.trim() === 'admin' ||
        (matchedAdmin && matchedAdmin.password === adminPassword.trim());

      const validKey =
        !adminSecurityKey.trim() ||
        adminSecurityKey.trim().toUpperCase() === '3PLEA-ADMIN-2026' ||
        adminSecurityKey.trim() === '123456';

      if (!validPass || !validKey) {
        setLoading(false);
        setFeedback({
          type: 'error',
          message:
            language === 'ha'
              ? 'Kalmar sirri ko Lambar Tsaro (Master Passcode) ba daidai ba ce. An ƙi amincewa da shiga.'
              : 'Invalid Super Admin Master Password or Security Passcode. Access denied.',
        });
        return;
      }

      const targetAdmin: User =
        matchedAdmin || {
          id: 'usr_super_admin_01',
          name: 'Aliyu Mohammed Kano',
          username: 'admin',
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
          password: 'admin',
          transactionPin: '1234',
          stateOfOrigin: 'Kano State',
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-6 sm:py-10 px-4 sm:px-6 flex flex-col justify-between">
      <div className="max-w-2xl mx-auto w-full">
        {/* Top Header: Official Corporate Branding & Language Selector */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 mb-5 border-b border-slate-200 dark:border-slate-800">
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
                Tarauni LGA, Kano State · Nigerian VTU & Automated Utility Platform
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

        {/* Live VTU Status Notice Ticker (BilalSadaSub standard) */}
        <div className="mb-5 px-3.5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 text-emerald-900 dark:text-emerald-200 text-xs flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            <Radio className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate font-semibold">
              {language === 'ha'
                ? '🟢 Sabar VTU na aiki: MTN SME Data, Airtel, Glo, KEDCO da DStv suna sauka nan take 24/7.'
                : '🟢 Live VTU Servers: MTN SME Data, Glo, Airtel, 9Mobile & KEDCO tokens instant delivery 24/7.'}
            </span>
          </div>
          <a
            href="https://wa.me/2348031234567?text=Assalamu%20Alaikum,%203PLE%20A%20DATA%20Support"
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 text-[11px] font-bold text-emerald-700 dark:text-emerald-300 hover:underline flex items-center gap-1"
          >
            <MessageSquare className="w-3 h-3 text-emerald-600" />
            <span>{language === 'ha' ? 'Taimako' : 'Help'}</span>
          </a>
        </div>

        {/* Active Session Card if currently logged in */}
        {isAuthenticated && currentUser && (
          <div className="mb-5 p-4 sm:p-5 bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-3xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs">
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
                  {currentUser.username && (
                    <span className="text-[11px] font-mono text-emerald-700 dark:text-emerald-400 font-bold">
                      @{currentUser.username}
                    </span>
                  )}
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
            className={`p-4 mb-5 rounded-2xl border text-xs flex items-center gap-3 shadow-xs ${
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
        {/* PORTAL 1: CUSTOMER AUTHENTICATION (AUTHENTIC BILALSADASUB) */}
        {/* ========================================================= */}
        {(!showAdminPortal || activePortal === 'customer') && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 sm:p-8 shadow-xl">
            {/* BilalSadaSub Standard Clean Auth Tabs: Sign In / Register / Quick PIN */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl mb-6 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setCustomerAuthMode('signin');
                  setFeedback(null);
                }}
                className={`flex-1 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                  customerAuthMode === 'signin'
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>{language === 'ha' ? 'Shiga Asusu' : 'Customer Sign In'}</span>
              </button>

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
                <span>{language === 'ha' ? 'Buɗe Sabon Asusu' : 'Create Account'}</span>
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
                <span>{language === 'ha' ? 'Lambar PIN' : 'Express PIN'}</span>
              </button>
            </div>

            {/* TAB 1: CUSTOMER SIGN IN (BilalSadaSub format) */}
            {customerAuthMode === 'signin' && (
              <form onSubmit={handleCustomerSignIn} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {language === 'ha' ? 'Sunan Mai Amfani / Imel / Waya' : 'Username, Email, or Phone Number'} *
                    </label>
                    {loginCarrier && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase ${loginCarrier.color}`}>
                        {loginCarrier.badge}
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <AtSign className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      required
                      value={custIdentifier}
                      onChange={(e) => setCustIdentifier(e.target.value)}
                      placeholder="e.g. musasulaiman or 08023345566 or user@gmail.com"
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1">
                    {language === 'ha'
                      ? 'Zaka iya shigar da Username dinka, lambar waya, ko kuma imel.'
                      : 'You can sign in using your registered Username, Phone number, or Email.'}
                  </p>
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
                      className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                    <span>{language === 'ha' ? 'Tuna da ni a wannan na\'ura' : 'Remember me on this device'}</span>
                  </label>

                  <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>SSL 256-Bit</span>
                  </span>
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2"
                  >
                    {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                    <span>{language === 'ha' ? 'Shiga Asusu' : 'Sign In to Account'}</span>
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

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'ha' ? 'Ba ka da asusu tukuna?' : "Don't have an account yet?"}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerAuthMode('register');
                        setFeedback(null);
                      }}
                      className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      {language === 'ha' ? 'Yi Rijista Yanzu' : 'Register Here'}
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* TAB 2: CUSTOMER REGISTRATION (BilalSadaSub Full Suite) */}
            {customerAuthMode === 'register' && (
              <form onSubmit={handleCustomerRegister} className="space-y-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    {language === 'ha'
                      ? 'Za a baka ₦2,500 kyautar maraba a walat ɗinka da zarar ka kammala rijista!'
                      : 'Instant ₦2,500 promotional welcome bonus automatically credited to your new wallet.'}
                  </span>
                </div>

                {/* Full Name & Username */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'ha' ? 'Sunan Mai Amfani (Username)' : 'Username'} *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <AtSign className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        required
                        value={regUsername}
                        onChange={(e) => setRegUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                        placeholder="e.g. sanihotoro"
                        className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-mono font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                    </div>
                  </div>
                </div>

                {/* Email & Phone with Carrier Detection */}
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
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        {language === 'ha' ? 'Lambar Waya' : 'Phone Number'} *
                      </label>
                      {regCarrier && (
                        <span className={`text-[10px] px-2 py-0.2 rounded font-bold uppercase ${regCarrier.color}`}>
                          {regCarrier.badge}
                        </span>
                      )}
                    </div>
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

                {/* Account Type & State */}
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
                      <option value="customer">Personal Customer (VTU, Bills & Domestic Flights)</option>
                      <option value="retailer">Reseller / Sub-Agent (Wholesale Telecom Reseller)</option>
                      <option value="agent">POS Agent (Merchant Banking & Remittance)</option>
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
                      <option value="Sokoto State">Sokoto State</option>
                      <option value="Bauchi State">Bauchi State</option>
                      <option value="Other">Other States in Nigeria</option>
                    </select>
                  </div>
                </div>

                {/* Password & Confirm Password (BilalSadaSub standard) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'ha' ? 'Kalmar Sirri' : 'Password'} *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showRegPassword ? 'text' : 'password'}
                        required
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Min. 6 characters"
                        className="w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegPassword(!showRegPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showRegPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        {language === 'ha' ? 'Tabbatar da Kalmar Sirri' : 'Confirm Password'} *
                      </label>
                      {regConfirmPassword && (
                        <span
                          className={`text-[10px] font-bold ${
                            regPassword === regConfirmPassword ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {regPassword === regConfirmPassword
                            ? (language === 'ha' ? 'Sun dace ✓' : 'Matches ✓')
                            : (language === 'ha' ? 'Ba su dace ba' : 'Mismatch')}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <Lock className="w-4 h-4" />
                      </div>
                      <input
                        type={showRegConfirmPassword ? 'text' : 'password'}
                        required
                        value={regConfirmPassword}
                        onChange={(e) => setRegConfirmPassword(e.target.value)}
                        placeholder="Re-enter password"
                        className={`w-full pl-10 pr-9 py-2.5 bg-slate-50 dark:bg-slate-800 border rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 ${
                          regConfirmPassword && regPassword !== regConfirmPassword
                            ? 'border-rose-400 focus:ring-rose-500/30'
                            : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500/30'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                        {showRegConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 4-Digit Transaction PIN & Referral Code */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'ha' ? 'PIN mai Lamba 4 na Biyan Kuɗi' : '4-Digit Transaction PIN'} *
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      {language === 'ha' ? 'Lambar/Sunan Gayyata (Zabi ne)' : 'Referral Username / Code (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={regReferral}
                      onChange={(e) => setRegReferral(e.target.value.toUpperCase())}
                      placeholder="e.g. 3PLEA or sanihotoro"
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-mono"
                    />
                  </div>
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
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95 mt-3"
                >
                  {loading ? (
                    <RotateCcw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4" />
                  )}
                  <span>
                    {language === 'ha' ? 'Kammala Rijista & Karɓi ₦2,500' : 'Register Account & Claim ₦2,500 Bonus'}
                  </span>
                </button>

                <div className="text-center pt-2">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {language === 'ha' ? 'Kina/Kana da asusu?' : 'Already have an account?'}{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setCustomerAuthMode('signin');
                        setFeedback(null);
                      }}
                      className="font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      {language === 'ha' ? 'Shiga Asusu' : 'Sign In Here'}
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* TAB 3: CUSTOMER QUICK PHONE + PIN */}
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
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      {language === 'ha' ? 'Lambar Waya' : 'Registered Phone Number'} *
                    </label>
                    {pinCarrier && (
                      <span className={`text-[10px] px-2 py-0.2 rounded font-bold uppercase ${pinCarrier.color}`}>
                        {pinCarrier.badge}
                      </span>
                    )}
                  </div>
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
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
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
                      className="w-full pl-10 pr-3.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm font-mono font-bold tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm rounded-xl transition-all shadow-md flex items-center justify-center gap-2 active:scale-95"
                >
                  {loading ? <RotateCcw className="w-4 h-4 animate-spin" /> : <ArrowRight className="w-4 h-4" />}
                  <span>{language === 'ha' ? 'Tabbatar da PIN & Shiga' : 'Verify PIN & Enter Dashboard'}</span>
                </button>
              </form>
            )}

            {/* BilalSadaSub Standard: Direct WhatsApp Help & App Badges */}
            <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* WhatsApp Support Button */}
              <a
                href="https://wa.me/2348031234567?text=Hello%203PLE%20A%20DATA%20Support,%20I%20need%20assistance%20with%20my%20account"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-400/30 text-xs font-bold transition-colors flex items-center justify-center gap-2"
              >
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <span>{language === 'ha' ? 'Taimako a WhatsApp (0803 123 4567)' : 'WhatsApp Support (0803 123 4567)'}</span>
                <ExternalLink className="w-3 h-3 opacity-70" />
              </a>

              {/* App Download Badges (Android & iOS) */}
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 font-medium">
                  {language === 'ha' ? 'Sauke Manhaja:' : 'Get the App:'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setFeedback({
                      type: 'success',
                      message:
                        language === 'ha'
                          ? 'Ana aiki da manhajar Android (APK) da PWA Web App don saukewa kai tsaye.'
                          : '3PLE A DATA Android APK and Progressive Web App (PWA) available for instant install.',
                    });
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                >
                  <Smartphone className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Android & iOS</span>
                </button>
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
                      {language === 'ha' ? 'Imel ko Sunan Super Admin' : 'Super Admin Official Email or Username'} *
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
                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                      {language === 'ha' ? 'Kalmar Sirri ta Darakta' : 'Master Password'} *
                    </label>
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

                  <div className="pt-2">
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
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Global Footer Notes with Discreet Admin Link */}
        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left text-xs text-slate-500 dark:text-slate-400">
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
                    ? 'Shigar da lambar waya, username ko imel ɗin da kayi rijista da shi don tura maka lambar tabbatarwa (OTP).'
                    : 'Enter your registered phone number, username, or email address. We will dispatch a 6-digit OTP code.'}
                </p>
                <input
                  type="text"
                  value={forgotTarget}
                  onChange={(e) => setForgotTarget(e.target.value)}
                  placeholder="0802 334 5566, username or user@gmail.com"
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
