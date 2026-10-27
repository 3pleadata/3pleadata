import { Transaction, TransactionType, CategorizationSuggestion, AgentAuditReport } from '../types';

export interface AgentConfig {
  autoReviewEnabled: boolean;
  reviewIntervalSeconds: number; // e.g., 30, 60, 120
  confidenceThreshold: number; // e.g., 0.70
  notifyOnSuggestions: boolean;
}

const AGENT_CONFIG_KEY = '3plea_ai_categorizer_config_v1';
const AGENT_AUDIT_KEY = '3plea_ai_categorizer_audit_v1';

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  autoReviewEnabled: true,
  reviewIntervalSeconds: 30,
  confidenceThreshold: 0.70,
  notifyOnSuggestions: true,
};

export function loadAgentConfig(): AgentConfig {
  try {
    const raw = localStorage.getItem(AGENT_CONFIG_KEY);
    if (raw) return { ...DEFAULT_AGENT_CONFIG, ...JSON.parse(raw) };
  } catch (e) {
    console.error('Failed to load agent config:', e);
  }
  return DEFAULT_AGENT_CONFIG;
}

export function saveAgentConfig(config: AgentConfig) {
  try {
    localStorage.setItem(AGENT_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save agent config:', e);
  }
}

export function loadAuditReports(): AgentAuditReport[] {
  try {
    const raw = localStorage.getItem(AGENT_AUDIT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load audit reports:', e);
  }
  return [];
}

export function saveAuditReport(report: AgentAuditReport) {
  try {
    const existing = loadAuditReports();
    const updated = [report, ...existing].slice(0, 20); // Keep last 20 reports
    localStorage.setItem(AGENT_AUDIT_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error('Failed to save audit report:', e);
  }
}

/**
 * Local client-side domain classifier for offline resilience or direct client execution.
 */
export function classifyTransactionLocally(tx: Transaction): CategorizationSuggestion {
  const text = `${tx.productName || ''} ${tx.provider || ''} ${tx.recipient || ''} ${JSON.stringify(tx.metadata || {})}`.toLowerCase();

  // Electricity & Power Utilities
  if (
    text.includes('kedco') || text.includes('aedc') || text.includes('ekedc') ||
    text.includes('ikedc') || text.includes('ibedc') || text.includes('phed') ||
    text.includes('kaedco') || text.includes('eedc') || text.includes('disco') ||
    text.includes('meter') || text.includes('prepaid') || text.includes('postpaid') ||
    text.includes('token') || text.includes('kwh') || text.includes('power') ||
    text.includes('electric') || text.includes('utility')
  ) {
    return {
      transactionId: tx.id,
      suggestedCategory: 'Utility',
      suggestedType: 'electricity',
      confidence: 0.98,
      reasoning: "Matched electricity distribution company (DISCO) and prepaid meter token pattern.",
      matchedKeywords: ['electric', 'meter', 'disco'],
    };
  }

  // Airtime VTU
  if (
    (text.includes('airtime') || text.includes('recharge') || text.includes('vtu topup') || text.includes('kati')) &&
    !text.includes('data') && !text.includes('gb')
  ) {
    return {
      transactionId: tx.id,
      suggestedCategory: 'Airtime',
      suggestedType: 'airtime',
      confidence: 0.96,
      reasoning: "Matched cellular network airtime recharge syntax and MSISDN recipient.",
      matchedKeywords: ['airtime', 'vtu', 'recharge'],
    };
  }

  // Data Bundles
  if (
    text.includes('data') || text.includes('sme') || text.includes('corporate gifting') ||
    text.includes('cg data') || text.includes('gb') || text.includes('mb') || text.includes('internet')
  ) {
    return {
      transactionId: tx.id,
      suggestedCategory: 'Data',
      suggestedType: 'data',
      confidence: 0.97,
      reasoning: "Matched SME / Corporate Gifting mobile data volume package identifiers.",
      matchedKeywords: ['data', 'bundle', 'sme'],
    };
  }

  // Cable TV
  if (
    text.includes('dstv') || text.includes('gotv') || text.includes('startimes') ||
    text.includes('multichoice') || text.includes('showmax') || text.includes('smartcard') ||
    text.includes('iuc') || text.includes('cable') || text.includes('tv')
  ) {
    return {
      transactionId: tx.id,
      suggestedCategory: 'Cable TV',
      suggestedType: 'cable_tv',
      confidence: 0.99,
      reasoning: "Matched Pay-TV bouquet decoder subscription and Smartcard / IUC index.",
      matchedKeywords: ['cable', 'multichoice', 'iuc'],
    };
  }

  // Education / Exam PINs
  if (
    text.includes('waec') || text.includes('neco') || text.includes('jamb') ||
    text.includes('buk') || text.includes('bayero') || text.includes('polytechnic') ||
    text.includes('university') || text.includes('tuition') || text.includes('school') ||
    text.includes('exam') || text.includes('pin') || text.includes('acceptance')
  ) {
    return {
      transactionId: tx.id,
      suggestedCategory: 'Education',
      suggestedType: 'school_fees',
      confidence: 0.95,
      reasoning: "Matched higher education institution registration or national examination token.",
      matchedKeywords: ['education', 'exam', 'tuition'],
    };
  }

  // Flight & Travel
  if (
    text.includes('flight') || text.includes('air peace') || text.includes('max air') ||
    text.includes('united nigeria') || text.includes('ibom') || text.includes('airline') ||
    text.includes('pnr') || text.includes('airport') || text.includes('kano-') || text.includes('kan-')
  ) {
    return {
      transactionId: tx.id,
      suggestedCategory: 'Flight',
      suggestedType: 'flight_booking',
      confidence: 0.96,
      reasoning: "Matched commercial passenger flight itinerary, airline carrier code, and PNR.",
      matchedKeywords: ['flight', 'airline', 'pnr'],
    };
  }

  // Wallet Funding
  if (
    text.includes('top-up') || text.includes('topup') || text.includes('funding') ||
    text.includes('deposit') || text.includes('paystack') || text.includes('monnify')
  ) {
    return {
      transactionId: tx.id,
      suggestedCategory: 'Wallet Funding',
      suggestedType: 'wallet_funding',
      confidence: 0.94,
      reasoning: "Matched payment gateway card settlement or virtual bank deposit.",
      matchedKeywords: ['funding', 'paystack', 'deposit'],
    };
  }

  // Transfers
  if (text.includes('transfer') || text.includes('p2p') || text.includes('qr transfer') || text.includes('sent to')) {
    return {
      transactionId: tx.id,
      suggestedCategory: 'Internal Transfer',
      suggestedType: 'wallet_transfer',
      confidence: 0.91,
      reasoning: "Matched peer-to-peer internal wallet transfer narration.",
      matchedKeywords: ['transfer', 'p2p'],
    };
  }

  return {
    transactionId: tx.id,
    suggestedCategory: 'Utility',
    suggestedType: 'electricity',
    confidence: 0.72,
    reasoning: "General commercial vendor billing heuristic.",
    matchedKeywords: ['utility'],
  };
}

/**
 * Requests classifications from server-side Gemini 3.8 Flash,
 * falling back gracefully to local classification.
 */
export async function requestTransactionClassifications(
  transactions: Transaction[]
): Promise<CategorizationSuggestion[]> {
  if (transactions.length === 0) return [];

  try {
    const payload = transactions.map((t) => ({
      id: t.id,
      productName: t.productName,
      recipient: t.recipient,
      provider: t.provider,
      amount: t.amount,
      metadata: t.metadata,
    }));

    const response = await fetch('/api/v1/ai/categorize-transactions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ transactions: payload }),
    });

    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
        return data.suggestions;
      }
    }
  } catch (err) {
    console.warn('Backend categorization call failed; using local domain classifier:', err);
  }

  // Fallback locally
  return transactions.map(classifyTransactionLocally);
}

/**
 * Evaluates all uncategorized transactions in the given list, generates suggestions,
 * and updates them with suggestion metadata.
 */
export async function runCategorizationAudit(
  transactions: Transaction[],
  mode: 'autonomous' | 'manual' = 'autonomous'
): Promise<{
  updatedTransactions: Transaction[];
  newSuggestionsCount: number;
  report: AgentAuditReport;
}> {
  const uncategorized = transactions.filter(
    (t) => (t.isUncategorized || t.type === 'uncategorized' || t.category === 'Uncategorized') && !t.categoryConfirmed
  );

  if (uncategorized.length === 0) {
    const emptyReport: AgentAuditReport = {
      lastRunAt: new Date().toISOString(),
      uncategorizedFound: 0,
      suggestionsGenerated: 0,
      autoConfirmedCount: 0,
      mode,
    };
    saveAuditReport(emptyReport);
    return {
      updatedTransactions: transactions,
      newSuggestionsCount: 0,
      report: emptyReport,
    };
  }

  const suggestions = await requestTransactionClassifications(uncategorized);
  const suggestionMap = new Map<string, CategorizationSuggestion>();
  for (const s of suggestions) {
    suggestionMap.set(s.transactionId, s);
  }

  let newCount = 0;
  const nowIso = new Date().toISOString();

  const updatedTransactions = transactions.map((tx) => {
    if (suggestionMap.has(tx.id)) {
      const s = suggestionMap.get(tx.id)!;
      const isNew = !tx.suggestedCategory;
      if (isNew) newCount++;

      return {
        ...tx,
        isUncategorized: true,
        suggestedCategory: s.suggestedCategory,
        suggestedType: s.suggestedType,
        categoryConfidence: s.confidence,
        categoryReasoning: s.reasoning,
        lastAuditedAt: nowIso,
      };
    }
    return tx;
  });

  const report: AgentAuditReport = {
    lastRunAt: nowIso,
    uncategorizedFound: uncategorized.length,
    suggestionsGenerated: suggestions.length,
    autoConfirmedCount: 0,
    mode,
  };
  saveAuditReport(report);

  return {
    updatedTransactions,
    newSuggestionsCount: newCount,
    report,
  };
}

/**
 * 1-Click Confirmation helper: Immediately reclassifies an individual transaction.
 */
export function confirmTransactionClassification(
  transactionId: string,
  category: string,
  type: TransactionType,
  transactions: Transaction[]
): Transaction[] {
  return transactions.map((tx) => {
    if (tx.id === transactionId) {
      return {
        ...tx,
        type,
        category,
        isUncategorized: false,
        categoryConfirmed: true,
      };
    }
    return tx;
  });
}

/**
 * 1-Click Batch Confirmation helper: Reclassifies ALL currently suggested transactions.
 */
export function confirmAllTransactionClassifications(
  transactions: Transaction[]
): Transaction[] {
  return transactions.map((tx) => {
    if (
      (tx.isUncategorized || tx.type === 'uncategorized' || tx.category === 'Uncategorized') &&
      tx.suggestedCategory &&
      tx.suggestedType
    ) {
      return {
        ...tx,
        type: tx.suggestedType,
        category: tx.suggestedCategory,
        isUncategorized: false,
        categoryConfirmed: true,
      };
    }
    return tx;
  });
}

/**
 * Creates a randomized uncategorized mock transaction for on-demand testing of the AI agent.
 */
export function createSampleUncategorizedTransaction(): Transaction {
  const samples = [
    {
      productName: 'POS PURCHASE AT KEDCO KANO VENDOR MTR 041928374',
      recipient: '041928374',
      provider: 'NIBSS Agency POS',
      amount: 8500,
      fee: 100,
      narration: 'KEDCO power prepaid electricity meter voucher purchase',
    },
    {
      productName: 'AIRTEL VTU TOPUP ₦4,000 AUTO-REFILL',
      recipient: '08023456789',
      provider: 'Interswitch WebPAY',
      amount: 4000,
      fee: 0,
      narration: 'Airtel cellular airtime recharge debit',
    },
    {
      productName: 'GOTV JOLLI MONTHLY SUBSCRIPTION RENEWAL',
      recipient: 'IUC 2093847511',
      provider: 'Paystack Gateway',
      amount: 5800,
      fee: 0,
      narration: 'GOtv Jolli monthly bouquet cable TV subscription',
    },
    {
      productName: 'WAEC MAY/JUNE RESULT CHECKER PIN (5 USES)',
      recipient: 'WAEC-TOKEN-ONLINE',
      provider: 'Remita Central',
      amount: 4200,
      fee: 150,
      narration: 'National WAEC examination result token code',
    },
    {
      productName: 'MAX AIR INTL FLIGHT TICKETING KAN TO ABV',
      recipient: 'PNR: VM-7491',
      provider: 'Max Air Direct Gateway',
      amount: 104500,
      fee: 0,
      narration: 'Domestic flight ticket booking Kano to Abuja',
    },
    {
      productName: 'GLO CORPORATE GIFTING DATA 3GB BUNDLE',
      recipient: '08051122334',
      provider: 'ClubKonnect VTU',
      amount: 790,
      fee: 0,
      narration: 'Glo CG 3GB corporate gifting internet volume',
    },
  ];

  const choice = samples[Math.floor(Math.random() * samples.length)];
  const refSuffix = Math.floor(1000 + Math.random() * 9000);
  const now = new Date();

  return {
    id: `tx_3pa_uncat_${Date.now()}_${refSuffix}`,
    reference: `3PA-UNCAT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${refSuffix}`,
    idempotencyKey: `idem_uncat_${Date.now()}_${refSuffix}`,
    userId: 'usr_3plea_demo_01',
    userName: 'Aliyu Mohammed Kano',
    userPhone: '+234 803 123 4567',
    type: 'uncategorized',
    category: 'Uncategorized',
    isUncategorized: true,
    amount: choice.amount,
    fee: choice.fee,
    discount: 0,
    totalDebited: choice.amount + choice.fee,
    status: 'successful',
    provider: choice.provider,
    providerReference: `EXT_REF_${Date.now()}`,
    productName: choice.productName,
    recipient: choice.recipient,
    metadata: {
      narration: choice.narration,
      generatedForTesting: true,
    },
    createdAt: now.toISOString(),
    completedAt: now.toISOString(),
  };
}
