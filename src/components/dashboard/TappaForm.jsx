import React, { useState, useEffect } from 'react';
import { useGeocode } from '../../hooks/useGeocode';
import { differenceInDays, parseISO } from 'date-fns';
import { vibrate } from '../../utils/haptics';
import { Check } from 'lucide-react';

export function TappaForm({ onSubmit, initialData = null }) {
  const [search, setSearch] = useState('');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [dataArrivo, setDataArrivo] = useState('');
  const [dataPartenza, setDataPartenza] = useState('');
  const [note, setNote] = useState('');
  
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const { results, loading, error: geoError } = useGeocode(selectedPlace ? '' : search);
  
  const [manualLat, setManualLat] = useState('');
  const [manualLng, setManualLng] = useState('');

  // When error happens, and user types manual coordinates
  const handleManualCoordsChange = () => {
    if (manualLat && manualLng) {
      setSelectedPlace({
        nome: search || 'Destinazione manuale',
        lat: parseFloat(manualLat),
        lng: parseFloat(manualLng),
        indirizzo: search || ''
      });
    }
  };

  useEffect(() => {
    if (initialData) {
      setSearch(initialData.nome);
      setSelectedPlace({
        nome: initialData.nome,
        lat: initialData.lat,
        lng: initialData.lng,
        indirizzo: initialData.indirizzo
      });
      setDataArrivo(initialData.dataArrivo.split('T')[0]);
      setDataPartenza(initialData.dataPartenza.split('T')[0]);
      setNote(initialData.note || '');
    }
  }, [initialData]);

  const notti = (dataArrivo && dataPartenza) ? differenceInDays(parseISO(dataPartenza), parseISO(dataArrivo)) : 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedPlace || !dataArrivo || !dataPartenza) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }
    
    if (notti < 0) {
      alert("La data di partenza deve essere successiva o uguale a quella di arrivo");
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    const tappa = {
      id: initialData ? initialData.id : crypto.randomUUID(),
      nome: selectedPlace.nome,
      lat: selectedPlace.lat,
      lng: selectedPlace.lng,
      indirizzo: selectedPlace.indirizzo || selectedPlace.nome,
      dataArrivo: parseISO(dataArrivo).toISOString(),
      dataPartenza: parseISO(dataPartenza).toISOString(),
      notti: notti,
      note: note,
      ordine: initialData ? initialData.ordine : 0
    };

    vibrate(50);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onSubmit(tappa);
    }, 400);
  };

  const handleSelectPlace = (place) => {
    setSelectedPlace({
      nome: place.display_name.split(',')[0],
      lat: place.lat,
      lng: place.lng,
      indirizzo: place.display_name
    });
    setSearch(place.display_name.split(',')[0]);
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-4 ${isShaking ? 'animate-shake' : ''}`}>
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">Destinazione</label>
        <input 
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setSelectedPlace(null);
          }}
          placeholder="Cerca destinazione..."
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:bg-white transition-all"
          required
        />
        
        {!selectedPlace && search.length >= 3 && !geoError && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 shadow-lg rounded-2xl z-10 max-h-48 overflow-y-auto">
            {loading ? (
              <div className="p-3 text-sm text-gray-500 text-center">Ricerca in corso...</div>
            ) : results.length > 0 ? (
              results.map((r, i) => (
                <div 
                  key={i} 
                  onClick={() => handleSelectPlace(r)}
                  className="p-3 border-b border-gray-50 text-sm hover:bg-gray-50 cursor-pointer last:border-0"
                >
                  <div className="font-medium text-[#222222]">{r.display_name.split(',')[0]}</div>
                  <div className="text-xs text-gray-500 truncate">{r.display_name}</div>
                </div>
              ))
            ) : null}
          </div>
        )}

        {geoError && !selectedPlace && (
          <div className="mt-3 p-4 bg-orange-50 border border-orange-100 rounded-xl">
             <p className="text-sm text-orange-800 font-medium mb-2">🔍 Ricerca non disponibile, inserisci manualmente le coordinate</p>
             <div className="flex gap-2">
               <input 
                 type="number" 
                 step="any"
                 placeholder="Latitudine" 
                 value={manualLat}
                 onChange={e => { setManualLat(e.target.value); }}
                 onBlur={handleManualCoordsChange}
                 className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg"
               />
               <input 
                 type="number" 
                 step="any"
                 placeholder="Longitudine" 
                 value={manualLng}
                 onChange={e => { setManualLng(e.target.value); }}
                 onBlur={handleManualCoordsChange}
                 className="flex-1 px-3 py-2 text-sm bg-white border border-gray-200 rounded-lg"
               />
             </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Arrivo</label>
          <input 
            type="date"
            value={dataArrivo}
            onChange={(e) => setDataArrivo(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
            required
          />
        </div>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Partenza</label>
          <input 
            type="date"
            value={dataPartenza}
            min={dataArrivo}
            onChange={(e) => setDataPartenza(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF5A5F]"
            required
          />
        </div>
      </div>

      {(dataArrivo && dataPartenza && notti >= 0) && (
        <div className="text-sm font-medium text-[#00A699]">
          Permanenza: {notti} {notti === 1 ? 'notte' : 'notti'}
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Note (opzionale)</label>
        <textarea 
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Es. Codice check-in, orari..."
          rows={2}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:bg-white resize-none"
        />
      </div>

      <button 
        type="submit"
        disabled={isSuccess || !selectedPlace || !dataArrivo || !dataPartenza || notti < 0}
        className={`w-full mt-2 text-white font-bold py-4 rounded-full transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
          isSuccess ? 'bg-green-500 animate-success' : 'bg-[#FF5A5F] hover:bg-[#E0484D]'
        }`}
      >
        {isSuccess ? <Check size={24} /> : (initialData ? 'Aggiorna Tappa' : 'Aggiungi Tappa')}
      </button>
    </form>
  );
}
