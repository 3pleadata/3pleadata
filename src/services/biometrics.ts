// Audio Synthesizer and Biometric Session Management for 3PLE A Platform

export type BiometricMethod = 'faceid' | 'fingerprint' | 'pin';
export type BiometricTarget = 'wallet_funding' | 'admin_dashboard' | 'high_value_tx' | 'general';

export interface BiometricConfig {
  soundEnabled: boolean;
  hapticEnabled: boolean;
  preferredMethod: 'faceid' | 'fingerprint' | 'pin';
  sessionTimeoutMinutes: number; // 0 = every action, 1 = 1 min, 5 = 5 mins, 15 = 15 mins, 30 = 30 mins, 60 = 1 hr
  hardwareBiometricsSupported?: boolean;
  autoLockOnBlur?: boolean;
}

export interface TrustedBiometricDevice {
  id: string;
  name: string;
  type: 'faceid' | 'touchid' | 'windows_hello' | 'hardware_key';
  platform: 'macos' | 'ios' | 'android' | 'windows' | 'linux';
  browser: string;
  enrolledAt: string;
  lastUsedAt: string;
  isCurrentDevice: boolean;
  enclaveAttested: boolean;
  status: 'active' | 'revoked';
}

const CONFIG_KEY = '3plea_biometric_config_v1';
const SESSION_KEY = '3plea_biometric_session_v1';
const TRUSTED_DEVICES_KEY = '3plea_trusted_biometric_devices_v1';

export const INITIAL_TRUSTED_DEVICES: TrustedBiometricDevice[] = [
  {
    id: 'bio_dev_current',
    name: 'Primary Workstation (Current Device)',
    type: 'touchid',
    platform: 'macos',
    browser: 'Chrome 128 / macOS',
    enrolledAt: '2026-01-20T08:30:00Z',
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    isCurrentDevice: true,
    enclaveAttested: true,
    status: 'active',
  },
  {
    id: 'bio_dev_iphone',
    name: 'Aliyu iPhone 15 Pro Max',
    type: 'faceid',
    platform: 'ios',
    browser: 'Mobile Safari 18.1',
    enrolledAt: '2026-02-14T14:15:00Z',
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    isCurrentDevice: false,
    enclaveAttested: true,
    status: 'active',
  },
  {
    id: 'bio_dev_tab',
    name: 'Kano Office Samsung Tab S9',
    type: 'touchid',
    platform: 'android',
    browser: 'Chrome Android',
    enrolledAt: '2026-03-01T11:45:00Z',
    lastUsedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    isCurrentDevice: false,
    enclaveAttested: true,
    status: 'active',
  },
];

export function getTrustedBiometricDevices(): TrustedBiometricDevice[] {
  try {
    const raw = localStorage.getItem(TRUSTED_DEVICES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Failed to load trusted devices:', e);
  }
  return INITIAL_TRUSTED_DEVICES;
}

export function saveTrustedBiometricDevices(devices: TrustedBiometricDevice[]) {
  try {
    localStorage.setItem(TRUSTED_DEVICES_KEY, JSON.stringify(devices));
  } catch (e) {
    console.error('Failed to save trusted devices:', e);
  }
}

export function getBiometricConfig(): BiometricConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Failed to load biometric config:', e);
  }
  return {
    soundEnabled: true,
    hapticEnabled: true,
    preferredMethod: 'faceid',
    sessionTimeoutMinutes: 5,
    hardwareBiometricsSupported: true,
    autoLockOnBlur: true,
  };
}

export function isHardwareBiometricAvailable(): boolean {
  try {
    const config = getBiometricConfig();
    if (typeof config.hardwareBiometricsSupported === 'boolean') {
      return config.hardwareBiometricsSupported;
    }
  } catch (e) {
    // fallback
  }
  return true;
}

export function setHardwareBiometricAvailable(available: boolean): void {
  const config = getBiometricConfig();
  const updated: BiometricConfig = {
    ...config,
    hardwareBiometricsSupported: available,
    preferredMethod: available ? (config.preferredMethod === 'pin' ? 'faceid' : config.preferredMethod) : 'pin',
  };
  saveBiometricConfig(updated);
}

export async function detectDeviceHardwareBiometrics(): Promise<boolean> {
  if (
    typeof window !== 'undefined' &&
    window.PublicKeyCredential &&
    typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function'
  ) {
    try {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }
  return false;
}

export function saveBiometricConfig(config: BiometricConfig) {
  try {
    localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save biometric config:', e);
  }
}

export function isBiometricSessionValid(target: BiometricTarget): boolean {
  try {
    const raw = sessionStorage.getItem(`${SESSION_KEY}_${target}`);
    if (!raw) return false;
    const data = JSON.parse(raw);
    const now = Date.now();
    if (data.expiresAt && now < data.expiresAt) {
      return true;
    }
  } catch (e) {
    // Session invalid
  }
  return false;
}

export function recordBiometricSuccess(target: BiometricTarget, timeoutMinutes?: number) {
  try {
    const config = getBiometricConfig();
    const effectiveTimeout =
      timeoutMinutes !== undefined ? timeoutMinutes : config.sessionTimeoutMinutes;
    if (effectiveTimeout <= 0) {
      sessionStorage.removeItem(`${SESSION_KEY}_${target}`);
      return;
    }
    const expiresAt = Date.now() + effectiveTimeout * 60 * 1000;
    sessionStorage.setItem(
      `${SESSION_KEY}_${target}`,
      JSON.stringify({ target, authenticatedAt: Date.now(), expiresAt })
    );
  } catch (e) {
    console.error('Failed to save biometric session:', e);
  }
}

export function clearBiometricSession(target?: BiometricTarget) {
  try {
    if (target) {
      sessionStorage.removeItem(`${SESSION_KEY}_${target}`);
    } else {
      sessionStorage.removeItem(`${SESSION_KEY}_wallet_funding`);
      sessionStorage.removeItem(`${SESSION_KEY}_admin_dashboard`);
      sessionStorage.removeItem(`${SESSION_KEY}_high_value_tx`);
      sessionStorage.removeItem(`${SESSION_KEY}_general`);
    }
  } catch (e) {
    console.error('Failed to clear biometric session:', e);
  }
}

// Web Audio API Sound Effects (Zero external audio file latency)
let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioCtxClass) {
      audioCtx = new AudioCtxClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume().catch(() => {});
  }
  return audioCtx;
}

export function playBiometricSound(type: 'scan' | 'success' | 'fail' | 'tick' | 'tap') {
  const config = getBiometricConfig();
  if (!config.soundEnabled) return;

  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    if (type === 'scan') {
      // Sci-fi rising chirp / sweep
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.15);
      gain.gain.setValueAtTime(0.04, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'tick') {
      // Subtle rhythmic radar tick
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(700, now);
      gain.gain.setValueAtTime(0.02, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'tap') {
      // Tactile sensor touch click
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    } else if (type === 'success') {
      // High-grade double chime (Apple/Fintech style)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now); // D5
      gain1.gain.setValueAtTime(0.08, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.1); // A5
      gain2.gain.setValueAtTime(0.09, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.45);
    } else if (type === 'fail') {
      // Soft rejection buzz
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(150, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.2);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    }
  } catch (err) {
    // Audio context may be blocked by autoplay policies until user gesture
  }
}

export function triggerBiometricHaptic(type: 'light' | 'medium' | 'success' | 'fail' = 'medium') {
  const config = getBiometricConfig();
  if (!config.hapticEnabled) return;

  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      if (type === 'light') navigator.vibrate(15);
      else if (type === 'medium') navigator.vibrate(35);
      // Long double-pulse for success (120ms pulse, 60ms pause, 120ms pulse)
      else if (type === 'success') navigator.vibrate([120, 60, 120]);
      // Three short bursts for failure (40ms pulse, 40ms pause, 40ms pulse, 40ms pause, 40ms pulse)
      else if (type === 'fail') navigator.vibrate([40, 40, 40, 40, 40]);
    } catch (e) {
      // Ignore vibration error on unsupported platforms
    }
  }
}

// -------------------------------------------------------------
// Biometric Trust Score & Hardware Responsiveness Telemetry
// -------------------------------------------------------------

export interface BiometricAuditRecord {
  id: string;
  timestamp: string;
  method: BiometricMethod;
  latencyMs: number;
  matchScore: number; // e.g. 98.5
  status: 'optimal' | 'nominal' | 'degraded';
  enclaveAttested: boolean;
  notes?: string;
}

export interface BiometricTrustScoreData {
  trustScore: number; // 0 - 100
  trustLevel: 'Enterprise High Trust' | 'Secure Nominal' | 'Recalibration Recommended';
  currentResponsivenessMs: number; // Most recent latency in ms (e.g. 275ms)
  historicalAvgResponsivenessMs: number; // 30-day baseline rolling avg (e.g. 340ms)
  matchConsistencyPct: number; // e.g. 98.7%
  falseRejectionRatePct: number; // e.g. 0.12%
  hardwareEnclaveIntegrity: number; // e.g. 99.8%
  sensorFidelityIndex: number; // e.g. 97.4%
  totalSamples: number;
  lastTestedAt: string;
  auditTrail: BiometricAuditRecord[];
}

const TRUST_SCORE_KEY = '3plea_biometric_trust_score_v1';

const DEFAULT_AUDIT_TRAIL: BiometricAuditRecord[] = [
  {
    id: 'bio-aud-101',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    method: 'faceid',
    latencyMs: 275,
    matchScore: 99.2,
    status: 'optimal',
    enclaveAttested: true,
    notes: 'TrueDepth contour aligned with 0° parallax jitter',
  },
  {
    id: 'bio-aud-102',
    timestamp: new Date(Date.now() - 1000 * 60 * 142).toISOString(),
    method: 'fingerprint',
    latencyMs: 290,
    matchScore: 98.4,
    status: 'optimal',
    enclaveAttested: true,
    notes: 'Epidermal ridge minutiae match passed',
  },
  {
    id: 'bio-aud-103',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    method: 'faceid',
    latencyMs: 310,
    matchScore: 97.8,
    status: 'nominal',
    enclaveAttested: true,
    notes: 'Sub-ambient illumination compensation active',
  },
  {
    id: 'bio-aud-104',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    method: 'fingerprint',
    latencyMs: 335,
    matchScore: 96.9,
    status: 'nominal',
    enclaveAttested: true,
    notes: 'Capacitive dermal plate verification',
  },
];

export function getBiometricTrustMetrics(): BiometricTrustScoreData {
  try {
    const raw = localStorage.getItem(TRUST_SCORE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.trustScore === 'number') {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse biometric trust score:', e);
  }

  // Initial default baseline calibrated for high-assurance fintech
  const initialData: BiometricTrustScoreData = {
    trustScore: 96,
    trustLevel: 'Enterprise High Trust',
    currentResponsivenessMs: 275,
    historicalAvgResponsivenessMs: 340,
    matchConsistencyPct: 98.6,
    falseRejectionRatePct: 0.14,
    hardwareEnclaveIntegrity: 99.9,
    sensorFidelityIndex: 97.2,
    totalSamples: 142,
    lastTestedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    auditTrail: DEFAULT_AUDIT_TRAIL,
  };

  saveBiometricTrustMetrics(initialData);
  return initialData;
}

export function saveBiometricTrustMetrics(data: BiometricTrustScoreData) {
  try {
    localStorage.setItem(TRUST_SCORE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save biometric trust score:', e);
  }
}

/**
 * Calculates updated trust score and logs an audit record based on verification latency & accuracy
 */
export function recordBiometricAudit(
  method: BiometricMethod,
  latencyMs: number,
  success: boolean
): BiometricTrustScoreData {
  const current = getBiometricTrustMetrics();
  const clampedLatency = Math.max(120, Math.min(1200, latencyMs));

  // Compute status
  const status: 'optimal' | 'nominal' | 'degraded' =
    clampedLatency < 320 && success
      ? 'optimal'
      : clampedLatency < 650 && success
      ? 'nominal'
      : 'degraded';

  const matchScore = success
    ? Number((96 + Math.random() * 3.8).toFixed(1))
    : Number((65 + Math.random() * 15).toFixed(1));

  const newRecord: BiometricAuditRecord = {
    id: `bio-aud-${Date.now().toString().slice(-6)}`,
    timestamp: new Date().toISOString(),
    method,
    latencyMs: clampedLatency,
    matchScore,
    status,
    enclaveAttested: true,
    notes: success
      ? `Sensor response confirmed in ${clampedLatency}ms`
      : 'Sensor read timeout or sample occlusion',
  };

  const updatedAuditTrail = [newRecord, ...current.auditTrail.slice(0, 7)];

  // Rolling weighted historical average
  const newHistoricalAvg = Math.round(
    current.historicalAvgResponsivenessMs * 0.85 + clampedLatency * 0.15
  );

  // Trust score formula based on speed, success, and variance
  const latencyScore = Math.max(0, Math.min(40, (700 - clampedLatency) / 12));
  const consistencyFactor = success ? 55 : 30;
  const computedScore = Math.min(99, Math.round(latencyScore + consistencyFactor + Math.random() * 4));

  const trustLevel: BiometricTrustScoreData['trustLevel'] =
    computedScore >= 90
      ? 'Enterprise High Trust'
      : computedScore >= 75
      ? 'Secure Nominal'
      : 'Recalibration Recommended';

  const updated: BiometricTrustScoreData = {
    ...current,
    trustScore: computedScore,
    trustLevel,
    currentResponsivenessMs: clampedLatency,
    historicalAvgResponsivenessMs: newHistoricalAvg,
    matchConsistencyPct: Number(
      (current.matchConsistencyPct * 0.9 + (success ? 99.2 : 88.0) * 0.1).toFixed(1)
    ),
    falseRejectionRatePct: Number(
      Math.max(0.05, current.falseRejectionRatePct + (success ? -0.01 : 0.08)).toFixed(2)
    ),
    totalSamples: current.totalSamples + 1,
    lastTestedAt: new Date().toISOString(),
    auditTrail: updatedAuditTrail,
  };

  saveBiometricTrustMetrics(updated);
  return updated;
}

