import { getRouteGeometry } from './fuelCalc';

const TOLL_RATES_PER_100KM = {
  "IT": 1.20, // Italia
  "FR": 1.10, // Francia
  "ES": 0.90, // Spagna
  "DE": 0.00, // Germania
  "AT": 0.85, // Austria
  "CH": 0.50, // Svizzera (vignetta flat, ma simulato qui per km)
  "PT": 0.85, // Portogallo
  "HR": 0.60, // Croazia
  "SI": 0.50, // Slovenia
  "HU": 0.40, // Ungheria
};

const BBOX = [
  { cc: 'IT', bounds: [[35.5, 6.6], [47.1, 18.5]] },
  { cc: 'CH', bounds: [[45.8, 5.9], [47.8, 10.5]] },
  { cc: 'AT', bounds: [[46.3, 9.5], [49.0, 17.1]] },
  { cc: 'FR', bounds: [[41.3, -5.1], [51.1, 9.5]] },
  { cc: 'DE', bounds: [[47.2, 5.8], [55.0, 15.0]] },
  { cc: 'ES', bounds: [[36.0, -9.3], [43.8, 3.3]] }
]; // simplified fallback boxes if nominatim limit hit

const countryCache = {};

export const getCountryFromCoords = async (lat, lng) => {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  if (countryCache[cacheKey]) return countryCache[cacheKey];

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=3`;
    const response = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if(response.ok) {
       const data = await response.json();
       if (data.address && data.address.country_code) {
         const cc = data.address.country_code.toUpperCase();
         countryCache[cacheKey] = cc;
         return cc;
       }
    }
  } catch (err) {
    // console.error('Error fetching country from Nominatim:', err);
  }
  
  // fallback bbox
  for(let box of BBOX) {
     if(lat >= box.bounds[0][0] && lat <= box.bounds[1][0] && lng >= box.bounds[0][1] && lng <= box.bounds[1][1]){
         countryCache[cacheKey] = box.cc;
         return box.cc;
     }
  }
  return null;
};

// Calcola la distanza tra due coordinate
const getDist = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // km
  const dLat = (lat2-lat1) * Math.PI / 180;
  const dLon = (lon2-lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

export const stimaPedaggi = async (tappe, distanzaTotaleKm) => {
  if (!tappe || tappe.length < 2 || !distanzaTotaleKm) return { total: 0, breakdown: {} };

  const validTappe = tappe.filter(t => t.lat !== undefined && t.lng !== undefined);
  if (validTappe.length < 2) return { total: 0, breakdown: {} };
  
  let routeGeometry = [];
  try {
     routeGeometry = await getRouteGeometry(validTappe);
  } catch (e) {
     console.error(e);
  }

  const breakdown = {};
  
  if (routeGeometry.length > 5) {
     // Analizza geometria: saltiamo di punto in punto per stimare i km percorsi in ogni paese 
     // (campioniamo 1 punto ogni N per non sovraccaricare nominatim, iterando su step di circa 20km)
     let accumDistance = 0;
     let lastCoord = routeGeometry[0];
     let segmentDist = 0;
     
     for (let i = 1; i < routeGeometry.length; i++) {
        const coord = routeGeometry[i];
        const dist = getDist(lastCoord[0], lastCoord[1], coord[0], coord[1]);
        segmentDist += dist;
        
        // Ogni 30km facciamo check del paese o se è l'ultimo punto
        if (segmentDist > 30 || i === routeGeometry.length - 1) {
            const cc = await getCountryFromCoords(coord[0], coord[1]);
            if (cc) {
                breakdown[cc] = (breakdown[cc] || 0) + segmentDist;
            } else {
                breakdown['UNKNOWN'] = (breakdown['UNKNOWN'] || 0) + segmentDist;
            }
            segmentDist = 0;
        }
        lastCoord = coord;
     }
  } else {
    // fallback se non abbiamo geometria
      const countries = new Set();
      for (const t of validTappe) {
        const cc = await getCountryFromCoords(t.lat, t.lng);
        if (cc) countries.add(cc);
      }
      const countriesArr = Array.from(countries);
      if (countriesArr.length === 0) return { total: 0, breakdown: {} };
      
      const distancePerCountry = distanzaTotaleKm / countriesArr.length;
      countriesArr.forEach(cc => { breakdown[cc] = distancePerCountry; });
  }

  let total = 0;
  const costBreakdown = {};

  Object.entries(breakdown).forEach(([cc, dist]) => {
    if(cc === 'UNKNOWN') return;
    const rate = TOLL_RATES_PER_100KM[cc] !== undefined ? TOLL_RATES_PER_100KM[cc] : 0.5;
    const cost = (dist / 100) * rate;
    total += cost;
    costBreakdown[cc] = cost;
  });

  return { total, breakdown: costBreakdown };
};
