const TOLL_RATES_PER_100KM = {
  "IT": 1.20, // Italia
  "FR": 1.10, // Francia
  "ES": 0.90, // Spagna
  "DE": 0.00, // Germania
  "AT": 0.85, // Austria
  "CH": 0.50, // Svizzera (vignetta flat, ma simulato qui) // or maybe handle vignette? Prompt says: CH: 0.50
  "PT": 0.85, // Portogallo
  "HR": 0.60, // Croazia
  "SI": 0.50, // Slovenia
  "HU": 0.40, // Ungheria
};

const countryCache = {};

export const getCountryFromCoords = async (lat, lng) => {
  const cacheKey = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  if (countryCache[cacheKey]) return countryCache[cacheKey];

  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=3`;
    const response = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    const data = await response.json();
    if (data.address && data.address.country_code) {
      const cc = data.address.country_code.toUpperCase();
      countryCache[cacheKey] = cc;
      return cc;
    }
    return null;
  } catch (err) {
    console.error('Error fetching country from Nominatim:', err);
    return null;
  }
};

export const stimaPedaggi = async (tappe, distanzaTotaleKm) => {
  if (!tappe || tappe.length < 1 || !distanzaTotaleKm) return { total: 0, breakdown: {} };

  const validTappe = tappe.filter(t => t.lat !== undefined && t.lng !== undefined);
  if (validTappe.length === 0) return { total: 0, breakdown: {} };
  
  const countries = new Set();
  for (const t of validTappe) {
    const cc = await getCountryFromCoords(t.lat, t.lng);
    if (cc) countries.add(cc);
  }

  const countriesArr = Array.from(countries);
  if (countriesArr.length === 0) return { total: 0, breakdown: {} };

  // A very simplified estimation: we divide the distance evenly among the countries visited,
  // or we just use an average of their rates.
  const distancePerCountry = distanzaTotaleKm / countriesArr.length;
  let total = 0;
  const breakdown = {};

  countriesArr.forEach(cc => {
    const rate = TOLL_RATES_PER_100KM[cc] !== undefined ? TOLL_RATES_PER_100KM[cc] : 0.5; // default 0.5
    const cost = (distancePerCountry / 100) * rate;
    total += cost;
    breakdown[cc] = cost;
  });

  return { total, breakdown };
};
