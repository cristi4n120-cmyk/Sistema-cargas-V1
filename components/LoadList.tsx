
import React, { useState, useMemo, useEffect } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { useNavigate, useLocation } = ReactRouterDOM;
import { 
  Search, Plus, MapPin, List as ListIcon, 
  LayoutGrid, Calendar,
  Filter, Trash2, ShieldAlert,
  Printer, ChevronRight,
  Package, DollarSign, X, Zap, CheckCircle, ArrowRight
} from 'lucide-react';
import { loadService } from '../services/loadService';
import { userService } from '../services/userService';
import { STATUS_COLORS } from '../constants';
import { LoadStatus, UserRole, Load, ClientType } from '../types';
import KanbanBoard from './KanbanBoard';
import { formatCurrency } from '../utils/formatters';

const LoadList: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = userService.getCurrentUser();
  const isViewer = currentUser.role === UserRole.VIEWER;
  const isAdmin = currentUser.role === UserRole.ADMIN;

  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [loads, setLoads] = useState<Load[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [loadToDelete, setLoadToDelete] = useState<Load | null>(null);
  
  // Estado para filtros vindos do Dashboard
  const [dashboardFilter, setDashboardFilter] = useState<{ type: string, value?: any, label: string } | null>(null);
  
  const refreshLoads = () => setLoads(loadService.getLoads());

  useEffect(() => { refreshLoads(); }, []);

  // Processa parâmetros de navegação vindos do Dashboard ou TopBar
  useEffect(() => {
    if (location.state) {
      if (location.state.globalSearch) {
        setSearchTerm(location.state.globalSearch);
        setDebouncedSearchTerm(location.state.globalSearch);
        setViewMode('list');
      }
      
      if (location.state.filter) {
        setDashboardFilter(location.state.filter);
        setViewMode('list'); // Força modo lista para ver os detalhes filtrados
        // Reseta filtros locais para não conflitar
        setFilterStatus('all'); 
        setSearchTerm('');
      }
    }
  }, [location.state]);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchTerm(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const filteredLoads = useMemo(() => {
    return loads.filter(load => {
      // 1. Filtros Básicos (Busca e Status Dropdown)
      const searchLower = debouncedSearchTerm.toLowerCase();
      const matchesSearch = 
        load.portCode.toLowerCase().includes(searchLower) ||
        load.client.toLowerCase().includes(searchLower) ||
        load.destinationCity.toLowerCase().includes(searchLower) ||
        (load.carrier || '').toLowerCase().includes(searchLower);

      let matchesStatus = filterStatus === 'all' 
        ? load.status !== LoadStatus.COMPLETED && load.status !== LoadStatus.CANCELLED
        : load.status === filterStatus;
      
      if (debouncedSearchTerm) matchesStatus = true; // Busca global ignora status padrão

      // 2. Filtros Avançados do Dashboard (Prioritários)
      if (dashboardFilter) {
        switch (dashboardFilter.type) {
          case 'fiscal_pending':
            const hasPendency = (load.hasDifal || load.clientType === ClientType.NON_CONTRIBUTOR) && (!load.paymentProof || !load.difalGuide);
            // Inclui apenas se tiver pendência E não estiver cancelado/concluído (a menos que seja especificado)
            return hasPendency && load.status !== LoadStatus.CANCELLED && load.status !== LoadStatus.COMPLETED;
          
          case 'high_value':
            return (load.freightValue || 0) > 5000 && load.status !== LoadStatus.CANCELLED && load.status !== LoadStatus.COMPLETED;
            
          case 'carrier':
            return (load.carrier || 'Logística Própria') === dashboardFilter.value && load.status !== LoadStatus.CANCELLED && load.status !== LoadStatus.COMPLETED;
            
          case 'status':
            // Override do status filter local
            return load.status === dashboardFilter.value;
            
          case 'region':
            return load.destinationUF === dashboardFilter.value && load.status !== LoadStatus.CANCELLED && load.status !== LoadStatus.COMPLETED;
            
          case 'shippingType':
             return load.shippingType === dashboardFilter.value && load.status !== LoadStatus.CANCELLED && load.status !== LoadStatus.COMPLETED;

          default:
            return true;
        }
      }

      return matchesSearch && matchesStatus;
    });
  }, [loads, debouncedSearchTerm, filterStatus, dashboardFilter]);

  const handleRequestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const targetLoad = loads.find(l => l.id === id);
    if (targetLoad) {
      setLoadToDelete(targetLoad);
      setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = () => {
    if (loadToDelete) {
      loadService.deleteLoad(loadToDelete.id);
      setLoads(prev => prev.filter(l => l.id !== loadToDelete.id));
      setIsDeleteModalOpen(false);
      setLoadToDelete(null);
    }
  };

  const clearDashboardFilter = () => {
    setDashboardFilter(null);
    // Limpa o state da navegação para não reaparecer ao recarregar
    navigate(location.pathname, { replace: true, state: {} });
  };

  const handleFinishDelivery = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    loadService.updateStatus(id, LoadStatus.COMPLETED);
    refreshLoads();
  };

  return (
    <div className="space-y-8 animate-enter pb-10 h-full flex flex-col p-4 lg:p-0">
      
      {/* HEADER CINEMATOGRÁFICO */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-2 shrink-0 animate-enter">
        <div className="space-y-2 group cursor-default">
          <h2 className="text-4xl lg:text-5xl font-black text-brand-navy dark:text-white uppercase tracking-tighter">
            Fluxo <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-purple-600 animate-pulse-slow">Operacional</span>
          </h2>
          <div className="flex items-center gap-3">
             <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping"></div>
             <p className="text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">
               Monitoramento Ativo • {filteredLoads.length} Cargas em Processo
             </p>
          </div>
        </div>

        <div className="bg-white dark:bg-white/5 p-1.5 rounded-[2rem] shadow-lg border border-slate-200 dark:border-white/10 flex items-center relative overflow-hidden backdrop-blur-md">
           <div className={`absolute top-1 bottom-1 w-1/2 bg-brand-navy dark:bg-brand-accent rounded-[1.6rem] transition-transform duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${viewMode === 'kanban' ? 'translate-x-0' : 'translate-x-full'} shadow-lg`}></div>
           
           <button onClick={() => setViewMode('kanban')} className={`relative z-10 flex items-center gap-2 px-8 py-3 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${viewMode === 'kanban' ? 'text-white' : 'text-slate-400 hover:text-brand-navy dark:hover:text-white'}`}>
              <LayoutGrid size={16} /> Kanban
           </button>
           <button onClick={() => setViewMode('list')} className={`relative z-10 flex items-center gap-2 px-8 py-3 rounded-[1.6rem] text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${viewMode === 'list' ? 'text-white' : 'text-slate-400 hover:text-brand-navy dark:hover:text-white'}`}>
              <ListIcon size={16} /> Lista
           </button>
        </div>
      </div>

      {/* DASHBOARD FILTER BANNER */}
      {dashboardFilter && (
        <div className="bg-gradient-to-r from-brand-accent/20 to-transparent border-l-4 border-brand-accent p-6 rounded-r-[2rem] flex items-center justify-between animate-slide-up-fade">
           <div className="flex items-center gap-4 text-brand-accent">
              <div className="p-3 bg-brand-accent rounded-xl text-white shadow-lg shadow-brand-accent/30 animate-bounce">
                 <Zap size={20} />
              </div>
              <div>
                 <p className="text-[9px] font-bold uppercase tracking-widest opacity-80">Filtro Contextual Ativo</p>
                 <p className="text-xl font-black uppercase tracking-tight text-brand-navy dark:text-white">{dashboardFilter.label}</p>
              </div>
           </div>
           <button 
             onClick={clearDashboardFilter}
             className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-brand-red hover:bg-red-50 dark:hover:bg-red-900/20 transition-all btn-press shadow-sm"
           >
             <X size={14} /> Remover Filtro
           </button>
        </div>
      )}
      
      {/* CONTROL BAR (Floating Command Center) */}
      <div className={`
        bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-xl p-3 pl-6 rounded-[2.5rem] shadow-premium dark:shadow-none 
        flex flex-wrap items-center justify-between gap-4 shrink-0 border border-slate-200/50 dark:border-white/5 
        transition-all duration-500 hover:shadow-2xl dark:hover:shadow-glow-hover hover:border-brand-accent/30
        ${dashboardFilter ? 'opacity-50 pointer-events-none grayscale' : ''}
      `}>
        <div className="flex-1 flex items-center gap-4 min-w-[280px]">
          <Search className="text-slate-300 dark:text-slate-500" size={24} />
          <input 
            type="text" 
            placeholder="PESQUISAR CARGAS, CLIENTES, ROTAS..." 
            className="w-full bg-transparent text-xs font-black uppercase tracking-widest placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none text-brand-navy dark:text-white h-12"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={!!dashboardFilter}
          />
        </div>

        <div className="flex items-center gap-3">
          <div className="relative group">
            <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-brand-accent transition-colors" size={16} />
            <select 
              className="pl-12 pr-10 py-4 bg-slate-50 dark:bg-[#020617] border border-slate-100 dark:border-white/5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 outline-none cursor-pointer hover:border-brand-accent/30 focus:border-brand-accent transition-all appearance-none min-w-[180px]"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              disabled={!!dashboardFilter}
            >
              <option value="all">Status: Todos</option>
              {Object.values(LoadStatus).map(s => <option key={s} value={s}>{s.toUpperCase()}</option>)}
            </select>
            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
               <ChevronRight size={14} className="rotate-90" />
            </div>
          </div>

          {!isViewer && (
            <button onClick={() => navigate('/loads/new')} className="bg-brand-navy dark:bg-white text-white dark:text-brand-navy px-8 py-4 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 hover:bg-brand-accent dark:hover:bg-brand-accent dark:hover:text-white transition-all shadow-lg hover:translate-y-[-2px] btn-press pointer-events-auto overflow-hidden relative group">
              <span className="relative z-10 flex items-center gap-2"><Plus size={18} /> Criar Carga</span>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:animate-shine"></div>
            </button>
          )}
        </div>
      </div>

      {/* VIEW CONTENT */}
      <div className="flex-1 min-h-0 relative z-0">
        {viewMode === 'kanban' ? (
          <KanbanBoard 
            loads={filteredLoads} 
            onUpdateStatus={(id, s) => { loadService.updateStatus(id, s); refreshLoads(); }} 
            onDelete={(id) => handleRequestDelete({ stopPropagation: () => {} } as any, id)}
            onArchive={(id) => { loadService.updateStatus(id, LoadStatus.COMPLETED); refreshLoads(); }}
          />
        ) : (
          <div className="space-y-3 h-full overflow-y-auto custom-scrollbar pr-2 pb-20 pt-2 perspective-[1000px]">
            
            {/* List Header */}
            <div className="hidden lg:grid grid-cols-12 gap-6 px-8 py-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] sticky top-0 bg-slate-50/90 dark:bg-[#020617]/90 backdrop-blur-md z-10 rounded-[1.5rem] mb-4 border border-transparent">
              <div className="col-span-2">ID / Emissão</div>
              <div className="col-span-4">Cliente / Rota</div>
              <div className="col-span-3">Performance</div>
              <div className="col-span-2 text-center">Etapa</div>
              <div className="col-span-1 text-right">Comandos</div>
            </div>

            {filteredLoads.map((load, idx) => {
               const isFiscalAlert = (load.hasDifal || load.clientType === ClientType.NON_CONTRIBUTOR) && (!load.paymentProof || !load.difalGuide);
               const isReadyToComplete = load.status === LoadStatus.DISPATCHED;

               return (
                <div 
                  key={load.id} 
                  onClick={() => navigate(`/loads/edit/${load.id}`)}
                  className={`
                    group relative grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 rounded-[2.5rem] 
                    border transition-all duration-500 cursor-pointer items-center animate-slide-up-fade btn-press
                    bg-white dark:bg-[#1e293b] 
                    border-slate-200 dark:border-white/5
                    hover:shadow-2xl hover:shadow-brand-navy/5 dark:hover:shadow-black/60
                    hover:border-slate-300 dark:hover:border-white/20
                    hover:-translate-y-1 hover:scale-[1.005]
                    ${isFiscalAlert ? 'dark:border-amber-500/30 dark:shadow-[0_0_20px_rgba(245,158,11,0.1)]' : ''}
                  `}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  {/* Status Indicator Strip */}
                  <div className={`absolute left-0 top-8 bottom-8 w-1 rounded-r-full transition-all duration-300 ${isFiscalAlert ? 'bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.6)] h-auto' : 'bg-transparent group-hover:bg-brand-accent group-hover:h-1/2 top-1/2 -translate-y-1/2'}`}></div>

                  {/* ID & Date */}
                  <div className="col-span-1 lg:col-span-2 pl-4 lg:pl-2">
                     <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${
                           isFiscalAlert 
                             ? 'bg-amber-500 text-white animate-pulse shadow-glow-amber' 
                             : 'bg-slate-50 dark:bg-white/5 text-slate-400 group-hover:bg-brand-navy dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-brand-navy group-hover:shadow-lg'
                        }`}>
                           {isFiscalAlert ? <ShieldAlert size={20} /> : <Package size={20} />}
                        </div>
                        <div>
                           <span className="font-data text-xs font-black text-brand-navy dark:text-white tracking-tight block group-hover:text-brand-accent transition-colors">
                             {load.portCode}
                           </span>
                           <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tight flex items-center gap-1">
                             <Calendar size={10} /> {new Date(load.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short' })}
                           </span>
                        </div>
                     </div>
                  </div>

                  {/* Client & Route */}
                  <div className="col-span-1 lg:col-span-4">
                    <h4 className="text-sm font-black text-brand-navy dark:text-white uppercase truncate w-full tracking-tight mb-2 group-hover:translate-x-1 transition-transform" title={load.client}>
                      {load.client}
                    </h4>
                    <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-xl w-fit border border-slate-100 dark:border-white/5 group-hover:border-brand-accent/20 transition-colors">
                       <MapPin size={12} className="text-brand-accent" /> 
                       <span className="truncate max-w-[200px]">{load.destinationCity}</span>
                       <span className="text-slate-300 dark:text-slate-600 mx-1">/</span>
                       <span className="text-brand-navy dark:text-white">{load.destinationUF}</span>
                    </div>
                  </div>

                  {/* Metrics Pills */}
                  <div className="col-span-1 lg:col-span-3">
                     <div className="flex flex-wrap gap-2">
                        <div className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20 rounded-xl text-[10px] font-black uppercase transition-all hover:bg-emerald-100 dark:hover:bg-emerald-500/20">
                           <DollarSign size={12} /> {formatCurrency(load.freightValue)}
                        </div>
                        <div className="flex items-center gap-1.5 px-4 py-2 bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border border-slate-100 dark:border-white/5 rounded-xl text-[10px] font-black group-hover:bg-brand-navy/5 transition-all">
                           <Package size={12} /> {load.totalWeight}kg
                        </div>
                     </div>
                  </div>

                  {/* Status Badge */}
                  <div className="col-span-1 lg:col-span-2 flex justify-start lg:justify-center">
                    <div className={`px-5 py-2.5 rounded-2xl text-[9px] font-black uppercase border w-fit shadow-sm transition-all duration-300 group-hover:scale-105 ${STATUS_COLORS[load.status]}`}>
                        {load.status}
                    </div>
                  </div>

                  {/* Actions (Hover Reveal) */}
                  <div className="col-span-1 lg:col-span-1 flex justify-end gap-2 relative">
                     <div className="absolute right-0 top-1/2 -translate-y-1/2 flex gap-2 transition-all duration-300 opacity-0 translate-x-4 group-hover:opacity-100 group-hover:translate-x-0">
                        {isReadyToComplete && (
                            <button
                              type="button"
                              onClick={(e) => handleFinishDelivery(e, load.id)}
                              className="p-3 bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/30 rounded-xl transition-all btn-press"
                              title="Concluir Entrega"
                            >
                              <CheckCircle size={16} />
                            </button>
                        )}
                        
                        <button 
                            type="button" 
                            onClick={(e) => { e.stopPropagation(); loadService.downloadManifest(load); }} 
                            className="p-3 bg-white dark:bg-white/10 text-slate-400 hover:text-brand-navy dark:hover:text-white border border-slate-100 dark:border-white/10 hover:border-brand-navy/20 shadow-md rounded-xl transition-all btn-press"
                            title="Imprimir"
                        >
                            <Printer size={16} />
                        </button>
                        {!isViewer && (isAdmin || load.status === LoadStatus.TRANSIT) && (
                            <button 
                              type="button" 
                              onClick={(e) => handleRequestDelete(e, load.id)} 
                              className="p-3 bg-white dark:bg-white/10 text-slate-400 hover:text-brand-red border border-slate-100 dark:border-white/10 hover:border-red-200 shadow-md rounded-xl transition-all btn-press"
                              title="Excluir"
                            >
                              <Trash2 size={16} />
                            </button>
                        )}
                     </div>
                     
                     {/* Placeholder Arrow */}
                     <div className="p-3 text-slate-300 dark:text-slate-600 opacity-100 group-hover:opacity-0 transition-opacity duration-300">
                        <ArrowRight size={20} />
                     </div>
                  </div>
                </div>
               );
            })}
            
            {filteredLoads.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 opacity-60 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3rem] animate-pulse">
                   <div className="w-20 h-20 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-6">
                      <Search size={32} className="text-slate-400" />
                   </div>
                   <p className="text-sm font-black text-slate-500 uppercase tracking-widest">Nenhuma carga encontrada</p>
                   {dashboardFilter && <p className="text-[10px] font-bold text-brand-accent mt-2 uppercase tracking-wider">Filtro Ativo: {dashboardFilter.label}</p>}
                </div>
            )}
          </div>
        )}
      </div>

      {/* DELETE MODAL */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-brand-navy/90 dark:bg-black/90 backdrop-blur-2xl flex items-center justify-center z-[120] p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-[3.5rem] shadow-gesla-hard border border-slate-200 dark:border-white/10 p-12 text-center animate-in zoom-in duration-300 relative overflow-hidden">
             {/* Background Noise */}
             <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none"></div>
             
             <div className="relative z-10">
                <div className="w-24 h-24 bg-red-50 dark:bg-red-500/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-glow-red border border-red-100 dark:border-red-500/20">
                    <ShieldAlert size={48} className="text-brand-red animate-pulse" />
                </div>
                <h3 className="text-2xl font-black text-brand-navy dark:text-white uppercase tracking-tighter mb-3">Exclusão Definitiva</h3>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-10 leading-relaxed">
                  A carga <span className="text-brand-red">{loadToDelete?.portCode}</span> será removida do painel operacional.
                </p>
                <div className="flex flex-col gap-4">
                  <button onClick={confirmDelete} className="w-full bg-brand-red text-white py-5 rounded-3xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-red-600 btn-press shadow-xl shadow-red-500/20">Confirmar Ação</button>
                  <button onClick={() => setIsDeleteModalOpen(false)} className="w-full py-5 rounded-3xl font-black text-slate-400 uppercase text-[10px] tracking-[0.2em] hover:bg-slate-50 dark:hover:bg-white/5 btn-press transition-colors">Cancelar</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadList;
