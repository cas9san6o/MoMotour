import React, { useContext, useState, useEffect } from 'react';
import { TourContext } from '../context/TourContext';
import { Badge } from '../components/shared/Badge';
import { BottomSheet } from '../components/shared/BottomSheet';
import { Map, Share2, Trash2, Download, Check, Save } from 'lucide-react';
import { encodeTourState } from '../utils/shareEncoder';

export function ItinerariSalvati() {
  const { state, dispatch } = useContext(TourContext);
  const [savedTours, setSavedTours] = useState([]);
  const [isSaveSheetOpen, setIsSaveSheetOpen] = useState(false);
  
  const [tourNameInput, setTourNameInput] = useState('');

  // Load from localStorage
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem('momtour_saved_itineraries');
      if (stored) {
        setSavedTours(JSON.parse(stored));
      }
    } catch (err) {
      console.warn("Failed to load saved tours", err);
    }
  }, []);

  const saveToStorage = (tours) => {
    setSavedTours(tours);
    window.localStorage.setItem('momtour_saved_itineraries', JSON.stringify(tours));
  };

  const handleSaveCurrentTour = () => {
    if (state.tappe.length === 0) return;
    
    const newTour = {
      id: crypto.randomUUID(),
      nome: tourNameInput || state.tourName || `Tour ${state.tappe[0].nome} - ${state.tappe[state.tappe.length - 1].nome}`,
      dataCreazione: new Date().toISOString(),
      dataModifica: new Date().toISOString(),
      payload: { ...state, itinerari: undefined } // ignore legacy itinerari
    };

    saveToStorage([newTour, ...savedTours]);
    setIsSaveSheetOpen(false);
    
    // Also set current tour name
    if (tourNameInput) {
       dispatch({ type: 'SET_TOUR_NAME', payload: tourNameInput });
    }
  };

  const openSaveSheet = () => {
    if (state.tappe.length > 0) {
      setTourNameInput(state.tourName || `Tour ${state.tappe[0].nome} - ${state.tappe[state.tappe.length - 1].nome}`);
    } else {
      setTourNameInput('Nuovo Tour');
    }
    setIsSaveSheetOpen(true);
  };

  const handleLoadTour = (tour) => {
    if (window.confirm(`Vuoi sostituire il tour corrente con "${tour.nome}"? Se non hai salvato i dati correnti, andranno persi.`)) {
      try { window.navigator.vibrate(50); } catch(e) {}
      dispatch({ type: 'LOAD_ITINERARIO', payload: tour.payload });
      dispatch({ type: 'SET_TOUR_NAME', payload: tour.nome });
    }
  };

  const handleDeleteTour = (e, tourId) => {
    e.stopPropagation();
    if (window.confirm("Sei sicuro di voler eliminare questo tour salvato?")) {
      try { window.navigator.vibrate([50, 30, 50]); } catch(e) {}
      saveToStorage(savedTours.filter(t => t.id !== tourId));
    }
  };

  const handleShare = async (e, tour) => {
    e.stopPropagation();
    const encoded = encodeTourState(tour.payload);
    if (!encoded) return alert("Errore durante la generazione del link.");

    const shareUrl = `${window.location.origin}/shared/${encoded}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `MoMotour: ${tour.nome}`,
          text: `Guarda il mio itinerario MoMotour: ${tour.nome}`,
          url: shareUrl
        });
      } catch (err) {
        copyToClipboard(shareUrl);
      }
    } else {
      copyToClipboard(shareUrl);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(() => {
      alert("✅ Link del tour copiato negli appunti!");
    }).catch(() => {
      alert("Impossibile copiare il link.");
    });
  };

  return (
    <div className="flex flex-col h-full animate-fade-in pb-24">
      <div className="bg-white p-4 sticky top-0 z-10 border-b border-gray-100 flex justify-between items-center">
        <h1 className="text-2xl font-bold font-heading text-gray-900">I Miei Tour 📚</h1>
        <button 
          onClick={openSaveSheet}
          disabled={state.tappe.length === 0}
          className="bg-[var(--color-brand)] text-white px-3 py-1.5 rounded-lg font-medium text-sm disabled:opacity-50 flex items-center gap-1 shadow-sm"
        >
          <Save size={16} /> Salva Corrente
        </button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto">
        {savedTours.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 gap-3">
            <Map size={48} className="text-gray-300" />
            <p>Nessun tour salvato.<br/>Crea il tuo primo tour e salvalo!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {savedTours.map(tour => (
              <div 
                key={tour.id} 
                onClick={() => handleLoadTour(tour)}
                className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 flex flex-col active:scale-[0.98] transition-transform cursor-pointer relative"
              >
                 <div className="flex justify-between items-start mb-2">
                   <h3 className="font-semibold text-lg text-gray-800 pr-8">{tour.nome}</h3>
                   <button 
                     onClick={(e) => handleDeleteTour(e, tour.id)}
                     className="text-gray-400 hover:text-red-500 absolute top-4 right-4 p-1"
                     aria-label="Elimina tour"
                   >
                     <Trash2 size={18} />
                   </button>
                 </div>
                 
                 <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
                    <Map size={14} />
                    <span>{tour.payload.tappe?.length || 0} tappe</span>
                    {tour.payload.tappe && tour.payload.tappe.length > 0 && (
                      <span className="truncate">
                        • {tour.payload.tappe[0].nome} → {tour.payload.tappe[tour.payload.tappe.length-1].nome}
                      </span>
                    )}
                 </div>

                 <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-400">
                      Modificato: {new Date(tour.dataModifica).toLocaleDateString('it-IT')}
                    </span>
                    <div className="flex gap-2">
                      <button 
                        onClick={(e) => handleShare(e, tour)}
                        className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100"
                        title="Condividi tour"
                        aria-label="Condividi tour"
                      >
                         <Share2 size={16} />
                      </button>
                    </div>
                 </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <BottomSheet isOpen={isSaveSheetOpen} onClose={() => setIsSaveSheetOpen(false)} title="Salva Tour">
         <div className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome del tour</label>
              <input 
                type="text" 
                value={tourNameInput} 
                onChange={e => setTourNameInput(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-transparent"
                placeholder="Es. Tour estivo in Spagna"
              />
            </div>
            
            <button 
              onClick={handleSaveCurrentTour}
              className="w-full bg-[var(--color-brand)] text-white py-3 rounded-xl font-medium shadow-md hover:bg-rose-500 transition-colors"
            >
              Salva nel dispositivo
            </button>
         </div>
      </BottomSheet>
    </div>
  );
}
