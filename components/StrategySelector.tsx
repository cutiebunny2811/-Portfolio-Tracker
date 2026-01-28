import React from 'react';
import { VIEWS, ViewType } from '../types';

interface StrategySelectorProps {
  currentView: ViewType;
  onChange: (s: ViewType) => void;
}

export const StrategySelector: React.FC<StrategySelectorProps> = ({ currentView, onChange }) => {
  return (
    <div className="flex p-1 bg-zinc-900 rounded-xl border border-zinc-800 w-full overflow-x-auto">
      {VIEWS.map((view) => {
        const isActive = currentView === view.value;
        return (
          <button
            key={view.value}
            onClick={() => onChange(view.value)}
            className={`
              flex-1 whitespace-nowrap px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${isActive 
                ? 'bg-zinc-800 text-white shadow-sm ring-1 ring-white/10' 
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
              }
            `}
          >
            {view.label}
          </button>
        );
      })}
    </div>
  );
};