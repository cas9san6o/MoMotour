export const getRouteGeometry = async (tappe) => {
  if (!tappe || tappe.length < 2) return [];

  const validTappe = tappe.filter(t => t.lat !== undefined && t.lng !== undefined);
  if (validTappe.length < 2) return [];

  const coordinates = validTappe.map(t => `${t.lng},${t.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      // GeoJSON returns [lng, lat], react-leaflet expects [lat, lng]
      return data.routes[0].geometry.coordinates.map(coord => [coord[1], coord[0]]);
    }
    return [];
  } catch (error) {
    console.error('Error fetching OSRM route:', error);
    return [];
  }
};

export const calcolaDistanzaDettagliataOSRM = async (tappe) => {
  if (!tappe || tappe.length < 2) return { totale: 0, legs: [] };

  const validTappe = tappe.filter(t => t.lat !== undefined && t.lng !== undefined);
  if (validTappe.length < 2) return { totale: 0, legs: [] };

  const coordinates = validTappe.map(t => `${t.lng},${t.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      const legs = route.legs.map(leg => leg.distance / 1000);
      return { totale: route.distance / 1000, legs };
    }
    return { totale: 0, legs: [] };
  } catch (error) {
    console.error('Error fetching OSRM detailed directions:', error);
    return { totale: 0, legs: [] };
  }
};
export const calcolaDistanzaOSRM = async (tappe) => {
  if (!tappe || tappe.length < 2) return 0;

  const validTappe = tappe.filter(t => t.lat !== undefined && t.lng !== undefined);
  if (validTappe.length < 2) return 0;

  const coordinates = validTappe.map(t => `${t.lng},${t.lat}`).join(';');
  const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=false`;

  try {
    const response = await fetch(url);
    const data = await response.json();
    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      // OSRM returns distance in meters
      return data.routes[0].distance / 1000;
    }
    return 0;
  } catch (error) {
    console.error('Error fetching OSRM directions:', error);
    return 0;
  }
};

export const calcolaCostoBenzina = (distanzaKm, consumoMedio100km = 7, prezzoLitro = 2.0) => {
  return (distanzaKm / 100) * consumoMedio100km * prezzoLitro;
};
