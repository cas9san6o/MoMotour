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

export function SuggerimentiPanel({ tappa, onAddAttivita, onOpenLink }) {
  const [suggerimenti, setSuggerimenti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('tutti');

  const seenIds = useRef(new Set());

  const availableCategories = ['tutti', 'attrazione', 'ristorante', 'museo', 'attivita'];

  const fetchSuggerimenti = async (isRefresh = false, category = 'tutti') => {
    if (!tappa || loading) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Overpass query building depending on category
      let typeRegex = "^(tourism|amenity|leisure)$";
      let valueRegex = "^(attraction|museum|restaurant|park)$";
      
      if (category === 'attrazione') {
         typeRegex = "^(tourism)$";
         valueRegex = "^(attraction)$";
      } else if (category === 'museo') {
         typeRegex = "^(tourism)$";
         valueRegex = "^(museum)$";
      } else if (category === 'ristorante') {
         typeRegex = "^(amenity)$";
         valueRegex = "^(restaurant)$";
      } else if (category === 'attivita') {
         typeRegex = "^(leisure)$";
         valueRegex = "^(park)$";
      }

      // Add a slight bounding box or radius fuzziness if it's a refresh to get different results? Overpass usually returns all.
      // We'll rely on the cache and shuffling to get different ones if available, but if it's a forced refresh we can try a larger radius.
      const radius = isRefresh ? 5000 : 2000;
      
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node(around:${radius},${tappa.lat},${tappa.lng})[~"${typeRegex}"~"${valueRegex}"];out 200;`;
      
      let allResults = [];
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
                  isFallback: false,
                  sitoUrl: e.tags.website || e.tags['contact:website'] || null
                };
              });
            
            // Remove duplicates (by name lower case)
            allResults = rawResults.filter(
                (item, index, self) =>
                  index === self.findIndex(x => x.nome.toLowerCase() === item.nome.toLowerCase())
            );
          }
      }

      // Fallback or additional data from Wiki if Overpass failed or we want 'attrazione'
      if ((!allResults || allResults.length < 10) && (category === 'tutti' || category === 'attrazione')) {
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
                      url: `https://en.wikipedia.org/?curid=${article.pageid}`,
                      sitoUrl: null
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
      
      if (!allResults || allResults.length === 0) {
         throw new Error("Nessun risultato disponibile per questa ricerca");
      }

      // We have allResults. Let's filter seen ones and shuffle
      let freshResults = allResults.filter(r => !seenIds.current.has(r.id));
      
      // If we ran out of fresh results, reset seenIds to loop again
      if (freshResults.length === 0) {
          allResults.forEach(r => seenIds.current.delete(r.id));
          freshResults = allResults;
      }
      
      freshResults = shuffleArray(freshResults);
      // We take more results so we can filter them by category and have enough
      const batch = freshResults.slice(0, 15);
      
      batch.forEach(r => seenIds.current.add(r.id));
      
      setSuggerimenti(isRefresh ? batch : [...suggerimenti, ...batch]);
      
    } catch (err) {
      setError(err.message || "Impossibile caricare i suggerimenti.");
      if (!isRefresh && suggerimenti.length === 0) setSuggerimenti([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuggerimenti();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tappa]);

  if (!tappa) return null;

  const filteredSuggerimenti = activeCategory === 'tutti' 
    ? suggerimenti 
    : suggerimenti.filter(s => s.categoria === activeCategory);

  return (
    <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[#222222]">
          <Lightbulb className="text-[#FF5A5F]" size={20} />
          <h3 className="font-bold font-heading">Idee per {tappa.nome}</h3>
        </div>
        <button 
          onClick={() => fetchSuggerimenti(true, activeCategory)}
          disabled={loading}
          className="p-2 text-gray-400 hover:text-[#00A699] rounded-full transition-colors disabled:opacity-50"
          aria-label="Nuovi suggerimenti"
        >
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      {!loading && !error && (
         <div className="flex overflow-x-auto gap-2 pb-3 mb-2 no-scrollbar">
            {availableCategories.map(catKey => {
               const catDef = CATEGORIE_ATTIVITA[catKey] || CATEGORIE_ATTIVITA['altro'];
               const label = catKey === 'tutti' ? 'Tutti' : catDef.label;
               const icon = catKey === 'tutti' ? '🌟' : catDef.icon;
               const isActive = activeCategory === catKey;
               
               return (
                  <button
                    key={catKey}
                    onClick={() => {
                        setActiveCategory(catKey);
                        if (!suggerimenti.some(s => s.categoria === catKey) && catKey !== 'tutti') {
                           fetchSuggerimenti(false, catKey);
                        }
                    }}
                    className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1 transition-colors ${
                       isActive 
                        ? 'bg-gray-900 border-gray-900 text-white' 
                        : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                     {icon} {label}
                  </button>
               )
            })}
         </div>
      )}

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
      ) : filteredSuggerimenti.length > 0 ? (
        <div className="space-y-3">
          {filteredSuggerimenti.map((sugg) => {
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
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {sugg.isFallback && (
                      <button 
                        onClick={(e) => {
                           e.preventDefault();
                           if (onOpenLink) onOpenLink(sugg.url);
                           else window.open(sugg.url, '_blank');
                        }}
                        className="text-xs text-blue-500 hover:underline inline-block text-left"
                      >
                        Wikipedia
                      </button>
                    )}
                    {sugg.sitoUrl && (
                      <button 
                        onClick={(e) => {
                           e.preventDefault();
                           // ensure http or https
                           let finalUrl = sugg.sitoUrl;
                           if (!finalUrl.startsWith('http')) finalUrl = 'http://' + finalUrl;
                           if (onOpenLink) onOpenLink(finalUrl);
                           else window.open(finalUrl, '_blank');
                        }}
                        className="text-xs text-green-600 hover:underline inline-block text-left"
                      >
                        Sito Ufficiale
                      </button>
                    )}
                  </div>
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
          Nessun suggerimento trovato per questa categoria.
        </div>
      )}
    </div>
  );
}
