import { useState, useEffect } from 'react';

export function useGeocode(searchQuery) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!searchQuery || searchQuery.length < 3) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setError(null);

      const cacheKey = `geocode_${searchQuery}`;
      const cached = sessionStorage.getItem(cacheKey);
      
      if (cached) {
        setResults(JSON.parse(cached));
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            searchQuery
          )}&format=json&limit=5`,
          {
            headers: {
              'User-Agent': 'MoMotour/1.0',
            },
          }
        );

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();
        const formattedResults = data.map((item) => ({
          lat: parseFloat(item.lat),
          lng: parseFloat(item.lon),
          display_name: item.display_name,
          type: item.type,
        }));

        sessionStorage.setItem(cacheKey, JSON.stringify(formattedResults));
        setResults(formattedResults);
      } catch (err) {
        setError(err.message);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return { results, loading, error };
}
