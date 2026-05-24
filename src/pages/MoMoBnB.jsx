import React, { useContext, useState } from 'react';
import { TourContext } from '../context/TourContext';
import { Badge } from '../components/shared/Badge';
import { X, ExternalLink, ChevronDown, Info } from 'lucide-react';
import { format, isValid } from 'date-fns';

export function MoMoBnB() {
  const { state } = useContext(TourContext);
  const { tappe } = state;
  const [selectedCity, setSelectedCity] = useState(null);
  const [isCardMinimized, setIsCardMinimized] = useState(false);

  const handleOpenBooking = (tappa, index, provider = 'booking') => {
    let checkin = '';
    let checkout = '';
    
    // We try to infer checkin and checkout from tappa.data or next tappa
    if (tappa.data) {
      const dataStr = typeof tappa.data === 'string' ? tappa.data : null;
      if (dataStr) {
        // Try to format
        try {
          const d = new Date(dataStr);
          if (isValid(d)) {
            checkin = format(d, 'yyyy-MM-dd');
            // checkout is next day or next stop's day
            const nextTappa = tappe[index + 1];
            if (nextTappa && nextTappa.data) {
                const nextD = new Date(nextTappa.data);
                if (isValid(nextD) && nextD > d) {
                   checkout = format(nextD, 'yyyy-MM-dd');
                } else {
                   const out = new Date(d);
                   out.setDate(out.getDate() + 1);
                   checkout = format(out, 'yyyy-MM-dd');
                }
            } else {
                const out = new Date(d);
                out.setDate(out.getDate() + 1);
                checkout = format(out, 'yyyy-MM-dd');
            }
          }
        } catch(e) {}
      }
    }

    const encodedNomeTappa = encodeURIComponent(tappa.nome);
    let targetUrl = '';

    if (provider === 'booking') {
      targetUrl = `https://www.booking.com/searchresults.it.html?ss=${encodedNomeTappa}&checkin=${checkin}&checkout=${checkout}&group_adults=2&no_rooms=1`;
    } else if (provider === 'airbnb') {
      targetUrl = `https://www.airbnb.it/s/${encodedNomeTappa}/homes?checkin=${checkin}&checkout=${checkout}&adults=2`;
    } else if (provider === 'hostelworld') {
      targetUrl = `https://www.hostelworld.com/s?q=${encodedNomeTappa}&dateFrom=${checkin}&dateTo=${checkout}&number_of_guests=2`;
    }

    setSelectedCity({
      tappa,
      bookingUrl: targetUrl,
      currentUrl: targetUrl,
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
        <p className="text-blue-100 text-sm">Trova e prenota la tua sistemazione ideale per ogni tappa del tuo MoMotour.</p>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-4">
        {tappe.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            Aggiungi tappe al tuo tour per cercare alloggi.
          </div>
        ) : (
          tappe.map((tappa, index) => (
            <div key={tappa.id} className="bg-white border border-gray-100 shadow-sm rounded-xl p-4 flex flex-col group active:scale-[0.98] transition-transform">
               <div className="flex justify-between items-start mb-2">
                 <h3 className="font-semibold text-lg text-gray-800">{tappa.nome}</h3>
                 {tappa.data && (
                    <Badge variant="blue" className="text-xs">
                        {new Date(tappa.data).toLocaleDateString('it-IT')}
                    </Badge>
                 )}
               </div>
               
               <div className="mt-3 grid grid-cols-1 gap-2">
                 <button 
                  onClick={() => handleOpenBooking(tappa, index, 'booking')}
                  className="bg-[#003580] text-white py-2 px-3 rounded-lg font-medium shadow-sm hover:focus:bg-blue-900 transition-colors flex items-center justify-center gap-2"
                 >
                   Vai a Booking.com
                   <ExternalLink size={16} />
                 </button>
                 <div className="grid grid-cols-2 gap-2">
                   <button 
                    onClick={() => handleOpenBooking(tappa, index, 'airbnb')}
                    className="bg-[#FF5A5F] text-white py-2 px-3 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center justify-center gap-1"
                   >
                     Airbnb
                   </button>
                   <button 
                    onClick={() => handleOpenBooking(tappa, index, 'hostelworld')}
                    className="bg-orange-500 text-white py-2 px-3 rounded-lg text-sm font-medium shadow-sm transition-colors flex items-center justify-center gap-1"
                   >
                     Hostelworld
                   </button>
                 </div>
               </div>
            </div>
          ))
        )}
      </div>

      {selectedCity && (
        <div className="fixed inset-0 z-[9999] bg-white flex flex-col">
          <div className="flex-1 w-full bg-gray-100 relative">
             <iframe 
               src={selectedCity.currentUrl} 
               className="w-full h-full border-none"
               title={`Booking ${selectedCity.tappa.nome}`}
               sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
               allow="geolocation"
             />
             
             {/* Fallback info when iframe blocked */}
             <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6 text-center opacity-0 hover:opacity-100 focus-within:opacity-100 transition-opacity">
                {/* Because iframes block clicks and might fail, we provide a visible fallback behind the iframe or above it if it fails to load. Actually iframe loads on top of everything, but if CSP blocks it, the iframe area might be white. A fallback button could be useful. We'll add some links at the bottom below the close button. */}
             </div>
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
                   <button onClick={() => window.open(selectedCity.currentUrl, '_blank', 'noopener,noreferrer')} className="text-sm bg-blue-50 text-blue-700 py-2 rounded-md font-medium border border-blue-100 flex items-center justify-center gap-1">
                      🔗 Apri in nuova tab <ExternalLink size={14} />
                   </button>
                   <div className="flex gap-2">
                      <button onClick={() => setSelectedCity({...selectedCity, currentUrl: `https://www.airbnb.it/s/${selectedCity.encodedNomeTappa}/homes?checkin=${selectedCity.checkin}&checkout=${selectedCity.checkout}&adults=2`})} className="text-xs flex-1 bg-gray-50 hover:bg-gray-100 py-2 rounded border border-gray-200 transition-colors">
                          Airbnb
                      </button>
                      <button onClick={() => setSelectedCity({...selectedCity, currentUrl: `https://www.hostelworld.com/s?q=${selectedCity.encodedNomeTappa}&dateFrom=${selectedCity.checkin}&dateTo=${selectedCity.checkout}&number_of_guests=2`})} className="text-xs flex-1 bg-gray-50 hover:bg-gray-100 py-2 rounded border border-gray-200 transition-colors">
                          Hostelworld
                      </button>
                      <button onClick={() => setSelectedCity({...selectedCity, currentUrl: `https://www.booking.com/searchresults.it.html?ss=${selectedCity.encodedNomeTappa}&checkin=${selectedCity.checkin}&checkout=${selectedCity.checkout}&group_adults=2&no_rooms=1`})} className="text-xs flex-1 bg-gray-50 hover:bg-gray-100 py-2 rounded border border-gray-200 transition-colors">
                          Booking
                      </button>
                   </div>
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
              className="bg-gray-900 text-white rounded-full py-3 px-6 font-medium shadow-2xl flex items-center justify-center gap-2 pointer-events-auto hover:bg-gray-800 transition-colors w-full max-w-sm"
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
