import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import { categorieSedi } from '../../utils/checklistData';

export function ChecklistItem({ item, onToggle, onDelete }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
  };

  const catData = categorieSedi.find(c => c.id === item.categoria) || categorieSedi[7]; // default varie

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 mb-2 bg-white rounded-xl shadow-sm border ${isDragging ? 'border-[#00A699] opacity-70 scale-[1.02]' : 'border-gray-100'} transition-all`}
    >
      <div className="flex flex-1 items-center gap-3 overflow-hidden pr-2">
        {/* DRAG HANDLE */}
        <div {...attributes} {...listeners} className="text-gray-300 cursor-grab active:cursor-grabbing touch-none p-1">
          <GripVertical size={18} />
        </div>

        {/* CHECKBOX CUSTOM */}
        <button
          onClick={() => onToggle(item.id)}
          className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
            item.checked ? 'border-[#FF5A5F] bg-[#FF5A5F]' : 'border-gray-300 bg-transparent'
          }`}
        >
          {item.checked && (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          )}
        </button>

        {/* TESTO E BADGE */}
        <div className="flex flex-col flex-1 min-w-0" onClick={() => onToggle(item.id)}>
          <span className={`text-sm select-none truncate transition-all duration-300 ${item.checked ? 'line-through opacity-50 text-gray-500' : 'text-gray-900 font-medium'}`}>
            {item.testo}
          </span>
          <div className="flex mt-1">
             <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 w-max ${catData.color}`}>
                {catData.icon} {catData.label}
             </span>
          </div>
        </div>
      </div>

      {/* TASTO ELIMINA */}
      <button
        onClick={() => onDelete(item.id)}
        className="flex-shrink-0 p-2 text-gray-400 hover:text-red-500 transition-colors rounded-lg bg-gray-50 hover:bg-red-50"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
