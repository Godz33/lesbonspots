import React, { useState, useEffect } from 'react';
import { Sparkles, CheckCircle2, Navigation, Upload, Image, CreditCard, ChevronRight, ChevronLeft, Truck, AlertCircle, AlertOctagon, Info, ArrowLeft } from 'lucide-react';
import { Ad, VehicleType, EquipmentState, RegoState } from '../types';
import { EQUIPMENTS_OPTIONS } from '../data';
import { resolveCoordinatesOf } from '../utils/geo';
import { auth } from '../firebase';

interface HostAdFormProps {
  onAddAd: (newAd: Ad) => Promise<void>;
  onSuccessRedirect: () => void;
  editingAd?: Ad | null;
  onCancelEdit?: () => void;
  onRequireLogin?: () => void;
}

const PRESET_MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=600',
  'https://images.unsplash.com/photo-1542435503-956c469947f6?auto=format&fit=crop&q=80&w=600'
];

export default function HostAdForm({ onAddAd, onSuccessRedirect, editingAd, onCancelEdit, onRequireLogin }: HostAdFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form fields state
  const [brand, setBrand] = useState(editingAd?.brand || '');
  const [model, setModel] = useState(editingAd?.model || '');
  const [year, setYear] = useState(editingAd?.year ? String(editingAd.year) : '2005');
  const [mileage, setMileage] = useState(editingAd?.mileage ? String(editingAd.mileage) : '');
  const [price, setPrice] = useState(editingAd?.price ? String(editingAd.price) : '');
  const [regoState, setRegoState] = useState<RegoState>(editingAd?.regoState || 'WA');
  const [vehicleType, setVehicleType] = useState<VehicleType>(editingAd?.type || 'Van');
  const [equipmentState, setEquipmentState] = useState<EquipmentState>(editingAd?.equipmentState || 'Clé en main');
  const [vehicleCondition, setVehicleCondition] = useState<'Excellent' | 'Bon' | 'À réviser' | 'À réparer'>(editingAd?.vehicleCondition || 'Bon');
  const [activeConditionTooltip, setActiveConditionTooltip] = useState<string | null>(null);
  const [location, setLocation] = useState(editingAd?.location || 'Sydney, NSW');
  const [description, setDescription] = useState(editingAd?.description || '');
  const [sellerName, setSellerName] = useState(editingAd?.sellerName || '');
  const [whatsappNumber, setWhatsappNumber] = useState(editingAd?.whatsappNumber || '');
  
  // Step 2 Equipments
  const [selectedEquipments, setSelectedEquipments] = useState<string[]>(editingAd?.equipments || []);
  
  // Step 3 Image Selection
  const [selectedImage, setSelectedImage] = useState(editingAd?.image || PRESET_MOCK_IMAGES[0]);
  const [customImageUploaded, setCustomImageUploaded] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Step 4 Booster Options
  const [boosterPhotos, setBoosterPhotos] = useState(editingAd?.isPremium || false);
  const [boosterTopList, setBoosterTopList] = useState(editingAd?.isPremium || false);
  
  // Error handling
  const [errorText, setErrorText] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (editingAd) {
      setBrand(editingAd.brand);
      setModel(editingAd.model);
      setYear(String(editingAd.year));
      setMileage(String(editingAd.mileage));
      setPrice(String(editingAd.price));
      setRegoState(editingAd.regoState);
      setVehicleType(editingAd.type);
      setEquipmentState(editingAd.equipmentState);
      setVehicleCondition(editingAd.vehicleCondition || 'Bon');
      setLocation(editingAd.location);
      setDescription(editingAd.description);
      setSellerName(editingAd.sellerName);
      setWhatsappNumber(editingAd.whatsappNumber);
      setSelectedEquipments(editingAd.equipments);
      setSelectedImage(editingAd.image);
      setBoosterTopList(editingAd.isPremium || false);
      setBoosterPhotos(editingAd.isPremium || false);
    } else {
      // Clear inputs for fresh ad creation
      setBrand('');
      setModel('');
      setYear('2005');
      setMileage('');
      setPrice('');
      setRegoState('WA');
      setVehicleType('Van');
      setEquipmentState('Clé en main');
      setVehicleCondition('Bon');
      setLocation('Sydney, NSW');
      setDescription('');
      setSellerName('');
      setWhatsappNumber('');
      setSelectedEquipments([]);
      setSelectedImage(PRESET_MOCK_IMAGES[0]);
      setBoosterTopList(false);
      setBoosterPhotos(false);
    }
  }, [editingAd]);
  const toggleEquipment = (eq: string) => {
    setSelectedEquipments((prev) =>
      prev.includes(eq) ? prev.filter((item) => item !== eq) : [...prev, eq]
    );
  };

  const calculateTotalBoosterCost = () => {
    let cost = 0;
    if (boosterPhotos) cost += 5;
    if (boosterTopList) cost += 15;
    return cost;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    // Simulate photo upload by switching to a lovely randomized premium photo from our presets
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const randomIdx = Math.floor(Math.random() * PRESET_MOCK_IMAGES.length);
      setSelectedImage(PRESET_MOCK_IMAGES[randomIdx]);
      setCustomImageUploaded(true);
    }
  };

  const handleNextStep = () => {
    setErrorText('');
    
    // Simple validation per step
    if (currentStep === 1) {
      if (!brand || !model || !mileage || !price || !location || !sellerName || !whatsappNumber) {
        setErrorText('⚠️ Veuillez remplir tous les champs obligatoires avant de continuer !');
        return;
      }
      if (isNaN(Number(price)) || Number(price) <= 0) {
        setErrorText('⚠️ Veuillez saisir un prix valide et positif en dollars australiens (AUD) !');
        return;
      }
      if (isNaN(Number(mileage)) || Number(mileage) <= 0) {
        setErrorText('⚠️ Veuillez saisir un kilométrage réel valide !');
        return;
      }
    }

    if (currentStep === 2) {
      if (selectedEquipments.length === 0) {
        setErrorText('💡 Conseil : sélectionnez au moins un équipement pour rassurer les acheteurs ! (Ou passez à la suite si le véhicule est entièrement vide).');
      }
    }

    setCurrentStep((prev) => Math.min(prev + 1, 4));
  };

  const handlePrevStep = () => {
    setErrorText('');
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handlePublish = async () => {
    if (!auth.currentUser) {
      if (onRequireLogin) {
        onRequireLogin();
      } else {
        setErrorText('⚠️ Vous devez être connecté pour publier une annonce.');
      }
      return;
    }
    setIsPublishing(true);
    setErrorText('⌛ Localisation du véhicule en cours sur la carte d\'Australie...');
    let coords = { lat: -33.8688, lng: 151.2093 };
    try {
      coords = await resolveCoordinatesOf(location);
    } catch (e) {
      console.warn("Geocoding failed, falling back to default coordinates", e);
    }

    const finalAd: Ad = {
      id: editingAd ? editingAd.id : `custom-ad-${Date.now()}`,
      userId: editingAd?.userId || auth.currentUser?.uid || 'anonymous',
      title: `${brand} ${model} ${year} - ${vehicleCondition === 'Excellent' ? '⭐ Superbe état' : 'Prêt pour l\'aventure'} à ${location}`,
      description: description || `Très beau véhicule de type ${vehicleType.toLowerCase() === 'van' ? 'van' : vehicleType.toLowerCase() === '4x4' ? '4x4' : 'break (Station Wagon)'} équipé pour voyager avec l'immatriculation (rego) du ${regoState}. Vendu avec aménagement ${equipmentState.toLowerCase()} et de nombreux accessoires. L'état général du véhicule est qualifié de : ${vehicleCondition.toLowerCase()}. Idéal pour parcourir l'Australie ! N'hésitez pas à me contacter pour planifier une visite ou un essai routier.`,
      type: vehicleType,
      equipmentState: equipmentState,
      regoState: regoState,
      price: Number(price),
      mileage: Number(mileage),
      year: Number(year),
      brand: brand,
      model: model,
      location: location,
      equipments: selectedEquipments.length > 0 ? selectedEquipments : ['Équipements de camping standard'],
      isPremium: boosterTopList, // If boosted, elevate to premium list!
      image: selectedImage,
      sellerName: sellerName,
      whatsappNumber: whatsappNumber,
      createdAt: editingAd?.createdAt || new Date().toISOString().split('T')[0],
      vehicleCondition: vehicleCondition,
      latitude: coords.lat,
      longitude: coords.lng
    };

    try {
      await onAddAd(finalAd);
      setIsPublishing(false);
      onSuccessRedirect();
    } catch (err: any) {
      console.error("Failed to publish ad", err);
      setIsPublishing(false);
      let errorMsg = "Impossible de publier l'annonce sur la base de données. ";
      try {
        const parsed = JSON.parse(err.message);
        errorMsg += parsed.error || err.message;
      } catch (px) {
        errorMsg += err.message || err.toString();
      }
      setErrorText(`❌ Erreur de publication : ${errorMsg}`);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" id="host-ad-section">
      {/* Page Title & Backpacker Vibe Banner */}
      <div className="text-center mb-8 relative">
        {editingAd && onCancelEdit && (
          <button
            onClick={onCancelEdit}
            className="absolute left-0 top-0 md:top-2 flex items-center gap-1.5 text-xs font-bold text-stone-500 hover:text-stone-900 bg-stone-100 hover:bg-stone-200 px-3 py-1.5 rounded-xl cursor-pointer transition-all"
            id="cancel-edit-btn"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Retour</span>
          </button>
        )}
        <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
          {editingAd ? "Modifier ton annonce de bolide" : <>Vendre ton bolide de <span className="text-[#b35431]">Road-Trip</span></>}
        </h2>
        <p className="text-sm text-gray-500 max-w-lg mx-auto mt-2">
          {editingAd 
            ? "Mets à jour les informations, équipements ou photos de ton véhicule pour relancer la vente." 
            : "Crée une superbe annonce en 4 étapes simples. Renseigne tes équipements de camping pour maximiser tes chances de vente auprès de la communauté !"}
        </p>
      </div>

      {/* Progress Stepper bar */}
      <div className="flex items-center justify-between mb-8 max-w-xl mx-auto" id="wizard-progress-bar">
        {[
          { label: 'Infos', icon: Truck },
          { label: 'Matériel', icon: CheckCircle2 },
          { label: 'Photos', icon: Image },
          { label: 'Booster', icon: CreditCard }
        ].map((step, idx) => {
          const stepNum = idx + 1;
          const StepIcon = step.icon;
          const isCompleted = currentStep > stepNum;
          const isActive = currentStep === stepNum;
          return (
            <React.Fragment key={idx}>
              <div className="flex flex-col items-center relative z-10">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  isCompleted 
                    ? 'bg-[#1e3427] border-[#1e3427] text-white' 
                    : isActive 
                    ? 'bg-[#b35431] border-[#b35431] text-[#fbf7f3] shadow-md ring-4 ring-orange-100' 
                    : 'bg-white border-[#e3d5c5] text-gray-400'
                }`}>
                  <StepIcon className="h-5 w-5" />
                </div>
                <span className={`text-[11px] font-bold mt-2 font-mono ${isActive ? 'text-[#b35431]' : 'text-gray-400'}`}>
                  {step.label}
                </span>
              </div>
              {idx < 3 && (
                <div className={`flex-1 h-1 mx-2 -mt-4 transition-all rounded-full ${
                  currentStep > stepNum ? 'bg-[#1e3427]' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Step Container Box */}
      <div className="bg-[#fbf7f3] border border-[#e3d5c5] rounded-3xl p-6 md:p-8 shadow-md">
        
        {errorText && (
          <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 rounded-r-xl flex items-start gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-500 flex-shrink-0 mt-0.5" />
            <span className="text-xs text-rose-800 font-medium">{errorText}</span>
          </div>
        )}

        {/* STEP 1: TECHNICAL PROFILE INFO */}
        {currentStep === 1 && (
          <div className="space-y-6" id="form-step-1">
            <div className="border-b border-[#e3d5c5] pb-3">
              <h3 className="text-lg font-bold text-[#1e3427] flex items-center gap-2">
                <Truck className="h-5 w-5 text-[#b35431]" />
                <span>Étape 1 : Caractéristiques techniques & Localisation</span>
              </h3>
              <p className="text-xs text-gray-500">Donne les informations administratives et mécaniques de base.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Brand and Model */}
              <div>
                <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1">Marque *</label>
                <input
                  type="text"
                  placeholder="Ex: Toyota, Mitsubishi, Subaru"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="w-full bg-white border border-[#e3d5c5] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#b35431] focus:outline-none"
                  id="form-brand"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1">Modèle *</label>
                <input
                  type="text"
                  placeholder="Ex: Hiace, Express, LandCruiser Prado"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full bg-white border border-[#e3d5c5] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#b35431] focus:outline-none"
                  id="form-model"
                />
              </div>

              {/* Year, Mileage, Price */}
              <div>
                <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1">Année du modèle</label>
                <select
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  className="w-full bg-white border border-[#e3d5c5] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#b35431] focus:outline-none"
                  id="form-year"
                >
                  {Array.from({ length: 30 }, (_, i) => 2026 - i).map((yr) => (
                    <option key={yr} value={yr}>{yr}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1">Kilométrage (KM) *</label>
                <input
                  type="number"
                  placeholder="Ex: 275000"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  className="w-full bg-white border border-[#e3d5c5] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#b35431] focus:outline-none font-mono"
                  id="form-mileage"
                />
              </div>

              {/* Price and state */}
              <div>
                <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1">Prix de vente souhaité ($ AUD) *</label>
                <input
                  type="number"
                  placeholder="Ex: 7500"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full bg-white border border-[#e3d5c5] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#b35431] focus:outline-none font-mono font-bold text-[#b35431]"
                  id="form-price"
                />
              </div>

              {/* REGO State */}
              <div>
                <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1">État de la REGO (Immatriculation) *</label>
                <select
                  value={regoState}
                  onChange={(e) => setRegoState(e.target.value as RegoState)}
                  className="w-full bg-white border border-[#e3d5c5] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#b35431] focus:outline-none"
                  id="form-rego"
                >
                  <option value="WA">WA (Western Australia - Recommandé)</option>
                  <option value="QLD">QLD (Queensland)</option>
                  <option value="NSW">NSW (New South Wales)</option>
                  <option value="VIC">VIC (Victoria)</option>
                  <option value="SA">SA (South Australia)</option>
                  <option value="NT">NT (Northern Territory)</option>
                  <option value="TAS">TAS (Tasmania)</option>
                </select>
              </div>

              {/* Type selection */}
              <div>
                <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1">Catégorie de véhicule</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['Van', '4x4', 'Station Wagon'] as VehicleType[]).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setVehicleType(cat)}
                      className={`text-xs font-semibold py-2 px-3 rounded-lg border cursor-pointer ${
                        vehicleType === cat
                          ? 'bg-[#1e3427] text-white border-[#1e3427]'
                          : 'bg-white text-gray-700 border-[#e3d5c5] hover:bg-[#f4ebe1]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Equipment state */}
              <div>
                <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1">Finition des équipements</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['Clé en main', 'À aménager'] as EquipmentState[]).map((est) => (
                    <button
                      key={est}
                      type="button"
                      onClick={() => setEquipmentState(est)}
                      className={`text-xs font-semibold py-2 px-3 rounded-lg border cursor-pointer ${
                        equipmentState === est
                          ? 'bg-[#1e3427] text-white border-[#1e3427]'
                          : 'bg-white text-gray-700 border-[#e3d5c5] hover:bg-[#f4ebe1]'
                      }`}
                    >
                      {est === 'Clé en main' ? 'Clé en main 🛌' : 'Vide à aménager 🛠️'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vehicle Condition with Help Tooltips info ('i' at the end) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1 flex items-center gap-1">
                  <span>État mécanique et carrosserie *</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { key: 'Excellent', label: 'Excellent', desc: 'Véhicule prêt à rouler immédiatement sans frais, entretien suivi avec historique complet.' },
                    { key: 'Bon', label: 'Bon état général', desc: 'Mécanique fiable, entretien régulier effectué, légères traces cosmétiques d\'aventure ou d\'usage.' },
                    { key: 'À réviser', label: 'À réviser', desc: 'Le véhicule roule sans problème, mais il faut prévoir une révision prochaine (pneus usés, vidange, etc.).' },
                    { key: 'À réparer', label: 'À réparer', desc: 'Travaux ou réparations majeurs connus requis.' }
                  ] as { key: 'Excellent' | 'Bon' | 'À réviser' | 'À réparer'; label: string; desc: string }[]).map((cond) => {
                    const isSelected = vehicleCondition === cond.key;
                    const showTooltip = activeConditionTooltip === cond.key;
                    return (
                      <div key={cond.key} className="relative flex flex-col">
                        <div className="flex border border-[#e3d5c5] rounded-xl overflow-hidden focus-within:ring-1 focus-within:ring-[#b35431]">
                          <button
                            type="button"
                            onClick={() => setVehicleCondition(cond.key)}
                            className={`flex-1 text-left text-xs font-semibold py-2.5 px-3 transition-colors cursor-pointer ${
                              isSelected
                                ? 'bg-[#1e3427] text-white'
                                : 'bg-white text-gray-800 hover:bg-[#fdf9f4]'
                            }`}
                          >
                            {cond.label}
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveConditionTooltip(activeConditionTooltip === cond.key ? null : cond.key);
                            }}
                            className={`px-3 py-2 border-l border-[#e3d5c5] flex items-center justify-center transition-colors cursor-pointer text-xs font-extrabold font-mono ${
                              showTooltip ? 'bg-orange-100 text-[#b35431]' : 'bg-gray-50 text-stone-500 hover:bg-[#ebdccb]'
                            }`}
                            title="Explications détaillées"
                          >
                            i
                          </button>
                        </div>
                        {showTooltip && (
                          <div className="absolute bottom-11 left-0 z-30 w-64 bg-[#fbf7f3] border border-[#ebdccb] text-[10px] text-gray-600 p-3 rounded-xl shadow-lg leading-relaxed animate-fadeIn">
                            <span className="font-bold text-[#b35431] block mb-0.5">{cond.label} :</span>
                            {cond.desc}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Exact Location Free Input */}
              <div>
                <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1">Localisation exacte (Ville d'Australie) *</label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ex: Byron Bay, QLD ou Fremantle, WA"
                  className="w-full bg-white border border-[#e3d5c5] rounded-xl px-4 py-2 text-sm focus:ring-1 focus:ring-[#b35431] focus:outline-none"
                  id="form-location"
                  required
                />
                <span className="text-[10px] text-gray-400 block mt-1">Permet aux acheteurs de calculer la distance exacte par rapport à leur zone de recherche.</span>
              </div>

              {/* Seller details */}
              <div>
                <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1">Prénom ou pseudonyme du vendeur *</label>
                <input
                  type="text"
                  placeholder="Ex. Emma et Nicolas"
                  value={sellerName}
                  onChange={(e) => setSellerName(e.target.value)}
                  className="w-full bg-white border border-[#e3d5c5] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#b35431] focus:outline-none"
                  id="form-seller"
                />
              </div>
            </div>

            {/* WA/WhatsApp input block */}
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1">Ton numéro de WhatsApp * (Format international)</label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs text-gray-400 font-bold font-mono">+</span>
                <input
                  type="text"
                  placeholder="33612345678"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  className="w-full bg-white border border-[#e3d5c5] rounded-xl pl-8 pr-4 py-2 text-sm focus:ring-2 focus:ring-[#b35431] focus:outline-none font-mono"
                  id="form-whatsapp"
                />
              </div>
              <p className="text-[10px] text-gray-400 mt-1">Saisis l'indicatif sans le signe + (ex: 33 pour la France, 61 pour l'Australie, suivi directement de ton numéro sans le premier zéro).</p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-700 tracking-wide uppercase mb-1">Description et historique complet</label>
              <textarea
                rows={4}
                placeholder="Précisez l'état du moteur, l'historique d'entretien, les éventuels défauts, la configuration du lit ou le fonctionnement des installations électriques..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-[#e3d5c5] rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-[#b35431] focus:outline-none font-sans"
                id="form-description"
              />
            </div>
          </div>
        )}

        {/* STEP 2: AMÉNAGEMENTS ET MATÉRIEL fourni */}
        {currentStep === 2 && (
          <div className="space-y-6" id="form-step-2">
            <div className="border-b border-[#e3d5c5] pb-3">
              <h3 className="text-lg font-bold text-[#1e3427] flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-[#b35431]" />
                <span>Étape 2 : Équipements et matériel de camping fournis</span>
              </h3>
              <p className="text-xs text-gray-500">Sélectionne les objets que tu donnes avec la voiture. Plus tu as d'équipements, plus vite ton véhicule partira !</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" id="equipments-checklists-grid">
              {EQUIPMENTS_OPTIONS.map((eq, idx) => {
                const isChecked = selectedEquipments.includes(eq);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleEquipment(eq)}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all group cursor-pointer ${
                      isChecked
                        ? 'bg-[#eef6f1] border-emerald-500 ring-2 ring-emerald-500/20'
                        : 'bg-white border-[#e3d5c5] hover:border-[#b35431]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded mt-0.5 flex items-center justify-center border transition-all ${
                      isChecked
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'bg-white border-gray-300 group-hover:border-gray-400'
                    }`}>
                      {isChecked && <span className="text-[10px]">✓</span>}
                    </div>
                    <span className="text-xs font-medium text-gray-700 select-none">
                      {eq}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-xs text-emerald-900 block font-semibold mb-1">
                ⚡ Puissance Backpackers : {selectedEquipments.length} équipements sélectionnés !
              </span>
              <p className="text-[11px] text-emerald-700">
                Les acheteurs cherchent principalement des vans dotés d'une <strong>"Second Battery"</strong> pour faire tourner un frigo ou recharger leur téléphone la nuit, et de <strong>"Panneaux Solaires"</strong> !
              </p>
            </div>
          </div>
        )}

        {/* STEP 3: MOCK DRAG & DROP PHOTO UPLOAD */}
        {currentStep === 3 && (
          <div className="space-y-6" id="form-step-3">
            <div className="border-b border-[#e3d5c5] pb-3">
              <h3 className="text-lg font-bold text-[#1e3427] flex items-center gap-2">
                <Image className="h-5 w-5 text-[#b35431]" />
                <span>Étape 3 : Illustrations & Photos de ton road-trip</span>
              </h3>
              <p className="text-xs text-gray-500">Ajoute les plus beaux clichés du véhicule, si possible en pleine nature pour inspirer l'esprit Vanlife !</p>
            </div>

            {/* Drag & Drop emulation field */}
            <div 
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center transition-all cursor-pointer ${
                dragActive
                  ? 'border-[#ff6f3c] bg-[#fdf2e9]'
                  : 'border-[#e3d5c5] bg-white hover:border-[#b35431] hover:bg-slate-50/50'
              }`}
              id="drag-and-drop-zone"
            >
              <div className="bg-[#f4ebe1] p-4 rounded-full mb-3 text-[#b35431]">
                <Upload className="h-8 w-8 animate-bounce" />
              </div>
              <p className="text-sm font-bold text-gray-800">Glisse et dépose ta photo de car ici !</p>
              <p className="text-xs text-gray-400 mt-1">Format PNG, JPG ou JPEG (1280x720 recommandé)</p>
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs text-slate-500">Ou</span>
                <input
                  type="file"
                  id="mock-file-picker"
                  className="hidden"
                  onChange={() => {
                    const randomIdx = Math.floor(Math.random() * PRESET_MOCK_IMAGES.length);
                    setSelectedImage(PRESET_MOCK_IMAGES[randomIdx]);
                    setCustomImageUploaded(true);
                  }}
                />
                <label
                  htmlFor="mock-file-picker"
                  className="bg-[#1e3427] text-white text-xs font-semibold py-1.5 px-3 rounded-lg hover:bg-[#253f30] transition-colors shadow"
                >
                  Sélectionner un fichier
                </label>
              </div>
            </div>

            {/* Visual preview list & Custom preselect selection */}
            <div>
              <span className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">
                {customImageUploaded ? '✅ Photo bien reçue ! Prêt pour la publication.' : '💡 Choix rapide : Sélectionne une superbe illustration par défaut pour l\'annonce'}
              </span>
              
              <div className="grid grid-cols-5 gap-2" id="preset-mock-images-grid">
                {PRESET_MOCK_IMAGES.map((imgUrl, srcIdx) => {
                  const isSelected = selectedImage === imgUrl;
                  return (
                    <button
                      key={srcIdx}
                      type="button"
                      onClick={() => {
                        setSelectedImage(imgUrl);
                        setCustomImageUploaded(false);
                      }}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 transition-transform cursor-pointer hover:scale-105 active:scale-95 ${
                        isSelected ? 'border-[#ff6f3c] scale-102 ring-2 ring-orange-200' : 'border-[#e3d5c5]'
                      }`}
                    >
                      <img
                        src={imgUrl}
                        alt="presetted-camper"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <span className="text-white text-[10px] font-bold uppercase tracking-wider bg-[#b35431] px-1.5 py-0.5 rounded">Actif</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SPONSORED PROMOTION OPTIONS */}
        {currentStep === 4 && (
          <div className="space-y-6" id="form-step-4">
            <div className="border-b border-[#e3d5c5] pb-3">
              <h3 className="text-lg font-bold text-[#1e3427] flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-[#b35431]" />
                <span>Étape 4 : Propulse ton annonce (Options payantes)</span>
              </h3>
              <p className="text-xs text-gray-500">Mets en avant ton bolide pour le vendre deux fois plus rapidement !</p>
            </div>

            <div className="space-y-4" id="booster-selections">
              {/* Option 1: More photos */}
              <button
                type="button"
                onClick={() => setBoosterPhotos(!boosterPhotos)}
                className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  boosterPhotos
                    ? 'bg-[#fdf2e9] border-[#ff6f3c] ring-2 ring-orange-200'
                    : 'bg-white border-[#e3d5c5] hover:border-[#b35431]'
                }`}
              >
                <div className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center border ${
                  boosterPhotos ? 'bg-[#ff6f3c] border-[#ff6f3c] text-white' : 'bg-white border-gray-300'
                }`}>
                  {boosterPhotos && <span className="text-xs">✓</span>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800">Ajouter jusqu'à 10 photos supplémentaires</span>
                    <span className="text-xs font-mono font-bold bg-amber-100 text-[#b35431] py-0.5 px-2 rounded-full">+ 5 AUD</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Les backpackers achètent à distance. Montre les recoins du moteur, les factures de maintenance, et les tiroirs en détail !
                  </p>
                </div>
              </button>

              {/* Option 2: Sticky Premium list */}
              <button
                type="button"
                onClick={() => setBoosterTopList(!boosterTopList)}
                className={`w-full flex items-start gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  boosterTopList
                    ? 'bg-[#fdf2e9] border-[#ff6f3c] ring-2 ring-orange-200'
                    : 'bg-white border-[#e3d5c5] hover:border-[#b35431]'
                }`}
              >
                <div className={`w-5 h-5 rounded-md mt-0.5 flex items-center justify-center border ${
                  boosterTopList ? 'bg-[#ff6f3c] border-[#ff6f3c] text-white' : 'bg-white border-gray-300'
                }`}>
                  {boosterTopList && <span className="text-xs">✓</span>}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-gray-800 flex items-center gap-1.5 text-orange-950">
                      <Sparkles className="h-4 w-4 text-[#ff6f3c]" />
                      Placer l'annonce en tête de liste pendant 7 jours
                    </span>
                    <span className="text-xs font-mono font-bold bg-amber-100 text-[#b35431] py-0.5 px-2 rounded-full">+ 15 AUD</span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Fais remonter ton annonce tout en haut du site et profites d'un tag visible "Sponsorisé" pour maximiser la visibilité.
                  </p>
                </div>
              </button>
            </div>

            {/* Recapitualtive pricing dashboard */}
            <div className="p-5 bg-white border border-[#e3d5c5] rounded-2xl">
              <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-400 mb-3">Récapitulatif de paiement</h4>
              
              <div className="space-y-2 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Publication standard (Annonce Backpacker)</span>
                  <span className="font-mono text-emerald-700 font-bold">GRATUIT</span>
                </div>
                {boosterPhotos && (
                  <div className="flex justify-between">
                    <span>Option : Galerie 10 photos</span>
                    <span className="font-mono text-slate-800 font-bold">5,00 AUD</span>
                  </div>
                )}
                {boosterTopList && (
                  <div className="flex justify-between">
                    <span>Option : En tête de liste (7 jours)</span>
                    <span className="font-mono text-slate-800 font-bold">15,00 AUD</span>
                  </div>
                )}
                
                <div className="h-px bg-slate-200 my-2" />
                
                <div className="flex justify-between text-sm font-bold text-gray-800 pt-1">
                  <span>Prix total de l'annonce :</span>
                  <span className="font-mono text-lg text-[#b35431]">
                    {calculateTotalBoosterCost()}.00 AUD
                  </span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-xl text-[11px] text-indigo-700 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-indigo-500 mt-0.5 flex-shrink-0" />
              <span>Pour le test de l'application, les options payantes sont gratuites et simulées automatiquement ! Ta voiture sera directement affichée sur la page d'accueil.</span>
            </div>
          </div>
        )}

        {/* Form navigation controls footer */}
        <div className="flex items-center justify-between border-t border-[#e3d5c5] pt-6 mt-8">
          {currentStep > 1 ? (
            <button
              onClick={handlePrevStep}
              className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-gray-800 py-2 px-4 transition-colors cursor-pointer"
              id="wizard-prev-btn"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Retour</span>
            </button>
          ) : (
            <div />
          )}

          {currentStep < 4 ? (
            <button
              onClick={handleNextStep}
              className="flex items-center gap-1 bg-[#1e3427] hover:bg-[#253f30] text-white text-xs font-bold py-2.5 px-5 rounded-xl block transition-all shadow cursor-pointer ml-auto"
              id="wizard-next-btn"
            >
              <span>Continuer</span>
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
               onClick={handlePublish}
               disabled={isPublishing}
               className={`flex items-center gap-2 bg-[#ff6f3c] hover:bg-[#c54110] text-[#fbf7f3] text-sm font-bold py-3 px-6 rounded-xl block transition-all shadow-md cursor-pointer ml-auto hover:scale-103 active:scale-97 ${isPublishing ? 'opacity-50 cursor-not-allowed' : ''}`}
               id="wizard-publish-btn"
             >
               {isPublishing ? (
                 <>
                   <span className="animate-spin mr-1">⌛</span>
                   <span>Publication en cours...</span>
                 </>
               ) : (
                 <>
                   <CheckCircle2 className="h-4.5 w-4.5" />
                   <span>Publier mon annonce gratuite</span>
                 </>
               )}
             </button>
           )}
        </div>

      </div>
    </div>
  );
}
