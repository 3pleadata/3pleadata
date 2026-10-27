export type UserRole =
  | 'customer'
  | 'retailer'
  | 'agent'
  | 'api_reseller'
  | 'support_officer'
  | 'finance_officer'
  | 'administrator'
  | 'super_admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  walletBalance: number;
  bonusBalance: number;
  commissionBalance: number;
  kycLevel: 1 | 2 | 3;
  bvnVerified: boolean;
  ninVerified: boolean;
  apiKey?: string;
  apiWebhookUrl?: string;
  twoFactorEnabled: boolean;
  transactionPinSet: boolean;
  status: 'active' | 'pending_verification' | 'suspended' | 'restricted';
  createdAt: string;
}

export type TransactionType =
  | 'wallet_funding'
  | 'airtime'
  | 'data'
  | 'electricity'
  | 'cable_tv'
  | 'school_fees'
  | 'flight_booking'
  | 'commission_payout'
  | 'refund'
  | 'wallet_transfer'
  | 'uncategorized';

export type TransactionStatus =
  | 'initiated'
  | 'pending'
  | 'successful'
  | 'failed'
  | 'reversed'
  | 'refunded';

export interface Transaction {
  id: string;
  reference: string;
  idempotencyKey: string;
  userId: string;
  userName: string;
  userPhone: string;
  type: TransactionType;
  category?: string; // e.g. 'Airtime', 'Utility', 'Data', 'Cable TV', 'Education', 'Flight', 'Wallet Funding', 'Transfer'
  isUncategorized?: boolean;
  suggestedCategory?: string;
  suggestedType?: TransactionType;
  categoryConfidence?: number; // 0.0 - 1.0 (e.g. 0.96 = 96%)
  categoryReasoning?: string;
  categoryConfirmed?: boolean;
  lastAuditedAt?: string;
  amount: number;
  fee: number;
  discount: number;
  totalDebited: number;
  status: TransactionStatus;
  provider: string;
  providerReference?: string;
  productName: string;
  recipient: string; // phone, meter number, smartcard, PNR, student ID
  metadata: Record<string, any>;
  createdAt: string;
  completedAt?: string;
}

export interface CategorizationSuggestion {
  transactionId: string;
  suggestedCategory: string;
  suggestedType: TransactionType;
  confidence: number;
  reasoning: string;
  matchedKeywords?: string[];
}

export interface AgentAuditReport {
  lastRunAt: string;
  uncategorizedFound: number;
  suggestionsGenerated: number;
  autoConfirmedCount: number;
  mode: 'autonomous' | 'manual';
}

export interface LedgerEntry {
  id: string;
  transactionRef: string;
  timestamp: string;
  debitAccount: string; // e.g. Customer Wallet, Provider Escrow, Bank Settlement
  creditAccount: string; // e.g. Platform Revenue, VTU Liability, Commission Payable
  amount: number;
  currency: string;
  narration: string;
}

export interface ProviderCapability {
  airtime: boolean;
  data: boolean;
  electricity: boolean;
  cableTv: boolean;
  education: boolean;
  flights: boolean;
  collections: boolean;
}

export interface ServiceProvider {
  id: string;
  name: string;
  identifier: string; // pairgate, paystack, monnify, clubkonnect, mysubwallet, bigisub, payora
  displayName: string;
  website: string;
  docsUrl: string;
  baseUrl: string;
  authMethod: 'bearer' | 'api_key_secret' | 'basic' | 'custom_token';
  apiKeyMasked: string;
  apiSecretMasked: string;
  mode: 'sandbox' | 'live';
  status: 'active' | 'degraded' | 'disabled';
  priority: number;
  latencyMs: number;
  lastTestedAt: string;
  capabilities: ProviderCapability;
  timeoutSeconds: number;
  notes: string;
}

export interface AirtimeNetwork {
  id: string;
  name: string;
  code: 'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE';
  logoColor: string;
  bgColor: string;
  discountPercentage: number;
  retailerDiscountPercentage: number;
  status: 'active' | 'inactive';
  minAmount: number;
  maxAmount: number;
}

export interface DataPlan {
  id: string;
  network: 'MTN' | 'AIRTEL' | 'GLO' | '9MOBILE';
  planType: 'SME' | 'Corporate Gifting' | 'Direct / Gifting';
  name: string;
  size: string;
  validity: string;
  customerPrice: number;
  retailerPrice: number;
  providerCost: number;
  active: boolean;
}

export interface ElectricityDisco {
  id: string;
  name: string;
  code: string;
  state: string;
  convenienceFee: number;
  logo: string;
  supportsPrepaid: boolean;
  supportsPostpaid: boolean;
  active: boolean;
}

export interface CableTvPackage {
  id: string;
  provider: 'DSTV' | 'GOTV' | 'STARTIMES' | 'SHOWMAX';
  name: string;
  code: string;
  price: number;
  channels: number;
}

export interface EducationItem {
  id: string;
  category: 'university' | 'polytechnic' | 'exam_pin';
  name: string;
  shortCode: string;
  state: string;
  feeName: string;
  amount: number;
  serviceCharge: number;
  logoText: string;
  active: boolean;
}

export interface FlightOffer {
  id: string;
  airline: string;
  flightNumber: string;
  origin: string;
  originCity: string;
  destination: string;
  destinationCity: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  cabinClass: 'Economy' | 'Business' | 'First';
  stops: number;
  baggageAllowance: string;
  fareRules: string;
  baseFare: number;
  taxes: number;
  totalPrice: number;
  availableSeats: number;
}

export interface FlightBooking {
  id: string;
  pnr: string;
  supplierRef: string;
  userId: string;
  customerName: string;
  passengerCount: number;
  passengers: Array<{
    title: string;
    fullName: string;
    dob: string;
    gender: string;
    ninOrPassport: string;
    ticketNumber: string;
  }>;
  flight: FlightOffer;
  totalAmount: number;
  bookingStatus: 'confirmed' | 'pending' | 'cancelled' | 'refunded';
  bookingDate: string;
  eTicketIssued: boolean;
}

export interface PropertyListing {
  id: string;
  title: string;
  description: string;
  category: 'residential' | 'commercial' | 'land' | 'apartment';
  transactionType: 'sale' | 'rent' | 'lease';
  location: string;
  city: string;
  state: string;
  price: number;
  currency: 'NGN';
  bedrooms?: number;
  bathrooms?: number;
  toilets?: number;
  sizeSqm?: number;
  verified: boolean;
  featured: boolean;
  status: 'available' | 'under_offer' | 'sold' | 'leased';
  imageUrl: string;
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  createdAt: string;
}

export interface PropertyInquiry {
  id: string;
  propertyId: string;
  propertyTitle: string;
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  message: string;
  preferredDate?: string;
  status: 'new' | 'contacted' | 'viewing_scheduled' | 'closed';
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'transaction' | 'security' | 'promo' | 'system';
  read: boolean;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  subject: string;
  category: 'wallet' | 'vtu' | 'flight' | 'estate' | 'api' | 'other';
  priority: 'low' | 'medium' | 'high';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
  messages: Array<{
    sender: 'user' | 'support';
    text: string;
    timestamp: string;
  }>;
}

export interface ApiResellerKey {
  id: string;
  userId: string;
  keyName: string;
  prefix: string;
  keyMasked: string;
  environment: 'sandbox' | 'live';
  rateLimitPerMin: number;
  totalRequests: number;
  active: boolean;
  createdAt: string;
  lastUsedAt?: string;
}

export interface PriceAlert {
  id: string;
  userId: string;
  category: 'data' | 'electricity' | 'airtime';
  networkOrProvider: string; // e.g., 'MTN', 'AIRTEL', 'KEDCO'
  planOrService: string; // e.g., 'MTN SME 2GB', 'KEDCO Prepaid'
  targetMaxPrice: number; // in NGN
  currentPrice: number; // in NGN
  status: 'active' | 'triggered' | 'paused';
  createdAt: string;
  lastCheckedAt?: string;
  notes?: string;
}

export type ScheduleFrequency = 'daily' | 'weekly' | 'monthly' | 'custom_day';

export interface ScheduledPayment {
  id: string;
  userId: string;
  title: string;
  category: 'airtime' | 'data' | 'electricity' | 'cable_tv';
  provider: string; // e.g., 'MTN', 'KEDCO', 'DSTV'
  recipient: string; // Phone number, meter number, or smartcard IUC
  amount: number;
  planCode?: string;
  planName?: string;
  frequency: ScheduleFrequency;
  executionDay?: number; // 1-31 for monthly, or 1-7 for day of week
  executionTime: string; // e.g. '08:00'
  nextRunDate: string; // ISO date string
  lastRunDate?: string;
  status: 'active' | 'paused' | 'completed' | 'failed' | 'skipped';
  autoDebitWallet: boolean;
  totalExecutions: number;
  createdAt: string;
  skippedCycles?: string[];
  lastSkippedDate?: string;
  note?: string;
}

