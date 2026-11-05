import React, { useState } from 'react';
import { AppState } from '../services/storage';
import { PropertyInquiry, PropertyListing, UserRole } from '../types';
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
  Plus,
  Trash2,
  Edit3,
  AlertTriangle,
  UserCheck,
  Sparkles,
  CheckCircle2,
  Image as ImageIcon,
  ArrowRight,
  SlidersHorizontal,
} from 'lucide-react';

interface EstatePageProps {
  state: AppState;
  updateState: (newState: Partial<AppState>) => void;
  language: 'en' | 'ha';
}

const PRESET_IMAGES = [
  {
    name: 'Kano Tarauni Duplex',
    url: '/src/assets/images/kano_tarauni_duplex_1793031985230.jpg',
  },
  {
    name: 'Abuja Luxury Apartment',
    url: '/src/assets/images/abuja_luxury_apartments_1793031986068.jpg',
  },
  {
    name: 'Kano Commercial Plaza',
    url: '/src/assets/images/kano_commercial_plaza_1793031986818.jpg',
  },
];

export const EstatePage: React.FC<EstatePageProps> = ({
  state,
  updateState,
  language,
}) => {
  // Permission checks
  const isSuperAdmin =
    state.currentUser.role === 'super_admin' || state.currentUser.role === 'administrator';
  const isAgent = state.currentUser.role === 'agent';
  const canManageProperties = isSuperAdmin || isAgent;

  // Search & Filter state
  const [category, setCategory] = useState<string>('all');
  const [transactionType, setTransactionType] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchLocation, setSearchLocation] = useState<string>('');

  // Notifications
  const [actionNotice, setActionNotice] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setActionNotice({ type, message });
    setTimeout(() => setActionNotice(null), 4000);
  };

  // Viewing Modal form state (Client inspection booking)
  const [selectedPropertyForViewing, setSelectedPropertyForViewing] =
    useState<PropertyListing | null>(null);
  const [clientName, setClientName] = useState<string>(state.currentUser.name);
  const [clientPhone, setClientPhone] = useState<string>(state.currentUser.phone);
  const [clientEmail, setClientEmail] = useState<string>(state.currentUser.email);
  const [preferredDate, setPreferredDate] = useState<string>('2026-04-10');
  const [message, setMessage] = useState<string>(
    'I would like to schedule a physical inspection of this property with an authorized 3PLE A representative.'
  );
  const [inquirySuccess, setInquirySuccess] = useState<boolean>(false);

  // Add Property Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [propTitle, setPropTitle] = useState('');
  const [propDesc, setPropDesc] = useState('');
  const [propCategory, setPropCategory] = useState<
    'residential' | 'commercial' | 'land' | 'apartment'
  >('residential');
  const [propTransactionType, setPropTransactionType] = useState<'sale' | 'rent' | 'lease'>('sale');
  const [propLocation, setPropLocation] = useState('');
  const [propCity, setPropCity] = useState('Kano City');
  const [propState, setPropState] = useState('Kano State');
  const [propPrice, setPropPrice] = useState<number | ''>(85000000);
  const [propBedrooms, setPropBedrooms] = useState<number | ''>(4);
  const [propBathrooms, setPropBathrooms] = useState<number | ''>(4);
  const [propToilets, setPropToilets] = useState<number | ''>(5);
  const [propSizeSqm, setPropSizeSqm] = useState<number | ''>(550);
  const [propImageUrl, setPropImageUrl] = useState(PRESET_IMAGES[0].url);
  const [propAgentName, setPropAgentName] = useState(
    state.currentUser.name || 'Engr. Kabiru Tarauni (3PLE A)'
  );
  const [propAgentPhone, setPropAgentPhone] = useState(
    state.currentUser.phone || '+234 803 000 3PLE'
  );
  const [propAgentEmail, setPropAgentEmail] = useState(
    state.currentUser.email || 'properties@3plea.ng'
  );
  const [propVerified, setPropVerified] = useState(true);
  const [propFeatured, setPropFeatured] = useState(true);
  const [propStatus, setPropStatus] = useState<'available' | 'under_offer' | 'sold' | 'leased'>(
    'available'
  );

  // Delete Property Confirmation State
  const [propertyToDelete, setPropertyToDelete] = useState<PropertyListing | null>(null);

  // Filter properties
  const propertiesList = state.properties || [];
  const filteredProperties = propertiesList.filter((p) => {
    if (category !== 'all' && p.category !== category) return false;
    if (transactionType !== 'all' && p.transactionType !== transactionType) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (searchLocation) {
      const q = searchLocation.toLowerCase();
      return (
        p.location.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        p.state.toLowerCase().includes(q) ||
        p.title.toLowerCase().includes(q) ||
        p.agentName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Handle Client Viewing Submission
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
      inquiries: [newInquiry, ...(state.inquiries || [])],
    });

    setInquirySuccess(true);
    setTimeout(() => {
      setInquirySuccess(false);
      setSelectedPropertyForViewing(null);
    }, 2000);
  };

  // Handle Adding a New Property (Super Admin or Agent)
  const handleCreateProperty = (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTitle.trim() || !propLocation.trim() || !propPrice) {
      showNotification('Please fill in property title, location, and price.', 'error');
      return;
    }

    const newProperty: PropertyListing = {
      id: `prop_${Date.now()}`,
      title: propTitle.trim(),
      description: propDesc.trim() || 'Verified luxury property managed by 3PLE A Estates.',
      category: propCategory,
      transactionType: propTransactionType,
      location: propLocation.trim(),
      city: propCity.trim(),
      state: propState.trim(),
      price: Number(propPrice),
      currency: 'NGN',
      bedrooms: propBedrooms ? Number(propBedrooms) : undefined,
      bathrooms: propBathrooms ? Number(propBathrooms) : undefined,
      toilets: propToilets ? Number(propToilets) : undefined,
      sizeSqm: propSizeSqm ? Number(propSizeSqm) : undefined,
      verified: propVerified,
      featured: propFeatured,
      status: propStatus,
      imageUrl: propImageUrl.trim() || PRESET_IMAGES[0].url,
      agentName: propAgentName.trim() || state.currentUser.name,
      agentPhone: propAgentPhone.trim() || state.currentUser.phone,
      agentEmail: propAgentEmail.trim() || state.currentUser.email,
      createdAt: new Date().toISOString(),
    };

    const updated = [newProperty, ...propertiesList];
    updateState({ properties: updated });

    setIsAddModalOpen(false);
    showNotification(
      language === 'ha'
        ? `An yi nasarar ƙara sabon gida: ${newProperty.title}`
        : `New property listing "${newProperty.title}" added successfully!`,
      'success'
    );

    // Reset default form
    setPropTitle('');
    setPropDesc('');
    setPropPrice(85000000);
    setPropLocation('');
  };

  // Handle Removing / Deleting a Property (Super Admin or Agent)
  const handleConfirmDeleteProperty = () => {
    if (!propertyToDelete) return;

    const targetId = propertyToDelete.id;
    const targetTitle = propertyToDelete.title;
    const updated = propertiesList.filter((p) => p.id !== targetId);

    updateState({ properties: updated });
    setPropertyToDelete(null);

    showNotification(
      language === 'ha'
        ? `An cire gidan "${targetTitle}" daga rumbun adana bayanai.`
        : `Property "${targetTitle}" has been removed.`,
      'success'
    );
  };

  // Handle Quick Status Change
  const handleQuickStatusChange = (
    propertyId: string,
    newStatus: PropertyListing['status']
  ) => {
    const updated = propertiesList.map((p) =>
      p.id === propertyId ? { ...p, status: newStatus } : p
    );
    updateState({ properties: updated });
    showNotification(`Property status updated to "${newStatus.replace('_', ' ').toUpperCase()}".`);
  };

  // Handle Role Switch for Quick Preview/Testing
  const handleSwitchRole = (newRole: UserRole) => {
    updateState({
      currentUser: { ...state.currentUser, role: newRole },
    });
    showNotification(`Active role switched to ${newRole.replace('_', ' ').toUpperCase()}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Toast Notification */}
      {actionNotice && (
        <div
          className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all shadow-md ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-200'
              : 'bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>{actionNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setActionNotice(null)}
            className="opacity-70 hover:opacity-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {language === 'ha'
                ? 'Kasuwancin Gidaje da Filaye'
                : '3PLE A Real Estate & Property Hub'}
            </h1>
            <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 px-2 py-0.5 rounded-md">
              Kano • Abuja • Lagos
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            {language === 'ha'
              ? 'Cikakkun gidaje, filaye, da shagunan kasuwanci masu ingantacciyar shedar C of O a Kano da Abuja.'
              : 'Verified luxury residential duplexes, prime commercial plazas, and serviced apartments with title-verified deeds.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {canManageProperties ? (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{language === 'ha' ? 'Ƙara Sabon Gida' : 'Add New Property'}</span>
            </button>
          ) : (
            <span className="text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Title-Verified Deeds Registry</span>
            </span>
          )}
        </div>
      </div>

      {/* Role & Management Authorization Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
              canManageProperties
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
            }`}
          >
            {canManageProperties ? (
              <Building className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            ) : (
              <UserCheck className="w-4 h-4" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {canManageProperties
                  ? language === 'ha'
                    ? 'Izinin Gudanar da Gidaje Yana Aiki'
                    : 'Estate Management Privilege Active'
                  : language === 'ha'
                  ? 'Kuna Dubawa a Matsayin Abokin Ciniki'
                  : 'Browsing as Customer'}
              </span>
              <span
                className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded font-bold ${
                  state.currentUser.role === 'super_admin'
                    ? 'bg-amber-500 text-slate-950'
                    : state.currentUser.role === 'agent'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {state.currentUser.role.replace('_', ' ')}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {canManageProperties
                ? `Logged in as ${state.currentUser.name}. You have authorization to add, remove, and update real estate properties.`
                : 'Super Admins and Estate Agents can add, modify, or remove properties. Use the quick switcher below to test.'}
            </p>
          </div>
        </div>

        {/* Quick Role Switcher for seamless testing */}
        <div className="flex items-center gap-1.5 self-stretch md:self-auto justify-end pt-2 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline">
            Role Switcher:
          </span>
          <button
            type="button"
            onClick={() => handleSwitchRole('super_admin')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              state.currentUser.role === 'super_admin'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Switch active role to Super Admin"
          >
            Super Admin
          </button>
          <button
            type="button"
            onClick={() => handleSwitchRole('agent')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              state.currentUser.role === 'agent'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Switch active role to Estate Agent"
          >
            Agent
          </button>
          <button
            type="button"
            onClick={() => handleSwitchRole('customer')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-all ${
              state.currentUser.role === 'customer'
                ? 'bg-slate-900 text-white dark:bg-slate-700 shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
            title="Switch active role to Customer"
          >
            Customer
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
          {/* Categories */}
          <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
            {[
              { id: 'all', label: language === 'ha' ? 'Duka Nau\'i' : 'All Types' },
              { id: 'residential', label: language === 'ha' ? 'Gidaje' : 'Houses' },
              { id: 'apartment', label: language === 'ha' ? 'Filaye' : 'Apartments' },
              { id: 'commercial', label: language === 'ha' ? 'Kasuwanci' : 'Commercial' },
              { id: 'land', label: 'Land / Plots' },
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
            <option value="all" className="dark:bg-slate-900">
              All Agreements (Sale & Lease)
            </option>
            <option value="sale" className="dark:bg-slate-900">
              For Sale
            </option>
            <option value="rent" className="dark:bg-slate-900">
              For Rent
            </option>
            <option value="lease" className="dark:bg-slate-900">
              Commercial Lease
            </option>
          </select>

          {/* Availability Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 font-medium focus:outline-none"
          >
            <option value="all" className="dark:bg-slate-900">
              All Statuses ({propertiesList.length})
            </option>
            <option value="available" className="dark:bg-slate-900">
              Available Only
            </option>
            <option value="under_offer" className="dark:bg-slate-900">
              Under Offer
            </option>
            <option value="sold" className="dark:bg-slate-900">
              Sold Out
            </option>
            <option value="leased" className="dark:bg-slate-900">
              Leased
            </option>
          </select>
        </div>

        {/* Location / Search */}
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

      {/* Properties Count & Status Bar */}
      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
        <span>
          Showing{' '}
          <strong className="text-slate-900 dark:text-white font-semibold">
            {filteredProperties.length}
          </strong>{' '}
          properties listed
        </span>
        {canManageProperties && (
          <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Click "+ Add New Property" or use the red trash icon on cards to remove listings.</span>
          </span>
        )}
      </div>

      {/* Properties Grid */}
      {filteredProperties.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <Building className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No properties match your current filters
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            Try adjusting your category, agreement type, or search term.
          </p>
          {canManageProperties && (
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl inline-flex items-center gap-1.5 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add First Property in this Category</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProperties.map((property) => (
            <div
              key={property.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs hover:shadow-md transition-shadow flex flex-col justify-between group relative"
            >
              <div>
                {/* Image Container with Badges */}
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

                  {/* Top Badges */}
                  <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-900/90 dark:bg-slate-950/90 text-white backdrop-blur-xs px-2.5 py-1 rounded-md shadow-xs">
                      {property.transactionType}
                    </span>
                    {property.verified && (
                      <span className="text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white px-2 py-1 rounded-md flex items-center gap-1 shadow-xs">
                        <ShieldCheck className="w-3 h-3" />
                        <span>Verified</span>
                      </span>
                    )}
                    {property.status !== 'available' && (
                      <span
                        className={`text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-md shadow-xs ${
                          property.status === 'sold'
                            ? 'bg-rose-600 text-white'
                            : property.status === 'under_offer'
                            ? 'bg-amber-500 text-slate-950'
                            : 'bg-purple-600 text-white'
                        }`}
                      >
                        {property.status.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  {/* Super Admin / Agent Direct Card Actions (Top Right Delete) */}
                  {canManageProperties && (
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPropertyToDelete(property);
                        }}
                        className="p-1.5 bg-rose-600/90 hover:bg-rose-600 text-white rounded-lg shadow-md backdrop-blur-xs transition-colors"
                        title={
                          language === 'ha'
                            ? 'Cire wannan gidan daga tsarin'
                            : 'Remove / Delete this property'
                        }
                        aria-label="Remove property"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Details */}
                <div className="p-5">
                  <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-xs mb-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                    <span className="truncate">
                      {property.location}, {property.city}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white line-clamp-1 group-hover:text-amber-500 transition-colors">
                    {property.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                    {property.description}
                  </p>

                  {/* Features (Beds, Baths, Sqm) */}
                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300">
                    {property.bedrooms !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Bed className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span>{property.bedrooms} Beds</span>
                      </div>
                    )}
                    {property.bathrooms !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Bath className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span>{property.bathrooms} Baths</span>
                      </div>
                    )}
                    {property.sizeSqm !== undefined && (
                      <div className="flex items-center gap-1.5">
                        <Maximize2 className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                        <span>{property.sizeSqm} m²</span>
                      </div>
                    )}
                  </div>

                  {/* Agent Contact Info Snippet */}
                  <div className="mt-3 pt-2 text-[11px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
                    <span className="truncate">Agent: {property.agentName}</span>
                    <span className="font-mono">{property.agentPhone}</span>
                  </div>
                </div>
              </div>

              {/* Price & Action Footer */}
              <div className="p-5 pt-0">
                <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Price
                    </span>
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

                {/* Manager Quick-Toolbar on Bottom of Card */}
                {canManageProperties && (
                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Status:</span>
                      <select
                        value={property.status}
                        onChange={(e) =>
                          handleQuickStatusChange(
                            property.id,
                            e.target.value as PropertyListing['status']
                          )
                        }
                        className="text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2 py-1 text-slate-700 dark:text-slate-200 focus:outline-none"
                      >
                        <option value="available">Available</option>
                        <option value="under_offer">Under Offer</option>
                        <option value="sold">Sold</option>
                        <option value="leased">Leased</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => setPropertyToDelete(property)}
                      className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 1: ADD NEW PROPERTY (SUPER ADMIN / AGENT)     */}
      {/* ==================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Building className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {language === 'ha' ? 'Ƙara Sabon Gida / Fila' : 'Add New Property Listing'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Publish a verified listing to the 3PLE A real estate catalog.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body / Form */}
            <form onSubmit={handleCreateProperty} className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Property Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Contemporary 5-Bedroom Detached Duplex with BQ"
                  value={propTitle}
                  onChange={(e) => setPropTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Category & Agreement Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Property Category *
                  </label>
                  <select
                    value={propCategory}
                    onChange={(e) => setPropCategory(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="residential">Residential House / Duplex</option>
                    <option value="apartment">Serviced Apartment</option>
                    <option value="commercial">Commercial Complex / Plaza</option>
                    <option value="land">Land / Plot with Title</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Agreement Type *
                  </label>
                  <select
                    value={propTransactionType}
                    onChange={(e) => setPropTransactionType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  >
                    <option value="sale">Outright Sale</option>
                    <option value="rent">Annual Rent</option>
                    <option value="lease">Long-term Commercial Lease</option>
                  </select>
                </div>
              </div>

              {/* Price & Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Price (NGN ₦) *
                  </label>
                  <input
                    type="number"
                    required
                    min={100000}
                    step={100000}
                    value={propPrice}
                    onChange={(e) => setPropPrice(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                  {propPrice ? (
                    <span className="text-[10px] text-slate-400 mt-0.5 block">
                      Preview: ₦{Number(propPrice).toLocaleString()}
                    </span>
                  ) : null}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    District / Street Location *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Karkasara Road, Tarauni District"
                    value={propLocation}
                    onChange={(e) => setPropLocation(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* City & State */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kano City"
                    value={propCity}
                    onChange={(e) => setPropCity(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kano State"
                    value={propState}
                    onChange={(e) => setPropState(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Specifications: Bedrooms, Bathrooms, Size (sqm) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Bedrooms
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={propBedrooms}
                    onChange={(e) => setPropBedrooms(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Bathrooms
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={propBathrooms}
                    onChange={(e) => setPropBathrooms(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Toilets
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    value={propToilets}
                    onChange={(e) => setPropToilets(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Size (m²)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={propSizeSqm}
                    onChange={(e) => setPropSizeSqm(e.target.value ? Number(e.target.value) : '')}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Full Description & Amenities *
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe building finishing, borehole, solar inverters, security guardhouse, parking, and legal title documents..."
                  value={propDesc}
                  onChange={(e) => setPropDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              {/* Image Selection / Presets */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Property Photo / Cover Image
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {PRESET_IMAGES.map((preset) => (
                    <button
                      key={preset.url}
                      type="button"
                      onClick={() => setPropImageUrl(preset.url)}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all flex items-center gap-1.5 ${
                        propImageUrl === preset.url
                          ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-800 dark:text-emerald-300 font-bold'
                          : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="Or enter custom image URL"
                  value={propImageUrl}
                  onChange={(e) => setPropImageUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-mono focus:outline-none"
                />
              </div>

              {/* Agent Contact Details */}
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
                <span className="text-xs font-bold text-slate-900 dark:text-white block">
                  Assignee Estate Agent Contact
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                      Agent Name
                    </label>
                    <input
                      type="text"
                      value={propAgentName}
                      onChange={(e) => setPropAgentName(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                      Agent Phone
                    </label>
                    <input
                      type="text"
                      value={propAgentPhone}
                      onChange={(e) => setPropAgentPhone(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-bold text-slate-500 mb-0.5">
                      Agent Email
                    </label>
                    <input
                      type="email"
                      value={propAgentEmail}
                      onChange={(e) => setPropAgentEmail(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Checkboxes: Verified, Featured & Status */}
              <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={propVerified}
                      onChange={(e) => setPropVerified(e.target.checked)}
                      className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>Title Deed Verified</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 dark:text-slate-300">
                    <input
                      type="checkbox"
                      checked={propFeatured}
                      onChange={(e) => setPropFeatured(e.target.checked)}
                      className="rounded border-slate-300 text-amber-500 focus:ring-amber-400"
                    />
                    <span>Featured on Homepage</span>
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Listing Status:
                  </span>
                  <select
                    value={propStatus}
                    onChange={(e) => setPropStatus(e.target.value as any)}
                    className="px-2.5 py-1 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white"
                  >
                    <option value="available">Available</option>
                    <option value="under_offer">Under Offer</option>
                    <option value="sold">Sold</option>
                    <option value="leased">Leased</option>
                  </select>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Publish Property Listing</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 2: CONFIRM REMOVE / DELETE PROPERTY           */}
      {/* ==================================================== */}
      {propertyToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="w-12 h-12 bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-200 dark:border-rose-800">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="text-center">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {language === 'ha' ? 'Cire Wannan Gidan?' : 'Remove Property Listing?'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'ha'
                  ? 'Shin kun tabbata kuna son share wannan gidan daga 3PLE A? Wannan mataki ba za a iya soke shi ba.'
                  : 'Are you sure you want to permanently remove this property from the 3PLE A directory?'}
              </p>
            </div>

            {/* Target Property Summary Card */}
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800 text-xs flex items-center gap-3">
              <img
                src={propertyToDelete.imageUrl}
                alt={propertyToDelete.title}
                className="w-14 h-14 object-cover rounded-lg shrink-0 border border-slate-200 dark:border-slate-700"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    '/src/assets/images/kano_tarauni_duplex_1793031985230.jpg';
                }}
              />
              <div className="truncate">
                <div className="font-bold text-slate-900 dark:text-white truncate">
                  {propertyToDelete.title}
                </div>
                <div className="text-slate-400 dark:text-slate-500 text-[11px] truncate">
                  {propertyToDelete.location}, {propertyToDelete.city}
                </div>
                <div className="font-mono font-bold text-emerald-600 dark:text-emerald-400 text-xs mt-0.5">
                  ₦{propertyToDelete.price.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPropertyToDelete(null)}
                className="flex-1 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteProperty}
                className="flex-1 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Confirm Remove</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL 3: VIEWING / INSPECTION SCHEDULE (CUSTOMER)    */}
      {/* ==================================================== */}
      {selectedPropertyForViewing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4">
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Book Property Inspection
                </h3>
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
                <h4 className="text-base font-bold text-slate-900 dark:text-white">
                  Viewing Request Registered!
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
                  Our estate agent ({selectedPropertyForViewing.agentName}) will contact you via
                  phone ({clientPhone}) to confirm the inspection on {preferredDate}.
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
                  <div className="font-semibold text-slate-800 dark:text-slate-200">
                    Assigned 3PLE A Representative:
                  </div>
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
