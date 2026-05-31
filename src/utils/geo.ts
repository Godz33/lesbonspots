// Geography details, offline caching index and distance calculator
export interface Coords {
  lat: number;
  lng: number;
}

export const AUSTRALIAN_LOCATIONS: Record<string, Coords> = {
  sydney: { lat: -33.8688, lng: 151.2093 },
  melbourne: { lat: -37.8136, lng: 144.9631 },
  brisbane: { lat: -27.4698, lng: 153.0251 },
  perth: { lat: -31.9505, lng: 115.8605 },
  adelaide: { lat: -34.9285, lng: 138.6007 },
  darwin: { lat: -12.4634, lng: 130.8456 },
  hobart: { lat: -42.8821, lng: 147.3272 },
  canberra: { lat: -35.2809, lng: 149.1300 },
  cairns: { lat: -16.9186, lng: 145.7781 },
  byron: { lat: -28.6474, lng: 153.6121 },
  byronbay: { lat: -28.6474, lng: 153.6121 },
  alice: { lat: -23.6980, lng: 133.8807 },
  alicesprings: { lat: -23.6980, lng: 133.8807 },
  broome: { lat: -17.9614, lng: 122.2359 },
  goldcoast: { lat: -28.0167, lng: 153.4000 },
  townsville: { lat: -19.2590, lng: 146.8169 },
  portmacquarie: { lat: -31.4333, lng: 152.9167 },
  bundaberg: { lat: -24.8500, lng: 152.3500 },
  fremantle: { lat: -32.0569, lng: 115.7431 },
  albany: { lat: -35.0269, lng: 117.8837 },
  esperance: { lat: -33.8614, lng: 121.8914 },
  geelong: { lat: -38.1499, lng: 144.3617 },
  ballarat: { lat: -37.5622, lng: 143.8503 },
  mildura: { lat: -34.2080, lng: 142.1241 },
  cooberpedy: { lat: -29.0135, lng: 134.7544 },
  noosa: { lat: -26.3986, lng: 153.0898 },
};

export function getHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

// Robust resolver
export async function resolveCoordinatesOf(locationName: string): Promise<Coords> {
  const clean = locationName.toLowerCase().trim().replace(/[\s,\-_]+/g, '');
  
  if (!clean) return { lat: -33.8688, lng: 151.2093 }; // Fallback Sydney

  // 1. Check exact/partial local dictionary
  for (const [key, coords] of Object.entries(AUSTRALIAN_LOCATIONS)) {
    if (clean.includes(key)) {
      return coords;
    }
  }

  // 2. Scan state tags fallbacks at administrative key cities
  if (clean.includes('wa') || clean.includes('western')) return AUSTRALIAN_LOCATIONS.perth;
  if (clean.includes('nsw') || clean.includes('southwales')) return AUSTRALIAN_LOCATIONS.sydney;
  if (clean.includes('vic') || clean.includes('victoria')) return AUSTRALIAN_LOCATIONS.melbourne;
  if (clean.includes('qld') || clean.includes('queensland')) return AUSTRALIAN_LOCATIONS.cairns;
  if (clean.includes('sa') || clean.includes('southaustralia')) return AUSTRALIAN_LOCATIONS.adelaide;
  if (clean.includes('nt') || clean.includes('territory') || clean.includes('alice')) return AUSTRALIAN_LOCATIONS.darwin;
  if (clean.includes('tas') || clean.includes('tasmania') || clean.includes('hobart')) return AUSTRALIAN_LOCATIONS.hobart;

  // 3. Progressive online Nominatim enhancement
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(locationName + ', Australia')}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data[0]) {
        return {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        };
      }
    }
  } catch (err) {
    console.warn('Network geocoder issues, using fallback coordinates structure', err);
  }

  // default Australia center
  return { lat: -25.2744, lng: 133.7751 };
}
