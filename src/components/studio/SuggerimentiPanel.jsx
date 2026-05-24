import React, { useState, useEffect, useRef } from 'react';
import { CATEGORIE_ATTIVITA } from '../../utils/categorie';
import { Badge } from '../shared/Badge';
import { RefreshCw, Plus, Lightbulb } from 'lucide-react';

const shuffleArray = (array) => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

// Cache application-level
const cache = {};

export function SuggerimentiPanel({ tappa, onAddAttivita }) {
  const [suggerimenti, setSuggerimenti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const seenIds = useRef(new Set());

  const fetchSuggerimenti = async (isRefresh = false) => {
    if (!tappa || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const cacheKey = `sugg_${tappa.id}_${tappa.lat}_${tappa.lng}`;
      let allResults = cache[cacheKey];

      // Fetch init if no cache
      if (!allResults) {
        // We use Overpass to fetch multiple categories at once around 2000m
        const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node(around:2000,${tappa.lat},${tappa.lng})[~"^(tourism|amenity|leisure)$"~"^(attraction|museum|restaurant|park)$"];out 100;`;
        
        let response = null;
        try {
            response = await fetch(overpassUrl + `&t=${Date.now()}`);
        } catch (e) {
            console.warn("Network error overpass, falling back");
        }

        if (response && response.ok) {
            const data = await response.json();
            if (data.elements && data.elements.length > 0) {
              const rawResults = data.elements
                .filter(e => e.tags && e.tags.name)
                .map(e => {
                  let catId = 'altro';
                  if (e.tags.tourism === 'museum') catId = 'museo';
                  else if (e.tags.tourism === 'attraction') catId = 'attrazione';
                  else if (e.tags.amenity === 'restaurant') catId = 'ristorante';
                  else if (e.tags.leisure === 'park') catId = 'attivita';

                  return {
                    id: `overpass-${e.id}`,
                    nome: e.tags.name,
                    categoria: catId,
                    luogo: tappa.nome,
                    isFallback: false
                  };
                });
              
              // Remove duplicates (by name lower case)
              allResults = rawResults.filter(
                  (item, index, self) =>
                    index === self.findIndex(x => x.nome.toLowerCase() === item.nome.toLowerCase())
              );
            }
        }

        // Fallback or additional data from Wiki if Overpass failed or returned very few
        if (!allResults || allResults.length < 10) {
            try {
                const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${tappa.lat}|${tappa.lng}&gsradius=10000&gslimit=50&format=json&origin=*&t=${Date.now()}`;
                const wikiResponse = await fetch(wikiUrl);
                if (wikiResponse.ok) {
                   const wikiData = await wikiResponse.json();
                   if (wikiData.query && wikiData.query.geosearch) {
                      const wikiResults = wikiData.query.geosearch.map(article => ({
                        id: `wiki-${article.pageid}`,
                        nome: article.title,
                        categoria: 'attrazione',
                        luogo: tappa.nome,
                        isFallback: true,
                        url: `https://en.wikipedia.org/?curid=${article.pageid}`
                      }));
                      
                      // merge avoiding duplicates
                      if (!allResults) allResults = [];
                      const existingNames = new Set(allResults.map(x => x.nome.toLowerCase()));
                      wikiResults.forEach(w => {
                         if (!existingNames.has(w.nome.toLowerCase())) {
                            allResults.push(w);
                            existingNames.add(w.nome.toLowerCase());
                         }
                      });
                   }
                }
            } catch (e) {
                console.error("Wiki fallback failed");
            }
        }
        
        if (allResults && allResults.length > 0) {
           cache[cacheKey] = allResults;
        } else {
           throw new Error("Nessun risultato disponibile");
        }
      }

      // We have allResults. Let's filter seen ones and shuffle
      let freshResults = allResults.filter(r => !seenIds.current.has(r.id));
      
      // If we ran out of fresh results, reset seenIds to loop again
      if (freshResults.length === 0) {
          seenIds.current.clear();
          freshResults = allResults;
      }
      
      freshResults = shuffleArray(freshResults);
      const batch = freshResults.slice(0, 4);
      
      batch.forEach(r => seenIds.current.add(r.id));
      
      setSuggerimenti(batch);
      
    } catch (err) {
      setError(err.message || "Impossibile caricare i suggerimenti.");
      setSuggerimenti([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggerimenti();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tappa]);

  if (!tappa) return null;

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[#222222]">
          <Lightbulb className="text-[#FF5A5F]" size={20} />
          <h3 className="font-bold font-heading">Idee per {tappa.nome}</h3>
        </div>
        <button 
          onClick={() => fetchSuggerimenti(true)}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-[#00A699] rounded-full transition-colors disabled:opacity-50"
          aria-label="Nuovi suggerimenti"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {error ? (
        <div className="text-sm text-gray-500 text-center py-4">{error}</div>
      ) : loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="animate-pulse flex items-center justify-between p-3 border border-gray-100 rounded-xl">
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded-full shrink-0 ml-2"></div>
            </div>
          ))}
        </div>
      ) : suggerimenti.length > 0 ? (
        <div className="space-y-3">
          {suggerimenti.map((sugg) => {
            const cat = CATEGORIE_ATTIVITA[sugg.categoria] || CATEGORIE_ATTIVITA['altro'];
            return (
              <div key={sugg.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`${cat.bg} ${cat.color} text-[10px]`}>
                      {cat.icon} {cat.label}
                    </Badge>
                  </div>
                  <h4 className="font-semibold text-sm text-[#222222] truncate">{sugg.nome}</h4>
                  {sugg.isFallback && (
                    <a 
                      href={sugg.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-blue-500 hover:underline inline-block mt-0.5"
                    >
                      Leggi su Wikipedia
                    </a>
                  )}
                </div>
                <button 
                  onClick={() => onAddAttivita({
                    nome: sugg.nome,
                    categoria: sugg.categoria,
                    luogo: sugg.luogo || tappa.nome
                  })}
                  className="flex items-center justify-center gap-1 sm:px-3 py-1.5 px-3 bg-gray-50 hover:bg-[#FF5A5F] text-[#222222] hover:text-white rounded-full text-xs font-medium transition-colors shrink-0"
                >
                  <Plus size={14} /> Aggiungi
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-sm text-gray-500 text-center py-4">
          Nessun suggerimento trovato al momento. Premi la freccia per ricaricare.
        </div>
      )}
    </div>
  );
}
