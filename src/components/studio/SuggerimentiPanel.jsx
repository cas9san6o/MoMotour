import React, { useState, useEffect } from 'react';
import { CATEGORIE_ATTIVITA } from '../../utils/categorie';
import { Badge } from '../shared/Badge';
import { RefreshCw, Plus, Lightbulb } from 'lucide-react';

export function SuggerimentiPanel({ tappa, onAddAttivita }) {
  const [suggerimenti, setSuggerimenti] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryTypeIndex, setQueryTypeIndex] = useState(0);

  const queryTypes = [
    { catId: 'attrazione', query: 'tourism=attraction', radius: 2000, fallbackLimit: 6 },
    { catId: 'ristorante', query: 'amenity=restaurant', radius: 1000, fallbackLimit: 6 },
    { catId: 'museo', query: 'tourism=museum', radius: 2000, fallbackLimit: 6 },
    { catId: 'attivita', query: 'leisure=park', radius: 2000, fallbackLimit: 6 }
  ];

  const fetchSuggerimenti = async (isRefresh = false) => {
    if (!tappa) return;
    
    setLoading(true);
    setError(null);
    
    let currentQueryIndex = queryTypeIndex;
    if (isRefresh) {
      currentQueryIndex = (queryTypeIndex + 1) % queryTypes.length;
      setQueryTypeIndex(currentQueryIndex);
    }

    const { catId, query, radius, fallbackLimit } = queryTypes[currentQueryIndex];

    try {
      // 1. Prova con Overpass API
      const overpassUrl = `https://overpass-api.de/api/interpreter?data=[out:json];node[${query}](around:${radius},${tappa.lat},${tappa.lng});out 8;`;
      
      const response = await fetch(overpassUrl);
      if (!response.ok) throw new Error("Overpass API error");
      
      const data = await response.json();
      
      if (data.elements && data.elements.length > 0) {
        const results = data.elements
          .filter(e => e.tags && e.tags.name)
          .map(e => ({
            id: `overpass-${e.id}`,
            nome: e.tags.name,
            categoria: catId,
            luogo: tappa.nome, // Potremmo usare indirizzo se disponibile, ma così è più pulito
            isFallback: false
          }))
          .slice(0, 8);
          
        if (results.length > 0) {
          setSuggerimenti(results);
          setLoading(false);
          return;
        }
      }
      
      throw new Error("Nessun risultato da Overpass");

    } catch (err) {
      // 2. Fallback su Wikipedia API
      try {
        const wikiUrl = `https://en.wikipedia.org/w/api.php?action=query&list=geosearch&gscoord=${tappa.lat}|${tappa.lng}&gsradius=10000&gslimit=${fallbackLimit}&format=json&origin=*`;
        const wikiResponse = await fetch(wikiUrl);
        if (!wikiResponse.ok) throw new Error("Wiki API error");
        
        const wikiData = await wikiResponse.json();
        
        if (wikiData.query && wikiData.query.geosearch && wikiData.query.geosearch.length > 0) {
          const results = wikiData.query.geosearch.map(article => ({
            id: `wiki-${article.pageid}`,
            nome: article.title,
            categoria: 'attrazione', // Wikipedia è di solito roba culturale/attrazioni
            luogo: tappa.nome,
            distanza: Math.round(article.dist),
            url: `https://en.wikipedia.org/?curid=${article.pageid}`,
            isFallback: true
          }));
          
          setSuggerimenti(results);
        } else {
          setSuggerimenti([]);
        }
      } catch (fallbackErr) {
        setError("Impossibile caricare i suggerimenti al momento.");
        setSuggerimenti([]);
      }
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
            const cat = CATEGORIE_ATTIVITA[sugg.categoria];
            return (
              <div key={sugg.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border border-gray-100 rounded-xl hover:border-gray-200 transition-colors gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={`${cat.bg} ${cat.color} text-[10px]`}>
                      {cat.icon} {cat.label}
                    </Badge>
                    {sugg.distanza && (
                      <span className="text-[10px] text-gray-500">{sugg.distanza}m</span>
                    )}
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
