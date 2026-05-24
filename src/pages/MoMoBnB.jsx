import React, { useContext, useState } from 'react';
import { TourContext } from '../context/TourContext';
import { Badge } from '../components/shared/Badge';
import { X, ExternalLink, ChevronDown, Info, Star, MapPin } from 'lucide-react';
import { format, isValid } from 'date-fns';

const MOCK_IMAGES = {
  booking: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?fit=crop&w=600&h=400&q=80", "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?fit=crop&w=600&h=400&q=80"],
  airbnb: ["https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?fit=crop&w=600&h=400&q=80", "https://images.unsplash.com/photo-1502672260266-1c1de2d9d000?fit=crop&w=600&h=400&q=80"],
  hostelworld: ["https://images.unsplash.com/photo-1555854877-bab0e564b8d5?fit=crop&w=600&h=400&q=80", "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?fit=crop&w=600&h=400&q=80"]
};

// Genera risultati simulati per far vedere la UI (poiché non abbiamo API booking reali gratuite)
const generateMockResults = (tappaNome, tappaId, provider) => {
  return [1, 2].map(i => ({
    id: `${tappaId}-${provider}-${i}`,
    title: `${provider === 'hostelworld' ? 'Ostello' : provider === 'airbnb' ? 'Appartamento' : 'Hotel'} ${tappaNome} ${i}`,
    price: Math.floor(Math.random() * (provider === 'hostelworld' ? 30 : 100)) + 20,
    rating: (Math.random() * 1.5 + 3.5).toFixed(1),
    reviews: Math.floor(Math.random() * 300) + 10,
    image: MOCK_IMAGES[provider][i-1],
    desc: `Ottima posizione a ${tappaNome}, ideale per il tuo viaggio.`
  }));
};

export function MoMoBnB() {
  const { state } = useContext(TourContext);
  const { tappe } = state;
  const [selectedCity, setSelectedCity] = useState(null);
  const [isCardMinimized, setIsCardMinimized] = useState(false);
  const [expandedTappaId, setExpandedTappaId] = useState(null);

  const openAppIntentOrWeb = (targetUrl, appIntentUrl) => {
      // Try to open app intent first by changing location, with a timeout fallback for web view
      const start = Date.now();
      window.location.href = appIntentUrl;
      setTimeout(() => {
          if (Date.now() - start < 1500) {
              // App non si è aperta (presumibilmente), apri iframe o nuova tab
              setSelectedCity({ currentUrl: targetUrl, bookingUrl: targetUrl }); 
              setIsCardMinimized(false);
          }
      }, 500);
  };

  const handleOpenBooking = (tappa, provider = 'booking') => {
    let checkin = '';
    let checkout = '';
    
    if (tappa.dataArrivo) {
      try {
        const dIn = new Date(tappa.dataArrivo);
        if (isValid(dIn)) checkin = format(dIn, 'yyyy-MM-dd');
      } catch(e) {}
    }
    if (tappa.dataPartenza) {
      try {
        const dOut = new Date(tappa.dataPartenza);
        if (isValid(dOut)) checkout = format(dOut, 'yyyy-MM-dd');
      } catch(e) {}
    }

    const encodedNomeTappa = encodeURIComponent(tappa.nome);
    let targetUrl = '';
    let appUrl = '';

    if (provider === 'booking') {
      targetUrl = `https://www.booking.com/searchresults.it.html?ss=${encodedNomeTappa}&checkin=${checkin}&checkout=${checkout}&group_adults=2&no_rooms=1`;
      appUrl = `booking://hotelsearch?query=${encodedNomeTappa}`;
    } else if (provider === 'airbnb') {
      targetUrl = `https://www.airbnb.it/s/${encodedNomeTappa}/homes?checkin=${checkin}&checkout=${checkout}&adults=2`;
      appUrl = `airbnb://s/${encodedNomeTappa}`;
    } else if (provider === 'hostelworld') {
      targetUrl = `https://www.hostelworld.com/s?q=${encodedNomeTappa}&dateFrom=${checkin}&dateTo=${checkout}&number_of_guests=2`;
      // Intent not clear for HW, fallback to web link always for app intent
      appUrl = targetUrl;
    }

    setSelectedCity({
      tappa,
      bookingUrl: targetUrl,
      currentUrl: targetUrl,
      appUrl,
      checkin,
      checkout,
      encodedNomeTappa
    });
    setIsCardMinimized(false);
  };

  const closeOverlay = () => {
    setSelectedCity(null);
  };

  return (
    <div className="flex flex-col h-full animate-fade-in transition-all duration-300 ease-in-out pb-24">
      <div className="bg-[#003580] text-white p-6 rounded-b-2xl shadow-md">
        <h1 className="text-2xl font-bold font-heading mb-1">MoMoBnB</h1>
        <p className="text-blue-100 text-sm">Trova e prenota la tua sistemazione in app o via web per ogni tappa.</p>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {tappe.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            Aggiungi tappe al tuo tour per cercare alloggi.
          </div>
        ) : (
          tappe.map((tappa) => {
             const isExpanded = expandedTappaId === tappa.id;
             return (
              <div key={tappa.id} className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 flex flex-col transition-all duration-300">
                 <div className="flex justify-between items-center mb-2 cursor-pointer" onClick={() => setExpandedTappaId(isExpanded ? null : tappa.id)}>
                   <div>
                       <h3 className="font-semibold text-lg text-gray-800">{tappa.nome}</h3>
                       {tappa.dataArrivo && (
                          <span className="text-xs text-gray-500 mt-1 block">
                              {new Date(tappa.dataArrivo).toLocaleDateString('it-IT')} - {new Date(tappa.dataPartenza).toLocaleDateString('it-IT')}
                          </span>
                       )}
                   </div>
                   <button className="text-blue-600 font-medium text-sm flex items-center bg-blue-50 px-3 py-1 rounded-full">
                       {isExpanded ? 'Chiudi' : 'Vedi Alloggi'}
                   </button>
                 </div>
                 
                 {isExpanded && (
                   <div className="mt-4 flex flex-col gap-6 animate-fade-in">
                       {['booking', 'airbnb', 'hostelworld'].map(provider => {
                           const colorClass = provider === 'airbnb' ? 'text-[#FF5A5F]' : provider === 'hostelworld' ? 'text-orange-500' : 'text-[#003580]';
                           return (
                           <div key={provider}>
                               <div className="flex items-center justify-between mb-2">
                                   <h4 className={`font-bold capitalize ${colorClass} flex items-center gap-2`}>
                                      {provider}
                                   </h4>
                                   <button 
                                      onClick={() => handleOpenBooking(tappa, provider)}
                                      className="text-xs bg-gray-100 py-1 px-3 rounded-full hover:bg-gray-200 transition-colors font-medium flex items-center gap-1"
                                   >
                                      Ricerca Reale <ExternalLink size={12}/>
                                   </button>
                               </div>
                               <div className="flex overflow-x-auto snap-x snap-mandatory gap-3 pb-2 -mx-4 px-4 scrollbar-hide">
                                   {generateMockResults(tappa.nome, tappa.id, provider).map(item => (
                                       <div key={item.id} className="snap-center min-w-[240px] max-w-[280px] bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.08)] border border-gray-100 overflow-hidden flex flex-col">
                                          <div className="h-32 bg-gray-200 relative">
                                             <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                             <div className="absolute top-2 right-2 bg-white/90 backdrop-blur rounded-full px-2 py-0.5 text-xs font-bold flex items-center gap-1 shadow-sm">
                                                <Star fill="currentColor" size={12} className="text-yellow-500" /> {item.rating}
                                             </div>
                                          </div>
                                          <div className="p-3 flex-1 flex flex-col">
                                             <h5 className="font-bold text-sm text-[#222222] line-clamp-1 mb-1">{item.title}</h5>
                                             <p className="text-xs text-gray-500 line-clamp-2 mb-2 flex-1">{item.desc}</p>
                                             <div className="flex items-end justify-between mt-auto">
                                                <div className="font-bold text-[#222222]">€{item.price}<span className="font-normal text-gray-500 text-xs">/notte</span></div>
                                                <button onClick={() => handleOpenBooking(tappa, provider)} className="text-xs bg-gray-900 text-white px-3 py-1.5 rounded-lg active:scale-95 transition-transform">Vedi</button>
                                             </div>
                                          </div>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       )})}
                   </div>
                 )}
              </div>
            );
          })
        )}
      </div>

      {selectedCity && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
          <div className="flex-1 w-full bg-gray-100 relative">
             <iframe 
               src={selectedCity.currentUrl} 
               className="w-full h-full border-none"
               title={`Booking ${selectedCity.tappa?.nome || 'Search'}`}
               sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
               allow="geolocation"
             />
          </div>
          
          <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-3 w-full px-4 text-center pointer-events-none">
            {!isCardMinimized ? (
              <div className="bg-white/95 backdrop-blur shadow-xl rounded-2xl p-4 w-full max-w-sm pointer-events-auto border border-gray-100 flex flex-col gap-2 relative">
                 <button 
                   onClick={() => setIsCardMinimized(true)}
                   aria-label="Riduci a icona"
                   className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-600 bg-gray-100 rounded-full transition-colors"
                 >
                   <ChevronDown size={16} />
                 </button>
                 <div className="flex items-center justify-between pr-8">
                   <span className="font-semibold text-sm">Problemi di visualizzazione?</span>
                 </div>
                 <div className="flex flex-col gap-2">
                   <button onClick={() => {
                        window.location.href = selectedCity.appUrl || selectedCity.bookingUrl;
                   }} className="text-sm bg-gray-900 text-white py-2 rounded-md font-medium border flex items-center justify-center gap-1 active:scale-95">
                      📱 Prova ad aprire l'App Ufficiale
                   </button>
                   <button onClick={() => window.open(selectedCity.currentUrl, '_blank', 'noopener,noreferrer')} className="text-sm bg-blue-50 text-blue-700 py-2 rounded-md font-medium border border-blue-100 flex items-center justify-center gap-1 active:scale-95">
                      🔗 Apri nel web esterno <ExternalLink size={14} />
                   </button>
                 </div>
              </div>
            ) : (
                <button 
                  onClick={() => setIsCardMinimized(false)}
                  className="bg-white text-gray-800 rounded-full w-10 h-10 flex items-center justify-center shadow-xl pointer-events-auto border border-gray-200 mb-1 self-end hover:bg-gray-50 transition-colors"
                  aria-label="Info"
                >
                  <Info size={20} />
                </button>
            )}

            <button 
              onClick={closeOverlay}
              className="bg-gray-900 text-white rounded-full py-3 px-4 font-medium shadow-2xl flex items-center justify-center gap-2 pointer-events-auto hover:bg-gray-800 transition-colors w-40"
            >
              <X size={18} />
              Chiudi
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
