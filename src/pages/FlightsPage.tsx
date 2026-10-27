import React, { useState } from 'react';
import { AppState } from '../services/storage';
import { FlightBooking, FlightOffer, Transaction } from '../types';
import { PinModal } from '../components/PinModal';
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
  Info,
  Clock,
  Ticket,
  RotateCcw,
  Download,
} from 'lucide-react';
import { providerService } from '../services/providers';
import { DoubleEntryLedgerEngine } from '../services/ledger';

interface FlightsPageProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  onViewReceipt: (tx: Transaction) => void;
  language: 'en' | 'ha';
}

export const FlightsPage: React.FC<FlightsPageProps> = ({
  state,
  updateState,
  onViewReceipt,
  language,
}) => {
  const [tripType, setTripType] = useState<'one_way' | 'round_trip'>('one_way');
  const [origin, setOrigin] = useState<string>('KAN'); // Mallam Aminu Kano
  const [destination, setDestination] = useState<string>('ABV'); // Abuja
  const [departDate, setDepartDate] = useState<string>('2026-04-05');
  const [cabinClass, setCabinClass] = useState<'Economy' | 'Business'>('Economy');
  const [passengerCount, setPassengerCount] = useState<number>(1);

  // Booking Flow Steps: 1: Search, 2: Select Flight, 3: Passenger Details, 4: Fare Revalidation & Confirmation
  const [selectedFlight, setSelectedFlight] = useState<FlightOffer | null>(null);
  const [passengerName, setPassengerName] = useState<string>(state.currentUser.name);
  const [passengerNin, setPassengerNin] = useState<string>('72910482910');
  const [passengerPhone, setPassengerPhone] = useState<string>(state.currentUser.phone);
  const [fareRevalidated, setFareRevalidated] = useState<boolean>(false);
  const [revalidating, setRevalidating] = useState<boolean>(false);

  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [bookingLoading, setBookingLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successBooking, setSuccessBooking] = useState<FlightBooking | null>(null);

  // Available airports in Nigeria
  const airports = [
    { code: 'KAN', city: 'Kano', name: 'Mallam Aminu Kano Intl (KAN)' },
    { code: 'ABV', city: 'Abuja', name: 'Nnamdi Azikiwe Intl (ABV)' },
    { code: 'LOS', city: 'Lagos', name: 'Murtala Muhammed Intl (LOS)' },
    { code: 'PHC', city: 'Port Harcourt', name: 'Port Harcourt Intl (PHC)' },
  ];

  const searchResults = state.flights.filter(
    (f) => f.origin === origin && f.destination === destination
  );

  const totalAmount = (selectedFlight?.totalPrice || 0) * passengerCount;

  const handleSelectFlight = (flight: FlightOffer) => {
    setSelectedFlight(flight);
    setFareRevalidated(false);
    setError('');
  };

  const handleRevalidateFare = async () => {
    if (!passengerName || !passengerPhone || !passengerNin) {
      setError('Please fill in complete passenger identification (Name, Phone, NIN/Passport).');
      return;
    }
    setError('');
    setRevalidating(true);
    // Simulating GDS fare and inventory revalidation check via MySubWallet API
    await new Promise((r) => setTimeout(r, 600));
    setRevalidating(false);
    setFareRevalidated(true);
  };

  const handleInitiateBooking = () => {
    if (!fareRevalidated) {
      setError('Please click Revalidate Fare before payment.');
      return;
    }
    if (state.currentUser.walletBalance < totalAmount) {
      setError('Insufficient wallet balance to cover flight ticket.');
      return;
    }
    setShowPinModal(true);
  };

  const handleExecuteBooking = async () => {
    if (!selectedFlight) return;
    setShowPinModal(false);
    setBookingLoading(true);
    setError('');

    try {
      const ref = `3PA-FLT-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const activeProvider = providerService.getActiveProviderForService('flights');

      const response = await providerService.executeFlightBooking(
        selectedFlight.id,
        { passengerName, passengerNin, passengerPhone },
        totalAmount,
        ref
      );

      const pnr = response.data?.pnr || '3PKANO';
      const supplierRef = response.data?.supplierRef || 'MSW-FLT-8821';
      const ticketNumber = response.data?.ticketNumber || '074-9921048821';

      const bookingRecord: FlightBooking = {
        id: `bk_${Date.now()}`,
        pnr,
        supplierRef,
        userId: state.currentUser.id,
        customerName: passengerName,
        passengerCount,
        passengers: [
          {
            title: 'MR',
            fullName: passengerName,
            dob: '1990-05-14',
            gender: 'Male',
            ninOrPassport: passengerNin,
            ticketNumber,
          },
        ],
        flight: selectedFlight,
        totalAmount,
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
        amount: totalAmount,
        fee: 0,
        discount: 0,
        totalDebited: totalAmount,
        status: 'successful',
        provider: activeProvider?.displayName || 'MySubWallet Travel Hub',
        providerReference: supplierRef,
        productName: `${selectedFlight.airline} (${selectedFlight.origin} → ${selectedFlight.destination})`,
        recipient: `PNR: ${pnr}`,
        metadata: {
          pnr,
          supplierRef,
          ticketNumber,
          flightNumber: selectedFlight.flightNumber,
          origin: selectedFlight.originCity,
          destination: selectedFlight.destinationCity,
          departureTime: selectedFlight.departureTime,
          baggage: selectedFlight.baggageAllowance,
          providerResponse: response.rawResponse,
        },
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
      };

      const ledgerEntries = DoubleEntryLedgerEngine.recordFlightBooking(newTx, supplierRef);

      const updatedUser = {
        ...state.currentUser,
        walletBalance: state.currentUser.walletBalance - totalAmount,
      };

      updateState({
        currentUser: updatedUser,
        transactions: [newTx, ...state.transactions],
        ledger: [...state.ledger, ...ledgerEntries],
        flightBookings: [bookingRecord, ...state.flightBookings],
      });

      setBookingLoading(false);
      setSuccessBooking(bookingRecord);
      onViewReceipt(newTx);
    } catch (err: any) {
      setBookingLoading(false);
      setError(err?.message || 'Flight booking failed.');
    }
  };

  const handleRefundRequest = (bookingId: string) => {
    alert(
      'Cancellation & Refund Request Submitted to Airline Supplier (MySubWallet). Pursuant to airline fare rules, cancellation penalty will be reconciled in 24 hours.'
    );
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Flight Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden shadow-sm border border-slate-200">
        <img
          src="/src/assets/images/nigeria_domestic_flight_1793031987030.jpg"
          alt="Domestic Flights in Nigeria"
          className="w-full h-48 sm:h-56 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent flex flex-col justify-end p-6 text-white">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full">
              Travel Hub
            </span>
            <span className="text-xs text-slate-300">MySubWallet Supplier GDS Integration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
            {language === 'ha' ? 'Neman Tikitin Jirgin Sama' : 'Nigerian Domestic & Regional Flights'}
          </h1>
          <p className="text-xs text-slate-300 mt-0.5 max-w-xl">
            Book flights between Mallam Aminu Kano International Airport (KAN), Abuja (ABV), and Lagos (LOS) with instant PNR and verified e-ticket issuance.
          </p>
        </div>
      </div>

      {/* Search Engine Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 shadow-xs space-y-4">
        {/* Trip type & Cabin */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setTripType('one_way')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
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
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                tripType === 'round_trip'
                  ? 'bg-slate-900 dark:bg-amber-500 dark:text-slate-950 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Round Trip
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <select
                value={passengerCount}
                onChange={(e) => setPassengerCount(parseInt(e.target.value))}
                className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2 py-1 text-xs font-medium focus:outline-none"
              >
                <option value={1} className="dark:bg-slate-900">1 Passenger</option>
                <option value={2} className="dark:bg-slate-900">2 Passengers</option>
                <option value={3} className="dark:bg-slate-900">3 Passengers</option>
              </select>
            </div>

            <select
              value={cabinClass}
              onChange={(e) => setCabinClass(e.target.value as any)}
              className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white rounded-lg px-2 py-1 text-xs font-medium focus:outline-none"
            >
              <option value="Economy" className="dark:bg-slate-900">Economy</option>
              <option value="Business" className="dark:bg-slate-900">Business</option>
            </select>
          </div>
        </div>

        {/* Airport Selectors & Date */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              {language === 'ha' ? 'Tashi Daga (Origin)' : 'Departure Airport'}
            </label>
            <select
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              {airports.map((a) => (
                <option key={a.code} value={a.code} className="dark:bg-slate-900">
                  {a.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              {language === 'ha' ? 'Sauka A (Destination)' : 'Arrival Airport'}
            </label>
            <select
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-xs text-slate-900 dark:text-white focus:outline-none"
            >
              {airports
                .filter((a) => a.code !== origin)
                .map((a) => (
                  <option key={a.code} value={a.code} className="dark:bg-slate-900">
                    {a.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
              {language === 'ha' ? 'Ranar Tashi' : 'Departure Date'}
            </label>
            <input
              type="date"
              value={departDate}
              onChange={(e) => setDepartDate(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-xs text-slate-900 dark:text-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Available Flight Itineraries */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Available Itineraries ({searchResults.length > 0 ? searchResults.length : state.flights.length})
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">Live Supplier Rates</span>
        </div>

        <div className="grid grid-cols-1 gap-3">
          {(searchResults.length > 0 ? searchResults : state.flights).map((flight) => {
            const isSelected = selectedFlight?.id === flight.id;
            return (
              <div
                key={flight.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border p-5 transition-all ${
                  isSelected
                    ? 'border-slate-900 dark:border-amber-400 ring-2 ring-slate-900 dark:ring-amber-400 shadow-sm'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  {/* Airline & Timing */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{flight.airline}</span>
                      <span className="text-xs font-mono text-slate-500 dark:text-slate-400">{flight.flightNumber}</span>
                      <span className="text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2 py-0.5 rounded font-medium">
                        {flight.cabinClass}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 pt-2 text-xs">
                      <div>
                        <div className="text-base font-extrabold text-slate-900 dark:text-white">{flight.departureTime}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{flight.originCity}</div>
                      </div>

                      <div className="flex flex-col items-center px-4">
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{flight.duration}</span>
                        <div className="w-16 h-0.5 bg-slate-200 dark:bg-slate-700 relative my-1">
                          <Plane className="w-3 h-3 text-slate-400 dark:text-slate-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                        </div>
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Non-stop</span>
                      </div>

                      <div>
                        <div className="text-base font-extrabold text-slate-900 dark:text-white">{flight.arrivalTime}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">{flight.destinationCity}</div>
                      </div>
                    </div>
                  </div>

                  {/* Price & Action */}
                  <div className="flex md:flex-col items-center md:items-end justify-between md:justify-center border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left md:text-right">
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 uppercase">Total Fare</div>
                      <div className="text-xl font-extrabold text-slate-900 dark:text-amber-400 font-mono tabular-nums">
                        ₦{flight.totalPrice.toLocaleString()}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">{flight.baggageAllowance}</div>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleSelectFlight(flight)}
                      className={`mt-2 px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white dark:bg-amber-500 dark:text-slate-950'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-semibold'
                      }`}
                    >
                      {isSelected ? 'Flight Selected' : 'Select Flight'}
                    </button>
                  </div>
                </div>

                {/* Baggage & Fare Rules Note */}
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Luggage className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                    <span>{flight.baggageAllowance}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-slate-500">Rules: </span>
                    <span className="text-slate-600 dark:text-slate-300">{flight.fareRules}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Flight Checkout & Passenger Details Drawer */}
      {selectedFlight && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Passenger Details & Fare Revalidation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {selectedFlight.airline} {selectedFlight.flightNumber} ({selectedFlight.origin} → {selectedFlight.destination})
              </p>
            </div>
            <span className="text-sm font-bold font-mono text-slate-900 dark:text-amber-400 tabular-nums">
              ₦{totalAmount.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Passenger Full Name (as on ID)
              </label>
              <input
                type="text"
                value={passengerName}
                onChange={(e) => {
                  setPassengerName(e.target.value);
                  setFareRevalidated(false);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                value={passengerPhone}
                onChange={(e) => {
                  setPassengerPhone(e.target.value);
                  setFareRevalidated(false);
                }}
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white focus:outline-none"
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
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-mono text-slate-900 dark:text-white focus:outline-none placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Revalidation Step */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-xs">
              <span className="font-semibold text-slate-800 dark:text-slate-200 block">Supplier Pre-Booking Revalidation</span>
              <span className="text-slate-500 dark:text-slate-400">
                Verifies live seat inventory and locks airline base fare before charging your wallet.
              </span>
            </div>

            {fareRevalidated ? (
              <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 rounded-lg text-xs font-bold border border-emerald-200 dark:border-emerald-800">
                <Check className="w-4 h-4" />
                <span>Fare Locked (HTTP 200)</span>
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

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 rounded-xl text-xs border border-red-100 dark:border-red-900/60">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleInitiateBooking}
            disabled={bookingLoading || !fareRevalidated}
            className="w-full py-3.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white font-semibold text-sm rounded-xl transition-all shadow-sm active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2"
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
                  Confirm & Issue E-Ticket (₦{totalAmount.toLocaleString()})
                </span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Booking History & Cancellation / Refund Workflow */}
      {state.flightBookings.length > 0 && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-xs space-y-4">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Your Flight Bookings & E-Tickets ({state.flightBookings.length})
          </h3>

          <div className="space-y-3">
            {state.flightBookings.map((b) => (
              <div
                key={b.id}
                className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">PNR: {b.pnr}</span>
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
                    onClick={() => handleRefundRequest(b.id)}
                    className="px-3 py-1.5 text-xs font-semibold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-lg transition-colors flex items-center gap-1 border border-rose-200 dark:border-rose-900/60"
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

      <PinModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onSuccess={handleExecuteBooking}
        title="Authorize Flight Booking"
        amount={totalAmount}
        recipient={`Flight PNR reservation (${selectedFlight?.airline})`}
      />
    </div>
  );
};
