import React, { useState, useContext, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { TourContext } from '../context/TourContext';
import { AttivitaCard } from '../components/studio/AttivitaCard';
import { AttivitaForm } from '../components/studio/AttivitaForm';
import { SuggerimentiPanel } from '../components/studio/SuggerimentiPanel';
import { BottomSheet } from '../components/shared/BottomSheet';
import { Plus } from 'lucide-react';

export function MoMoStudio() {
  const { tappaId } = useParams();
  const navigate = useNavigate();
  const { state, dispatch } = useContext(TourContext);
  
  const [selectedTappaId, setSelectedTappaId] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingAttivita, setEditingAttivita] = useState(null);

  const tappe = React.useMemo(() => {
    return [...state.tappe].sort((a, b) => a.ordine - b.ordine);
  }, [state.tappe]);
  
  // Set initial selected tappa based on URL or first available
  useEffect(() => {
    if (tappe.length > 0) {
      if (tappaId && tappe.some(t => t.id === tappaId)) {
        setSelectedTappaId(tappaId);
      } else if (!selectedTappaId) {
        setSelectedTappaId(tappe[0].id);
        navigate(`/studio/${tappe[0].id}`, { replace: true });
      }
    }
  }, [tappaId, tappe, selectedTappaId, navigate]);

  const handleSelectTappa = (id) => {
    setSelectedTappaId(id);
    navigate(`/studio/${id}`);
  };

  const selectedTappa = tappe.find(t => t.id === selectedTappaId);
  const attivitaList = selectedTappaId ? (state.attivita[selectedTappaId] || []) : [];

  const handleSaveAttivita = React.useCallback((attivitaProps) => {
    if (!selectedTappaId) return;

    if (editingAttivita?.id) {
      dispatch({ 
        type: 'UPDATE_ATTIVITA', 
        payload: { tappaId: selectedTappaId, attivita: attivitaProps } 
      });
    } else {
      dispatch({ 
        type: 'ADD_ATTIVITA', 
        payload: { tappaId: selectedTappaId, attivita: attivitaProps } 
      });
    }
    setIsSheetOpen(false);
    setEditingAttivita(null);
  }, [selectedTappaId, editingAttivita?.id, dispatch]);

  const handleDeleteAttivita = React.useCallback((attivitaId) => {
    if (!selectedTappaId) return;
    dispatch({ 
      type: 'REMOVE_ATTIVITA', 
      payload: { tappaId: selectedTappaId, attivitaId } 
    });
  }, [selectedTappaId, dispatch]);

  const handleTogglePrenotato = React.useCallback((attivita) => {
    if (!selectedTappaId) return;
    dispatch({
      type: 'UPDATE_ATTIVITA',
      payload: { 
        tappaId: selectedTappaId, 
        attivita: { ...attivita, prenotato: !attivita.prenotato } 
      }
    });
  }, [selectedTappaId, dispatch]);

  const openAddSheet = React.useCallback((initialData = null) => {
    setEditingAttivita(initialData);
    setIsSheetOpen(true);
  }, []);

  if (tappe.length === 0) {
    return (
      <div className="p-4 flex flex-col items-center justify-center h-full min-h-[60vh] animate-fade-in text-center">
        <div className="text-6xl mb-4">🗺️</div>
        <h2 className="text-xl font-bold font-heading mb-2 text-[#222222]">Nessuna tappa</h2>
        <p className="text-gray-500 max-w-xs">Aggiungi prima le tappe del tuo tour nella Dashboard per poter organizzare le attività.</p>
        <button 
          onClick={() => navigate('/')}
          className="mt-6 px-6 py-3 bg-[#FF5A5F] text-white font-bold rounded-full hover:bg-[#E0484D] transition-colors"
        >
          Vai alla Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-[100dvh] bg-[#F7F7F7] animate-fade-in">
      <div className="bg-[#FF5A5F] text-white px-4 py-8 rounded-b-3xl shadow-sm mb-2">
        <h1 className="text-3xl font-bold font-heading">MoMo Studio</h1>
        <p className="text-white/80 mt-1">Pianifica le tue attività tappa per tappa.</p>
      </div>

      {/* HEADER STICKY CON SELECTOR TAPPE */}
      <div className="sticky top-14 left-0 right-0 z-20 bg-[#F7F7F7] border-b border-gray-100 shadow-sm px-4 py-3 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {tappe.map((tappa, index) => (
            <button
              key={tappa.id}
              onClick={() => handleSelectTappa(tappa.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors border ${
                selectedTappaId === tappa.id 
                  ? 'bg-[#FF5A5F] text-white border-[#FF5A5F]' 
                  : 'bg-white text-gray-600 border-gray-200 hover:border-[#FF5A5F]/50 hover:bg-red-50'
              }`}
            >
              {index + 1}. {tappa.nome}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 pb-24 flex-1 overflow-y-auto">
        <div className="mb-4">
          <h2 className="text-xl font-bold font-heading text-[#222222]">Le tue attività</h2>
          <p className="text-sm text-gray-500">{selectedTappa?.nome || ''}</p>
        </div>

        {attivitaList.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white rounded-2xl border border-gray-100 shadow-sm mb-8">
             <div className="text-4xl mb-3">📅</div>
             <h3 className="font-bold text-[#222222] mb-1">Cosa vuoi fare?</h3>
             <p className="text-gray-500 text-sm">Aggiungi ristoranti, musei o esperienze per questa tappa.</p>
          </div>
        ) : (
          <div className="space-y-3 mb-8">
            {attivitaList.map((attivita, idx) => (
              <AttivitaCard
                key={attivita.id || `attivita-fallback-${idx}`}
                attivita={attivita}
                onEdit={(a) => openAddSheet(a)}
                onDelete={handleDeleteAttivita}
                onTogglePrenotato={handleTogglePrenotato}
              />
            ))}
          </div>
        )}

        <SuggerimentiPanel 
          tappa={selectedTappa} 
          onAddAttivita={(sugg) => {
            const { id, ...suggWithoutId } = sugg;
            openAddSheet(suggWithoutId);
          }} 
        />
      </div>

      {/* FAB - Aggiungi Attività */}
      <button 
        onClick={() => openAddSheet(null)}
        className="fixed bottom-20 right-4 z-30 w-14 h-14 bg-[#FF5A5F] hover:bg-[#E0484D] text-white rounded-full flex items-center justify-center shadow-[0_4px_14px_rgba(255,90,95,0.4)] transition-all active:scale-90"
        aria-label="Aggiungi Attività"
      >
        <Plus size={28} />
      </button>

      {/* BOTTOM SHEET FORM */}
      <BottomSheet 
        isOpen={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)}
        title={editingAttivita?.id ? "Modifica Attività" : "Nuova Attività"}
      >
        <AttivitaForm 
          initialData={editingAttivita} 
          onSubmit={handleSaveAttivita} 
        />
      </BottomSheet>
    </div>
  );
}
