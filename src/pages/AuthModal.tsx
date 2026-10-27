import React, { useState } from 'react';
import { User, UserRole } from '../types';
import {
  ShieldCheck,
  User as UserIcon,
  Store,
  ShieldAlert,
  X,
  Lock,
  Phone,
  Mail,
  KeyRound,
  Check,
  ScanFace,
  Sun,
  Moon,
  Monitor,
  Palette,
  Sparkles,
  Fingerprint,
  Laptop,
  Smartphone,
  Tablet,
  Plus,
  Trash2,
  Clock,
  Timer,
  AlertCircle,
  Shield,
  Key,
  CheckCircle2,
} from 'lucide-react';
import { ThemeMode } from '../services/theme';
import {
  getBiometricConfig,
  saveBiometricConfig,
  getTrustedBiometricDevices,
  saveTrustedBiometricDevices,
  TrustedBiometricDevice,
  BiometricConfig,
} from '../services/biometrics';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  onSwitchUser: (newUser: User) => void;
  language: 'en' | 'ha';
  onTestBiometrics?: () => void;
  theme: ThemeMode;
  onSetTheme: (newTheme: ThemeMode) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSwitchUser,
  language,
  onTestBiometrics,
  theme,
  onSetTheme,
}) => {
  const [tab, setTab] = useState<'switch' | 'security' | 'appearance'>('switch');
  const [newPin, setNewPin] = useState<string>('1234');
  const [pinSaved, setPinSaved] = useState<boolean>(false);

  // Biometric Security & Device State
  const [trustedDevices, setTrustedDevices] = useState<TrustedBiometricDevice[]>(() =>
    getTrustedBiometricDevices()
  );
  const [biometricConfig, setBiometricConfig] = useState<BiometricConfig>(() =>
    getBiometricConfig()
  );
  const [timeoutSavedMessage, setTimeoutSavedMessage] = useState<string>('');
  const [showAddDevice, setShowAddDevice] = useState<boolean>(false);
  const [newDevName, setNewDevName] = useState<string>('');
  const [newDevType, setNewDevType] = useState<'faceid' | 'touchid' | 'windows_hello' | 'hardware_key'>('touchid');
  const [newDevPlatform, setNewDevPlatform] = useState<'macos' | 'ios' | 'android' | 'windows' | 'linux'>('macos');

  if (!isOpen) return null;

  const isDarkMode =
    theme === 'dark' ||
    (theme === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches);

  const demoUsers: Array<{
    name: string;
    email: string;
    phone: string;
    role: UserRole;
    balance: number;
    desc: string;
    icon: any;
  }> = [
    {
      name: 'Aliyu Mohammed Kano',
      email: 'aliyu@3plea.ng',
      phone: '+234 803 123 4567',
      role: 'customer',
      balance: 145000,
      desc: 'Individual customer account purchasing airtime, paying KEDCO bills, and booking domestic flights.',
      icon: UserIcon,
    },
    {
      name: 'Tarauni Telecoms & Sub Hub',
      email: 'retailer@3plea.ng',
      phone: '+234 814 999 8811',
      role: 'retailer',
      balance: 620000,
      desc: 'Wholesale retailer account with bulk VTU dispensing, API reseller access, and commission payouts.',
      icon: Store,
    },
    {
      name: '3PLE A Executive Admin',
      email: '3pleadata@gmail.com',
      phone: '+234 803 000 3PLE',
      role: 'super_admin',
      balance: 12500000,
      desc: 'Full administrative access to Provider Registry, Double-entry ledgers, and Pricing management.',
      icon: ShieldAlert,
    },
  ];

  const handleSelectPersona = (persona: (typeof demoUsers)[0]) => {
    const updated: User = {
      ...currentUser,
      name: persona.name,
      email: persona.email,
      phone: persona.phone,
      role: persona.role,
      walletBalance: persona.balance,
    };
    onSwitchUser(updated);
    onClose();
  };

  const handleSavePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length === 4) {
      setPinSaved(true);
      setTimeout(() => setPinSaved(false), 2000);
    }
  };

  const handleSelectTimeout = (minutes: number) => {
    const updated: BiometricConfig = {
      ...biometricConfig,
      sessionTimeoutMinutes: minutes,
    };
    setBiometricConfig(updated);
    saveBiometricConfig(updated);
    const msg =
      language === 'ha'
        ? minutes === 0
          ? 'Kullewa: Nan take bayan kowanne mataki'
          : `An saita lokacin kullewa: Minti ${minutes}`
        : minutes === 0
        ? 'Locked immediately after each sensitive action'
        : `Idle lock timeout set to ${minutes} min${minutes > 1 ? 's' : ''}`;
    setTimeoutSavedMessage(msg);
    setTimeout(() => setTimeoutSavedMessage(''), 2500);
  };

  const handleToggleAutoLock = () => {
    const updated: BiometricConfig = {
      ...biometricConfig,
      autoLockOnBlur: !biometricConfig.autoLockOnBlur,
    };
    setBiometricConfig(updated);
    saveBiometricConfig(updated);
  };

  const handleAddDevice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDevName.trim()) return;

    const newDevice: TrustedBiometricDevice = {
      id: `bio_dev_${Date.now()}`,
      name: newDevName.trim(),
      type: newDevType,
      platform: newDevPlatform,
      browser:
        typeof navigator !== 'undefined'
          ? navigator.userAgent.includes('Mobile')
            ? 'Mobile Browser'
            : 'Desktop Browser'
          : 'Browser Enclave',
      enrolledAt: new Date().toISOString(),
      lastUsedAt: new Date().toISOString(),
      isCurrentDevice: false,
      enclaveAttested: true,
      status: 'active',
    };

    const nextList = [newDevice, ...trustedDevices];
    setTrustedDevices(nextList);
    saveTrustedBiometricDevices(nextList);
    setNewDevName('');
    setShowAddDevice(false);
  };

  const handleRevokeDevice = (deviceId: string) => {
    const nextList = trustedDevices.filter((d) => d.id !== deviceId);
    setTrustedDevices(nextList);
    saveTrustedBiometricDevices(nextList);
  };

  const handleRestoreDefaultDevices = () => {
    const initial = getTrustedBiometricDevices();
    setTrustedDevices(initial);
    saveTrustedBiometricDevices(initial);
  };

  const getPlatformIcon = (platform: string, type: string) => {
    if (type === 'hardware_key') return <Key className="w-4 h-4" />;
    switch (platform) {
      case 'macos':
      case 'windows':
      case 'linux':
        return <Laptop className="w-4 h-4" />;
      case 'ios':
      case 'android':
        return <Smartphone className="w-4 h-4" />;
      default:
        return <Tablet className="w-4 h-4" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transition-colors duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.png"
              alt="Logo"
              className="w-6 h-6 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).src =
                  '/public/assets/aistudio/file_00000000af208211b9b8694ca4544f0f_3769349c.png';
              }}
            />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {language === 'ha' ? 'Saitin Bayanan Asusu' : 'Account Profile & Preferences'}
              </h3>
              <p className="text-[11px] text-slate-400">3PLE A Central Identity Engine</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Quick Header Dark Mode Switch */}
            <button
              type="button"
              role="switch"
              aria-checked={isDarkMode}
              onClick={() => onSetTheme(isDarkMode ? 'light' : 'dark')}
              className="p-2 text-slate-500 hover:text-amber-500 dark:text-slate-400 dark:hover:text-amber-400 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Sub-tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-6 pt-2 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setTab('switch')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-all ${
              tab === 'switch'
                ? 'border-slate-900 dark:border-amber-400 text-slate-900 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {language === 'ha' ? 'Masu Asusu' : 'Role Personas'}
          </button>
          <button
            type="button"
            onClick={() => setTab('appearance')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'appearance'
                ? 'border-slate-900 dark:border-amber-400 text-slate-900 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>{language === 'ha' ? 'Yanayin Duhu & Launi' : 'Theme & Dark Mode'}</span>
          </button>
          <button
            type="button"
            onClick={() => setTab('security')}
            className={`py-2 px-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              tab === 'security'
                ? 'border-slate-900 dark:border-amber-400 text-slate-900 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{language === 'ha' ? 'Tsaro' : 'Security'}</span>
          </button>
        </div>

        {/* Tab 1: Switch Persona */}
        {tab === 'switch' && (
          <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              Select any role to test its specific features, permissions, wholesale pricing, and admin controls:
            </p>

            {demoUsers.map((persona, i) => {
              const Icon = persona.icon;
              const isCurrent = currentUser.role === persona.role;
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleSelectPersona(persona)}
                  className={`w-full p-4 rounded-2xl border text-left transition-all flex items-start gap-3.5 ${
                    isCurrent
                      ? 'border-slate-900 dark:border-amber-400 bg-slate-900 dark:bg-slate-800 text-white shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-800/70 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  <div
                    className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isCurrent
                        ? 'bg-slate-800 dark:bg-slate-700 text-amber-400'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 shadow-xs'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold truncate">{persona.name}</span>
                      <span
                        className={`text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-bold ${
                          isCurrent
                            ? 'bg-amber-400 text-slate-950'
                            : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {persona.role}
                      </span>
                    </div>

                    <p
                      className={`text-[11px] mt-1 leading-relaxed ${
                        isCurrent ? 'text-slate-300' : 'text-slate-500 dark:text-slate-400'
                      }`}
                    >
                      {persona.desc}
                    </p>

                    <div className="mt-2 text-[11px] font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                      Balance: ₦{persona.balance.toLocaleString()}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Tab 2: Theme & Appearance Settings (Primary Dark Mode Toggle Area) */}
        {tab === 'appearance' && (
          <div className="p-6 space-y-5">
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-sm block mb-1">
                {language === 'ha' ? 'Tsarin Kayan Ciki & Yanayin Duhu' : 'Interface Appearance & Global Theme'}
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                {language === 'ha'
                  ? 'Zaɓi tsakanin yanayin duhu (Dark mode) ko yanayin fari (Light mode) don jin dadin karatu da aiki a kowanne lokaci.'
                  : 'Customize the visual presentation of 3PLE A. Dark mode reduces eye strain in low-light environments and conserves battery life.'}
              </p>
            </div>

            {/* Main Interactive Toggle Switch Card */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/70 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-500 dark:text-amber-400">
                    {isDarkMode ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {language === 'ha' ? 'Kunna Yanayin Duhu' : 'Global Dark Mode'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {isDarkMode
                        ? language === 'ha'
                          ? 'Yanayin Duhu aiki yake yanzu'
                          : 'Dark mode is currently active'
                        : language === 'ha'
                        ? 'Yanayin Fari aiki yake yanzu'
                        : 'Light mode is currently active'}
                    </div>
                  </div>
                </div>

                {/* Tactile Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  aria-checked={isDarkMode}
                  onClick={() => onSetTheme(isDarkMode ? 'light' : 'dark')}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none shadow-inner ${
                    isDarkMode ? 'bg-amber-500' : 'bg-slate-300'
                  }`}
                  aria-label="Toggle dark mode"
                >
                  <span
                    className={`pointer-events-none inline-flex h-6 w-6 transform items-center justify-center rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                      isDarkMode ? 'translate-x-7' : 'translate-x-0'
                    }`}
                  >
                    {isDarkMode ? (
                      <Moon className="w-3.5 h-3.5 text-slate-950" />
                    ) : (
                      <Sun className="w-3.5 h-3.5 text-amber-600" />
                    )}
                  </span>
                </button>
              </div>

              {/* Theme Mode Segmented Pills */}
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
                <span className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-2">
                  {language === 'ha' ? 'Zabi Yanayi' : 'Theme Mode Selection'}
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => onSetTheme('light')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      theme === 'light'
                        ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5" />
                    <span>{language === 'ha' ? 'Fari' : 'Light'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSetTheme('dark')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      theme === 'dark'
                        ? 'border-amber-400 bg-amber-400 text-slate-950 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5" />
                    <span>{language === 'ha' ? 'Duhu' : 'Dark'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onSetTheme('system')}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      theme === 'system'
                        ? 'border-amber-400 bg-amber-400 text-slate-950 shadow-sm'
                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700/60'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>{language === 'ha' ? 'Na\'ura' : 'System'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Live Palette Preview Card */}
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    High-Contrast FinTech Palette
                  </div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400">
                    Deep Slate-950 · Accent Amber-400 · Emerald-400 Ledgers
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                Tailwind v4
              </span>
            </div>
          </div>
        )}

        {/* Tab 3: Security Tab (Trusted Biometric Devices & Idle Timeout Lock Duration) */}
        {tab === 'security' && (
          <div className="p-6 space-y-6 text-xs max-h-[72vh] overflow-y-auto">
            {/* Top Posture Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 dark:from-slate-800 dark:via-slate-850 dark:to-slate-900 text-white border border-slate-800 dark:border-slate-700 shadow-md">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      <span>{language === 'ha' ? 'Kariyar Biometric & Tsaro' : 'Biometric Security & Identity Vault'}</span>
                      <span className="text-[9px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                        Hardware Enclave Active
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {language === 'ha'
                        ? 'Kula da amintattun na\'urorin biometric da saita lokacin kullewa ta atomatik.'
                        : 'Manage verified biometric authenticators, device trust certificates, and idle auto-lock policy.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Security Metrics Pills */}
              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-slate-800/80 text-[11px]">
                <div className="bg-slate-800/60 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">
                    {language === 'ha' ? 'Na\'urorin da aka amince' : 'Trusted Authenticators'}
                  </span>
                  <span className="font-bold text-white font-mono">{trustedDevices.length} Enrolled</span>
                </div>
                <div className="bg-slate-800/60 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">
                    {language === 'ha' ? 'Lokacin Kullewa' : 'Idle Lock Threshold'}
                  </span>
                  <span className="font-bold text-amber-300 font-mono">
                    {biometricConfig.sessionTimeoutMinutes === 0
                      ? 'Immediate (0m)'
                      : `${biometricConfig.sessionTimeoutMinutes} Minutes`}
                  </span>
                </div>
                <div className="bg-slate-800/60 dark:bg-slate-900/60 px-2.5 py-1.5 rounded-xl">
                  <span className="text-slate-400 block text-[10px]">
                    {language === 'ha' ? 'Kullewa Idan Aka Bar Shafi' : 'Auto-Lock on Blur'}
                  </span>
                  <span
                    className={`font-bold font-mono ${
                      biometricConfig.autoLockOnBlur ? 'text-emerald-400' : 'text-slate-400'
                    }`}
                  >
                    {biometricConfig.autoLockOnBlur ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
              </div>
            </div>

            {/* SECTION 1: IDLE TIMEOUT LOCK DURATION */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">
                      {language === 'ha' ? 'Tsawon Lokacin Kullewa (Idle Timeout)' : 'Idle Timeout Lock Duration'}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'ha'
                        ? 'Zaɓi tsawon lokacin da asusunka zai tsaya a bude kafin ya nemi biometric ko PIN.'
                        : 'Choose how long biometric authorization persists before requiring re-authentication.'}
                    </p>
                  </div>
                </div>

                {timeoutSavedMessage && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 rounded-lg text-[10px] font-bold border border-emerald-300 dark:border-emerald-800 animate-fade-in">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{timeoutSavedMessage}</span>
                  </div>
                )}
              </div>

              {/* Segmented Duration Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {[
                  {
                    minutes: 0,
                    label: '0m',
                    sub: language === 'ha' ? 'Nan take' : 'Immediate',
                    badge: language === 'ha' ? 'Kowanne mataki' : 'Strict',
                  },
                  {
                    minutes: 1,
                    label: '1m',
                    sub: language === 'ha' ? 'Minti 1' : '1 Min',
                    badge: language === 'ha' ? 'Gaggawa' : '1 Minute',
                  },
                  {
                    minutes: 5,
                    label: '5m',
                    sub: language === 'ha' ? 'Minti 5' : '5 Mins',
                    badge: language === 'ha' ? 'Shawarwari' : 'Standard',
                  },
                  {
                    minutes: 15,
                    label: '15m',
                    sub: language === 'ha' ? 'Minti 15' : '15 Mins',
                    badge: language === 'ha' ? 'Tsawaita' : 'Extended',
                  },
                  {
                    minutes: 30,
                    label: '30m',
                    sub: language === 'ha' ? 'Minti 30' : '30 Mins',
                    badge: language === 'ha' ? 'Saki jiki' : 'Relaxed',
                  },
                ].map((option) => {
                  const isSelected = biometricConfig.sessionTimeoutMinutes === option.minutes;
                  return (
                    <button
                      key={option.minutes}
                      type="button"
                      onClick={() => handleSelectTimeout(option.minutes)}
                      className={`relative p-2.5 rounded-xl border text-center transition-all ${
                        isSelected
                          ? 'border-amber-400 bg-amber-400/10 dark:bg-amber-400/20 text-slate-900 dark:text-white shadow-xs ring-2 ring-amber-400/30'
                          : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-750'
                      }`}
                    >
                      <div className="flex items-center justify-center gap-1 font-mono font-black text-sm">
                        <span>{option.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />}
                      </div>
                      <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                        {option.sub}
                      </div>
                      <div
                        className={`text-[9px] font-mono uppercase px-1 py-0.2 rounded mt-1 inline-block font-semibold ${
                          isSelected
                            ? 'bg-amber-400 text-slate-950 font-bold'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {option.badge}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Auto-Lock on Blur Switch */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
                <div className="space-y-0.5 pr-4">
                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <Timer className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {language === 'ha'
                        ? 'Kullewa Nan Take Idan Aka Bar Shafi'
                        : 'Auto-Lock on Tab Inactivity & Screen Blur'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {language === 'ha'
                      ? 'Yana kulle duk wani izinin biometric nan take da zaran ka canza tab ko ka saukar da browser.'
                      : 'Instantly revokes biometric authorization when switching away to another tab or minimizing the browser.'}
                  </p>
                </div>

                <button
                  type="button"
                  role="switch"
                  aria-checked={!!biometricConfig.autoLockOnBlur}
                  onClick={handleToggleAutoLock}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    biometricConfig.autoLockOnBlur ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                  aria-label="Toggle auto-lock on blur"
                >
                  <span
                    className={`pointer-events-none inline-flex h-5 w-5 transform items-center justify-center rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      biometricConfig.autoLockOnBlur ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* SECTION 2: TRUSTED BIOMETRIC DEVICES MANAGEMENT */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400">
                    <Fingerprint className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">
                      {language === 'ha' ? 'Na\'urorin Biometric Masu Aminci' : 'Trusted Biometric Authenticators'}
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'ha'
                        ? 'Kayan hardware da aka tabbatar da suke da damar tantancewa ta FaceID ko Dermal Fingerprint.'
                        : 'Hardware devices registered with Secure Enclave or TPM hardware for fast biometrics.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAddDevice((prev) => !prev)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{showAddDevice ? (language === 'ha' ? 'Rufe' : 'Close') : (language === 'ha' ? 'Sanya Sabuwar Na\'ura' : 'Enroll Device')}</span>
                </button>
              </div>

              {/* Inline Device Enrollment Form */}
              {showAddDevice && (
                <form
                  onSubmit={handleAddDevice}
                  className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-400/40 dark:border-amber-400/30 space-y-3 animate-fade-in"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Shield className="w-3.5 h-3.5 text-amber-500" />
                      <span>{language === 'ha' ? 'Yi Rijistar Sabuwar Na\'ura' : 'Enroll New Hardware Authenticator'}</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">WebAuthn / FIDO2 Level 2</span>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                      {language === 'ha' ? 'Sunan Na\'ura' : 'Device Friendly Name / Label'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Aliyu's MacBook Pro M3 or Office Galaxy Tab"
                      value={newDevName}
                      onChange={(e) => setNewDevName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                      autoFocus
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        {language === 'ha' ? 'Nau\'in Biometric' : 'Biometric Sensor Type'}
                      </label>
                      <select
                        value={newDevType}
                        onChange={(e) => setNewDevType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                      >
                        <option value="touchid">Touch ID / Fingerprint Sensor</option>
                        <option value="faceid">Face ID / 3D Depth Scanner</option>
                        <option value="windows_hello">Windows Hello Biometrics</option>
                        <option value="hardware_key">FIDO2 Hardware Key (YubiKey)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1">
                        {language === 'ha' ? 'Na\'ura / Tsari' : 'Operating System / Platform'}
                      </label>
                      <select
                        value={newDevPlatform}
                        onChange={(e) => setNewDevPlatform(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                      >
                        <option value="macos">macOS (Apple Silicon)</option>
                        <option value="ios">iOS (iPhone / iPad)</option>
                        <option value="android">Android (Pixel / Samsung)</option>
                        <option value="windows">Windows 11 / TPM 2.0</option>
                        <option value="linux">Linux FIDO Authenticator</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowAddDevice(false)}
                      className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 font-medium"
                    >
                      {language === 'ha' ? 'Soke' : 'Cancel'}
                    </button>
                    <button
                      type="submit"
                      disabled={!newDevName.trim()}
                      className="px-3.5 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors disabled:opacity-40"
                    >
                      {language === 'ha' ? 'Adana Na\'ura' : 'Register Authenticator'}
                    </button>
                  </div>
                </form>
              )}

              {/* Devices List */}
              <div className="space-y-2">
                {trustedDevices.length === 0 ? (
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 text-center space-y-2">
                    <p className="text-slate-500 dark:text-slate-400 text-xs">
                      {language === 'ha'
                        ? 'Babu wata na\'ura biometric da aka amince da ita a yanzu.'
                        : 'No trusted biometric authenticators enrolled yet.'}
                    </p>
                    <button
                      type="button"
                      onClick={handleRestoreDefaultDevices}
                      className="text-amber-500 hover:text-amber-400 font-bold text-xs underline"
                    >
                      {language === 'ha' ? 'Mayar da na\'urorin farko' : 'Restore Default Devices'}
                    </button>
                  </div>
                ) : (
                  trustedDevices.map((dev) => {
                    const icon = getPlatformIcon(dev.platform, dev.type);
                    return (
                      <div
                        key={dev.id}
                        className={`p-3 rounded-xl border transition-all flex items-center justify-between gap-3 ${
                          dev.isCurrentDevice
                            ? 'bg-white dark:bg-slate-900 border-amber-400/50 shadow-xs ring-1 ring-amber-400/20'
                            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className={`p-2 rounded-xl shrink-0 ${
                              dev.isCurrentDevice
                                ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                            }`}
                          >
                            {icon}
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-900 dark:text-white text-xs truncate">
                                {dev.name}
                              </span>
                              {dev.isCurrentDevice && (
                                <span className="text-[9px] font-mono uppercase bg-amber-400 text-slate-950 font-bold px-1.5 py-0.2 rounded-full shrink-0">
                                  {language === 'ha' ? 'Wannan Na\'urar' : 'Current Device'}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">
                              <span className="capitalize font-medium text-slate-700 dark:text-slate-300">
                                {dev.type === 'touchid'
                                  ? 'Touch ID'
                                  : dev.type === 'faceid'
                                  ? 'Face ID'
                                  : dev.type === 'windows_hello'
                                  ? 'Windows Hello'
                                  : 'FIDO Key'}
                              </span>
                              <span>•</span>
                              <span>{dev.browser}</span>
                              <span>•</span>
                              <span className="text-emerald-700 dark:text-emerald-300 font-semibold flex items-center gap-1">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                                {dev.enclaveAttested ? 'Enclave Attested' : 'Verified'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleRevokeDevice(dev.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title={language === 'ha' ? 'Cire wannan na\'ura' : 'Revoke device authorization'}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* SECTION 3: TRANSACTION PIN & BIOMETRIC TEST */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* PIN Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-400">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white text-xs block">
                      {language === 'ha' ? '4-Digit PIN na Ma\'amala' : '4-Digit Transaction PIN'}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Fallback authorization
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSavePin} className="space-y-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={newPin}
                    onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-mono text-sm font-bold text-slate-900 dark:text-white tracking-widest text-center focus:outline-none focus:ring-2 focus:ring-amber-400"
                    placeholder="••••"
                  />

                  {pinSaved && (
                    <div className="p-1.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-lg border border-emerald-200 dark:border-emerald-800 flex items-center justify-center gap-1.5 text-[11px] font-medium">
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>PIN successfully updated!</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={newPin.length !== 4}
                    className="w-full py-2 bg-slate-900 dark:bg-amber-400 hover:bg-slate-800 dark:hover:bg-amber-300 text-white dark:text-slate-950 font-bold text-xs rounded-xl transition-colors disabled:opacity-40"
                  >
                    Update PIN
                  </button>
                </form>
              </div>

              {/* Hardware Biometric Test & KYC */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/80 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-amber-400/20 text-amber-600 dark:text-amber-400">
                        <ScanFace className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white text-xs">
                        Scanner Diagnostic
                      </span>
                    </div>
                    <span className="text-[9px] font-mono bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                      Ready
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Test hardware biometric depth sensor responsiveness, sound effects, and haptic feedback.
                  </p>
                </div>

                {onTestBiometrics && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onTestBiometrics();
                    }}
                    className="w-full py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 shadow-xs"
                  >
                    <ScanFace className="w-3.5 h-3.5" />
                    <span>Run Scanner Test</span>
                  </button>
                )}

                <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                  <span>KYC Tier 3 Corporate</span>
                  <span className="text-emerald-700 dark:text-emerald-300 font-bold">BVN & NIN Verified</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
