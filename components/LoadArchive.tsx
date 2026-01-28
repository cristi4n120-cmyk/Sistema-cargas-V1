
import React, { useState, useEffect, useMemo } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { useNavigate } = ReactRouterDOM;
import { 
  Search, Archive, Calendar, MapPin, 
  RefreshCcw, Ban, TrendingUp, TrendingDown,
  CheckCircle2, AlertTriangle, Package, History
} from 'lucide-react';
import { loadService } from '../services/loadService';
import { Load, LoadStatus } from '../types';
import { formatCurrency, formatDecimal } from '../utils/formatters';

const LoadArchive: React.FC = () => {
  const navigate = useNavigate();
  const [loads, setLoads] = useState<Load[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const allLoads = loadService.getLoads();
    // Filtra apenas Concluídas e Canceladas para o arquivo e ordena por data decrescente
    setLoads(allLoads
      .filter(l => l.status === LoadStatus.COMPLETED || l.status === LoadStatus.CANCELLED)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    );
  }, []);

  const filteredLoads = useMemo(() => {
    return loads.filter(load => {
      const searchLower = searchTerm.toLowerCase();
      return (
        load.portCode.toLowerCase().includes(searchLower) ||
        load.client.toLowerCase().includes(searchLower) ||
        load.destinationCity.toLowerCase().includes(searchLower)
      );
    });
  }, [loads, searchTerm]);

  const handleRestore = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    if (window.confirm('Restaurar esta carga para o painel operacional?')) {
      loadService.updateStatus(id, LoadStatus.TRANSIT);
      setLoads(prev => prev.filter(l => l.id !== id));
    }
  };

  const getLoadMetrics = (load: Load) => {
    const revenue = load.financial?.customerFreightValue || 0;
    const cost = (load.financial?.freightValue || load.freightValue || 0) + (load.financial?.extraCosts || 0);
    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

    let slaStatus = 'N/A';
    if (load.status === LoadStatus.COMPLETED && load.actualDeliveryDate && load.expectedDeliveryDate) {
        const actual = new Date(load.actualDeliveryDate).setHours(0,0,0,0);
        const expected = new Date(load.expectedDeliveryDate).setHours(23,59,59,999);
        slaStatus = actual <= expected ? 'ON_TIME' : 'LATE';
    }

    return { revenue, cost, profit, margin, slaStatus };
  };

  return (
    <div className="space-y-10 animate-enter pb-24 p-4 lg:p-0 min-h-screen">
      
      {/* HEADER ATMOSFÉRICO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 relative z-10">
        <div className="space-y-2 group cursor-default">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-slate-100 dark:bg-white/10 rounded-xl text-slate-500 dark:text-slate-400 group-hover:rotate-12 transition-transform duration-500 shadow-sm">
                <History size={18} />
             </div>
             <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Auditoria & Legado</span>
          </div>
          <h2 className="text-5xl font-black text-brand-navy dark:text-white tracking-tighter uppercase leading-none">
            Linha do <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-400 to-slate-600 dark:from-slate-200 dark:to-slate-500 animate-pulse-slow">Tempo</span>
          </h2>
        </div>

        {/* SEARCH CAPSULE */}
        <div className={`
          relative w-full max-w-xl transition-all duration-300
          ${isSearching ? 'scale-[1.02]' : 'scale-100'}
        `}>
          <div className={`absolute inset-0 bg-gradient-to-r from-brand-accent/20 to-transparent rounded-full blur-xl transition-opacity duration-500 ${isSearching ? 'opacity-100' : 'opacity-0'}`}></div>
          <div className="relative bg-white dark:bg-[#1e293b] border border-slate-200 dark:border-white/10 rounded-full shadow-lg flex items-center px-6 py-4 group hover:border-brand-accent/30 focus-within:border-brand-accent focus-within:ring-4 focus-within:ring-brand-accent/10 transition-all">
             <Search className="text-slate-300 dark:text-slate-500 group-focus-within:text-brand-accent transition-colors" size={20} />
             <input 
               type="text" 
               placeholder="FILTRAR HISTÓRICO POR ID, CLIENTE OU DATA..."
               className="w-full bg-transparent border-none focus:outline-none text-xs font-black uppercase tracking-widest text-brand-navy dark:text-white placeholder:text-slate-300 dark:placeholder:text-slate-600 ml-4"
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               onFocus={() => setIsSearching(true)}
               onBlur={() => setIsSearching(false)}
             />
             {filteredLoads.length > 0 && (
               <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-white/5 px-2 py-1 rounded-md ml-2 whitespace-nowrap">
                 {filteredLoads.length} REG
               </span>
             )}
          </div>
        </div>
      </div>

      {/* TIMELINE CONTAINER */}
      <div className="relative pl-4 lg:pl-8">
        
        {/* The Vertical Time Line */}
        <div className="absolute left-[27px] lg:left-[43px] top-0 bottom-0 w-[2px] bg-gradient-to-b from-slate-200 via-slate-200 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent"></div>

        <div className="space-y-8">
          {filteredLoads.map((load, idx) => {
            const { profit, margin, slaStatus } = getLoadMetrics(load);
            const isCancelled = load.status === LoadStatus.CANCELLED;
            const completionDate = load.actualDeliveryDate || load.updatedAt || load.date;

            return (
              <div 
                key={load.id}
                onClick={() => navigate(`/loads/edit/${load.id}`)}
                className="relative flex gap-6 group cursor-pointer animate-slide-up"
                style={{ animationDelay: `${idx * 80}ms` }}
              >
                
                {/* TIMELINE NODE */}
                <div className="relative shrink-0 mt-6 z-10">
                   {/* Glow Effect on Hover */}
                   <div className={`absolute inset-0 rounded-full blur-md opacity-0 group-hover:opacity-60 transition-opacity duration-300 ${isCancelled ? 'bg-rose-500' : 'bg-emerald-500'}`}></div>
                   
                   <div className={`
                     w-7 h-7 lg:w-8 lg:h-8 rounded-full flex items-center justify-center border-4 shadow-sm transition-all duration-300 group-hover:scale-110
                     ${isCancelled 
                       ? 'bg-rose-50 dark:bg-[#020617] border-rose-200 dark:border-rose-500/30 text-rose-500' 
                       : 'bg-emerald-50 dark:bg-[#020617] border-emerald-200 dark:border-emerald-500/30 text-emerald-500'
                     }
                   `}>
                      {isCancelled ? <Ban size={12} /> : <CheckCircle2 size={14} />}
                   </div>
                </div>

                {/* CARD CONTENT */}
                <div className={`
                  flex-1 bg-white dark:bg-[#1e293b] rounded-[2rem] border transition-all duration-500 relative overflow-hidden
                  hover:translate-x-2 hover:shadow-xl
                  ${isCancelled 
                    ? 'border-rose-100 dark:border-white/5 hover:border-rose-200 dark:hover:border-rose-500/20' 
                    : 'border-slate-100 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/20'
                  }
                `}>
                  {/* Subtle Background Texture */}
                  <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
                  
                  {/* Decorative Left Strip */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${isCancelled ? 'bg-rose-500/20' : 'bg-slate-200 dark:bg-white/5'} transition-all duration-300 group-hover:w-1.5`}></div>

                  <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center relative z-10">
                    
                    {/* INFO BLOCK 1: ID & DATE */}
                    <div className="lg:col-span-3 space-y-2">
                       <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black font-data px-2 py-1 rounded-md ${isCancelled ? 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-slate-300'}`}>
                            {load.portCode}
                          </span>
                          {isCancelled && <span className="text-[8px] font-black uppercase text-rose-500 tracking-widest border border-rose-200 dark:border-rose-500/20 px-2 py-0.5 rounded">Cancelado</span>}
                       </div>
                       <div className="flex items-center gap-2 text-slate-400">
                          <Calendar size={12} />
                          <span className="text-[10px] font-bold uppercase tracking-wide">
                            {new Date(completionDate).toLocaleDateString(undefined, { day: '2-digit', month: 'long', year: 'numeric' })}
                          </span>
                       </div>
                    </div>

                    {/* INFO BLOCK 2: CLIENT & ROUTE */}
                    <div className="lg:col-span-4">
                       <h4 className={`text-sm font-black uppercase tracking-tight mb-1 truncate transition-colors ${isCancelled ? 'text-slate-400 line-through decoration-rose-500/50' : 'text-brand-navy dark:text-white group-hover:text-brand-accent'}`}>
                         {load.client}
                       </h4>
                       <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                          <MapPin size={12} className={isCancelled ? 'text-slate-300' : 'text-brand-accent'} />
                          {load.destinationCity} <span className="text-slate-300">/</span> {load.destinationUF}
                       </div>
                    </div>

                    {/* INFO BLOCK 3: METRICS HUD */}
                    <div className="lg:col-span-3">
                       {!isCancelled ? (
                         <div className="bg-slate-50 dark:bg-[#0f172a] rounded-xl p-3 border border-slate-100 dark:border-white/5 flex items-center justify-between group-hover:border-slate-200 dark:group-hover:border-white/10 transition-colors">
                            <div>
                               <span className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Resultado</span>
                               <div className={`flex items-center gap-1 ${profit >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-500'}`}>
                                  {profit >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                                  <span className="text-xs font-black font-data">{formatCurrency(profit)}</span>
                               </div>
                            </div>
                            <div className="text-right">
                               <span className="text-[8px] font-black text-slate-400 uppercase block mb-0.5">Margem</span>
                               <span className={`text-xs font-black font-data ${margin > 15 ? 'text-emerald-500' : 'text-amber-500'}`}>
                                  {formatDecimal(margin)}%
                               </span>
                            </div>
                         </div>
                       ) : (
                         <div className="flex items-center gap-2 text-rose-400 bg-rose-50 dark:bg-rose-900/10 p-3 rounded-xl border border-rose-100 dark:border-rose-500/20">
                            <AlertTriangle size={16} />
                            <span className="text-[9px] font-black uppercase tracking-wide">Operação Interrompida</span>
                         </div>
                       )}
                    </div>

                    {/* INFO BLOCK 4: ACTIONS */}
                    <div className="lg:col-span-2 flex justify-end">
                       <button
                          onClick={(e) => handleRestore(e, load.id)}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white dark:bg-white/5 border border-slate-100 dark:border-white/10 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-navy dark:hover:text-white hover:border-brand-navy/20 dark:hover:border-white/30 hover:shadow-md transition-all active:scale-95 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 duration-300"
                       >
                          <RefreshCcw size={12} /> Restaurar
                       </button>
                    </div>

                  </div>
                  
                  {/* SLA STATUS LINE (Bottom) */}
                  {!isCancelled && slaStatus !== 'N/A' && (
                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${slaStatus === 'ON_TIME' ? 'bg-emerald-500/20' : 'bg-amber-500/20'}`}>
                       <div className={`h-full ${slaStatus === 'ON_TIME' ? 'bg-emerald-500' : 'bg-amber-500'} w-[30%]`}></div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {filteredLoads.length === 0 && (
            <div className="py-32 flex flex-col items-center justify-center opacity-50 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3rem] animate-pulse">
               <div className="w-24 h-24 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 text-slate-300 dark:text-slate-600">
                  <Archive size={40} />
               </div>
               <h4 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest">Arquivo Vazio</h4>
               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">Nenhum registro histórico localizado.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LoadArchive;
