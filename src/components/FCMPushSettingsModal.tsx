import React, { useState, useEffect } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  ShieldAlert,
  Zap,
  Wallet,
  Volume2,
  VolumeX,
  X,
  Sparkles,
  Smartphone,
  ExternalLink,
  RefreshCw,
  Send,
  Radio,
} from 'lucide-react';
import {
  getFCMConfig,
  saveFCMConfig,
  requestFCMPermission,
  getPushHistory,
  triggerDemoTransactionPush,
  triggerDemoWalletCreditPush,
  triggerDemoSecurityAlertPush,
  FCMServiceConfig,
  PushNotificationPayload,
} from '../services/fcmService';
import { Language } from '../services/i18n';

interface FCMPushSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  userId?: string;
}

export const FCMPushSettingsModal: React.FC<FCMPushSettingsModalProps> = ({
  isOpen,
  onClose,
  language,
  userId = 'usr_admin',
}) => {
  const [config, setConfig] = useState<FCMServiceConfig>(getFCMConfig);
  const [history, setHistory] = useState<PushNotificationPayload[]>(getPushHistory);
  const [copiedToken, setCopiedToken] = useState(false);
  const [isRequesting, setIsRequesting] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'settings' | 'history'>('settings');

  useEffect(() => {
    if (isOpen) {
      setConfig(getFCMConfig());
      setHistory(getPushHistory());
      setTestStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    setIsRequesting(true);
    setTestStatus(null);
    try {
      const result = await requestFCMPermission(userId);
      setConfig(getFCMConfig());
      if (result.granted) {
        setTestStatus(
          language === 'ha'
            ? 'An ba da izinin tura sanarwa! Na\'urar tana aiki da FCM.'
            : 'Push notifications permission granted! FCM device registered.'
        );
      } else {
        setTestStatus(
          result.error ||
            (language === 'ha'
              ? 'Ba a ba da izini ba. Da fatan za a duba saitunan browser.'
              : 'Permission not granted. Please check browser settings.')
        );
      }
    } finally {
      setIsRequesting(false);
    }
  };

  const handleCopyToken = () => {
    if (!config.token) return;
    navigator.clipboard.writeText(config.token);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const handleToggleCategory = (category: 'transactions' | 'walletCredits' | 'securityAlerts') => {
    const updated = saveFCMConfig({
      categories: {
        ...config.categories,
        [category]: !config.categories[category],
      },
    });
    setConfig(updated);
  };

  const handleToggleSound = () => {
    const updated = saveFCMConfig({ soundEnabled: !config.soundEnabled });
    setConfig(updated);
  };

  const handleRunTest = async (type: 'transaction' | 'credit' | 'security') => {
    setTestStatus(language === 'ha' ? 'Ana tura sanarwa...' : 'Dispatching push alert...');
    try {
      let sent: PushNotificationPayload;
      if (type === 'transaction') {
        sent = await triggerDemoTransactionPush(language);
      } else if (type === 'credit') {
        sent = await triggerDemoWalletCreditPush(language);
      } else {
        sent = await triggerDemoSecurityAlertPush(language);
      }

      setHistory(getPushHistory());
      setTestStatus(
        language === 'ha'
          ? `An tura sanarwa: "${sent.title}"`
          : `Push delivered: "${sent.title}"`
      );
    } catch (err: any) {
      setTestStatus(`Error: ${err?.message || 'Failed to dispatch push'}`);
    }
  };

  const isGranted = config.permission === 'granted';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs transition-opacity animate-in fade-in-0">
      <div className="relative w-full max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 flex items-center justify-center">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {language === 'ha'
                    ? 'Saitunan Sanarwar Tura (Firebase Cloud Messaging)'
                    : 'FCM Push Notifications Service'}
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  FCM v13
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {language === 'ha'
                  ? 'Sanarwar ciniki, shigar kudi, da gargadin tsaro'
                  : 'Real-time alerts for transactions, wallet credits & security'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-6 pt-3 pb-2 flex gap-2 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'settings'
                ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            {language === 'ha' ? 'Saituna & Na\'ura' : 'Settings & Device'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <span>{language === 'ha' ? 'Tarihin Sanarwa' : 'Push History'}</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
              {history.length}
            </span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'settings' && (
            <>
              {/* Permission & Status Card */}
              <div
                className={`p-4.5 rounded-2xl border transition-all ${
                  isGranted
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-950 dark:text-emerald-100'
                    : config.permission === 'denied'
                    ? 'bg-rose-500/5 border-rose-500/20 text-rose-950 dark:text-rose-100'
                    : 'bg-amber-500/5 border-amber-500/20 text-amber-950 dark:text-amber-100'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isGranted
                          ? 'bg-emerald-500 text-white'
                          : config.permission === 'denied'
                          ? 'bg-rose-500 text-white'
                          : 'bg-amber-500 text-white'
                      }`}
                    >
                      {isGranted ? (
                        <CheckCircle2 className="w-5 h-5" />
                      ) : config.permission === 'denied' ? (
                        <AlertTriangle className="w-5 h-5" />
                      ) : (
                        <Bell className="w-5 h-5" />
                      )}
                    </div>

                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {language === 'ha' ? 'Matsayin Sanarwar Browser' : 'Browser Push Permission'}
                      </div>
                      <div className="text-sm font-extrabold text-slate-900 dark:text-white capitalize">
                        {config.permission} ·{' '}
                        {isGranted
                          ? language === 'ha'
                            ? 'An Kunna (Active)'
                            : 'Active & Receiving'
                          : language === 'ha'
                          ? 'Ana Bukatar Izini'
                          : 'Action Needed'}
                      </div>
                    </div>
                  </div>

                  {!isGranted && (
                    <button
                      type="button"
                      onClick={handleRequestPermission}
                      disabled={isRequesting}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-600 active:scale-95 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5 shrink-0"
                    >
                      {isRequesting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {language === 'ha' ? 'Bada Izinin Sanarwa' : 'Enable Push Notifications'}
                      </span>
                    </button>
                  )}
                </div>

                {testStatus && (
                  <div className="mt-3 pt-3 border-t border-slate-200/60 dark:border-slate-800/60 text-xs font-medium text-slate-700 dark:text-slate-300">
                    {testStatus}
                  </div>
                )}
              </div>

              {/* FCM Device Token Card */}
              <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4 text-slate-500" />
                    <span>{language === 'ha' ? 'Lambar Na\'ura ta FCM (Token)' : 'FCM Registration Token'}</span>
                  </span>
                  {config.token && (
                    <button
                      type="button"
                      onClick={handleCopyToken}
                      className="flex items-center gap-1 text-[11px] text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      {copiedToken ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedToken ? (language === 'ha' ? 'An Kwafa' : 'Copied') : (language === 'ha' ? 'Kwafi Token' : 'Copy Token')}</span>
                    </button>
                  )}
                </div>

                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all select-all">
                  {config.token || (
                    <span className="italic text-slate-400">
                      {language === 'ha'
                        ? 'Danna "Bada Izinin Sanarwa" domin samar da FCM token.'
                        : 'Click "Enable Push Notifications" to generate device token.'}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400">
                  <span>Project: gen-lang-client-0527687246</span>
                  <span>Sender ID: 573695049450</span>
                </div>
              </div>

              {/* Push Categories Selection */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {language === 'ha' ? 'Rukunan Sanarwa Masu Aiki' : 'Notification Triggers & Channels'}
                </h4>

                <div className="space-y-2">
                  {/* Category 1: Transactions */}
                  <label
                    onClick={() => handleToggleCategory('transactions')}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {language === 'ha' ? 'Ciniki ya Yi Nasara' : 'Successful Transactions'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {language === 'ha'
                            ? 'Sanarwar katin waya, data, wutar lantarki, da tikitin jirgi'
                            : 'Instant push for Airtime, SME Data, DISCO tokens & Flights'}
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.categories.transactions}
                      onChange={() => {}}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                    />
                  </label>

                  {/* Category 2: Wallet Credits */}
                  <label
                    onClick={() => handleToggleCategory('walletCredits')}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                        <Wallet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {language === 'ha' ? 'Shigar Kudi a Walat' : 'Wallet Credits & Inflow'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {language === 'ha'
                            ? 'Sanarwar samun kudi ta Monnify, asusun banki, ko tura kudi'
                            : 'Alerts for Monnify settlements, virtual account transfers & deposits'}
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.categories.walletCredits}
                      onChange={() => {}}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                    />
                  </label>

                  {/* Category 3: Security Alerts */}
                  <label
                    onClick={() => handleToggleCategory('securityAlerts')}
                    className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-600 dark:text-violet-400 flex items-center justify-center shrink-0">
                        <ShieldAlert className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white">
                          {language === 'ha' ? 'Gargadin Tsaro' : 'Security Alerts'}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {language === 'ha'
                            ? 'Kulle asusun rashin aiki, tantancewar yatsa, da sauya PIN'
                            : 'Session auto-lock, biometric verifications & PIN alerts'}
                        </div>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={config.categories.securityAlerts}
                      onChange={() => {}}
                      className="w-4 h-4 text-amber-500 rounded focus:ring-amber-400"
                    />
                  </label>
                </div>
              </div>

              {/* Sound preference */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 shrink-0">
                    {config.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {language === 'ha' ? 'Sautin Sanarwa' : 'Push Notification Audio Chime'}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {language === 'ha'
                        ? 'Kida mai dadi idan sanarwa ta iso'
                        : 'Web Audio synthesizer chime on push receipt'}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleToggleSound}
                  className={`w-11 h-6 rounded-full transition-colors relative ${
                    config.soundEnabled ? 'bg-amber-500' : 'bg-slate-300 dark:bg-slate-700'
                  }`}
                >
                  <span
                    className={`block w-4 h-4 rounded-full bg-white transition-transform ${
                      config.soundEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Test Push Dispatcher Buttons */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Send className="w-3.5 h-3.5 text-amber-500" />
                    <span>{language === 'ha' ? 'Gwada Sanarwa Kai Tsaye' : 'Live Test Triggers'}</span>
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {language === 'ha' ? 'Danna don gwadawa' : 'Click to send sample alert'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleRunTest('transaction')}
                    className="p-3 bg-white dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-all group"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-0.5">
                      <Zap className="w-3.5 h-3.5" />
                      <span>{language === 'ha' ? 'Gwada Ciniki' : 'Tx Success'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      ₦1,450 MTN SME Data Ref: 3PA-SME
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRunTest('credit')}
                    className="p-3 bg-white dark:bg-slate-800 hover:bg-amber-50 dark:hover:bg-amber-950/40 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-all group"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400 mb-0.5">
                      <Wallet className="w-3.5 h-3.5" />
                      <span>{language === 'ha' ? 'Gwada Kudi' : 'Wallet Credit'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      +₦50,000 Monnify Settlement
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleRunTest('security')}
                    className="p-3 bg-white dark:bg-slate-800 hover:bg-violet-50 dark:hover:bg-violet-950/40 border border-slate-200 dark:border-slate-700 rounded-xl text-left transition-all group"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 mb-0.5">
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{language === 'ha' ? 'Gwada Tsaro' : 'Security Alert'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      Session Lockout Warning
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'history' && (
            <div className="space-y-3">
              {history.length === 0 ? (
                <div className="text-center py-10">
                  <Bell className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-40" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {language === 'ha' ? 'Babu Tarihin Sanarwa Tukuna' : 'No Push History Yet'}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {language === 'ha'
                      ? 'Sanarwar da aka tura zata bayyana a nan.'
                      : 'Dispatched push notifications will be cataloged here.'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {history.map((item) => (
                    <div key={item.id} className="py-3 flex items-start gap-3">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs ${
                          item.type === 'transaction_success'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
                            : item.type === 'wallet_credit'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400'
                            : 'bg-violet-100 dark:bg-violet-950 text-violet-600 dark:text-violet-400'
                        }`}
                      >
                        {item.type === 'transaction_success' ? (
                          <Zap className="w-3.5 h-3.5" />
                        ) : item.type === 'wallet_credit' ? (
                          <Wallet className="w-3.5 h-3.5" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                            {item.title}
                          </span>
                          <span className="text-[10px] text-slate-400 shrink-0">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.body}
                        </p>
                        {item.reference && (
                          <div className="mt-1 font-mono text-[9px] text-slate-400">
                            REF: {item.reference}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500">
          <span>3PLE A DATA (RC 9746103)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold rounded-xl text-xs hover:opacity-90 transition-opacity"
          >
            {language === 'ha' ? 'Rufe' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
};
