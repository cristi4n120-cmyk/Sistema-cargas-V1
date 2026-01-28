
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
  const [currentDate, setCurrentDate] = useState(new Date()); // Para navegação (Mês/Ano visualizado)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Sincroniza o valor externo com o estado interno
  useEffect(() => {
    if (value) {
      const date = new Date(value);
      // Ajuste de fuso horário para garantir que a data visualizada seja a mesma da string YYYY-MM-DD
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
      
      setSelectedDate(adjustedDate);
      setCurrentDate(adjustedDate); // Foca o calendário na data selecionada
    } else {
      setSelectedDate(null);
    }
  }, [value]);

  // Fecha ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Lógica do Calendário
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
    // Retorna string YYYY-MM-DD para compatibilidade com inputs nativos/backend
    const year = newDate.getFullYear();
    const month =String(newDate.getMonth() + 1).padStart(2, '0');
    const d = String(newDate.getDate()).padStart(2, '0');
    
    onChange(`${year}-${month}-${d}`);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
    setIsOpen(false);
  };

  // Renderização dos dias
  const renderDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const startDay = getFirstDayOfMonth(year, month);
    
    const days = [];
    const today = new Date();

    // Dias vazios do início do mês
    for (let i = 0; i < startDay; i++) {
      days.push(<div key={`empty-${i}`} className="w-8 h-8" />);
    }

    // Dias do mês
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = selectedDate && 
        selectedDate.getDate() === i && 
        selectedDate.getMonth() === month && 
        selectedDate.getFullYear() === year;

      const isToday = today.getDate() === i && 
        today.getMonth() === month && 
        today.getFullYear() === year;

      days.push(
        <button
          key={i}
          type="button"
          onClick={() => handleDateClick(i)}
          className={`
            w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-black transition-all duration-200
            ${isSelected 
              ? 'bg-brand-accent text-white shadow-glow-accent scale-110' 
              : isToday
                ? 'bg-transparent text-brand-accent border border-brand-accent'
                : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 hover:scale-105'
            }
          `}
        >
          {i}
        </button>
      );
    }
    return days;
  };

  const formattedValue = selectedDate 
    ? selectedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }) 
    : '';

  const months = ['JANEIRO', 'FEVEREIRO', 'MARÇO', 'ABRIL', 'MAIO', 'JUNHO', 'JULHO', 'AGOSTO', 'SETEMBRO', 'OUTUBRO', 'NOVEMBRO', 'DEZEMBRO'];

  return (
    <div className="relative" ref={containerRef}>
      {label && <label className="block text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1.5 ml-1">{label}</label>}
      
      {/* Trigger Input */}
      <div 
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`
          w-full bg-slate-50 dark:bg-[#020617] border rounded-xl px-4 py-3 flex items-center justify-between cursor-pointer transition-all group
          ${isOpen 
            ? 'border-brand-accent ring-2 ring-brand-accent/20 bg-white dark:bg-[#020617]' 
            : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
          }
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <CalendarIcon size={16} className={`shrink-0 transition-colors ${isOpen || value ? 'text-brand-accent' : 'text-slate-400'}`} />
          <span className={`text-xs font-bold uppercase truncate ${value ? 'text-brand-navy dark:text-white font-data' : 'text-slate-400'}`}>
            {formattedValue || placeholder}
          </span>
        </div>
        {value && !disabled && (
          <button onClick={handleClear} className="p-1 rounded-full text-slate-400 hover:bg-slate-200 dark:hover:bg-white/10 hover:text-brand-red transition-all">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Calendar Popover */}
      {isOpen && (
        <div className="absolute z-50 mt-2 left-0 w-[280px] bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-gesla-hard border border-slate-100 dark:border-white/10 p-5 animate-in zoom-in-95 slide-in-from-top-2 duration-200 origin-top-left">
          
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button type="button" onClick={handlePrevMonth} className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 text-slate-400 hover:text-brand-navy dark:hover:text-white transition-all">
              <ChevronLeft size={16} />
            </button>
            <div className="text-center">
              <span className="block text-[10px] font-black text-brand-navy dark:text-white uppercase tracking-widest">
                {months[currentDate.getMonth()]}
              </span>
              <span className="block text-[9px] font-bold text-slate-400 font-data">
                {currentDate.getFullYear()}
              </span>
            </div>
            <button type="button" onClick={handleNextMonth} className="p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-white/10 text-slate-400 hover:text-brand-navy dark:hover:text-white transition-all">
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Weekdays */}
          <div className="grid grid-cols-7 mb-2 text-center">
            {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
              <span key={i} className="text-[8px] font-black text-slate-400 uppercase">
                {day}
              </span>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7 gap-y-1 justify-items-center">
            {renderDays()}
          </div>
        </div>
      )}
    </div>
  );
};

export default GeslaDatePicker;
