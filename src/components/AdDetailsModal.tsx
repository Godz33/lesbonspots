import React, { useState } from 'react';
import { X, Calendar, Compass, ShieldCheck, MapPin, CheckCircle2, Phone, Sparkles, MessageSquare } from 'lucide-react';
import { AUSTRALIAN_STATES_DESC } from '../data';
import { Ad } from '../types';

interface AdDetailsModalProps {
  ad: Ad | null;
  onClose: () => void;
}

export default function AdDetailsModal({ ad, onClose }: AdDetailsModalProps) {
  const [showCopiedText, setShowCopiedText] = useState(false);

  if (!ad) return null;

  const stateDetails = AUSTRALIAN_STATES_DESC[ad.regoState] || {
    fullName: ad.regoState,
    color: 'bg-gray-600',
    badge: 'border-gray-200 text-gray-800 bg-gray-50',
    requirements: 'Pas de règles spécifiques renseignées.',
    cost: 'Inconnu'
  };

  const formattedPrice = new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0
  }).format(ad.price);

  const formattedMileage = new Intl.NumberFormat('en-AU').format(ad.mileage);

  // Generate real WhatsApp click link with premade introductory message
  const whatsappMsg = encodeURIComponent(
    `Hello ${ad.sellerName}, I saw your ad on Le Bon Spot for the ${ad.brand} ${ad.model} (${ad.price} AUD) in ${ad.location}. Is it still available?`
  );
  const whatsappLink = `https://wa.me/${ad.whatsappNumber.replace(/\+/g, '')}?text=${whatsappMsg}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" id="ad-details-modal">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div className="relative transform overflow-hidden rounded-2xl bg-[#fbf7f3] text-left shadow-2xl transition-all sm:my-8 w-full max-w-3xl border border-[#e3d5c5] flex flex-col md:flex-row max-h-[90vh] md:max-h-none overflow-y-auto">
          
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors focus:outline-none focus:ring-2 focus:ring-[#ff6f3c] cursor-pointer"
            aria-label="Fermer"
            id="modal-close-btn"
          >
            <X className="h-5 w-5" />
          </button>

          {/* Left Column: Huge visual gallery */}
          <div className="w-full md:w-1/2 relative bg-[#14231b] min-h-[250px] md:min-h-full">
            <img
              src={ad.image}
              alt={ad.title}
              className="w-full h-full object-cover select-none"
              referrerPolicy="no-referrer"
            />
            {ad.isPremium && (
              <span className="absolute top-4 left-4 inline-flex items-center gap-1 bg-[#ff6f3c] text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-lg">
                <Sparkles className="h-3.5 w-3.5" />
                <span>SPONSORISÉ</span>
              </span>
            )}
            
            {/* Quick stats on top of picture */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 to-transparent p-6 text-[#fbf7f3] flex flex-col gap-1">
              <span className="font-mono text-xs uppercase tracking-widest text-[#a0bfaa]">{ad.brand} {ad.model}</span>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight">{ad.title}</h2>
            </div>
          </div>

          {/* Right Column: Detailed listings contents */}
          <div className="w-full md:w-1/2 p-6 overflow-y-auto flex flex-col justify-between max-h-[60vh] md:max-h-[80vh]">
            <div>
              {/* Price Tag and Basic Attributes */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-3xl font-semibold tracking-tight text-[#b35431] font-display">
                  {formattedPrice} <span className="text-xs text-gray-400 font-normal ml-0.5">AUD</span>
                </span>
                
                {/* State Tag */}
                <span className={`text-xs font-bold font-mono py-1 px-3 rounded-md border ${stateDetails.badge}`}>
                  Rego {ad.regoState}
                </span>
              </div>

              {/* Location Badge */}
              <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-4 bg-[#f4ebe1] py-1 px-2.5 rounded-full w-fit">
                <MapPin className="h-3.5 w-3.5 text-[#b35431]" />
                <span className="font-semibold text-gray-700">{ad.location}, Australie</span>
              </div>

              {/* Grid of Attributes */}
              <div className="grid grid-cols-3 gap-2 py-3 px-4 bg-white rounded-xl border border-[#e3d5c5] mb-4 text-center">
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Kilomètres</span>
                  <span className="text-sm font-bold text-gray-800 font-sans">{formattedMileage} km</span>
                </div>
                <div className="flex flex-col border-x border-[#e3d5c5]">
                  <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Année</span>
                  <span className="text-sm font-bold text-gray-800 font-sans">{ad.year}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider">Finition</span>
                  <span className="text-xs font-bold text-[#2c4737]">{ad.equipmentState}</span>
                </div>
              </div>

              {/* Custom Rego warning highlight */}
              <div className="p-3 bg-[#eef6f1] rounded-xl border border-emerald-100 mb-4 text-xs">
                <div className="flex items-center gap-1.5 font-bold text-[#1e3427] mb-1">
                  <Compass className="h-4 w-4 text-emerald-600" />
                  <span>Réglementation de l'immatriculation (REGO - {ad.regoState}) :</span>
                </div>
                <p className="text-[#2c4737] leading-relaxed">{stateDetails.requirements}</p>
              </div>

              {/* Description body */}
              <div className="mb-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-2 font-mono">L'histoire du véhicule</h4>
                <p className="text-xs text-gray-600 leading-relaxed font-sans whitespace-pre-line bg-white/50 p-3 rounded-lg border border-[#e3d5c5]">
                  {ad.description}
                </p>
              </div>

              {/* Equipment Items Checklist */}
              <div className="mb-6">
                <h4 className="text-sm font-bold uppercase tracking-wider text-gray-700 mb-2 font-mono">Équipements inclus</h4>
                <div className="grid grid-cols-2 gap-1.5">
                  {ad.equipments.map((eq, idx) => (
                    <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-700 bg-white p-1.5 rounded border border-[#e3d5c5]">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 flex-shrink-0" />
                      <span className="truncate">{eq}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Buyer Road safety list */}
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs mb-6">
                <div className="flex items-center gap-1.5 font-bold text-amber-800 mb-1.5">
                  <ShieldCheck className="h-4 w-4 text-[#b35431]" />
                  <span>Vérifications de sécurité indispensables avant l'achat :</span>
                </div>
                <ul className="list-disc list-inside space-y-1 text-amber-900 leading-relaxed">
                  <li>Demandez si la <strong>courroie de distribution</strong> a été changée récemment.</li>
                  <li>Testez les 5 vitesses et la marche arrière (ainsi que la boîte de transfert <strong>4WD Low</strong> si c'est un 4x4).</li>
                  <li>Vérifiez l'absence de rouille sous le châssis, surtout si le véhicule a roulé sur le littoral ou dans l'Outback.</li>
                  <li>Vérifiez si le transfert d'immatriculation (REGO) peut se faire entièrement en ligne.</li>
                </ul>
              </div>
            </div>

            {/* Quick Action Button Box */}
            <div className="border-t border-[#e3d5c5] pt-4 flex flex-col gap-2 bg-[#fbf7f3]">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>Vendeur : <strong className="text-gray-800">{ad.sellerName}</strong></span>
                <span>En ligne le : {ad.createdAt}</span>
              </div>
              <a
                href={whatsappLink}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  setShowCopiedText(true);
                  setTimeout(() => setShowCopiedText(false), 4000);
                }}
                className="w-full flex items-center justify-center gap-2 bg-[#25d366] hover:bg-[#20ba5a] text-white py-3 px-4 rounded-xl font-bold font-sans transition-all text-sm tracking-wide shadow-md active:scale-98 cursor-pointer text-center"
                id="contact-whatsapp-btn"
              >
                <MessageSquare className="h-4.5 w-4.5" />
                <span>Contacter le vendeur sur WhatsApp</span>
              </a>
              {showCopiedText && (
                <span className="text-[11px] text-[#2c4737] text-center font-semibold bg-emerald-50 py-1 px-2 border border-emerald-200 rounded animate-fade-in block">
                  Message pré-écrit prêt ! Vous allez être redirigé vers WhatsApp pour échanger avec {ad.sellerName}.
                </span>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
