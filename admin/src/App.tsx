import {useCallback, useEffect, useState} from 'react';
import {
  Activity,
  CircleAlert,
  CircleCheck,
  CircleDollarSign,
  Clock3,
  Database,
  LoaderCircle,
  LogOut,
  RefreshCw,
  ServerCog,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import type {AdminIdentity, AdminOverview} from './types';

const API_BASE = (import.meta.env.VITE_ADMIN_API_BASE_URL || '/api/v1').replace(/\/$/, '');
const money = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0,
});
const numbers = new Intl.NumberFormat('en-NG');

type LoadState = 'loading' | 'ready' | 'signed-out' | 'unavailable' | 'error';

async function requestJson<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    credentials: 'include',
    headers: {
      Accept: 'application/json',
      ...init?.headers,
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => null) as {message?: string} | null;
    throw Object.assign(new Error(body?.message || `Request failed (${response.status})`), {
      status: response.status,
    });
  }
  return response.json() as Promise<T>;
}

function isHttpError(error: unknown, status: number): boolean {
  return typeof error === 'object' && error !== null && 'status' in error &&
    (error as {status?: number}).status === status;
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('en-NG', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function StatusBadge({status}: {status: string}) {
  const style = status === 'successful' || status === 'active'
    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20'
    : status === 'pending' || status === 'initiated' || status === 'degraded'
      ? 'bg-amber-50 text-amber-700 ring-amber-600/20'
      : status === 'failed' || status === 'suspended' || status === 'disabled'
        ? 'bg-rose-50 text-rose-700 ring-rose-600/20'
        : 'bg-slate-100 text-slate-600 ring-slate-500/20';

  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-bold capitalize ring-1 ring-inset ${style}`}>
      {status.replaceAll('_', ' ')}
    </span>
  );
}

function StatCard({
  title,
  value,
  detail,
  icon: Icon,
  tone,
}: {
  title: string;
  value: string;
  detail: string;
  icon: typeof UsersRound;
  tone: 'blue' | 'green' | 'amber' | 'violet';
}) {
  const tones = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    violet: 'bg-violet-50 text-violet-700',
  };

  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm shadow-slate-200/50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>
          <p className="mt-3 text-2xl font-extrabold tracking-tight text-slate-950">{value}</p>
          <p className="mt-2 text-xs text-slate-500">{detail}</p>
        </div>
        <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${tones[tone]}`}>
          <Icon className="h-5 w-5" aria-hidden="true" />
        </div>
      </div>
    </article>
  );
}

function SignIn({enabled, error}: {enabled: boolean; error?: string}) {
  return (
    <main className="grid min-h-screen place-items-center px-5 py-12">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/60">
        <div className="mb-8 flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl bg-slate-950 text-amber-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-extrabold tracking-tight text-slate-950">3PLE A Admin</p>
            <p className="text-xs font-medium text-slate-500">Secure operations portal</p>
          </div>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-950">Administrator sign in</h1>
        <p className="mt-2 text-sm leading-6 text-slate-500">
          Sign in with your organization account. Access is limited to authorized administrator roles.
        </p>
        {error && (
          <div role="alert" className="mt-6 flex gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {enabled ? (
          <a
            href={`${API_BASE}/admin/auth/login`}
            className="mt-7 flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-300"
          >
            <ShieldCheck className="h-4 w-4 text-amber-400" />
            Continue with organization account
          </a>
        ) : (
          <div role="status" className="mt-7 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
            Admin sign-in is unavailable until the server, database, and OIDC provider are configured.
          </div>
        )}
        <p className="mt-6 text-center text-xs text-slate-400">
          This portal never uses the consumer app's locally stored demo account.
        </p>
      </section>
    </main>
  );
}

function Overview({data}: {data: AdminOverview}) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Successful transaction volume"
          value={money.format(data.transactions.volume)}
          detail={`${numbers.format(data.transactions.total)} recorded transactions`}
          icon={CircleDollarSign}
          tone="green"
        />
        <StatCard
          title="Successful transactions"
          value={numbers.format(data.transactions.successful)}
          detail={`${numbers.format(data.transactions.pending)} pending · ${numbers.format(data.transactions.failed)} failed`}
          icon={Activity}
          tone="blue"
        />
        <StatCard
          title="Platform users"
          value={numbers.format(data.users.total)}
          detail={`${numbers.format(data.users.active)} active · ${numbers.format(data.users.suspended)} suspended`}
          icon={UsersRound}
          tone="violet"
        />
        <StatCard
          title="Available providers"
          value={`${numbers.format(data.providers.filter((provider) => provider.status === 'active').length)} / ${numbers.format(data.providers.length)}`}
          detail="Provider status from the operations store"
          icon={ServerCog}
          tone="amber"
        />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.65fr_1fr]">
        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
            <div>
              <h2 className="font-bold text-slate-950">Recent transactions</h2>
              <p className="mt-1 text-xs text-slate-500">Latest activity recorded by the platform</p>
            </div>
            <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-bold text-slate-600">
              {data.recentTransactions.length} shown
            </span>
          </div>
          {data.recentTransactions.length === 0 ? (
            <div className="grid min-h-48 place-items-center px-6 text-center">
              <div>
                <Database className="mx-auto h-7 w-7 text-slate-300" />
                <p className="mt-3 text-sm font-semibold text-slate-700">No transaction data yet</p>
                <p className="mt-1 max-w-sm text-xs leading-5 text-slate-500">
                  This view will populate when the production transaction service writes to the admin data store.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-3 font-bold">Reference</th>
                    <th className="px-5 py-3 font-bold">Type</th>
                    <th className="px-5 py-3 font-bold">Amount</th>
                    <th className="px-5 py-3 font-bold">Status</th>
                    <th className="px-5 py-3 font-bold">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-slate-50/70">
                      <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">{transaction.reference}</td>
                      <td className="px-5 py-4 capitalize text-slate-600">{transaction.type.replaceAll('_', ' ')}</td>
                      <td className="px-5 py-4 font-semibold tabular-nums text-slate-900">{money.format(transaction.amount)}</td>
                      <td className="px-5 py-4"><StatusBadge status={transaction.status} /></td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-slate-500">{formatDate(transaction.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm shadow-slate-200/50">
          <div className="border-b border-slate-100 px-5 py-4">
            <h2 className="font-bold text-slate-950">Provider availability</h2>
            <p className="mt-1 text-xs text-slate-500">Current operational status</p>
          </div>
          {data.providers.length === 0 ? (
            <div className="grid min-h-48 place-items-center px-5 text-center text-sm text-slate-500">
              Provider data is not available yet.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.providers.map((provider) => (
                <li key={provider.id} className="flex items-center justify-between gap-4 px-5 py-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-800">{provider.name}</p>
                    <p className="mt-1 text-xs text-slate-500">
                      {provider.latencyMs === null ? 'Latency unavailable' : `${provider.latencyMs} ms`}
                    </p>
                  </div>
                  <StatusBadge status={provider.status} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}

export default function App() {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [identity, setIdentity] = useState<AdminIdentity | null>(null);
  const [data, setData] = useState<AdminOverview | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [busy, setBusy] = useState(false);

  const loadOverview = useCallback(async () => {
    setBusy(true);
    setErrorMessage('');
    try {
      const {overview} = await requestJson<{overview: AdminOverview}>(`${API_BASE}/admin/overview`);
      setData(overview);
      setLoadState('ready');
    } catch (error) {
      if (isHttpError(error, 401)) {
        setIdentity(null);
        setData(null);
        setLoadState('signed-out');
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : 'Unable to load the dashboard.');
      setLoadState('error');
    } finally {
      setBusy(false);
    }
  }, []);

  const initialize = useCallback(async () => {
    setLoadState('loading');
    setErrorMessage('');
    try {
      const status = await requestJson<{enabled: boolean}>(`${API_BASE}/admin/auth/status`);
      if (!status.enabled) {
        setLoadState('unavailable');
        return;
      }
      const {user} = await requestJson<{user: AdminIdentity}>(`${API_BASE}/admin/auth/me`);
      setIdentity(user);
      await loadOverview();
    } catch (error) {
      if (isHttpError(error, 401)) {
        setLoadState('signed-out');
        return;
      }
      setErrorMessage(error instanceof Error ? error.message : 'Unable to connect to the admin service.');
      setLoadState('error');
    }
  }, [loadOverview]);

  useEffect(() => {
    void initialize();
  }, [initialize]);

  const handleLogout = async () => {
    setBusy(true);
    try {
      await requestJson(`${API_BASE}/admin/auth/logout`, {method: 'POST'});
      setIdentity(null);
      setData(null);
      setLoadState('signed-out');
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'Sign out failed.');
    } finally {
      setBusy(false);
    }
  };

  if (loadState === 'loading') {
    return (
      <main className="grid min-h-screen place-items-center">
        <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
          <LoaderCircle className="h-5 w-5 animate-spin text-blue-600" />
          Connecting to the secure admin service…
        </div>
      </main>
    );
  }

  if (loadState === 'signed-out' || loadState === 'unavailable') {
    return <SignIn enabled={loadState === 'signed-out'} error={errorMessage || undefined} />;
  }

  if (loadState === 'error' && !identity) {
    return (
      <SignIn
        enabled
        error={errorMessage || 'The admin service could not be reached. Try again shortly.'}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-5 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-950 text-amber-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-extrabold tracking-tight text-slate-950">3PLE A</p>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Admin portal</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-right sm:block">
              <span className="block text-xs font-bold text-slate-800">{identity?.name}</span>
              <span className="block text-[11px] capitalize text-slate-500">{identity?.role.replaceAll('_', ' ')}</span>
            </span>
            <button
              type="button"
              onClick={() => void handleLogout()}
              disabled={busy}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[1440px] space-y-6 px-5 py-8 sm:px-8">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Read-only operations overview
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-950 sm:text-3xl">Platform overview</h1>
            <p className="mt-1.5 text-sm text-slate-500">A current snapshot of platform activity and service availability.</p>
          </div>
          <button
            type="button"
            onClick={() => void loadOverview()}
            disabled={busy}
            className="inline-flex items-center justify-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-50 sm:self-auto"
          >
            <RefreshCw className={`h-4 w-4 ${busy ? 'animate-spin' : ''}`} />
            Refresh data
          </button>
        </div>

        {errorMessage && (
          <div role="alert" className="flex items-start justify-between gap-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <div className="flex gap-3">
              <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button type="button" onClick={() => void loadOverview()} className="shrink-0 font-bold underline">
              Retry
            </button>
          </div>
        )}

        {data && <Overview data={data} />}

        <footer className="flex flex-col gap-2 border-t border-slate-200 pt-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span className="inline-flex items-center gap-2">
            <CircleCheck className="h-4 w-4 text-emerald-600" />
            Authenticated as {identity?.email}
          </span>
          <span className="inline-flex items-center gap-2">
            {data && new Date(data.generatedAt).toLocaleString('en-NG')}
            <Clock3 className="h-3.5 w-3.5" />
          </span>
        </footer>
      </main>
    </div>
  );
}
