
import React, { useState } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { useNavigate } = ReactRouterDOM;
import { 
  MapPin, 
  Truck,
  Printer,
  ArrowRight,
  Trash2,
  Package,
  Layers,
  CheckCircle,
  GripVertical,
  AlertTriangle,
  MoreHorizontal
} from 'lucide-react';
import { Load, LoadStatus, ClientType, UserRole } from '../types';
import { loadService } from '../services/loadService';
import { userService } from '../services/userService';
import { formatCurrency } from '../utils/formatters';
import { STATUS_HEX } from '../constants';

interface KanbanBoardProps {
  loads: Load[];
  onUpdateStatus: (id: string, nextStatus: LoadStatus) => void;
  onDelete: (id: string) => void;
  onArchive: (id: string) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({ loads, onUpdateStatus, onDelete, onArchive }) => {
  const navigate = useNavigate();
  const currentUser = userService.getCurrentUser();
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const isViewer = currentUser.role === UserRole.VIEWER;

  // Estados para controle visual do Drag and Drop
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [targetColumn, setTargetColumn] = useState<LoadStatus | null>(null);

  const columns: { title: string; status: LoadStatus; color: string; progress: number }[] = [
    { title: 'Trânsito', status: LoadStatus.TRANSIT, color: STATUS_HEX[LoadStatus.TRANSIT], progress: 20 },
    { title: 'Pátio', status: LoadStatus.ARRIVED, color: STATUS_HEX[LoadStatus.ARRIVED], progress: 40 },
    { title: 'Identificado', status: LoadStatus.IDENTIFIED, color: STATUS_HEX[LoadStatus.IDENTIFIED], progress: 60 },
    { title: 'Faturado', status: LoadStatus.BILLED, color: STATUS_HEX[LoadStatus.BILLED], progress: 80 },
    { title: 'Expedido', status: LoadStatus.DISPATCHED, color: STATUS_HEX[LoadStatus.DISPATCHED], progress: 100 },
  ];

  // --- DRAG AND DROP HANDLERS ---

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggingId(id);
    e.dataTransfer.setData('loadId', id);
    e.dataTransfer.effectAllowed = 'move';
    // Remove default ghost image to rely on our styled component (visual trickery required typically, here we minimize opacity)
    const el = e.currentTarget as HTMLElement;
    setTimeout(() => el.classList.add('opacity-40', 'scale-95', 'grayscale'), 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setDraggingId(null);
    setTargetColumn(null);
    const el = e.currentTarget as HTMLElement;
    el.classList.remove('opacity-40', 'scale-95', 'grayscale');
  };

  const handleDragOver = (e: React.DragEvent, status: LoadStatus) => {
    e.preventDefault(); 
    if (targetColumn !== status) {
      setTargetColumn(status);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Optional cleanup
  };

  const handleDrop = (e: React.DragEvent, newStatus: LoadStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('loadId');
    setTargetColumn(null);
    setDraggingId(null);

    if (id) {
      const currentLoad = loads.find(l => l.id === id);
      if (currentLoad && currentLoad.status !== newStatus) {
        onUpdateStatus(id, newStatus);
      }
    }
  };

  // --- ACTIONS ---

  const handleMove = (e: React.MouseEvent, id: string, currentStatus: LoadStatus) => {
    e.stopPropagation();
    const statusOrder = [LoadStatus.TRANSIT, LoadStatus.ARRIVED, LoadStatus.IDENTIFIED, LoadStatus.BILLED, LoadStatus.DISPATCHED];
    const currentIndex = statusOrder.indexOf(currentStatus);
    const nextIndex = currentIndex + 1;
    if (nextIndex < statusOrder.length) onUpdateStatus(id, statusOrder[nextIndex]);
  };

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    onDelete(id);
  };

  const handleFinishDelivery = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    onUpdateStatus(id, LoadStatus.COMPLETED);
  };

  return (
    <div className="flex gap-8 overflow-x-auto pb-8 pt-4 h-full scrollbar-thin snap-x snap-mandatory px-4 lg:px-2 perspective-[2000px]">
      {columns.map((col, idx) => {
        const columnLoads = loads.filter(l => l.status === col.status);
        const isDragOver = targetColumn === col.status;

        return (
          <div 
            key={col.status} 
            onDragOver={(e) => handleDragOver(e, col.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.status)}
            className={`
              flex-1 min-w-[340px] max-w-[400px] flex flex-col gap-6 snap-start group/col h-full 
              rounded-[3.5rem] p-4 transition-all duration-500 ease-out animate-enter
              ${isDragOver 
                ? 'bg-gradient-to-b from-brand-accent/5 to-transparent border-2 border-brand-accent/30 shadow-2xl scale-[1.02] -translate-y-2' 
                : 'bg-slate-50/50 dark:bg-white/[0.02] border-2 border-transparent hover:bg-slate-100 dark:hover:bg-white/[0.04]'
              }
            `} 
            style={{ animationDelay: `${idx * 150}ms` }}
          >
            {/* COLUMN HEADER DOCK */}
            <div className={`
              relative flex items-center justify-between px-6 py-5 rounded-[2.5rem] border backdrop-blur-md shrink-0 transition-all duration-500 overflow-hidden
              ${isDragOver ? 'bg-white dark:bg-[#1e293b] border-brand-accent shadow-lg' : 'bg-white/80 dark:bg-[#1e293b]/80 border-slate-200 dark:border-white/5 group-hover/col:border-slate-300 dark:group-hover/col:border-white/10'}
            `}>
              {/* Progress Line */}
              <div className="absolute bottom-0 left-0 h-1 bg-slate-100 dark:bg-white/5 w-full">
                 <div className="h-full bg-brand-accent transition-all duration-1000 ease-out" style={{ width: `${col.progress}%`, opacity: isDragOver ? 1 : 0.5 }}></div>
              </div>

              <div className="flex items-center gap-4 relative z-10">
                <div 
                  className={`w-3 h-3 rounded-full shadow-lg transition-all duration-500 ${isDragOver ? 'scale-150 animate-pulse' : ''}`} 
                  style={{ backgroundColor: col.color, boxShadow: `0 0 15px ${col.color}` }}
                ></div>
                <h3 className="text-xs font-black text-brand-navy dark:text-white uppercase tracking-[0.25em]">{col.title}</h3>
              </div>
              <span className={`text-[10px] font-black font-data px-3 py-1.5 rounded-xl border transition-all duration-300 ${isDragOver ? 'bg-brand-accent text-white border-transparent scale-110' : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-white/5'}`}>
                {columnLoads.length.toString().padStart(2, '0')}
              </span>
            </div>

            {/* DROP ZONE (LANE) */}
            <div className="flex-1 rounded-[3rem] p-1 space-y-5 overflow-y-auto custom-scrollbar relative">
              
              {/* Background Guide Lines */}
              <div className="absolute inset-0 flex flex-col justify-between opacity-[0.03] pointer-events-none p-6">
                 {[1,2,3,4,5].map(i => <div key={i} className="w-full h-px bg-current border-t border-dashed"></div>)}
              </div>

              {columnLoads.map((load, lIdx) => {
                const needsDifal = load.hasDifal === true || load.clientType === ClientType.NON_CONTRIBUTOR;
                const hasDocs = load.paymentProof && load.difalGuide;
                const isFiscalAlert = needsDifal && !hasDocs;
                
                const isMultiDelivery = load.deliveries && load.deliveries.length > 1;
                const isDraggingThis = draggingId === load.id;

                return (
                  <div 
                    key={load.id}
                    draggable={!isViewer}
                    onDragStart={(e) => handleDragStart(e, load.id)}
                    onDragEnd={handleDragEnd}
                    onClick={() => navigate(`/loads/edit/${load.id}`)}
                    className={`
                      relative rounded-[2.5rem] p-6 border-2 transition-all duration-500 group/card cursor-pointer
                      flex flex-col gap-4 animate-slide-up-fade
                      ${isDraggingThis ? 'opacity-0' : 'opacity-100'}
                      ${isFiscalAlert 
                        ? 'bg-amber-50 dark:bg-[#1e293b] border-amber-400/50 dark:border-amber-500/30 shadow-[0_0_30px_rgba(245,158,11,0.15)]' 
                        : 'bg-white dark:bg-[#1e293b] border-white dark:border-white/5 shadow-premium dark:shadow-none hover:border-brand-navy/10 dark:hover:border-white/20 hover:shadow-2xl dark:hover:shadow-black/60'
                      }
                      hover:-translate-y-1 hover:scale-[1.02] hover:rotate-[0.5deg]
                    `}
                    style={{ animationDelay: `${lIdx * 80}ms` }}
                  >
                    {/* Header: ID & Actions */}
                    <div className="flex justify-between items-start">
                       <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl transition-colors ${isFiscalAlert ? 'bg-amber-500 text-white animate-pulse' : 'bg-slate-100 dark:bg-white/5 text-slate-400 group-hover/card:bg-brand-navy dark:group-hover/card:bg-white group-hover/card:text-white dark:group-hover/card:text-brand-navy'}`}>
                             {isFiscalAlert ? <AlertTriangle size={14} /> : <GripVertical size={14} />}
                          </div>
                          <div>
                             <span className="font-data text-[10px] font-black uppercase tracking-tight text-brand-navy dark:text-white block">
                               {load.portCode}
                             </span>
                             <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                               {new Date(load.date).toLocaleDateString(undefined, {day: '2-digit', month: 'short'})}
                             </span>
                          </div>
                       </div>
                       
                       <div className="opacity-0 group-hover/card:opacity-100 transition-opacity flex gap-1">
                          <button onClick={(e) => { e.stopPropagation(); loadService.downloadManifest(load); }} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-slate-400 hover:text-brand-navy dark:hover:text-white transition-colors"><Printer size={14} /></button>
                          {!isViewer && (isAdmin || load.status === LoadStatus.TRANSIT) && (
                             <button onClick={(e) => handleDelete(e, load.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                          )}
                       </div>
                    </div>

                    {/* Main Info */}
                    <div className="space-y-2">
                       <div className="flex items-center gap-2">
                          {isMultiDelivery && <Layers size={12} className="text-indigo-500" />}
                          <h4 className="text-xs font-black text-brand-navy dark:text-white uppercase leading-snug line-clamp-2">
                             {load.client}
                          </h4>
                       </div>
                       
                       <div className="flex flex-col gap-1.5 pl-1 border-l-2 border-slate-100 dark:border-white/5">
                          <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                             <MapPin size={10} className="text-brand-accent shrink-0" />
                             <span className="truncate">{load.destinationCity} / {load.destinationUF}</span>
                          </div>
                          <div className="flex items-center gap-2 text-[9px] font-bold text-slate-500 dark:text-slate-400 uppercase">
                             <Truck size={10} className="shrink-0" />
                             <span className="truncate">{load.carrier || 'Própria'}</span>
                          </div>
                       </div>
                    </div>

                    {/* Footer Stats & Actions */}
                    <div className="pt-4 mt-2 border-t border-slate-50 dark:border-white/5 flex items-center justify-between">
                       <div className="bg-slate-50 dark:bg-white/5 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-white/5">
                          <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 font-data">
                             {formatCurrency(load.freightValue)}
                          </span>
                       </div>

                       {col.status === LoadStatus.DISPATCHED ? (
                          <button
                            type="button"
                            onClick={(e) => handleFinishDelivery(e, load.id)}
                            className="flex items-center gap-2 pl-3 pr-4 py-1.5 rounded-xl bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:scale-105 shadow-lg shadow-emerald-500/30 transition-all"
                          >
                             <CheckCircle size={12} /> Concluir
                          </button>
                       ) : (
                          <button 
                            type="button"
                            onClick={(e) => handleMove(e, load.id, load.status)}
                            className="w-8 h-8 flex items-center justify-center rounded-xl bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-brand-navy dark:hover:text-white hover:border-brand-navy dark:hover:border-white transition-all hover:rotate-90"
                          >
                             <ArrowRight size={14} />
                          </button>
                       )}
                    </div>

                    {/* Fiscal Alert Overlay Texture */}
                    {isFiscalAlert && (
                       <div className="absolute top-0 right-0 p-2">
                          <span className="flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                          </span>
                       </div>
                    )}
                  </div>
                );
              })}
              
              {columnLoads.length === 0 && (
                <div className={`
                  h-64 flex flex-col items-center justify-center rounded-[3rem] border-4 border-dashed transition-all duration-500
                  ${isDragOver 
                    ? 'border-brand-accent/50 bg-brand-accent/5 scale-105 opacity-100' 
                    : 'border-slate-200 dark:border-white/5 opacity-40 hover:opacity-60'
                  }
                `}>
                   <div className={`w-16 h-16 rounded-full bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-4 transition-transform ${isDragOver ? 'scale-125 animate-bounce text-brand-accent' : 'text-slate-400'}`}>
                      <Package size={24} />
                   </div>
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">
                      {isDragOver ? 'Soltar Carga' : 'Vazio'}
                   </p>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default KanbanBoard;
