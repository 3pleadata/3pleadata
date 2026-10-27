import React, { useState } from 'react';
import { AppState } from '../services/storage';
import { PropertyInquiry, PropertyListing } from '../types';
import {
  Building,
  MapPin,
  Bed,
  Bath,
  Maximize2,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  Check,
  Search,
  Filter,
  X,
  Send,
} from 'lucide-react';

interface EstatePageProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  language: 'en' | 'ha';
}

export const EstatePage: React.FC<EstatePageProps> = ({
  state,
  updateState,
  language,
}) => {
  const [category, setCategory] = useState<string>('all');
  const [transactionType, setTransactionType] = useState<string>('all');
  const [searchLocation, setSearchLocation] = useState<string>('');
  const [selectedPropertyForViewing, setSelectedPropertyForViewing] = useState<PropertyListing | null>(null);

  // Viewing Modal form state
  const [clientName, setClientName] = useState<string>(state.currentUser.name);
  const [clientPhone, setClientPhone] = useState<string>(state.currentUser.phone);
  const [clientEmail, setClientEmail] = useState<string>(state.currentUser.email);
  const [preferredDate, setPreferredDate] = useState<string>('2026-04-10');
  const [message, setMessage] = useState<string>('I would like to schedule a physical inspection of this property with an authorized 3PLE A representative.');
  const [inquirySuccess, setInquirySuccess] = useState<boolean>(false);

  const filteredProperties = state.properties.filter((p) => {
    if (category !== 'all' && p.category !== category) return false;
    if (transactionType !== 'all' && p.transactionType !== transactionType) return false;
    if (searchLocation) {
      const q = searchLocation.toLowerCase();
      return (
        p.location.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleScheduleViewing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPropertyForViewing) return;

    const newInquiry: PropertyInquiry = {
      id: `inq_${Date.now()}`,
      propertyId: selectedPropertyForViewing.id,
      propertyTitle: selectedPropertyForViewing.title,
      clientName,
      clientPhone,
      clientEmail,
      message,
      preferredDate,
      status: 'new',
      createdAt: new Date().toISOString(),
    };

    updateState({
      inquiries: [newInquiry, ...state.inquiries],
    });

    setInquirySuccess(true);
    setTimeout(() => {
      setInquirySuccess(false);
      setSelectedPropertyForViewing(null);
    }, 2000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            {language === 'ha' ? 'Kasuwancin Gidaje da Filaye' : '3PLE A Real Estate & Property Hub'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Verified luxury residential duplexes, prime commercial complexes, and serviced apartments in Kano, Abuja, and Lagos.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1 rounded-full flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Title-Verified Deeds Registry</span>
          </span>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Categories */}
          <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {[
              { id: 'all', label: 'All Types' },
              { id: 'residential', label: 'Houses' },
              { id: 'apartment', label: 'Apartments' },
              { id: 'commercial', label: 'Commercial' },
            ].map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  category === cat.id
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Transaction Type */}
          <select
            value={transactionType}
            onChange={(e) => setTransactionType(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
          >
            <option value="all" className="dark:bg-slate-900">Sale & Lease</option>
            <option value="sale" className="dark:bg-slate-900">For Sale</option>
            <option value="rent" className="dark:bg-slate-900">For Rent</option>
            <option value="lease" className="dark:bg-slate-900">Commercial Lease</option>
          </select>
        </div>

        {/* Location Search */}
        <div className="relative w-full md:w-72">
          <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchLocation}
            onChange={(e) => setSearchLocation(e.target.value)}
            placeholder="Search Kano, Tarauni, Abuja..."
            className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-slate-400 placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredProperties.map((property) => (
          <div
            key={property.id}
            className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group"
          >
            <div>
              {/* Image Container with Badge */}
              <div className="relative h-56 overflow-hidden bg-slate-100 dark:bg-slate-800">
                <img
                  src={property.imageUrl}
                  alt={property.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      '/src/assets/images/kano_tarauni_duplex_1793031985230.jpg';
                  }}
                />
                <div className="absolute top-3 left-3 flex gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900/90 dark:bg-slate-950/90 text-white backdrop-blur-xs px-2.5 py-1 rounded-md">
                    {property.transactionType}
                  </span>
                  {property.verified && (
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-1 rounded-md flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3" />
                      <span>Verified</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Details */}
              <div className="p-5">
                <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs mb-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                  <span className="truncate">{property.location}, {property.city}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors">
                  {property.title}
                </h3>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {property.description}
                </p>

                {/* Features (Beds, Baths, Sqm) */}
                <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                  {property.bedrooms && (
                    <div className="flex items-center gap-1.5">
                      <Bed className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span>{property.bedrooms} Beds</span>
                    </div>
                  )}
                  {property.bathrooms && (
                    <div className="flex items-center gap-1.5">
                      <Bath className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                      <span>{property.bathrooms} Baths</span>
                    </div>
                  )}
                  {property.sizeSqm && (
                    <div className="flex items-center gap-1.5">
                      <Maximize2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      <span>{property.sizeSqm} m²</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Price & Action */}
            <div className="p-5 pt-0">
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Price</span>
                  <span className="text-lg font-bold text-slate-900 dark:text-amber-400 font-mono tabular-nums">
                    ₦{property.price.toLocaleString()}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPropertyForViewing(property)}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white text-xs font-semibold rounded-xl transition-all shadow-xs"
                >
                  Schedule Viewing
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Viewing / Inspection Schedule Modal */}
      {selectedPropertyForViewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Book Property Inspection</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-sm">
                  {selectedPropertyForViewing.title}
                </p>
              </div>
              <button
                onClick={() => setSelectedPropertyForViewing(null)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {inquirySuccess ? (
              <div className="p-8 text-center">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto mb-3 border border-emerald-200 dark:border-emerald-800">
                  <Check className="w-5 h-5" />
                </div>
                <h4 className="text-base font-bold text-slate-900 dark:text-white">Viewing Request Registered!</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Our estate agent ({selectedPropertyForViewing.agentName}) will contact you via phone ({clientPhone}) to confirm the inspection on {preferredDate}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleScheduleViewing} className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Your Full Name
                    </label>
                    <input
                      type="text"
                      required
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      required
                      value={clientPhone}
                      onChange={(e) => setClientPhone(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Preferred Date
                    </label>
                    <input
                      type="date"
                      required
                      value={preferredDate}
                      onChange={(e) => setPreferredDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      required
                      value={clientEmail}
                      onChange={(e) => setClientEmail(e.target.value)}
                      className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Message / Special Requests
                  </label>
                  <textarea
                    rows={3}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 space-y-1">
                  <div className="font-semibold text-slate-800 dark:text-slate-200">Assigned 3PLE A Representative:</div>
                  <div>Agent: {selectedPropertyForViewing.agentName}</div>
                  <div>Phone: {selectedPropertyForViewing.agentPhone}</div>
                  <div>Office: Karkasara Road, Tarauni LGA, Kano State</div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 dark:bg-amber-500 dark:hover:bg-amber-400 dark:text-slate-950 text-white font-semibold text-xs rounded-xl transition-all shadow-sm flex items-center justify-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Submit Viewing & Inspection Request</span>
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
