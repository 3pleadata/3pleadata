import {Router, type NextFunction, type Request, type Response} from 'express';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import {
  authorizationCodeGrant,
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  discovery,
  randomNonce,
  randomPKCECodeVerifier,
  randomState,
} from 'openid-client';
import {Pool} from 'pg';

type AdminRole = 'administrator' | 'super_admin';

interface AdminSessionUser {
  issuer: string;
  subject: string;
  email: string;
  name: string;
  role: AdminRole;
}

interface OidcFlow {
  state: string;
  nonce: string;
  codeVerifier: string;
}

declare module 'express-session' {
  interface SessionData {
    admin?: AdminSessionUser;
    oidcFlow?: OidcFlow;
  }
}

const databaseUrl = process.env.ADMIN_DATABASE_URL;
const sessionSecret = process.env.ADMIN_SESSION_SECRET;
const oidcIssuer = process.env.ADMIN_OIDC_ISSUER_URL;
const oidcClientId = process.env.ADMIN_OIDC_CLIENT_ID;
const oidcClientSecret = process.env.ADMIN_OIDC_CLIENT_SECRET;
const oidcRedirectUri = process.env.ADMIN_OIDC_REDIRECT_URI;
const adminAppOrigin = process.env.ADMIN_APP_ORIGIN;
const rolesClaimName = process.env.ADMIN_OIDC_ROLES_CLAIM || 'roles';
const allowedRoles = (process.env.ADMIN_OIDC_ALLOWED_ROLES || 'administrator,super_admin')
  .split(',')
  .map((role) => role.trim())
  .filter((role): role is AdminRole => role === 'administrator' || role === 'super_admin');
const cookieSameSite = process.env.ADMIN_SESSION_COOKIE_SAME_SITE || 'lax';
const sessionCookieName = '3plea_admin.sid';

function validUrl(value: string | undefined, protocol?: string): boolean {
  if (!value) return false;
  try {
    const url = new URL(value);
    return (!protocol || url.protocol === protocol) &&
      !url.username &&
      !url.password;
  } catch {
    return false;
  }
}

const productionTransportIsSecure =
  process.env.NODE_ENV !== 'production' ||
  (validUrl(oidcIssuer, 'https:') &&
    validUrl(oidcRedirectUri, 'https:') &&
    validUrl(adminAppOrigin, 'https:'));
const configured = Boolean(
  databaseUrl &&
  sessionSecret &&
  Buffer.byteLength(sessionSecret, 'utf8') >= 32 &&
  (validUrl(databaseUrl, 'postgres:') || validUrl(databaseUrl, 'postgresql:')) &&
  oidcIssuer &&
  validUrl(oidcIssuer) &&
  oidcClientId &&
  oidcClientSecret &&
  oidcRedirectUri &&
  validUrl(oidcRedirectUri) &&
  adminAppOrigin &&
  validUrl(adminAppOrigin) &&
  new URL(adminAppOrigin).origin === adminAppOrigin &&
  allowedRoles.length > 0 &&
  ['strict', 'lax', 'none'].includes(cookieSameSite) &&
  productionTransportIsSecure
);

const router = Router();
let pool: Pool | undefined;
let oidcConfiguration: ReturnType<typeof discovery> | undefined;

if (configured && databaseUrl && sessionSecret) {
  pool = new Pool({connectionString: databaseUrl});
  pool.on('error', (error) => {
    logAdminError('database pool', error);
  });
  const PgSession = connectPgSimple(session);
  router.use(session({
    name: sessionCookieName,
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    store: new PgSession({
      pool,
      tableName: 'admin_sessions',
      createTableIfMissing: true,
    }),
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || cookieSameSite === 'none',
      sameSite: cookieSameSite as 'strict' | 'lax' | 'none',
      maxAge: 60 * 60 * 1000,
      path: '/',
    },
  }));
}

function getOidcConfiguration() {
  if (!oidcConfiguration) {
    if (!oidcIssuer || !oidcClientId || !oidcClientSecret) {
      throw new Error('Admin OIDC configuration is incomplete.');
    }
    const pending = discovery(
      new URL(oidcIssuer),
      oidcClientId,
      oidcClientSecret
    );
    oidcConfiguration = pending;
    void pending.catch(() => {
      if (oidcConfiguration === pending) oidcConfiguration = undefined;
    });
  }
  return oidcConfiguration;
}

function requireConfigured(_req: Request, res: Response, next: NextFunction) {
  if (!configured || !pool) {
    res.status(503).json({
      error: 'ADMIN_SERVICE_UNAVAILABLE',
      message: 'Admin authentication and data services are not configured.',
    });
    return;
  }
  next();
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.admin) {
    res.status(401).json({
      error: 'ADMIN_AUTHENTICATION_REQUIRED',
      message: 'Sign in with an authorized administrator account.',
    });
    return;
  }
  next();
}

function getClaimRoles(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((role): role is string => typeof role === 'string');
  }
  if (typeof value === 'string') {
    return value.split(/[ ,]/).filter(Boolean);
  }
  return [];
}

function numberValue(value: string | number | null | undefined): number {
  return Number(value ?? 0);
}

function logAdminError(action: string, error: unknown) {
  console.error(`Admin ${action} failed:`, error);
}

router.get('/auth/status', (_req, res) => {
  res.json({enabled: configured});
});

router.get('/auth/login', requireConfigured, async (req, res, next) => {
  try {
    if (!oidcRedirectUri) {
      throw new Error('Admin OIDC redirect URI is not configured.');
    }
    const verifier = randomPKCECodeVerifier();
    const [challenge, state, nonce, configuration] = await Promise.all([
      calculatePKCECodeChallenge(verifier),
      Promise.resolve(randomState()),
      Promise.resolve(randomNonce()),
      getOidcConfiguration(),
    ]);
    req.session.oidcFlow = {state, nonce, codeVerifier: verifier};
    await new Promise<void>((resolve, reject) => {
      req.session.save((error) => error ? reject(error) : resolve());
    });
    const authorizationUrl = buildAuthorizationUrl(configuration, {
      redirect_uri: oidcRedirectUri,
      scope: 'openid email profile',
      response_type: 'code',
      code_challenge: challenge,
      code_challenge_method: 'S256',
      state,
      nonce,
    });
    res.redirect(authorizationUrl.href);
  } catch (error) {
    logAdminError('login initialization', error);
    next(error);
  }
});

router.get('/auth/callback', requireConfigured, async (req, res, next) => {
  try {
    if (!pool || !oidcRedirectUri || !oidcIssuer || !adminAppOrigin) {
      throw new Error('Admin OIDC configuration is incomplete.');
    }
    const flow = req.session.oidcFlow;
    if (!flow) {
      res.status(400).json({error: 'INVALID_LOGIN_FLOW', message: 'Restart the sign-in flow.'});
      return;
    }

    const tokenSet = await authorizationCodeGrant(
      await getOidcConfiguration(),
      new URL(req.originalUrl, oidcRedirectUri),
      {
        pkceCodeVerifier: flow.codeVerifier,
        expectedState: flow.state,
        expectedNonce: flow.nonce,
      }
    );
    const claims = tokenSet.claims();
    if (!claims) {
      res.status(401).json({error: 'INVALID_IDENTITY', message: 'The identity provider returned no identity claims.'});
      return;
    }
    const subject = claims.sub;
    if (!subject) {
      res.status(401).json({error: 'INVALID_IDENTITY', message: 'The identity provider returned no subject.'});
      return;
    }

    const roleClaims = getClaimRoles(claims[rolesClaimName]);
    const role = allowedRoles.find((allowedRole) => roleClaims.includes(allowedRole));
    if (!role) {
      req.session.destroy((error) => {
        if (error) logAdminError('unauthorized session cleanup', error);
      });
      res.status(403).json({
        error: 'ADMIN_ROLE_REQUIRED',
        message: 'This account does not have an authorized administrator role.',
      });
      return;
    }

    const email = typeof claims.email === 'string' ? claims.email : '';
    const name = typeof claims.name === 'string' ? claims.name : email;
    if (!email || claims.email_verified !== true) {
      res.status(403).json({
        error: 'ADMIN_EMAIL_REQUIRED',
        message: 'The identity provider must supply a verified email address.',
      });
      return;
    }

    await pool.query(
      `INSERT INTO admin_identities (issuer, subject, email, display_name, role, last_login_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (issuer, subject)
       DO UPDATE SET email = EXCLUDED.email,
                     display_name = EXCLUDED.display_name,
                     role = EXCLUDED.role,
                     last_login_at = NOW()`,
      [oidcIssuer, subject, email, name, role]
    );

    await new Promise<void>((resolve, reject) => {
      req.session.regenerate((error) => error ? reject(error) : resolve());
    });
    req.session.admin = {issuer: oidcIssuer, subject, email, name, role};
    await new Promise<void>((resolve, reject) => {
      req.session.save((error) => error ? reject(error) : resolve());
    });
    res.redirect(adminAppOrigin);
  } catch (error) {
    logAdminError('login callback', error);
    next(error);
  }
});

router.get('/auth/me', requireConfigured, requireAdmin, (req, res) => {
  const user = req.session.admin;
  if (!user) {
    res.status(401).json({error: 'ADMIN_AUTHENTICATION_REQUIRED'});
    return;
  }
  res.json({user: {email: user.email, name: user.name, role: user.role}});
});

router.post('/auth/logout', requireConfigured, requireAdmin, (req, res, next) => {
  req.session.destroy((error) => {
    if (error) {
      logAdminError('logout', error);
      next(error);
      return;
    }
    res.clearCookie(sessionCookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || cookieSameSite === 'none',
      sameSite: cookieSameSite as 'strict' | 'lax' | 'none',
      path: '/',
    });
    res.json({ok: true});
  });
});

router.get('/overview', requireConfigured, requireAdmin, async (_req, res, next) => {
  try {
    if (!pool) {
      throw new Error('Admin database is unavailable.');
    }
    const [userTotals, transactionTotals, providers, recentTransactions] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total,
                COUNT(*) FILTER (WHERE status = 'active') AS active,
                COUNT(*) FILTER (WHERE status = 'suspended') AS suspended,
                COUNT(*) FILTER (WHERE status IN ('pending', 'pending_verification')) AS pending
         FROM admin_dashboard_users`
      ),
      pool.query(
        `SELECT COUNT(*) AS total,
                COALESCE(SUM(total_debited) FILTER (WHERE status = 'successful'), 0) AS volume,
                COUNT(*) FILTER (WHERE status = 'successful') AS successful,
                COUNT(*) FILTER (WHERE status IN ('pending', 'initiated')) AS pending,
                COUNT(*) FILTER (WHERE status = 'failed') AS failed
         FROM admin_dashboard_transactions`
      ),
      pool.query(
        `SELECT id, name, status, latency_ms, last_checked_at
         FROM admin_dashboard_providers
         ORDER BY name ASC`
      ),
      pool.query(
        `SELECT id, reference, type, amount, status, provider, created_at
         FROM admin_dashboard_transactions
         ORDER BY created_at DESC
         LIMIT 10`
      ),
    ]);

    const users = userTotals.rows[0];
    const transactions = transactionTotals.rows[0];
    res.json({
      overview: {
        generatedAt: new Date().toISOString(),
        users: {
          total: numberValue(users.total),
          active: numberValue(users.active),
          suspended: numberValue(users.suspended),
          pending: numberValue(users.pending),
        },
        transactions: {
          total: numberValue(transactions.total),
          volume: numberValue(transactions.volume),
          successful: numberValue(transactions.successful),
          pending: numberValue(transactions.pending),
          failed: numberValue(transactions.failed),
        },
        providers: providers.rows.map((provider) => ({
          id: provider.id,
          name: provider.name,
          status: provider.status,
          latencyMs: provider.latency_ms === null ? null : numberValue(provider.latency_ms),
          lastCheckedAt: provider.last_checked_at,
        })),
        recentTransactions: recentTransactions.rows.map((transaction) => ({
          id: transaction.id,
          reference: transaction.reference,
          type: transaction.type,
          amount: numberValue(transaction.amount),
          status: transaction.status,
          provider: transaction.provider,
          createdAt: transaction.created_at,
        })),
      },
    });
  } catch (error) {
    logAdminError('overview query', error);
    next(error);
  }
});

export default router;
