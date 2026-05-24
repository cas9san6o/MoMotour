import React, { useState, useEffect } from 'react';
import { MapPin, LayoutDashboard, Compass, ChevronRight } from 'lucide-react';

export function Onboarding() {
  const [isVisible, setIsVisible] = useState(false);
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    try {
      const lastShown = window.localStorage.getItem('momtour_onboarding_last');
      const today = new Date().toDateString();
      if (lastShown !== today) {
        setIsVisible(true);
        window.localStorage.setItem('momtour_onboarding_last', today);
      }
    } catch (e) {}
  }, []);

  if (!isVisible) return null;

  const slides = [
    {
      icon: <Compass size={64} className="text-[#FF5A5F] mb-6" />,
      title: "Benvenuto in MoMotour 🗺️",
      text: "Il tuo viaggio, il tuo MOMO, tutto per TE. Organizza in autonomia."
    },
    {
      icon: <MapPin size={64} className="text-[#00A699] mb-6" />,
      title: "Aggiungi le tue tappe",
      text: "Crea il tuo itinerario giorno per giorno e tieni traccia delle tappe sulla mappa."
    },
    {
      icon: <LayoutDashboard size={64} className="text-blue-500 mb-6" />,
      title: "Tutto in un posto",
      text: "Tappe, Alloggi, Budget e Checklist, tutti a portata di mano."
    }
  ];

  const handleNext = () => {
    if (slide < slides.length - 1) {
      setSlide(s => s + 1);
    } else {
      setIsVisible(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[10000] bg-white flex flex-col items-center justify-center p-6 animate-fade-in">
      <div className="flex-1 flex flex-col items-center justify-center text-center max-w-sm w-full transition-all duration-300 transform">
        {slides[slide].icon}
        <h1 className="text-3xl font-bold font-heading mb-4 text-gray-900">{slides[slide].title}</h1>
        <p className="text-gray-500 text-lg">{slides[slide].text}</p>
      </div>
      
      <div className="w-full max-w-sm pb-12 flex flex-col items-center gap-8">
        <div className="flex gap-2">
          {slides.map((_, i) => (
            <div 
              key={i} 
              className={`h-2 rounded-full transition-all duration-300 ${i === slide ? 'w-8 bg-[#FF5A5F]' : 'w-2 bg-gray-200'}`}
            />
          ))}
        </div>
        
        <button 
          onClick={handleNext}
          className="w-full bg-[#FF5A5F] text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-rose-500 transition-colors flex items-center justify-center gap-2 active:scale-95"
        >
          {slide === slides.length - 1 ? "Inizia il tuo tour" : "Avanti"}
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
}
