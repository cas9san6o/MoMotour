import React, { useState, useRef } from 'react';
import { CATEGORIE_ATTIVITA } from '../../utils/categorie';
import { Badge } from '../shared/Badge';
import { Trash2, CheckCircle2, Circle } from 'lucide-react';

export function AttivitaCard({ attivita, onEdit, onDelete, onTogglePrenotato }) {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const swipeStartX = useRef(null);
  const swipeCurrentX = useRef(null);
  const isSwiping = useRef(false);

  const SWIPE_THRESHOLD = 80;

  const handleTouchStart = (e) => {
    isSwiping.current = true;
    swipeStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    if (!isSwiping.current) return;
    swipeCurrentX.current = e.touches[0].clientX;
    const diff = swipeStartX.current - swipeCurrentX.current;
    
    // Allow swipe left (positive diff) up to threshold
    if (diff > 0 && diff <= SWIPE_THRESHOLD + 20) {
      setSwipeOffset(-diff);
    }
  };

  const handleTouchEnd = () => {
    isSwiping.current = false;
    if (swipeOffset < -SWIPE_THRESHOLD / 2) {
      setSwipeOffset(-SWIPE_THRESHOLD);
    } else {
      setSwipeOffset(0);
    }
  };

  const cat = CATEGORIE_ATTIVITA[attivita.categoria] || CATEGORIE_ATTIVITA.altro;

  return (
    <div className="relative mb-3 flex w-full overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100">
      <div 
        className="absolute inset-y-0 right-0 w-[80px] bg-red-500 flex flex-col justify-center items-center text-white cursor-pointer z-0"
        onClick={() => onDelete(attivita.id)}
      >
        <Trash2 size={24} />
        <span className="text-xs font-medium mt-1">Elimina</span>
      </div>

      <div 
        className="flex w-full bg-white transition-transform duration-200 z-10 p-4"
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (swipeOffset === 0) onEdit(attivita);
        }}
      >
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2 mb-2">
            <Badge className={`${cat.bg} ${cat.color}`}>
              {cat.icon} {cat.label}
            </Badge>
            {attivita.costo && (
              <span className="text-sm font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-full">
                €{attivita.costo}
              </span>
            )}
          </div>
          <h3 className="font-bold text-[#222222] truncate text-base mb-1">{attivita.nome}</h3>
          {attivita.luogo && (
            <p className="text-sm text-gray-500 truncate">{attivita.luogo}</p>
          )}
          {attivita.note && (
            <p className="text-xs text-gray-400 truncate mt-1">{attivita.note}</p>
          )}
        </div>
        
        <div className="flex items-center justify-center shrink-0">
          <button 
            type="button"
            className="p-2 -mr-2"
            onClick={(e) => {
              e.stopPropagation();
              onTogglePrenotato(attivita);
            }}
          >
            {attivita.prenotato ? (
              <div className="flex flex-col items-center gap-1">
                <CheckCircle2 size={24} className="text-[#00A699]" />
                <span className="text-[10px] text-[#00A699] font-medium">Prenotato</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1">
                <Circle size={24} className="text-gray-300" />
                <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">Da prenotare</span>
              </div>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
