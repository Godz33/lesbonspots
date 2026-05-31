export type VehicleType = 'Van' | '4x4' | 'Station Wagon';
export type EquipmentState = 'Clé en main' | 'À aménager';
export type RegoState = 'WA' | 'QLD' | 'NSW' | 'VIC' | 'SA' | 'NT' | 'TAS';

export interface Ad {
  id: string;
  userId?: string;
  title: string;
  description: string;
  type: VehicleType;
  equipmentState: EquipmentState;
  regoState: RegoState;
  price: number; // In AUD
  mileage: number; // In KM
  year: number;
  brand: string;
  model: string;
  location: string;
  equipments: string[];
  isPremium: boolean;
  image: string;
  sellerName: string;
  whatsappNumber: string;
  createdAt: string;
  vehicleCondition?: 'Excellent' | 'Bon' | 'À réviser' | 'À réparer';
  latitude?: number;
  longitude?: number;
}

export interface QuizAnswers {
  budget: 'low' | 'medium' | 'high'; // <5k ASD, 5k-10k AUD, >10k AUD
  style: 'wild' | 'highway'; // Wild beaches & outback tracks vs coastal asphalt
  travelers: 'solo' | 'couple' | 'trio'; // Solo, Couple / Duo, Group 3+
  skills: 'ready' | 'diy'; // Already equipped vs Empty to build
}

export interface FilterState {
  searchQuery: string;
  type: VehicleType | 'All';
  equipmentState: EquipmentState | 'All';
  regoState: RegoState | 'All';
  priceMax: number;
  priceMin?: number;
  vehicleCondition?: 'Excellent' | 'Bon' | 'À réviser' | 'À réparer' | 'All';
  buyerLocation?: string;
  buyerDistanceMax?: number; // In KM
}
