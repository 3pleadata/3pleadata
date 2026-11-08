import React, { useState, useMemo } from 'react';
import { AppState } from '../services/storage';
import { User, Transaction, ReferralRecord, ReferralTier } from '../types';
import {
  Gift,
  Copy,
  Check,
  Share2,
  QrCode,
  Users,
  Wallet,
  ArrowRight,
  Sparkles,
  Award,
  ChevronRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  DollarSign,
  TrendingUp,
  UserCheck,
  Send,
  Zap,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { Language } from '../services/i18n';

interface ReferralProgramPageProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  language: Language;
  onOpenFundModal?: () => void;
}

const REFERRAL_TIERS: ReferralTier[] = [
  {
    level: 1,
    name: 'Bronze Ambassador',
    minReferrals: 0,
    rewardPerSignup: 500,
    commissionBonusRate: 1.0,
    badgeColor: 'text-amber-700 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800',
  },
  {
    level: 2,
    name: 'Silver Partner',
    minReferrals: 5,
    rewardPerSignup: 750,
    commissionBonusRate: 1.5,
    badgeColor: 'text-slate-700 bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-slate-700',
  },
  {
    level: 3,
    name: 'Gold VIP Agent',
    minReferrals: 15,
    rewardPerSignup: 1200,
    commissionBonusRate: 2.5,
    badgeColor: 'text-amber-500 bg-amber-400/10 border-amber-400/30',
  },
];

export const ReferralProgramPage: React.FC<ReferralProgramPageProps> = ({
  state,
  updateState,
  language,
}) => {
  const currentUser = state.currentUser;
  const referrals = state.referrals || [];

  // Generate deterministic referral code from user name/id
  const referralCode = useMemo(() => {
    const rawName = currentUser.name.split(' ')[0].replace(/[^a-zA-Z]/g, '').toUpperCase() || 'USER';
    const suffix = currentUser.id.slice(-4).toUpperCase();
    return `3PLEA-${rawName}${suffix}`;
  }, [currentUser]);

  const referralUrl = useMemo(() => {
    return `https://app.threeplea.com.ng/register?ref=${referralCode}`;
  }, [referralCode]);

  // UI state
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedCode, setCopiedCode] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [filterTab, setFilterTab] = useState<'all' | 'completed' | 'pending' | 'unclaimed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [claimSuccessMessage, setClaimSuccessMessage] = useState<string | null>(null);

  // Referral metrics calculation
  const totalReferralsCount = referrals.length;
  const completedReferrals = referrals.filter((r) => r.status === 'completed');
  const pendingReferrals = referrals.filter((r) => r.status === 'pending_first_transaction');
  
  const totalEarned = completedReferrals.reduce((sum, r) => sum + r.rewardAmount, 0);
  const claimableRewards = completedReferrals
    .filter((r) => !r.rewardClaimed)
    .reduce((sum, r) => sum + r.rewardAmount, 0);

  // Current tier calculation
  const currentTier = useMemo(() => {
    const count = completedReferrals.length;
    if (count >= 15) return REFERRAL_TIERS[2];
    if (count >= 5) return REFERRAL_TIERS[1];
    return REFERRAL_TIERS[0];
  }, [completedReferrals.length]);

  const nextTier = useMemo(() => {
    if (currentTier.level === 1) return REFERRAL_TIERS[1];
    if (currentTier.level === 2) return REFERRAL_TIERS[2];
    return null;
  }, [currentTier]);

  const referralsToNextTier = nextTier ? Math.max(0, nextTier.minReferrals - completedReferrals.length) : 0;
  const tierProgressPercent = nextTier
    ? Math.min(100, Math.round((completedReferrals.length / nextTier.minReferrals) * 100))
    : 100;

  // Copy helpers
  const handleCopyLink = () => {
    navigator.clipboard.writeText(referralUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2200);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(referralCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2200);
  };

  // Share helpers
  const handleNativeShare = async () => {
    const shareData = {
      title: 'Join 3PLE A DATA Fintech',
      text: language === 'ha'
        ? `Yi amfani da lambar gayyata ta ${referralCode} domin samun rangwame a katin waya, data, da kudin wutar KEDCO a 3PLE A DATA!`
        : `Sign up on 3PLE A with my referral code ${referralCode} to get instant discounts on data, VTU airtime, and electricity bills!`,
      url: referralUrl,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (e) {
        // user dismissed
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const msg = language === 'ha'
      ? `Sannu! Yi amfani da link dina don bude asusun 3PLE A DATA: ${referralUrl} (Lambar Gayyata: ${referralCode}). Zaka samu saukin katin waya, data da kudin wuta!`
      : `Hello! Sign up on 3PLE A DATA using my invite link: ${referralUrl} (Referral Code: ${referralCode}). Enjoy instant discounts on data bundles, airtime, and utility tokens!`;
    const url = `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // Claim Rewards to Primary Wallet
  const handleClaimRewards = () => {
    if (claimableRewards <= 0) return;

    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 },
      });
    } catch (e) {}

    const claimAmount = claimableRewards;
    const nowIso = new Date().toISOString();
    const reference = `3PA-REF-CLAIM-${Date.now().toString().slice(-6)}`;

    // Create double-entry ledger entry
    const claimLedgerEntry = {
      id: `ldg_${Date.now()}_ref_claim`,
      transactionRef: reference,
      timestamp: nowIso,
      debitAccount: 'EXPENSE:REFERRAL_REWARD_BONUS',
      creditAccount: 'LIABILITY:CUSTOMER_WALLET',
      amount: claimAmount,
      currency: 'NGN',
      narration: `Referral reward bonus payout for ${currentUser.name} (${reference})`,
    };

    // Create wallet funding / bonus claim transaction
    const claimTx: Transaction = {
      id: `tx_claim_${Date.now()}`,
      reference,
      idempotencyKey: `idem_claim_${Date.now()}`,
      userId: currentUser.id,
      userName: currentUser.name,
      userPhone: currentUser.phone,
      type: 'commission_payout',
      amount: claimAmount,
      fee: 0,
      discount: 0,
      totalDebited: claimAmount,
      status: 'successful',
      provider: '3PLE A Referral Engine',
      productName: `Referral Reward Bonus (${completedReferrals.filter((r) => !r.rewardClaimed).length} referrals)`,
      recipient: currentUser.phone,
      metadata: {
        claimedAmount: claimAmount,
        claimedReferralCount: completedReferrals.filter((r) => !r.rewardClaimed).length,
      },
      createdAt: nowIso,
      completedAt: nowIso,
    };

    // Update referrals marked as claimed
    const updatedReferrals = referrals.map((r) => {
      if (r.status === 'completed' && !r.rewardClaimed) {
        return {
          ...r,
          rewardClaimed: true,
          claimedAt: nowIso,
        };
      }
      return r;
    });

    const updatedUser: User = {
      ...currentUser,
      walletBalance: currentUser.walletBalance + claimAmount,
      commissionBalance: (currentUser.commissionBalance || 0) + claimAmount,
    };

    updateState({
      currentUser: updatedUser,
      users: state.users.map((u) => (u.id === updatedUser.id ? updatedUser : u)),
      referrals: updatedReferrals,
      transactions: [claimTx, ...state.transactions],
      ledger: [claimLedgerEntry, ...state.ledger],
    });

    setClaimSuccessMessage(`Successfully transferred ₦${claimAmount.toLocaleString()} to your main wallet!`);
    setTimeout(() => setClaimSuccessMessage(null), 5000);
  };

  // Simulate friend referral (interactive demo tool)
  const handleSimulateNewReferral = () => {
    const firstNames = ['Kabiru', 'Bilkisu', 'Suleiman', 'Hauwa', 'Usman', 'Zainab', 'Bashir'];
    const lastNames = ['Danjuma', 'Garba', 'Shehu', 'Yakubu', 'Mustapha', 'Abubakar'];
    const randomFirst = firstNames[Math.floor(Math.random() * firstNames.length)];
    const randomLast = lastNames[Math.floor(Math.random() * lastNames.length)];
    const fullName = `${randomFirst} ${randomLast}`;
    const randNum = Math.floor(1000 + Math.random() * 9000);
    const maskedPhone = `+234 803 ••• ${randNum}`;
    const maskedEmail = `${randomFirst.toLowerCase().slice(0, 3)}***@gmail.com`;

    const newReferral: ReferralRecord = {
      id: `ref_rec_${Date.now()}`,
      referrerId: currentUser.id,
      referredUserId: `usr_sim_${Date.now()}`,
      referredName: fullName,
      referredPhoneMasked: maskedPhone,
      referredEmailMasked: maskedEmail,
      signupDate: new Date().toISOString(),
      status: 'completed',
      rewardAmount: currentTier.rewardPerSignup,
      rewardClaimed: false,
      firstTransactionSummary: 'MTN 5GB Data Plan (₦1,500)',
    };

    try {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.7 },
      });
    } catch (e) {}

    updateState({
      referrals: [newReferral, ...referrals],
    });

    setClaimSuccessMessage(`New referral confirmed! ${fullName} signed up. Earned +₦${newReferral.rewardAmount.toLocaleString()}`);
    setTimeout(() => setClaimSuccessMessage(null), 4000);
  };

  // Filtered referrals list
  const filteredReferrals = useMemo(() => {
    return referrals.filter((r) => {
      // Tab filter
      if (filterTab === 'completed' && r.status !== 'completed') return false;
      if (filterTab === 'pending' && r.status !== 'pending_first_transaction') return false;
      if (filterTab === 'unclaimed' && (r.status !== 'completed' || r.rewardClaimed)) return false;

      // Text search
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const matchesName = r.referredName.toLowerCase().includes(query);
        const matchesPhone = r.referredPhoneMasked.includes(query);
        const matchesSummary = (r.firstTransactionSummary || '').toLowerCase().includes(query);
        if (!matchesName && !matchesPhone && !matchesSummary) return false;
      }

      return true;
    });
  }, [referrals, filterTab, searchQuery]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-amber-950 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2 text-xs uppercase tracking-wider text-amber-400 font-bold">
              <Gift className="w-4 h-4" />
              <span>{language === 'ha' ? 'Shirin Ba da Lada da Gayyata' : '3PLE A Referral & Ambassador Program'}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {language === 'ha'
                ? 'Gayyato Abokai, Samun Lada Nan Take'
                : 'Invite Friends, Earn Cash on Every Sign-up'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {language === 'ha'
                ? 'Raba lambar gayyatarka ta musamman. Samun har zuwa ₦1,200 a kowane aboki da ya kammala rajista da biyan kudin wuta ko data na farko.'
                : 'Share your personal referral link. Earn up to ₦1,200 instant cash for every friend who signs up and makes their first bill or VTU payment.'}
            </p>
          </div>

          {/* Quick Stats Pillar */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            <div className="px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
              <span className="block text-[11px] text-slate-400">
                {language === 'ha' ? 'Jimillar Abokan da Aka Gayyata' : 'Total Invited'}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-white font-mono">
                {totalReferralsCount}
              </span>
            </div>

            <div className="px-5 py-3.5 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 backdrop-blur-md">
              <span className="block text-[11px] text-emerald-300">
                {language === 'ha' ? 'Jimillar Ladar da Aka Samu' : 'Total Rewards Earned'}
              </span>
              <span className="text-xl sm:text-2xl font-extrabold text-emerald-400 font-mono">
                ₦{totalEarned.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Claim Success Notification Toast */}
      {claimSuccessMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold">{claimSuccessMessage}</span>
          </div>
          <button
            onClick={() => setClaimSuccessMessage(null)}
            className="text-xs font-bold underline hover:opacity-80"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Referral Link & Share Control Box */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>{language === 'ha' ? 'Lambar Gayyata da Hanyar Sadarwa' : 'Your Unique Referral Link & Code'}</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {language === 'ha'
                ? 'Kwafi wannan link ko lambar ka aika wa abokanka ta WhatsApp, SMS, ko soshiyal midiya.'
                : 'Copy and send this link to friends. When they register, your referral reward attaches automatically.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
              title="Show QR code for in-person scanning"
            >
              <QrCode className="w-4 h-4 text-amber-500" />
              <span>Show QR Code</span>
            </button>
            <button
              onClick={handleNativeShare}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
            >
              <Share2 className="w-4 h-4" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* Link and Code Inputs */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 pt-5">
          {/* Referral Code Tile */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
            <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
              {language === 'ha' ? 'Lambar Gayyata' : 'Personal Referral Code'}
            </span>
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-base font-black text-amber-600 dark:text-amber-400 tracking-wider">
                {referralCode}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
                title="Copy referral code"
              >
                {copiedCode ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Direct Referral URL Box */}
          <div className="lg:col-span-2 p-4 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                {language === 'ha' ? 'Hanyar Sadarwa ta Rajista' : 'Shareable Registration URL'}
              </span>
              <p className="font-mono text-xs text-slate-700 dark:text-slate-300 truncate select-all">
                {referralUrl}
              </p>
            </div>
            <div className="flex items-center gap-2 self-end sm:self-center">
              <button
                onClick={handleWhatsAppShare}
                className="px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
              <button
                onClick={handleCopyLink}
                className="px-3 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 text-xs font-semibold flex items-center gap-1.5 shadow-2xs transition-all"
              >
                {copiedLink ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Reward Balance & Claim Action Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Claimable Balance Card */}
        <div className="md:col-span-2 bg-gradient-to-br from-emerald-950/90 via-slate-900 to-slate-950 border border-emerald-500/30 rounded-2xl p-6 text-white shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1.5">
                <Wallet className="w-4 h-4" />
                <span>{language === 'ha' ? 'Ladar da Za a Iya Karba' : 'Claimable Referral Rewards'}</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {completedReferrals.filter((r) => !r.rewardClaimed).length} Unclaimed
              </span>
            </div>
            <div className="mt-3">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono text-emerald-300">
                ₦{claimableRewards.toLocaleString()}
              </span>
              <p className="text-xs text-slate-300 mt-1">
                {claimableRewards > 0
                  ? language === 'ha'
                    ? 'Ana iya tura wannan kudi zuwa babban asusunka na NGN domin biyan wuta, katin waya, ko cirewa.'
                    : 'Ready for 1-click instant transfer directly into your primary NGN balance.'
                  : language === 'ha'
                  ? 'Babu sabuwar lada a halin yanzu. Gayyato karin abokai don samun lada.'
                  : 'All verified rewards have been claimed. Invite more friends to earn more.'}
              </p>
            </div>
          </div>

          <div className="pt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={handleClaimRewards}
              disabled={claimableRewards <= 0}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 ${
                claimableRewards > 0
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer active:scale-95'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed opacity-60'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>
                {language === 'ha'
                  ? `Kwashe ₦${claimableRewards.toLocaleString()} Zuwa Asusunka`
                  : `Claim ₦${claimableRewards.toLocaleString()} to Primary Wallet`}
              </span>
            </button>

            {/* Test Simulator Button */}
            <button
              onClick={handleSimulateNewReferral}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Test the referral engine with a simulated friend sign-up"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Simulate Friend Sign-up</span>
            </button>
          </div>
        </div>

        {/* Current Tier & Milestone Status */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                <Award className="w-4 h-4 text-amber-500" />
                <span>{language === 'ha' ? 'Matsayin Jakadanci' : 'Ambassador Tier'}</span>
              </span>
              <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${currentTier.badgeColor}`}>
                {currentTier.name}
              </span>
            </div>

            <div className="space-y-2 mt-2">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">Current Payout Rate:</span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                  ₦{currentTier.rewardPerSignup.toLocaleString()} <span className="text-xs font-normal text-slate-500">/ friend</span>
                </span>
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-slate-600 dark:text-slate-400">Cashback Multiplier:</span>
                <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                  +{currentTier.commissionBonusRate}% on friend recharges
                </span>
              </div>
            </div>

            {nextTier ? (
              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                  <span>Progress to {nextTier.name}:</span>
                  <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                    {completedReferrals.length} / {nextTier.minReferrals}
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-amber-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${tierProgressPercent}%` }}
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2">
                  {referralsToNextTier} more completed referral{referralsToNextTier === 1 ? '' : 's'} needed to unlock ₦{nextTier.rewardPerSignup.toLocaleString()} per signup.
                </p>
              </div>
            ) : (
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>You have achieved the highest Gold VIP Tier!</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Referrals Activity Ledger Section */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {/* Section Header with Tabs */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'ha' ? 'Rikodin Abokan da Suka Yi Rajista' : 'Referral Sign-ups & Reward History'}
              </h3>
              <span className="text-xs font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 rounded-full">
                {filteredReferrals.length} records
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live status of invited friends and confirmation of their initial qualifying transactions
            </p>
          </div>

          {/* Filter Tabs */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterTab === 'all'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              All ({referrals.length})
            </button>
            <button
              onClick={() => setFilterTab('completed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterTab === 'completed'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Completed ({completedReferrals.length})
            </button>
            <button
              onClick={() => setFilterTab('pending')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterTab === 'pending'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Pending ({pendingReferrals.length})
            </button>
            <button
              onClick={() => setFilterTab('unclaimed')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                filterTab === 'unclaimed'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Unclaimed ({completedReferrals.filter((r) => !r.rewardClaimed).length})
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="p-4 bg-slate-50/60 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by referred friend's name, phone, or payment..."
            className="w-full sm:max-w-md px-3.5 py-2 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 bg-slate-50/50 dark:bg-slate-950/20">
                <th className="py-3 px-4 font-semibold">Friend Details</th>
                <th className="py-3 px-4 font-semibold">Sign-up Date</th>
                <th className="py-3 px-4 font-semibold">Qualifying Transaction</th>
                <th className="py-3 px-4 font-semibold text-right">Reward Earned</th>
                <th className="py-3 px-4 font-semibold text-center">Status</th>
                <th className="py-3 px-4 font-semibold text-right">Payout Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReferrals.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Users className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-700 mb-2" />
                    <p className="font-semibold text-slate-700 dark:text-slate-300">No referral sign-ups found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Share your link or click &quot;Simulate Friend Sign-up&quot; above to test.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredReferrals.map((ref) => {
                  const isCompleted = ref.status === 'completed';
                  return (
                    <tr
                      key={ref.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      {/* Name & Phone */}
                      <td className="py-3.5 px-4 font-semibold text-slate-900 dark:text-slate-100">
                        <div>
                          <span>{ref.referredName}</span>
                          <span className="block text-[11px] font-mono font-normal text-slate-400 mt-0.5">
                            {ref.referredPhoneMasked} · {ref.referredEmailMasked}
                          </span>
                        </div>
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-4 text-slate-600 dark:text-slate-400 font-mono whitespace-nowrap">
                        {new Date(ref.signupDate).toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </td>

                      {/* First Transaction */}
                      <td className="py-3.5 px-4 text-slate-700 dark:text-slate-300">
                        {ref.firstTransactionSummary || (
                          <span className="text-slate-400 italic">No activity yet</span>
                        )}
                      </td>

                      {/* Reward Amount */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 dark:text-white">
                        ₦{ref.rewardAmount.toLocaleString()}
                      </td>

                      {/* Verification Status */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                            isCompleted
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                              : 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>Completed</span>
                            </>
                          ) : (
                            <>
                              <Clock className="w-3 h-3 text-amber-600" />
                              <span>Pending 1st Bill</span>
                            </>
                          )}
                        </span>
                      </td>

                      {/* Payout Status */}
                      <td className="py-3.5 px-4 text-right">
                        {isCompleted ? (
                          ref.rewardClaimed ? (
                            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500">
                              Credited to Wallet
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              Ready to Claim
                            </span>
                          )
                        ) : (
                          <span className="text-[11px] text-slate-400">
                            Awaiting verification
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* How it Works / Terms FAQ Accordion */}
      <div className="bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200 dark:border-slate-800 p-6">
        <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-500" />
          <span>{language === 'ha' ? 'Yadda Shirin Yake Aiki' : 'How the 3PLE A Referral Program Works'}</span>
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono text-sm block mb-1">
              01. Share Link
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Send your personal referral link or QR code to contacts, POS customers, or colleagues across Nigeria.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono text-sm block mb-1">
              02. Friend Signs Up & Transacts
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              Your referred user completes Tier-1 KYC and completes their first transaction of at least ₦500 (Airtime, Data, Power, or Bills).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <span className="font-extrabold text-amber-600 dark:text-amber-400 font-mono text-sm block mb-1">
              03. Instant Cash Reward
            </span>
            <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
              ₦500 – ₦1,200 is instantly added to your claimable balance, plus an ongoing cashback bonus on their subsequent top-ups.
            </p>
          </div>
        </div>
      </div>

      {/* QR Code In-Person Scan Modal */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Scan to Register</span>
              <button
                onClick={() => setShowQrModal(false)}
                className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                Close
              </button>
            </div>

            <div className="p-5 bg-white rounded-2xl inline-block shadow-inner border border-slate-100 mx-auto">
              <QRCodeSVG
                value={referralUrl}
                size={200}
                level="H"
                includeMargin={false}
              />
            </div>

            <div>
              <span className="block font-mono text-lg font-black text-amber-600 dark:text-amber-400">
                {referralCode}
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Point any phone camera to register under your sponsorship.
              </p>
            </div>

            <button
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-xs rounded-xl hover:opacity-90 transition-opacity"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
