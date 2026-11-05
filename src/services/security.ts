// Security, Auto-Logout & Inactivity Session Locking Management for 3PLE A Platform

export interface AutoLogoutConfig {
  enabled: boolean;
  timeoutMinutes: number; // 1, 2, 5, 10, 15, 30, 60
  warningSeconds: number; // e.g. 30 seconds countdown before locking
  lockOnBlur: boolean;
  soundAlertOnLock: boolean;
}

const AUTO_LOGOUT_CONFIG_KEY = '3plea_auto_logout_config_v1';
const LAST_ACTIVITY_KEY = '3plea_last_user_activity_v1';
const SESSION_LOCKED_KEY = '3plea_session_locked_state_v1';
const SECURITY_PIN_KEY = '3plea_security_pin_v1';
const DEFAULT_SECURITY_PIN = '1234';

export const DEFAULT_AUTO_LOGOUT_CONFIG: AutoLogoutConfig = {
  enabled: true,
  timeoutMinutes: 5, // Recommended fintech standard
  warningSeconds: 30, // 30-second countdown warning before locking
  lockOnBlur: false,
  soundAlertOnLock: true,
};

export function getAutoLogoutConfig(): AutoLogoutConfig {
  try {
    const raw = localStorage.getItem(AUTO_LOGOUT_CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_AUTO_LOGOUT_CONFIG,
        ...parsed,
      };
    }
  } catch (e) {
    console.error('Failed to load auto-logout config:', e);
  }
  return DEFAULT_AUTO_LOGOUT_CONFIG;
}

export function saveAutoLogoutConfig(config: AutoLogoutConfig): void {
  try {
    localStorage.setItem(AUTO_LOGOUT_CONFIG_KEY, JSON.stringify(config));
  } catch (e) {
    console.error('Failed to save auto-logout config:', e);
  }
}

export function recordUserActivity(): void {
  try {
    sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  } catch (e) {
    // sessionStorage might be restricted
  }
}

export function getLastUserActivity(): number {
  try {
    const raw = sessionStorage.getItem(LAST_ACTIVITY_KEY);
    if (raw) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed) && parsed > 0) return parsed;
    }
  } catch (e) {
    // fallback
  }
  return Date.now();
}

export function isSessionLocked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_LOCKED_KEY) === 'true';
  } catch {
    return false;
  }
}

export function setSessionLocked(locked: boolean, reason?: string): void {
  try {
    if (locked) {
      sessionStorage.setItem(SESSION_LOCKED_KEY, 'true');
      if (reason) {
        sessionStorage.setItem(`${SESSION_LOCKED_KEY}_reason`, reason);
      }
    } else {
      sessionStorage.removeItem(SESSION_LOCKED_KEY);
      sessionStorage.removeItem(`${SESSION_LOCKED_KEY}_reason`);
      recordUserActivity();
    }
  } catch (e) {
    console.error('Failed to update session lock state:', e);
  }
}

export function getSessionLockReason(): string {
  try {
    return sessionStorage.getItem(`${SESSION_LOCKED_KEY}_reason`) || 'inactivity';
  } catch {
    return 'inactivity';
  }
}

export function getSecurityPin(): string {
  try {
    return localStorage.getItem(SECURITY_PIN_KEY) || DEFAULT_SECURITY_PIN;
  } catch {
    return DEFAULT_SECURITY_PIN;
  }
}

export function saveSecurityPin(pin: string): void {
  try {
    localStorage.setItem(SECURITY_PIN_KEY, pin);
  } catch (e) {
    console.error('Failed to save security PIN:', e);
  }
}

export function verifySecurityPin(enteredPin: string): boolean {
  const currentPin = getSecurityPin();
  return enteredPin.trim() === currentPin.trim();
}
