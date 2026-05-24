import React, { useState, useContext, useEffect } from 'react';
import { TourContext } from '../context/TourContext';
import { MapView } from '../components/dashboard/MapView';
import { TappaCard } from '../components/dashboard/TappaCard';
import { TappaForm } from '../components/dashboard/TappaForm';
import { BottomSheet } from '../components/shared/BottomSheet';
import { calcolaDistanzaDettagliataOSRM } from '../utils/fuelCalc';
import { Plus } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

export function Dashboard() {
  const { state, dispatch } = useContext(TourContext);
  const [viewMode, setViewMode] = useState('split');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTappa, setEditingTappa] = useState(null);
  const [legDistances, setLegDistances] = useState([]);

  const tappe = [...state.tappe].sort((a, b) => a.ordine - b.ordine);

  useEffect(() => {
    let active = true;
    const fetchDistances = async () => {
      if (tappe.length > 1) {
        const data = await calcolaDistanzaDettagliataOSRM(tappe);
        if (active) setLegDistances(data.legs);
      } else {
        if (active) setLegDistances([]);
      }
    };
    fetchDistances();
    return () => { active = false; };
  }, [state.tappe]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5, // 5px tolerance prima del drag per evitare trigger accidentali su click
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;

    if (active.id !== over.id) {
      const oldIndex = tappe.findIndex((t) => t.id === active.id);
      const newIndex = tappe.findIndex((t) => t.id === over.id);

      const reorderedTappe = arrayMove(tappe, oldIndex, newIndex).map(
        (t, idx) => ({ ...t, ordine: idx })
      );

      dispatch({ type: 'REORDER_TAPPE', payload: reorderedTappe });
    }
  };

  const handleSaveTappa = (tappaProps) => {
    if (editingTappa) {
      dispatch({ type: 'UPDATE_TAPPA', payload: tappaProps });
    } else {
      const nuovaTappa = { ...tappaProps, ordine: tappe.length };
      dispatch({ type: 'ADD_TAPPA', payload: nuovaTappa });
    }
    setIsSheetOpen(false);
    setEditingTappa(null);
  };

  const handleDeleteTappa = (id) => {
    try {
        window.navigator.vibrate([50, 30, 50]);
    } catch(e) {}
    dispatch({ type: 'REMOVE_TAPPA', payload: id });
    // Aggiorna gli ordini
    const remaining = state.tappe.filter(t => t.id !== id).sort((a, b) => a.ordine - b.ordine);
    const updated = remaining.map((t, index) => ({ ...t, ordine: index }));
    dispatch({ type: 'REORDER_TAPPE', payload: updated });
  };

  const openAddSheet = () => {
    setEditingTappa(null);
    setIsSheetOpen(true);
  };

  const openEditSheet = (tappa) => {
    setEditingTappa(tappa);
    setIsSheetOpen(true);
  };

  const handleToggleView = () => {
    if (viewMode === 'split') setViewMode('map');
    else if (viewMode === 'map') setViewMode('list');
    else setViewMode('split');
  };

  // Layout heights based on viewMode
  const mapHeight = viewMode === 'split' ? '45vh' : viewMode === 'map' ? '100vh' : '0vh';
  const listPaddingTop = viewMode === 'split' ? '45vh' : viewMode === 'map' ? '100vh' : '0';

  return (
    <div className="relative min-h-[100dvh] bg-[#F7F7F7] overflow-hidden">
      {/* SEZIONE MAPPA */}
      <div 
        role="region"
        aria-label="Mappa del Tour"
        className="fixed top-14 left-0 right-0 z-10 transition-all duration-500 ease-in-out"
        style={{ height: mapHeight, opacity: viewMode === 'list' ? 0 : 1, pointerEvents: viewMode === 'list' ? 'none' : 'auto' }}
      >
        <MapView tappe={tappe} onEditClick={openEditSheet} />
      </div>

      {/* DIVISORE (Toggle pill) */}
      <div 
        className="fixed left-0 right-0 z-20 flex justify-center transition-all duration-500 ease-in-out drop-shadow-md"
        style={{ top: viewMode === 'list' ? '5rem' : `calc(${mapHeight} + 2rem)` }}
      >
        <button 
          onClick={handleToggleView}
          className="bg-white px-5 py-2 rounded-full text-sm font-semibold text-[#222222] shadow-[0_4px_12px_rgba(0,0,0,0.1)] border border-gray-100 transition-transform active:scale-95"
        >
          {viewMode === 'split' ? '⟵ Mappa | Lista ⟶' : viewMode === 'map' ? '↓ Mostra Lista' : '↑ Mostra Mappa'}
        </button>
      </div>

      {/* SEZIONE LISTA */}
      <div 
        role="region"
        aria-label="Lista delle Tappe"
        className="relative z-0 h-full w-full overflow-y-auto pb-32 transition-all duration-500 ease-in-out"
        style={{ paddingTop: `calc(${listPaddingTop} + 1rem)` }}
      >
        <div className="px-4 mt-8 pb-8">
          <h2 className="text-xl font-bold font-heading mb-4 text-[#222222]">Il tuo Itinerario</h2>
          
          {tappe.length === 0 ? (
            <div className="text-center py-10 px-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
               <div className="text-4xl mb-3">🌍</div>
               <h3 className="font-bold text-lg text-[#222222] mb-1">Nessuna tappa</h3>
               <p className="text-gray-500 text-sm">Aggiungi la tua prima destinazione per iniziare a pianificare.</p>
            </div>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={tappe.map(t => t.id)}
                strategy={verticalListSortingStrategy}
              >
                {tappe.map((tappa, index) => (
                  <TappaCard 
                    key={tappa.id} 
                    tappa={tappa} 
                    index={index} 
                    distanzaPrecedente={index > 0 ? legDistances[index - 1] : null}
                    distanzaSuccessiva={index < legDistances.length ? legDistances[index] : null}
                    onEdit={openEditSheet} 
                    onDelete={handleDeleteTappa} 
                  />
                ))}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>

      {/* FAB - Aggiungi Tappa */}
      <button 
        onClick={openAddSheet}
        className="fixed bottom-20 right-4 z-30 w-14 h-14 bg-[#FF5A5F] hover:bg-[#E0484D] text-white rounded-full flex items-center justify-center shadow-[0_4px_14px_rgba(255,90,95,0.4)] transition-all active:scale-90"
        aria-label="Aggiungi Tappa"
      >
        <Plus size={28} />
      </button>

      {/* BOTTOM SHEET FORM */}
      <BottomSheet 
        isOpen={isSheetOpen} 
        onClose={() => setIsSheetOpen(false)}
        title={editingTappa ? "Modifica Tappa" : "Nuova Tappa"}
      >
        <TappaForm 
          initialData={editingTappa} 
          onSubmit={handleSaveTappa} 
        />
      </BottomSheet>
    </div>
  );
}
