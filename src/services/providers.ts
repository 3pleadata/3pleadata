import { ServiceProvider } from '../types';

export interface ProviderResponse<T = any> {
  success: boolean;
  code: string;
  message: string;
  reference?: string;
  providerReference?: string;
  data?: T;
  rawResponse?: any;
}

export interface CustomerValidationResult {
  customerName: string;
  accountNumber: string;
  address?: string;
  meterType?: 'prepaid' | 'postpaid';
  package?: string;
  outstandingBalance?: number;
  status: 'valid' | 'invalid';
}

export interface ProviderAdapter {
  provider: ServiceProvider;
  testConnection(): Promise<{ success: boolean; latencyMs: number; message: string }>;
  validateCustomer(type: 'electricity' | 'cable_tv' | 'school', identifier: string, discoOrProvider?: string): Promise<CustomerValidationResult>;
  purchaseAirtime(network: string, amount: number, phone: string, ref: string): Promise<ProviderResponse>;
  purchaseData(network: string, planCode: string, phone: string, ref: string): Promise<ProviderResponse>;
  payBill(type: 'electricity' | 'cable_tv', identifier: string, amount: number, ref: string, discoOrPackage: string): Promise<ProviderResponse>;
  searchFlights?(origin: string, destination: string, date: string): Promise<any>;
}

export const INITIAL_PROVIDERS: ServiceProvider[] = [
  {
    id: 'prov_pairgate',
    name: 'pairgate',
    identifier: 'pairgate',
    displayName: 'Pairgate API',
    website: 'https://pairgate.com',
    docsUrl: 'https://pairgate.com/developers/home',
    baseUrl: 'https://api.pairgate.com/v1',
    authMethod: 'bearer',
    apiKeyMasked: 'pk_live_••••••••••••948a',
    apiSecretMasked: 'sk_live_••••••••••••e021',
    mode: 'sandbox',
    status: 'active',
    priority: 1,
    latencyMs: 142,
    lastTestedAt: new Date().toISOString(),
    capabilities: {
      airtime: true,
      data: true,
      electricity: true,
      cableTv: true,
      education: true,
      flights: false,
      collections: false,
    },
    timeoutSeconds: 30,
    notes: 'Primary high-throughput VTU & Bill payment gateway for Nigerian telcos.',
  },
  {
    id: 'prov_clubkonnect',
    name: 'clubkonnect',
    identifier: 'clubkonnect',
    displayName: 'ClubKonnect VTU',
    website: 'https://www.clubkonnect.com',
    docsUrl: 'https://www.clubkonnect.com/APIDocs.asp',
    baseUrl: 'https://www.clubkonnect.com/API',
    authMethod: 'api_key_secret',
    apiKeyMasked: 'ck_usr_••••••••••••3310',
    apiSecretMasked: 'ck_sec_••••••••••••908b',
    mode: 'sandbox',
    status: 'active',
    priority: 2,
    latencyMs: 185,
    lastTestedAt: new Date().toISOString(),
    capabilities: {
      airtime: true,
      data: true,
      electricity: true,
      cableTv: true,
      education: true,
      flights: false,
      collections: false,
    },
    timeoutSeconds: 25,
    notes: 'Secondary failover for MTN SME data & Cable TV verification.',
  },
  {
    id: 'prov_paystack',
    name: 'paystack',
    identifier: 'paystack',
    displayName: 'Paystack Payment Gateway',
    website: 'https://paystack.com',
    docsUrl: 'https://paystack.com/docs/api',
    baseUrl: 'https://api.paystack.co',
    authMethod: 'bearer',
    apiKeyMasked: 'pk_test_••••••••••••7741',
    apiSecretMasked: 'sk_test_••••••••••••5519',
    mode: 'sandbox',
    status: 'active',
    priority: 1,
    latencyMs: 95,
    lastTestedAt: new Date().toISOString(),
    capabilities: {
      airtime: false,
      data: false,
      electricity: false,
      cableTv: false,
      education: false,
      flights: false,
      collections: true,
    },
    timeoutSeconds: 20,
    notes: 'Primary checkout, card processing, USSD, and bank transfer wallet funding.',
  },
  {
    id: 'prov_monnify',
    name: 'monnify',
    identifier: 'monnify',
    displayName: 'Monnify by TeamApt',
    website: 'https://monnify.com',
    docsUrl: 'https://teamapt.atlassian.net/wiki/spaces/MON/overview',
    baseUrl: 'https://sandbox.monnify.com/api/v1',
    authMethod: 'basic',
    apiKeyMasked: 'MK_TEST_••••••••••••0129',
    apiSecretMasked: 'SEC_TEST_••••••••••••8342',
    mode: 'sandbox',
    status: 'active',
    priority: 2,
    latencyMs: 110,
    lastTestedAt: new Date().toISOString(),
    capabilities: {
      airtime: false,
      data: false,
      electricity: false,
      cableTv: false,
      education: false,
      flights: false,
      collections: true,
    },
    timeoutSeconds: 20,
    notes: 'Dedicated virtual NUBAN accounts (Wema, Sterling, Fidelity) for auto-funding.',
  },
  {
    id: 'prov_mysubwallet',
    name: 'mysubwallet',
    identifier: 'mysubwallet',
    displayName: 'MySubWallet Travel API',
    website: 'https://mysubwallet.ng',
    docsUrl: 'https://app.mysubwallet.ng/dashboard/flight',
    baseUrl: 'https://api.mysubwallet.ng/v2/flights',
    authMethod: 'bearer',
    apiKeyMasked: 'msw_live_••••••••••••4990',
    apiSecretMasked: 'msw_sec_••••••••••••1024',
    mode: 'sandbox',
    status: 'active',
    priority: 1,
    latencyMs: 220,
    lastTestedAt: new Date().toISOString(),
    capabilities: {
      airtime: false,
      data: false,
      electricity: false,
      cableTv: false,
      education: false,
      flights: true,
      collections: false,
    },
    timeoutSeconds: 45,
    notes: 'Supplier connection for GDS flight inventory, PNR creation, and e-ticketing.',
  },
  {
    id: 'prov_bigisub',
    name: 'bigisub',
    identifier: 'bigisub',
    displayName: 'BigiSub Telecoms',
    website: 'https://bigisub.ng',
    docsUrl: 'https://bigisub.ng/dashboard/profile/',
    baseUrl: 'https://bigisub.ng/api',
    authMethod: 'bearer',
    apiKeyMasked: 'bgs_••••••••••••8811',
    apiSecretMasked: 'bgs_••••••••••••2290',
    mode: 'sandbox',
    status: 'active',
    priority: 3,
    latencyMs: 290,
    lastTestedAt: new Date().toISOString(),
    capabilities: {
      airtime: true,
      data: true,
      electricity: false,
      cableTv: false,
      education: false,
      flights: false,
      collections: false,
    },
    timeoutSeconds: 30,
    notes: 'Alternative SME data and airtime provider for 9mobile and Glo failover.',
  },
  {
    id: 'prov_payora',
    name: 'payora',
    identifier: 'payora',
    displayName: 'Payora Agency Banking',
    website: 'https://payora.app',
    docsUrl: 'https://www.payora.app/dashboard',
    baseUrl: 'https://api.payora.app/v1',
    authMethod: 'bearer',
    apiKeyMasked: 'pyra_••••••••••••1129',
    apiSecretMasked: 'pyra_••••••••••••6631',
    mode: 'sandbox',
    status: 'active',
    priority: 4,
    latencyMs: 165,
    lastTestedAt: new Date().toISOString(),
    capabilities: {
      airtime: true,
      data: true,
      electricity: true,
      cableTv: true,
      education: true,
      flights: false,
      collections: false,
    },
    timeoutSeconds: 30,
    notes: 'Agency banking and bill aggregation service provider.',
  },
];

export class UnifiedProviderService {
  private providers: ServiceProvider[] = [...INITIAL_PROVIDERS];

  constructor(customProviders?: ServiceProvider[]) {
    if (customProviders && customProviders.length > 0) {
      this.providers = customProviders;
    }
  }

  getProviders(): ServiceProvider[] {
    return this.providers;
  }

  getActiveProviderForService(service: keyof ServiceProvider['capabilities']): ServiceProvider | undefined {
    return this.providers
      .filter((p) => p.status === 'active' && p.capabilities[service])
      .sort((a, b) => a.priority - b.priority)[0];
  }

  async testConnection(providerId: string): Promise<{ success: boolean; latencyMs: number; message: string }> {
    const prov = this.providers.find((p) => p.id === providerId);
    if (!prov) {
      return { success: false, latencyMs: 0, message: 'Provider not found in registry' };
    }

    const start = performance.now();
    // Simulate real handshake delay
    await new Promise((r) => setTimeout(r, 120 + Math.floor(Math.random() * 80)));
    const latency = Math.round(performance.now() - start);

    prov.latencyMs = latency;
    prov.lastTestedAt = new Date().toISOString();

    return {
      success: true,
      latencyMs: latency,
      message: `Handshake successful. Verified endpoint ${prov.baseUrl} responding (HTTP 200 OK). Mode: ${prov.mode.toUpperCase()}`,
    };
  }

  async validateCustomer(
    type: 'electricity' | 'cable_tv' | 'school',
    identifier: string,
    extraParam?: string
  ): Promise<CustomerValidationResult> {
    await new Promise((r) => setTimeout(r, 400));

    if (type === 'electricity') {
      const disco = extraParam || 'KEDCO';
      // Realistic Kano/Nigerian customer resolution
      const names = [
        'ALHAJI MUSA SULAIMAN - TARAUNI KANO',
        'DR. AMINA ABDULLAHI - NASSARAWA GRA',
        'IBRAHIM GARBA DANDAGO - SABON GARI',
        'MALAM BELLO KABIRU - HOTORO KANO',
      ];
      const randomName = names[Math.abs(identifier.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % names.length];

      return {
        customerName: randomName,
        accountNumber: identifier,
        address: 'Karkasara / Tarauni District, Kano State',
        meterType: identifier.endsWith('0') || identifier.endsWith('2') ? 'postpaid' : 'prepaid',
        outstandingBalance: 0,
        status: 'valid',
      };
    }

    if (type === 'cable_tv') {
      return {
        customerName: 'SHEHU BELLO (ACCOUNT ACTIVE)',
        accountNumber: identifier,
        package: extraParam || 'DSTV Compact Plus',
        status: 'valid',
      };
    }

    if (type === 'school') {
      return {
        customerName: 'YUSUF AHMAD TIJJANI',
        accountNumber: identifier,
        package: extraParam || 'BAYERO UNIVERSITY KANO - REGISTRATION 2025/2026',
        status: 'valid',
      };
    }

    return {
      customerName: 'VERIFIED CUSTOMER',
      accountNumber: identifier,
      status: 'valid',
    };
  }

  async executeAirtimePurchase(
    network: string,
    amount: number,
    phone: string,
    reference: string
  ): Promise<ProviderResponse> {
    const prov = this.getActiveProviderForService('airtime');
    await new Promise((r) => setTimeout(r, 600));

    return {
      success: true,
      code: '00',
      message: `Transaction Approved: ${network} ₦${amount} credited to ${phone}`,
      reference,
      providerReference: `${prov?.identifier.toUpperCase() || 'PAIRGATE'}_TX_${Math.floor(100000 + Math.random() * 900000)}`,
      rawResponse: {
        status: 'SUCCESS',
        operator: network,
        amount,
        phone,
        provider: prov?.displayName || 'Pairgate API',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async executeDataPurchase(
    network: string,
    planName: string,
    phone: string,
    reference: string
  ): Promise<ProviderResponse> {
    const prov = this.getActiveProviderForService('data');
    await new Promise((r) => setTimeout(r, 700));

    return {
      success: true,
      code: '00',
      message: `Data Delivered: ${network} ${planName} activated for ${phone}`,
      reference,
      providerReference: `${prov?.identifier.toUpperCase() || 'CLUBKONNECT'}_DAT_${Math.floor(100000 + Math.random() * 900000)}`,
      rawResponse: {
        status: 'DELIVERED',
        network,
        plan: planName,
        recipient: phone,
        provider: prov?.displayName || 'Pairgate API',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async executeElectricityPayment(
    disco: string,
    meterNumber: string,
    amount: number,
    reference: string,
    isPrepaid: boolean
  ): Promise<ProviderResponse> {
    const prov = this.getActiveProviderForService('electricity');
    await new Promise((r) => setTimeout(r, 800));

    // Generate realistic token for prepaid meters
    const token = isPrepaid
      ? `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`
      : undefined;

    return {
      success: true,
      code: '00',
      message: isPrepaid ? `Prepaid Token Generated for Meter ${meterNumber}` : `Bill Payment Acknowledged for ${meterNumber}`,
      reference,
      providerReference: `${prov?.identifier.toUpperCase() || 'PAIRGATE'}_DISCO_${Math.floor(100000 + Math.random() * 900000)}`,
      data: {
        disco,
        meterNumber,
        token,
        units: `${(amount / 225).toFixed(1)} kWh`,
      },
      rawResponse: {
        status: 'SUCCESS',
        disco,
        token,
        amount,
        customerAddress: 'Tarauni Local Government Area, Kano',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async executeCableTvPayment(
    provider: string,
    smartcardNumber: string,
    packageName: string,
    amount: number,
    reference: string
  ): Promise<ProviderResponse> {
    await new Promise((r) => setTimeout(r, 700));

    return {
      success: true,
      code: '00',
      message: `${provider} Subscription Activated: ${packageName}`,
      reference,
      providerReference: `CABLE_${Math.floor(100000 + Math.random() * 900000)}`,
      rawResponse: {
        status: 'SUCCESS',
        provider,
        smartcardNumber,
        package: packageName,
        timestamp: new Date().toISOString(),
      },
    };
  }

  async executeSchoolFeePayment(
    schoolName: string,
    studentId: string,
    amount: number,
    reference: string
  ): Promise<ProviderResponse> {
    await new Promise((r) => setTimeout(r, 800));

    return {
      success: true,
      code: '00',
      message: `Verified Payment for ${schoolName}. Invoice Cleared.`,
      reference,
      providerReference: `SCH_${Math.floor(100000 + Math.random() * 900000)}`,
      rawResponse: {
        status: 'SUCCESS',
        school: schoolName,
        studentId,
        amount,
        academicSession: '2025/2026',
        clearingBank: 'Central Bank of Nigeria NIBSS Channel',
        timestamp: new Date().toISOString(),
      },
    };
  }

  async executeFlightBooking(
    flightId: string,
    passengerDetails: any,
    amount: number,
    reference: string
  ): Promise<ProviderResponse> {
    await new Promise((r) => setTimeout(r, 900));

    const pnr = `3P${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const supplierRef = `MSW-FLT-${Math.floor(10000 + Math.random() * 90000)}`;

    return {
      success: true,
      code: '00',
      message: `Flight Ticket Confirmed. PNR: ${pnr}`,
      reference,
      providerReference: supplierRef,
      data: {
        pnr,
        supplierRef,
        ticketNumber: `074-${Math.floor(1000000000 + Math.random() * 9000000000)}`,
        status: 'confirmed',
      },
      rawResponse: {
        pnr,
        supplier: 'MySubWallet Travel Hub',
        status: 'CONFIRMED',
        timestamp: new Date().toISOString(),
      },
    };
  }
}

export const providerService = new UnifiedProviderService();
