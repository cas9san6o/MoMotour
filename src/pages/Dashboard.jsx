import React, { useState, useContext, useEffect } from 'react';
import { TourContext } from '../context/TourContext';
import { MapView } from '../components/dashboard/MapView';
import { TappaCard } from '../components/dashboard/TappaCard';
import { TappaForm } from '../components/dashboard/TappaForm';
import { BottomSheet } from '../components/shared/BottomSheet';
import { calcolaDistanzaDettagliataOSRM } from '../utils/fuelCalc';
import { Plus, AlertTriangle, X } from 'lucide-react';

export function Dashboard() {
  const { state, dispatch } = useContext(TourContext);
  const [viewMode, setViewMode] = useState('split');
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTappa, setEditingTappa] = useState(null);
  const [legDistances, setLegDistances] = useState([]);
  
  const [conflictModal, setConflictModal] = useState({ isOpen: false, pendingTappa: null, conflictingWith: null });

  // Tappe automatically sorted by dataArrivo
  const tappe = React.useMemo(() => {
    return [...state.tappe].sort((a, b) => new Date(a.dataArrivo) - new Date(b.dataArrivo));
  }, [state.tappe]);

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
  }, [tappe]);

  const checkConflict = (newTappa) => {
     // A conflict is when t.dataArrivo < newTappa.dataPartenza && t.dataPartenza > newTappa.dataArrivo
     // Note: if A leaves at 10 and B arrives at 10, it's not a conflict. So use < and > (not <= and >=)
     return tappe.find(t => 
        t.id !== newTappa.id && 
        new Date(t.dataArrivo) < new Date(newTappa.dataPartenza) && 
        new Date(t.dataPartenza) > new Date(newTappa.dataArrivo)
     );
  };

  const processSave = (tappaProps) => {
    let reorderedList;
    if (editingTappa) {
      dispatch({ type: 'UPDATE_TAPPA', payload: tappaProps });
      reorderedList = state.tappe.map(t => t.id === tappaProps.id ? tappaProps : t);
    } else {
      reorderedList = [...state.tappe, { ...tappaProps, ordine: 0 }];
      dispatch({ type: 'ADD_TAPPA', payload: { ...tappaProps, ordine: 0 } });
    }
    
    // Auto-update ordine of all tappe based on new chronological sorting
    const sorted = [...reorderedList].sort((a, b) => new Date(a.dataArrivo) - new Date(b.dataArrivo));
    const sortedWithOrder = sorted.map((t, idx) => ({ ...t, ordine: idx }));
    dispatch({ type: 'REORDER_TAPPE', payload: sortedWithOrder });
    
    setIsSheetOpen(false);
    setEditingTappa(null);
  };

  const handleSaveTappa = React.useCallback((tappaProps) => {
    const conflict = checkConflict(tappaProps);
    if (conflict) {
       setConflictModal({ isOpen: true, pendingTappa: tappaProps, conflictingWith: conflict });
    } else {
       processSave(tappaProps);
    }
  }, [editingTappa, dispatch, tappe]);

  const persistConflictSave = () => {
     if(conflictModal.pendingTappa) {
         processSave(conflictModal.pendingTappa);
     }
     setConflictModal({ isOpen: false, pendingTappa: null, conflictingWith: null });
  };
  
  const cancelConflictSave = () => {
      setConflictModal({ isOpen: false, pendingTappa: null, conflictingWith: null });
      setIsSheetOpen(true); // reopen the form
  };

  const handleDeleteTappa = React.useCallback((id) => {
    try {
        window.navigator.vibrate([50, 30, 50]);
    } catch(e) {}
    dispatch({ type: 'REMOVE_TAPPA', payload: id });
    const remaining = tappe.filter(t => t.id !== id);
    const updated = remaining.map((t, index) => ({ ...t, ordine: index }));
    dispatch({ type: 'REORDER_TAPPE', payload: updated });
  }, [tappe, dispatch]);

  const openAddSheet = React.useCallback(() => {
    setEditingTappa(null);
    setIsSheetOpen(true);
  }, []);

  const openEditSheet = React.useCallback((tappa) => {
    setEditingTappa(tappa);
    setIsSheetOpen(true);
  }, []);

  const handleToggleView = () => {
    if (viewMode === 'split') setViewMode('map');
    else if (viewMode === 'map') setViewMode('list');
    else setViewMode('split');
  };

  const mapHeight = viewMode === 'split' ? '45vh' : viewMode === 'map' ? '100vh' : '0vh';
  const listPaddingTop = viewMode === 'split' ? '45vh' : viewMode === 'map' ? '100vh' : '0';

  const lastTappaDataPartenza = tappe.length > 0 ? tappe[tappe.length - 1].dataPartenza : null;

  return (
    <div className="relative min-h-[100dvh] bg-[#F7F7F7] overflow-hidden">
      <div 
        role="region"
        aria-label="Mappa del Tour"
        className="fixed top-14 left-0 right-0 z-10 transition-all duration-500 ease-in-out"
        style={{ height: mapHeight, opacity: viewMode === 'list' ? 0 : 1, pointerEvents: viewMode === 'list' ? 'none' : 'auto' }}
      >
        <MapView tappe={tappe} onEditClick={openEditSheet} />
      </div>

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
             <div className="flex flex-col gap-3">
                {tappe.map((tappa, index) => {
                   const hasGapAfter = index < tappe.length - 1 && 
                                       new Date(tappa.dataPartenza).setHours(0,0,0,0) < new Date(tappe[index+1].dataArrivo).setHours(0,0,0,0);
                   return (
                     <React.Fragment key={tappa.id}>
                        <TappaCard 
                          tappa={tappa} 
                          index={index} 
                          distanzaPrecedente={index > 0 ? legDistances[index - 1] : null}
                          distanzaSuccessiva={index < legDistances.length ? legDistances[index] : null}
                          onEdit={openEditSheet} 
                          onDelete={handleDeleteTappa} 
                        />
                        {hasGapAfter && (
                           <div className="flex justify-center items-center py-2 text-orange-500 text-xs font-medium bg-orange-50 rounded-xl my-1 border border-orange-100">
                               <AlertTriangle size={14} className="mr-1" />  Attenzione: ci sono giorni mancanti tra queste tappe!
                           </div>
                        )}
                     </React.Fragment>
                   );
                })}
             </div>
          )}
        </div>
      </div>

      <button 
        onClick={openAddSheet}
        className="fixed bottom-20 right-4 z-30 w-14 h-14 bg-[#FF5A5F] hover:bg-[#E0484D] text-white rounded-full flex items-center justify-center shadow-[0_4px_14px_rgba(255,90,95,0.4)] transition-all active:scale-90"
        aria-label="Aggiungi Tappa"
      >
        <Plus size={28} />
      </button>

      <BottomSheet 
        isOpen={isSheetOpen && !conflictModal.isOpen} 
        onClose={() => setIsSheetOpen(false)}
        title={editingTappa ? "Modifica Tappa" : "Nuova Tappa"}
      >
        <TappaForm 
          initialData={editingTappa} 
          lastTappaDataPartenza={lastTappaDataPartenza}
          onSubmit={handleSaveTappa} 
        />
      </BottomSheet>
      
      {/* Modal Conflitto Date */}
      {conflictModal.isOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
             <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden p-6 shadow-xl animate-scale-up">
                 <div className="bg-orange-100 w-12 h-12 flex items-center justify-center rounded-full mb-4">
                     <AlertTriangle className="text-orange-600" size={24} />
                 </div>
                 <h3 className="text-xl font-bold text-gray-900 mb-2">Conflitto di date</h3>
                 <p className="text-gray-600 mb-6 text-sm">
                   La tappa inserita si sovrappone temporalmente con <strong>{conflictModal.conflictingWith?.nome}</strong>. Vuoi proseguire e forzare il salvataggio comunque? L'ordinamento sarà sfalsato.
                 </p>
                 <div className="flex flex-col gap-3">
                    <button onClick={persistConflictSave} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-xl transition-colors">
                        Forza Salvataggio
                    </button>
                    <button onClick={cancelConflictSave} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-3 px-4 rounded-xl transition-colors">
                        Modifica Date
                    </button>
                 </div>
             </div>
         </div>
      )}
    </div>
  );
}
