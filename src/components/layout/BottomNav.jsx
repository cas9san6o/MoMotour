import React from 'react';
import { NavLink } from 'react-router-dom';
import { Map, BookOpen, Calculator, CheckSquare, Hotel } from 'lucide-react';

export function BottomNav() {
  const navItems = [
    { path: "/", icon: <Map size={24} />, label: "Dashboard" },
    { path: "/studio", icon: <BookOpen size={24} />, label: "Studio" },
    { path: "/foglio", icon: <Calculator size={24} />, label: "Foglio" },
    { path: "/lista", icon: <CheckSquare size={24} />, label: "Lista" },
    { path: "/bnb", icon: <Hotel size={24} />, label: "BnB" }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white z-50 flex items-center justify-around border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.02)] pb-[env(safe-area-inset-bottom)]">
      {navItems.map((item) => (
        <NavLink 
          key={item.path}
          to={item.path}
          end={item.path === "/"} // per non matchare sempre Dashboard
          className={({ isActive }) => 
            `flex flex-col items-center justify-center w-full h-full transition-all duration-300 ease-in-out ${
              isActive ? "text-[#FF5A5F]" : "text-gray-400 hover:text-gray-600"
            }`
          }
        >
          <div className="active-icon-wrapper mb-1">
             {item.icon}
          </div>
          <span className="text-[10px] font-medium">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
