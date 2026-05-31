import React, { useState, useEffect } from 'react';
import { Search, Compass, MapPin, SlidersHorizontal, Trash2, CheckCircle, Flame, Calendar, Sparkles, MessageSquare, Heart, AlertCircle, RefreshCw, Eye, Tag, Globe, List } from 'lucide-react';
import { Ad, VehicleType, EquipmentState, RegoState, FilterState } from './types';
import { INITIAL_ADS, DEMO_ADS, AUSTRALIAN_STATES_DESC } from './data';
import Navbar from './components/Navbar';
import AdDetailsModal from './components/AdDetailsModal';
import HostAdForm from './components/HostAdForm';
import Quiz from './components/Quiz';
import Guide from './components/Guide';
import AuthModal from './components/AuthModal';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { getHaversineDistance, resolveCoordinatesOf } from './utils/geo';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('accueil');
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  
  // Auth state
  const [user, setUser] = useState<User | null>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [adToDelete, setAdToDelete] = useState<Ad | null>(null);
  
  // Search and Filter criteria
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: '',
    type: 'All',
    equipmentState: 'All',
    regoState: 'All',
    priceMax: 999999, // Unbounded by default
    priceMin: 0,
    vehicleCondition: 'All',
    buyerLocation: '',
    buyerDistanceMax: 999999 // Unbounded by default
  });

  const [buyerLocation, setBuyerLocation] = useState('');
  const [buyerLocationCoords, setBuyerLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [isResolvingBuyerLocation, setIsResolvingBuyerLocation] = useState(false);

  // Success toast state
  const [toastMessage, setToastMessage] = useState<string>('');

  // Favorites state list
  const [favorites, setFavorites] = useState<string[]>([]);

  // Load ads and favorites on mount
  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, 'ads'), (snapshot) => {
      const liveAds: Ad[] = [];
      snapshot.forEach((doc) => {
        liveAds.push(doc.data() as Ad);
      });
      // Sort newest first
      liveAds.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setAds(liveAds);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'ads');
    });

    const savedFavs = localStorage.getItem('le_bon_spot_favs');
    if (savedFavs) {
      try {
        setFavorites(JSON.parse(savedFavs));
      } catch (e) {}
    }

    return () => unsubscribe();
  }, []);

  // Listen for user auth changes
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribeAuth();
  }, [activeTab]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setToastMessage('🔐 Déconnexion réussie. À bientôt !');
      if (activeTab === 'mes-annonces') {
        setActiveTab('accueil');
      }
      setTimeout(() => setToastMessage(''), 4500);
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const handleEditAd = (ad: Ad) => {
    setEditingAd(ad);
    setActiveTab('vendre');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditingAd(null);
    setActiveTab('mes-annonces');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSuccessRedirect = () => {
    const defaultTab = editingAd ? 'mes-annonces' : 'accueil';
    setEditingAd(null);
    setActiveTab(defaultTab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteAd = async (adId: string) => {
    try {
      await deleteDoc(doc(db, 'ads', adId));
      setToastMessage('🗑️ Annonce supprimée avec succès !');
      setAdToDelete(null);
      setTimeout(() => setToastMessage(''), 4500);
    } catch (err: any) {
      console.error("Delete failed", err);
      setToastMessage(`❌ Erreur lors de la suppression.`);
      setTimeout(() => setToastMessage(''), 4500);
    }
  };

  // Sync buyer search address search location
  useEffect(() => {
    if (!buyerLocation.trim()) {
      setBuyerLocationCoords(null);
      return;
    }

    let active = true;
    const timer = setTimeout(async () => {
      setIsResolvingBuyerLocation(true);
      try {
        const coords = await resolveCoordinatesOf(buyerLocation);
        if (active) {
          setBuyerLocationCoords(coords);
        }
      } catch (err) {
        console.error("Failed to geocode buyer search location", err);
      } finally {
        if (active) setIsResolvingBuyerLocation(false);
      }
    }, 850);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [buyerLocation]);

  const handleAddAd = async (newAd: Ad) => {
    try {
      const adWithUser = {
        ...newAd,
        userId: newAd.userId || user?.uid || 'anonymous'
      };
      await setDoc(doc(db, 'ads', adWithUser.id), adWithUser);
      // Set a happy persistent toast notification
      setToastMessage(editingAd 
        ? `🥳 Annonce modifiée avec succès.` 
        : `🥳 Annonce publiée avec succès ! Votre ${adWithUser.brand} est désormais en ligne.`
      );
      setTimeout(() => {
        setToastMessage('');
      }, 6000);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `ads/${newAd.id}`);
    }
  };

  const handleLoadDemoAds = async () => {
    try {
      setToastMessage("⏳ Importation des véhicules de démo en cours...");
      for (const ad of DEMO_ADS) {
        await setDoc(doc(db, 'ads', ad.id), ad);
      }
      setToastMessage("💡 Exemples de démonstration chargés avec succès ! Vous pouvez filtrer et naviguer librement.");
      setTimeout(() => setToastMessage(''), 4500);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'ads');
    }
  };


  const handleToggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    let updated;
    if (favorites.includes(id)) {
      updated = favorites.filter(favId => favId !== id);
    } else {
      updated = [...favorites, id];
    }
    setFavorites(updated);
    localStorage.setItem('le_bon_spot_favs', JSON.stringify(updated));
  };

  const handleQuizResultApply = (recommendedType: VehicleType, recommendedEquipment: EquipmentState) => {
    setFilters(prev => ({
      ...prev,
      type: recommendedType,
      equipmentState: recommendedEquipment,
      priceMax: 999999, // unbounded price on recommendation
      priceMin: 0
    }));
    setActiveTab('accueil');
    
    setToastMessage(`🎯 Filtres du questionnaire appliqués : ${recommendedType} (${recommendedEquipment})`);
    setTimeout(() => {
      setToastMessage('');
    }, 4500);
  };

  const resetFilters = () => {
    setFilters({
      searchQuery: '',
      type: 'All',
      equipmentState: 'All',
      regoState: 'All',
      priceMax: 999999,
      priceMin: 0,
      vehicleCondition: 'All',
      buyerLocation: '',
      buyerDistanceMax: 999999
    });
    setBuyerLocation('');
    setBuyerLocationCoords(null);
  };

  // Filtered ads calculations
  const filteredAds = ads.filter((ad) => {
    // 1. Text Search query
    const searchString = `${ad.brand} ${ad.model} ${ad.title} ${ad.description} ${ad.location}`.toLowerCase();
    if (filters.searchQuery && !searchString.includes(filters.searchQuery.toLowerCase())) {
      return false;
    }

    // 2. Vegicle category Filter
    if (filters.type !== 'All' && ad.type !== filters.type) {
      return false;
    }

    // 3. Equipment state Filter
    if (filters.equipmentState !== 'All' && ad.equipmentState !== filters.equipmentState) {
      return false;
    }

    // 4. Rego State Filter
    if (filters.regoState !== 'All' && ad.regoState !== filters.regoState) {
      return false;
    }

    // 5. Price filters (Free-range text inputs)
    if (filters.priceMin !== undefined && ad.price < filters.priceMin) {
      return false;
    }
    if (filters.priceMax !== undefined && filters.priceMax !== 999999 && ad.price > filters.priceMax) {
      return false;
    }

    // 6. Vehicle general condition Filter
    if (filters.vehicleCondition && filters.vehicleCondition !== 'All') {
      if (!ad.vehicleCondition || ad.vehicleCondition !== filters.vehicleCondition) {
        return false;
      }
    }

    // 7. Distance proximity query (Haversine calculations)
    if (buyerLocationCoords && filters.buyerDistanceMax && filters.buyerDistanceMax !== 999999) {
      let adLat = ad.latitude;
      let adLng = ad.longitude;

      if (!adLat || !adLng) {
        const presetLocs: Record<string, {lat: number, lng: number}> = {
          'sydney': { lat: -33.8688, lng: 151.2093 },
          'melbourne': { lat: -37.8136, lng: 144.9631 },
          'brisbane': { lat: -27.4698, lng: 153.0251 },
          'cairns': { lat: -16.9186, lng: 145.7781 },
          'perth': { lat: -31.9505, lng: 115.8605 },
          'darwin': { lat: -12.4634, lng: 130.8456 },
          'adelaide': { lat: -34.9285, lng: 138.6007 },
          'alice springs': { lat: -23.6980, lng: 133.8807 },
          'broome': { lat: -17.9614, lng: 122.2359 }
        };
        const cleanKey = ad.location.toLowerCase().trim();
        const foundPreset = Object.entries(presetLocs).find(([city]) => cleanKey.includes(city));
        if (foundPreset) {
          adLat = foundPreset[1].lat;
          adLng = foundPreset[1].lng;
        } else {
          adLat = -33.8688;
          adLng = 151.2093;
        }
      }

      const distance = getHaversineDistance(buyerLocationCoords.lat, buyerLocationCoords.lng, adLat, adLng);
      if (distance > filters.buyerDistanceMax) {
        return false;
      }
    }

    return true;
  });

  const premiumSponsoredAds = filteredAds.filter((ad) => ad.isPremium);
  const standardAds = filteredAds.filter((ad) => !ad.isPremium);
  const myAds = ads.filter((ad) => ad.userId === user?.uid);
  const favoritedAds = ads.filter((ad) => favorites.includes(ad.id));

  return (
    <div className="min-h-screen bg-[#f7f2eb] text-slate-800 pb-20 md:pb-6 font-sans flex flex-col justify-between" id="app-root-container">
      
      {/* Dynamic Toast Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 max-w-sm bg-stone-900 text-white rounded-2xl shadow-xl border border-amber-800 p-4 transition-all duration-300 animate-slide-in flex items-start gap-3">
          <div className="bg-[#b35431] text-white p-1 rounded-full flex-shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs font-semibold leading-relaxed font-sans">{toastMessage}</p>
          </div>
        </div>
      )}

      {/* Global Navigation Hub */}
      <Navbar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        user={user}
        onOpenAuth={() => setShowAuthModal(true)}
        onLogout={handleLogout}
      />

      {/* Main Pages router switch */}
      <main className="flex-1">

        {/* 1. HOME SCREEN: SEARCH ENGINE & CLASSIFIED LISTINGS */}
        {activeTab === 'accueil' && (
          <div className="space-y-8" id="tab-accueil">
            {/* Grand Outback Hero Section */}
            <div className="relative bg-[#1e3427] text-[#fbf7f3] py-16 px-4 text-center overflow-hidden border-b border-[#223d2e] shadow-inner">
              <div className="absolute inset-0 opacity-15 pointer-events-none bg-[radial-gradient(#b35431_1px,transparent_1px)] [background-size:16px_16px]" />
              
              {/* Australian Sun circle element */}
              <div className="absolute -bottom-16 left-1/2 transform -translate-x-1/2 w-80 h-32 bg-[#b35431]/20 rounded-t-full blur-3xl pointer-events-none" />

              <div className="relative max-w-4xl mx-auto space-y-4">
                <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-[#ff6f3c] bg-[#14231b] py-1 px-3 rounded-full border border-stone-800">
                  🗺️ Explorez et rêvez en grand ci-dessous
                </span>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-[#fbf7f3]">
                  Trouvez votre véhicule idéal sur <span className="text-[#ff6f3c]">Le Bon Spot</span>.
                </h1>
                <p className="text-sm sm:text-base text-[#a0bfaa] max-w-2xl mx-auto font-medium leading-relaxed">
                  La première plateforme d'annonces de vans et de 4x4 aménagés pour les voyageurs (backpackers) en Australie. Pensée exclusivement pour l'aventure.
                </p>
                
                {/* Visual badge numbers */}
                <div className="flex items-center justify-center gap-4 text-[11px] font-mono text-[#a0bfaa] pt-2">
                  <span>🚗 {ads.length} Annonces</span>
                  <span>🐾 100% Backpacker</span>
                  <span>💬 Direct WhatsApp</span>
                </div>
              </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-12">
              {/* CENTRAL MULTI-FILTER ENGINE PANEL */}
              <div className="bg-white rounded-3xl p-6 shadow-md border border-[#e3d5c5] -mt-12 relative z-20 max-w-5xl mx-auto space-y-4" id="search-filter-panel">
                
                {/* ROW 1: General search text input */}
                <div className="relative w-full">
                  <Search className="absolute left-3.5 top-3 h-4 w-4 text-[#b35431]" />
                  <input
                    type="text"
                    placeholder="Recherche par marque, mot clé (frigo, solaire, lit permanent (double)...)"
                    value={filters.searchQuery}
                    onChange={(e) => setFilters(prev => ({ ...prev, searchQuery: e.target.value }))}
                    className="w-full bg-[#fbf7f3] border border-[#e3d5c5] rounded-xl pl-10 pr-4 py-2.5 text-xs sm:text-sm focus:ring-2 focus:ring-[#b35431] focus:outline-none placeholder-stone-400 font-medium"
                  />
                </div>

                {/* ROW 2: Specific Categorizations Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  
                  {/* Category with model examples inside parentheses */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">Modèle attendu</label>
                    <select
                      value={filters.type}
                      onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as VehicleType | 'All' }))}
                      className="w-full bg-[#fbf7f3] border border-[#e3d5c5] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#b35431]"
                    >
                      <option value="All">🚗 Tous modèles</option>
                      <option value="Van">Van (Hiace, Express, Townace, Transit...)</option>
                      <option value="4x4">4x4 d'aventure (LandCruiser, Patrol, Pajero, Prado...)</option>
                      <option value="Station Wagon">Station Wagon / Break (Outback, Falcon, Commodore...)</option>
                    </select>
                  </div>

                  {/* Vehicle condition selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">État mécanique</label>
                    <select
                      value={filters.vehicleCondition}
                      onChange={(e) => setFilters(prev => ({ ...prev, vehicleCondition: e.target.value as any }))}
                      className="w-full bg-[#fbf7f3] border border-[#e3d5c5] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#b35431]"
                    >
                      <option value="All">⚙️ Tous états</option>
                      <option value="Excellent">⭐ Excellent état</option>
                      <option value="Bon">👍 Bon état général</option>
                      <option value="À réviser">🔧 À réviser</option>
                      <option value="À réparer">⚠️ À réparer</option>
                    </select>
                  </div>

                  {/* Equipment finish type selection */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">Finition aménagement</label>
                    <select
                      value={filters.equipmentState}
                      onChange={(e) => setFilters(prev => ({ ...prev, equipmentState: e.target.value as EquipmentState | 'All' }))}
                      className="w-full bg-[#fbf7f3] border border-[#e3d5c5] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#b35431]"
                    >
                      <option value="All">🛠️ Tout aménagement</option>
                      <option value="Clé en main">🛌 Clé en main</option>
                      <option value="À aménager">🔧 À aménager / Vide</option>
                    </select>
                  </div>

                  {/* REGO state plates Selector */}
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">Plaque d'État (Rego)</label>
                    <select
                      value={filters.regoState}
                      onChange={(e) => setFilters(prev => ({ ...prev, regoState: e.target.value as RegoState | 'All' }))}
                      className="w-full bg-[#fbf7f3] border border-[#e3d5c5] rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#b35431]"
                    >
                      <option value="All">🛡️ Toutes les Regos</option>
                      <option value="WA">WA (Western Australia)</option>
                      <option value="QLD">QLD (Queensland)</option>
                      <option value="NSW">NSW (New South Wales)</option>
                      <option value="VIC">VIC (Victoria)</option>
                      <option value="SA">SA (South Australia)</option>
                      <option value="NT">NT (Northern Territory)</option>
                      <option value="TAS">TAS (Tasmania)</option>
                    </select>
                  </div>

                </div>

                {/* ROW 3: Proximity Search & Free-form budget limits */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-1">
                  
                  {/* Buyer target city input */}
                  <div className="md:col-span-4 flex flex-col gap-1 relative">
                    <label className="text-[10px] font-bold text-[#b35431] uppercase tracking-wider font-mono flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>Où es-tu situé ?</span>
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Byron Bay, QLD ou Perth"
                      value={buyerLocation}
                      onChange={(e) => setBuyerLocation(e.target.value)}
                      className="w-full bg-[#fbf7f3] border border-[#e3d5c5] rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[#b35431] focus:outline-none"
                    />
                    {isResolvingBuyerLocation && (
                      <span className="text-[8px] text-[#b35431] font-mono animate-pulse absolute right-2 bottom-2.5">⌛ Recherche...</span>
                    )}
                  </div>

                  {/* Max distance within radius dropdown */}
                  <div className="md:col-span-3 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">Distance de recherche max</label>
                    <select
                      value={filters.buyerDistanceMax === 999999 ? 'all' : filters.buyerDistanceMax}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        buyerDistanceMax: e.target.value === 'all' ? 999999 : Number(e.target.value)
                      }))}
                      disabled={!buyerLocation.trim() || isResolvingBuyerLocation}
                      className="w-full bg-[#fbf7f3] border border-[#e3d5c5] rounded-xl px-2.5 py-2 text-xs font-semibold focus:outline-none disabled:opacity-40"
                    >
                      <option value="all">🌐 Toutes distances (Aussi loin que l'Outback!)</option>
                      <option value="50">🚗 Dans les 50 km</option>
                      <option value="150">🚙 Dans les 150 km</option>
                      <option value="350">🌍 Dans les 350 km</option>
                      <option value="700">🐪 Dans les 700 km</option>
                    </select>
                  </div>

                  {/* Unbounded Budget Choice: Min limit */}
                  <div className="md:col-span-2.5 sm:col-span-6 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">Budget minimum (AUD)</label>
                    <input
                      type="number"
                      placeholder="Ex: 2000"
                      value={filters.priceMin || ''}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceMin: e.target.value === '' ? 0 : Number(e.target.value)
                      }))}
                      className="w-full bg-[#fbf7f3] border border-[#e3d5c5] rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[#b35431] focus:outline-none"
                    />
                  </div>

                  {/* Unbounded Budget Choice: Max limit */}
                  <div className="md:col-span-2.5 sm:col-span-6 flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-stone-500 uppercase tracking-wider font-mono">Budget maximum (AUD)</label>
                    <input
                      type="number"
                      placeholder="Sans limite d'achat 🚀"
                      value={filters.priceMax === 999999 ? '' : filters.priceMax}
                      onChange={(e) => setFilters(prev => ({
                        ...prev,
                        priceMax: e.target.value === '' ? 999999 : Number(e.target.value)
                      }))}
                      className="w-full bg-[#fbf7f3] border border-[#e3d5c5] rounded-xl px-3 py-2 text-xs focus:ring-1 focus:ring-[#b35431] focus:outline-none"
                    />
                  </div>

                </div>

                {/* ROW 4: Status feedback & reset trigger */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-3 border-t border-[#f4ebe1]">
                  
                  {/* Applied items coordinates feedback badge */}
                  <div className="text-[10px] font-medium text-stone-500 font-sans">
                    {buyerLocationCoords ? (
                      <span className="text-[#1e3427] font-semibold flex items-center gap-1 bg-green-50 py-1 px-3 border border-green-100 rounded-full w-fit">
                        🏢 Coordonnées localisées pour <b className="text-[#b35431]">{buyerLocation}</b> : ({buyerLocationCoords.lat.toFixed(2)}°, {buyerLocationCoords.lng.toFixed(2)}°)
                      </span>
                    ) : (
                      buyerLocation.trim() && !isResolvingBuyerLocation && (
                        <span className="text-stone-400">⚠️ Ville inconnue d'Australie. Essayez d'ajouter l'état (ex: "Byron Bay, NSW").</span>
                      )
                    )}
                  </div>

                  {/* Reset action button */}
                  <button
                    onClick={resetFilters}
                    className="flex items-center justify-center gap-1.5 text-xs font-bold text-gray-400 hover:text-rose-600 transition-colors py-1.5 px-3 rounded-lg border border-dashed border-gray-200 hover:border-rose-200 cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Réinitialiser les filtres</span>
                  </button>
                </div>
              </div>

              {ads.length === 0 ? (
                /* EMPTY DATABASE SYSTEM FRESH START WELCOME */
                <div className="text-center py-20 bg-white border border-[#e3d5c5] rounded-3xl p-10 max-w-2xl mx-auto space-y-6 shadow-sm my-8" id="empty-database-welcome">
                  <div className="mx-auto w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100">
                    <Sparkles className="h-8 w-8 text-[#b35431]" />
                  </div>
                  <div className="space-y-2">
                    <h3 className="text-2xl font-bold text-gray-900 tracking-tight font-display">Bienvenue sur Le Bon Spot !</h3>
                    <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                      La première plateforme d'annonces de Vans et de 4x4 aménagés pour backpackers commence maintenant. Aucune annonce n'est encore publiée. Soyez le premier ou la première à ajouter votre bolide !
                    </p>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
                    <button
                      onClick={() => setActiveTab('deposer')}
                      className="w-full sm:w-auto bg-[#b35431] hover:bg-[#964222] text-white font-bold text-sm py-3 px-6 rounded-2xl shadow-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>➕ Publier la première annonce</span>
                    </button>
                    
                    <button
                      onClick={handleLoadDemoAds}
                      className="w-full sm:w-auto bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-sm py-3 px-6 rounded-2xl transition-all flex items-center justify-center gap-2 border border-stone-200 cursor-pointer"
                    >
                      <span>🔄 Charger les exemples de démo</span>
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {/* SECTION A : PREMIUM SPONSORED LISTINGS CARD (Grand bandeau scrollable) */}
                  {premiumSponsoredAds.length > 0 && (
                    <div className="space-y-4" id="premium-show-section">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-extrabold font-mono uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                          <Flame className="h-4 w-4 text-[#ff6f3c] animate-bounce" />
                          Mise en avant Premium : Partir l'esprit tranquille
                        </h3>
                        <span className="text-[10px] bg-amber-100 text-[#b35431] py-0.5 px-2.5 rounded font-mono font-bold">SPONSORISÉ</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {premiumSponsoredAds.map((ad) => {
                          const isFav = favorites.includes(ad.id);
                          return (
                            <div 
                              key={ad.id}
                              onClick={() => setSelectedAd(ad)}
                              className="group relative bg-[#fffdfa] border-2 border-[#ff6f3c]/40 rounded-3xl overflow-hidden shadow-lg hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
                            >
                              {/* Image Gallery */}
                              <div className="relative aspect-video bg-[#1e3427]/10">
                                <img
                                  src={ad.image}
                                  alt={ad.title}
                                  className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                                  referrerPolicy="no-referrer"
                                />
                                
                                {/* Tags on top of image */}
                                <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
                                  <span className="bg-[#b35431] text-white font-mono text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wide">
                                    Premium
                                  </span>
                                  <span className="bg-slate-900/80 text-white font-mono text-[9px] font-bold px-2 py-0.5 rounded tracking-wide">
                                    Rego {ad.regoState}
                                  </span>
                                </div>

                                {/* Favorite micro button */}
                                <button
                                  onClick={(e) => handleToggleFavorite(ad.id, e)}
                                  className="absolute top-3 right-3 bg-white/90 hover:bg-white text-[#ff6f3c] p-2 rounded-full transition-colors focus:outline-none"
                                >
                                  <Heart className={`h-4.5 w-4.5 ${isFav ? 'fill-[#ff6f3c]' : ''}`} />
                                </button>

                                {/* Transparent Black bottom overlay with price */}
                                <div className="absolute bottom-3 right-3 bg-[#b35431] text-[#fbf7f3] font-display text-sm font-semibold tracking-tight py-1 px-3 rounded-lg shadow-md">
                                  {ad.price.toLocaleString()} $ AUD
                                </div>
                              </div>

                              {/* Listing textual components */}
                              <div className="p-5 flex-1 flex flex-col justify-between">
                                <div className="space-y-2">
                                  {/* Location + stats */}
                                  <div className="flex items-center justify-between text-[11px] text-gray-500 font-medium">
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3.5 w-3.5 text-[#b35431]" />
                                      {ad.location}
                                    </span>
                                    <span className="font-mono">{ad.mileage.toLocaleString()} km</span>
                                  </div>

                                  <h4 className="text-sm font-extrabold text-gray-900 group-hover:text-[#b35431] transition-colors leading-snug line-clamp-2">
                                    {ad.title}
                                  </h4>

                                  {/* Small details description snippet */}
                                  <p className="text-[11px] text-gray-500 line-clamp-2 leading-relaxed">
                                    {ad.description}
                                  </p>
                                </div>

                                {/* Buttons footer */}
                                <div className="border-t border-[#f4ebe1] pt-4 mt-4 flex items-center justify-between">
                                  <span className="text-[10px] font-mono uppercase text-gray-400">
                                    {ad.sellerName} • {ad.type}
                                  </span>
                                  
                                  <button
                                    onClick={() => setSelectedAd(ad)}
                                    className="text-xs font-bold text-[#b35431] group-hover:underline flex items-center gap-1 cursor-pointer"
                                  >
                                    <span>Voir l'annonce →</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* SECTION B : STANDARD CLASSIFIED ADS GRIL */}
                  <div className="space-y-4" id="standard-grid-section">
                    <h3 className="text-sm font-extrabold font-mono uppercase tracking-wider text-slate-500">
                      Toutes les annonces disponibles ({filteredAds.length})
                    </h3>

                    {filteredAds.length === 0 ? (
                      /* EMPTY SEARCH FEEDBACK CONTAINER */
                      <div className="text-center py-16 bg-white border border-[#e3d5c5] rounded-3xl p-8 max-w-xl mx-auto space-y-4">
                        <Compass className="h-12 w-12 text-[#b35431] mx-auto animate-spin" />
                        <h4 className="text-base font-bold text-gray-900">Aucun bolide ne correspond aux filtres définis...</h4>
                        <p className="text-xs text-gray-500">
                          Essayez d'élargir votre budget maximum ou changez l'État de la REGO. Vous pouvez aussi réinitialiser tous les filtres en 1 clic !
                        </p>
                        <button
                          onClick={resetFilters}
                          className="bg-[#1e3427] text-white text-xs font-bold py-2 px-4 rounded-xl hover:bg-[#253f30] transition-colors cursor-pointer"
                        >
                          Remettre à zéro
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" id="standard-ads-list">
                        {standardAds.map((ad) => {
                          const isFav = favorites.includes(ad.id);
                          return (
                            <div
                              key={ad.id}
                              onClick={() => setSelectedAd(ad)}
                              className="group bg-white rounded-2xl overflow-hidden border border-[#e3d5c5] hover:border-[#b35431]/60 hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
                            >
                              {/* Image Box */}
                              <div className="aspect-video relative bg-gray-100">
                                <img
                                  src={ad.image}
                                  alt={ad.title}
                                  className="w-full h-full object-cover group-hover:scale-101 transition-transform"
                                  referrerPolicy="no-referrer"
                                />
                                
                                {/* Price Label Badge */}
                                <div className="absolute bottom-2.5 right-2.5 bg-[#1e3427] text-white font-display text-xs font-semibold tracking-tight py-1 px-2.5 rounded-lg shadow-sm">
                                  {ad.price.toLocaleString()} $
                                </div>

                                {/* REGO state badge */}
                                <span className="absolute top-2.5 left-2.5 bg-white/95 text-[#1e3427] border border-[#e3d5c5] font-mono text-[9px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wide shadow-sm">
                                  Rego {ad.regoState}
                                </span>

                                {/* Favorite Button */}
                                <button
                                  onClick={(e) => handleToggleFavorite(ad.id, e)}
                                  className="absolute top-2.5 right-2.5 bg-white/90 hover:bg-white text-[#ff6f3c] p-1.5 rounded-full transition-colors"
                                >
                                  <Heart className={`h-4 w-4 ${isFav ? 'fill-[#ff6f3c]' : ''}`} />
                                </button>
                              </div>

                              {/* Body context */}
                              <div className="p-4 flex-1 flex flex-col justify-between">
                                <div className="space-y-1.5">
                                  {/* KM and Location line */}
                                  <div className="flex items-center justify-between text-[10px] text-gray-500">
                                    <span className="flex items-center gap-0.5">
                                      <MapPin className="h-3 w-3 text-[#b35431]" />
                                      {ad.location}
                                    </span>
                                    <span className="font-mono">{ad.mileage.toLocaleString()} km</span>
                                  </div>

                                  <h4 className="text-xs sm:text-sm font-extrabold text-gray-900 group-hover:text-[#b35431] transition-colors leading-tight line-clamp-2">
                                    {ad.title}
                                  </h4>
                                </div>

                                <div className="border-t border-[#f4ebe1] pt-3 mt-3 flex items-center justify-between text-[10px] text-gray-400">
                                  <span>{ad.type}</span>
                                  <span className="font-bold text-[#b35431] group-hover:underline">Détails →</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Bottom beautiful FAQ prompt */}
            <div className="bg-[#1e3427] text-[#fbf7f3] py-16 text-center border-t border-[#223d2e]">
              <div className="max-w-3xl mx-auto px-4 space-y-4">
                <Compass className="h-10 w-10 text-[#ff6f3c] mx-auto transform hover:rotate-45 transition-transform duration-300" />
                <h3 className="text-lg sm:text-xl font-bold">Incertain sur l'équipement ou la Rego ?</h3>
                <p className="text-xs sm:text-sm text-[#a2bfaa] leading-relaxed">
                  Pas de panique. Chaque État possède d'importantes contraintes d'immatriculation. Nous avons décrypté les règles de la REGO pour que vous ne perdiez pas de temps avec des formalités coûteuses.
                </p>
                <button
                  onClick={() => setActiveTab('guide')}
                  className="inline-flex items-center gap-1 bg-[#ff6f3c] hover:bg-[#c54110] text-white text-xs font-bold py-2.5 px-5 rounded-full shadow transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <span>Consulter le Guide Rego & Moteurs</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* 2. DÉPÔT D'ANNONCE (WIZARD STEPS FORM) */}
        {activeTab === 'vendre' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-16" id="tab-vendre">
            <HostAdForm 
              onAddAd={handleAddAd} 
              onSuccessRedirect={handleSuccessRedirect}
              editingAd={editingAd}
              onCancelEdit={handleCancelEdit}
              onRequireLogin={() => setShowAuthModal(true)}
            />
          </div>
        )}

        {/* 2.5 MES ANNONCES (Espace Gestion) */}
        {activeTab === 'mes-annonces' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 animate-fade-in" id="tab-mes-annonces">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#e3d5c5] pb-6 mb-8 bg-[#fbf7f3]/50 p-6 rounded-3xl border">
              <div>
                <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
                  <span>🚗 Mon Espace Gestion</span>
                  <span className="text-xs font-mono bg-[#1e3427] text-[#fbf7f3] py-1 px-2.5 rounded-full">
                    {myAds.length} {myAds.length > 1 ? 'annonces' : 'annonce'}
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  Retrouvez et gérez vos annonces publiées sur Le Bon Spot. Modifiez vos informations clés ou supprimez vos véhicules vendus !
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingAd(null);
                  setActiveTab('vendre');
                }}
                className="inline-flex items-center gap-1.5 bg-[#b35431] hover:bg-[#c95f38] text-white text-xs font-bold py-2.5 px-4.5 rounded-2xl shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <span>Publier un nouveau véhicule</span>
              </button>
            </div>

            {!user ? (
              <div className="text-center py-16 bg-[#fbf7f3] border border-[#e3d5c5] rounded-3xl p-8 max-w-xl mx-auto space-y-4">
                <AlertCircle className="h-12 w-12 text-[#b35431] mx-auto" />
                <h4 className="text-base font-bold text-gray-900 font-sans">Connexion requise</h4>
                <p className="text-xs text-stone-500">
                  Vous devez être connecté pour accéder à votre espace de gestion et voir vos annonces.
                </p>
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="bg-[#1e3427] text-[#fbf7f3] text-xs font-bold py-2.5 px-5 rounded-xl hover:bg-[#253f30] transition-colors cursor-pointer"
                >
                  Se connecter maintenant
                </button>
              </div>
            ) : myAds.length === 0 ? (
              <div className="text-center py-16 bg-[#fbf7f3] border border-[#e3d5c5] rounded-3xl p-8 max-w-xl mx-auto space-y-4">
                <Compass className="h-12 w-12 text-slate-400 mx-auto" />
                <h4 className="text-base font-bold text-gray-900 font-sans">Aucune annonce répertoriée</h4>
                <p className="text-xs text-stone-500">
                  Vous n'avez pas encore publié d'annonce sur Le Bon Spot avec ce compte. Prêt à vendre votre bolide de camping pour continuer le voyage ?
                </p>
                <button
                  onClick={() => {
                    setEditingAd(null);
                    setActiveTab('vendre');
                  }}
                  className="bg-[#1e3427] text-[#fbf7f3] text-xs font-bold py-2.5 px-5 rounded-xl hover:bg-[#253f30] transition-colors cursor-pointer"
                >
                  Déposer ma première annonce
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" id="my-ads-list-grid">
                {myAds.map((ad) => (
                  <div
                    key={ad.id}
                    className="group bg-[#fbf7f3] rounded-3xl overflow-hidden border border-[#e3d5c5] hover:border-[#b35431]/40 hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    {/* Upper image header */}
                    <div className="aspect-video relative bg-slate-100 overflow-hidden">
                      <img
                        src={ad.image}
                        alt={ad.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-101"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute bottom-2.5 right-2.5 bg-[#1e3427] text-white font-mono text-xs font-semibold py-1.5 px-3 rounded-lg shadow">
                        {ad.price.toLocaleString()} $ AUD
                      </div>
                      <span className="absolute top-2.5 left-2.5 bg-[#b35431] text-[#fbf7f3] font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide shadow-sm">
                        REGO {ad.regoState}
                      </span>
                    </div>

                    {/* Middle details component */}
                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3.5 w-3.5 text-[#b35431]" />
                            {ad.location}
                          </span>
                          <span className="font-mono">{ad.mileage.toLocaleString()} km</span>
                        </div>
                        <h4 className="text-sm font-extrabold text-gray-900 group-hover:text-[#b35431] transition-colors line-clamp-2 leading-snug font-sans">
                          {ad.title}
                        </h4>
                        <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                          {ad.description}
                        </p>
                      </div>

                      {/* Management Action Buttons */}
                      <div className="border-t border-[#e3d5c5]/80 pt-4 flex items-center gap-2">
                        <button
                          onClick={() => handleEditAd(ad)}
                          className="flex-grow text-center bg-white border border-[#e3d5c5] hover:border-[#b35431] text-stone-800 hover:text-[#b35431] text-xs font-bold py-2.5 px-3 rounded-xl transition duration-200 cursor-pointer"
                        >
                          Modifier l'annonce
                        </button>
                        <button
                          onClick={() => setAdToDelete(ad)}
                          className="flex-shrink-0 text-center bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 text-xs font-bold py-2.5 px-3.5 rounded-xl transition duration-200 cursor-pointer flex items-center justify-center"
                          title="Supprimer ou Véhicule Vendu"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 2.75 MES FAVORIS (Espace Favoris) */}
        {activeTab === 'mes-favoris' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-16 animate-fade-in" id="tab-mes-favoris">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-[#e3d5c5] pb-6 mb-8 bg-[#fbf7f3]/50 p-6 rounded-3xl border">
              <div>
                <h2 className="text-2xl font-extrabold text-stone-900 tracking-tight flex items-center gap-2">
                  <Heart className="h-6 w-6 text-[#ff6f3c] fill-[#ff6f3c]" />
                  <span>Mes Bolides Favoris</span>
                  <span className="text-xs font-mono bg-[#1e3427] text-[#fbf7f3] py-1 px-2.5 rounded-full">
                    {favoritedAds.length} {favoritedAds.length > 1 ? 'sauvegardés' : 'sauvegardé'}
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-stone-500 mt-1">
                  Retrouvez ici tous les véhicules d'aventure que vous avez mis de côté pour votre futur road trip en Australie !
                </p>
              </div>
              <button
                onClick={() => setActiveTab('accueil')}
                className="inline-flex items-center gap-1.5 bg-[#1e3427] hover:bg-[#253f30] text-[#fbf7f3] text-[#fbf7f3] text-xs font-bold py-2.5 px-4.5 rounded-2xl shadow-sm transition-all active:scale-95 cursor-pointer shrink-0"
              >
                <span>Continuer la recherche</span>
              </button>
            </div>

            {favoritedAds.length === 0 ? (
              <div className="text-center py-16 bg-[#fbf7f3] border border-[#e3d5c5] rounded-3xl p-8 max-w-xl mx-auto space-y-4">
                <Heart className="h-12 w-12 text-stone-300 mx-auto" />
                <h4 className="text-base font-bold text-gray-900 font-sans">Aucun favori pour l'instant</h4>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Parcourez la liste des annonces sur Le Bon Spot, puis cliquez sur l'icône de cœur de n'importe quel van ou 4x4 d'aventure pour qu'il s'affiche ici !
                </p>
                <button
                  onClick={() => setActiveTab('accueil')}
                  className="bg-[#b35431] hover:bg-[#c95f38] text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-colors cursor-pointer"
                >
                  Explorer les annonces
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in" id="favorites-ads-list-grid">
                {favoritedAds.map((ad) => {
                  const isFav = favorites.includes(ad.id);
                  return (
                    <div
                      key={ad.id}
                      onClick={() => setSelectedAd(ad)}
                      className="group bg-[#fbf7f3] rounded-3xl overflow-hidden border border-[#e3d5c5] hover:border-[#b35431]/40 hover:shadow-md transition-all flex flex-col justify-between cursor-pointer"
                    >
                      {/* Upper image header */}
                      <div className="aspect-video relative bg-slate-100 overflow-hidden">
                        <img
                          src={ad.image}
                          alt={ad.title}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-101"
                          referrerPolicy="no-referrer"
                        />
                        <div className="absolute bottom-2.5 right-2.5 bg-[#1e3427] text-white font-mono text-xs font-semibold py-1.5 px-3 rounded-lg shadow">
                          {ad.price.toLocaleString()} $ AUD
                        </div>
                        <span className="absolute top-2.5 left-2.5 bg-[#b35431] text-[#fbf7f3] font-mono text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wide shadow-sm">
                          REGO {ad.regoState}
                        </span>
                        
                        {/* Heart toggle on card image overlay */}
                        <button
                          onClick={(e) => handleToggleFavorite(ad.id, e)}
                          className="absolute top-2.5 right-2.5 bg-white/95 hover:bg-white text-[#ff6f3c] p-1.5 rounded-full shadow-sm transition hover:scale-110 cursor-pointer"
                        >
                          <Heart className="h-4 w-4 fill-[#ff6f3c]" />
                        </button>
                      </div>

                      {/* Middle details component */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-[11px] text-stone-500 font-medium">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5 text-[#b35431]" />
                              {ad.location}
                            </span>
                            <span className="font-mono">{ad.mileage.toLocaleString()} km</span>
                          </div>
                          <h4 className="text-sm font-extrabold text-gray-900 group-hover:text-[#b35431] transition-colors line-clamp-2 leading-snug font-sans">
                            {ad.title}
                          </h4>
                          <p className="text-[11px] text-stone-500 line-clamp-2 leading-relaxed">
                            {ad.description}
                          </p>
                        </div>

                        {/* Actions footer */}
                        <div className="border-t border-[#e3d5c5]/80 pt-4 flex items-center justify-between text-[11px] text-stone-500 font-sans">
                          <span className="font-mono text-stone-400 bg-[#e3d5c5]/30 px-2 py-0.5 rounded uppercase text-[9px] font-bold">
                            {ad.type}
                          </span>
                          <span className="font-bold text-[#b35431] group-hover:underline">Détails →</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* 3. INTERACTIVE QUIZ FIND STYLE VIBES */}
        {activeTab === 'quiz' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-16" id="tab-quiz">
            <Quiz onQuizComplete={handleQuizResultApply} />
          </div>
        )}

        {/* 4. BACKPACKER KNOWLEDGE GUIDE WIKI */}
        {activeTab === 'guide' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-16" id="tab-guide">
            <Guide />
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-[#15231a] text-stone-400 py-12 px-4 border-t border-stone-800 text-center" id="global-footer">
        <div className="max-w-7xl mx-auto space-y-4">
          <span className="font-bold text-[#fbf7f3] tracking-widest uppercase text-xs block font-mono">
            🐨 Le Bon Spot Australie
          </span>
          <p className="text-[11px] text-stone-500 max-w-xl mx-auto">
            Plateforme d'aide à l'intégration, d'annonces de vans / 4x4 d'occasion et de guides d'immatriculation. Le Bon Spot n'est pas affilié aux services de transport des gouvernements australiens.
          </p>
          <div className="flex items-center justify-center gap-4 text-xs font-bold font-mono text-[#ff6f3c]">
            <button onClick={() => setActiveTab('accueil')} className="hover:underline">Acheter</button>
            <span>•</span>
            <button onClick={() => setActiveTab('vendre')} className="hover:underline">Vendre</button>
            <span>•</span>
            <button onClick={() => setActiveTab('quiz')} className="hover:underline">Quel véhicule est fait pour moi ?</button>
            <span>•</span>
            <button onClick={() => setActiveTab('guide')} className="hover:underline">Guide Rego</button>
            <span>•</span>
            <button onClick={() => setActiveTab('mes-favoris')} className="hover:underline">Mes Favoris</button>
            {user && (
              <>
                <span>•</span>
                <button onClick={() => setActiveTab('mes-annonces')} className="hover:underline">Mes Annonces</button>
              </>
            )}
          </div>
          <p className="text-[10px] text-stone-600 block pt-4">© 2026 Le Bon Spot. Code avec ❤️ pour backpackers road trips.</p>
        </div>
      </footer>

      {/* Ad Detailed modal popup rendering */}
      <AdDetailsModal ad={selectedAd} onClose={() => setSelectedAd(null)} />

      {/* Auth modal setup */}
      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
        onAuthSuccess={(msg) => {
          setToastMessage(msg);
          setTimeout(() => {
            setToastMessage('');
          }, 5000);
        }}
      />

      {/* Delete confirmation custom modal dialog */}
      {adToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto" id="delete-ad-confirm-modal">
          <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={() => setAdToDelete(null)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative transform overflow-hidden rounded-3xl bg-[#fbf7f3] border border-[#e3d5c5] px-6 py-8 text-center shadow-2xl transition-all w-full max-w-sm space-y-5">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-3xl bg-rose-50 text-rose-600 border border-rose-100">
                <Trash2 className="h-6 w-6" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-gray-950 font-sans">Supprimer l'annonce ?</h3>
                <p className="text-xs text-stone-500 leading-relaxed">
                  Êtes-vous sûr de vouloir supprimer définitivement l'annonce pour votre <strong className="text-stone-800 font-semibold">{adToDelete.brand} {adToDelete.model}</strong> ? Tout historique sera effacé.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setAdToDelete(null)}
                  className="flex-grow bg-white hover:bg-stone-50 text-stone-700 font-bold text-xs py-3 px-4 rounded-xl border border-[#e3d5c5] transition cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => handleDeleteAd(adToDelete.id)}
                  className="flex-grow bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs py-3 px-4 rounded-xl transition shadow-md active:scale-97 cursor-pointer"
                >
                  Oui, Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
