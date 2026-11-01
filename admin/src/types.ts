export interface AdminIdentity {
  email: string;
  name: string;
  role: 'administrator' | 'super_admin';
}

export interface AdminOverview {
  generatedAt: string;
  users: {
    total: number;
    active: number;
    suspended: number;
    pending: number;
  };
  transactions: {
    total: number;
    volume: number;
    successful: number;
    pending: number;
    failed: number;
  };
  providers: Array<{
    id: string;
    name: string;
    status: 'active' | 'degraded' | 'disabled';
    latencyMs: number | null;
    lastCheckedAt: string | null;
  }>;
  recentTransactions: Array<{
    id: string;
    reference: string;
    type: string;
    amount: number;
    status: 'initiated' | 'pending' | 'successful' | 'failed' | 'reversed' | 'refunded';
    provider: string;
    createdAt: string;
  }>;
}
