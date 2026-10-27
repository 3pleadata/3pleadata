import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json());

// API v1 Routes
app.get('/api/v1/health', (req, res) => {
  res.json({
    status: 'online',
    platform: '3PLE A Fintech & Services Platform',
    location: 'Karkasara Road, Tarauni, Kano State, Nigeria',
    timestamp: new Date().toISOString(),
  });
});

app.post('/api/v1/auth/token', (req, res) => {
  const { client_id, client_secret } = req.body;
  if (!client_id) {
    return res.status(400).json({ error: 'INVALID_CREDENTIALS', message: 'Missing client_id' });
  }
  return res.json({
    status: 'success',
    token_type: 'Bearer',
    access_token: `3plea_tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`,
    expires_in: 86400,
  });
});

app.get('/api/v1/wallet/balance', (req, res) => {
  return res.json({
    status: 'success',
    code: '00',
    data: {
      currency: 'NGN',
      available_balance: 450000,
      commission_balance: 34500,
      bonus_balance: 5200,
      account_status: 'ACTIVE',
      account_tier: 3,
    },
  });
});

app.post('/api/v1/airtime/purchase', (req, res) => {
  const { network, amount, phone, idempotency_key } = req.body;
  if (!network || !amount || !phone) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Missing network, amount, or phone' });
  }
  const ref = `3PA-API-AIR-${Date.now()}`;
  return res.json({
    status: 'success',
    code: '00',
    message: `Transaction Approved: ${network} ₦${amount} credited to ${phone}`,
    reference: ref,
    provider_reference: `PAIRGATE_TX_${Math.floor(100000 + Math.random() * 900000)}`,
    data: {
      network,
      amount,
      phone,
      idempotency_key,
      timestamp: new Date().toISOString(),
    },
  });
});

app.post('/api/v1/data/purchase', (req, res) => {
  const { network, plan_code, phone } = req.body;
  if (!network || !plan_code || !phone) {
    return res.status(400).json({ error: 'BAD_REQUEST', message: 'Missing network, plan_code, or phone' });
  }
  const ref = `3PA-API-DAT-${Date.now()}`;
  return res.json({
    status: 'success',
    code: '00',
    message: `Data Plan Delivered: ${network} ${plan_code} to ${phone}`,
    reference: ref,
    provider_reference: `CLUBKONNECT_DAT_${Math.floor(100000 + Math.random() * 900000)}`,
  });
});

app.post('/api/v1/bills/validate', (req, res) => {
  const { service_type, provider, account_number } = req.body;
  return res.json({
    status: 'success',
    code: '00',
    data: {
      customer_name: 'ALHAJI MUSA SULAIMAN - TARAUNI KANO',
      account_number,
      disco: provider || 'KEDCO',
      address: 'Karkasara Road, Tarauni LGA, Kano State',
      meter_type: 'PREPAID',
    },
  });
});

app.post('/api/v1/bills/pay', (req, res) => {
  const { provider, account_number, amount, meter_type } = req.body;
  const isPrepaid = meter_type !== 'postpaid';
  const token = isPrepaid
    ? `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
    : undefined;

  return res.json({
    status: 'success',
    code: '00',
    message: isPrepaid ? 'Electricity token generated' : 'Bill payment cleared',
    reference: `3PA-DISCO-${Date.now()}`,
    data: {
      token,
      units: `${(amount / 225).toFixed(1)} kWh`,
      account_number,
      disco: provider,
    },
  });
});

app.post('/api/v1/flights/search', (req, res) => {
  const { origin, destination } = req.body;
  return res.json({
    status: 'success',
    code: '00',
    results: [
      {
        airline: 'Air Peace',
        flight_number: 'P4-7124',
        origin: origin || 'KAN',
        destination: destination || 'ABV',
        departure_time: '08:30 AM',
        arrival_time: '09:25 AM',
        total_fare_ngn: 100500,
        available_seats: 7,
      },
      {
        airline: 'Max Air',
        flight_number: 'VM-1602',
        origin: origin || 'KAN',
        destination: destination || 'LOS',
        departure_time: '11:15 AM',
        arrival_time: '12:40 PM',
        total_fare_ngn: 124500,
        available_seats: 4,
      },
    ],
  });
});

// AI Assistant Chat Route (Powered by Gemini API with intelligent local fallback)
app.post('/api/v1/ai/chat', async (req, res) => {
  const { message, history = [], userContext } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Message is required' });
  }

  const systemInstruction = `You are the official 3PLE A AI Navigator & Assistant for the 3PLE A Fintech, VTU, Bill Payments, Flight Booking, and Estate Management platform, headquartered at Karkasara Road, Tarauni LGA, Kano State, Nigeria.
You help users:
1. Navigation: Guide users through pages: Airtime, Data plans, Electricity (KEDCO, AEDC, EKEDC, etc.), Cable TV (DSTV, GOTV, StarTimes), Education scratch pins (WAEC, NECO, JAMB), Flight Booking (Air Peace, Max Air from Kano and Abuja), Real Estate viewings, Scheduled Recurring Payments, and Price Alerts.
2. Inquiries: Explaining SME and CG data bundles, wallet funding via Paystack and Monnify virtual accounts, transaction verification, token generation, and wholesale retailer margins.
3. User Context: ${userContext ? JSON.stringify(userContext) : 'Active customer with Nigerian wallet'}.
4. Action tags: Whenever recommending that the user visit a section or perform an action, append one or more of these exact tags in your response:
   - [ACTION:GO_TO:airtime]
   - [ACTION:GO_TO:data]
   - [ACTION:GO_TO:electricity]
   - [ACTION:GO_TO:cable]
   - [ACTION:GO_TO:education]
   - [ACTION:GO_TO:flights]
   - [ACTION:GO_TO:estate]
   - [ACTION:GO_TO:schedules]
   - [ACTION:GO_TO:alerts]
   - [ACTION:GO_TO:fund_wallet]
   - [ACTION:GO_TO:support]
   - [ACTION:GO_TO:retailer]
Keep answers clear, helpful, respectful, and concise. Support both English and Hausa queries warmly.`;

  // Attempt using Gemini API if key is present
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({});
      const contents: Array<{ role: string; parts: Array<{ text: string }> }> = [];
      for (const h of history.slice(-6)) {
        contents.push({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }],
        });
      }
      contents.push({
        role: 'user',
        parts: [{ text: message }],
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents,
        config: {
          systemInstruction,
        },
      });

      const reply = response.text || 'I am ready to help you navigate 3PLE A services.';
      return res.json({ reply });
    } catch (err: any) {
      console.warn('Gemini API call failed, falling back to local domain intelligence:', err?.message);
    }
  }

  // Intelligent domain fallback
  const lower = message.toLowerCase();
  let reply = '';

  if (lower.includes('schedul') || lower.includes('recur') || lower.includes('jadawali') || lower.includes('auto')) {
    reply = "You can set up automated recurring bill payments using our 'Scheduled Payments' engine! You can schedule monthly KEDCO electricity recharge, weekly MTN data bundles, or Cable TV subscriptions that auto-debit your wallet on payday or any chosen date. [ACTION:GO_TO:schedules]";
  } else if (lower.includes('alert') || lower.includes('threshold') || lower.includes('budget') || lower.includes('price')) {
    reply = "With our Price Alert Notification System, you can set your budget threshold for Data plans or Electricity. When a plan drops to or matches your target price, you'll receive an instant in-app notification with a 1-click buy button! [ACTION:GO_TO:alerts]";
  } else if (lower.includes('electric') || lower.includes('kedco') || lower.includes('meter') || lower.includes('token') || lower.includes('wuta') || lower.includes('power')) {
    reply = "We offer instant prepaid electricity token generation for KEDCO (Kano, Katsina, Jigawa), AEDC (Abuja), EKEDC, IKEDC, and more via our high-speed Pairgate gateway. Tokens generate within 1-2 seconds with ₦0 hidden charges! [ACTION:GO_TO:electricity]";
  } else if (lower.includes('data') || lower.includes('bundle') || lower.includes('gb') || lower.includes('sme')) {
    reply = "We offer SME, Corporate Gifting, and Direct Data bundles across MTN, Airtel, Glo, and 9mobile at discounted wholesale rates (e.g. MTN SME 1GB at ₦280 for retail, ₦255 for resellers). [ACTION:GO_TO:data]";
  } else if (lower.includes('airtime') || lower.includes('recharge') || lower.includes('kati')) {
    reply = "Buy instant VTU airtime for MTN, Airtel, Glo, and 9mobile with up to 3% instant cashback credited to your wallet balance. [ACTION:GO_TO:airtime]";
  } else if (lower.includes('flight') || lower.includes('plane') || lower.includes('air peace') || lower.includes('max air') || lower.includes('tafiya') || lower.includes('abuja')) {
    reply = "You can search and book domestic flights departing from Mallam Aminu Kano International Airport (KAN), Abuja (ABV), and Lagos (LOS) on Air Peace, Max Air, and United Nigeria with instant PNR issuance! [ACTION:GO_TO:flights]";
  } else if (lower.includes('cable') || lower.includes('dstv') || lower.includes('gotv') || lower.includes('startimes')) {
    reply = "Renew your DSTV, GOtv, and StarTimes subscriptions instantly. Enter your Smartcard / IUC number for immediate customer name verification and fast clearance. [ACTION:GO_TO:cable]";
  } else if (lower.includes('balance') || lower.includes('fund') || lower.includes('wallet') || lower.includes('kudi')) {
    const bal = userContext?.walletBalance ? `₦${userContext.walletBalance.toLocaleString()}` : 'your balance';
    reply = `Your available wallet balance is ${bal}. You can fund your wallet anytime using dedicated Monnify virtual bank accounts or instant Paystack card settlements. [ACTION:GO_TO:fund_wallet]`;
  } else if (lower.includes('estate') || lower.includes('house') || lower.includes('property') || lower.includes('rent') || lower.includes('tarauni') || lower.includes('gida')) {
    reply = "Explore verified real estate listings in prime Kano locations (Tarauni, Karkasara, Nassarawa GRA) and Abuja luxury districts. You can book private inspections directly on the platform! [ACTION:GO_TO:estate]";
  } else if (lower.includes('exam') || lower.includes('waec') || lower.includes('neco') || lower.includes('jamb') || lower.includes('school')) {
    reply = "Get instant WAEC result checker PINs (₦4,200), JAMB UTME profile PINs (₦7,700), NECO result tokens, and pay Bayero University Kano (BUK) registration fees! [ACTION:GO_TO:education]";
  } else if (lower.includes('voice') || lower.includes('mic') || lower.includes('speech')) {
    reply = "You can speak to 3PLE A! Click the microphone button in the top navigation or bottom corner to say voice commands like 'Go to electricity', 'Buy data', 'Check my balance', or 'Turn on dark mode'.";
  } else {
    reply = "Welcome to 3PLE A! I am your AI assistant. I can help you check balances, buy discounted airtime & data, generate KEDCO power tokens, book flights from Kano, set up scheduled recurring payments, or track price alerts. What would you like to do today? [ACTION:GO_TO:data] [ACTION:GO_TO:electricity] [ACTION:GO_TO:schedules]";
  }

  return res.json({ reply });
});

// AI Agent Transaction Categorization Route (Powered by Gemini API gemini-3.8-flash + domain intelligence)
app.post('/api/v1/ai/categorize-transactions', async (req, res) => {
  const { transactions } = req.body;
  if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
    return res.status(400).json({ error: 'transactions array is required' });
  }

  // Domain categorization rule engine (used directly or as fallback)
  const categorizeLocally = (tx: any) => {
    const text = `${tx.productName || ''} ${tx.provider || ''} ${tx.recipient || ''} ${JSON.stringify(tx.metadata || {})}`.toLowerCase();
    
    // Electricity / Utility check
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
        reasoning: "Classified as Electricity / Utility based on power DISCO provider / meter tokens.",
        matchedKeywords: ['electric', 'meter', 'utility', 'disco'],
      };
    }

    // Airtime VTU check
    if (
      (text.includes('airtime') || text.includes('recharge') || text.includes('vtu topup') || text.includes('kati')) &&
      !text.includes('data') && !text.includes('gb')
    ) {
      return {
        transactionId: tx.id,
        suggestedCategory: 'Airtime',
        suggestedType: 'airtime',
        confidence: 0.96,
        reasoning: "Classified as Airtime VTU recharge from mobile operator and phone recipient pattern.",
        matchedKeywords: ['airtime', 'recharge', 'vtu'],
      };
    }

    // Data bundles check
    if (
      text.includes('data') || text.includes('sme') || text.includes('corporate gifting') ||
      text.includes('cg data') || text.includes('gb') || text.includes('mb') || text.includes('internet')
    ) {
      return {
        transactionId: tx.id,
        suggestedCategory: 'Data',
        suggestedType: 'data',
        confidence: 0.97,
        reasoning: "Classified as Mobile Data Bundle from telecom bundle size and SME/CG indicators.",
        matchedKeywords: ['data', 'bundle', 'internet'],
      };
    }

    // Cable TV check
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
        reasoning: "Classified as Cable TV subscription from Pay-TV operator and decoder IUC references.",
        matchedKeywords: ['cable', 'tv', 'decoder'],
      };
    }

    // Education fees & exam pins check
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
        reasoning: "Classified as Education / Examination PIN from institution and student registration terms.",
        matchedKeywords: ['education', 'exam', 'school'],
      };
    }

    // Flight & travel booking check
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
        reasoning: "Classified as Flight Booking from airline carrier metadata and travel PNR identifiers.",
        matchedKeywords: ['flight', 'airline', 'travel'],
      };
    }

    // Wallet funding check
    if (
      text.includes('top-up') || text.includes('topup') || text.includes('funding') ||
      text.includes('deposit') || text.includes('paystack') || text.includes('monnify') ||
      text.includes('card top')
    ) {
      return {
        transactionId: tx.id,
        suggestedCategory: 'Wallet Funding',
        suggestedType: 'wallet_funding',
        confidence: 0.94,
        reasoning: "Classified as Wallet Funding deposit from settlement gateway and card channels.",
        matchedKeywords: ['wallet', 'funding', 'deposit'],
      };
    }

    // Internal transfers
    if (text.includes('transfer') || text.includes('p2p') || text.includes('qr transfer') || text.includes('sent to')) {
      return {
        transactionId: tx.id,
        suggestedCategory: 'Internal Transfer',
        suggestedType: 'wallet_transfer',
        confidence: 0.92,
        reasoning: "Classified as Internal Peer-to-Peer Wallet Transfer.",
        matchedKeywords: ['transfer', 'p2p'],
      };
    }

    // Default heuristic for general utility
    return {
      transactionId: tx.id,
      suggestedCategory: 'Utility',
      suggestedType: 'electricity',
      confidence: 0.75,
      reasoning: "Heuristic classification based on vendor payment patterns.",
      matchedKeywords: ['general_utility'],
    };
  };

  // If Gemini API is available, try to classify using Gemini 3.8 Flash
  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const prompt = `You are a financial classification AI agent for Nigerian fintech (3PLE A).
Classify each of the following uncategorized transactions into one of these exact categories:
- 'Airtime' (suggestedType: 'airtime')
- 'Data' (suggestedType: 'data')
- 'Utility' (suggestedType: 'electricity')
- 'Cable TV' (suggestedType: 'cable_tv')
- 'Education' (suggestedType: 'school_fees')
- 'Flight' (suggestedType: 'flight_booking')
- 'Wallet Funding' (suggestedType: 'wallet_funding')
- 'Internal Transfer' (suggestedType: 'wallet_transfer')

Transactions to classify:
${JSON.stringify(transactions, null, 2)}

Respond with a JSON array where each object has:
- transactionId: string
- suggestedCategory: string (one of the exact categories above)
- suggestedType: string (one of the suggestedTypes above)
- confidence: number between 0.80 and 0.99
- reasoning: string (a crisp 1-sentence reason explaining the classification)
- matchedKeywords: string[] (1-3 relevant keywords)`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const parsed = JSON.parse(response.text || '[]');
      if (Array.isArray(parsed) && parsed.length > 0) {
        return res.json({
          status: 'success',
          source: 'gemini-3.8-flash',
          suggestions: parsed,
        });
      }
    } catch (err: any) {
      console.warn('Gemini categorization failed, falling back to local domain heuristics:', err?.message);
    }
  }

  // Fallback to local domain classification
  const suggestions = transactions.map(categorizeLocally);
  return res.json({
    status: 'success',
    source: 'domain-heuristics',
    suggestions,
  });
});



// Vite Middleware for SPA Frontend
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`3PLE A Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
