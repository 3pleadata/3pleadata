import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { AppState } from '../services/storage';
import { FlightBooking, FlightOffer, FlightRoutePriceAlert, NotificationItem, Transaction } from '../types';
import { PinModal } from '../components/PinModal';
import { FlightPriceAlertModal } from '../components/FlightPriceAlertModal';
import {
  Plane,
  ArrowRight,
  Calendar,
  Users,
  ShieldCheck,
  Check,
  AlertCircle,
  Loader2,
  Luggage,
  Clock,
  Ticket,
  RotateCcw,
  ExternalLink,
  MessageCircle,
  Copy,
  X,
  Sparkles,
  SlidersHorizontal,
  ChevronDown,
  Info,
  Wallet,
  Search,
  Zap,
  ArrowUpDown,
  Bell,
  BellRing,
  Trash2,
  Play,
  Pause,
  TrendingDown,
  CheckCircle2,
  Mail,
} from 'lucide-react';
import { providerService } from '../services/providers';
import { DoubleEntryLedgerEngine } from '../services/ledger';
import { flightSearchSchema } from '../services/flightSearchService';

interface FlightsPageProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  onViewReceipt: (tx: Transaction) => void;
  language: 'en' | 'ha';
}

// ============================================================================
// 1. DOMESTIC AIRPORTS & POPULAR ROUTES
// ============================================================================

export const AIRPORTS = [
  { code: 'LOS', city: 'Lagos', name: 'Murtala Muhammed Intl (LOS)' },
  { code: 'ABV', city: 'Abuja', name: 'Nnamdi Azikiwe Intl (ABV)' },
  { code: 'PHC', city: 'Port Harcourt', name: 'Port Harcourt Intl (PHC)' },
  { code: 'KAN', city: 'Kano', name: 'Mallam Aminu Kano Intl (KAN)' },
  { code: 'ENU', city: 'Enugu', name: 'Akanu Ibiam Intl (ENU)' },
  { code: 'BNI', city: 'Benin City', name: 'Benin Airport (BNI)' },
  { code: 'CBQ', city: 'Calabar', name: 'Margaret Ekpo Intl (CBQ)' },
  { code: 'SKO', city: 'Sokoto', name: 'Sadiq Abubakar III Intl (SKO)' },
  { code: 'MIU', city: 'Maiduguri', name: 'Maiduguri Intl (MIU)' },
  { code: 'ILO', city: 'Ilorin', name: 'Ilorin Intl (ILO)' },
];

export const POPULAR_ROUTES = [
  { origin: 'LOS', dest: 'ABV', label: 'LOS ⇄ ABV' },
  { origin: 'LOS', dest: 'PHC', label: 'LOS ⇄ PHC' },
  { origin: 'LOS', dest: 'KAN', label: 'LOS ⇄ KAN' },
  { origin: 'ABV', dest: 'LOS', label: 'ABV ⇄ LOS' },
  { origin: 'PHC', dest: 'LOS', label: 'PHC ⇄ LOS' },
  { origin: 'KAN', dest: 'ABV', label: 'KAN ⇄ ABV' },
  { origin: 'LOS', dest: 'ENU', label: 'LOS ⇄ ENU' },
];

export const AIRLINES_LIST = [
  'Air Peace',
  'Arik Air',
  'Aero Contractors',
  'Ibom Air',
  'United Nigeria Airlines',
  'ValueJet',
  'Green Africa',
  'Max Air',
  'Overland Airways',
  'Azman Air',
  'Rano Air',
  'Enugu Air',
];

// ============================================================================
// 2. LOCAL ARRAY OF DOMESTIC FLIGHT OBJECTS (SEEDED DATABASE)
// ============================================================================

export const LOCAL_DOMESTIC_FLIGHTS: FlightOffer[] = [
  // LOS -> ABV
  {
    id: 'flt_los_abv_p4_1',
    airline: 'Air Peace',
    airlineIata: 'P4',
    airlineUrl: 'https://flyairpeace.com',
    flightNumber: 'P4-7120',
    origin: 'LOS',
    originCity: 'Lagos (Murtala Muhammed Intl)',
    destination: 'ABV',
    destinationCity: 'Abuja (Nnamdi Azikiwe Intl)',
    departureTime: '07:00 AM',
    arrivalTime: '08:15 AM',
    duration: '1h 15m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Refundable with standard fee. Date change permitted.',
    baseFare: 85000,
    taxes: 7500,
    totalPrice: 92500,
    availableSeats: 9,
    updatedAt: '10 mins ago',
    isEstimate: true,
  },
  {
    id: 'flt_los_abv_qi_1',
    airline: 'Ibom Air',
    airlineIata: 'QI',
    airlineUrl: 'https://ibomair.com',
    flightNumber: 'QI-0201',
    origin: 'LOS',
    originCity: 'Lagos (Murtala Muhammed Intl)',
    destination: 'ABV',
    destinationCity: 'Abuja (Nnamdi Azikiwe Intl)',
    departureTime: '08:30 AM',
    arrivalTime: '09:40 AM',
    duration: '1h 10m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Schedule reliability guarantee. Standard cancellation penalty.',
    baseFare: 98000,
    taxes: 8200,
    totalPrice: 106200,
    availableSeats: 6,
    updatedAt: '25 mins ago',
    isEstimate: true,
  },
  {
    id: 'flt_los_abv_q9_1',
    airline: 'Green Africa',
    airlineIata: 'Q9',
    airlineUrl: 'https://greenafrica.com',
    flightNumber: 'Q9-302',
    origin: 'LOS',
    originCity: 'Lagos (Murtala Muhammed Intl)',
    destination: 'ABV',
    destinationCity: 'Abuja (Nnamdi Azikiwe Intl)',
    departureTime: '10:00 AM',
    arrivalTime: '11:20 AM',
    duration: '1h 20m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '15kg Checked + 7kg Cabin',
    fareRules: 'Value fare. Changes subject to fare difference.',
    baseFare: 65000,
    taxes: 6000,
    totalPrice: 71000,
    availableSeats: 12,
    updatedAt: '1 hour ago',
    isEstimate: true,
  },
  {
    id: 'flt_los_abv_vk_1',
    airline: 'ValueJet',
    airlineIata: 'VK',
    airlineUrl: 'https://flyvaluejet.com',
    flightNumber: 'VK-104',
    origin: 'LOS',
    originCity: 'Lagos (Murtala Muhammed Intl)',
    destination: 'ABV',
    destinationCity: 'Abuja (Nnamdi Azikiwe Intl)',
    departureTime: '01:30 PM',
    arrivalTime: '02:45 PM',
    duration: '1h 15m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Comfort cabin seating. Standard reschedule.',
    baseFare: 78000,
    taxes: 7000,
    totalPrice: 85000,
    availableSeats: 8,
    updatedAt: '45 mins ago',
    isEstimate: true,
  },
  {
    id: 'flt_los_abv_un_1',
    airline: 'United Nigeria Airlines',
    airlineIata: 'UN',
    airlineUrl: 'https://flyunitednigeria.com',
    flightNumber: 'UN-504',
    origin: 'LOS',
    originCity: 'Lagos (Murtala Muhammed Intl)',
    destination: 'ABV',
    destinationCity: 'Abuja (Nnamdi Azikiwe Intl)',
    departureTime: '04:15 PM',
    arrivalTime: '05:30 PM',
    duration: '1h 15m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Standard baggage rules. Reschedule penalty applies.',
    baseFare: 84000,
    taxes: 7500,
    totalPrice: 91500,
    availableSeats: 11,
    updatedAt: '30 mins ago',
    isEstimate: true,
  },

  // ABV -> LOS
  {
    id: 'flt_abv_los_w3_1',
    airline: 'Arik Air',
    airlineIata: 'W3',
    airlineUrl: 'https://arikair.com',
    flightNumber: 'W3-722',
    origin: 'ABV',
    originCity: 'Abuja (Nnamdi Azikiwe Intl)',
    destination: 'LOS',
    destinationCity: 'Lagos (Murtala Muhammed Intl)',
    departureTime: '09:00 AM',
    arrivalTime: '10:15 AM',
    duration: '1h 15m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Rescheduling available up to 4h before departure.',
    baseFare: 82000,
    taxes: 7400,
    totalPrice: 89400,
    availableSeats: 14,
    updatedAt: '15 mins ago',
    isEstimate: true,
  },
  {
    id: 'flt_abv_los_p4_2',
    airline: 'Air Peace',
    airlineIata: 'P4',
    airlineUrl: 'https://flyairpeace.com',
    flightNumber: 'P4-7128',
    origin: 'ABV',
    originCity: 'Abuja (Nnamdi Azikiwe Intl)',
    destination: 'LOS',
    destinationCity: 'Lagos (Murtala Muhammed Intl)',
    departureTime: '03:00 PM',
    arrivalTime: '04:15 PM',
    duration: '1h 15m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Evening commuter corridor. Complimentary snacks.',
    baseFare: 88000,
    taxes: 7600,
    totalPrice: 95600,
    availableSeats: 5,
    updatedAt: '20 mins ago',
    isEstimate: true,
  },

  // KAN <-> ABV & KAN <-> LOS
  {
    id: 'flt_kan_abv_p4_1',
    airline: 'Air Peace',
    airlineIata: 'P4',
    airlineUrl: 'https://flyairpeace.com',
    flightNumber: 'P4-7124',
    origin: 'KAN',
    originCity: 'Kano (Mallam Aminu Kano Intl)',
    destination: 'ABV',
    destinationCity: 'Abuja (Nnamdi Azikiwe Intl)',
    departureTime: '08:30 AM',
    arrivalTime: '09:25 AM',
    duration: '55m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Refundable with ₦15,000 airline penalty. Date change allowed.',
    baseFare: 92000,
    taxes: 8500,
    totalPrice: 100500,
    availableSeats: 7,
    updatedAt: '5 mins ago',
    isEstimate: true,
  },
  {
    id: 'flt_kan_abv_r4_1',
    airline: 'Rano Air',
    airlineIata: 'R4',
    airlineUrl: 'https://ranoair.com',
    flightNumber: 'R4-102',
    origin: 'KAN',
    originCity: 'Kano (Mallam Aminu Kano Intl)',
    destination: 'ABV',
    destinationCity: 'Abuja (Nnamdi Azikiwe Intl)',
    departureTime: '11:00 AM',
    arrivalTime: '11:50 AM',
    duration: '50m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Northern commuter express fare. Name changes restricted.',
    baseFare: 75000,
    taxes: 6500,
    totalPrice: 81500,
    availableSeats: 11,
    updatedAt: '12 mins ago',
    isEstimate: true,
  },
  {
    id: 'flt_abv_kan_p4_2',
    airline: 'Air Peace',
    airlineIata: 'P4',
    airlineUrl: 'https://flyairpeace.com',
    flightNumber: 'P4-7125',
    origin: 'ABV',
    originCity: 'Abuja (Nnamdi Azikiwe Intl)',
    destination: 'KAN',
    destinationCity: 'Kano (Mallam Aminu Kano Intl)',
    departureTime: '05:00 PM',
    arrivalTime: '05:55 PM',
    duration: '55m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Direct flight. Standard refund rules.',
    baseFare: 91000,
    taxes: 8300,
    totalPrice: 99300,
    availableSeats: 8,
    updatedAt: '35 mins ago',
    isEstimate: true,
  },
  {
    id: 'flt_kan_los_vm_1',
    airline: 'Max Air',
    airlineIata: 'VM',
    airlineUrl: 'https://maxair.com.ng',
    flightNumber: 'VM-1602',
    origin: 'KAN',
    originCity: 'Kano (Mallam Aminu Kano Intl)',
    destination: 'LOS',
    destinationCity: 'Lagos (Murtala Muhammed Intl)',
    departureTime: '11:15 AM',
    arrivalTime: '12:40 PM',
    duration: '1h 25m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '23kg Checked + 7kg Cabin',
    fareRules: 'Non-refundable within 24h of departure. Name change not permitted.',
    baseFare: 115000,
    taxes: 9500,
    totalPrice: 124500,
    availableSeats: 4,
    updatedAt: '18 mins ago',
    isEstimate: true,
  },
  {
    id: 'flt_kan_los_zq_1',
    airline: 'Azman Air',
    airlineIata: 'ZQ',
    airlineUrl: 'https://airazman.com',
    flightNumber: 'ZQ-2311',
    origin: 'KAN',
    originCity: 'Kano (Mallam Aminu Kano Intl)',
    destination: 'LOS',
    destinationCity: 'Lagos (Murtala Muhammed Intl)',
    departureTime: '03:30 PM',
    arrivalTime: '05:00 PM',
    duration: '1h 30m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Standard baggage rules. Reschedule penalty applies.',
    baseFare: 98000,
    taxes: 8400,
    totalPrice: 106400,
    availableSeats: 7,
    updatedAt: '50 mins ago',
    isEstimate: true,
  },

  // LOS <-> PHC & ABV <-> PHC
  {
    id: 'flt_los_phc_aj_1',
    airline: 'Aero Contractors',
    airlineIata: 'AJ',
    airlineUrl: 'https://flyaero.com',
    flightNumber: 'AJ-142',
    origin: 'LOS',
    originCity: 'Lagos (Murtala Muhammed Intl)',
    destination: 'PHC',
    destinationCity: 'Port Harcourt (Port Harcourt Intl)',
    departureTime: '09:15 AM',
    arrivalTime: '10:25 AM',
    duration: '1h 10m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Flexible rebooking with fare difference.',
    baseFare: 88000,
    taxes: 7600,
    totalPrice: 95600,
    availableSeats: 8,
    updatedAt: '22 mins ago',
    isEstimate: true,
  },
  {
    id: 'flt_los_phc_un_1',
    airline: 'United Nigeria Airlines',
    airlineIata: 'UN',
    airlineUrl: 'https://flyunitednigeria.com',
    flightNumber: 'UN-512',
    origin: 'LOS',
    originCity: 'Lagos (Murtala Muhammed Intl)',
    destination: 'PHC',
    destinationCity: 'Port Harcourt (Port Harcourt Intl)',
    departureTime: '12:45 PM',
    arrivalTime: '01:55 PM',
    duration: '1h 10m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Ticket valid for 12 months. Standard reschedule fees apply.',
    baseFare: 94000,
    taxes: 8000,
    totalPrice: 102000,
    availableSeats: 10,
    updatedAt: '1 hour ago',
    isEstimate: true,
  },
  {
    id: 'flt_phc_los_qi_1',
    airline: 'Ibom Air',
    airlineIata: 'QI',
    airlineUrl: 'https://ibomair.com',
    flightNumber: 'QI-0308',
    origin: 'PHC',
    originCity: 'Port Harcourt (Port Harcourt Intl)',
    destination: 'LOS',
    destinationCity: 'Lagos (Murtala Muhammed Intl)',
    departureTime: '04:10 PM',
    arrivalTime: '05:20 PM',
    duration: '1h 10m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Reliable evening connection. Standard refund policy.',
    baseFare: 95000,
    taxes: 8100,
    totalPrice: 103100,
    availableSeats: 9,
    updatedAt: '8 mins ago',
    isEstimate: true,
  },

  // LOS <-> ENU
  {
    id: 'flt_los_enu_en_1',
    airline: 'Enugu Air',
    airlineIata: 'EN',
    airlineUrl: 'https://enuguairlines.ng',
    flightNumber: 'EN-101',
    origin: 'LOS',
    originCity: 'Lagos (Murtala Muhammed Intl)',
    destination: 'ENU',
    destinationCity: 'Enugu (Akanu Ibiam Intl)',
    departureTime: '10:00 AM',
    arrivalTime: '11:05 AM',
    duration: '1h 05m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Regional southeastern express corridor.',
    baseFare: 79000,
    taxes: 7000,
    totalPrice: 86000,
    availableSeats: 15,
    updatedAt: '14 mins ago',
    isEstimate: true,
  },
  {
    id: 'flt_los_enu_p4_1',
    airline: 'Air Peace',
    airlineIata: 'P4',
    airlineUrl: 'https://flyairpeace.com',
    flightNumber: 'P4-7106',
    origin: 'LOS',
    originCity: 'Lagos (Murtala Muhammed Intl)',
    destination: 'ENU',
    destinationCity: 'Enugu (Akanu Ibiam Intl)',
    departureTime: '01:15 PM',
    arrivalTime: '02:20 PM',
    duration: '1h 05m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Refundable with standard fee. Complimentary snacks.',
    baseFare: 92000,
    taxes: 7800,
    totalPrice: 99800,
    availableSeats: 5,
    updatedAt: '27 mins ago',
    isEstimate: true,
  },

  // Regional Connectors: ILO, BNI, CBQ, SKO, MIU
  {
    id: 'flt_los_ilo_of_1',
    airline: 'Overland Airways',
    airlineIata: 'OF',
    airlineUrl: 'https://overlandairways.com',
    flightNumber: 'OF-1188',
    origin: 'LOS',
    originCity: 'Lagos (Murtala Muhammed Intl)',
    destination: 'ILO',
    destinationCity: 'Ilorin (Ilorin Intl)',
    departureTime: '07:30 AM',
    arrivalTime: '08:15 AM',
    duration: '45m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Turboprop regional direct connector. Reschedule fee applies.',
    baseFare: 89000,
    taxes: 7200,
    totalPrice: 96200,
    availableSeats: 6,
    updatedAt: '33 mins ago',
    isEstimate: true,
  },
  {
    id: 'flt_abv_sko_vm_1',
    airline: 'Max Air',
    airlineIata: 'VM',
    airlineUrl: 'https://maxair.com.ng',
    flightNumber: 'VM-1804',
    origin: 'ABV',
    originCity: 'Abuja (Nnamdi Azikiwe Intl)',
    destination: 'SKO',
    destinationCity: 'Sokoto (Sadiq Abubakar III Intl)',
    departureTime: '02:30 PM',
    arrivalTime: '03:35 PM',
    duration: '1h 05m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Northwestern connector. Date change allowed.',
    baseFare: 95000,
    taxes: 8000,
    totalPrice: 103000,
    availableSeats: 10,
    updatedAt: '40 mins ago',
    isEstimate: true,
  },
  {
    id: 'flt_abv_miu_r4_1',
    airline: 'Rano Air',
    airlineIata: 'R4',
    airlineUrl: 'https://ranoair.com',
    flightNumber: 'R4-306',
    origin: 'ABV',
    originCity: 'Abuja (Nnamdi Azikiwe Intl)',
    destination: 'MIU',
    destinationCity: 'Maiduguri (Maiduguri Intl)',
    departureTime: '09:45 AM',
    arrivalTime: '11:00 AM',
    duration: '1h 15m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Northeastern express route. Valid ticket protection.',
    baseFare: 99000,
    taxes: 8500,
    totalPrice: 107500,
    availableSeats: 8,
    updatedAt: '19 mins ago',
    isEstimate: true,
  },
  {
    id: 'flt_los_bni_vk_1',
    airline: 'ValueJet',
    airlineIata: 'VK',
    airlineUrl: 'https://flyvaluejet.com',
    flightNumber: 'VK-304',
    origin: 'LOS',
    originCity: 'Lagos (Murtala Muhammed Intl)',
    destination: 'BNI',
    destinationCity: 'Benin City (Benin Airport)',
    departureTime: '03:15 PM',
    arrivalTime: '04:00 PM',
    duration: '45m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'Midwest domestic service. Non-refundable promotional rate.',
    baseFare: 74000,
    taxes: 6800,
    totalPrice: 80800,
    availableSeats: 12,
    updatedAt: '1 hour ago',
    isEstimate: true,
  },
  {
    id: 'flt_los_cbq_qi_1',
    airline: 'Ibom Air',
    airlineIata: 'QI',
    airlineUrl: 'https://ibomair.com',
    flightNumber: 'QI-0402',
    origin: 'LOS',
    originCity: 'Lagos (Murtala Muhammed Intl)',
    destination: 'CBQ',
    destinationCity: 'Calabar (Margaret Ekpo Intl)',
    departureTime: '11:45 AM',
    arrivalTime: '12:55 PM',
    duration: '1h 10m',
    cabinClass: 'Economy',
    stops: 0,
    baggageAllowance: '20kg Checked + 7kg Cabin',
    fareRules: 'South-South direct flight with on-time performance guarantee.',
    baseFare: 96000,
    taxes: 8100,
    totalPrice: 104100,
    availableSeats: 7,
    updatedAt: '16 mins ago',
    isEstimate: true,
  },
];

// ============================================================================
// 3. MOCK BACKEND DATA HANDLER (SYNCHRONOUS & IMMEDIATE FEEDBACK)
// ============================================================================

export interface ProcessedFlightItem extends FlightOffer {
  calculatedPassengerFare: number;
  conciergeFeeNgn: number;
  conciergeTotalNgn: number;
  departureDate: string;
}

export interface BackendFlightQueryResult {
  directFlights: ProcessedFlightItem[];
  alternativeSuggestions: ProcessedFlightItem[];
  originAirport?: { code: string; name: string; city: string };
  destinationAirport?: { code: string; name: string; city: string };
  totalMatches: number;
  totalUnfilteredMatches: number;
  cheapestPriceNgn: number;
  highestPriceNgn: number;
  fastestDuration: string;
  executionTimeMs: number;
  availableAirlinesOnRoute: { name: string; count: number }[];
}

/**
 * Core Mock Backend Data Handler
 * Filters the local domestic flight array according to user search parameters
 * and computes live pricing, passenger breakdowns, and concierge fees immediately.
 */
export function executeLocalMockBackendFlightSearch(
  flightsDb: FlightOffer[],
  params: {
    origin: string;
    destination: string;
    tripType: 'one_way' | 'round_trip';
    departDate: string;
    returnDate?: string;
    adults: number;
    children: number;
    infants: number;
    cabinClass: 'Economy' | 'Business';
    airlineFilter: string;
    stopsFilter: 'all' | '0' | '1';
    maxPriceFilter: number | null;
    sortBy: 'price_asc' | 'duration_asc' | 'departure_asc' | 'cheapest' | 'fastest' | 'earliest';
  }
): BackendFlightQueryResult {
  const t0 = performance.now();

  const originAirport = AIRPORTS.find((a) => a.code === params.origin);
  const destinationAirport = AIRPORTS.find((a) => a.code === params.destination);

  // Demand factor based on selected departure date (Fridays and Sundays have slight weekend surcharge)
  const travelDate = new Date(params.departDate);
  const day = travelDate.getDay();
  let dateMultiplier = 1.0;
  if (day === 0 || day === 5) {
    dateMultiplier = 1.06; // +6% weekend corridor surge
  } else if (day === 2 || day === 3) {
    dateMultiplier = 0.95; // -5% midweek saver
  }

  const cabinMultiplier = params.cabinClass === 'Business' ? 1.8 : 1.0;

  const enrichFlight = (f: FlightOffer): ProcessedFlightItem => {
    const basePerAdult = Math.round(f.totalPrice * dateMultiplier * cabinMultiplier);
    // Adults: 100%, Children: 75%, Infants: 10%
    const passengerMultipliedFare = Math.round(
      basePerAdult * (params.adults + params.children * 0.75 + params.infants * 0.1)
    );

    // 3PLE A Concierge Fee: 5%, min ₦500, max ₦9,500
    const rawFee = Math.round(passengerMultipliedFare * 0.05);
    const conciergeFeeNgn = Math.min(9500, Math.max(500, rawFee));
    const conciergeTotalNgn = passengerMultipliedFare + conciergeFeeNgn;

    return {
      ...f,
      cabinClass: params.cabinClass,
      totalPrice: basePerAdult,
      calculatedPassengerFare: passengerMultipliedFare,
      conciergeFeeNgn,
      conciergeTotalNgn,
      departureDate: params.departDate,
    };
  };

  // 1. All flights matching this route (for calculating route price bounds and airline availability)
  const allRouteFlights = flightsDb
    .filter((f) => f.origin === params.origin && f.destination === params.destination)
    .map(enrichFlight);

  // Count available airlines on this specific route
  const airlineCountMap = new Map<string, number>();
  let highestPriceNgn = 0;
  let lowestRoutePriceNgn = Infinity;

  allRouteFlights.forEach((f) => {
    airlineCountMap.set(f.airline, (airlineCountMap.get(f.airline) || 0) + 1);
    if (f.calculatedPassengerFare > highestPriceNgn) {
      highestPriceNgn = f.calculatedPassengerFare;
    }
    if (f.calculatedPassengerFare < lowestRoutePriceNgn) {
      lowestRoutePriceNgn = f.calculatedPassengerFare;
    }
  });

  const availableAirlinesOnRoute = Array.from(airlineCountMap.entries()).map(([name, count]) => ({
    name,
    count,
  }));

  // 2. Direct Matching Filter (applying airline, stops, and price range filters)
  const directMatches = allRouteFlights.filter((f) => {
    const matchAirline =
      params.airlineFilter === 'all' ||
      f.airline.toLowerCase().includes(params.airlineFilter.toLowerCase()) ||
      f.airlineIata?.toLowerCase() === params.airlineFilter.toLowerCase();
    const matchStops = params.stopsFilter === 'all' || String(f.stops) === params.stopsFilter;
    const matchPrice =
      params.maxPriceFilter === null || f.calculatedPassengerFare <= params.maxPriceFilter;

    return matchAirline && matchStops && matchPrice;
  });

  // 3. Alternative Route Suggestions (if zero direct matches found)
  let alternativeSuggestions: ProcessedFlightItem[] = [];
  if (directMatches.length === 0) {
    alternativeSuggestions = flightsDb
      .filter((f) => f.origin === params.origin || f.destination === params.destination)
      .slice(0, 4)
      .map(enrichFlight);
  }

  // Duration & Time Parsing Utilities for Accurate Numerical Sorting
  const parseDurationMins = (str: string): number => {
    const h = str.match(/(\d+)\s*h/i);
    const m = str.match(/(\d+)\s*m/i);
    return (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
  };

  const parseTimeMins = (str: string): number => {
    const match = str.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const mins = parseInt(match[2], 10);
    const meridian = match[3]?.toUpperCase();
    if (meridian === 'PM' && hours < 12) hours += 12;
    if (meridian === 'AM' && hours === 12) hours = 0;
    return hours * 60 + mins;
  };

  // 4. Sorting (Price: Low to High, Fastest Duration, Earliest Departure)
  const sortedDirect = [...directMatches].sort((a, b) => {
    if (params.sortBy === 'price_asc' || params.sortBy === 'cheapest') {
      return a.calculatedPassengerFare - b.calculatedPassengerFare;
    }
    if (params.sortBy === 'duration_asc' || params.sortBy === 'fastest') {
      return parseDurationMins(a.duration) - parseDurationMins(b.duration);
    }
    if (params.sortBy === 'departure_asc' || params.sortBy === 'earliest') {
      return parseTimeMins(a.departureTime) - parseTimeMins(b.departureTime);
    }
    return 0;
  });

  const cheapest = sortedDirect.length > 0 ? sortedDirect[0].calculatedPassengerFare : (lowestRoutePriceNgn !== Infinity ? lowestRoutePriceNgn : 0);
  const fastest = sortedDirect.length > 0 ? sortedDirect[0].duration : 'N/A';
  const executionTimeMs = Math.round((performance.now() - t0) * 100) / 100;

  return {
    directFlights: sortedDirect,
    alternativeSuggestions,
    originAirport,
    destinationAirport,
    totalMatches: sortedDirect.length,
    totalUnfilteredMatches: allRouteFlights.length,
    cheapestPriceNgn: cheapest,
    highestPriceNgn: highestPriceNgn > 0 ? highestPriceNgn : 200000,
    fastestDuration: fastest,
    executionTimeMs,
    availableAirlinesOnRoute,
  };
}

// ============================================================================
// 4. MAIN FLIGHTS PAGE COMPONENT
// ============================================================================

export const FlightsPage: React.FC<FlightsPageProps> = ({
  state,
  updateState,
  onViewReceipt,
  language,
}) => {
  // Search Form State
  const [tripType, setTripType] = useState<'one_way' | 'round_trip'>('one_way');
  const [origin, setOrigin] = useState<string>('LOS');
  const [destination, setDestination] = useState<string>('ABV');
  const [departDate, setDepartDate] = useState<string>(() => {
    const today = new Date();
    today.setDate(today.getDate() + 3);
    return today.toISOString().split('T')[0];
  });
  const [returnDate, setReturnDate] = useState<string>(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 10);
    return nextWeek.toISOString().split('T')[0];
  });
  const [cabinClass, setCabinClass] = useState<'Economy' | 'Business'>('Economy');

  // Passenger counts
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const [infants, setInfants] = useState<number>(0);
  const [showPassengerPicker, setShowPassengerPicker] = useState<boolean>(false);

  // Filters & Sorting
  const [selectedAirlineFilter, setSelectedAirlineFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price_asc' | 'duration_asc' | 'departure_asc' | 'cheapest' | 'fastest' | 'earliest'>('price_asc');
  const [stopsFilter, setStopsFilter] = useState<'all' | '0' | '1'>('all');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number | null>(null);

  // Combined Flight Pool (Local array merged with any dynamic state offers)
  const combinedFlightPool = useMemo(() => {
    const merged = [...LOCAL_DOMESTIC_FLIGHTS];
    if (state.flights && state.flights.length > 0) {
      for (const sf of state.flights) {
        if (!merged.some((m) => m.id === sf.id)) {
          merged.push(sf);
        }
      }
    }
    return merged;
  }, [state.flights]);

  // Execute Zod Schema Validation Instantly on Form State
  const validationErrors = useMemo(() => {
    const parseRes = flightSearchSchema.safeParse({
      origin,
      destination,
      tripType,
      departDate,
      returnDate: tripType === 'round_trip' ? returnDate : undefined,
      adults,
      children,
      infants,
      cabinClass,
      airline: selectedAirlineFilter,
      stops: stopsFilter,
      sortBy,
    });

    if (!parseRes.success) {
      return parseRes.error.issues.map((i) => i.message);
    }
    return [];
  }, [
    origin,
    destination,
    tripType,
    departDate,
    returnDate,
    adults,
    children,
    infants,
    cabinClass,
    selectedAirlineFilter,
    stopsFilter,
    sortBy,
  ]);

  // Execute Mock Backend Data Handler IMMEDIATELY (Zero Delay Feedback)
  const backendResult = useMemo(() => {
    return executeLocalMockBackendFlightSearch(combinedFlightPool, {
      origin,
      destination,
      tripType,
      departDate,
      returnDate: tripType === 'round_trip' ? returnDate : undefined,
      adults,
      children,
      infants,
      cabinClass,
      airlineFilter: selectedAirlineFilter,
      stopsFilter,
      maxPriceFilter,
      sortBy,
    });
  }, [
    combinedFlightPool,
    origin,
    destination,
    tripType,
    departDate,
    returnDate,
    adults,
    children,
    infants,
    cabinClass,
    selectedAirlineFilter,
    stopsFilter,
    maxPriceFilter,
    sortBy,
  ]);

  // Path 2 WhatsApp Concierge Modal state
  const [conciergeFlight, setConciergeFlight] = useState<ProcessedFlightItem | null>(null);
  const [conciergeStep, setConciergeStep] = useState<'form' | 'success'>('form');
  const [customerName, setCustomerName] = useState<string>(state.currentUser.name || '');
  const [customerPhone, setCustomerPhone] = useState<string>(state.currentUser.phone || '');
  const [customerEmail, setCustomerEmail] = useState<string>(state.currentUser.email || '');
  const [conciergeConsent, setConciergeConsent] = useState<boolean>(false);
  const [conciergeError, setConciergeError] = useState<string>('');
  const [generatedRefCode, setGeneratedRefCode] = useState<string>('');
  const [generatedWhatsAppLink, setGeneratedWhatsAppLink] = useState<string>('');
  const [generatedMessageText, setGeneratedMessageText] = useState<string>('');
  const [copiedText, setCopiedText] = useState<boolean>(false);

  // Path 3 Instant Wallet Booking state
  const [walletFlight, setWalletFlight] = useState<ProcessedFlightItem | null>(null);
  const [passengerNin, setPassengerNin] = useState<string>('72910482910');
  const [fareRevalidated, setFareRevalidated] = useState<boolean>(false);
  const [revalidating, setRevalidating] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [walletBookingError, setWalletBookingError] = useState<string>('');

  // Route Price Alert state
  const [showPriceAlertModal, setShowPriceAlertModal] = useState<boolean>(false);
  const [showActiveAlertsDrawer, setShowActiveAlertsDrawer] = useState<boolean>(false);
  const [triggeredAlertBanner, setTriggeredAlertBanner] = useState<{
    alert: FlightRoutePriceAlert;
    flight: FlightOffer;
  } | null>(null);
  const [alertToastMessage, setAlertToastMessage] = useState<string | null>(null);

  // Auto-dismiss alert toast message after 6 seconds
  useEffect(() => {
    if (alertToastMessage) {
      const timer = setTimeout(() => {
        setAlertToastMessage(null);
      }, 6000);
      return () => clearTimeout(timer);
    }
  }, [alertToastMessage]);

  const totalPassengers = adults + children + infants;

  // Swap Origin and Destination
  const handleSwapAirports = () => {
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
  };

  // Route Price Alert Subscription & Evaluation Handler
  const handleSavePriceAlert = useCallback(
    (alertData: {
      origin: string;
      originCity: string;
      destination: string;
      destinationCity: string;
      targetPriceNgn: number;
      email: string;
      cabinClass: 'Economy' | 'Business';
      preferredDate?: string;
    }) => {
      // Find matching flights in combinedFlightPool
      const corridorFlights = combinedFlightPool.filter(
        (f) => f.origin === alertData.origin && f.destination === alertData.destination
      );

      const lowestFlight =
        corridorFlights.length > 0
          ? corridorFlights.reduce((min, f) => (f.totalPrice < min.totalPrice ? f : min), corridorFlights[0])
          : null;

      const currentLowest = lowestFlight ? lowestFlight.totalPrice : backendResult.cheapestPriceNgn;
      const isAlreadyTriggered = currentLowest > 0 && currentLowest <= alertData.targetPriceNgn;

      const newAlert: FlightRoutePriceAlert = {
        id: `flt_alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: state.currentUser?.id,
        email: alertData.email,
        origin: alertData.origin,
        originCity: alertData.originCity,
        destination: alertData.destination,
        destinationCity: alertData.destinationCity,
        targetPriceNgn: alertData.targetPriceNgn,
        currentLowestPriceNgn: currentLowest,
        lowestPriceAirline: lowestFlight?.airline || 'Arik Air',
        lowestFlightNumber: lowestFlight?.flightNumber || 'W3-722',
        cabinClass: alertData.cabinClass,
        preferredDate: alertData.preferredDate,
        status: isAlreadyTriggered ? 'triggered' : 'active',
        createdAt: new Date().toISOString(),
        lastCheckedAt: new Date().toISOString(),
        triggeredAt: isAlreadyTriggered ? new Date().toISOString() : undefined,
        triggeredFareNgn: isAlreadyTriggered ? currentLowest : undefined,
        notificationSent: isAlreadyTriggered,
        triggeredFlightDetails: isAlreadyTriggered && lowestFlight
          ? {
              airline: lowestFlight.airline,
              flightNumber: lowestFlight.flightNumber,
              departureTime: lowestFlight.departureTime,
              arrivalTime: lowestFlight.arrivalTime,
              priceNgn: lowestFlight.totalPrice,
              url: lowestFlight.airlineUrl,
            }
          : undefined,
      };

      const updatedAlerts = [newAlert, ...(state.flightPriceAlerts || [])];

      if (isAlreadyTriggered && lowestFlight) {
        // Trigger instant notification item in state
        const notif: NotificationItem = {
          id: `notif_flt_alert_${Date.now()}`,
          userId: state.currentUser?.id || 'usr_3plea_demo_01',
          title: `✈️ Fare Alert Triggered: ${alertData.origin} → ${alertData.destination}`,
          message: `Great news! ${lowestFlight.airline} (${lowestFlight.flightNumber}) is currently ₦${currentLowest.toLocaleString()}, which is below your target limit of ₦${alertData.targetPriceNgn.toLocaleString()}. Dispatched to ${alertData.email}.`,
          type: 'promo',
          read: false,
          createdAt: new Date().toISOString(),
        };

        updateState({
          flightPriceAlerts: updatedAlerts,
          notifications: [notif, ...(state.notifications || [])],
        });

        setTriggeredAlertBanner({
          alert: newAlert,
          flight: lowestFlight,
        });

        setAlertToastMessage(
          `🎉 Target threshold met! Instant fare drop alert dispatched to ${alertData.email} for ${alertData.origin} → ${alertData.destination} (₦${currentLowest.toLocaleString()}).`
        );
      } else {
        updateState({ flightPriceAlerts: updatedAlerts });
        setAlertToastMessage(
          `🔔 Route price alert activated! We'll notify ${alertData.email} as soon as fares on ${alertData.origin} → ${alertData.destination} drop below ₦${alertData.targetPriceNgn.toLocaleString()}.`
        );
      }
    },
    [combinedFlightPool, backendResult.cheapestPriceNgn, state.currentUser, state.flightPriceAlerts, state.notifications, updateState]
  );

  // Test Trigger / Simulation of Fare Drop
  const handleSimulateFareDrop = useCallback(
    (alert: FlightRoutePriceAlert) => {
      // Simulate an airline reducing fare to 12% below target limit
      const simulatedPrice = Math.max(10000, Math.round((alert.targetPriceNgn * 0.88) / 500) * 500);
      const simulatedFlight: FlightOffer = {
        id: `flt_sim_${Date.now()}`,
        airline: alert.lowestPriceAirline || 'Air Peace',
        airlineIata: 'P4',
        airlineUrl: 'https://flyairpeace.com',
        flightNumber: alert.lowestFlightNumber || 'P4-7120',
        origin: alert.origin,
        originCity: alert.originCity,
        destination: alert.destination,
        destinationCity: alert.destinationCity,
        departureTime: '08:30 AM',
        arrivalTime: '09:45 AM',
        duration: '1h 15m',
        cabinClass: alert.cabinClass || 'Economy',
        stops: 0,
        baggageAllowance: '20kg Checked + 7kg Cabin',
        fareRules: 'Promotional fare drop alert special',
        baseFare: simulatedPrice - 6000,
        taxes: 6000,
        totalPrice: simulatedPrice,
        availableSeats: 5,
        updatedAt: 'Just now',
        isEstimate: false,
      };

      const updatedAlerts = (state.flightPriceAlerts || []).map((a) => {
        if (a.id === alert.id) {
          return {
            ...a,
            status: 'triggered' as const,
            triggeredAt: new Date().toISOString(),
            triggeredFareNgn: simulatedPrice,
            currentLowestPriceNgn: simulatedPrice,
            notificationSent: true,
            triggeredFlightDetails: {
              airline: simulatedFlight.airline,
              flightNumber: simulatedFlight.flightNumber,
              departureTime: simulatedFlight.departureTime,
              arrivalTime: simulatedFlight.arrivalTime,
              priceNgn: simulatedPrice,
              url: simulatedFlight.airlineUrl,
            },
          };
        }
        return a;
      });

      const notif: NotificationItem = {
        id: `notif_flt_alert_${Date.now()}`,
        userId: state.currentUser?.id || 'usr_3plea_demo_01',
        title: `✈️ Price Drop Alert: ${alert.origin} → ${alert.destination} dropped to ₦${simulatedPrice.toLocaleString()}!`,
        message: `Alert trigger: ${simulatedFlight.airline} (${simulatedFlight.flightNumber}) dropped from ₦${alert.currentLowestPriceNgn.toLocaleString()} to ₦${simulatedPrice.toLocaleString()}, beating your threshold of ₦${alert.targetPriceNgn.toLocaleString()}. Notification sent to ${alert.email}.`,
        type: 'promo',
        read: false,
        createdAt: new Date().toISOString(),
      };

      updateState({
        flightPriceAlerts: updatedAlerts,
        notifications: [notif, ...(state.notifications || [])],
      });

      setTriggeredAlertBanner({
        alert: { ...alert, status: 'triggered', triggeredFareNgn: simulatedPrice },
        flight: simulatedFlight,
      });

      setAlertToastMessage(
        `⚡ Simulated Fare Drop Triggered! ${alert.origin} → ${alert.destination} is now ₦${simulatedPrice.toLocaleString()} (below your ₦${alert.targetPriceNgn.toLocaleString()} target). Notification sent to ${alert.email}!`
      );
    },
    [state.flightPriceAlerts, state.currentUser, state.notifications, updateState]
  );

  const handleToggleAlertStatus = useCallback(
    (alertId: string) => {
      const updatedAlerts = (state.flightPriceAlerts || []).map((a) => {
        if (a.id === alertId) {
          const nextStatus = a.status === 'active' ? ('paused' as const) : ('active' as const);
          return { ...a, status: nextStatus };
        }
        return a;
      });
      updateState({ flightPriceAlerts: updatedAlerts });
      setAlertToastMessage('Price alert status updated.');
    },
    [state.flightPriceAlerts, updateState]
  );

  const handleDeleteAlert = useCallback(
    (alertId: string) => {
      const updatedAlerts = (state.flightPriceAlerts || []).filter((a) => a.id !== alertId);
      updateState({ flightPriceAlerts: updatedAlerts });
      setAlertToastMessage('Price alert removed.');
    },
    [state.flightPriceAlerts, updateState]
  );

  // Quick route select
  const handleSelectPopularRoute = (rOrigin: string, rDest: string) => {
    setOrigin(rOrigin);
    setDestination(rDest);
  };

  // Generate Reference Code 3PA-YYYY-NNNN-XXXX
  const generateRef = () => {
    const year = new Date().getFullYear();
    const seq = Math.floor(1000 + Math.random() * 9000);
    const chars = '23456789ABCDEFGHJKMNPQRSTUVWXYZ';
    let entropy = '';
    for (let i = 0; i < 4; i++) {
      entropy += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `3PA-${year}-${seq}-${entropy}`;
  };

  // Open Path 2 Concierge Modal
  const handleOpenConciergeModal = (flight: ProcessedFlightItem) => {
    setConciergeFlight(flight);
    setConciergeStep('form');
    setConciergeConsent(false);
    setConciergeError('');
    setCopiedText(false);
  };

  // Submit Path 2 Concierge Booking
  const handleSubmitConciergeRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conciergeFlight) return;

    if (!customerName.trim() || !customerPhone.trim()) {
      setConciergeError('Please enter your full name and phone number.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\s+/g, '');
    const nigerianPhoneRegex = /^(?:\+?234|0)[789][01]\d{8}$/;
    if (!nigerianPhoneRegex.test(cleanPhone)) {
      setConciergeError('Please provide a valid Nigerian phone number (e.g. 08031234567 or +2348031234567).');
      return;
    }

    if (!conciergeConsent) {
      setConciergeError('Please check the consent box to proceed.');
      return;
    }

    const refCode = generateRef();

    const passArr: string[] = [];
    if (adults > 0) passArr.push(`${adults} Adult(s)`);
    if (children > 0) passArr.push(`${children} Child(ren)`);
    if (infants > 0) passArr.push(`${infants} Infant(s)`);
    const passStr = passArr.join(', ');

    // Canonical 3PLE A Travel WhatsApp Template
    const message =
      `Hello 3PLE A Travel 👋\n` +
      `I'd like to complete this booking:\n\n` +
      `🔖 Ref: ${refCode}\n` +
      `✈️ Airline: ${conciergeFlight.airline} (${conciergeFlight.flightNumber})\n` +
      `📍 Route: ${conciergeFlight.originCity.split('(')[0].trim()} (${conciergeFlight.origin}) → ${conciergeFlight.destinationCity.split('(')[0].trim()} (${conciergeFlight.destination})\n` +
      `📅 Date: ${departDate}\n` +
      `🕐 Time: ${conciergeFlight.departureTime}–${conciergeFlight.arrivalTime}\n` +
      `👥 Passengers: ${passStr}\n` +
      `💰 Quoted fare: ₦${conciergeFlight.calculatedPassengerFare.toLocaleString()}\n` +
      `🧾 Est. total incl. fee: ₦${conciergeFlight.conciergeTotalNgn.toLocaleString()}\n\n` +
      `Please confirm and send payment details. Thank you!`;

    const conciergeWaNumber = '2348030009999';
    const waLink = `https://wa.me/${conciergeWaNumber}?text=${encodeURIComponent(message)}`;

    setGeneratedRefCode(refCode);
    setGeneratedWhatsAppLink(waLink);
    setGeneratedMessageText(message);
    setConciergeStep('success');

    const newNotification = {
      id: `notif_${Date.now()}`,
      userId: state.currentUser.id,
      title: `Concierge Request Created: ${refCode}`,
      message: `Your booking request for ${conciergeFlight.airline} (${conciergeFlight.origin} → ${conciergeFlight.destination}) is ready for WhatsApp completion.`,
      type: 'transaction' as const,
      read: false,
      createdAt: new Date().toISOString(),
    };

    updateState({
      notifications: [newNotification, ...state.notifications],
    });
  };

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(generatedMessageText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2500);
  };

  // Path 3: Wallet Booking Handlers
  const handleSelectWalletFlight = (flight: ProcessedFlightItem) => {
    setWalletFlight(flight);
    setFareRevalidated(false);
    setWalletBookingError('');
  };

  const handleRevalidateFare = async () => {
    if (!customerName || !customerPhone || !passengerNin) {
      setWalletBookingError('Please fill in complete passenger identification (Name, Phone, NIN).');
      return;
    }
    setWalletBookingError('');
    setRevalidating(true);
    await new Promise((r) => setTimeout(r, 450));
    setRevalidating(false);
    setFareRevalidated(true);
  };

  const handleInitiateWalletBooking = () => {
    if (!walletFlight) return;
    const cost = walletFlight.calculatedPassengerFare;
    if (state.currentUser.walletBalance < cost) {
      setWalletBookingError('Insufficient wallet balance to cover flight ticket.');
      return;
    }
    setShowPinModal(true);
  };

  const handleExecuteWalletBooking = async () => {
    if (!walletFlight) return;
    setShowPinModal(false);
    setBookingLoading(true);
    setWalletBookingError('');

    try {
      const ref = `3PA-FLT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const activeProvider = providerService.getActiveProviderForService('flights');
      const totalCost = walletFlight.calculatedPassengerFare;

      const response = await providerService.executeFlightBooking(
        walletFlight.id,
        { passengerName: customerName, passengerNin, passengerPhone: customerPhone },
        totalCost,
        ref
      );

      const pnr = response.data?.pnr || `FLY${Math.floor(100000 + Math.random() * 900000)}`;
      const supplierRef = response.data?.supplierRef || `MSW-FLT-${Date.now().toString().slice(-4)}`;
      const ticketNumber = response.data?.ticketNumber || `074-${Math.floor(1000000000 + Math.random() * 9000000000)}`;

      const bookingRecord: FlightBooking = {
        id: `bk_${Date.now()}`,
        pnr,
        supplierRef,
        userId: state.currentUser.id,
        customerName,
        passengerCount: totalPassengers,
        passengers: [
          {
            title: 'MR',
            fullName: customerName,
            dob: '1992-06-15',
            gender: 'Male',
            ninOrPassport: passengerNin,
            ticketNumber,
          },
        ],
        flight: walletFlight,
        totalAmount: totalCost,
        bookingStatus: 'confirmed',
        bookingDate: new Date().toISOString(),
        eTicketIssued: true,
      };

      const newTx: Transaction = {
        id: `tx_${Date.now()}`,
        reference: ref,
        idempotencyKey: `idem_flt_${Date.now()}`,
        userId: state.currentUser.id,
        userName: state.currentUser.name,
        userPhone: state.currentUser.phone,
        type: 'flight_booking',
        amount: totalCost,
        fee: 0,
        discount: 0,
        totalDebited: totalCost,
        status: 'successful',
        provider: activeProvider?.displayName || 'MySubWallet Travel Hub',
        providerReference: supplierRef,
        productName: `${walletFlight.airline} (${walletFlight.origin} → ${walletFlight.destination})`,
        recipient: `PNR: ${pnr}`,
        metadata: {
          pnr,
          supplierRef,
          ticketNumber,
          flightNumber: walletFlight.flightNumber,
          origin: walletFlight.originCity,
          destination: walletFlight.destinationCity,
          departureTime: walletFlight.departureTime,
          baggage: walletFlight.baggageAllowance,
          providerResponse: response.rawResponse,
        },
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      const ledgerEntries = DoubleEntryLedgerEngine.recordFlightBooking(newTx, supplierRef);

      const updatedUser = {
        ...state.currentUser,
        walletBalance: state.currentUser.walletBalance - totalCost,
      };

      updateState({
        currentUser: updatedUser,
        transactions: [newTx, ...state.transactions],
        ledger: [...state.ledger, ...ledgerEntries],
        flightBookings: [bookingRecord, ...state.flightBookings],
      });

      setBookingLoading(false);
      setWalletFlight(null);
      onViewReceipt(newTx);
    } catch (err: any) {
      setBookingLoading(false);
      setWalletBookingError(err?.message || 'Flight booking failed.');
    }
  };

  const results = backendResult.directFlights;
  const suggestions = backendResult.alternativeSuggestions;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Toast Notification Banner */}
      {alertToastMessage && (
        <div className="p-3.5 rounded-2xl bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-between gap-3 shadow-md border border-amber-500 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-slate-950 shrink-0 animate-bounce" />
            <span>{alertToastMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setAlertToastMessage(null)}
            className="p-1 hover:bg-amber-300 rounded-lg transition-colors text-slate-950"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Triggered Alert Announcement Banner */}
      {triggeredAlertBanner && (
        <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-emerald-900 dark:text-emerald-100 shadow-sm animate-in fade-in">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">
                  🎉 Price Drop Alert Triggered!
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100 uppercase">
                  Threshold Met
                </span>
              </div>
              <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-1">
                <strong>{triggeredAlertBanner.alert.origin} → {triggeredAlertBanner.alert.destination}</strong> dropped to <strong>₦{triggeredAlertBanner.flight.totalPrice.toLocaleString()}</strong> on <strong>{triggeredAlertBanner.flight.airline} ({triggeredAlertBanner.flight.flightNumber})</strong> — below your <strong>₦{triggeredAlertBanner.alert.targetPriceNgn.toLocaleString()}</strong> target limit! An alert notification was sent to <strong>{triggeredAlertBanner.alert.email}</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <a
              href={triggeredAlertBanner.flight.airlineUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-xs flex items-center gap-1.5"
            >
              <span>Book on Airline</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => handleOpenConciergeModal(triggeredAlertBanner.flight as any)}
              className="px-3.5 py-2 text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl transition-all shadow-xs flex items-center gap-1"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </button>
            <button
              type="button"
              onClick={() => setTriggeredAlertBanner(null)}
              className="p-1.5 text-emerald-700 hover:text-emerald-950 dark:text-emerald-300 dark:hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Flight Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800">
        <img
          src="/src/assets/images/nigeria_domestic_flight_1793031987030.jpg"
          alt="Domestic Flights in Nigeria"
          className="w-full h-48 sm:h-56 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/50 to-transparent flex flex-col justify-end p-6 text-white">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
              3PLE A Flight Metasearch
            </span>
            <span className="text-xs text-emerald-300 font-semibold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> Instant Mock Backend Search Engine
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            {language === 'ha' ? 'Neman Tikitin Jiragen Sama a Najeriya' : 'Nigerian Domestic Flight Metasearch'}
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Compare all 12 scheduled Nigerian domestic airlines across 10 commercial airports. Real-time filtering with Dual-Path completion (Official Carrier Direct & WhatsApp Concierge).
          </p>
        </div>
      </div>

      {/* Popular Routes Quick-Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider text-[11px] shrink-0">
          Popular Routes:
        </span>
        {POPULAR_ROUTES.map((r) => (
          <button
            key={r.label}
            type="button"
            onClick={() => handleSelectPopularRoute(r.origin, r.dest)}
            className={`px-3 py-1.5 rounded-full font-bold whitespace-nowrap transition-all border ${
              origin === r.origin && destination === r.dest
                ? 'bg-amber-400 text-slate-950 border-amber-400 shadow-xs'
                : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Public Search Engine Box */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-sm space-y-4">
        {/* Top Controls: Trip Type, Passengers, Cabin */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTripType('one_way')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                tripType === 'one_way'
                  ? 'bg-slate-900 dark:bg-amber-500 dark:text-slate-950 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              One Way
            </button>
            <button
              type="button"
              onClick={() => setTripType('round_trip')}
              className={`px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                tripType === 'round_trip'
                  ? 'bg-slate-900 dark:bg-amber-500 dark:text-slate-950 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Round Trip
            </button>
          </div>

          <div className="flex items-center gap-3 relative">
            {/* Passenger Selector Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowPassengerPicker(!showPassengerPicker)}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-800 dark:text-slate-200 hover:bg-slate-100"
              >
                <Users className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {totalPassengers} Passenger{totalPassengers > 1 ? 's' : ''}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Passenger Dropdown Modal */}
              {showPassengerPicker && (
                <div className="absolute right-0 top-10 w-64 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl p-4 z-40 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">Adults</div>
                      <div className="text-[10px] text-slate-400">Age 12+</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAdults(Math.max(1, adults - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-800 dark:text-white"
                      >
                        -
                      </button>
                      <span className="font-bold text-slate-900 dark:text-white">{adults}</span>
                      <button
                        type="button"
                        onClick={() => setAdults(Math.min(9, adults + 1))}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-800 dark:text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">Children</div>
                      <div className="text-[10px] text-slate-400">Age 2–11 (75% fare)</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setChildren(Math.max(0, children - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-800 dark:text-white"
                      >
                        -
                      </button>
                      <span className="font-bold text-slate-900 dark:text-white">{children}</span>
                      <button
                        type="button"
                        onClick={() => setChildren(Math.min(8, children + 1))}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-800 dark:text-white"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">Infants</div>
                      <div className="text-[10px] text-slate-400">Under 2 (Lap infant ≤ adults)</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInfants(Math.max(0, infants - 1))}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-800 dark:text-white"
                      >
                        -
                      </button>
                      <span className="font-bold text-slate-900 dark:text-white">{infants}</span>
                      <button
                        type="button"
                        onClick={() => setInfants(Math.min(adults, infants + 1))}
                        className="w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-slate-800 dark:text-white disabled:opacity-50"
                        disabled={infants >= adults}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowPassengerPicker(false)}
                    className="w-full py-2 bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 text-xs font-bold rounded-xl"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>

            {/* Cabin Class */}
            <select
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
            >
              <option value="Economy">Economy</option>
              <option value="Business">Business</option>
            </select>
          </div>
        </div>

        {/* Airport Selectors & Date Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          {/* Origin Airport */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              From (Origin)
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              {AIRPORTS.map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name} - {a.city}
                </option>
              ))}
            </select>
          </div>

          {/* Swap Button */}
          <div className="md:col-span-1 flex items-center justify-center">
            <button
              type="button"
              onClick={handleSwapAirports}
              title="Swap Airports"
              className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-transform active:rotate-180"
            >
              <ArrowRight className="w-4 h-4 rotate-90 md:rotate-0" />
            </button>
          </div>

          {/* Destination Airport */}
          <div className="md:col-span-4">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              To (Destination)
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3.5 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-bold text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              {AIRPORTS.filter((a) => a.code !== origin).map((a) => (
                <option key={a.code} value={a.code}>
                  {a.name} - {a.city}
                </option>
              ))}
            </select>
          </div>

          {/* Departure Date */}
          <div className={tripType === 'round_trip' ? 'md:col-span-3' : 'md:col-span-3'}>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Departure Date
            </label>
            <input
              type="date"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>

        {/* Round Trip Return Date if selected */}
        {tripType === 'round_trip' && (
          <div className="pt-2">
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              Return Date
            </label>
            <input
              type="date"
              value={returnDate}
              onChange={(e) => setReturnDate(e.target.value)}
              className="max-w-xs px-3 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl font-medium text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
        )}

        {/* Validation Errors banner if any */}
        {validationErrors.length > 0 && (
          <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 space-y-1">
            <div className="font-bold flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Search validation issues:</span>
            </div>
            <ul className="list-disc list-inside pl-1 space-y-0.5">
              {validationErrors.map((err, i) => (
                <li key={i}>{err}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ENHANCED FILTERING SYSTEM (Airline, Price Range, and Stops) */}
        <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-4">
          {/* Row 1: Airline Quick Chips */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-amber-500" />
                <span>Filter by Carrier ({backendResult.availableAirlinesOnRoute.length} operating on route):</span>
              </span>
              {selectedAirlineFilter !== 'all' && (
                <button
                  type="button"
                  onClick={() => setSelectedAirlineFilter('all')}
                  className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Show All Airlines
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <button
                type="button"
                onClick={() => setSelectedAirlineFilter('all')}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all border ${
                  selectedAirlineFilter === 'all'
                    ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 border-slate-900 dark:border-amber-500 shadow-xs'
                    : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                }`}
              >
                All Carriers ({backendResult.totalUnfilteredMatches})
              </button>

              {backendResult.availableAirlinesOnRoute.map((airline) => (
                <button
                  key={airline.name}
                  type="button"
                  onClick={() => setSelectedAirlineFilter(airline.name)}
                  className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all border flex items-center gap-1.5 ${
                    selectedAirlineFilter.toLowerCase() === airline.name.toLowerCase()
                      ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950 border-slate-900 dark:border-amber-500 shadow-xs'
                      : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{airline.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                    {airline.count}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Price Range Slider & Stops Segmented Control */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            {/* Price Range Slider */}
            <div className="md:col-span-6 space-y-1.5 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <span>Price Range Limit:</span>
                  <span className="text-amber-600 dark:text-amber-400 font-extrabold font-mono">
                    {maxPriceFilter !== null
                      ? `Up to ₦${maxPriceFilter.toLocaleString()}`
                      : `Max: ₦${backendResult.highestPriceNgn.toLocaleString()}`}
                  </span>
                </span>
                {maxPriceFilter !== null && (
                  <button
                    type="button"
                    onClick={() => setMaxPriceFilter(null)}
                    className="text-[11px] text-slate-500 hover:text-slate-800 dark:hover:text-white underline font-semibold"
                  >
                    Reset Price
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[10px] text-slate-400 font-mono">
                  ₦{backendResult.cheapestPriceNgn.toLocaleString()}
                </span>
                <input
                  type="range"
                  min={Math.max(50000, backendResult.cheapestPriceNgn - 10000)}
                  max={Math.max(150000, backendResult.highestPriceNgn + 20000)}
                  step={2000}
                  value={maxPriceFilter !== null ? maxPriceFilter : backendResult.highestPriceNgn}
                  onChange={(e) => setMaxPriceFilter(parseInt(e.target.value, 10))}
                  className="flex-1 accent-amber-500 cursor-pointer h-2 bg-slate-200 dark:bg-slate-700 rounded-lg"
                />
                <span className="text-[10px] text-slate-400 font-mono">
                  ₦{(Math.max(150000, backendResult.highestPriceNgn + 20000)).toLocaleString()}
                </span>
              </div>
            </div>

            {/* Stops Filter (Segmented Tabs) */}
            <div className="md:col-span-3 space-y-1.5">
              <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Stops
              </span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setStopsFilter('all')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    stopsFilter === 'all'
                      ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setStopsFilter('0')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    stopsFilter === '0'
                      ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950'
                  }`}
                >
                  Direct (0)
                </button>
                <button
                  type="button"
                  onClick={() => setStopsFilter('1')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    stopsFilter === '1'
                      ? 'bg-white dark:bg-slate-900 text-slate-950 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950'
                  }`}
                >
                  1 Stop
                </button>
              </div>
            </div>

            {/* Sorting Tabs */}
            <div className="md:col-span-3 space-y-1.5">
              <span className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Sort Itineraries
              </span>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                <button
                  type="button"
                  onClick={() => setSortBy('price_asc')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    sortBy === 'price_asc' || sortBy === 'cheapest'
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950'
                  }`}
                >
                  Cheapest
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('duration_asc')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    sortBy === 'duration_asc' || sortBy === 'fastest'
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950'
                  }`}
                >
                  Fastest
                </button>
                <button
                  type="button"
                  onClick={() => setSortBy('departure_asc')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition-all ${
                    sortBy === 'departure_asc' || sortBy === 'earliest'
                      ? 'bg-amber-400 text-slate-950 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950'
                  }`}
                >
                  Earliest
                </button>
              </div>
            </div>
          </div>

          {/* Row 3: Active Filter Chips Bar (Shown when any non-default filter is active) */}
          {(selectedAirlineFilter !== 'all' || maxPriceFilter !== null || stopsFilter !== 'all') && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px] font-semibold">Active Filters:</span>

              {selectedAirlineFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-medium text-[11px]">
                  <span>Airline: {selectedAirlineFilter}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedAirlineFilter('all')}
                    className="hover:text-rose-600 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {maxPriceFilter !== null && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-medium text-[11px]">
                  <span>Max: ₦{maxPriceFilter.toLocaleString()}</span>
                  <button
                    type="button"
                    onClick={() => setMaxPriceFilter(null)}
                    className="hover:text-rose-600 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              {stopsFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-medium text-[11px]">
                  <span>Stops: {stopsFilter === '0' ? 'Non-stop only' : '1 Stop'}</span>
                  <button
                    type="button"
                    onClick={() => setStopsFilter('all')}
                    className="hover:text-rose-600 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}

              <button
                type="button"
                onClick={() => {
                  setSelectedAirlineFilter('all');
                  setMaxPriceFilter(null);
                  setStopsFilter('all');
                }}
                className="text-xs text-rose-600 dark:text-rose-400 hover:underline font-bold ml-1"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Immediate Mock Backend Telemetry & Transparency Badge */}
      <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-900 dark:text-amber-200">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>
            <strong>Data Freshness & Transparency:</strong> Nigerian airlines do not provide open public fare APIs. Fares are aggregated estimates and are confirmed upon direct airline booking or concierge handoff.
          </span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono whitespace-nowrap text-amber-700 dark:text-amber-300">
          <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
          <span>Filter Speed: {backendResult.executionTimeMs}ms • </span>
          <span>Corridor: ₦{backendResult.cheapestPriceNgn.toLocaleString()}–₦{backendResult.highestPriceNgn.toLocaleString()}</span>
        </div>
      </div>

      {/* ROUTE PRICE DROP ALERT BAR */}
      <div className="bg-gradient-to-r from-amber-500/15 via-amber-500/5 to-transparent dark:from-amber-400/20 dark:via-amber-400/5 border border-amber-300/80 dark:border-amber-800/80 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-700 dark:text-amber-300 shrink-0">
            <BellRing className="w-5 h-5 text-amber-600 dark:text-amber-400 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Track Fare Drops for {backendResult.originAirport?.city || origin} ({origin}) → {backendResult.destinationAirport?.city || destination} ({destination})
              </h4>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                Email & In-App Alert
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Current lowest market fare is <strong className="text-slate-900 dark:text-white">₦{backendResult.cheapestPriceNgn.toLocaleString()}</strong>. Set your target price threshold and we'll notify you the moment fares drop below your limit.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setShowPriceAlertModal(true)}
            className="px-3.5 py-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Set Price Alert</span>
          </button>

          <button
            type="button"
            onClick={() => setShowActiveAlertsDrawer(!showActiveAlertsDrawer)}
            className="px-3 py-2 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs rounded-xl border border-slate-200 dark:border-slate-700 transition-all flex items-center gap-1.5"
          >
            <Mail className="w-3.5 h-3.5 text-slate-500" />
            <span>My Alerts ({(state.flightPriceAlerts || []).length})</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showActiveAlertsDrawer ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* MY ROUTE PRICE ALERTS DRAWER / MANAGEMENT PANEL */}
      {showActiveAlertsDrawer && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-5 shadow-xs space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-500" />
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                Subscribed Route Price Alerts ({(state.flightPriceAlerts || []).length})
              </h4>
            </div>
            <button
              type="button"
              onClick={() => setShowPriceAlertModal(true)}
              className="text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1"
            >
              <span>+ Add New Route Alert</span>
            </button>
          </div>

          {(!state.flightPriceAlerts || state.flightPriceAlerts.length === 0) ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 py-3 text-center">
              No active route price alerts yet. Click "Set Price Alert" above to track fares on your favorite routes!
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(state.flightPriceAlerts || []).map((alert) => {
                const isTriggered = alert.status === 'triggered';
                const isPaused = alert.status === 'paused';
                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-2xl border transition-all space-y-2.5 ${
                      isTriggered
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-300 dark:border-amber-800'
                        : isPaused
                        ? 'bg-slate-50 dark:bg-slate-800/40 border-slate-200 dark:border-slate-800 opacity-75'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded text-slate-900 dark:text-white">
                          {alert.origin} → {alert.destination}
                        </span>
                        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                          {alert.originCity} to {alert.destinationCity}
                        </span>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          isTriggered
                            ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                            : isPaused
                            ? 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-300'
                            : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                        }`}
                      >
                        {isTriggered ? 'Target Met!' : isPaused ? 'Paused' : 'Monitoring'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <div>
                        <span className="text-slate-400 text-[11px] block">Target Threshold:</span>
                        <span className="font-bold text-slate-900 dark:text-white font-mono">
                          ₦{alert.targetPriceNgn.toLocaleString()}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-slate-400 text-[11px] block">
                          {isTriggered ? 'Triggered At:' : 'Current Market:'}
                        </span>
                        <span className={`font-bold font-mono ${isTriggered ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-700 dark:text-slate-300'}`}>
                          ₦{(alert.triggeredFareNgn || alert.currentLowestPriceNgn).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                      <div className="flex items-center gap-1 truncate max-w-[200px]" title={alert.email}>
                        <Mail className="w-3 h-3 shrink-0 text-slate-400" />
                        <span className="truncate">{alert.email}</span>
                      </div>
                      <span>{alert.cabinClass || 'Economy'}</span>
                    </div>

                    {/* Alert Card Action Buttons */}
                    <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
                      <button
                        type="button"
                        onClick={() => handleSimulateFareDrop(alert)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-amber-400/20 hover:bg-amber-400 text-amber-900 dark:text-amber-200 hover:text-slate-950 border border-amber-300 dark:border-amber-800 transition-colors flex items-center gap-1"
                        title="Simulate an airline dropping prices below target"
                      >
                        <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span>Simulate Fare Drop</span>
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleToggleAlertStatus(alert.id)}
                          className="p-1.5 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
                          title={isPaused ? 'Resume monitoring' : 'Pause alert'}
                        >
                          {isPaused ? <Play className="w-3.5 h-3.5 text-emerald-600" /> : <Pause className="w-3.5 h-3.5 text-slate-400" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteAlert(alert.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="Delete alert"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ENHANCED RESULTS VIEW HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Available Flight Itineraries
            </h3>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
              {results.length} of {backendResult.totalUnfilteredMatches} Flights
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {backendResult.originAirport?.name || origin} → {backendResult.destinationAirport?.name || destination} • {departDate} • {totalPassengers} Passenger{totalPassengers > 1 ? 's' : ''} • {cabinClass}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Quick Price Alert CTA Button */}
          <button
            type="button"
            onClick={() => setShowPriceAlertModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-900/60 rounded-xl border border-amber-300 dark:border-amber-800 text-xs font-bold transition-all shadow-2xs active:scale-95"
            title="Set price drop alert for this route"
          >
            <Bell className="w-3.5 h-3.5 text-amber-500" />
            <span>Price Alert</span>
          </button>

          {/* Sort Select Dropdown in Results Header */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <label htmlFor="results-sort-by" className="text-xs font-semibold text-slate-500 dark:text-slate-400 shrink-0">
              Sort:
            </label>
            <select
              id="results-sort-by"
              value={
                sortBy === 'cheapest' ? 'price_asc' :
                sortBy === 'fastest' ? 'duration_asc' :
                sortBy === 'earliest' ? 'departure_asc' :
                sortBy
              }
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer pr-1"
              aria-label="Order flight results"
            >
              <option value="price_asc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                Price: Low to High
              </option>
              <option value="duration_asc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                Fastest Duration
              </option>
              <option value="departure_asc" className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                Earliest Departure
              </option>
            </select>
          </div>

          <span className="hidden sm:inline-flex text-xs text-emerald-600 dark:text-emerald-400 font-semibold items-center gap-1">
            <ShieldCheck className="w-4 h-4" /> 0% Markup
          </span>
        </div>
      </div>

      {/* Flight Cards Listing with DUAL CTA */}
      <div className="space-y-4">
        {results.map((flight) => {
          const isWalletSelected = walletFlight?.id === flight.id;

          return (
            <div
              key={flight.id}
              className={`bg-white dark:bg-slate-900 rounded-3xl border p-5 sm:p-6 transition-all ${
                isWalletSelected
                  ? 'border-amber-400 ring-2 ring-amber-400 shadow-md'
                  : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              {/* Header: Carrier info & Flight Timing */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-800 dark:text-white text-sm border border-slate-200 dark:border-slate-700">
                    {flight.airlineIata || flight.airline.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white text-base">
                        {flight.airline}
                      </span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {flight.flightNumber}
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {flight.updatedAt || 'Updated recently'} • {flight.cabinClass}
                    </span>
                  </div>
                </div>

                {/* Timing & Duration Visual */}
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <span className="block text-xl font-black text-slate-900 dark:text-white">
                      {flight.departureTime}
                    </span>
                    <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {flight.origin}
                    </span>
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                      <Clock className="w-3 h-3" /> {flight.duration}
                    </span>
                    <div className="relative w-24 sm:w-32 my-1 flex items-center justify-center">
                      <div className="h-[2px] w-full bg-slate-200 dark:bg-slate-700" />
                      <Plane className="w-3.5 h-3.5 text-amber-500 absolute rotate-90" />
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                      {flight.stops === 0 ? 'Non-stop' : `${flight.stops} Stop`}
                    </span>
                  </div>

                  <div className="text-center">
                    <span className="block text-xl font-black text-slate-900 dark:text-white">
                      {flight.arrivalTime}
                    </span>
                    <span className="block text-xs font-semibold text-slate-500 dark:text-slate-400">
                      {flight.destination}
                    </span>
                  </div>
                </div>

                {/* Quoted Total Fare */}
                <div className="text-right">
                  <span className="block text-[11px] text-slate-400 uppercase font-semibold">
                    Total Quoted Fare
                  </span>
                  <span className="block text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                    ₦{flight.calculatedPassengerFare.toLocaleString()}
                  </span>
                  <span className="block text-[11px] text-slate-400">
                    ₦{flight.totalPrice.toLocaleString()} / adult
                  </span>
                </div>
              </div>

              {/* DUAL CTA ROW */}
              <div className="pt-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                  <Luggage className="w-4 h-4 text-slate-400" />
                  <span>{flight.baggageAllowance}</span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  {/* PATH 1: Book on Airline Site */}
                  <a
                    href={flight.airlineUrl || 'https://flyairpeace.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <span>Book on Airline Site</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>

                  {/* PATH 2: Book via WhatsApp Concierge */}
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => handleOpenConciergeModal(flight)}
                      className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-sm shadow-emerald-700/20"
                    >
                      <MessageCircle className="w-4 h-4 fill-white" />
                      <span>Book via WhatsApp</span>
                    </button>
                    <span className="hidden sm:block absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      5% fee (₦{flight.conciergeFeeNgn.toLocaleString()}) • Assisted Bank Transfer
                    </span>
                  </div>

                  {/* PATH 3: Instant Wallet Checkout */}
                  <button
                    type="button"
                    onClick={() => handleSelectWalletFlight(flight)}
                    className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold text-xs transition-colors"
                  >
                    <Wallet className="w-3.5 h-3.5" />
                    <span>Pay with Wallet</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {/* Empty state when no exact flights match */}
        {results.length === 0 && (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                No Direct Flights Found for {origin} → {destination}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                No scheduled carriers have active non-stop inventory on this route for {departDate}. Explore alternative connections below or adjust your date.
              </p>
            </div>

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="pt-4 text-left border-t border-slate-100 dark:border-slate-800">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block mb-3">
                  Alternative Domestic Flights Available on {departDate}:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {suggestions.map((s) => (
                    <div
                      key={s.id}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          {s.airline} ({s.origin} → {s.destination})
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {s.departureTime} • ₦{s.calculatedPassengerFare.toLocaleString()}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setOrigin(s.origin);
                          setDestination(s.destination);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold"
                      >
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PATH 2 CONCIERGE MODAL */}
      {conciergeFlight && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 dark:border-slate-800 max-h-[90vh] overflow-y-auto space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Path 2 • Concierge Desk
                </span>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                  {conciergeStep === 'form' ? 'Complete Booking via WhatsApp' : 'Booking Request Ready!'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setConciergeFlight(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {conciergeError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{conciergeError}</span>
              </div>
            )}

            {conciergeStep === 'form' ? (
              <form onSubmit={handleSubmitConciergeRequest} className="space-y-4">
                {/* Flight Snapshot Summary */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white text-sm">
                    <span>
                      {conciergeFlight.airline} ({conciergeFlight.flightNumber})
                    </span>
                    <span>
                      {conciergeFlight.origin} → {conciergeFlight.destination}
                    </span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>
                      {departDate} • {conciergeFlight.departureTime}–{conciergeFlight.arrivalTime}
                    </span>
                    <span>
                      {adults} Adult(s), {children} Child(ren), {infants} Infant(s)
                    </span>
                  </div>
                </div>

                {/* Customer Details */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Full Name (as on Government ID / NIN) *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="e.g. Aliyu Mohammed"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      WhatsApp Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="0803 123 4567 or +234..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Email Address (Optional)
                    </label>
                    <input
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Price Breakdown Card */}
                <div className="p-4 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs space-y-1.5">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Quoted Airline Fare:</span>
                    <span>₦{conciergeFlight.calculatedPassengerFare.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>3PLE A Concierge Fee (5%, min ₦500, capped ₦9,500):</span>
                    <span>₦{conciergeFlight.conciergeFeeNgn.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between font-bold text-slate-900 dark:text-white text-sm pt-2 border-t border-emerald-200 dark:border-emerald-800">
                    <span>Estimated Total (Paid via Bank Transfer):</span>
                    <span className="text-emerald-700 dark:text-emerald-300">
                      ₦{conciergeFlight.conciergeTotalNgn.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Consent Checkbox */}
                <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    required
                    checked={conciergeConsent}
                    onChange={(e) => setConciergeConsent(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <span className="text-xs text-slate-600 dark:text-slate-400 leading-snug">
                    I understand the concierge fee and that the final booking is completed on WhatsApp with a 3PLE A agent via direct bank transfer.
                  </span>
                </label>

                <button
                  type="submit"
                  className="w-full py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-colors flex items-center justify-center gap-2 shadow-md shadow-emerald-700/20"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Generate WhatsApp Request Code</span>
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-center">
                {/* Reference Code Display */}
                <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  <span className="block text-xs uppercase font-bold text-emerald-700 dark:text-emerald-300 tracking-wider">
                    Booking Reference Code
                  </span>
                  <span className="block text-2xl font-black font-mono text-slate-900 dark:text-white mt-1 select-all">
                    {generatedRefCode}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Share this unique reference code with our concierge agent.
                  </span>
                </div>

                {/* WhatsApp Action Button */}
                <a
                  href={generatedWhatsAppLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30"
                >
                  <MessageCircle className="w-5 h-5 fill-white" />
                  <span>Continue on WhatsApp</span>
                </a>

                {/* Message Copy Fallback */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Pre-filled Message Preview:
                    </span>
                    <button
                      type="button"
                      onClick={handleCopyMessage}
                      className="inline-flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 hover:underline font-semibold"
                    >
                      {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText ? 'Copied!' : 'Copy Text'}</span>
                    </button>
                  </div>
                  <pre className="text-[11px] font-mono text-slate-600 dark:text-slate-300 whitespace-pre-wrap bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 overflow-x-auto">
                    {generatedMessageText}
                  </pre>
                </div>

                {/* Direct Airline Booking Fallback */}
                <div className="pt-2 text-xs text-slate-500 dark:text-slate-400">
                  Prefer to book yourself directly with zero fee?{' '}
                  <a
                    href={conciergeFlight?.airlineUrl || 'https://flyairpeace.com'}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-600 dark:text-emerald-400 font-semibold hover:underline inline-flex items-center gap-1"
                  >
                    Go to official {conciergeFlight?.airline} website
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* PATH 3 INSTANT WALLET CHECKOUT DRAWER */}
      {walletFlight && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border-2 border-amber-400 p-6 shadow-md space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Path 3 • 3PLE A Wallet Instant Checkout
              </span>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Passenger Identification & Revalidation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {walletFlight.airline} {walletFlight.flightNumber} ({walletFlight.origin} → {walletFlight.destination})
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs text-slate-400 block">Debited Amount</span>
              <span className="text-lg font-black font-mono text-slate-900 dark:text-amber-400 tabular-nums">
                ₦{walletFlight.calculatedPassengerFare.toLocaleString()}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Passenger Full Name (as on ID)
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => {
                  setCustomerName(e.target.value);
                  setFareRevalidated(false);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => {
                  setCustomerPhone(e.target.value);
                  setFareRevalidated(false);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                NIN or Passport Number
              </label>
              <input
                type="text"
                value={passengerNin}
                onChange={(e) => {
                  setPassengerNin(e.target.value);
                  setFareRevalidated(false);
                }}
                placeholder="National Identity Number"
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none"
              />
            </div>
          </div>

          {/* Revalidation Step */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                Supplier Pre-Booking Revalidation
              </span>
              <span className="text-slate-500 dark:text-slate-400">
                Locks airline inventory and verifies seat availability before debiting your wallet.
              </span>
            </div>

            {fareRevalidated ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                <Check className="w-4 h-4" />
                <span>Inventory Confirmed</span>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRevalidateFare}
                disabled={revalidating}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 whitespace-nowrap"
              >
                {revalidating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Revalidating...</span>
                  </>
                ) : (
                  <span>Revalidate Fare</span>
                )}
              </button>
            )}
          </div>

          {walletBookingError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl text-xs border border-red-100 dark:border-red-900/60">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{walletBookingError}</span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setWalletFlight(null)}
              className="px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleInitiateWalletBooking}
              disabled={bookingLoading || !fareRevalidated}
              className="flex-1 py-3.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white font-semibold text-sm rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {bookingLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-amber-400 dark:text-slate-950" />
                  <span>Issuing PNR & E-Ticket...</span>
                </>
              ) : (
                <>
                  <Ticket className="w-4 h-4 text-amber-400 dark:text-slate-950" />
                  <span>
                    Confirm & Issue E-Ticket (₦{walletFlight.calculatedPassengerFare.toLocaleString()})
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Booking History & E-Ticket Manager */}
      {state.flightBookings.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Your Flight Bookings & E-Tickets ({state.flightBookings.length})
          </h3>

          <div className="space-y-3">
            {state.flightBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                      PNR: {b.pnr}
                    </span>
                    <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-2 py-0.5 rounded font-bold uppercase border border-emerald-200 dark:border-emerald-800">
                      {b.bookingStatus}
                    </span>
                  </div>
                  <div className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                    {b.flight.airline} ({b.flight.flightNumber}) · {b.flight.origin} to {b.flight.destination}
                  </div>
                  <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                    Passenger: {b.customerName} · Supplier Ref: {b.supplierRef}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      alert(
                        'Cancellation & Refund Request Submitted to Airline Supplier. Under Nigerian CAA & carrier fare rules, cancellation penalty will be reconciled in 24 hours.'
                      )
                    }
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-xl transition-colors flex items-center gap-1 border border-rose-200 dark:border-rose-900/60"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Cancel / Refund</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PIN Authorization Modal for Wallet */}
      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handleExecuteWalletBooking}
        title="Authorize Flight Ticket Payment"
        amount={walletFlight?.calculatedPassengerFare || 0}
        recipient={`Airline PNR (${walletFlight?.airline})`}
      />

      {/* Route Price Alert Subscription Modal */}
      <FlightPriceAlertModal
        isOpen={showPriceAlertModal}
        onClose={() => setShowPriceAlertModal(false)}
        origin={origin}
        originCity={backendResult.originAirport?.city || origin}
        destination={destination}
        destinationCity={backendResult.destinationAirport?.city || destination}
        currentLowestFare={backendResult.cheapestPriceNgn}
        userEmail={state.currentUser?.email || '3pleadata@gmail.com'}
        cabinClass={cabinClass}
        preferredDate={departDate}
        onSaveAlert={handleSavePriceAlert}
      />
    </div>
  );
};
