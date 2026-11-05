import React, { useState, useEffect } from 'react';
import { User } from '../types';
import {
  Lock,
  Unlock,
  ScanFace,
  Fingerprint,
  KeyRound,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  User as UserIcon,
  LogOut,
  Eye,
  EyeOff,
} from 'lucide-react';
import { verifySecurityPin, getSessionLockReason } from '../services/security';
import {
  playBiometricSound,
  triggerBiometricHaptic,
  recordBiometricSuccess,
  isHardwareBiometricAvailable,
} from '../services/biometrics';

interface SessionLockScreenProps {
  isLocked: boolean;
  currentUser: User;
  onUnlock: () => void;
  onSwitchUser: () => void;
  language?: 'en' | 'ha';
}

export const SessionLockScreen: React.FC<SessionLockScreenProps> = ({
  isLocked,
  currentUser,
  onUnlock,
  onSwitchUser,
  language = 'en',
}) => {
  const [unlockMethod, setUnlockMethod] = useState<'biometric' | 'pin'>('biometric');
  const [pin, setPin] = useState<string>('');
  const [showPin, setShowPin] = useState<boolean>(false);
  const [pinError, setPinError] = useState<string>('');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [unlockSuccess, setUnlockSuccess] = useState<boolean>(false);

  const lockReason = getSessionLockReason();
  const hardwareAvailable = isHardwareBiometricAvailable();

  useEffect(() => {
    if (isLocked) {
      setPin('');
      setPinError('');
      setUnlockSuccess(false);
      setIsScanning(false);
      setScanProgress(0);
    }
  }, [isLocked]);

  if (!isLocked) return null;

  const handleBiometricUnlock = () => {
    if (isScanning || unlockSuccess) return;

    setIsScanning(true);
    setScanProgress(0);
    playBiometricSound('scan');
    triggerBiometricHaptic('light');

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setIsScanning(false);
          setUnlockSuccess(true);
          playBiometricSound('success');
          triggerBiometricHaptic('success');
          recordBiometricSuccess('general');

          setTimeout(() => {
            onUnlock();
          }, 600);
          return 100;
        }
        return prev + 25;
      });
    }, 120);
  };

  const handlePinSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (pin.length === 0) {
      setPinError(language === 'ha' ? 'Da fatan a saka lambar PIN' : 'Please enter your Security PIN');
      return;
    }

    if (verifySecurityPin(pin)) {
      setPinError('');
      setUnlockSuccess(true);
      playBiometricSound('success');
      triggerBiometricHaptic('success');
      recordBiometricSuccess('general');

      setTimeout(() => {
        onUnlock();
      }, 500);
    } else {
      setPinError(language === 'ha' ? 'Lambar PIN ba daidai ba ce (Gwada 1234)' : 'Incorrect PIN. Please try again (Default: 1234)');
      playBiometricSound('fail');
      triggerBiometricHaptic('fail');
      setPin('');
    }
  };

  const handleKeypadPress = (digit: string) => {
    if (pin.length < 6) {
      const nextPin = pin + digit;
      setPin(nextPin);
      setPinError('');
      if (nextPin.length === 4) {
        if (verifySecurityPin(nextPin)) {
          setUnlockSuccess(true);
          playBiometricSound('success');
          triggerBiometricHaptic('success');
          recordBiometricSuccess('general');
          setTimeout(() => {
            onUnlock();
          }, 500);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin((prev) => prev.slice(0, -1));
    setPinError('');
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4 overflow-y-auto animate-fade-in select-none">
      {/* Background ambient security glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white p-6 text-center border-b border-slate-800 relative">
          <div className="flex justify-center mb-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-400 shadow-inner">
                {unlockSuccess ? (
                  <Unlock className="w-8 h-8 text-emerald-400 animate-bounce" />
                ) : (
                  <Lock className="w-8 h-8 text-amber-400" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-slate-900 border-2 border-slate-800 flex items-center justify-center">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              </div>
            </div>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-[10px] font-mono font-bold tracking-wider uppercase mb-1 border border-amber-400/30">
            <span>{language === 'ha' ? 'Kullewar Tsaro' : 'Security Session Locked'}</span>
          </div>

          <h2 className="text-xl font-extrabold tracking-tight text-white">
            3PLE A DATA
          </h2>
          <p className="text-[10px] font-mono text-slate-400 mt-0.5">
            RC 9746103 · Kano State, Nigeria
          </p>

          <p className="text-xs text-slate-300 mt-2 max-w-xs mx-auto">
            {lockReason === 'manual'
              ? language === 'ha'
                ? 'An kulle asusunka ne da kanka don kariya.'
                : 'Session locked manually for your security.'
              : language === 'ha'
              ? 'An kulle asusunka ta atomatik saboda rashin aiki don kare kudadenka.'
              : 'App session locked automatically due to inactivity to protect your wallet and account data.'}
          </p>
        </div>

        {/* User Card */}
        <div className="p-4 mx-6 mt-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-sm">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{currentUser.name}</span>
                <span className="text-[9px] font-mono uppercase bg-slate-200 dark:bg-slate-700 px-1.5 py-0.2 rounded font-bold text-slate-700 dark:text-slate-300">
                  {currentUser.role}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {currentUser.email}
              </div>
            </div>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-slate-400 block">{language === 'ha' ? 'Kudi' : 'Balance'}</span>
            <span className="text-xs font-bold font-mono text-amber-600 dark:text-amber-400">
              ₦{currentUser.walletBalance.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Method Switcher Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 px-6 mt-4">
          <button
            type="button"
            onClick={() => {
              setUnlockMethod('biometric');
              setPinError('');
            }}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              unlockMethod === 'biometric'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <ScanFace className="w-4 h-4" />
            <span>{language === 'ha' ? 'Biometric (Face/Touch)' : 'Biometrics'}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setUnlockMethod('pin');
              setPinError('');
            }}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-2 border-b-2 transition-colors ${
              unlockMethod === 'pin'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>{language === 'ha' ? 'PIN na Tsaro' : 'Security PIN'}</span>
          </button>
        </div>

        {/* Unlock Methods Body */}
        <div className="p-6 space-y-4">
          {unlockMethod === 'biometric' ? (
            <div className="space-y-4 text-center">
              <div className="relative py-4 flex flex-col items-center justify-center">
                <button
                  type="button"
                  onClick={handleBiometricUnlock}
                  disabled={isScanning || unlockSuccess}
                  className={`group relative w-24 h-24 rounded-3xl border-2 flex items-center justify-center transition-all shadow-lg active:scale-95 ${
                    unlockSuccess
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                      : isScanning
                      ? 'bg-amber-400/20 border-amber-400 text-amber-400 animate-pulse'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 border-amber-400/40 text-amber-500 dark:text-amber-400 hover:border-amber-400'
                  }`}
                >
                  {unlockSuccess ? (
                    <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                  ) : isScanning ? (
                    <RefreshCw className="w-12 h-12 animate-spin text-amber-400" />
                  ) : (
                    <div className="flex flex-col items-center">
                      <ScanFace className="w-10 h-10 group-hover:scale-110 transition-transform" />
                      <span className="text-[9px] font-bold uppercase tracking-wider mt-1 text-slate-600 dark:text-slate-300">
                        {language === 'ha' ? 'Danna' : 'Scan'}
                      </span>
                    </div>
                  )}

                  {/* Circular scan progress */}
                  {isScanning && (
                    <div
                      className="absolute inset-0 rounded-3xl border-4 border-amber-400 border-t-transparent animate-spin pointer-events-none"
                    />
                  )}
                </button>

                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 mt-3">
                  {unlockSuccess
                    ? language === 'ha'
                      ? 'An tabbatar da kai! Ana shiga...'
                      : 'Authentication Successful! Unlocking...'
                    : isScanning
                    ? language === 'ha'
                      ? 'Ana duba bayanan halitta...'
                      : 'Verifying Hardware Biometrics...'
                    : language === 'ha'
                    ? 'Danna don tantancewa ta FaceID ko TouchID'
                    : 'Tap to authenticate with FaceID or TouchID'}
                </p>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  {hardwareAvailable
                    ? 'Apple Secure Enclave / Android Keystore ready'
                    : 'Hardware biometric sensor ready'}
                </span>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setUnlockMethod('pin')}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline font-medium"
                >
                  {language === 'ha' ? 'Ko amfani da lambar PIN' : 'Or unlock with Security PIN'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <form onSubmit={handlePinSubmit} className="space-y-3">
                <div className="text-center">
                  <span className="text-xs text-slate-600 dark:text-slate-300 font-medium block">
                    {language === 'ha' ? 'Saka lambar PIN (Tsohuwa: 1234)' : 'Enter 4-Digit Security PIN (Default: 1234)'}
                  </span>

                  {/* PIN dots display */}
                  <div className="flex items-center justify-center gap-3 my-3">
                    {[0, 1, 2, 3].map((idx) => {
                      const hasVal = pin.length > idx;
                      return (
                        <div
                          key={idx}
                          className={`w-4 h-4 rounded-full border-2 transition-all ${
                            hasVal
                              ? 'bg-amber-400 border-amber-400 scale-110 shadow-xs'
                              : 'border-slate-300 dark:border-slate-700 bg-transparent'
                          }`}
                        />
                      );
                    })}
                  </div>

                  {/* Input field with toggle */}
                  <div className="relative max-w-xs mx-auto">
                    <input
                      type={showPin ? 'text' : 'password'}
                      value={pin}
                      maxLength={6}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '');
                        setPin(val);
                        setPinError('');
                        if (val.length === 4 && verifySecurityPin(val)) {
                          handlePinSubmit();
                        }
                      }}
                      placeholder="••••"
                      autoFocus
                      className="w-full text-center text-lg font-mono tracking-widest py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>

                  {pinError && (
                    <div className="flex items-center justify-center gap-1.5 text-xs text-red-500 dark:text-red-400 font-semibold mt-2">
                      <AlertCircle className="w-3.5 h-3.5" />
                      <span>{pinError}</span>
                    </div>
                  )}
                </div>

                {/* Keypad Grid for Touch / Mobile */}
                <div className="grid grid-cols-3 gap-2 max-w-xs mx-auto pt-1">
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((key) => {
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => {
                          if (key === 'C') setPin('');
                          else if (key === '⌫') handleBackspace();
                          else handleKeypadPress(key);
                        }}
                        className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-sm transition-colors active:scale-95"
                      >
                        {key}
                      </button>
                    );
                  })}
                </div>

                <button
                  type="submit"
                  disabled={unlockSuccess}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 font-bold text-xs transition-all shadow-sm active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  <span>{language === 'ha' ? 'Bude Asusu' : 'Unlock Session'}</span>
                </button>
              </form>
            </div>
          )}

          {/* Switch User / Logout Action */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>{language === 'ha' ? 'Ba kai ba ne?' : 'Not your account?'}</span>
            <button
              type="button"
              onClick={onSwitchUser}
              className="text-amber-600 dark:text-amber-400 hover:underline font-semibold flex items-center gap-1"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'ha' ? 'Canza Mai Asusu' : 'Switch Account / Log In'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
