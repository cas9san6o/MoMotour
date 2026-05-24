import React, { useState, useEffect } from 'react';
import { CATEGORIE_ATTIVITA } from '../../utils/categorie';
import { vibrate } from '../../utils/haptics';
import { Check } from 'lucide-react';

export function AttivitaForm({ onSubmit, initialData = null }) {
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('altro');
  const [luogo, setLuogo] = useState('');
  const [costo, setCosto] = useState('');
  const [note, setNote] = useState('');
  const [prenotato, setPrenotato] = useState(false);
  
  const [isShaking, setIsShaking] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (initialData) {
      setNome(initialData.nome || '');
      setCategoria(initialData.categoria || 'altro');
      setLuogo(initialData.luogo || '');
      setCosto(initialData.costo || '');
      setNote(initialData.note || '');
      setPrenotato(initialData.prenotato || false);
    } else {
      setNome('');
      setCategoria('altro');
      setLuogo('');
      setCosto('');
      setNote('');
      setPrenotato(false);
    }
  }, [initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!nome) {
      setIsShaking(true);
      setTimeout(() => setIsShaking(false), 400);
      return;
    }

    const attivita = {
      id: initialData?.id || crypto.randomUUID(),
      nome,
      categoria,
      luogo,
      costo: costo ? parseFloat(costo) : null,
      note,
      prenotato
    };

    vibrate(50);
    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      onSubmit(attivita);
    }, 400);
  };

  return (
    <form onSubmit={handleSubmit} className={`flex flex-col gap-4 ${isShaking ? 'animate-shake' : ''}`}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {Object.values(CATEGORIE_ATTIVITA).map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategoria(cat.id)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                categoria === cat.id 
                  ? `${cat.bg} ${cat.color} ring-2 ring-offset-1 ring-${cat.color.split('-')[1]}-500/50` 
                  : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
              }`}
            >
              <span>{cat.icon}</span> {cat.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Cosa vuoi fare?</label>
        <input 
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Es. Visita al Colosseo"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:bg-white transition-all"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Luogo / Indirizzo (opzionale)</label>
        <input 
          type="text"
          value={luogo}
          onChange={(e) => setLuogo(e.target.value)}
          placeholder="Es. Piazza del Colosseo, 1"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:bg-white transition-all"
        />
      </div>

      <div className="flex gap-4">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">Costo stimato (€)</label>
          <input 
            type="number"
            min="0"
            step="0.01"
            value={costo}
            onChange={(e) => setCosto(e.target.value)}
            placeholder="0.00"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:bg-white transition-all"
          />
        </div>
        <div className="flex-1 flex flex-col justify-end pb-3">
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input 
                type="checkbox" 
                className="sr-only"
                checked={prenotato}
                onChange={(e) => setPrenotato(e.target.checked)}
              />
              <div className={`block w-10 h-6 rounded-full transition-colors ${prenotato ? 'bg-[#00A699]' : 'bg-gray-200'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform ${prenotato ? 'transform translate-x-4' : ''}`}></div>
            </div>
            <span className="text-sm font-medium text-gray-700">Già prenotato</span>
          </label>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Note (opzionale)</label>
        <textarea 
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Es. Portare scarpe comode..."
          rows={2}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-[#FF5A5F] focus:bg-white resize-none"
        />
      </div>

      <button 
        type="submit"
        disabled={isSuccess || !nome}
        className={`w-full mt-2 text-white font-bold py-4 rounded-full transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${
          isSuccess ? 'bg-green-500 animate-success' : 'bg-[#FF5A5F] hover:bg-[#E0484D]'
        }`}
      >
        {isSuccess ? <Check size={24} /> : (initialData?.id ? 'Aggiorna Attività' : 'Aggiungi Attività')}
      </button>
    </form>
  );
}
