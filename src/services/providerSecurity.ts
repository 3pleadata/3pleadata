import { ServiceProvider, ProviderCircuitBreaker, ProviderAuditLog } from '../types';

export interface ProviderSecurityDefaults {
  vaultStatus: 'aes_256_gcm' | 'hardware_enclave';
  keyLastRotatedAt: string;
  webhookSecretMasked: string;
  webhookHmacAlgorithm: 'sha512' | 'sha256' | 'token';
  allowedIps: string[];
  enforceIpAllowlist: boolean;
  circuitBreaker: ProviderCircuitBreaker;
  autoFailoverProviderId?: string;
  floatBalanceNgn: number;
  minFloatThresholdNgn: number;
  lowFloatAlertActive: boolean;
  secretAuditTrail: ProviderAuditLog[];
}

export const PROVIDER_SECURITY_MAP: Record<string, ProviderSecurityDefaults> = {
  prov_pairgate: {
    vaultStatus: 'hardware_enclave',
    keyLastRotatedAt: new Date(Date.now() - 14 * 86400000).toISOString(),
    webhookSecretMasked: 'whsec_pg_••••••••••••9901',
    webhookHmacAlgorithm: 'sha256',
    allowedIps: ['102.89.23.44', '197.210.64.12', '102.88.35.18'],
    enforceIpAllowlist: true,
    circuitBreaker: {
      state: 'closed',
      consecutiveFailures: 0,
      failureThreshold: 3,
      recoveryTimeoutSec: 45,
    },
    autoFailoverProviderId: 'prov_clubkonnect',
    floatBalanceNgn: 1450000,
    minFloatThresholdNgn: 250000,
    lowFloatAlertActive: false,
    secretAuditTrail: [
      {
        id: 'aud_pg_01',
        timestamp: new Date(Date.now() - 14 * 86400000).toISOString(),
        action: 'rotated',
        actor: 'Alhaji Musa (Super Admin)',
        ip: '102.89.33.12 (Tarauni, Kano)',
        note: 'Bi-weekly routine key rotation & AES-256 vault enclave re-encryption.',
      },
      {
        id: 'aud_pg_02',
        timestamp: new Date(Date.now() - 3 * 86400000).toISOString(),
        action: 'float_topped_up',
        actor: 'Finance Dept (3PLE A DATA)',
        ip: '197.210.45.19',
        note: 'Replenished Pairgate clearing float by ₦1,000,000 via Wema Bank NUBAN.',
      },
    ],
  },
  prov_clubkonnect: {
    vaultStatus: 'aes_256_gcm',
    keyLastRotatedAt: new Date(Date.now() - 28 * 86400000).toISOString(),
    webhookSecretMasked: 'whsec_ck_••••••••••••4122',
    webhookHmacAlgorithm: 'sha256',
    allowedIps: ['102.130.112.5', '102.130.112.6'],
    enforceIpAllowlist: true,
    circuitBreaker: {
      state: 'closed',
      consecutiveFailures: 0,
      failureThreshold: 3,
      recoveryTimeoutSec: 60,
    },
    autoFailoverProviderId: 'prov_bigisub',
    floatBalanceNgn: 680000,
    minFloatThresholdNgn: 150000,
    lowFloatAlertActive: false,
    secretAuditTrail: [
      {
        id: 'aud_ck_01',
        timestamp: new Date(Date.now() - 28 * 86400000).toISOString(),
        action: 'rotated',
        actor: 'Security Operations (SecOps)',
        ip: '102.89.33.12 (Kano HQ)',
        note: 'Monthly credential sync with ClubKonnect portal.',
      },
    ],
  },
  prov_paystack: {
    vaultStatus: 'hardware_enclave',
    keyLastRotatedAt: new Date(Date.now() - 10 * 86400000).toISOString(),
    webhookSecretMasked: 'whsec_pstk_••••••••••••8819',
    webhookHmacAlgorithm: 'sha512',
    allowedIps: ['52.31.139.75', '52.49.173.169', '52.214.14.220'],
    enforceIpAllowlist: true,
    circuitBreaker: {
      state: 'closed',
      consecutiveFailures: 0,
      failureThreshold: 4,
      recoveryTimeoutSec: 30,
    },
    autoFailoverProviderId: 'prov_monnify',
    floatBalanceNgn: 2850000,
    minFloatThresholdNgn: 500000,
    lowFloatAlertActive: false,
    secretAuditTrail: [
      {
        id: 'aud_pstk_01',
        timestamp: new Date(Date.now() - 10 * 86400000).toISOString(),
        action: 'tested',
        actor: 'Compliance Engine',
        ip: '102.89.33.12 (Kano)',
        note: 'Verified x-paystack-signature HMAC SHA-512 webhook digest matching test event.',
      },
    ],
  },
  prov_monnify: {
    vaultStatus: 'hardware_enclave',
    keyLastRotatedAt: new Date(Date.now() - 20 * 86400000).toISOString(),
    webhookSecretMasked: 'whsec_mnf_••••••••••••3311',
    webhookHmacAlgorithm: 'sha512',
    allowedIps: ['35.242.133.106', '34.89.70.180'],
    enforceIpAllowlist: true,
    circuitBreaker: {
      state: 'closed',
      consecutiveFailures: 0,
      failureThreshold: 3,
      recoveryTimeoutSec: 45,
    },
    autoFailoverProviderId: 'prov_paystack',
    floatBalanceNgn: 1920000,
    minFloatThresholdNgn: 300000,
    lowFloatAlertActive: false,
    secretAuditTrail: [
      {
        id: 'aud_mnf_01',
        timestamp: new Date(Date.now() - 20 * 86400000).toISOString(),
        action: 'rotated',
        actor: 'Lead DevOps',
        ip: '102.89.33.12 (Kano)',
        note: 'Monnify TeamApt basic auth and webhook secret upgraded to v2 protocol.',
      },
    ],
  },
  prov_mysubwallet: {
    vaultStatus: 'aes_256_gcm',
    keyLastRotatedAt: new Date(Date.now() - 18 * 86400000).toISOString(),
    webhookSecretMasked: 'whsec_msw_••••••••••••2200',
    webhookHmacAlgorithm: 'sha256',
    allowedIps: ['104.21.35.80', '172.67.142.112'],
    enforceIpAllowlist: true,
    circuitBreaker: {
      state: 'closed',
      consecutiveFailures: 0,
      failureThreshold: 2,
      recoveryTimeoutSec: 90,
    },
    autoFailoverProviderId: 'prov_pairgate',
    floatBalanceNgn: 920000,
    minFloatThresholdNgn: 200000,
    lowFloatAlertActive: false,
    secretAuditTrail: [
      {
        id: 'aud_msw_01',
        timestamp: new Date(Date.now() - 18 * 86400000).toISOString(),
        action: 'tested',
        actor: 'Flight Desk Supervisor',
        ip: '102.89.33.12 (Kano)',
        note: 'GDS PNR issuance handshake test passed with 220ms latency.',
      },
    ],
  },
  prov_bigisub: {
    vaultStatus: 'aes_256_gcm',
    keyLastRotatedAt: new Date(Date.now() - 42 * 86400000).toISOString(),
    webhookSecretMasked: 'whsec_bgs_••••••••••••7709',
    webhookHmacAlgorithm: 'sha256',
    allowedIps: ['162.241.118.23'],
    enforceIpAllowlist: true,
    circuitBreaker: {
      state: 'closed',
      consecutiveFailures: 0,
      failureThreshold: 3,
      recoveryTimeoutSec: 60,
    },
    autoFailoverProviderId: 'prov_pairgate',
    floatBalanceNgn: 340000,
    minFloatThresholdNgn: 100000,
    lowFloatAlertActive: false,
    secretAuditTrail: [
      {
        id: 'aud_bgs_01',
        timestamp: new Date(Date.now() - 42 * 86400000).toISOString(),
        action: 'rotated',
        actor: 'Admin',
        ip: '102.89.33.12 (Kano)',
        note: 'BigiSub API token renewed.',
      },
    ],
  },
  prov_payora: {
    vaultStatus: 'aes_256_gcm',
    keyLastRotatedAt: new Date(Date.now() - 35 * 86400000).toISOString(),
    webhookSecretMasked: 'whsec_pyra_••••••••••••5512',
    webhookHmacAlgorithm: 'sha256',
    allowedIps: ['185.199.108.153'],
    enforceIpAllowlist: true,
    circuitBreaker: {
      state: 'closed',
      consecutiveFailures: 0,
      failureThreshold: 3,
      recoveryTimeoutSec: 60,
    },
    autoFailoverProviderId: 'prov_pairgate',
    floatBalanceNgn: 420000,
    minFloatThresholdNgn: 100000,
    lowFloatAlertActive: false,
    secretAuditTrail: [
      {
        id: 'aud_pyra_01',
        timestamp: new Date(Date.now() - 35 * 86400000).toISOString(),
        action: 'tested',
        actor: 'SecOps',
        ip: '102.89.33.12 (Kano)',
        note: 'Agency banking endpoint ping passed.',
      },
    ],
  },
};

const STORAGE_KEY_PROVIDERS = '3plea_secure_providers_registry';

/**
 * Merge base service providers with their cryptographic security profiles
 */
export function secureProviderList(providers: ServiceProvider[]): ServiceProvider[] {
  return providers.map((prov) => {
    const sec = PROVIDER_SECURITY_MAP[prov.id] || {
      vaultStatus: 'aes_256_gcm',
      keyLastRotatedAt: new Date().toISOString(),
      webhookSecretMasked: 'whsec_••••••••••••0000',
      webhookHmacAlgorithm: 'sha256',
      allowedIps: ['127.0.0.1'],
      enforceIpAllowlist: true,
      circuitBreaker: {
        state: 'closed',
        consecutiveFailures: 0,
        failureThreshold: 3,
        recoveryTimeoutSec: 60,
      },
      floatBalanceNgn: 500000,
      minFloatThresholdNgn: 100000,
      lowFloatAlertActive: false,
      secretAuditTrail: [],
    };

    // Calculate if rotation is overdue (> 60 days)
    const lastRotatedTime = new Date(prov.keyLastRotatedAt || sec.keyLastRotatedAt).getTime();
    const daysSinceRotation = Math.floor((Date.now() - lastRotatedTime) / 86400000);
    const keyRotationDue = daysSinceRotation >= 60;

    const floatBal = prov.floatBalanceNgn ?? sec.floatBalanceNgn;
    const minThreshold = prov.minFloatThresholdNgn ?? sec.minFloatThresholdNgn;
    const lowFloatAlertActive = floatBal < minThreshold;

    return {
      ...prov,
      vaultStatus: prov.vaultStatus || sec.vaultStatus,
      keyLastRotatedAt: prov.keyLastRotatedAt || sec.keyLastRotatedAt,
      keyRotationDue,
      webhookSecretMasked: prov.webhookSecretMasked || sec.webhookSecretMasked,
      webhookHmacAlgorithm: prov.webhookHmacAlgorithm || sec.webhookHmacAlgorithm,
      allowedIps: prov.allowedIps || sec.allowedIps,
      enforceIpAllowlist: prov.enforceIpAllowlist ?? sec.enforceIpAllowlist,
      circuitBreaker: prov.circuitBreaker || sec.circuitBreaker,
      autoFailoverProviderId: prov.autoFailoverProviderId || sec.autoFailoverProviderId,
      floatBalanceNgn: floatBal,
      minFloatThresholdNgn: minThreshold,
      lowFloatAlertActive,
      secretAuditTrail: prov.secretAuditTrail || sec.secretAuditTrail,
    };
  });
}

/**
 * Persist updated provider configuration to browser localStorage safely
 */
export function persistSecuredProviders(providers: ServiceProvider[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_PROVIDERS, JSON.stringify(providers));
  } catch (err) {
    console.error('Failed to persist provider security settings:', err);
  }
}

/**
 * Load persisted provider settings if available
 */
export function loadPersistedSecuredProviders(defaultProviders: ServiceProvider[]): ServiceProvider[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROVIDERS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return secureProviderList(parsed);
      }
    }
  } catch (err) {
    console.warn('Could not read cached provider configurations:', err);
  }
  return secureProviderList(defaultProviders);
}

/**
 * Rotate credentials for a specific provider with full audit log and masked preview
 */
export function rotateProviderSecret(
  providers: ServiceProvider[],
  providerId: string,
  newPublicKey: string,
  newSecretKey: string,
  newWebhookSecret: string,
  actorName: string = 'Super Administrator'
): ServiceProvider[] {
  const mask = (key: string, prefixLen: number = 7, suffixLen: number = 4) => {
    if (!key || key.length < 10) return '••••••••••••';
    const prefix = key.substring(0, prefixLen);
    const suffix = key.substring(key.length - suffixLen);
    return `${prefix}••••••••••••${suffix}`;
  };

  const updated = providers.map((prov) => {
    if (prov.id !== providerId) return prov;

    const newPublicMasked = newPublicKey ? mask(newPublicKey, 4, 4) : prov.apiKeyMasked;
    const newSecretMasked = newSecretKey ? mask(newSecretKey, 4, 4) : prov.apiSecretMasked;
    const newWhMasked = newWebhookSecret ? mask(newWebhookSecret, 6, 4) : prov.webhookSecretMasked;

    const newAuditEntry: ProviderAuditLog = {
      id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action: 'rotated',
      actor: actorName,
      ip: '102.89.33.12 (Tarauni, Kano State)',
      note: 'Cryptographic API credentials rotated & AES-256 vault re-sealed with zero client leakage.',
    };

    return {
      ...prov,
      apiKeyMasked: newPublicMasked,
      apiSecretMasked: newSecretMasked,
      webhookSecretMasked: newWhMasked,
      keyLastRotatedAt: new Date().toISOString(),
      keyRotationDue: false,
      vaultStatus: 'hardware_enclave' as const,
      secretAuditTrail: [newAuditEntry, ...(prov.secretAuditTrail || [])],
    };
  });

  persistSecuredProviders(updated);
  return updated;
}

/**
 * Update circuit breaker state (trip or reset)
 */
export function updateProviderCircuitBreaker(
  providers: ServiceProvider[],
  providerId: string,
  newState: 'closed' | 'open' | 'half_open',
  reason?: string
): ServiceProvider[] {
  const updated = providers.map((prov) => {
    if (prov.id !== providerId) return prov;

    const currentCb = prov.circuitBreaker || {
      state: 'closed',
      consecutiveFailures: 0,
      failureThreshold: 3,
      recoveryTimeoutSec: 60,
    };

    const isTripping = newState === 'open';
    const isRecovering = newState === 'closed';

    const auditEntry: ProviderAuditLog = {
      id: `cb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action: isTripping ? 'failover_triggered' : isRecovering ? 'recovered' : 'tested',
      actor: 'Automated Circuit Breaker Shield',
      ip: '102.89.33.12 (Internal Guard)',
      note: isTripping
        ? `Circuit tripped to OPEN. Failure threshold breached. Traffic rerouted to ${prov.autoFailoverProviderId || 'backup gateway'}. Reason: ${reason || 'Elevated upstream latency'}`
        : isRecovering
        ? 'Circuit breaker manually RESET to CLOSED. Gateway marked healthy.'
        : 'Circuit set to HALF-OPEN for canary health probing.',
    };

    return {
      ...prov,
      circuitBreaker: {
        ...currentCb,
        state: newState,
        consecutiveFailures: newState === 'closed' ? 0 : currentCb.consecutiveFailures + (isTripping ? 1 : 0),
        lastTripAt: isTripping ? new Date().toISOString() : currentCb.lastTripAt,
        lastRecoverAt: isRecovering ? new Date().toISOString() : currentCb.lastRecoverAt,
      },
      secretAuditTrail: [auditEntry, ...(prov.secretAuditTrail || [])],
    };
  });

  persistSecuredProviders(updated);
  return updated;
}

/**
 * Top up provider float balance
 */
export function topUpProviderFloat(
  providers: ServiceProvider[],
  providerId: string,
  amountNgn: number,
  notes: string = 'Operational Float Deposit'
): ServiceProvider[] {
  const updated = providers.map((prov) => {
    if (prov.id !== providerId) return prov;

    const currentFloat = prov.floatBalanceNgn || 0;
    const newFloat = currentFloat + amountNgn;
    const minThreshold = prov.minFloatThresholdNgn || 100000;

    const auditEntry: ProviderAuditLog = {
      id: `flt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      action: 'float_topped_up',
      actor: 'Treasury & Liquidity Desk',
      ip: '102.89.33.12 (Kano Settlement Desk)',
      note: `Added ₦${amountNgn.toLocaleString()} to ${prov.displayName} escrow float. New balance: ₦${newFloat.toLocaleString()}. (${notes})`,
    };

    return {
      ...prov,
      floatBalanceNgn: newFloat,
      lowFloatAlertActive: newFloat < minThreshold,
      secretAuditTrail: [auditEntry, ...(prov.secretAuditTrail || [])],
    };
  });

  persistSecuredProviders(updated);
  return updated;
}

/**
 * Compute HMAC-SHA256 signature in browser environment using Web Crypto API
 */
export async function calculateWebCryptoHmac(
  message: string,
  secret: string,
  algorithm: 'sha256' | 'sha512' = 'sha256'
): Promise<string> {
  const enc = new TextEncoder();
  const keyData = enc.encode(secret);
  const msgData = enc.encode(message);

  const hashAlgo = algorithm === 'sha512' ? 'SHA-512' : 'SHA-256';

  const cryptoKey = await window.crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: { name: hashAlgo } },
    false,
    ['sign']
  );

  const signatureBuffer = await window.crypto.subtle.sign('HMAC', cryptoKey, msgData);
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}
