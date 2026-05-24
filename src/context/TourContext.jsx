import React, { createContext, useReducer, useEffect } from 'react';

const initialState = {
  tappe: [],           // Array di oggetti tappa
  itinerari: [],       // Itinerari salvati
  budgetItems: [],     // Voci di budget
  checklist: [],       // Lista oggetti da portare
  attivita: {},        // Oggetto chiave=tappaId
  tourName: "",        // Nome itinerario corrente
  tourType: "generic", // Tipo viaggio
  budgetTotale: 0      // Budget totale impostato dall'utente
};

const STORAGE_KEY = 'momtour_state';

function loadState() {
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    const parsed = item ? JSON.parse(item) : initialState;
    if (parsed.budgetTotale === undefined) parsed.budgetTotale = 0;
    return parsed;
  } catch (error) {
    console.warn("Failed to load state", error);
    return initialState;
  }
}

function tourReducer(state, action) {
  switch (action.type) {
    case 'ADD_TAPPA':
      return { ...state, tappe: [...state.tappe, action.payload] };
    case 'REMOVE_TAPPA':
      return { ...state, tappe: state.tappe.filter(t => t.id !== action.payload) };
    case 'UPDATE_TAPPA':
      return { ...state, tappe: state.tappe.map(t => t.id === action.payload.id ? { ...t, ...action.payload } : t) };
    case 'REORDER_TAPPE':
      return { ...state, tappe: action.payload }; 
    case 'SET_TOUR_NAME':
      return { ...state, tourName: action.payload };
    case 'SAVE_ITINERARIO': 
      return { 
        ...state, 
        itinerari: [
          ...state.itinerari, 
          { 
            id: crypto.randomUUID(), 
            name: state.tourName || 'Tour senza nome', 
            date: new Date().toISOString(), 
            data: { ...state, itinerari: [] } 
          }
        ] 
      };
    case 'LOAD_ITINERARIO':
      return { ...state, ...action.payload };
    case 'DELETE_ITINERARIO':
      return { ...state, itinerari: state.itinerari.filter(i => i.id !== action.payload) };
    case 'ADD_BUDGET_ITEM':
      return { ...state, budgetItems: [...state.budgetItems, action.payload] };
    case 'REMOVE_BUDGET_ITEM':
      return { ...state, budgetItems: state.budgetItems.filter(i => i.id !== action.payload) };
    case 'UPDATE_BUDGET_ITEM':
      return { ...state, budgetItems: state.budgetItems.map(i => i.id === action.payload.id ? { ...i, ...action.payload } : i) };
    case 'TOGGLE_CHECKLIST_ITEM':
      return { ...state, checklist: state.checklist.map(i => i.id === action.payload ? { ...i, checked: !i.checked } : i) };
    case 'ADD_CHECKLIST_ITEM':
      return { ...state, checklist: [...state.checklist, action.payload] };
    case 'REMOVE_CHECKLIST_ITEM':
      return { ...state, checklist: state.checklist.filter(i => i.id !== action.payload) };
    case 'REORDER_CHECKLIST':
      return { ...state, checklist: action.payload };
    case 'CLEAR_CHECKLIST':
      return { ...state, checklist: [] };
    case 'RESET_CHECKLIST_PROGRESS':
      return { ...state, checklist: state.checklist.map(i => ({ ...i, checked: false })) };
    case 'LOAD_DEFAULT_CHECKLIST': {
      const existingItems = state.checklist.map(i => `${i.categoria}-${i.testo.toLowerCase()}`);
      const newItems = action.payload.filter(newItem => !existingItems.includes(`${newItem.categoria}-${newItem.testo.toLowerCase()}`));
      return { ...state, checklist: [...state.checklist, ...newItems] };
    }
    case 'UNLOAD_DEFAULT_CHECKLIST': {
      const itemsToRemoveKeys = action.payload.map(i => `${i.categoria}-${i.testo.toLowerCase()}`);
      return {
        ...state,
        checklist: state.checklist.filter(i => 
          !itemsToRemoveKeys.includes(`${i.categoria}-${i.testo.toLowerCase()}`)
        )
      };
    }
    case 'ADD_ATTIVITA': {
      const { tappaId, attivita } = action.payload;
      const tAttivita = state.attivita[tappaId] || [];
      return { ...state, attivita: { ...state.attivita, [tappaId]: [...tAttivita, attivita] } };
    }
    case 'REMOVE_ATTIVITA': {
      const { tappaId, attivitaId } = action.payload;
      const tAttivita = state.attivita[tappaId] || [];
      return { ...state, attivita: { ...state.attivita, [tappaId]: tAttivita.filter(a => a.id !== attivitaId) } };
    }
    case 'UPDATE_ATTIVITA': {
      const { tappaId, attivita } = action.payload;
      const tAttivita = state.attivita[tappaId] || [];
      return { ...state, attivita: { ...state.attivita, [tappaId]: tAttivita.map(a => a.id === attivita.id ? { ...a, ...attivita } : a) } };
    }
    case 'SET_TOUR_TYPE':
      return { ...state, tourType: action.payload };
    case 'SET_BUDGET_TOTALE':
      return { ...state, budgetTotale: action.payload };
    default:
      return state;
  }
}

export const TourContext = createContext(null);

export function TourProvider({ children }) {
  const [state, dispatch] = useReducer(tourReducer, initialState, loadState);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
       console.warn("Failed to set localStorage key", error);
    }
  }, [state]);

  return (
    <TourContext.Provider value={{ state, dispatch }}>
      {children}
    </TourContext.Provider>
  );
}
