import { z } from 'zod';
import { FlightOffer } from '../types';

// ============================================================================
// 1. ZOD SCHEMA FOR FLIGHT SEARCH VALIDATION
// ============================================================================

export const CABIN_CLASSES = ['Economy', 'Business'] as const;
export const TRIP_TYPES = ['one_way', 'round_trip'] as const;

export const flightSearchSchema = z
  .object({
    origin: z
      .string()
      .trim()
      .toUpperCase()
      .length(3, 'Origin airport code must be exactly 3 letters (e.g. LOS)'),
    destination: z
      .string()
      .trim()
      .toUpperCase()
      .length(3, 'Destination airport code must be exactly 3 letters (e.g. ABV)'),
    tripType: z.enum(TRIP_TYPES).default('one_way'),
    departDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Departure date must be in YYYY-MM-DD format'),
    returnDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Return date must be in YYYY-MM-DD format')
      .optional()
      .or(z.literal('')),
    adults: z
      .number()
      .int()
      .min(1, 'At least 1 adult passenger is required')
      .max(9, 'Maximum 9 adult passengers allowed')
      .default(1),
    children: z
      .number()
      .int()
      .min(0)
      .max(8, 'Maximum 8 children allowed')
      .default(0),
    infants: z
      .number()
      .int()
      .min(0)
      .max(4, 'Maximum 4 lap infants allowed')
      .default(0),
    cabinClass: z.enum(CABIN_CLASSES).default('Economy'),
    airline: z.string().optional().default('all'),
    stops: z.enum(['all', '0', '1']).default('all'),
    sortBy: z
      .enum(['cheapest', 'fastest', 'earliest', 'price_asc', 'duration_asc', 'departure_asc'])
      .default('price_asc'),
  })
  .superRefine((data, ctx) => {
    // 1. Origin ≠ Destination
    if (data.origin === data.destination) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['destination'],
        message: 'Destination airport cannot be the same as origin airport',
      });
    }

    // 2. Aviation safety invariant: Lap infants cannot exceed accompanying adults
    if (data.infants > data.adults) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['infants'],
        message: `Number of infants (${data.infants}) cannot exceed adult passengers (${data.adults})`,
      });
    }

    // 3. Date validation: Cannot be in the past or > 365 days
    if (data.departDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const depart = new Date(data.departDate);
      if (isNaN(depart.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['departDate'],
          message: 'Invalid departure date',
        });
      } else {
        const diffDays = Math.ceil((depart.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays < 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['departDate'],
            message: 'Departure date cannot be in the past',
          });
        }
        if (diffDays > 365) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['departDate'],
            message: 'Departure date cannot be more than 365 days in advance',
          });
        }
      }
    }

    // 4. Return date must be >= depart date for round trips
    if (data.tripType === 'round_trip') {
      if (!data.returnDate) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['returnDate'],
          message: 'Return date is required for round trips',
        });
      } else {
        const depart = new Date(data.departDate);
        const returnD = new Date(data.returnDate);
        if (returnD < depart) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['returnDate'],
            message: 'Return date must be on or after the departure date',
          });
        }
      }
    }
  });

export type FlightSearchParams = z.infer<typeof flightSearchSchema>;

export interface SearchValidationError {
  field: string;
  message: string;
}

export interface SearchFlightResultItem extends FlightOffer {
  calculatedPassengerFare: number;
  conciergeFeeNgn: number;
  conciergeTotalNgn: number;
  departureDate: string;
}

export interface FlightSearchResponse {
  success: boolean;
  query: FlightSearchParams;
  results: SearchFlightResultItem[];
  alternativeSuggestions: SearchFlightResultItem[];
  meta: {
    originCode: string;
    destCode: string;
    departDate: string;
    passengersCount: number;
    totalResults: number;
    cheapestPriceNgn: number;
    fastestDuration: string;
    searchLatencyMs: number;
    disclaimer: string;
  };
  errors?: SearchValidationError[];
}

// ============================================================================
// 2. MOCK BACKEND DATA HANDLER
// ============================================================================

/**
 * Server-like mock handler that:
 * 1. Validates the incoming search payload against the Zod schema
 * 2. Filters the flight database by origin, destination, cabin, stops, and airline
 * 3. Applies demand-based day-of-week fare adjustments for the requested date
 * 4. Recalculates exact passenger combinations (Adults full, Children 75%, Infants 10%)
 * 5. Computes server-authoritative concierge fees (5%, min ₦500, max ₦9,500)
 * 6. Generates alternative route suggestions if no exact flight exists for the pair
 */
export async function mockFlightSearchBackend(
  rawParams: unknown,
  databaseFlights: FlightOffer[]
): Promise<FlightSearchResponse> {
  const startTime = performance.now();

  // 1. Zod Validation
  const validationResult = flightSearchSchema.safeParse(rawParams);

  if (!validationResult.success) {
    const fieldErrors: SearchValidationError[] = validationResult.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));

    return {
      success: false,
      query: (rawParams as FlightSearchParams) || ({} as FlightSearchParams),
      results: [],
      alternativeSuggestions: [],
      meta: {
        originCode: '',
        destCode: '',
        departDate: '',
        passengersCount: 0,
        totalResults: 0,
        cheapestPriceNgn: 0,
        fastestDuration: '',
        searchLatencyMs: Math.round(performance.now() - startTime),
        disclaimer: 'Validation failed. Please correct search parameters.',
      },
      errors: fieldErrors,
    };
  }

  const query = validationResult.data;

  // 2. Simulate network roundtrip latency (200ms - 350ms)
  await new Promise((resolve) => setTimeout(resolve, 220));

  // Date variance factor based on day of week (Fridays & Sundays typically higher demand in Nigeria)
  const travelDateObj = new Date(query.departDate);
  const dayOfWeek = travelDateObj.getDay(); // 0 = Sun, 5 = Fri
  let demandFactor = 1.0;
  if (dayOfWeek === 0 || dayOfWeek === 5) {
    demandFactor = 1.08; // +8% weekend corridor surge
  } else if (dayOfWeek === 2 || dayOfWeek === 3) {
    demandFactor = 0.96; // -4% midweek discount
  }

  // Cabin multiplier
  const cabinMultiplier = query.cabinClass === 'Business' ? 1.85 : 1.0;

  // Helper function to format items with dynamic date pricing and fees
  const formatItem = (f: FlightOffer): SearchFlightResultItem => {
    // Passenger count multiplier: Adults (100%), Children (75%), Infants (10%)
    const basePerAdult = Math.round(f.totalPrice * demandFactor * cabinMultiplier);
    const totalPassengerFare = Math.round(
      basePerAdult * (query.adults + query.children * 0.75 + query.infants * 0.1)
    );

    // Concierge fee: 5%, min ₦500, max ₦9,500
    const rawFee = Math.round(totalPassengerFare * 0.05);
    const conciergeFeeNgn = Math.min(9500, Math.max(500, rawFee));
    const conciergeTotalNgn = totalPassengerFare + conciergeFeeNgn;

    return {
      ...f,
      cabinClass: query.cabinClass,
      totalPrice: basePerAdult,
      calculatedPassengerFare: totalPassengerFare,
      conciergeFeeNgn,
      conciergeTotalNgn,
      departureDate: query.departDate,
    };
  };

  // 3. Exact matching filter
  const directMatches = databaseFlights
    .filter((f) => {
      const matchRoute =
        f.origin.toUpperCase() === query.origin &&
        f.destination.toUpperCase() === query.destination;
      const matchAirline =
        query.airline === 'all' ||
        f.airline.toLowerCase().includes(query.airline.toLowerCase()) ||
        f.airlineIata?.toLowerCase() === query.airline.toLowerCase();
      const matchStops = query.stops === 'all' || String(f.stops) === query.stops;

      return matchRoute && matchAirline && matchStops;
    })
    .map(formatItem);

  // 4. Alternative route suggestions if zero direct matches
  let alternatives: SearchFlightResultItem[] = [];
  if (directMatches.length === 0) {
    alternatives = databaseFlights
      .filter((f) => {
        // Find flights either departing from origin or arriving at destination
        return (
          f.origin.toUpperCase() === query.origin ||
          f.destination.toUpperCase() === query.destination
        );
      })
      .slice(0, 4)
      .map(formatItem);
  }

  // Helper to parse duration string (e.g. '1h 15m', '55m') to total minutes
  const parseDurationMins = (str: string): number => {
    const h = str.match(/(\d+)\s*h/i);
    const m = str.match(/(\d+)\s*m/i);
    return (h ? parseInt(h[1], 10) * 60 : 0) + (m ? parseInt(m[1], 10) : 0);
  };

  // Helper to parse departure time string (e.g. '08:30 AM', '03:15 PM') to minutes from midnight
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

  // 5. Sorting
  const sortedResults = [...directMatches].sort((a, b) => {
    if (query.sortBy === 'cheapest' || query.sortBy === 'price_asc') {
      return a.calculatedPassengerFare - b.calculatedPassengerFare;
    }
    if (query.sortBy === 'fastest' || query.sortBy === 'duration_asc') {
      return parseDurationMins(a.duration) - parseDurationMins(b.duration);
    }
    if (query.sortBy === 'earliest' || query.sortBy === 'departure_asc') {
      return parseTimeMins(a.departureTime) - parseTimeMins(b.departureTime);
    }
    return 0;
  });

  const totalPassengers = query.adults + query.children + query.infants;
  const cheapest =
    sortedResults.length > 0 ? sortedResults[0].calculatedPassengerFare : 0;
  const fastest =
    sortedResults.length > 0 ? sortedResults[0].duration : 'N/A';

  return {
    success: true,
    query,
    results: sortedResults,
    alternativeSuggestions: alternatives,
    meta: {
      originCode: query.origin,
      destCode: query.destination,
      departDate: query.departDate,
      passengersCount: totalPassengers,
      totalResults: sortedResults.length,
      cheapestPriceNgn: cheapest,
      fastestDuration: fastest,
      searchLatencyMs: Math.round(performance.now() - startTime),
      disclaimer:
        '3PLE A aggregates estimated fares across 12 scheduled Nigerian carriers. Fares are subject to airline seat confirmation upon ticketing handoff.',
    },
  };
}
