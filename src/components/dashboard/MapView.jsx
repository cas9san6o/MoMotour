import React, { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';
import { getRouteGeometry } from '../../utils/fuelCalc';

// Fix per le icone di default in react-leaflet (a volte non caricano senza questo)
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapBounds({ tappe }) {
  const map = useMap();
  useEffect(() => {
    if (tappe.length > 0) {
      const bounds = L.latLngBounds(tappe.map(t => [t.lat, t.lng]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    } else {
      // Centro Europa di default
      map.setView([48.8566, 2.3522], 4);
    }
  }, [tappe, map]);
  return null;
}

export function MapView({ tappe, onEditClick }) {
  const [routePositions, setRoutePositions] = useState([]);
  
  useEffect(() => {
    let isMounted = true;
    const fetchRoute = async () => {
      if (tappe.length > 1) {
        setRoutePositions(tappe.map(t => [t.lat, t.lng])); // Fallback iniziale linea dritta
        const geometry = await getRouteGeometry(tappe);
        if (isMounted && geometry.length > 0) {
          setRoutePositions(geometry);
        }
      } else {
        setRoutePositions([]);
      }
    };
    fetchRoute();
    return () => { isMounted = false; };
  }, [tappe]);

  // Crea icone personalizzate con il numero
  const createCustomIcon = (index) => {
    return L.divIcon({
      className: 'bg-transparent border-none',
      html: `
        <div class="relative flex items-center justify-center w-8 h-8">
          <svg viewBox="0 0 24 24" class="absolute inset-0 text-[#FF5A5F] w-full h-full fill-current drop-shadow-md">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
          </svg>
          <span class="relative z-10 text-white font-bold text-xs pb-1">${index + 1}</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
      popupAnchor: [0, -32],
    });
  };

  return (
    <div className="h-full w-full relative z-0">
      <MapContainer 
        center={[48.8566, 2.3522]} 
        zoom={4} 
        scrollWheelZoom={true}
        className="h-full w-full"
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {tappe.map((tappa, index) => (
          <Marker 
            key={tappa.id} 
            position={[tappa.lat, tappa.lng]}
            icon={createCustomIcon(index)}
          >
            <Popup className="rounded-2xl border-none shadow-lg">
              <div className="p-1 min-w-[200px]">
                <div className="flex items-center gap-2 mb-2">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-[#FF5A5F] text-white text-[10px] font-bold">
                    {index + 1}
                  </span>
                  <h3 className="font-bold font-heading text-lg text-[#222222] truncate">{tappa.nome}</h3>
                </div>
                
                <div className="text-sm text-gray-600 mb-3 space-y-1">
                  <p>
                    {format(parseISO(tappa.dataArrivo), "d MMM", { locale: it })} - {format(parseISO(tappa.dataPartenza), "d MMM yyyy", { locale: it })}
                  </p>
                  <p className="font-medium text-[#00A699]">{tappa.notti} {tappa.notti === 1 ? 'notte' : 'notti'}</p>
                </div>
                
                <div className="flex flex-col gap-2 mb-3">
                  <a 
                    href={`https://it.wikipedia.org/wiki/${encodeURIComponent(tappa.nome)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <span>📖</span> Wikipedia
                  </a>
                  <a 
                    href={`https://www.google.com/maps?q=${tappa.lat},${tappa.lng}&layer=c`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <span>🗺️</span> Street View
                  </a>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onEditClick(tappa);
                  }}
                  className="w-full py-2 bg-gray-100 hover:bg-gray-200 text-[#222222] text-sm font-semibold rounded-xl transition-colors"
                >
                  ✏️ Modifica
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {routePositions.length > 1 && (
          <Polyline 
            positions={routePositions} 
            color="#00A699" 
            weight={3} 
            dashArray="10, 10" 
            opacity={0.8}
          />
        )}
        
        <MapBounds tappe={tappe} />
      </MapContainer>
    </div>
  );
}
