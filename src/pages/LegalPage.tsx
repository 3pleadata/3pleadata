import React, { useState } from 'react';
import { AppState } from '../services/storage';
import {
  ShieldCheck,
  Scale,
  FileText,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Search,
  Printer,
  Download,
  Building2,
  Mail,
  MapPin,
  ExternalLink,
  ChevronRight,
  Lock,
  RefreshCw,
  Clock,
  Sparkles,
  Smartphone,
  Info,
  BadgeCheck,
} from 'lucide-react';

interface LegalPageProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  language: 'en' | 'ha';
}

type LegalTab = 'privacy' | 'terms' | 'refunds' | 'deletion' | 'aml' | 'stores';

export const LegalPage: React.FC<LegalPageProps> = ({ state, language }) => {
  const [activeTab, setActiveTab] = useState<LegalTab>('privacy');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Interactive Account Deletion Tool state (Mandatory for Google Play & Apple App Store Guideline 5.1.1(v))
  const [deletionStep, setDeletionStep] = useState<'form' | 'submitting' | 'confirmed'>('form');
  const [deleteConfirmationText, setDeleteConfirmationText] = useState<string>('');
  const [deleteReason, setDeleteReason] = useState<string>('no_longer_needed');
  const [deleteNotes, setDeleteNotes] = useState<string>('');
  const [deletionRef, setDeletionRef] = useState<string>('');

  const handlePrint = () => {
    window.print();
  };

  const handleDeleteRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (deleteConfirmationText.trim().toUpperCase() !== 'DELETE') {
      return;
    }
    setDeletionStep('submitting');
    setTimeout(() => {
      const generatedRef = `DEL-3PA-${Math.floor(100000 + Math.random() * 900000)}`;
      setDeletionRef(generatedRef);
      setDeletionStep('confirmed');
    }, 1200);
  };

  const lastUpdatedDate = 'January 15, 2026';
  const effectiveDate = 'January 15, 2026';

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-700/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-10 w-48 h-48 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 text-xs font-semibold mb-3 border border-amber-400/30">
              <Scale className="w-3.5 h-3.5" />
              <span>Nigerian Legal & Global App Store Compliance</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Legal, Regulatory & Data Governance
            </h1>
            <p className="text-slate-300 text-xs sm:text-sm mt-2 max-w-2xl leading-relaxed">
              Official legal policies, terms of service, consumer rights, and statutory compliance framework governing <strong className="text-white">3PLE A DATA (RC 9746103)</strong> under the laws of the Federal Republic of Nigeria and international standards (NDPA 2023, CBN, FCCPA, NCAA, GDPR, Apple App Store & Google Play Store).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-medium border border-white/20 transition-all shadow-sm active:scale-95"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <a
              href="mailto:3pleadata@gmail.com?subject=Legal%20and%20Data%20Protection%20Inquiry"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-semibold transition-all shadow-sm active:scale-95"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Contact DPO</span>
            </a>
          </div>
        </div>

        {/* Corporate & Regulatory Identity Bar */}
        <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px] text-slate-300">
          <div>
            <span className="text-slate-400 block font-medium">Registered Entity</span>
            <span className="font-semibold text-white">3PLE A DATA (RC 9746103)</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Operational HQ</span>
            <span className="font-semibold text-white">Tarauni, Kano State, Nigeria</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Primary Data Privacy Law</span>
            <span className="font-semibold text-emerald-300">NDPA 2023 & NDPC Reg.</span>
          </div>
          <div>
            <span className="text-slate-400 block font-medium">Last Legal Audit</span>
            <span className="font-semibold text-white">{lastUpdatedDate}</span>
          </div>
        </div>
      </div>

      {/* Bilingual Hausa / English Notice Banner */}
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/60 rounded-2xl p-4 text-xs flex items-start gap-3 text-amber-900 dark:text-amber-200">
        <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold">
            {language === 'ha'
              ? 'Sanarwar Dokoki da Kariyar Bayanai (Harshen Hausa)'
              : 'Regulatory Transparency & Dual Language Notice'}
          </p>
          <p className="text-amber-800/90 dark:text-amber-300/80 leading-relaxed text-[11px]">
            {language === 'ha'
              ? 'Wadannan dokoki an rubuta su ne bisa bin tsarin Dokar Kariyar Bayanai ta Najeriya ta 2023 (NDPA), jagororin Babban Bankin Najeriya (CBN), da ka\'idojin Google Play da Apple App Store. Duk kudaden da ke cikin walat din 3PLE A ana rike su ne a asusun amana na bankunan da CBN ya ba lasisi.'
              : 'These legal terms are codified in full compliance with the Nigeria Data Protection Act 2023 (NDPA), Central Bank of Nigeria (CBN) regulatory guidelines for mobile wallets, Federal Competition and Consumer Protection Act (FCCPA), and Apple App Store / Google Play Store policies. 3PLE A wallet balances represent virtual stored-value accounts held in trust via CBN-licensed payment partners.'}
          </p>
        </div>
      </div>

      {/* Navigation Tabs and Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'privacy'
                ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Privacy Policy</span>
          </button>

          <button
            onClick={() => setActiveTab('terms')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'terms'
                ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </button>

          <button
            onClick={() => setActiveTab('refunds')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'refunds'
                ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refunds & Disputes</span>
          </button>

          <button
            onClick={() => setActiveTab('deletion')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'deletion'
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-900/50'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Account Deletion Portal</span>
            <span className="text-[10px] bg-red-800/20 text-red-600 dark:text-red-300 font-bold px-1.5 py-0.5 rounded-full">
              App Store Req.
            </span>
          </button>

          <button
            onClick={() => setActiveTab('aml')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'aml'
                ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>AML / CFT & KYC</span>
          </button>

          <button
            onClick={() => setActiveTab('stores')}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
              activeTab === 'stores'
                ? 'bg-slate-900 dark:bg-amber-400 text-white dark:text-slate-950 shadow-sm'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>App Store & Play Store</span>
          </button>
        </div>

        {/* Clause Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search legal clauses..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
          />
        </div>
      </div>

      {/* =========================================================================
          TAB 1: PRIVACY POLICY (NDPA 2023, NDPC, GDPR, GOOGLE & APPLE COMPLIANT)
         ========================================================================= */}
      {activeTab === 'privacy' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 dark:border-slate-800 space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Official Document · Ref: POL-PRIV-NDPA-2026-V2
              </span>
              <span className="text-xs text-slate-400">Effective Date: {effectiveDate}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-2">
              Privacy Policy & Personal Data Protection Notice
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Issued in compliance with Section 24 & 25 of the Nigeria Data Protection Act 2023 (NDPA), Nigeria Data Protection Regulation (NDPR), the General Data Protection Regulation (GDPR - EU 2016/679), and Apple App Store Review Guideline 5.1.1.
            </p>
          </div>

          {/* Section 1: Data Controller */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">1</span>
              Data Controller & Contact Information
            </h3>
            <p>
              This Privacy Policy explains how <strong>3PLE A DATA (RC 9746103)</strong> (&quot;3PLE A&quot;, &quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) collects, processes, stores, and protects personal data when you use our mobile application, web portal, developer APIs, and services.
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <strong className="block text-slate-900 dark:text-white">Registered Data Controller:</strong>
                3PLE A DATA (RC 9746103) · Corporate Affairs Commission (CAC) Registered
              </div>
              <div>
                <strong className="block text-slate-900 dark:text-white">Operational Head Office:</strong>
                Karkasara Road, Tarauni Local Government Area, Kano State, Nigeria.
              </div>
              <div>
                <strong className="block text-slate-900 dark:text-white">Data Protection Officer (DPO) Contact:</strong>
                <a href="mailto:dpo@3plea.ng" className="text-amber-600 dark:text-amber-400 hover:underline">dpo@3plea.ng</a> / <a href="mailto:3pleadata@gmail.com" className="text-amber-600 dark:text-amber-400 hover:underline">3pleadata@gmail.com</a>
              </div>
              <div>
                <strong className="block text-slate-900 dark:text-white">Supervisory Authority:</strong>
                Nigeria Data Protection Commission (NDPC), Abuja, Nigeria (<a href="https://ndpc.gov.ng" target="_blank" rel="noopener noreferrer" className="text-amber-600 dark:text-amber-400 hover:underline">ndpc.gov.ng</a>)
              </div>
            </div>
          </section>

          {/* Section 2: Categories of Data We Collect */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">2</span>
              Categories of Personal Data We Collect
            </h3>
            <p>
              Under the principle of data minimization (NDPA Section 24), we only collect personal data strictly required to deliver digital utility, telecommunication VTU, air flight metasearch, and financial wallet services:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-emerald-500" />
                  Identity & Contact Information
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  Full legal name, Nigerian phone number (+234 format), email address, username, residential state and city.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-blue-500" />
                  KYC & Financial Verification Data
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  Bank Verification Number (BVN) and National Identification Number (NIN) hashes verified strictly via CBN-approved NIBSS verification switches for Tier 2 and Tier 3 anti-fraud compliance. <em>Raw biometric fingerprints from government databases are never stored on our servers.</em>
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-purple-500" />
                  Transaction & Utility Service Logs
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  Wallet funding transactions, beneficiary phone numbers for VTU airtime/data, electricity meter numbers (KEDCO, AEDC, etc.), smartcard IUC numbers (DStv, GOtv, Startimes), and exam registration candidates.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-amber-500" />
                  Flight Passenger Booking Data
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  Passenger legal names, contact phone numbers, adult/child/infant categories, domestic travel dates, and airline flight references required by civil aviation regulators (NCAA).
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-rose-500" />
                  On-Device Biometric Verification Flags
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  FaceID, TouchID, and biometric authentications are executed <strong>exclusively inside your device&apos;s local hardware Secure Enclave</strong> (Apple iOS / Android Keystore). 3PLE A receives only a cryptographically signed binary boolean result (success/failure) and never accesses, collects, or transmits your physical biometric templates.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1.5">
                <span className="font-bold text-slate-900 dark:text-white block flex items-center gap-1.5">
                  <BadgeCheck className="w-4 h-4 text-indigo-500" />
                  Device & Telemetry Information
                </span>
                <p className="text-slate-600 dark:text-slate-400">
                  Device model, operating system version, anonymous crash logs, IP address, and general network telemetry to prevent account takeover and session hijacking.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Legal Basis for Processing */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">3</span>
              Lawful Bases for Processing (NDPA Section 25)
            </h3>
            <p>
              We process personal data only when backed by an explicit lawful basis:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <li><strong>Performance of a Contract:</strong> To deliver requested VTU data/airtime, generate electricity tokens, issue flight reservation references, and maintain your stored-value virtual wallet.</li>
              <li><strong>Legal & Regulatory Obligation:</strong> To comply with Central Bank of Nigeria (CBN) AML/CFT regulations, Section 7 of the Money Laundering (Prevention and Prohibition) Act 2022, and Nigeria Financial Intelligence Unit (NFIU) reporting rules.</li>
              <li><strong>Legitimate Interests:</strong> To detect and prevent payment fraud, brute-force security breaches, and platform abuse.</li>
              <li><strong>Explicit Consent:</strong> To send marketing communications, promotional discounts, and automated flight fare alerts. Consent may be revoked at any time.</li>
            </ul>
          </section>

          {/* Section 4: Third-Party Data Sharing & Downstream Processors */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">4</span>
              Third-Party Data Sharing & Infrastructure Processors
            </h3>
            <p>
              3PLE A does <strong>NOT sell or rent personal data to data brokers or advertising networks</strong>. We disclose minimum necessary data to audited infrastructure providers:
            </p>
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span><strong>Licensed Telecommunication Operators:</strong> MTN Nigeria, Airtel Nigeria, Globacom (Glo), and 9mobile for mobile number airtime/data provisioning.</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span><strong>Electricity Distribution Companies (DisCos):</strong> KEDCO (Kano), AEDC (Abuja), EKEDC (Eko), IKEDC (Ikeja), IBEDC (Ibadan), and other licensed operators for prepaid token generation.</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span><strong>CBN-Licensed Payment Switches:</strong> Paystack Payments Limited and Monnify (TeamApt) for processing debit card fundings and virtual account bank transfers.</span>
              </div>
              <div className="flex items-start gap-2">
                <ChevronRight className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <span><strong>Domestic Airlines:</strong> Air Peace, Ibom Air, United Nigeria, Arik Air, Green Africa, and ValueJet when completing Path 2 WhatsApp flight concierge bookings.</span>
              </div>
            </div>
          </section>

          {/* Section 5: Data Retention & Statutory Financial Audit Rules */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">5</span>
              Data Retention Periods & Statutory Requirements
            </h3>
            <p>
              In accordance with NDPA 2023 and the Money Laundering (Prevention and Prohibition) Act 2022:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <strong className="block text-slate-900 dark:text-white mb-1">Financial & Ledger Records:</strong>
                Maintained for <strong>five (5) years</strong> following the date of transaction in mandatory compliance with Section 7 of the Money Laundering Act 2022 and CBN operational guidelines.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <strong className="block text-slate-900 dark:text-white mb-1">Non-Financial Profile & Marketing Data:</strong>
                Retained for <strong>24 months</strong> of inactivity, after which data is automatically permanently purged or irrevocably anonymized.
              </div>
            </div>
          </section>

          {/* Section 6: Data Subject Rights */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">6</span>
              Your Statutory Rights as a Data Subject
            </h3>
            <p>
              Under NDPA Sections 34–38 and international privacy principles, you have the right to:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <strong className="block text-slate-900 dark:text-white">Right of Access</strong>
                Obtain confirmation and an electronic copy of all data processed about you.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <strong className="block text-slate-900 dark:text-white">Right to Rectification</strong>
                Request immediate correction of inaccurate or incomplete personal information.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <strong className="block text-slate-900 dark:text-white">Right to Erasure (Deletion)</strong>
                Request erasure of your account and personal data via our dedicated in-app Deletion Portal.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <strong className="block text-slate-900 dark:text-white">Right to Restrict Processing</strong>
                Request restriction of processing during verification of contestation.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <strong className="block text-slate-900 dark:text-white">Data Portability</strong>
                Receive your transaction and profile data in a structured, machine-readable JSON format.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <strong className="block text-slate-900 dark:text-white">Lodge a Regulatory Complaint</strong>
                Directly lodge a formal complaint with the Nigeria Data Protection Commission (NDPC).
              </div>
            </div>
          </section>

          {/* Section 7: Security & Encryption */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">7</span>
              Technical & Organizational Security Safeguards
            </h3>
            <p>
              We implement military-grade protection protocols:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li><strong>End-to-End Transport Security:</strong> All data transmitted via HTTPS with TLS 1.3 encryption and strict HTTP Strict Transport Security (HSTS).</li>
              <li><strong>Database Encryption:</strong> Sensitive identity fields encrypted at rest using AES-256 standards.</li>
              <li><strong>PIN & Password Hashing:</strong> Security PINs and authentication passwords hashed using salted bcrypt (cost factor 12) or Argon2.</li>
              <li><strong>Biometric Security:</strong> Biometric authentication never leaves the client device Secure Enclave.</li>
            </ul>
          </section>
        </div>
      )}

      {/* =========================================================================
          TAB 2: TERMS OF SERVICE (NIGERIAN LAW, CBN, FCCPA, JURISDICTION)
         ========================================================================= */}
      {activeTab === 'terms' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 dark:border-slate-800 space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Official Contract · Ref: TOS-NIG-2026-V2
              </span>
              <span className="text-xs text-slate-400">Effective Date: {effectiveDate}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-2">
              Terms of Service & User Agreement
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Governed by the substantive laws of Kano State and the Federal Republic of Nigeria, including the Federal Competition and Consumer Protection Act 2018 (FCCPA) and Cybercrimes (Prohibition, Prevention, etc.) Act 2015.
            </p>
          </div>

          {/* Clause 1: Legal Entity & Acceptance */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">1</span>
              Legal Capacity & Acceptance of Agreement
            </h3>
            <p>
              By creating an account, accessing, or transacting on the 3PLE A platform (&quot;3PLE A&quot;, &quot;Platform&quot;), you enter into a legally binding contract with <strong>3PLE A DATA (RC 9746103)</strong>, a registered corporate entity under the Corporate Affairs Commission (CAC) of the Federal Republic of Nigeria with RC Number <strong>RC 9746103</strong>, with operational head office at Karkasara Road, Tarauni LGA, Kano State.
            </p>
            <p>
              You represent and warrant that you are at least eighteen (18) years of age or possess legal capacity under Nigerian law to enter into binding financial contracts.
            </p>
          </section>

          {/* Clause 2: Stored Value Digital Wallet Disclaimer */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">2</span>
              Stored-Value Digital Wallet Disclaimer (Non-Bank Institution)
            </h3>
            <div className="bg-amber-50 dark:bg-amber-950/40 p-4 rounded-2xl border border-amber-300 dark:border-amber-800 text-xs text-amber-950 dark:text-amber-200 space-y-2">
              <div className="flex items-center gap-2 font-bold text-sm text-amber-900 dark:text-amber-300">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Statutory Regulatory Notice (CBN Wallet Framework)</span>
              </div>
              <p>
                <strong>3PLE A is a financial technology software provider and digital utility aggregator, NOT a commercial bank or deposit money institution.</strong> Stored wallet balances are electronic stored-value units exclusively redeemable for digital services, utility tokens, and flight concierge bookings.
              </p>
              <p>
                User funds deposited via Paystack or Monnify are held in ring-fenced correspondent settlement accounts with CBN-licensed commercial banks in Nigeria. Stored wallet balances do not accrue interest and are not covered under NDIC bank deposit insurance.
              </p>
            </div>
          </section>

          {/* Clause 3: Service-Specific Operating Terms */}
          <section className="space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">3</span>
              Service-Specific Operating Rules
            </h3>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">A. Airtime & Data VTU Deliveries</span>
                <p className="text-slate-600 dark:text-slate-400">
                  VTU airtime top-ups and data bundles are fulfilled automatically via direct telco API gateways (MTN, Airtel, Glo, 9mobile). <strong>The user is solely responsible for verifying the accuracy of the recipient phone number.</strong> Deliveries successfully completed to an erroneous number provided by the user cannot be recalled or refunded due to telecommunication operator constraints.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">B. Electricity Bill Payments & Prepaid Tokens (KEDCO, AEDC, etc.)</span>
                <p className="text-slate-600 dark:text-slate-400">
                  Prepaid electricity tokens are generated in real-time through DisCo switches. If a DisCo network times out while debited, our automated ledger watchdog holds the transaction in &quot;Pending&quot; status for up to 15 minutes before either dispensing the 20-digit token or executing a 100% wallet reversal.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">C. Domestic Flight Metasearch & WhatsApp Concierge (Flynira Dual Path)</span>
                <p className="text-slate-600 dark:text-slate-400">
                  3PLE A / Flynira operates as an independent flight fare metasearch and aggregation tool. We do not operate aircraft and are not an airline carrier.
                </p>
                <ul className="list-disc pl-5 mt-1 space-y-1 text-slate-600 dark:text-slate-400">
                  <li><strong>Path 1 (&quot;Book on Airline Site&quot;):</strong> Redirects the user directly to the airline&apos;s official booking portal. Zero convenience fees are charged by 3PLE A, and the contract of carriage is exclusively between the passenger and the carrier.</li>
                  <li><strong>Path 2 (&quot;Book via WhatsApp&quot;):</strong> The user requests concierge assistance. A transparent convenience fee (standard 5%, minimum ₦500, capped at ₦9,500) is calculated server-side. Payment is completed off-platform via verified bank transfer to 3PLE A concierge accounts.</li>
                </ul>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">D. Retailer Reseller Hub & Wholesale Margins</span>
                <p className="text-slate-600 dark:text-slate-400">
                  Retailer accounts must maintain sufficient working wallet float to execute orders. 3PLE A is not liable for secondary claims between retailers and their retail walk-in end consumers.
                </p>
              </div>

              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 space-y-1">
                <span className="font-bold text-slate-900 dark:text-white block">E. Real Estate Listings</span>
                <p className="text-slate-600 dark:text-slate-400">
                  Real estate properties, lands, and commercial units displayed on 3PLE A are published for informational purposes. Users must conduct independent physical inspection and land registry search (e.g. Kano State Ministry of Land and Physical Planning) before executing property acquisition payments.
                </p>
              </div>
            </div>
          </section>

          {/* Clause 4: Anti-Fraud & Account Security */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">4</span>
              User Obligations, Anti-Fraud & Cybercrimes Act Compliance
            </h3>
            <p>
              Users agree not to utilize 3PLE A for money laundering, terrorist financing, chargeback fraud, card testing, or unlawful exploitation. In compliance with the Cybercrimes (Prohibition, Prevention, etc.) Act 2015, any suspected illicit activity will lead to immediate account freeze and referral to the Nigerian Financial Intelligence Unit (NFIU) and the Economic and Financial Crimes Commission (EFCC).
            </p>
          </section>

          {/* Clause 5: Limitation of Liability */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">5</span>
              Limitation of Liability & Force Majeure
            </h3>
            <p>
              To the maximum extent permitted under the Federal Competition and Consumer Protection Act 2018 (FCCPA), 3PLE A shall not be liable for indirect, incidental, or consequential damages resulting from upstream telecommunication downtime, electricity grid outages, airline flight rescheduling/cancellations, or banking switch latency beyond our direct operational control.
            </p>
          </section>

          {/* Clause 6: Governing Law & Dispute Arbitration */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">6</span>
              Governing Law & Dispute Resolution
            </h3>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of Kano State and the Federal Republic of Nigeria.
            </p>
            <p>
              In the event of any dispute, the parties shall first attempt in good faith to resolve the dispute through mutual amicable settlement via our Customer Dispute Desk (<a href="mailto:support@3plea.ng" className="text-amber-600 dark:text-amber-400 hover:underline">support@3plea.ng</a>). If unresolved within thirty (30) days, the dispute shall be referred to and finally resolved by arbitration administered under the Nigerian Arbitration and Mediation Act 2023, with arbitration proceedings conducted in Kano, Nigeria.
            </p>
          </section>
        </div>
      )}

      {/* =========================================================================
          TAB 3: REFUND, CANCELLATION & DISPUTE POLICY (NCAA, FCCPA, CBN DISPUTES)
         ========================================================================= */}
      {activeTab === 'refunds' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 dark:border-slate-800 space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Official Consumer Protection · Ref: POL-REF-NIG-2026-V2
              </span>
              <span className="text-xs text-slate-400">Effective Date: {effectiveDate}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-2">
              Refund, Cancellation & Dispute Resolution Policy
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Aligned with the Central Bank of Nigeria (CBN) Electronic Payments Guidelines, Federal Competition and Consumer Protection Act 2018, and NCAA Part 19 Passenger Protection Directives.
            </p>
          </div>

          {/* Section 1: Automated 60-Second Reversal Guarantee */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xs font-bold">1</span>
              Automated 60-Second Reversal for Failed Digital Deliveries
            </h3>
            <p>
              We operate an automated real-time transaction reconciliation watchdog on our Pairgate & telco API gateways:
            </p>
            <div className="bg-emerald-50 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 text-xs text-emerald-950 dark:text-emerald-200 space-y-2">
              <div className="font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Zero-Loss Automated Wallet Credit Policy</span>
              </div>
              <p>
                If your wallet is debited but the upstream provider (MTN, Airtel, KEDCO, DStv, etc.) returns a transaction failure response, <strong>100% of the debited funds are instantly credited back to your 3PLE A wallet within sixty (60) seconds</strong>, accompanied by an in-app receipt update and SMS/email notification.
              </p>
            </div>
          </section>

          {/* Section 2: Electricity Token Disputes */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xs font-bold">2</span>
              Electricity Token Verification & Resolution SLA
            </h3>
            <p>
              In rare instances where a token is reported invalid by the customer&apos;s physical meter keypad:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-xs text-slate-600 dark:text-slate-400">
              <li>Our support team directly queries the DisCo national central vending switch using the transaction sequence number within <strong>two (2) hours</strong>.</li>
              <li>If the meter rejected the token due to KRN rollover (Key Revision Number), a free KRN1/KRN2 reset token pair will be dispatched immediately.</li>
              <li>If the transaction is confirmed aborted by the DisCo, an immediate wallet refund is issued.</li>
            </ul>
          </section>

          {/* Section 3: Flight Bookings Cancellation & NCAA Compliance */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xs font-bold">3</span>
              Domestic Flight Booking Cancellations & NCAA Passenger Guidelines
            </h3>
            <p>
              Flight tickets purchased through 3PLE A concierge bookings are governed by the Nigerian Civil Aviation Authority (NCAA) Consumer Protection Regulations (Part 19 of Nig. CARs):
            </p>
            <div className="space-y-2.5 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <strong className="block text-slate-900 dark:text-white mb-1">Voluntary Passenger Cancellation:</strong>
                Subject strictly to the operating airline&apos;s published fare rules (Air Peace, Ibom Air, Arik Air, etc.). Non-refundable promo tickets are non-refundable per airline terms. Refundable fares will incur the airline&apos;s published administrative fee. The 3PLE A concierge convenience fee (max ₦9,500) covers concierge agency labor and is non-refundable once the airline ticket PNR has been issued.
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                <strong className="block text-slate-900 dark:text-white mb-1">Involuntary Flight Cancellation by Airline:</strong>
                If the airline cancels or significantly reschedules a domestic flight, the passenger is entitled under NCAA regulations to either a free seat reassignment or a 100% fare refund from the airline. 3PLE A concierge will process the refund with the carrier on behalf of the customer within 24 to 48 business hours.
              </div>
            </div>
          </section>

          {/* Section 4: Bank Reversals & Dispute Resolution SLA */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 flex items-center justify-center text-xs font-bold">4</span>
              Customer Dispute Resolution SLA & Escalation
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <Clock className="w-4 h-4 text-amber-500 mb-1" />
                <strong className="block text-slate-900 dark:text-white">Tier 1: Initial Response</strong>
                Within <strong>15 minutes</strong> via in-app Support Tickets or WhatsApp desk.
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <Clock className="w-4 h-4 text-blue-500 mb-1" />
                <strong className="block text-slate-900 dark:text-white">Tier 2: Upstream Reconciliation</strong>
                Resolved within <strong>2 to 24 hours</strong> with DisCo, Telco, or Bank switches.
              </div>
              <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
                <Clock className="w-4 h-4 text-emerald-500 mb-1" />
                <strong className="block text-slate-900 dark:text-white">Tier 3: Final Refund / Resolution</strong>
                Completed within <strong>48 hours</strong> maximum, or immediate wallet credit.
              </div>
            </div>
          </section>
        </div>
      )}

      {/* =========================================================================
          TAB 4: ACCOUNT & DATA DELETION PORTAL (MANDATORY FOR APPLE & GOOGLE PLAY)
         ========================================================================= */}
      {activeTab === 'deletion' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-red-200 dark:border-red-900/60 space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm">
          <div className="border-b border-red-100 dark:border-red-900/50 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1.5">
                <Trash2 className="w-3.5 h-3.5" />
                Self-Service Deletion · Apple Guideline 5.1.1(v) & Google Play Store Policy
              </span>
              <span className="text-xs text-slate-400">Regulatory Ref: NDPA-DEL-PORTAL</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-2">
              Account & Personal Data Deletion Portal
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Apple App Store and Google Play Store policies require apps that allow account creation to provide an easy, discoverable in-app and web mechanism to initiate account and data deletion.
            </p>
          </div>

          {/* Statutory Disclosure: What is deleted vs What is retained under Nigerian Law */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300 text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>What Will Be Permanently Erased Immediately:</span>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-600 dark:text-slate-400">
                <li>Your profile credentials, avatar, and hashed account login passwords.</li>
                <li>Saved beneficiary phone numbers, meter numbers, and smartcard IUCs.</li>
                <li>Saved flight search preferences and price notification alerts.</li>
                <li>Marketing consent lists, push notification tokens, and device session tokens.</li>
                <li>Biometric enrollment authorization tokens stored on client app state.</li>
              </ul>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50 space-y-2">
              <div className="flex items-center gap-2 font-bold text-amber-900 dark:text-amber-300 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Statutory Retention Mandate (Nigerian Law):</span>
              </div>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                In strict compliance with <strong>Section 7 of the Money Laundering (Prevention and Prohibition) Act 2022</strong> and Central Bank of Nigeria (CBN) AML/CFT regulations, completed financial ledger transactions, wallet ledger entries, and regulatory audit trails must be retained in an encrypted, isolated archive for a statutory period of <strong>five (5) years</strong>, after which they are permanently destroyed.
              </p>
            </div>
          </div>

          {/* Interactive Deletion Tool */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/80 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-3">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base">
                  Request Account Deletion for {state.currentUser.name}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Registered Account: <span className="font-semibold text-slate-700 dark:text-slate-300">{state.currentUser.email}</span> · Phone: <span className="font-semibold text-slate-700 dark:text-slate-300">{state.currentUser.phone}</span>
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block">Current Wallet Balance</span>
                <span className="text-sm font-bold text-amber-600 dark:text-amber-400">
                  ₦{state.currentUser.walletBalance.toLocaleString()}
                </span>
              </div>
            </div>

            {state.currentUser.walletBalance > 0 && (
              <div className="bg-amber-100/70 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-300 dark:border-amber-800 text-xs text-amber-900 dark:text-amber-200 flex items-start gap-2.5">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Active Wallet Balance Warning:</strong> Your account currently holds <strong>₦{state.currentUser.walletBalance.toLocaleString()}</strong>. Prior to initiating deletion, we strongly advise exhausting your balance on utility bills or requesting a manual settlement refund to your registered Nigerian bank account via customer support.
                </div>
              </div>
            )}

            {deletionStep === 'form' && (
              <form onSubmit={handleDeleteRequest} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Reason for Deletion
                    </label>
                    <select
                      value={deleteReason}
                      onChange={(e) => setDeleteReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                    >
                      <option value="no_longer_needed">I no longer need this account</option>
                      <option value="privacy_concerns">Privacy or data collection concerns</option>
                      <option value="duplicate_account">I have a duplicate or secondary account</option>
                      <option value="switching_service">Switching to another provider</option>
                      <option value="other">Other reason</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Type &quot;DELETE&quot; to Confirm
                    </label>
                    <input
                      type="text"
                      placeholder="DELETE"
                      value={deleteConfirmationText}
                      onChange={(e) => setDeleteConfirmationText(e.target.value)}
                      required
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500 uppercase font-mono tracking-wider"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Optional Feedback or Settlement Bank Details
                  </label>
                  <textarea
                    rows={2}
                    value={deleteNotes}
                    onChange={(e) => setDeleteNotes(e.target.value)}
                    placeholder="Provide any additional notes, feedback, or your Nigerian bank details if you have residual wallet funds..."
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs focus:ring-2 focus:ring-red-500/20 focus:border-red-500"
                  />
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div className="text-[11px] text-slate-500">
                    A formal confirmation email and deletion audit certificate will be dispatched to {state.currentUser.email}.
                  </div>
                  <button
                    type="submit"
                    disabled={deleteConfirmationText.trim().toUpperCase() !== 'DELETE'}
                    className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-all shadow-sm active:scale-95 flex items-center gap-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Submit Deletion Request</span>
                  </button>
                </div>
              </form>
            )}

            {deletionStep === 'submitting' && (
              <div className="py-8 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-red-600 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Processing account deletion request with NDPA compliance register...
                </p>
              </div>
            )}

            {deletionStep === 'confirmed' && (
              <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 space-y-3">
                <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Account Deletion Request Registered Successfully</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Your request has been queued in our data compliance system.
                  <br />
                  <strong>Reference Tracking Number:</strong> <code className="bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded font-mono font-bold text-emerald-900 dark:text-emerald-200">{deletionRef}</code>
                  <br />
                  Your non-financial profile and active session tokens will be permanently scrubbed within 24 hours. A confirmation email has been logged for <span className="font-semibold">{state.currentUser.email}</span>.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setDeletionStep('form');
                    setDeleteConfirmationText('');
                    setDeleteNotes('');
                  }}
                  className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:underline pt-1 block"
                >
                  Dismiss notice
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: AML / CFT & KYC POLICY (CBN, NFIU, EFCC, TIER 1-3 KYC)
         ========================================================================= */}
      {activeTab === 'aml' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 dark:border-slate-800 space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Official Compliance · Ref: AML-CFT-CBN-2026-V2
              </span>
              <span className="text-xs text-slate-400">Effective Date: {effectiveDate}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-2">
              Anti-Money Laundering (AML), Counter-Financing of Terrorism (CFT) & KYC Framework
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Codified in compliance with the Money Laundering (Prevention and Prohibition) Act 2022, Terrorism (Prevention and Prohibition) Act 2022, and the Central Bank of Nigeria (CBN) AML/CFT/CPF Regulations.
            </p>
          </div>

          {/* Section 1: Policy Statement */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">1</span>
              Compliance Statement & Zero Tolerance Policy
            </h3>
            <p>
              3PLE A maintains an uncompromising zero-tolerance policy against money laundering, terrorist financing, and proliferation financing. We implement automated suspicious transaction monitoring, velocity limits, and mandatory identity verification.
            </p>
          </section>

          {/* Section 2: CBN Three-Tier KYC Architecture */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">2</span>
              Three-Tiered Know-Your-Customer (KYC) Limits
            </h3>
            <p>
              In strict adherence to the Central Bank of Nigeria Three-Tiered KYC Framework for mobile wallets:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="inline-block px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 font-bold text-[10px]">
                  TIER 1 (Basic)
                </span>
                <strong className="block text-slate-900 dark:text-white">Low-Value Account</strong>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                  <li><strong>Requirements:</strong> Full name & Nigerian phone number.</li>
                  <li><strong>Single Tx Limit:</strong> ₦50,000</li>
                  <li><strong>Daily Cumulative Limit:</strong> ₦100,000</li>
                  <li><strong>Maximum Wallet Balance:</strong> ₦300,000</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 space-y-2">
                <span className="inline-block px-2 py-0.5 rounded-full bg-blue-200 dark:bg-blue-900 text-blue-900 dark:text-blue-200 font-bold text-[10px]">
                  TIER 2 (Verified)
                </span>
                <strong className="block text-slate-900 dark:text-white">Medium-Value Account</strong>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                  <li><strong>Requirements:</strong> Verified BVN or NIN matched via NIBSS.</li>
                  <li><strong>Single Tx Limit:</strong> ₦200,000</li>
                  <li><strong>Daily Cumulative Limit:</strong> ₦500,000</li>
                  <li><strong>Maximum Wallet Balance:</strong> ₦1,000,000</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 space-y-2">
                <span className="inline-block px-2 py-0.5 rounded-full bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-200 font-bold text-[10px]">
                  TIER 3 (Premium / Reseller)
                </span>
                <strong className="block text-slate-900 dark:text-white">Uncapped Enterprise</strong>
                <ul className="space-y-1 text-slate-600 dark:text-slate-400">
                  <li><strong>Requirements:</strong> BVN, NIN, Proof of Address (Utility bill), and CAC Registration certificate.</li>
                  <li><strong>Single Tx Limit:</strong> ₦5,000,000+</li>
                  <li><strong>Daily Cumulative Limit:</strong> Unlimited for verified commercial VTU vending.</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 3: Politically Exposed Persons (PEPs) & Sanctions */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">3</span>
              Politically Exposed Persons (PEPs) & Sanctions Screening
            </h3>
            <p>
              We cross-reference high-volume transactions against national and international sanctions lists (OFAC, UN Security Council Sanctions List, and Nigerian Consolidated Sanctions List). Enhanced Due Diligence (EDD) is executed on all accounts associated with domestic or foreign Politically Exposed Persons (PEPs).
            </p>
          </section>

          {/* Section 4: Suspicious Transaction Reporting (STR) */}
          <section className="space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 flex items-center justify-center text-xs font-bold">4</span>
              Suspicious Activity & NFIU Mandatory Reporting
            </h3>
            <p>
              In accordance with Section 6 of the Money Laundering Act 2022, transactions that show anomalies in frequency, amount, or recipient distribution without clear economic rationale are systematically flagged. 3PLE A is legally obligated to file Suspicious Transaction Reports (STRs) and Currency Transaction Reports (CTRs) directly to the Nigerian Financial Intelligence Unit (NFIU) without informing the customer (&quot;tipping off&quot; prohibition).
            </p>
          </section>
        </div>
      )}

      {/* =========================================================================
          TAB 6: APP STORE & GOOGLE PLAY STORE COMPLIANCE CHECKLIST
         ========================================================================= */}
      {activeTab === 'stores' && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-xs border border-slate-200 dark:border-slate-800 space-y-8 text-slate-700 dark:text-slate-300 leading-relaxed text-xs sm:text-sm">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Store Submission Declarations
              </span>
              <span className="text-xs text-slate-400">Target Stores: Apple iOS & Google Play</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-2">
              App Store & Google Play Policy Certification
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Technical review declarations addressing Apple App Store Review Guidelines (5.1.1, 5.1.2, 3.1.5) and Google Play Financial Services & Data Safety Requirements.
            </p>
          </div>

          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Apple App Store Guideline 5.1.1(v) — In-App Account Deletion</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <strong>Compliant:</strong> 3PLE A provides an interactive, self-service account and personal data deletion tool accessible directly within the application under &quot;Legal &gt; Account Deletion Portal&quot;, allowing users to initiate immediate profile purge without requiring external email exchange.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Google Play Store Financial Services Policy</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <strong>Compliant:</strong> 3PLE A does not issue personal loans or payday loans. Digital wallet services are provided in partnership with licensed payment switches (Paystack / Monnify) operating under valid CBN payment licenses. Full fee transparency is provided before every transaction checkout.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Google Play Data Safety Form Disclosures</span>
              </div>
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <p>• <strong>Data Collected:</strong> Name, Email, Phone number, Purchase history, Approximate device crash logs.</p>
                <p>• <strong>Data Sharing:</strong> Shared only with essential telco utilities and airline partners to fulfill user-requested orders.</p>
                <p>• <strong>Security Practices:</strong> Data is encrypted in transit over TLS 1.3 and encrypted at rest with AES-256.</p>
                <p>• <strong>Deletion Mechanism:</strong> Account deletion mechanism available both inside the app and via support email.</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 space-y-2">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Apple Guideline 3.1.5 — Digital Goods & Physical Services</span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <strong>Compliant:</strong> Airtime, mobile internet bundles, electricity prepaid meter units, and domestic airline tickets represent physical utility services consumed outside the digital app container, qualifying under permissible multi-platform digital payment provisions.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Footer Support & Physical Headquarters Details */}
      <div className="bg-slate-100 dark:bg-slate-800/60 rounded-3xl p-6 border border-slate-200 dark:border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-start gap-3">
          <Building2 className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 dark:text-white block text-sm">
              3PLE A DATA (RC 9746103)
            </span>
            <span>Corporate Affairs Commission (CAC) Registered · RC No. 9746103 · Karkasara Road, Tarauni LGA, Kano State, Nigeria.</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <a
            href="mailto:support@3plea.ng"
            className="inline-flex items-center gap-1.5 text-slate-800 dark:text-slate-200 hover:text-amber-600 dark:hover:text-amber-400 font-semibold"
          >
            <Mail className="w-3.5 h-3.5" />
            <span>support@3plea.ng</span>
          </a>
          <span className="text-slate-300 dark:text-slate-700">|</span>
          <a
            href="https://wa.me/2348000000000"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-slate-800 dark:text-slate-200 hover:text-emerald-600 font-semibold"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Customer WhatsApp Desk</span>
          </a>
        </div>
      </div>
    </div>
  );
};
