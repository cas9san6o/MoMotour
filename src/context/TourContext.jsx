import React, { createContext, useReducer, useEffect } from 'react';
import { calcolaDistanzaOSRM } from '../utils/fuelCalc';
import { stimaPedaggi } from '../utils/tolls';

const initialState = {
  tappe: [],           // Array di oggetti tappa
  itinerari: [],       // Itinerari salvati
  budgetItems: [],     // Voci di budget
  checklist: [],       // Lista oggetti da portare
  attivita: {},        // Oggetto chiave=tappaId
  tourName: "",        // Nome itinerario corrente
  tourType: "generic", // Tipo viaggio
  budgetTotale: 2000,  // Budget totale impostato dall'utente
  distanzaKm: 0,       // Calcolata in background
  pedaggiStima: { total: 0, breakdown: {} } // Calcolata in background
};

const STORAGE_KEY = 'momtour_state';

function loadState() {
  try {
    const item = window.localStorage.getItem(STORAGE_KEY);
    const parsed = item ? JSON.parse(item) : initialState;
    if (parsed.budgetTotale === undefined || parsed.budgetTotale === 0) parsed.budgetTotale = 2000;
    if (parsed.distanzaKm === undefined) parsed.distanzaKm = 0;
    if (parsed.pedaggiStima === undefined) parsed.pedaggiStima = { total: 0, breakdown: {} };
    return parsed;
  } catch (error) {
    console.warn("Failed to load state", error);
    return initialState;
  }
}

function tourReducer(state, action) {
  switch (action.type) {
    case 'CLEAR_ALL':
      return { ...initialState };
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
    case 'SET_TS_ESTIMATES':
      return { ...state, distanzaKm: action.payload.distanzaKm, pedaggiStima: action.payload.pedaggiStima };
    default:
      return state;
  }
}

export const TourContext = createContext(null);

function TourBackgroundSync({ state, dispatch }) {
  useEffect(() => {
    let active = true;
    const fetchDatiPercorso = async () => {
      if (state.tappe.length < 2) {
         if (active && (state.distanzaKm !== 0 || state.pedaggiStima.total !== 0)) {
             dispatch({ type: 'SET_TS_ESTIMATES', payload: { distanzaKm: 0, pedaggiStima: { total: 0, breakdown: {} } }});
         }
         return;
      }
      
      const tappe = [...state.tappe].sort((a,b) => a.ordine - b.ordine);
      const km = await calcolaDistanzaOSRM(tappe);
      const p = await stimaPedaggi(tappe, km);
      
      if(active) {
         dispatch({ type: 'SET_TS_ESTIMATES', payload: { distanzaKm: km, pedaggiStima: p }});
      }
    };
    
    fetchDatiPercorso();
    return () => { active = false; };
  }, [state.tappe, dispatch]); // we trigger on tappe changes

  return null;
}

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
      <TourBackgroundSync state={state} dispatch={dispatch} />
      {children}
    </TourContext.Provider>
  );
}
