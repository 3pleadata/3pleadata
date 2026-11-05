import React, { useState, useEffect, useRef } from 'react';
import { User, Transaction } from '../types';
import { Language, t } from '../services/i18n';
import {
  Sparkles,
  MessageSquare,
  X,
  Send,
  Bot,
  User as UserIcon,
  CheckCircle2,
  Clock,
  Shield,
  Zap,
  Phone,
  Plane,
  Building,
  CreditCard,
  RefreshCw,
  Search,
  Paperclip,
  ThumbsUp,
  Heart,
  Smile,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import {
  SupportAgent,
  SupportMessage,
  ChatSpace,
  INITIAL_SUPPORT_AGENTS,
  INITIAL_SPACES,
  getStoredSupportMessages,
  saveStoredSupportMessages,
  generateSupportAgentResponse,
  fetchGoogleChatSpaces,
  sendGoogleChatMessage,
} from '../services/googleChat';
import {
  initGoogleAuth,
  googleSignIn,
  googleSignOut,
  getGoogleAccessToken,
} from '../services/googleAuth';
import { GoogleSignInButton } from './GoogleSignInButton';
import { User as FirebaseUser } from 'firebase/auth';

interface AiAssistantPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  recentTransactions: Transaction[];
  activeTab: string;
  onNavigateTab: (tab: string) => void;
  onOpenFundModal: () => void;
  language: Language;
}

interface AiChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  actions?: Array<{ label: string; actionId: string }>;
}

export const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({
  isOpen,
  onClose,
  currentUser,
  recentTransactions,
  activeTab,
  onNavigateTab,
  onOpenFundModal,
  language,
}) => {
  const [panelTab, setPanelTab] = useState<'assistant' | 'support_chat'>('assistant');

  // Gemini Assistant State
  const [aiMessages, setAiMessages] = useState<AiChatMessage[]>([
    {
      id: 'welcome_ai_1',
      sender: 'assistant',
      text:
        language === 'ha'
          ? `Barka da zuwa! Ni ne mai taimaka muku na 3PLE A AI. Zan iya taimaka muku wajen duba asusun ku (₦${currentUser.walletBalance.toLocaleString()}), siyan katin waya, caji mita na KEDCO, ko duba jiragen sama.`
          : `Hello! I am your 3PLE A Gemini AI Assistant. I can help you navigate services, check transaction status, recharge KEDCO electricity meters, or book flights departing Kano & Abuja.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      actions: [
        { label: 'Check Wallet Balance', actionId: 'fund_wallet' },
        { label: 'Recharge KEDCO Meter', actionId: 'electricity' },
        { label: 'Buy Discounted Data', actionId: 'data' },
      ],
    },
  ]);
  const [inputAiText, setInputAiText] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [txLookupInput, setTxLookupInput] = useState('');

  // Google Chat / Support Chat State
  const [supportMessages, setSupportMessages] = useState<SupportMessage[]>(() =>
    getStoredSupportMessages()
  );
  const [activeSpaceId, setActiveSpaceId] = useState<string>('space_general');
  const [inputChatText, setInputChatText] = useState('');
  const [selectedTxRef, setSelectedTxRef] = useState<string>('');
  const [showTxPicker, setShowTxPicker] = useState(false);
  const [googleUser, setGoogleUser] = useState<FirebaseUser | null>(null);
  const [googleToken, setGoogleToken] = useState<string | null>(null);
  const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false);
  const [googleChatApiNotice, setGoogleChatApiNotice] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll chat window
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, supportMessages, panelTab]);

  // Firebase Google Auth Listener
  useEffect(() => {
    const unsubscribe = initGoogleAuth(
      (user, token) => {
        setGoogleUser(user);
        setGoogleToken(token);
      },
      () => {
        setGoogleUser(null);
        setGoogleToken(null);
      }
    );
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  if (!isOpen) return null;

  // Handle Gemini Assistant Send
  const handleSendAi = async (textToSend?: string) => {
    const query = (textToSend || inputAiText).trim();
    if (!query || isAiLoading) return;

    const userMsg: AiChatMessage = {
      id: `ai_u_${Date.now()}`,
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setAiMessages((prev) => [...prev, userMsg]);
    setInputAiText('');
    setIsAiLoading(true);

    try {
      const historyPayload = aiMessages.slice(-6).map((m) => ({
        role: m.sender === 'user' ? 'user' : 'model',
        text: m.text,
      }));

      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: query,
          history: historyPayload,
          userContext: {
            userName: currentUser.name,
            walletBalance: currentUser.walletBalance,
            role: currentUser.role,
            recentTransactionsCount: recentTransactions.length,
            latestTransaction: recentTransactions[0] || null,
          },
        }),
      });

      const data = await res.json();
      let rawReply: string = data.reply || 'I am ready to assist you with 3PLE A services.';

      // Extract actions like [ACTION:GO_TO:xyz]
      const actions: Array<{ label: string; actionId: string }> = [];
      const actionRegex = /\[ACTION:GO_TO:([a-z_]+)\]/g;
      let match;
      while ((match = actionRegex.exec(rawReply)) !== null) {
        const actId = match[1];
        let label = 'View Section';
        if (actId === 'airtime') label = '📱 Go to Airtime VTU';
        else if (actId === 'data') label = '📶 Buy Data Bundles';
        else if (actId === 'electricity') label = '⚡ Pay Electricity';
        else if (actId === 'cable') label = '📺 Cable TV Recharge';
        else if (actId === 'flights') label = '✈️ Book Domestic Flights';
        else if (actId === 'estate') label = '🏢 Real Estate Listings';
        else if (actId === 'schedules') label = '⏱️ Smart Schedules';
        else if (actId === 'fund_wallet') label = '💳 Fund Wallet';
        else if (actId === 'retailer') label = '💼 Retailer Hub';
        else if (actId === 'support') label = '🎧 Customer Support';

        actions.push({ label, actionId: actId });
      }

      // Clean tags from visible text
      const cleanReply = rawReply.replace(/\[ACTION:GO_TO:[a-z_]+\]/g, '').trim();

      const assistantMsg: AiChatMessage = {
        id: `ai_a_${Date.now()}`,
        sender: 'assistant',
        text: cleanReply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        actions: actions.length > 0 ? actions : undefined,
      };

      setAiMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: AiChatMessage = {
        id: `ai_err_${Date.now()}`,
        sender: 'assistant',
        text: 'Sorry, I encountered a temporary connection issue. You can explore services directly from the left menu or message our live agents.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setAiMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Quick Action execution
  const handleExecuteAction = (actionId: string) => {
    if (actionId === 'fund_wallet') {
      onOpenFundModal();
      return;
    }
    onNavigateTab(actionId);
  };

  // Transaction Status Check
  const handleCheckTxStatus = () => {
    if (!txLookupInput.trim()) return;
    const ref = txLookupInput.trim();
    const matched = recentTransactions.find(
      (t) =>
        t.id.toLowerCase() === ref.toLowerCase() ||
        t.reference.toLowerCase() === ref.toLowerCase() ||
        (t.providerReference && t.providerReference.toLowerCase() === ref.toLowerCase())
    );

    if (matched) {
      handleSendAi(
        `I checked transaction ${matched.reference}. It was for ${matched.productName} (₦${matched.amount.toLocaleString()}) with status: ${matched.status.toUpperCase()}.`
      );
    } else {
      handleSendAi(
        `I want to verify transaction reference ${ref}. Could you please check its status and ledger clearance?`
      );
    }
    setTxLookupInput('');
  };

  // Google Sign-In
  const handleGoogleLogin = async () => {
    setIsGoogleSigningIn(true);
    setGoogleChatApiNotice(null);
    try {
      const res = await googleSignIn();
      if (res) {
        setGoogleUser(res.user);
        setGoogleToken(res.accessToken);

        // Try querying Google Chat spaces
        try {
          await fetchGoogleChatSpaces(res.accessToken);
        } catch (chatApiErr: any) {
          // If Chat App not configured or consumer account, surface friendly note
          if (chatApiErr.message?.includes('Chat app not found') || chatApiErr.message?.includes('404')) {
            setGoogleChatApiNotice(
              'Google Chat API requires a configured Chat App in Google Cloud Console. You can continue sending direct messages to 3PLE A support agents below!'
            );
          }
        }
      }
    } catch (err: any) {
      console.warn('Google Sign-In Notice:', err);
    } finally {
      setIsGoogleSigningIn(false);
    }
  };

  const handleGoogleLogout = async () => {
    await googleSignOut();
    setGoogleUser(null);
    setGoogleToken(null);
  };

  // Send message in Support Chat (Google Chat styled)
  const handleSendSupportMessage = () => {
    if (!inputChatText.trim() && !selectedTxRef) return;

    const newMsg: SupportMessage = {
      id: `msg_u_${Date.now()}`,
      senderId: currentUser.id,
      senderName: currentUser.name,
      isAgent: false,
      text: inputChatText.trim() || 'Attached transaction receipt reference for review.',
      timestamp: new Date().toISOString(),
      spaceId: activeSpaceId,
      status: 'sent',
      transactionRef: selectedTxRef || undefined,
    };

    const nextList = [...supportMessages, newMsg];
    setSupportMessages(nextList);
    saveStoredSupportMessages(nextList);
    const sentText = inputChatText;
    const sentRef = selectedTxRef;
    setInputChatText('');
    setSelectedTxRef('');
    setShowTxPicker(false);

    // If Google token available and space is synced
    if (googleToken && activeSpaceId.startsWith('spaces/')) {
      sendGoogleChatMessage(googleToken, activeSpaceId, sentText).catch((err) => {
        console.warn('Google Chat API forward note:', err.message);
      });
    }

    // Trigger instant support agent reply
    setTimeout(() => {
      const activeSpace = INITIAL_SPACES.find((s) => s.id === activeSpaceId);
      const agent =
        INITIAL_SUPPORT_AGENTS.find((a) => a.id === activeSpace?.agentId) ||
        INITIAL_SUPPORT_AGENTS[0];

      const agentReply = generateSupportAgentResponse(sentText, agent, activeSpaceId, sentRef);
      setSupportMessages((prev) => {
        const updated = [...prev, agentReply];
        saveStoredSupportMessages(updated);
        return updated;
      });
    }, 1200);
  };

  // Add emoji reaction
  const handleAddReaction = (msgId: string, emoji: string) => {
    setSupportMessages((prev) => {
      const updated = prev.map((m) => {
        if (m.id !== msgId) return m;
        const reactions = m.reactions ? [...m.reactions] : [];
        const existing = reactions.find((r) => r.emoji === emoji);
        if (existing) {
          existing.count += 1;
          if (!existing.users.includes('current_user')) existing.users.push('current_user');
        } else {
          reactions.push({ emoji, count: 1, users: ['current_user'] });
        }
        return { ...m, reactions };
      });
      saveStoredSupportMessages(updated);
      return updated;
    });
  };

  const filteredSupportMessages = supportMessages.filter((m) => m.spaceId === activeSpaceId);
  const currentSpace = INITIAL_SPACES.find((s) => s.id === activeSpaceId) || INITIAL_SPACES[0];

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-950/50 backdrop-blur-xs transition-opacity"
      />

      {/* Side Panel Container */}
      <div className="fixed top-0 right-0 bottom-0 z-50 w-full sm:w-[480px] md:w-[520px] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col transition-transform duration-200 ease-out animate-slide-left">
        {/* Top Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-slate-950 shadow-sm font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  3PLE A AI & Support Hub
                </h3>
                <span className="text-[9px] font-mono uppercase bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 font-bold px-1.5 py-0.5 rounded">
                  Live
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Gemini 3.8 Flash · Google Chat Messaging · Kano Support Desk
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200/60 dark:hover:bg-slate-800 transition-colors"
            title="Close Assistant"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Navigation Tabs */}
        <div className="grid grid-cols-2 border-b border-slate-200 dark:border-slate-800 bg-slate-100/60 dark:bg-slate-900 px-3 pt-2">
          <button
            type="button"
            onClick={() => setPanelTab('assistant')}
            className={`py-2 px-3 text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition-all ${
              panelTab === 'assistant'
                ? 'border-amber-500 text-slate-900 dark:text-amber-400 bg-white dark:bg-slate-850 rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>AI Copilot (Gemini)</span>
          </button>

          <button
            type="button"
            onClick={() => setPanelTab('support_chat')}
            className={`py-2 px-3 text-xs font-bold border-b-2 flex items-center justify-center gap-2 transition-all ${
              panelTab === 'support_chat'
                ? 'border-amber-500 text-slate-900 dark:text-amber-400 bg-white dark:bg-slate-850 rounded-t-xl shadow-xs'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            <span>Support Chat (Google Chat)</span>
          </button>
        </div>

        {/* TAB 1: GEMINI AI ASSISTANT */}
        {panelTab === 'assistant' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-950/30">
            {/* Quick Status Bar */}
            <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/30 border-b border-amber-200/60 dark:border-amber-900/40 flex items-center justify-between text-[11px] text-amber-900 dark:text-amber-300">
              <span className="flex items-center gap-1.5 font-medium">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Wallet Balance:</span>
                <span className="font-bold font-mono">₦{currentUser.walletBalance.toLocaleString()}</span>
              </span>
              <button
                type="button"
                onClick={onOpenFundModal}
                className="font-bold underline text-amber-800 dark:text-amber-200 hover:text-amber-950"
              >
                + Fund
              </button>
            </div>

            {/* AI Messages Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {aiMessages.map((m, idx) => (
                <div
                  key={`ai_msg_${m.id}_${idx}`}
                  className={`flex gap-3 ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {m.sender === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 flex items-center justify-center shrink-0 shadow-xs mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`max-w-[82%] space-y-2`}>
                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                        m.sender === 'user'
                          ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 rounded-br-none shadow-xs'
                          : 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 rounded-bl-none shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.text}</p>

                      {/* Interactive Action Buttons */}
                      {m.actions && m.actions.length > 0 && (
                        <div className="pt-2.5 mt-2.5 border-t border-slate-100 dark:border-slate-700/60 flex flex-wrap gap-1.5">
                          {m.actions.map((act, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => handleExecuteAction(act.actionId)}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 transition-colors shadow-2xs flex items-center gap-1 active:scale-95"
                            >
                              <span>{act.label}</span>
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div
                      className={`text-[10px] text-slate-400 px-1 font-mono ${
                        m.sender === 'user' ? 'text-right' : 'text-left'
                      }`}
                    >
                      {m.timestamp}
                    </div>
                  </div>

                  {m.sender === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}

              {isAiLoading && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-xl bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="p-3 bg-white dark:bg-slate-850 border border-slate-200 dark:border-slate-700/80 rounded-2xl rounded-bl-none text-xs flex items-center gap-2 text-slate-500 dark:text-slate-400">
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-500" />
                    <span>Gemini is analyzing your request...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 overflow-x-auto flex gap-1.5 scrollbar-none">
              {[
                'Check my wallet balance',
                'How do I buy KEDCO electricity?',
                'Best MTN and Airtel data bundles',
                'Book domestic flights from Kano',
                'Schedule recurring monthly bills',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendAi(chip)}
                  className="px-2.5 py-1 text-[11px] font-medium whitespace-nowrap bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full transition-colors border border-slate-200 dark:border-slate-700 shrink-0"
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Transaction Reference Quick Lookup */}
            <div className="px-4 py-2 bg-slate-100/50 dark:bg-slate-850/50 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                type="text"
                placeholder="Paste transaction ref (e.g. 3PA-API-AIR-...) to check status"
                value={txLookupInput}
                onChange={(e) => setTxLookupInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCheckTxStatus()}
                className="flex-1 text-xs bg-transparent text-slate-800 dark:text-slate-200 placeholder-slate-400 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleCheckTxStatus}
                disabled={!txLookupInput.trim()}
                className="px-2.5 py-1 text-[10px] font-bold rounded-lg bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 disabled:opacity-40"
              >
                Verify
              </button>
            </div>

            {/* AI Text Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendAi();
              }}
              className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex items-center gap-2"
            >
              <input
                type="text"
                placeholder={
                  language === 'ha'
                    ? 'Tambayi Gemini komai game da 3PLE A...'
                    : 'Ask Gemini anything about bills, flights, or data...'
                }
                value={inputAiText}
                onChange={(e) => setInputAiText(e.target.value)}
                disabled={isAiLoading}
                className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
              />
              <button
                type="submit"
                disabled={!inputAiText.trim() || isAiLoading}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 transition-colors disabled:opacity-40 shadow-xs"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* TAB 2: GOOGLE CHAT SUPPORT INTERFACE */}
        {panelTab === 'support_chat' && (
          <div className="flex-1 flex flex-col min-h-0 bg-slate-50/50 dark:bg-slate-950/30">
            {/* Google Account Authentication Banner */}
            <div className="p-3 bg-slate-100 dark:bg-slate-850 border-b border-slate-200 dark:border-slate-800">
              {googleUser ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img
                      src={
                        googleUser.photoURL ||
                        'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=80&q=80'
                      }
                      alt={googleUser.displayName || 'Google Account'}
                      className="w-7 h-7 rounded-full border border-slate-300 dark:border-slate-600"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                        <span>{googleUser.displayName || googleUser.email}</span>
                        <span className="text-[9px] bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-mono px-1 rounded">
                          Chat Linked
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-400 truncate">{googleUser.email}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleGoogleLogout}
                    className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      Google Workspace Chat Integration
                    </span>
                    <span className="text-[10px] text-slate-400">Optional</span>
                  </div>
                  <GoogleSignInButton
                    onClick={handleGoogleLogin}
                    isLoading={isGoogleSigningIn}
                    text="Sign in with Google (Workspace Chat)"
                    className="w-full"
                  />
                </div>
              )}

              {/* Informational Notice for Google Chat App requirements */}
              {googleChatApiNotice && (
                <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl text-[10px] text-amber-800 dark:text-amber-300 flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-600" />
                  <div className="flex-1">
                    <span>{googleChatApiNotice}</span>
                    <a
                      href={`https://console.cloud.google.com/apis/api/chat.googleapis.com/hangouts-chat?project=gen-lang-client-0527687246`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-bold underline ml-1 inline-flex items-center gap-0.5 text-amber-900 dark:text-amber-200"
                    >
                      Cloud Console <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Spaces & Direct Messages Navigation Bar */}
            <div className="px-3 py-2 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center gap-2 overflow-x-auto scrollbar-none">
              {INITIAL_SPACES.map((space) => {
                const isSelected = activeSpaceId === space.id;
                return (
                  <button
                    key={space.id}
                    type="button"
                    onClick={() => setActiveSpaceId(space.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    {space.type === 'DIRECT_MESSAGE' ? (
                      <UserIcon className="w-3 h-3" />
                    ) : (
                      <MessageSquare className="w-3 h-3" />
                    )}
                    <span>{space.displayName}</span>
                  </button>
                );
              })}
            </div>

            {/* Current Space Description Header */}
            <div className="px-4 py-1.5 bg-slate-100/60 dark:bg-slate-850/60 border-b border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
              <span className="truncate">{currentSpace.description}</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Agents Active
              </span>
            </div>

            {/* Message History Stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {filteredSupportMessages.map((m, idx) => (
                <div
                  key={`supp_msg_${m.id}_${idx}`}
                  className={`flex gap-3 ${m.isAgent ? 'justify-start' : 'justify-end'}`}
                >
                  {m.isAgent && (
                    <img
                      src={m.senderAvatar}
                      alt={m.senderName}
                      className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 border border-slate-300 dark:border-slate-700"
                    />
                  )}

                  <div className="max-w-[82%] space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 px-1">
                      <span className="font-bold text-slate-700 dark:text-slate-300">
                        {m.isAgent ? m.senderName : 'You'}
                      </span>
                      <span>•</span>
                      <span>
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      className={`p-3.5 rounded-2xl text-xs leading-relaxed space-y-2 ${
                        !m.isAgent
                          ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 rounded-tr-none shadow-xs'
                          : 'bg-white dark:bg-slate-850 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/80 rounded-tl-none shadow-xs'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">{m.text}</p>

                      {/* Attached Transaction Receipt Card */}
                      {m.transactionRef && (
                        <div className="p-2 rounded-xl bg-slate-800/80 dark:bg-slate-900 border border-slate-700 text-[11px] text-slate-200 flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <CreditCard className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="font-mono truncate">{m.transactionRef}</span>
                          </div>
                          <span className="text-[9px] font-bold uppercase bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded">
                            Attached Ref
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Reactions Pill & Selector */}
                    <div className="flex items-center gap-1 px-1 pt-0.5">
                      {m.reactions?.map((r, ri) => (
                        <span
                          key={ri}
                          className="px-1.5 py-0.5 rounded-full bg-slate-200 dark:bg-slate-800 text-[10px] text-slate-700 dark:text-slate-300 flex items-center gap-1 border border-slate-300 dark:border-slate-700"
                        >
                          <span>{r.emoji}</span>
                          <span className="font-bold">{r.count}</span>
                        </span>
                      ))}

                      <button
                        type="button"
                        onClick={() => handleAddReaction(m.id, '👍')}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="React thumbs up"
                      >
                        👍
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddReaction(m.id, '❤️')}
                        className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="React love"
                      >
                        ❤️
                      </button>
                    </div>
                  </div>

                  {!m.isAgent && (
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                      <UserIcon className="w-4 h-4" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Selected Attachment Pill */}
            {selectedTxRef && (
              <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/40 border-t border-amber-200 dark:border-amber-800 flex items-center justify-between text-xs text-amber-900 dark:text-amber-300">
                <span className="flex items-center gap-1.5 font-mono text-[11px]">
                  <Paperclip className="w-3.5 h-3.5" />
                  <span>Attached: {selectedTxRef}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedTxRef('')}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Transaction Picker Modal Sheet */}
            {showTxPicker && (
              <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between pb-1 border-b border-slate-100 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>Select Recent Transaction to Attach</span>
                  <button
                    type="button"
                    onClick={() => setShowTxPicker(false)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {recentTransactions.slice(0, 5).map((t, idx) => (
                  <button
                    key={`ai_attach_tx_${t.id}_${idx}`}
                    type="button"
                    onClick={() => {
                      setSelectedTxRef(t.reference);
                      setShowTxPicker(false);
                    }}
                    className="w-full p-2 rounded-xl text-left hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white truncate">
                        {t.productName}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">{t.reference}</div>
                    </div>
                    <span className="font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      ₦{t.amount.toLocaleString()}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Support Chat Input */}
            <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowTxPicker((prev) => !prev)}
                  className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  title="Attach recent transaction reference"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                <input
                  type="text"
                  placeholder={`Message ${currentSpace.displayName}...`}
                  value={inputChatText}
                  onChange={(e) => setInputChatText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendSupportMessage()}
                  className="flex-1 px-3.5 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400 font-medium"
                />

                <button
                  type="button"
                  onClick={handleSendSupportMessage}
                  disabled={!inputChatText.trim() && !selectedTxRef}
                  className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-amber-400 dark:hover:bg-amber-300 text-white dark:text-slate-950 transition-colors disabled:opacity-40 shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};
