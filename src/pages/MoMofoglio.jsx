import React, { useState, useContext, useEffect, useMemo } from 'react';
import { TourContext } from '../context/TourContext';
import { BottomSheet } from '../components/shared/BottomSheet';
import { calcolaDistanzaOSRM, calcolaCostoBenzina } from '../utils/fuelCalc';
import { stimaPedaggi } from '../utils/tolls';
import { ChevronDown, Plus, Fuel, Map, Home, Utensils, Ticket, Wallet } from 'lucide-react';

export function MoMofoglio() {
  const { state, dispatch } = useContext(TourContext);
  const [distanzaKm, setDistanzaKm] = useState(0);
  const [pedaggiStima, setPedaggiStima] = useState({ total: 0, breakdown: {} });
  
  // Fuel Config
  const [consumo, setConsumo] = useState(7);
  const [prezzoBenzina, setPrezzoBenzina] = useState(2.0);

  // Manual items sheet
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [newVoce, setNewVoce] = useState({ desc: '', categoria: 'varie', importo: '', tappaId: '' });

  // Load async distance & tolls
  useEffect(() => {
    let active = true;
    const fetchDatiPercorso = async () => {
      const tappe = [...state.tappe].sort((a,b) => a.ordine - b.ordine);
      const km = await calcolaDistanzaOSRM(tappe);
      if(active) setDistanzaKm(km);
      
      const p = await stimaPedaggi(tappe, km);
      if(active) setPedaggiStima(p);
    };
    fetchDatiPercorso();
    return () => { active = false; };
  }, [state.tappe]);

  // Aggregation logic
  const getAttivitaByTappa = () => {
    let items = [];
    Object.keys(state.attivita).forEach(tappaId => {
      const t = state.attivita[tappaId];
      if (t) {
        t.forEach(act => {
          if (act.costo > 0) {
            items.push({
              ...act,
              tappaId,
              tappaNome: state.tappe.find(x => x.id === tappaId)?.nome || 'Tappa Sconosciuta'
            });
          }
        });
      }
    });
    return items;
  };

  const attivitaList = getAttivitaByTappa();
  // Filter activities
  const attivitaCibo = attivitaList.filter(a => a.categoria === 'ristorante');
  const attivitaEsp = attivitaList.filter(a => ['museo', 'natura', 'spettacolo', 'altro'].includes(a.categoria));

  const manualAlloggi = state.budgetItems.filter(b => b.categoria === 'alloggio');
  const manualCibo = state.budgetItems.filter(b => b.categoria === 'cibo');
  const manualEsp = state.budgetItems.filter(b => b.categoria === 'esperienza');
  const manualVarie = state.budgetItems.filter(b => b.categoria === 'varie');

  const sumArray = (arr, field = 'importo') => arr.reduce((acc, curr) => acc + (parseFloat(curr[field]) || 0), 0);
  const sumAtt = (arr) => arr.reduce((acc, curr) => acc + (parseFloat(curr.costo) || 0), 0);

  const costoBenzina = calcolaCostoBenzina(distanzaKm, consumo, prezzoBenzina);
  const costoPedaggi = pedaggiStima.total;
  
  const totaleAlloggi = sumArray(manualAlloggi);
  const totaleCibo = sumArray(manualCibo) + sumAtt(attivitaCibo);
  const totaleEsp = sumArray(manualEsp) + sumAtt(attivitaEsp);
  const totaleVarie = sumArray(manualVarie);

  const totaleGenerale = costoBenzina + costoPedaggi + totaleAlloggi + totaleCibo + totaleEsp + totaleVarie;
  const budget = parseFloat(state.budgetTotale) || 0;
  
  let p = 0;
  if(budget > 0) p = (totaleGenerale / budget) * 100;
  p = Math.min(p, 100);
  
  let barColor = 'bg-[#00A699]';
  if (p > 90) barColor = 'bg-[#FF5A5F]';
  else if (p >= 70) barColor = 'bg-[#FFB020]';

  const handleBudgetChange = (e) => {
    dispatch({ type: 'SET_BUDGET_TOTALE', payload: parseFloat(e.target.value) || 0 });
  };

  const addManualItem = (e) => {
    e.preventDefault();
    if(!newVoce.desc || !newVoce.importo) return;
    
    dispatch({
      type: 'ADD_BUDGET_ITEM',
      payload: {
        id: crypto.randomUUID(),
        desc: newVoce.desc,
        categoria: newVoce.categoria,
        importo: parseFloat(newVoce.importo),
        tappaId: newVoce.tappaId || null
      }
    });
    setNewVoce({ desc: '', categoria: 'varie', importo: '', tappaId: '' });
    setIsSheetOpen(false);
  };

  const removeManualItem = (id) => {
    dispatch({ type: 'REMOVE_BUDGET_ITEM', payload: id });
  };

  const copyToClipboard = () => {
    const text = `MoMotour - Budget: ${state.tourName || 'Tour'}
🛣️ Benzina: €${costoBenzina.toFixed(2)}
🚧 Pedaggi: €${costoPedaggi.toFixed(2)}
🏨 Alloggi: €${totaleAlloggi.toFixed(2)}
🍽️ Cibo: €${totaleCibo.toFixed(2)}
🎭 Esperienze: €${totaleEsp.toFixed(2)}
💸 Varie: €${totaleVarie.toFixed(2)}
💰 TOTALE STIMATO: €${totaleGenerale.toFixed(2)} / Budget: €${budget > 0 ? budget.toFixed(2) : '--'}`;
    
    navigator.clipboard.writeText(text).then(() => {
      alert("Copiato negli appunti!");
    });
  };

  const catOptions = [
    { value: 'alloggio', label: 'Alloggio', icon: '🏨' },
    { value: 'cibo', label: 'Cibo & Ristoranti', icon: '🍽️' },
    { value: 'esperienza', label: 'Attrazioni', icon: '🎭' },
    { value: 'varie', label: 'Varie', icon: '💸' }
  ];

  return (
    <div className="flex flex-col h-full min-h-[100dvh] bg-[#F7F7F7] animate-fade-in relative">
      <div className="bg-[#00A699] text-white px-4 py-8 rounded-b-3xl shadow-sm mb-4">
        <h1 className="text-3xl font-bold font-heading">MoMofoglio</h1>
        <p className="text-white/80 mt-1">Il tuo Budget Tracker Intelligente.</p>
      </div>

      <div className="px-4 pb-32 flex-1 space-y-4">
        
        {/* BUDGET INPUT */}
        <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <label className="block text-sm font-medium text-gray-700 mb-2 font-heading">Budget totale viaggio (€):</label>
          <input 
            type="number" 
            value={state.budgetTotale || ''}
            onChange={handleBudgetChange}
            placeholder="Es. 1500"
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00A699]"
          />
          
          <div className="mt-4">
             <div className="flex justify-between text-sm mb-1 font-medium">
               <span>Totale: €{totaleGenerale.toFixed(2)}</span>
               <span>{budget > 0 ? `di €${budget}` : ''}</span>
             </div>
             <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ease-out ${barColor}`} 
                  style={{ width: `${p}%` }}
                ></div>
             </div>
             {budget > 0 && (
               <div className="text-xs text-gray-500 text-right mt-1">
                 {budget - totaleGenerale >= 0 
                   ? `€${(budget - totaleGenerale).toFixed(2)} rimanenti` 
                   : `€${Math.abs(budget - totaleGenerale).toFixed(2)} oltre budget`
                 }
               </div>
             )}
          </div>
        </div>

        {/* BENZINA */}
        <Accordion title="Benzina" icon={<Fuel size={20} />} amount={costoBenzina}>
           <div className="space-y-4">
              <p className="text-sm font-medium text-gray-700">Distanza stimata: <span className="text-[#FF5A5F]">{Math.round(distanzaKm)} km</span></p>
              
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Consumo (L/100km)</label>
                  <input type="number" step="0.1" value={consumo} onChange={e=>setConsumo(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
                </div>
                <div className="flex-1">
                  <label className="text-xs text-gray-500 mb-1 block">Prezzo (€/L)</label>
                  <input type="number" step="0.01" value={prezzoBenzina} onChange={e=>setPrezzoBenzina(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
                </div>
              </div>
           </div>
        </Accordion>

        {/* PEDAGGI */}
        <Accordion title="Pedaggi" icon={<Map size={20} />} amount={costoPedaggi}>
          <p className="text-xs text-gray-500 mb-3 bg-blue-50 p-2 rounded-lg">⚠️ Stima basata sui paesi attraversati. Verifica i pedaggi reali.</p>
          <div className="space-y-2">
             {Object.entries(pedaggiStima.breakdown).map(([cc, val]) => (
                <div key={cc} className="flex justify-between text-sm border-b border-gray-100 pb-1">
                  <span>🗺️ {cc}</span>
                  <span className="font-medium">€{val.toFixed(2)}</span>
                </div>
             ))}
             {Object.keys(pedaggiStima.breakdown).length === 0 && <p className="text-sm text-gray-400">Nessun paese rilevato (aggiungi tappe).</p>}
          </div>
        </Accordion>

        {/* ALLOGGI */}
        <Accordion title="Alloggi" icon={<Home size={20} />} amount={totaleAlloggi}>
          {manualAlloggi.length === 0 ? <p className="text-sm text-gray-400">Nessuna voce.</p> : 
            manualAlloggi.map(m => <BudgetListItem key={m.id} item={m} onRemove={removeManualItem} />)
          }
        </Accordion>

        {/* CIBO */}
        <Accordion title="Cibo & Ristoranti" icon={<Utensils size={20} />} amount={totaleCibo}>
           {attivitaCibo.length === 0 && manualCibo.length === 0 && <p className="text-sm text-gray-400">Nessuna voce.</p>}
           {attivitaCibo.map(a => (
             <div key={a.id} className="flex justify-between text-sm border-b border-gray-100 pb-2 mb-2 items-center">
               <div>
                  <div className="font-medium">{a.nome}</div>
                  <div className="text-xs text-gray-500 text-left w-[200px] truncate">{a.tappaNome} • (Da MoMo Studio)</div>
               </div>
               <span className="font-medium text-[#FF5A5F]">€{Number(a.costo).toFixed(2)}</span>
             </div>
           ))}
           {manualCibo.map(m => <BudgetListItem key={m.id} item={m} onRemove={removeManualItem} />)}
        </Accordion>

        {/* ESPERIENZE */}
        <Accordion title="Attrazioni & Esperienze" icon={<Ticket size={20} />} amount={totaleEsp}>
           {attivitaEsp.length === 0 && manualEsp.length === 0 && <p className="text-sm text-gray-400">Nessuna voce.</p>}
           {attivitaEsp.map(a => (
             <div key={a.id} className="flex justify-between text-sm border-b border-gray-100 pb-2 mb-2 items-center">
               <div>
                  <div className="font-medium">{a.nome}</div>
                  <div className="text-xs text-gray-500 text-left w-[200px] truncate">{a.tappaNome} • (Da MoMo Studio)</div>
               </div>
               <span className="font-medium text-[#FF5A5F]">€{Number(a.costo).toFixed(2)}</span>
             </div>
           ))}
           {manualEsp.map(m => <BudgetListItem key={m.id} item={m} onRemove={removeManualItem} />)}
        </Accordion>

        {/* VARIE */}
        <Accordion title="Varie" icon={<Wallet size={20} />} amount={totaleVarie}>
          {manualVarie.length === 0 ? <p className="text-sm text-gray-400">Nessuna voce.</p> : 
            manualVarie.map(m => <BudgetListItem key={m.id} item={m} onRemove={removeManualItem} />)
          }
        </Accordion>

      </div>

      {/* FIXED BUTTONS */}
      <div className="fixed bottom-20 left-0 right-0 px-4 flex gap-3 pointer-events-none">
         <button 
           onClick={copyToClipboard}
           className="pointer-events-auto flex-[0.3] bg-white border border-gray-200 text-gray-700 py-4 shadow-lg rounded-full flex items-center justify-center transition-transform active:scale-95"
         >
           📋 Copia
         </button>
         <button 
           onClick={() => setIsSheetOpen(true)}
           className="pointer-events-auto flex-1 bg-[#222222] text-white py-4 shadow-[0_4px_14px_rgba(34,34,34,0.4)] rounded-full flex items-center justify-center gap-2 font-bold transition-transform active:scale-95"
         >
           <Plus size={20} /> Aggiungi voce
         </button>
      </div>

      <BottomSheet isOpen={isSheetOpen} onClose={() => setIsSheetOpen(false)} title="Nuova Spesa Manuale">
        <form onSubmit={addManualItem} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrizione</label>
            <input type="text" value={newVoce.desc} onChange={e=>setNewVoce({...newVoce, desc: e.target.value})} placeholder="Es. Hotel Roma" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
            <div className="grid grid-cols-2 gap-2">
              {catOptions.map(c =>(
                <button
                  type="button" key={c.value}
                  onClick={()=>setNewVoce({...newVoce, categoria: c.value})}
                  className={`py-2 px-3 text-sm rounded-xl border flex items-center gap-2 ${newVoce.categoria === c.value ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-gray-200 text-gray-600'}`}
                >
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Importo (€)</label>
            <input type="number" step="0.01" value={newVoce.importo} onChange={e=>setNewVoce({...newVoce, importo: e.target.value})} placeholder="0.00" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tappa (Opzionale)</label>
            <select value={newVoce.tappaId} onChange={e=>setNewVoce({...newVoce, tappaId: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl">
               <option value="">-- Generale --</option>
               {state.tappe.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <button type="submit" className="w-full mt-2 bg-[#222222] text-white font-bold py-4 rounded-full transition-colors">
            Aggiungi Spesa
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}

function Accordion({ title, icon, amount, children }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full px-4 py-4 flex items-center justify-between bg-white focus:outline-none"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-600">
             {icon}
          </div>
          <span className="font-bold text-gray-800">{title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-medium text-gray-900">€{amount.toFixed(2)}</span>
          <ChevronDown size={18} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-1 animate-fade-in border-t border-gray-50 mt-2 pt-4">
          {children}
        </div>
      )}
    </div>
  );
}

function BudgetListItem({ item, onRemove }) {
  return (
    <div className="flex justify-between text-sm border-b border-gray-100 pb-2 mb-2 items-center group">
       <div className="flex-1">
          <div className="font-medium">{item.desc}</div>
       </div>
       <div className="flex items-center gap-3">
         <span className="font-medium text-gray-900">€{Number(item.importo).toFixed(2)}</span>
         <button onClick={() => onRemove(item.id)} aria-label="Elimina spesa" className="text-gray-400 hover:text-red-500 p-1 rounded-md opacity-50 hover:opacity-100 transition-opacity">
           ✖
         </button>
       </div>
    </div>
  );
}
