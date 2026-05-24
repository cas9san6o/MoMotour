import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';

export function BottomSheet({ isOpen, onClose, title, children }) {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Basic Focus trap on mount
      setTimeout(() => {
         // try to focus first input
         const firstInput = sheetRef.current?.querySelector('input, textarea, select');
         if(firstInput) {
            firstInput.focus();
         }
      }, 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleKeyDown = (e) => {
     if (e.key === 'Escape') {
        onClose();
     }
  };

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/30 z-[60] transition-opacity duration-300"
        onClick={onClose}
      />
      <div 
        ref={sheetRef}
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "sheet-title" : undefined}
        className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl z-[70] shadow-[0_-4px_24px_rgba(0,0,0,0.1)] flex flex-col sheet-open"
        style={{ 
          maxHeight: '90vh',
          animation: 'slideUpSpring 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) forwards'
        }}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <h2 id="sheet-title" className="font-heading font-bold text-lg">{title}</h2>
          <button 
            onClick={onClose}
            aria-label="Chiudi"
            className="p-2 bg-gray-100 rounded-full text-gray-500 hover:bg-gray-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        <div className="p-4 overflow-y-auto shrink-1 pb-[calc(1rem+env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </>
  );
}
