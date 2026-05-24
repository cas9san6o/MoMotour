import React, { useState, useContext, useEffect, useMemo } from 'react';
import { TourContext } from '../context/TourContext';
import { BottomSheet } from '../components/shared/BottomSheet';
import { ChecklistItem } from '../components/shared/ChecklistItem';
import { tipiViaggio, categorieSedi, getPrenotazioniForType, getSpecificItemsForType } from '../utils/checklistData';
import { Plus, RotateCcw, Trash2 } from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';

export function MoMolista() {
  const { state, dispatch } = useContext(TourContext);
  
  const [activeCategoryFilter, setActiveCategoryFilter] = useState('tutte');
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [newItemCategory, setNewItemCategory] = useState('varie');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleSelectType = (typeId) => {
    const currentTypes = Array.isArray(state.tourType) 
      ? state.tourType 
      : (state.tourType && state.tourType !== 'generic' ? [state.tourType] : []);
      
    const isActive = currentTypes.includes(typeId);

    if (isActive) {
      // Toggle OFF
      const newTypes = currentTypes.filter(t => t !== typeId);
      dispatch({ type: 'SET_TOUR_TYPE', payload: newTypes });

      const specificItems = getSpecificItemsForType(typeId);
      dispatch({ type: 'UNLOAD_DEFAULT_CHECKLIST', payload: specificItems });
    } else {
      // Toggle ON
      const newTypes = [...currentTypes, typeId];
      dispatch({ type: 'SET_TOUR_TYPE', payload: newTypes });

      const items = getPrenotazioniForType(typeId);
      dispatch({ type: 'LOAD_DEFAULT_CHECKLIST', payload: items });
    }
  };

  const handleToggle = (id) => {
    dispatch({ type: 'TOGGLE_CHECKLIST_ITEM', payload: id });
  };

  const handleDelete = (id) => {
    dispatch({ type: 'REMOVE_CHECKLIST_ITEM', payload: id });
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = state.checklist.findIndex((item) => item.id === active.id);
      const newIndex = state.checklist.findIndex((item) => item.id === over.id);
      dispatch({
        type: 'REORDER_CHECKLIST',
        payload: arrayMove(state.checklist, oldIndex, newIndex),
      });
    }
  };

  const handleResetProgress = () => {
    if(window.confirm("Vuoi deselezionare tutti gli elementi?")) {
      dispatch({ type: 'RESET_CHECKLIST_PROGRESS' });
    }
  };

  const handleClearAll = () => {
    if(window.confirm("Vuoi davvero svuotare l'intera lista? L'azione è irreversibile.")) {
      dispatch({ type: 'CLEAR_CHECKLIST' });
    }
  };

  const addItem = (e) => {
    e.preventDefault();
    if(!newItemText.trim()) return;

    dispatch({
      type: 'ADD_CHECKLIST_ITEM',
      payload: {
        id: crypto.randomUUID(),
        testo: newItemText.trim(),
        categoria: newItemCategory,
        checked: false
      }
    });

    setNewItemText('');
    setIsAddSheetOpen(false);
  };

  const listItems = state.checklist || [];
  
  // Computations
  const filteredItems = useMemo(() => {
    if (activeCategoryFilter === 'tutte') return listItems;
    return listItems.filter(i => i.categoria === activeCategoryFilter);
  }, [listItems, activeCategoryFilter]);

  const checkedCount = listItems.filter(i => i.checked).length;
  const totalCount = listItems.length;
  const progressPercent = totalCount === 0 ? 0 : Math.round((checkedCount / totalCount) * 100);

  // Available categories in the current list
  const activeCategoriesInList = useMemo(() => {
    const categoriesPresent = new Set(listItems.map(i => i.categoria));
    return categorieSedi.filter(c => categoriesPresent.has(c.id));
  }, [listItems]);

  return (
    <div className="flex flex-col h-full min-h-[100dvh] bg-[#F7F7F7] animate-fade-in relative pb-[env(safe-area-inset-bottom)]">
      
      <div className="bg-[#FFB020] text-white px-4 py-8 rounded-b-3xl shadow-sm mb-4 relative overflow-hidden">
        <h1 className="text-3xl font-bold font-heading relative z-10">MoMolista</h1>
        <p className="text-white/90 mt-1 relative z-10">Cosa mettere in valigia?</p>
      </div>

      {/* SELECTOR TIPOLOGIA */}
      <div className="px-4 mb-5">
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2 font-heading">Che tipo di viaggio farai?</h2>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
          {tipiViaggio.map(tipo => {
            const isSelected = Array.isArray(state.tourType) 
              ? state.tourType.includes(tipo.id) 
              : state.tourType === tipo.id;
            
            return (
              <button
                key={tipo.id}
                onClick={() => handleSelectType(tipo.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                  isSelected 
                    ? 'bg-[#FF5A5F] border-[#FF5A5F] text-white shadow-md scale-105'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {tipo.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* HEADER PROGRESSO */}
      <div className="px-4 mb-4">
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-lg">
              {checkedCount}/{totalCount} oggetti pronti 🎒
            </h3>
            <div className="flex gap-1">
              <button 
                onClick={handleResetProgress}
                className="p-2 text-gray-400 hover:text-[#00A699] bg-gray-50 hover:bg-teal-50 rounded-lg transition-colors" 
                title="Deseleziona tutto"
              >
                <RotateCcw size={18} />
              </button>
              <button 
                onClick={handleClearAll}
                className="p-2 text-gray-400 hover:text-[#FF5A5F] bg-gray-50 hover:bg-red-50 rounded-lg transition-colors"
                title="Pulisci lista"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-[#FF5A5F] transition-all duration-300 ease-out" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* CATEGORY FILTER */}
      {activeCategoriesInList.length > 0 && (
        <div className="px-4 mb-2 sticky top-14 z-10 bg-[#F7F7F7] py-2">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            <button
              onClick={() => setActiveCategoryFilter('tutte')}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                activeCategoryFilter === 'tutte' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white border-gray-200 text-gray-600'
              }`}
            >
              Tutte
            </button>
            {activeCategoriesInList.map(cat => (
              <button
                key={cat.id}
                onClick={() => setActiveCategoryFilter(cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1 transition-colors ${
                  activeCategoryFilter === cat.id ? cat.color.replace('bg-', 'bg-opacity-100 bg-').replace('text-', 'text-white border-') : `bg-white border-gray-200 text-gray-600`
                }`}
              >
                 {cat.icon} {cat.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* LISTA */}
      <div className="px-4 pb-32 flex-1 relative">
        {filteredItems.length === 0 ? (
          <div className="text-center py-10">
            <div className="text-4xl mb-3">👻</div>
            <h3 className="font-bold text-gray-800 mb-1">Lista vuota</h3>
            <p className="text-sm text-gray-500">Seleziona un tipo di viaggio o aggiungi voci manualmente.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
            modifiers={[restrictToVerticalAxis]}
          >
            <SortableContext
              items={filteredItems.map(i => i.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-0.5">
                {filteredItems.map((item) => (
                  <ChecklistItem 
                    key={item.id} 
                    item={item} 
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}
      </div>

      {/* FAB ADD */}
      <div className="fixed bottom-20 right-4 z-20 pointer-events-auto">
        <button
          onClick={() => setIsAddSheetOpen(true)}
          className="bg-[#222222] text-white w-14 h-14 rounded-full flex items-center justify-center shadow-[0_4px_14px_rgba(34,34,34,0.4)] transition-transform active:scale-95"
        >
          <Plus size={24} />
        </button>
      </div>

      <BottomSheet isOpen={isAddSheetOpen} onClose={() => setIsAddSheetOpen(false)} title="Nuova Voce">
        <form onSubmit={addItem} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nome oggetto</label>
            <input 
              type="text" 
              value={newItemText} 
              onChange={e => setNewItemText(e.target.value)} 
              placeholder="Es. Spazzolino extra" 
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl" 
              required 
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Categoria</label>
            <div className="grid grid-cols-2 gap-2">
              {categorieSedi.map(c =>(
                <button
                  type="button" key={c.id}
                  onClick={()=>setNewItemCategory(c.id)}
                  className={`py-2 px-3 text-sm rounded-xl border flex items-center gap-2 ${
                    newItemCategory === c.id 
                      ? 'bg-gray-800 border-gray-800 text-white' 
                      : 'bg-white border-gray-200 text-gray-600'
                  }`}
                >
                  {c.icon} <span className="truncate">{c.label}</span>
                </button>
              ))}
            </div>
          </div>
          
          <button type="submit" className="w-full mt-4 bg-[#FF5A5F] text-white font-bold py-4 rounded-full transition-colors active:scale-95">
            Aggiungi alla lista
          </button>
        </form>
      </BottomSheet>
      
    </div>
  );
}
