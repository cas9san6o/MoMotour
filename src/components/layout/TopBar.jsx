import React, { useContext, useState, useEffect } from 'react';
import { Share2, Link, Download, Save, Smartphone } from 'lucide-react';
import { TourContext } from '../../context/TourContext';
import { BottomSheet } from '../shared/BottomSheet';
import { encodeTourState } from '../../utils/shareEncoder';
import { useNavigate } from 'react-router-dom';

export function TopBar() {
  const { state, dispatch } = useContext(TourContext);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [tourNameInput, setTourNameInput] = useState('');
  const navigate = useNavigate();
  
  const title = state.tourName || "Nuovo Tour";

  useEffect(() => {
    if (isShareOpen) {
      setTourNameInput(title);
    }
  }, [isShareOpen, title]);

  const handleShareClick = () => {
    setIsShareOpen(true);
  };

  const shareUrl = () => {
    const encoded = encodeTourState(state);
    if (!encoded) return '';
    return `${window.location.origin}/shared/${encoded}`;
  };

  const handleSaveToDevice = () => {
    try {
      const stored = window.localStorage.getItem('momtour_saved_itineraries');
      let tours = stored ? JSON.parse(stored) : [];
      
      const newTour = {
        id: crypto.randomUUID(),
        nome: tourNameInput || `Tour ${state.tappe[0]?.nome || ''} - ${state.tappe[state.tappe.length - 1]?.nome || ''}`,
        dataCreazione: new Date().toISOString(),
        dataModifica: new Date().toISOString(),
        payload: { ...state, itinerari: undefined }
      };

      tours = [newTour, ...tours];
      window.localStorage.setItem('momtour_saved_itineraries', JSON.stringify(tours));
      
      if (tourNameInput) {
        dispatch({ type: 'SET_TOUR_NAME', payload: tourNameInput });
      }
      
      alert("✅ Tour salvato con successo nei tuoi itinerari!");
      setIsShareOpen(false);
    } catch (e) {
      alert("Errore durante il salvataggio.");
    }
  };

  const handleCopyLink = () => {
    const url = shareUrl();
    if (url) {
      if (url.length > 2000) {
        alert("⚠️ Attenzione: URL molto lungo, potrebbe non funzionare su tutti i sistemi.");
      }
      navigator.clipboard.writeText(url).then(() => {
        alert("✅ Link copiato negli appunti!");
      }).catch(() => {
        alert("Impossibile copiare il link.");
      });
    }
  };

  const handleNativeShare = async () => {
    const url = shareUrl();
    if (url && navigator.share) {
      try {
        await navigator.share({
          title: `MoMotour: ${title}`,
          text: `Guarda il mio itinerario MoMotour: ${title}`,
          url: url
        });
      } catch (err) {
        console.warn("Native share failed", err);
      }
    } else {
      alert("La condivisione nativa non è supportata su questo dispositivo. Copia il link invece.");
    }
  };

  const isNativeShareAvailable = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <>
      <header className="fixed top-0 left-0 right-0 h-14 bg-white z-50 px-4 flex items-center justify-between border-b border-gray-100 shadow-sm transition-all duration-300 ease-in-out">
        <button 
          onClick={() => navigate('/')}
          className="flex items-center gap-1 font-bold text-lg text-[#222222] font-heading hover:opacity-80 active:scale-95 transition-all text-left"
        >
          <span>MoMotour</span>
          <span className="w-2 h-2 rounded-full bg-[#FF5A5F] mt-1"></span>
        </button>
        
        <h1 
          className="font-medium text-sm text-[#222222] truncate max-w-[150px] sm:max-w-xs cursor-pointer hover:underline"
          onClick={() => navigate('/itinerari')}
        >
          {title}
        </h1>
        
        <button 
          onClick={handleShareClick}
          className="p-2 -mr-2 text-gray-400 hover:text-[#222222] hover:bg-gray-50 rounded-full transition-all duration-300 ease-in-out"
          aria-label="Opzioni condivisione"
        >
          <Share2 size={20} />
        </button>
      </header>

      <BottomSheet isOpen={isShareOpen} onClose={() => setIsShareOpen(false)} title="Condividi e Salva">
        <div className="flex flex-col gap-6">
          
          <div className="flex flex-col gap-2 border-b border-gray-100 pb-4">
             <label className="text-sm font-medium text-gray-700">Nome del tour prima di salvare/condividere</label>
             <input 
               type="text" 
               value={tourNameInput} 
               onChange={e => setTourNameInput(e.target.value)}
               className="w-full border border-gray-300 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:border-transparent"
               placeholder="Es. Roadtrip 2024"
             />
          </div>

          <div className="grid grid-cols-4 gap-2">
            <button 
              onClick={handleSaveToDevice}
              className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors"
            >
               <div className="bg-blue-100 text-blue-600 p-3 rounded-full">
                 <Save size={24} />
               </div>
               <span className="text-xs font-medium text-gray-700 text-center">Salva<br/>Itinerario</span>
            </button>
            
            <button 
              onClick={handleCopyLink}
              className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors"
            >
               <div className="bg-green-100 text-green-600 p-3 rounded-full">
                 <Link size={24} />
               </div>
               <span className="text-xs font-medium text-gray-700 text-center">Copia<br/>Link</span>
            </button>
            
            <button 
              onClick={handleNativeShare}
              disabled={!isNativeShareAvailable}
              className={`flex flex-col items-center justify-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors ${!isNativeShareAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
               <div className="bg-purple-100 text-purple-600 p-3 rounded-full">
                 <Smartphone size={24} />
               </div>
               <span className="text-xs font-medium text-gray-700 text-center">Condividi<br/>App</span>
            </button>
            
            <button 
              onClick={() => alert("Funzionalità in arrivo (WIP)")}
              className="flex flex-col items-center justify-center gap-2 p-3 hover:bg-gray-50 rounded-xl transition-colors opacity-50"
            >
               <div className="bg-orange-100 text-orange-600 p-3 rounded-full">
                 <Download size={24} />
               </div>
               <span className="text-xs font-medium text-gray-700 text-center">Salva<br/>come IMG</span>
            </button>
          </div>
        </div>
      </BottomSheet>
    </>
  );
}
