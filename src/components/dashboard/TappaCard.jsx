import React, { useState, useRef } from 'react';
import { GripVertical, Trash2, ArrowDown, ArrowUp } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

export const TappaCard = React.memo(function TappaCard({ tappa, index, distanzaPrecedente, distanzaSuccessiva, onEdit, onDelete }) {
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

  const dataArrivoFmt = tappa.dataArrivo ? format(parseISO(tappa.dataArrivo), "d MMM", { locale: it }) : '';
  const dataPartenzaFmt = tappa.dataPartenza ? format(parseISO(tappa.dataPartenza), "d MMM", { locale: it }) : '';

  return (
    <div 
      className={`relative mb-3 flex w-full overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100`}
    >
      <div 
        className="absolute inset-y-0 right-0 w-[80px] bg-red-500 flex flex-col justify-center items-center text-white cursor-pointer z-0"
        onClick={() => onDelete(tappa.id)}
      >
        <Trash2 size={24} />
        <span className="text-xs font-medium mt-1">Elimina</span>
      </div>

      <div 
        className="flex w-full bg-white transition-transform duration-200 z-10"
        style={{ transform: `translateX(${swipeOffset}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div 
          className="flex-1 py-4 px-4 cursor-pointer flex justify-between items-center gap-2"
          onClick={() => {
            if (swipeOffset === 0) onEdit(tappa);
          }}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="flex items-center justify-center w-5 h-5 min-w-5 min-h-5 rounded-full bg-[#FF5A5F] text-white text-[10px] font-bold">
                {index + 1}
              </span>
              <h3 className="font-bold text-[#222222] truncate text-base">{tappa.nome}</h3>
            </div>
            <div className="flex flex-col text-sm text-gray-500 ml-7 space-y-1">
              <div className="flex items-center">
                <span>{dataArrivoFmt} - {dataPartenzaFmt}</span>
                <span className="mx-2">•</span>
                <span className="font-medium text-[#00A699]">{tappa.notti} notti</span>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end justify-center text-xs text-gray-400 space-y-1 min-w-max border-l border-gray-100 pl-3">
            {distanzaPrecedente !== null && distanzaPrecedente !== undefined && (
              <div className="flex items-center gap-1" title="Distanza dalla tappa precedente">
                <ArrowDown size={14} className="text-gray-300" />
                <span className="font-mono">{Math.round(distanzaPrecedente)} km</span>
              </div>
            )}
            {distanzaSuccessiva !== null && distanzaSuccessiva !== undefined && (
              <div className="flex items-center gap-1" title="Distanza alla tappa successiva">
                <ArrowUp size={14} className="text-[#00A699]" />
                <span className="font-mono">{Math.round(distanzaSuccessiva)} km</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});
