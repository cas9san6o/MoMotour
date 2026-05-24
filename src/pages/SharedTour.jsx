import React, { useEffect, useState, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { decodeTourState } from '../utils/shareEncoder';
import { TourContext } from '../context/TourContext';
import { Map, Download, Eye, X } from 'lucide-react';

export function SharedTour() {
  const location = useLocation();
  const navigate = useNavigate();
  const { dispatch } = useContext(TourContext);
  
  const [sharedState, setSharedState] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    // Check if the payload is in the hash first
    let payload = '';
    if (location.hash && location.hash.length > 1) {
      if (location.hash.startsWith('#/shared=')) {
          payload = location.hash.slice(9);
      } else {
          payload = location.hash.slice(1);
      }
    } else {
      // Look in URL path
      const parts = location.pathname.split('/shared/');
      if (parts.length > 1) {
        payload = parts[1];
      }
    }

    if (payload) {
      const decoded = decodeTourState(payload);
      if (decoded) {
        setSharedState(decoded);
      } else {
        setError('Link di condivisione non valido o corrotto.');
      }
    } else {
        setError('Nessun tour trovato in questo link.');
    }
  }, [location]);

  const handleImport = () => {
    if (!sharedState) return;
    
    // Save to saved itineraries immediately
    try {
      const stored = window.localStorage.getItem('momtour_saved_itineraries');
      let tours = stored ? JSON.parse(stored) : [];
      
      const newTour = {
        id: crypto.randomUUID(),
        nome: sharedState.tourName || `Tour Condiviso`,
        dataCreazione: new Date().toISOString(),
        dataModifica: new Date().toISOString(),
        payload: { ...sharedState, itinerari: undefined }
      };

      tours = [newTour, ...tours];
      window.localStorage.setItem('momtour_saved_itineraries', JSON.stringify(tours));
      
      // Load it to context
      dispatch({ type: 'LOAD_ITINERARIO', payload: sharedState });
      dispatch({ type: 'SET_TOUR_NAME', payload: newTour.nome });
      
      alert("✅ Tour importato e salvato con successo!");
      navigate('/');
    } catch(err) {
      alert("Errore durante l'importazione.");
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  if (error) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center space-y-4">
         <X size={48} className="text-red-400" />
         <h1 className="text-xl font-bold font-heading">Errore</h1>
         <p className="text-gray-600">{error}</p>
         <button onClick={handleClose} className="px-4 py-2 bg-gray-200 rounded-lg">Torna alla Home</button>
      </div>
    );
  }

  if (!sharedState) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-full text-center space-y-4 animate-pulse">
         <div className="w-12 h-12 rounded-full border-4 border-gray-200 border-t-[#FF5A5F] animate-spin mb-2"></div>
         <p className="text-gray-500">Decodifica del tour in corso...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-[#f7f7f7] animate-fade-in pb-20">
       <div className="bg-yellow-50 border-b border-yellow-200 p-4 sticky top-0 z-20 flex flex-col gap-3 shadow-sm">
           <div className="flex items-start gap-2 text-yellow-800">
             <Eye size={20} className="mt-0.5 shrink-0" />
             <p className="text-sm">
               <strong>Stai visualizzando un tour condiviso READ-ONLY.</strong><br/>
               Importalo per poterlo modificare.
             </p>
           </div>
           <div className="flex gap-2">
             <button 
               onClick={handleImport}
               className="flex-1 bg-yellow-500 hover:bg-yellow-600 text-white py-2 rounded-lg font-medium text-sm transition-colors shadow-sm"
             >
               Importa questo tour
             </button>
             <button 
               onClick={handleClose}
               className="px-4 bg-white border border-yellow-300 text-yellow-800 hover:bg-yellow-100 py-2 rounded-lg font-medium text-sm transition-colors"
             >
               Chiudi
             </button>
           </div>
       </div>

       <div className="p-4 space-y-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
            <h1 className="text-2xl font-bold font-heading mb-1">{sharedState.tourName || 'Tour senza nome'}</h1>
            <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Map size={16} />
                <span>{sharedState.tappe?.length || 0} tappe</span>
                <span>•</span>
                <span className="capitalize">{sharedState.tourType || 'Generico'}</span>
            </div>
          </div>

          <div className="space-y-3">
             <h3 className="font-semibold text-lg text-gray-800 px-1">Tappe del Tour</h3>
             {sharedState.tappe?.length === 0 ? (
               <p className="text-gray-500 px-1 text-sm">Nessuna tappa presente.</p>
             ) : (
               sharedState.tappe?.map((t, idx) => (
                 <div key={t.id || idx} className="bg-white p-3 rounded-xl shadow-sm border border-gray-50 flex gap-3 opacity-90">
                    <div className="bg-gray-100 w-8 h-8 rounded-full flex items-center justify-center font-bold text-gray-600 shrink-0">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 mb-0.5">{t.nome}</div>
                      {t.data && <div className="text-xs text-gray-500">{new Date(t.data).toLocaleDateString()}</div>}
                    </div>
                 </div>
               ))
             )}
          </div>
       </div>
    </div>
  );
}
