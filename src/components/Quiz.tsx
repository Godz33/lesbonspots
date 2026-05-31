import React, { useState } from 'react';
import { HelpCircle, ChevronRight, CheckCircle2, RefreshCw, Compass, Shield, ArrowRight, Sparkles, Map, Hammer } from 'lucide-react';
import { VehicleType, EquipmentState } from '../types';

interface QuizProps {
  onQuizComplete: (recommendedType: VehicleType, recommendedEquipment: EquipmentState) => void;
}

interface Question {
  id: number;
  text: string;
  field: 'budget' | 'style' | 'travelers' | 'skills';
  options: {
    label: string;
    sub: string;
    value: string;
  }[];
}

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "Quel est ton budget total d'achat de véhicule ?",
    field: 'budget',
    options: [
      { label: 'Moins de 5 000 AUD', sub: 'Budget serré, idéal pour les économes ou courts séjours', value: 'low' },
      { label: '5 000 à 10 000 AUD', sub: 'Budget classique de backpacker, excellent compromis fiabilité', value: 'medium' },
      { label: 'Plus de 10 000 AUD', sub: 'Confort maximal, idéal pour les grands parcours off-grid', value: 'high' }
    ]
  },
  {
    id: 2,
    text: "Quel est ton style d'aventure de prédilection ?",
    field: 'style',
    options: [
      { label: "Pistes de l'Outback, parcs nationaux 4x4 & plages sauvages", sub: "Je veux sortir des sentiers battus, voir l'Australie sauvage !", value: 'wild' },
      { label: 'Asphalte tranquille et superbes routes côtières', sub: 'Mélange de plages faciles, villes de surf et routes goudronnées', value: 'highway' }
    ]
  },
  {
    id: 3,
    text: "Avec qui voyages-tu en Australie ?",
    field: 'travelers',
    options: [
      { label: 'Solo', sub: 'À la recherche de liberté absolue et de rencontres', value: 'solo' },
      { label: 'En couple ou à deux', sub: 'Partager l\'espace et diviser les frais de carburant', value: 'couple' },
      { label: 'En groupe de 3 personnes ou plus', sub: 'Plus on est de fous, moins on dépense !', value: 'trio' }
    ]
  },
  {
    id: 4,
    text: "Quel est ton niveau ou ton envie de bricolage (Aménagement) ?",
    field: 'skills',
    options: [
      { label: 'Clé en main et prêt à partir !', sub: 'Je ne veux rien bricoler, juste poser mes bagages et rouler', value: 'ready' },
      { label: 'À aménager / Vide pour le faire moi-même', sub: 'Idéal pour concevoir mon propre lit en bois et économiser', value: 'diy' }
    ]
  }
];

export default function Quiz({ onQuizComplete }: QuizProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState({
    budget: '',
    style: '',
    travelers: '',
    skills: ''
  });
  const [showResult, setShowResult] = useState(false);

  // Results calculation
  const getRecommendation = () => {
    const { budget, style, travelers, skills } = answers;
    
    // Default/Fallback values
    let recommendedType: VehicleType = 'Van';
    let recommendedEquipment: EquipmentState = skills === 'diy' ? 'À aménager' : 'Clé en main';
    let title = '';
    let description = '';
    let pros: string[] = [];
    let image = 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?auto=format&fit=crop&q=80&w=800';
    let models: { name: string; rating: string; engine: string; comment: string }[] = [];

    // Calculation Matrix logic
    if (style === 'wild' && (budget === 'high' || budget === 'medium')) {
      recommendedType = '4x4';
      title = "🛣️ L'Aventurier de l'Outback !";
      description = "Tu as soif d'exploration et de liberté. Les parcs nationaux les plus reculés, le sable blanc de Fraser Island ou la légendaire Gibb River Road n'attendent que toi. Les vans restent coincés sur l'asphalte, mais toi, avec ton 4x4, tu passeras partout et tu dormiras sous les étoiles australiennes !";
      pros = [
        "Capacité tout-terrain (4WD) pour franchir le sable et les rivières",
        "Tente de toit intégrée hyper rapide à déplier",
        "Valeur de revente fantastique auprès des locaux et des voyageurs",
        "Accès aux meilleurs spots de camping gratuits interdits aux 2 roues motrices"
      ];
      image = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&q=80&w=800';
      models = [
        { name: "Toyota LandCruiser Prado", rating: "★★★★★ (L'indestructible)", engine: "3.0L Turbo Diesel", comment: "Le roi d'Australie. Les pièces se trouvent dans n'importe quel garage de campagne." },
        { name: "Nissan Patrol", rating: "★★★★☆ (Le baroudeur lourd)", engine: "3.0L / 4.2L Diesel", comment: "Châssis et ponts rigides ultra solides, parfait pour grimper sur toutes les dunes de sable." },
        { name: "Mitsubishi Pajero", rating: "★★★★☆ (Le rapport qualité-prix optimal)", engine: "3.2L Di-D ou V6 Essence", comment: "Très confortable sur l'asphalte et doté d'une excellente motricité sur les pistes de sable." }
      ];
    } 
    else if (budget === 'low') {
      recommendedType = 'Station Wagon';
      title = "💰 L'Économe Astucieux / Minimaliste de la Route !";
      description = "Tu gères intelligemment ton budget. Un Station Wagon (comme un Subaru Outback ou un Ford Falcon) est le meilleur allié des backpackers rationnels. Tu réduis de moitié ta consommation d'essence et tu passes inaperçu pour faire du camping sauvage discret (Stealth camping) sans risquer d'amende !";
      pros = [
        "Consommation minime d'essence (environ 8L/100km)",
        "Prix d'achat imbattable (Moins de 5 000 AUD)",
        "Idéal pour faire les trajets quotidiens boulot-ferme pour tes 88 jours",
        "Conduite souple et facile comme une voiture de tous les jours"
      ];
      image = 'https://images.unsplash.com/photo-1506015391300-4802dc74de2e?auto=format&fit=crop&q=80&w=800';
      models = [
        { name: "Subaru Outback AWD", rating: "★★★★★ (Le passe-partout)", engine: "2.5L Essence Boxer", comment: "Une tenue de route légendaire sur chemins de gravier, de forêt ou de boue." },
        { name: "Ford Falcon Wagon", rating: "★★★★★ (L'increvable)", engine: "4.0L Barra 6 Cylindres", comment: "Le moteur mythique d'Australie. Capable de faire 480 000 km sans broncher." },
        { name: "Holden Commodore Wagon", rating: "★★★★☆ (La longueur royale)", engine: "3.6L V6 Alloytec", comment: "Vaste longueur de coffre idéale pour installer un matelas double et dormir à plat." }
      ];
    } 
    else {
      recommendedType = 'Van';
      title = "🚐 Le Roi de la Vanlife & du Confort !";
      description = "Pour toi, le voyage rime avec confort et ambiance cocooning. Tu veux pouvoir cuisiner à l'intérieur s'il pleut, te tenir debout (si hightop), et avoir un lit douillet à l'abri des moustiques et du vent. C'est l'option ultime pour faire de longues boucles côtières en se croyant à la maison !";
      pros = [
        "Espace de vie intérieur imbattable (cuisine, rangements, table)",
        "Parfait pour voyager à deux ou en couple confortablement",
        "Idéal pour installer un gros système de batterie auxiliaire et un vrai frigo",
        "Protection maximale contre les intempéries et le soleil de plomb"
      ];
      image = 'https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?auto=format&fit=crop&q=80&w=800';
      models = [
        { name: "Toyota Hiace", rating: "★★★★★ (Le roi de la Vanlife)", engine: "2.7L Essence ou 3.0L Diesel", comment: "S'achète les yeux fermés. Très facile à réparer, il garde une valeur de revente incroyable." },
        { name: "Mitsubishi Express", rating: "★★★★☆ (Le choix pragmatique)", engine: "2.0L / 2.4L Essence", comment: "Idéal pour petit budget. Simple mécanique robuste et pièces très bon marché." },
        { name: "Ford Transit LWB", rating: "★★★★☆ (Le grand volume)", engine: "2.2L / 2.4L TDCi", comment: "Hauteur de plafond confortable et grand espace pour imaginer des tiroirs et placards." }
      ];
    }

    return { recommendedType, recommendedEquipment, title, description, pros, image, models };
  };

  const handleSelectOption = (field: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [field]: value }));
    
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  const handleReset = () => {
    setAnswers({ budget: '', style: '', travelers: '', skills: '' });
    setCurrentStep(0);
    setShowResult(false);
  };

  const activeQuestion = QUESTIONS[currentStep];
  const progressPercent = showResult ? 100 : Math.round((currentStep / QUESTIONS.length) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8" id="quiz-section">
      {/* Intro section */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-extrabold text-[#1e3427] tracking-tight">
          Trouve ton véhicule idéal pour <span className="text-[#b35431]">l'Australie</span> 🇦🇺
        </h2>
        <p className="text-xs text-gray-500 max-w-md mx-auto mt-2">
          Réponds à 4 questions pour savoir si tu es fait pour la vie de nomade en van, les pistes 4x4 sauvages de l'Outback ou un Station Wagon économique !
        </p>
      </div>

      {/* Interactive dashboard container card */}
      <div className="bg-[#fbf7f3] border border-[#e3d5c5] rounded-3xl overflow-hidden shadow-md">
        
        {/* Progress header bar */}
        <div className="bg-[#1e3427]/5 border-b border-[#e3d5c5] p-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-[#b35431]" />
            <span className="text-xs font-bold font-mono uppercase text-[#2c4737] tracking-wider">
              {showResult ? 'Résultat Final' : `Question ${currentStep + 1} sur ${QUESTIONS.length}`}
            </span>
          </div>
          <div className="w-1/3 bg-gray-200 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-[#b35431] h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {!showResult ? (
          /* QUESTION SELECTION SCREEN */
          <div className="p-6 md:p-8 space-y-6" id="quiz-question-container">
            <h3 className="text-lg md:text-xl font-bold text-[#1e3427] font-sans">
              {activeQuestion.text}
            </h3>

            <div className="space-y-3">
              {activeQuestion.options.map((opt, idx) => {
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(activeQuestion.field, opt.value)}
                    className="w-full text-left p-4 rounded-2xl bg-white border border-[#e3d5c5] hover:border-[#ff6f3c] hover:bg-[#fdf2e9] hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <span className="text-sm font-bold text-gray-800 block group-hover:text-[#b35431]">
                        {opt.label}
                      </span>
                      <span className="text-xs text-gray-500 mt-1 block font-sans">
                        {opt.sub}
                      </span>
                    </div>

                    <div className="bg-[#f4ebe1] p-2 rounded-full text-[#b35431] group-hover:bg-[#ff6f3c] group-hover:text-white transition-colors">
                      <ChevronRight className="h-4 w-4" />
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Back button option */}
            {currentStep > 0 && (
              <button
                onClick={() => setCurrentStep((prev) => prev - 1)}
                className="text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors flex items-center gap-1 mt-4"
              >
                <span>← Retour à la question précédente</span>
              </button>
            )}
          </div>
        ) : (
          /* RESULT RECOMMENDER SCREEN */
          (() => {
            const rec = getRecommendation();
            return (
              <div className="p-6 md:p-8 space-y-6" id="quiz-results">
                
                {/* Visual Recommendation Banner */}
                <div className="flex flex-col md:flex-row gap-6 items-center">
                  <div className="w-full md:w-1/2 aspect-video rounded-2xl overflow-hidden shadow-inner border border-[#e3d5c5]">
                    <img 
                      src={rec.image} 
                      alt={rec.recommendedType} 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="w-full md:w-1/2 space-y-2">
                    <span className="text-[10px] font-bold font-mono uppercase tracking-widest text-[#b35431] bg-orange-100 py-1 px-2.5 rounded-full w-fit block">
                      Profil de voyage calculé ⭐
                    </span>
                    <h3 className="text-xl md:text-2xl font-extrabold text-[#1e3427]">
                      {rec.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      Sur la base de ton budget, de ton envie de hors-piste et de tes compétences.
                    </p>
                  </div>
                </div>

                {/* Recommendation Description */}
                <div className="p-4 bg-white rounded-2xl border border-[#e3d5c5] text-xs leading-relaxed text-gray-600 font-sans">
                  {rec.description}
                </div>

                {/* Key Pros listed */}
                <div className="space-y-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-gray-700 font-mono">Pourquoi ce choix est le meilleur :</span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {rec.pros.map((pro, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-gray-700 bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{pro}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3 Most Performant & Recommended Models */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-[#b35431]" />
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-700 font-mono">
                      Top 3 des modèles les plus performants et recommandés :
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {rec.models?.map((m, idx) => (
                      <div key={idx} className="bg-white p-3.5 rounded-2xl border border-[#e3d5c5] shadow-xs hover:border-[#b35431] transition-all flex flex-col justify-between">
                        <div>
                          <h4 className="text-xs font-extrabold text-[#1e3427] font-sans">{m.name}</h4>
                          <span className="text-[10px] text-amber-600 font-bold block mt-0.5">{m.rating}</span>
                          <span className="text-[9px] text-[#b35431] font-mono bg-[#fdf2e9] px-1.5 py-0.5 rounded block w-fit mt-1.5 font-bold">
                            🔍 {m.engine}
                          </span>
                          <p className="text-[10px] text-gray-500 mt-2 leading-relaxed font-sans">
                            {m.comment}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Action button: Apply recommendation to filters! */}
                <div className="border-t border-[#e3d5c5] pt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleReset}
                    className="w-full sm:w-auto flex items-center justify-center gap-1 bg-white border border-[#e3d5c5] text-[#1e3427] hover:bg-slate-50 font-bold py-3 px-5 rounded-xl text-xs transition-transform cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" />
                    <span>Recommencer le quiz</span>
                  </button>

                  <button
                    onClick={() => onQuizComplete(rec.recommendedType, rec.recommendedEquipment)}
                    className="w-full sm:w-1/2 flex-1 flex items-center justify-center gap-2 bg-[#ff6f3c] hover:bg-[#c54110] text-white font-extrabold py-3.5 px-6 rounded-xl text-xs sm:text-sm tracking-wide shadow-md active:scale-97 cursor-pointer hover:scale-102 transition-all ml-auto"
                    id="trigger-ads-matching-btn"
                  >
                    <Compass className="h-4 w-4" />
                    <span>Voir les annonces de {rec.recommendedType} correspondantes !</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>

              </div>
            );
          })()
        )}

      </div>
    </div>
  );
}
