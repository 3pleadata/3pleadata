// Google Chat & 3PLE A Support Messaging Service

export interface SupportAgent {
  id: string;
  name: string;
  role: string;
  avatar: string;
  email: string;
  status: 'online' | 'busy' | 'offline';
  department: 'general' | 'billing' | 'wholesale';
}

export interface ChatReaction {
  emoji: string;
  count: number;
  users: string[];
}

export interface SupportMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar?: string;
  isAgent: boolean;
  text: string;
  timestamp: string;
  spaceId: string;
  status: 'sent' | 'delivered' | 'read';
  transactionRef?: string;
  reactions?: ChatReaction[];
}

export interface ChatSpace {
  id: string;
  name: string;
  displayName: string;
  description: string;
  type: 'SPACE' | 'DIRECT_MESSAGE';
  isGoogleChatSync?: boolean;
  agentId?: string;
}

const STORAGE_CHAT_KEY = '3plea_support_chat_history_v1';

export const INITIAL_SUPPORT_AGENTS: SupportAgent[] = [
  {
    id: 'agent_musa',
    name: 'Musa Sulaiman',
    role: 'Senior Customer Support Lead (Kano)',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    email: 'musa.support@3plea.ng',
    status: 'online',
    department: 'general',
  },
  {
    id: 'agent_fatima',
    name: 'Fatima Aliyu',
    role: 'Billing & Token Escalations Officer',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
    email: 'fatima.billing@3plea.ng',
    status: 'online',
    department: 'billing',
  },
  {
    id: 'agent_abdullahi',
    name: 'Abdullahi Umar',
    role: 'Wholesale Retailer & API Desk',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80',
    email: 'abdullahi.api@3plea.ng',
    status: 'busy',
    department: 'wholesale',
  },
];

export const INITIAL_SPACES: ChatSpace[] = [
  {
    id: 'space_general',
    name: 'spaces/general-support',
    displayName: '# General Support Space',
    description: 'Direct inquiries on VTU airtime, data bundles, and general account questions.',
    type: 'SPACE',
  },
  {
    id: 'space_billing',
    name: 'spaces/billing-tokens',
    displayName: '# KEDCO & Meter Resolutions',
    description: 'Electricity token generation issues, double debits, and refund requests.',
    type: 'SPACE',
  },
  {
    id: 'dm_musa',
    name: 'spaces/dm-musa',
    displayName: 'Musa Sulaiman (Kano Helpdesk)',
    description: 'Direct 1-on-1 private chat with primary Kano office support specialist.',
    type: 'DIRECT_MESSAGE',
    agentId: 'agent_musa',
  },
  {
    id: 'dm_fatima',
    name: 'spaces/dm-fatima',
    displayName: 'Fatima Aliyu (Billing Desk)',
    description: 'Direct message for payment investigations and failed transaction reversals.',
    type: 'DIRECT_MESSAGE',
    agentId: 'agent_fatima',
  },
];

export const INITIAL_MESSAGES: SupportMessage[] = [
  {
    id: 'msg_welcome_1',
    senderId: 'agent_musa',
    senderName: 'Musa Sulaiman',
    senderAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
    isAgent: true,
    text: 'Sannu! Welcome to 3PLE A Customer Support. I am on standby to help resolve any VTU dispensing issues, verify KEDCO power tokens, or answer questions about your account.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    spaceId: 'space_general',
    status: 'read',
    reactions: [{ emoji: '👋', count: 2, users: ['user', 'agent_musa'] }],
  },
  {
    id: 'msg_welcome_2',
    senderId: 'agent_fatima',
    senderName: 'Fatima Aliyu',
    senderAvatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80',
    isAgent: true,
    text: 'Billing & Settlement Desk is open. If you have any pending bank transfers or need a token reprinted, message me directly or reply in this space with your transaction reference number.',
    timestamp: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    spaceId: 'space_billing',
    status: 'read',
  },
];

export function deduplicateSupportMessages(messages: SupportMessage[]): SupportMessage[] {
  if (!Array.isArray(messages)) return [];
  const seen = new Set<string>();
  const result: SupportMessage[] = [];
  for (const m of messages) {
    if (m && m.id && !seen.has(m.id)) {
      seen.add(m.id);
      result.push(m);
    }
  }
  return result;
}

export function getStoredSupportMessages(): SupportMessage[] {
  try {
    const raw = localStorage.getItem(STORAGE_CHAT_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return deduplicateSupportMessages(parsed);
      }
    }
  } catch (e) {
    console.error('Failed to load support chat history:', e);
  }
  return deduplicateSupportMessages(INITIAL_MESSAGES);
}

export function saveStoredSupportMessages(messages: SupportMessage[]): void {
  try {
    const clean = deduplicateSupportMessages(messages);
    localStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(clean));
  } catch (e) {
    console.error('Failed to save support chat history:', e);
  }
}

// Google Chat 1P API client calls
export async function fetchGoogleChatSpaces(accessToken: string): Promise<ChatSpace[]> {
  const response = await fetch('https://chat.googleapis.com/v1/spaces', {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  const data = await response.json();
  const spaces = data.spaces || [];
  return spaces.map((s: any) => ({
    id: s.name,
    name: s.name,
    displayName: s.displayName || s.name,
    description: s.spaceDetails?.description || 'Google Workspace Chat Space',
    type: s.type === 'DIRECT_MESSAGE' ? 'DIRECT_MESSAGE' : 'SPACE',
    isGoogleChatSync: true,
  }));
}

export async function sendGoogleChatMessage(
  accessToken: string,
  spaceName: string,
  text: string
): Promise<any> {
  const url = `https://chat.googleapis.com/v1/${spaceName}/messages`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody?.error?.message || `HTTP ${response.status}: ${response.statusText}`;
    throw new Error(message);
  }

  return response.json();
}

// Simulated automated support response logic for immediate user assistance
export function generateSupportAgentResponse(
  userText: string,
  agent: SupportAgent,
  spaceId: string,
  txRef?: string
): SupportMessage {
  const lower = userText.toLowerCase();
  let replyText = '';

  if (txRef || lower.includes('tx_') || lower.includes('3pa-')) {
    const ref = txRef || 'your transaction reference';
    replyText = `Thank you for providing the reference (${ref}). I have verified it in our Core Double-Entry ledger. The status is confirmed, and our Pairgate gateway clearance log shows approval. Let me know if you need an official stamp or PDF reprint!`;
  } else if (lower.includes('token') || lower.includes('meter') || lower.includes('kedco') || lower.includes('wuta')) {
    replyText = `Regarding your electricity meter token: If a purchase succeeded but the SMS didn't arrive, you can always view and copy your 20-digit token directly from your transaction receipt modal on the dashboard. I can also look up the meter if you provide the account number.`;
  } else if (lower.includes('refund') || lower.includes('fail') || lower.includes('debit')) {
    replyText = `I have flagged your inquiry for instant settlement review. 3PLE A operates automated idempotent auto-reversals: any unfulfilled VTU or data request is credited back to your main NGN wallet within 60 seconds.`;
  } else if (lower.includes('data') || lower.includes('sme') || lower.includes('airtime')) {
    replyText = `Our data lines and VTU servers for MTN, Airtel, Glo, and 9mobile are 100% operational with 99.9% uptime. If you are experiencing a delay on a specific recipient phone number, send it over and I will check the provider queue.`;
  } else if (lower.includes('sannu') || lower.includes('ina kwana') || lower.includes('barka')) {
    replyText = `Barka da yau! Ni ne ${agent.name} daga sashin tallafin 3PLE A. Ta yaya zan iya taimaka maka game da harkokin kudi, sayen data, ko biyan kudin wuta a yau?`;
  } else {
    replyText = `Received your message: "${userText}". As ${agent.role}, I am reviewing this right away. You can also attach any transaction receipt directly to this chat using the receipt attachment button below.`;
  }

  return {
    id: `msg_${Date.now()}_agent`,
    senderId: agent.id,
    senderName: agent.name,
    senderAvatar: agent.avatar,
    isAgent: true,
    text: replyText,
    timestamp: new Date().toISOString(),
    spaceId,
    status: 'delivered',
  };
}
