import React, { useState } from 'react';
import { AppState } from '../services/storage';
import { SupportTicket } from '../types';
import {
  Headphones,
  Mail,
  Phone,
  MapPin,
  MessageSquare,
  HelpCircle,
  Plus,
  Send,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react';

interface SupportPageProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  language: 'en' | 'ha';
}

export const SupportPage: React.FC<SupportPageProps> = ({ state, updateState, language }) => {
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(state.tickets[0] || null);
  const [replyText, setReplyText] = useState<string>('');
  const [showNewTicketModal, setShowNewTicketModal] = useState<boolean>(false);

  // New ticket state
  const [newSubject, setNewSubject] = useState<string>('');
  const [newCategory, setNewCategory] = useState<'wallet' | 'vtu' | 'flight' | 'estate'>('vtu');
  const [newMessage, setNewMessage] = useState<string>('');

  const faqs = [
    {
      q: 'How fast are KEDCO Kano prepaid tokens generated?',
      a: 'Prepaid electricity tokens for KEDCO and all Nigerian DISCOs are generated automatically within 1 to 2 seconds via our Pairgate high-throughput API gateway.',
    },
    {
      q: 'Where is the 3PLE A headquarters located?',
      a: 'Our operational headquarters and customer support hub is located at Karkasara Road, Tarauni Local Government Area, Kano State, Nigeria.',
    },
    {
      q: 'How do retailer wholesale discounts work?',
      a: 'Retailers and agents enjoy wholesale pricing (e.g., MTN 1GB SME at ₦255). You can sell to your walk-in customers or API consumers at the standard rate (₦280) and keep the ₦25 profit margin directly.',
    },
    {
      q: 'What is the flight cancellation and refund procedure?',
      a: 'Flight bookings are issued in accordance with Nigerian Civil Aviation Authority (NCAA) guidelines and airline fare rules. Refund requests submitted through the portal are reconciled with MySubWallet within 24-48 hours.',
    },
  ];

  const handleCreateTicket = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject || !newMessage) return;

    const newTkt: SupportTicket = {
      id: `tkt_${Date.now()}`,
      ticketNumber: `TKT-3PA-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: state.currentUser.id,
      userName: state.currentUser.name,
      userEmail: state.currentUser.email,
      subject: newSubject,
      category: newCategory,
      priority: 'medium',
      status: 'open',
      createdAt: new Date().toISOString(),
      messages: [
        {
          sender: 'user',
          text: newMessage,
          timestamp: new Date().toISOString(),
        },
      ],
    };

    updateState({
      tickets: [newTkt, ...state.tickets],
    });

    setSelectedTicket(newTkt);
    setShowNewTicketModal(false);
    setNewSubject('');
    setNewMessage('');
  };

  const handleSendReply = () => {
    if (!selectedTicket || !replyText.trim()) return;

    const userMessage = {
      sender: 'user' as const,
      text: replyText.trim(),
      timestamp: new Date().toISOString(),
    };

    const updated = state.tickets.map((t) => {
      if (t.id === selectedTicket.id) {
        return {
          ...t,
          messages: [...t.messages, userMessage],
        };
      }
      return t;
    });

    updateState({ tickets: updated });
    setSelectedTicket({
      ...selectedTicket,
      messages: [...selectedTicket.messages, userMessage],
    });
    setReplyText('');

    // Simulate fast friendly response from Tarauni support officer
    setTimeout(() => {
      const supportReply = {
        sender: 'support' as const,
        text: 'Thank you for reaching out! A representative from our Karkasara Tarauni support desk has acknowledged your message and is processing it.',
        timestamp: new Date().toISOString(),
      };
      const stateWithReply = state.tickets.map((t) => {
        if (t.id === selectedTicket.id) {
          return {
            ...t,
            messages: [...t.messages, supportReply],
          };
        }
        return t;
      });
      updateState({ tickets: stateWithReply });
    }, 1000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {language === 'ha' ? 'Tallafin Abokan Ciniki & Tambayoyi' : 'Customer Support & Help Center'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            24/7 dedicated assistance for transactions, wallet funding, VTU delivery, and estate inquiries.
          </p>
        </div>

        <button
          onClick={() => setShowNewTicketModal(true)}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white font-semibold text-xs rounded-xl transition-all shadow-xs flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Open Support Ticket</span>
        </button>
      </div>

      {/* Contact Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
          <div className="p-2 bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 rounded-xl">
            <MapPin className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-900 dark:text-white block">Kano Headquarters</span>
            <span className="text-slate-500 dark:text-slate-400 text-[11px] leading-tight block mt-0.5">
              Karkasara Road, Tarauni Local Government Area, Kano State, Nigeria.
            </span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Phone className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-900 dark:text-white block">Phone & WhatsApp Hotline</span>
            <span className="text-slate-700 dark:text-slate-200 font-mono text-[11px] block mt-0.5 select-all">
              +234 803 000 3PLE (+234 803 000 3753)
            </span>
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">8:00 AM – 10:00 PM WAT</span>
          </div>
        </div>

        <div className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs flex items-start gap-3">
          <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
            <Mail className="w-5 h-5" />
          </div>
          <div className="text-xs">
            <span className="font-bold text-slate-900 dark:text-white block">Official Email</span>
            <span className="text-slate-700 dark:text-slate-200 font-mono text-[11px] block mt-0.5 select-all">
              support@3plea.ng
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500">Response within 15 mins</span>
          </div>
        </div>
      </div>

      {/* Tickets & Conversation View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ticket List */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block px-2 mb-2">
            Your Support Tickets ({state.tickets.length})
          </span>

          {state.tickets.map((tkt) => {
            const isSelected = selectedTicket?.id === tkt.id;
            return (
              <button
                key={tkt.id}
                type="button"
                onClick={() => setSelectedTicket(tkt)}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-slate-900 dark:border-amber-400 bg-slate-900 dark:bg-amber-500/10 text-white ring-1 ring-slate-900 dark:ring-amber-400 shadow-xs'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-mono text-[10px] uppercase font-bold text-amber-400">
                    {tkt.ticketNumber}
                  </span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                      tkt.status === 'resolved'
                        ? 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300'
                        : 'bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300'
                    }`}
                  >
                    {tkt.status}
                  </span>
                </div>
                <div className="text-xs font-bold truncate">{tkt.subject}</div>
                <div
                  className={`text-[10px] mt-1 ${
                    isSelected ? 'text-slate-300' : 'text-slate-400'
                  }`}
                >
                  {new Date(tkt.createdAt).toLocaleDateString()}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Conversation Thread */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between min-h-[380px]">
          {selectedTicket ? (
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-mono text-slate-400 dark:text-slate-500">{selectedTicket.ticketNumber}</span>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">{selectedTicket.subject}</h3>
                </div>
                <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded font-semibold uppercase">
                  Category: {selectedTicket.category}
                </span>
              </div>

              {/* Message List */}
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {selectedTicket.messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-2xl text-xs max-w-[85%] ${
                      msg.sender === 'user'
                        ? 'ml-auto bg-slate-900 dark:bg-amber-500 text-white dark:text-slate-950 font-medium'
                        : 'mr-auto bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1">
                      <span className="font-bold text-[10px] uppercase">
                        {msg.sender === 'user' ? 'You' : '3PLE A Support'}
                      </span>
                      <span className="text-[9px] opacity-70">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="leading-relaxed">{msg.text}</p>
                  </div>
                ))}
              </div>

              {/* Reply Box */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                <input
                  type="text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                  placeholder="Type your response to support..."
                  className="flex-1 px-4 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-900 dark:focus:ring-amber-400 placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
                <button
                  type="button"
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white text-xs font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 dark:text-slate-500 text-xs">
              Select a ticket on the left or create a new inquiry.
            </div>
          )}
        </div>
      </div>

      {/* Frequently Asked Questions */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-500" />
          <span>Frequently Asked Questions</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {faqs.map((f, i) => (
            <div key={i} className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-800 text-xs">
              <h4 className="font-bold text-slate-900 dark:text-white mb-1">{f.q}</h4>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed">{f.a}</p>
            </div>
          ))}
        </div>
      </div>

      {/* New Ticket Modal */}
      {showNewTicketModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Open New Support Ticket</h3>
              <button
                onClick={() => setShowNewTicketModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  required
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Issue with airtime delivery to 0803..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="vtu" className="dark:bg-slate-900">Airtime & Data VTU</option>
                  <option value="wallet" className="dark:bg-slate-900">Wallet Funding / Transfer</option>
                  <option value="flight" className="dark:bg-slate-900">Flight Booking</option>
                  <option value="estate" className="dark:bg-slate-900">Real Estate & Viewing</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Message Details
                </label>
                <textarea
                  rows={4}
                  required
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Describe your issue with transaction reference if applicable..."
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white font-semibold text-xs rounded-xl shadow-xs transition-all"
              >
                Submit Ticket
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
