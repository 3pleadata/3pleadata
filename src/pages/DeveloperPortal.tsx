import React, { useState } from 'react';
import { AppState } from '../services/storage';
import {
  Code2,
  Terminal,
  Key,
  Copy,
  Check,
  Play,
  ShieldCheck,
  BookOpen,
  Send,
  Loader2,
  AlertCircle,
  FileCode,
  Layers,
} from 'lucide-react';

interface DeveloperPortalProps {
  state: AppState;
  language: 'en' | 'ha';
}

export const DeveloperPortal: React.FC<DeveloperPortalProps> = ({ state, language }) => {
  const [selectedLanguage, setSelectedLanguage] = useState<'curl' | 'javascript' | 'python' | 'php'>('curl');
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('airtime');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [consoleLoading, setConsoleLoading] = useState<boolean>(false);
  const [consoleResponse, setConsoleResponse] = useState<any>(null);

  const demoApiKey = state.apiKeys[0]?.keyMasked || '3plea_live_99f8c47b9201a4e76d338';

  const endpoints = [
    {
      id: 'token',
      method: 'POST',
      path: '/api/v1/auth/token',
      title: 'Generate Access Token',
      desc: 'Exchange API Client ID and Secret for a scoped JSON Web Token.',
      payload: {
        client_id: '3plea_cli_990142',
        client_secret: 'sec_live_99a8b1c4',
      },
    },
    {
      id: 'balance',
      method: 'GET',
      path: '/api/v1/wallet/balance',
      title: 'Get Wallet Balance',
      desc: 'Retrieve current available NGN balance and commission ledger state.',
      payload: null,
    },
    {
      id: 'airtime',
      method: 'POST',
      path: '/api/v1/airtime/purchase',
      title: 'Purchase Airtime VTU',
      desc: 'Instantly top up airtime on MTN, Airtel, Glo, or 9mobile with idempotency.',
      payload: {
        network: 'MTN',
        amount: 2000,
        phone: '08031234567',
        idempotency_key: 'idem_9941_user_app',
      },
    },
    {
      id: 'data',
      method: 'POST',
      path: '/api/v1/data/purchase',
      title: 'Purchase Data Bundle',
      desc: 'Dispense high-speed SME or Corporate data bundles directly to recipient.',
      payload: {
        network: 'MTN',
        plan_code: 'MTN-SME-2GB',
        phone: '08149876543',
        idempotency_key: 'idem_data_4412',
      },
    },
    {
      id: 'bills_validate',
      method: 'POST',
      path: '/api/v1/bills/validate',
      title: 'Validate Customer Meter / IUC',
      desc: 'Verify customer name and address before generating electricity tokens or renewing TV.',
      payload: {
        service_type: 'electricity',
        provider: 'KEDCO',
        account_number: '04192847562',
      },
    },
    {
      id: 'flights_search',
      method: 'POST',
      path: '/api/v1/flights/search',
      title: 'Search Flight Itineraries',
      desc: 'Query live GDS seat availability and fares between Nigerian airports.',
      payload: {
        origin: 'KAN',
        destination: 'ABV',
        date: '2026-04-10',
        passengers: 1,
        cabin: 'Economy',
      },
    },
  ];

  const activeEndpointObj = endpoints.find((e) => e.id === selectedEndpoint) || endpoints[2];

  const getCodeSnippet = () => {
    const payloadStr = activeEndpointObj.payload ? JSON.stringify(activeEndpointObj.payload, null, 2) : '';

    if (selectedLanguage === 'curl') {
      if (activeEndpointObj.method === 'GET') {
        return `curl -X GET "https://api.3plea.ng${activeEndpointObj.path}" \\
  -H "Authorization: Bearer ${demoApiKey}" \\
  -H "Accept: application/json"`;
      }
      return `curl -X POST "https://api.3plea.ng${activeEndpointObj.path}" \\
  -H "Authorization: Bearer ${demoApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(activeEndpointObj.payload)}'`;
    }

    if (selectedLanguage === 'javascript') {
      return `import axios from 'axios';

const response = await axios({
  method: '${activeEndpointObj.method.toLowerCase()}',
  url: 'https://api.3plea.ng${activeEndpointObj.path}',
  headers: {
    'Authorization': 'Bearer ${demoApiKey}',
    'Content-Type': 'application/json'
  }${activeEndpointObj.payload ? `,\n  data: ${payloadStr}` : ''}
});

console.log(response.data);`;
    }

    if (selectedLanguage === 'python') {
      return `import requests

url = "https://api.3plea.ng${activeEndpointObj.path}"
headers = {
    "Authorization": "Bearer ${demoApiKey}",
    "Content-Type": "application/json"
}
${activeEndpointObj.payload ? `payload = ${payloadStr}\nresponse = requests.${activeEndpointObj.method.toLowerCase()}(url, json=payload, headers=headers)` : `response = requests.get(url, headers=headers)`}

print(response.json())`;
    }

    if (selectedLanguage === 'php') {
      return `<?php
$curl = curl_init();

curl_setopt_array($curl, [
  CURLOPT_URL => "https://api.3plea.ng${activeEndpointObj.path}",
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_CUSTOMREQUEST => "${activeEndpointObj.method}",
  CURLOPT_HTTPHEADER => [
    "Authorization: Bearer ${demoApiKey}",
    "Content-Type: application/json"
  ],
  ${activeEndpointObj.payload ? `CURLOPT_POSTFIELDS => json_encode(${JSON.stringify(activeEndpointObj.payload)}),` : ''}
]);

$response = curl_exec($curl);
curl_close($curl);
echo $response;`;
    }

    return '';
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleRunConsoleTest = async () => {
    setConsoleLoading(true);
    setConsoleResponse(null);

    await new Promise((r) => setTimeout(r, 450));

    if (activeEndpointObj.id === 'balance') {
      setConsoleResponse({
        status: 'success',
        code: '00',
        data: {
          currency: 'NGN',
          available_balance: state.currentUser.walletBalance,
          commission_balance: state.currentUser.commissionBalance,
          account_status: 'ACTIVE',
          account_tier: 3,
        },
      });
    } else if (activeEndpointObj.id === 'bills_validate') {
      setConsoleResponse({
        status: 'success',
        code: '00',
        data: {
          customer_name: 'ALHAJI MUSA SULAIMAN - TARAUNI KANO',
          account_number: '04192847562',
          disco: 'KEDCO',
          address: 'Karkasara Road, Tarauni LGA, Kano',
          meter_type: 'PREPAID',
        },
      });
    } else if (activeEndpointObj.id === 'flights_search') {
      setConsoleResponse({
        status: 'success',
        code: '00',
        results_count: 2,
        itineraries: [
          {
            airline: 'Air Peace',
            flight_no: 'P4-7124',
            origin: 'KAN',
            destination: 'ABV',
            departure: '08:30 AM',
            arrival: '09:25 AM',
            price_ngn: 100500,
            seats_available: 7,
          },
          {
            airline: 'Max Air',
            flight_no: 'VM-1602',
            origin: 'KAN',
            destination: 'ABV',
            departure: '11:15 AM',
            arrival: '12:10 PM',
            price_ngn: 98000,
            seats_available: 4,
          },
        ],
      });
    } else {
      setConsoleResponse({
        status: 'success',
        code: '00',
        message: 'Transaction Approved and Ledger Debited.',
        reference: `3PA-API-${Date.now()}`,
        timestamp: new Date().toISOString(),
        data: {
          amount_debited: activeEndpointObj.payload?.amount || 2000,
          recipient: activeEndpointObj.payload?.phone || '08031234567',
          channel: 'PAIRGATE_HIGH_THROUGHPUT_V1',
        },
      });
    }

    setConsoleLoading(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            3PLE A Developer API & OpenAPI 3.1 Documentation
          </h1>
          <span className="text-[10px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded font-bold font-mono">
            v1.4.0 REST
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Automate Airtime, SME Data, DISCO tokens, School fees, and Flight bookings with sub-second response times and HMAC webhook notifications.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Endpoint Navigator */}
        <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block px-2 mb-2">
            REST Endpoints
          </span>
          {endpoints.map((ep) => {
            const isSelected = selectedEndpoint === ep.id;
            return (
              <button
                key={ep.id}
                type="button"
                onClick={() => {
                  setSelectedEndpoint(ep.id);
                  setConsoleResponse(null);
                }}
                className={`w-full p-3 rounded-xl border text-left transition-all ${
                  isSelected
                    ? 'border-slate-900 dark:border-amber-400 bg-slate-900 dark:bg-amber-500/10 text-white ring-1 ring-slate-900 dark:ring-amber-400 shadow-xs'
                    : 'border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      ep.method === 'POST'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}
                  >
                    {ep.method}
                  </span>
                  <span className="text-xs font-bold truncate">{ep.title}</span>
                </div>
                <div
                  className={`text-[11px] font-mono truncate ${
                    isSelected ? 'text-slate-300 dark:text-amber-300' : 'text-slate-500 dark:text-slate-400'
                  }`}
                >
                  {ep.path}
                </div>
              </button>
            );
          })}

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 px-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block">Base Production URL:</span>
            <code className="font-mono text-slate-600 dark:text-slate-300 select-all">https://api.3plea.ng/v1</code>
          </div>
        </div>

        {/* Right: Code Samples & Interactive Test Console */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950 rounded-2xl p-5 text-white shadow-md border border-slate-800 space-y-4">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div className="flex gap-1.5">
                {(['curl', 'javascript', 'python', 'php'] as const).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setSelectedLanguage(lang)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors capitalize ${
                      selectedLanguage === lang
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {lang === 'javascript' ? 'Node.js' : lang}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="px-2.5 py-1 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {copiedCode ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleRunConsoleTest}
                  disabled={consoleLoading}
                  className="px-3 py-1 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {consoleLoading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5" />
                  )}
                  <span>Try Endpoint</span>
                </button>
              </div>
            </div>

            {/* Code block */}
            <pre className="font-mono text-xs text-amber-200 overflow-x-auto leading-relaxed select-all">
              {getCodeSnippet()}
            </pre>

            {/* Live Response Box if triggered */}
            {consoleResponse && (
              <div className="pt-3 border-t border-slate-800">
                <div className="text-[10px] uppercase font-bold text-emerald-400 tracking-wider mb-1">
                  Response HTTP 200 OK (Simulated Sandbox Gateway)
                </div>
                <pre className="p-3 bg-slate-900 rounded-xl text-emerald-300 font-mono text-xs overflow-x-auto select-all">
                  {JSON.stringify(consoleResponse, null, 2)}
                </pre>
              </div>
            )}
          </div>

          {/* Webhook Signature Documentation Box */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-2 text-xs">
            <h4 className="font-bold text-slate-900 dark:text-white text-sm">
              Webhook Security & HMAC SHA-512 Verification
            </h4>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Every webhook event sent to your configured endpoint includes a cryptographic signature in the header:{' '}
              <code className="font-mono bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-1 py-0.5 rounded">
                x-3plea-signature
              </code>
              . Verify incoming payloads with your API secret to prevent replay attacks and falsified transactions.
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl font-mono text-[11px] text-slate-700 dark:text-slate-300 overflow-x-auto">
              const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(req.body)).digest('hex');
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
