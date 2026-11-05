import React, { useState, useEffect, useRef, useMemo } from 'react';
import { AppState } from '../services/storage';
import {
  Transaction,
  DataPlan,
  AirtimeNetwork,
  ElectricityDisco,
  CableTvPackage,
  EducationItem,
  FlightOffer,
  PropertyListing,
} from '../types';
import { Language } from '../services/i18n';
import {
  Search,
  X,
  CreditCard,
  Wifi,
  Smartphone,
  Zap,
  Tv,
  GraduationCap,
  Plane,
  Building,
  ArrowRight,
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Command,
  Receipt,
  Tag,
  MapPin,
  ExternalLink,
} from 'lucide-react';

export interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  onSelectTab: (tab: string) => void;
  onViewReceipt?: (tx: Transaction) => void;
  language: Language;
}

type SearchFilterCategory = 'all' | 'transactions' | 'products' | 'estates';

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  state,
  onSelectTab,
  onViewReceipt,
  language,
}) => {
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<SearchFilterCategory>('all');
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 50);
      setHighlightedIndex(0);
    } else {
      setQuery('');
      setActiveCategory('all');
    }
  }, [isOpen]);

  // Handle ESC and keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // --------------------------------------------------------------------------
  // SEARCH FILTERING & SCORING
  // --------------------------------------------------------------------------
  const trimmed = query.trim().toLowerCase();

  // 1. Transactions Matching
  const matchingTransactions = useMemo(() => {
    if (!trimmed) return [];
    const txs = state.transactions || [];
    return txs
      .filter((tx) => {
        const text = `${tx.reference} ${tx.productName} ${tx.recipient} ${tx.provider} ${tx.category || ''} ${
          tx.type
        } ${tx.amount} ${JSON.stringify(tx.metadata || {})}`.toLowerCase();
        return text.includes(trimmed);
      })
      .slice(0, 8);
  }, [state.transactions, trimmed]);

  // 2. Products Matching (Data, Airtime, Electricity, Cable, Education, Flights)
  const matchingDataPlans = useMemo(() => {
    if (!trimmed) return [];
    return (state.dataPlans || [])
      .filter((dp) => {
        const text = `${dp.name} ${dp.network} ${dp.size} ${dp.planType} ${dp.validity} ${dp.customerPrice}`.toLowerCase();
        return text.includes(trimmed);
      })
      .slice(0, 6);
  }, [state.dataPlans, trimmed]);

  const matchingNetworks = useMemo(() => {
    if (!trimmed) return [];
    return (state.networks || []).filter((net) => {
      const text = `${net.name} ${net.code} airtime recharge vtu`.toLowerCase();
      return text.includes(trimmed);
    });
  }, [state.networks, trimmed]);

  const matchingDiscos = useMemo(() => {
    if (!trimmed) return [];
    return (state.discos || [])
      .filter((d) => {
        const text = `${d.name} ${d.code} ${d.state} electricity power meter prepaid token`.toLowerCase();
        return text.includes(trimmed);
      })
      .slice(0, 4);
  }, [state.discos, trimmed]);

  const matchingCablePackages = useMemo(() => {
    if (!trimmed) return [];
    return (state.cablePackages || [])
      .filter((c) => {
        const text = `${c.name} ${c.provider} cable tv decoders`.toLowerCase();
        return text.includes(trimmed);
      })
      .slice(0, 4);
  }, [state.cablePackages, trimmed]);

  const matchingEducation = useMemo(() => {
    if (!trimmed) return [];
    return (state.educationItems || [])
      .filter((e) => {
        const text = `${e.name} ${e.category} ${e.shortCode} ${e.state} pin token waec jamb neco buk`.toLowerCase();
        return text.includes(trimmed);
      })
      .slice(0, 4);
  }, [state.educationItems, trimmed]);

  const matchingFlights = useMemo(() => {
    if (!trimmed) return [];
    return (state.flights || [])
      .filter((f) => {
        const text = `${f.airline} ${f.origin} ${f.originCity} ${f.destination} ${f.destinationCity} ${f.flightNumber}`.toLowerCase();
        return text.includes(trimmed);
      })
      .slice(0, 4);
  }, [state.flights, trimmed]);

  // 3. Real Estate Matching
  const matchingEstates = useMemo(() => {
    if (!trimmed) return [];
    return (state.properties || [])
      .filter((prop) => {
        const text = `${prop.title} ${prop.location} ${prop.city} ${prop.state} ${prop.category} ${
          prop.transactionType
        } ${prop.description}`.toLowerCase();
        return text.includes(trimmed);
      })
      .slice(0, 6);
  }, [state.properties, trimmed]);

  // 4. Quick Page Navigation Jumps
  const matchingPageJumps = useMemo(() => {
    if (!trimmed) return [];
    const pages = [
      { id: 'dashboard', name: 'Dashboard & Services Overview', keywords: 'dashboard home overview services' },
      { id: 'airtime', name: 'Airtime VTU Recharge (2% Cashback)', keywords: 'airtime recharge vtu topup mtn airtel glo' },
      { id: 'data', name: 'Data Bundles (SME & Corporate Gifting)', keywords: 'data bundles sme cg internet gb mtn airtel' },
      { id: 'electricity', name: 'Electricity Prepaid Tokens (KEDCO & DISCOs)', keywords: 'electricity power kedco aedc disco meter token' },
      { id: 'cable', name: 'Cable TV Renewal (DSTV, GOtv, StarTimes)', keywords: 'cable tv dstv gotv startimes decoder smartcard' },
      { id: 'schedules', name: 'Smart Schedules (Recurring Bill Cycles)', keywords: 'schedules recurring auto debit bill calendar' },
      { id: 'education', name: 'Education Fees & Exam PINs (WAEC / JAMB / BUK)', keywords: 'education exam pin waec jamb neco buk university school' },
      { id: 'flights', name: 'Domestic Flight Booking (Kano, Abuja, Lagos)', keywords: 'flights airline ticket air peace max air airport kano abuja' },
      { id: 'estates', name: 'Real Estate & Properties (Tarauni, Kano, Abuja)', keywords: 'estate property house duplex plot land rent sale kano tarauni' },
      { id: 'retailer', name: 'Retailer & Reseller Hub (Wholesale VTU)', keywords: 'retailer reseller wholesale bulk vtu api' },
      { id: 'developers', name: 'Developer REST API & Webhooks', keywords: 'developer api documentation keys endpoints webhooks' },
      { id: 'support', name: 'Customer Support & Live Helpdesk', keywords: 'support help ticket chat desk agent' },
      { id: 'admin', name: 'Super Admin Console & Margin Engine', keywords: 'admin super admin pricing margin users audit ledger' },
    ];

    return pages.filter((p) => p.name.toLowerCase().includes(trimmed) || p.keywords.includes(trimmed)).slice(0, 3);
  }, [trimmed]);

  // Total counts
  const totalProductsCount =
    matchingDataPlans.length +
    matchingNetworks.length +
    matchingDiscos.length +
    matchingCablePackages.length +
    matchingEducation.length +
    matchingFlights.length;

  const totalResults =
    matchingTransactions.length + totalProductsCount + matchingEstates.length + matchingPageJumps.length;

  // Flattened actionable list for keyboard navigation
  interface ActionItem {
    id: string;
    type: 'transaction' | 'data' | 'airtime' | 'electricity' | 'cable' | 'education' | 'flight' | 'estate' | 'page';
    title: string;
    subtitle: string;
    amount?: number;
    badge?: string;
    onExecute: () => void;
  }

  const flattenedActions: ActionItem[] = useMemo(() => {
    const list: ActionItem[] = [];

    // Transactions
    if (activeCategory === 'all' || activeCategory === 'transactions') {
      matchingTransactions.forEach((tx) => {
        list.push({
          id: `tx_${tx.id}`,
          type: 'transaction',
          title: tx.productName,
          subtitle: `Ref: ${tx.reference} • ${tx.recipient} • ${new Date(tx.createdAt).toLocaleDateString()}`,
          amount: tx.totalDebited,
          badge: tx.status,
          onExecute: () => {
            if (onViewReceipt) onViewReceipt(tx);
            onClose();
          },
        });
      });
    }

    // Products
    if (activeCategory === 'all' || activeCategory === 'products') {
      matchingDataPlans.forEach((dp) => {
        list.push({
          id: `dp_${dp.id}`,
          type: 'data',
          title: `${dp.network} - ${dp.name} (${dp.size})`,
          subtitle: `${dp.planType} • ${dp.validity} validity`,
          amount: dp.customerPrice,
          badge: 'Data Plan',
          onExecute: () => {
            onSelectTab('data');
            onClose();
          },
        });
      });

      matchingNetworks.forEach((net) => {
        list.push({
          id: `net_${net.id}`,
          type: 'airtime',
          title: `${net.name} VTU Airtime Recharge`,
          subtitle: `${net.discountPercentage}% Instant Cashback credited to wallet`,
          badge: 'Airtime',
          onExecute: () => {
            onSelectTab('airtime');
            onClose();
          },
        });
      });

      matchingDiscos.forEach((disco) => {
        list.push({
          id: `disco_${disco.id}`,
          type: 'electricity',
          title: `${disco.name} (${disco.code})`,
          subtitle: `Prepaid & Postpaid electricity • ${disco.state}`,
          amount: disco.convenienceFee,
          badge: 'Electricity',
          onExecute: () => {
            onSelectTab('electricity');
            onClose();
          },
        });
      });

      matchingCablePackages.forEach((cable) => {
        list.push({
          id: `cable_${cable.id}`,
          type: 'cable',
          title: `${cable.provider} - ${cable.name}`,
          subtitle: `${cable.channels} TV Channels Included`,
          amount: cable.price,
          badge: 'Cable TV',
          onExecute: () => {
            onSelectTab('cable');
            onClose();
          },
        });
      });

      matchingEducation.forEach((edu) => {
        list.push({
          id: `edu_${edu.id}`,
          type: 'education',
          title: edu.name,
          subtitle: `${edu.feeName} • ${edu.state}`,
          amount: edu.amount + (edu.serviceCharge || 0),
          badge: 'Education',
          onExecute: () => {
            onSelectTab('education');
            onClose();
          },
        });
      });

      matchingFlights.forEach((flight) => {
        list.push({
          id: `flt_${flight.id}`,
          type: 'flight',
          title: `${flight.airline} Flight ${flight.flightNumber}`,
          subtitle: `${flight.originCity} → ${flight.destinationCity} (${flight.departureTime})`,
          amount: flight.totalPrice,
          badge: 'Flight',
          onExecute: () => {
            onSelectTab('flights');
            onClose();
          },
        });
      });
    }

    // Real Estate
    if (activeCategory === 'all' || activeCategory === 'estates') {
      matchingEstates.forEach((estate) => {
        list.push({
          id: `estate_${estate.id}`,
          type: 'estate',
          title: estate.title,
          subtitle: `${estate.location}, ${estate.city} • ${estate.category} for ${estate.transactionType}`,
          amount: estate.price,
          badge: estate.transactionType.toUpperCase(),
          onExecute: () => {
            onSelectTab('estates');
            onClose();
          },
        });
      });
    }

    // Page Jumps
    if (activeCategory === 'all') {
      matchingPageJumps.forEach((page) => {
        list.push({
          id: `page_${page.id}`,
          type: 'page',
          title: `Jump to: ${page.name}`,
          subtitle: `Open ${page.id.toUpperCase()} section directly`,
          badge: 'Navigation',
          onExecute: () => {
            onSelectTab(page.id);
            onClose();
          },
        });
      });
    }

    return list;
  }, [
    activeCategory,
    matchingTransactions,
    matchingDataPlans,
    matchingNetworks,
    matchingDiscos,
    matchingCablePackages,
    matchingEducation,
    matchingFlights,
    matchingEstates,
    matchingPageJumps,
    onViewReceipt,
    onSelectTab,
    onClose,
  ]);

  // Handle arrow keys and enter
  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1 < flattenedActions.length ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : flattenedActions.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (flattenedActions[highlightedIndex]) {
        flattenedActions[highlightedIndex].onExecute();
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-start justify-center pt-12 sm:pt-20 px-3 sm:px-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Input Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-amber-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setHighlightedIndex(0);
            }}
            onKeyDown={handleKeyDownInInput}
            placeholder={
              language === 'ha'
                ? 'Nemi ciniki, kati, data, wutar KEDCO, ko gidaje...'
                : 'Search transactions, products, KEDCO bills, flights, or properties...'
            }
            className="flex-1 bg-transparent text-slate-900 dark:text-white placeholder-slate-400 text-sm sm:text-base font-medium focus:outline-none"
          />

          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                inputRef.current?.focus();
              }}
              className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-md border border-slate-200 dark:border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Filter Category Tabs */}
        {query.trim().length > 0 && (
          <div className="px-4 py-2.5 bg-slate-50/70 dark:bg-slate-950/40 border-b border-slate-100 dark:border-slate-800 flex items-center gap-1.5 overflow-x-auto text-xs">
            <button
              type="button"
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap ${
                activeCategory === 'all'
                  ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {language === 'ha' ? 'Duka' : 'All'} ({flattenedActions.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('transactions')}
              className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === 'transactions'
                  ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>{language === 'ha' ? 'Harkokin Kudi' : 'Transactions'}</span>
              <span>({matchingTransactions.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('products')}
              className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === 'products'
                  ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Zap className="w-3.5 h-3.5" />
              <span>{language === 'ha' ? 'Ayyuka & Kayan Saye' : 'Products & Services'}</span>
              <span>({totalProductsCount})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveCategory('estates')}
              className={`px-3 py-1 rounded-lg font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                activeCategory === 'estates'
                  ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-950 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>{language === 'ha' ? 'Gidaje' : 'Real Estate'}</span>
              <span>({matchingEstates.length})</span>
            </button>
          </div>
        )}

        {/* Results Body */}
        <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
          {/* Default Empty Query State: Popular / Quick Suggestions */}
          {!trimmed && (
            <div className="space-y-4 py-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>{language === 'ha' ? 'Shawarwari Masu Sauki' : 'Popular Services & Quick Searches'}</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {[
                  {
                    label: '⚡ KEDCO Prepaid Electricity Meter',
                    desc: 'Instant tokens within 1.4 seconds',
                    tab: 'electricity',
                  },
                  {
                    label: '📶 MTN SME 1GB & 5GB Data',
                    desc: 'Wholesale bundles from ₦255',
                    tab: 'data',
                  },
                  {
                    label: '📱 Airtime VTU 2% Cashback',
                    desc: 'MTN, Airtel, Glo, 9mobile',
                    tab: 'airtime',
                  },
                  {
                    label: '🏢 Tarauni & Kano Commercial Properties',
                    desc: 'Verified prime real estate',
                    tab: 'estates',
                  },
                  {
                    label: '✈️ Flights departing Kano (KAN)',
                    desc: 'Air Peace & Max Air PNR booking',
                    tab: 'flights',
                  },
                  {
                    label: '📺 DSTV Compact & GOtv Renewal',
                    desc: 'Instant decoder verification',
                    tab: 'cable',
                  },
                  {
                    label: '🎓 WAEC Result PIN & BUK Tuition',
                    desc: 'Official scratch cards',
                    tab: 'education',
                  },
                  {
                    label: '⏱️ Smart Recurring Schedules',
                    desc: 'Automated payday bill cycles',
                    tab: 'schedules',
                  },
                ].map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.tab);
                      onClose();
                    }}
                    className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800/80 text-left transition-all flex items-center justify-between group"
                  >
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                        {item.label}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{item.desc}</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform shrink-0 ml-2" />
                  </button>
                ))}
              </div>

              {/* Recent Transactions Preview in empty state */}
              {state.transactions && state.transactions.length > 0 && (
                <div className="pt-2">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 px-2 mb-2 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-blue-500" />
                    <span>{language === 'ha' ? 'Harkokin Kudi na Kusa' : 'Recent Transaction History'}</span>
                  </div>

                  <div className="space-y-1.5">
                    {state.transactions.slice(0, 3).map((tx) => (
                      <button
                        key={tx.id}
                        type="button"
                        onClick={() => {
                          if (onViewReceipt) onViewReceipt(tx);
                          onClose();
                        }}
                        className="w-full p-2.5 rounded-xl bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700/80 text-left transition-all flex items-center justify-between text-xs"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <Receipt className="w-3.5 h-3.5" />
                          </span>
                          <div className="min-w-0 truncate">
                            <div className="font-bold text-slate-900 dark:text-white truncate">{tx.productName}</div>
                            <div className="text-[10px] text-slate-400 font-mono truncate">
                              Ref: {tx.reference} • {tx.recipient}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 font-mono font-bold text-slate-900 dark:text-white">
                          ₦{tx.totalDebited.toLocaleString()}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Results List */}
          {trimmed && (
            <>
              {flattenedActions.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto" />
                  <p className="font-bold text-slate-800 dark:text-slate-200 text-sm">
                    {language === 'ha'
                      ? `Ba a sami sakamako ba na "${query}"`
                      : `No results found for "${query}"`}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-500 max-w-sm mx-auto">
                    {language === 'ha'
                      ? 'Gwada rubuta "KEDCO", "MTN", "DSTV", "Tarauni", ko lambar reference ta transaction.'
                      : 'Try searching for terms like "KEDCO", "MTN", "DSTV", "Tarauni", "WAEC", or a transaction reference.'}
                  </p>
                </div>
              ) : (
                <div className="space-y-1.5">
                  {flattenedActions.map((action, index) => {
                    const isHighlighted = index === highlightedIndex;

                    // Icon selection
                    let ActionIcon = Search;
                    let iconBg = 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300';

                    if (action.type === 'transaction') {
                      ActionIcon = Receipt;
                      iconBg = 'bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300';
                    } else if (action.type === 'data') {
                      ActionIcon = Wifi;
                      iconBg = 'bg-sky-50 text-sky-700 dark:bg-sky-950/50 dark:text-sky-300';
                    } else if (action.type === 'airtime') {
                      ActionIcon = Smartphone;
                      iconBg = 'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300';
                    } else if (action.type === 'electricity') {
                      ActionIcon = Zap;
                      iconBg = 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300';
                    } else if (action.type === 'cable') {
                      ActionIcon = Tv;
                      iconBg = 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300';
                    } else if (action.type === 'education') {
                      ActionIcon = GraduationCap;
                      iconBg = 'bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300';
                    } else if (action.type === 'flight') {
                      ActionIcon = Plane;
                      iconBg = 'bg-teal-50 text-teal-700 dark:bg-teal-950/50 dark:text-teal-300';
                    } else if (action.type === 'estate') {
                      ActionIcon = Building;
                      iconBg = 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300';
                    } else if (action.type === 'page') {
                      ActionIcon = ArrowRight;
                      iconBg = 'bg-amber-500/10 text-amber-600 dark:text-amber-400';
                    }

                    return (
                      <button
                        key={action.id}
                        type="button"
                        onClick={action.onExecute}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`w-full p-3 rounded-2xl text-left transition-all flex items-center justify-between gap-3 ${
                          isHighlighted
                            ? 'bg-amber-500/10 dark:bg-amber-400/15 border border-amber-400/40 ring-1 ring-amber-400/30 shadow-xs'
                            : 'bg-white dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-150 dark:border-slate-800'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-2 rounded-xl shrink-0 ${iconBg}`}>
                            <ActionIcon className="w-4 h-4" />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                                {action.title}
                              </span>
                              {action.badge && (
                                <span className="text-[9px] font-mono font-bold uppercase px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 shrink-0">
                                  {action.badge}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                              {action.subtitle}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0 flex items-center gap-2">
                          {action.amount !== undefined && (
                            <span className="font-mono font-bold text-xs sm:text-sm text-slate-900 dark:text-white tabular-nums">
                              ₦{action.amount.toLocaleString()}
                            </span>
                          )}
                          <ArrowRight
                            className={`w-4 h-4 transition-transform ${
                              isHighlighted ? 'translate-x-0.5 text-amber-600 dark:text-amber-400' : 'text-slate-300'
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="p-3 bg-slate-50 dark:bg-slate-950/70 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[9px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[9px]">
                ↓
              </kbd>
              <span className="hidden sm:inline">Navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-slate-800 rounded border border-slate-200 dark:border-slate-700 font-mono text-[9px]">
                ↵
              </kbd>
              <span className="hidden sm:inline">Select</span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400 font-medium">
            <Sparkles className="w-3 h-3" />
            <span>3PLE A Fast Search</span>
          </div>
        </div>
      </div>
    </div>
  );
};
