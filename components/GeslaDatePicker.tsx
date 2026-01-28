import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, X } from 'lucide-react';

interface GeslaDatePickerProps {
  label: string;
  value: string | undefined;
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const GeslaDatePicker: React.FC<GeslaDatePickerProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder = "SELECIONE", 
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date()); 
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      // Tenta corrigir fuso horário se vier apenas YYYY-MM-DD
      const parts = value.split('T')[0].split('-');
      if (parts.length === 3) {
         const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
         setCurrentDate(d);
      } else {
         const d = new Date(value);
         if (!isNaN(d.getTime())) setCurrentDate(d);
      }
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const daysInMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

  const handleDateClick = (day: number) => {
    // Retorna no formato YYYY-MM-DD
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    onChange(`${year}-${month}-${d}`);
    setIsOpen(false);
  };

  const changeMonth = (offset: number) => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1));
  };

  const renderCalendar = () => {
    const totalDays = daysInMonth(currentDate);
    const startDay = firstDayOfMonth(currentDate);
    const days = [];

    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8"></div>);
    }

    for (let i = 1; i <= totalDays; i++) {
      const dayStr = String(i).padStart(2, '0');
      const monthStr = String(currentDate.getMonth() + 1).padStart(2, '0');
      const yearStr = currentDate.getFullYear();
      const dateStr = `${yearStr}-${monthStr}-${dayStr}`;
      
      // Simple check, assumindo value YYYY-MM-DD
      const isSelected = value && value.startsWith(dateStr);

      days.push(
        <button
          key={i}
          type="button"
          onClick={(e) => { e.stopPropagation(); handleDateClick(i); }}
          className={`
            w-8 h-8 flex items-center justify-center rounded-lg text-[10px] font-bold transition-all
            ${isSelected 
              ? 'bg-brand-accent text-white shadow-lg' 
              : 'text-brand-navy dark:text-white hover:bg-slate-100 dark:hover:bg-white/10'
            }
          `}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  const formatDisplayDate = (val: string | undefined) => {
      if (!val) return '';
      // Parse manual to avoid timezone issues with Date()
      const parts = val.split('T')[0].split('-');
      if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      const d = new Date(val);
      return !isNaN(d.getTime()) ? d.toLocaleDateString('pt-BR') : '';
  };

  return (
    <div className={`relative group ${disabled ? 'opacity-60 pointer-events-none' : ''}`} ref={containerRef}>
      <div className={`absolute -inset-0.5 bg-gradient-to-r from-brand-accent to-brand-navy rounded-2xl opacity-0 transition-all duration-500 blur-sm group-hover:opacity-20 ${isOpen ? 'opacity-30' : ''}`}></div>
      
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          relative flex items-center bg-white dark:bg-[#020617] rounded-2xl border transition-all duration-300 h-[52px] cursor-pointer overflow-hidden
          ${isOpen 
            ? 'border-brand-accent shadow-[0_0_20px_rgba(var(--color-brand-accent),0.1)]' 
            : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
          }
        `}
      >
        <div className={`pl-4 pr-3 transition-colors duration-300 ${isOpen ? 'text-brand-accent' : 'text-slate-400'}`}>
          <CalendarIcon size={18} />
        </div>
        
        <div className="flex-1 relative h-full flex items-center pt-3">
           <span className={`text-xs font-bold font-data uppercase tracking-wider ${value ? 'text-brand-navy dark:text-white' : 'text-transparent'}`}>
              {formatDisplayDate(value) || placeholder}
           </span>
           <label className={`
              absolute left-0 top-2 text-[9px] font-black text-slate-400 uppercase tracking-widest transition-all duration-300 pointer-events-none
              ${value ? 'top-1.5 text-[8px]' : 'top-4 text-[10px]'}
              ${isOpen ? '!top-1.5 !text-[8px] !text-brand-accent' : ''}
           `}>
              {label}
           </label>
        </div>

        {value && !disabled && (
           <button 
              type="button"
              onClick={(e) => { e.stopPropagation(); onChange(''); }}
              className="pr-4 text-slate-400 hover:text-red-500 transition-colors"
           >
              <X size={14} />
           </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 bg-white dark:bg-[#0f172a] rounded-2xl shadow-2xl border border-slate-100 dark:border-white/10 p-4 z-[60] min-w-[280px] animate-in zoom-in-95 duration-200">
           <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100 dark:border-white/5">
              <button type="button" onClick={(e) => { e.stopPropagation(); changeMonth(-1); }} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-500">
                 <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-black uppercase text-brand-navy dark:text-white tracking-widest">
                 {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </span>
              <button type="button" onClick={(e) => { e.stopPropagation(); changeMonth(1); }} className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-500">
                 <ChevronRight size={16} />
              </button>
           </div>

           <div className="grid grid-cols-7 mb-2 text-center">
              {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                 <span key={d} className="text-[9px] font-black text-slate-400">{d}</span>
              ))}
           </div>

           <div className="grid grid-cols-7 gap-1">
              {renderCalendar()}
           </div>
        </div>
      )}
    </div>
  );
};

export default GeslaDatePicker;