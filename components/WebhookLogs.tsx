
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, AlertTriangle, Search, Filter, 
  ChevronRight, RefreshCw, Code, Activity, 
  CheckCircle2, XCircle, Clock, Calendar
} from 'lucide-react';
import { webhookService } from '../services/webhookService';
import { WebhookLog, SystemEventType } from '../types';

const WebhookLogs: React.FC = () => {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'success' | 'error'>('all');
  const [filterEvent, setFilterEvent] = useState<string>('all');
  const [selectedLog, setSelectedLog] = useState<WebhookLog | null>(null);

  const refreshLogs = () => {
    setLogs(webhookService.getLogs());
  };

  useEffect(() => {
    refreshLogs();
    const interval = setInterval(refreshLogs, 10000); // Auto-refresh a cada 10s
    return () => clearInterval(interval);
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const matchesSearch = log.carga_id?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' 
        ? true 
        : filterStatus === 'success' ? log.sucesso : !log.sucesso;
      const matchesEvent = filterEvent === 'all' || log.evento === filterEvent;
      return matchesSearch && matchesStatus && matchesEvent;
    });
  }, [logs, searchTerm, filterStatus, filterEvent]);

  const stats = useMemo(() => {
    const total = logs.length;
    const success = logs.filter(l => l.sucesso).length;
    const errors = total - success;
    const rate = total > 0 ? (success / total) * 100 : 100;
    return { total, success, errors, rate };
  }, [logs]);

  // --- SUB-COMPONENTE: JSON VIEWER (Simples) ---
  const JsonViewer = ({ data }: { data: string }) => {
    try {
      const obj = JSON.parse(data);
      return (
        <pre className="bg-slate-900 text-green-400 p-4 rounded-xl text-[10px] font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed border border-white/10 shadow-inner">
          {JSON.stringify(obj, null, 2)}
        </pre>
      );
    } catch {
      return <div className="text-slate-500 italic p-4">Dados inválidos ou vazios.</div>;
    }
  };

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
      
      {/* HEADER & METRICS */}
      <div className="flex flex-col lg:flex-row gap-6">
         {/* KPI CARD */}
         <div className="flex-1 bg-white dark:bg-[#1e293b] p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-premium flex items-center justify-between">
            <div className="flex items-center gap-4">
               <div className={`p-4 rounded-2xl ${stats.rate >= 90 ? 'bg-emerald-500/10 text-emerald-500' : 'bg-amber-500/10 text-amber-500'}`}>
                  <Activity size={24} />
               </div>
               <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Taxa de Entrega</p>
                  <h3 className="text-3xl font-black text-brand-navy dark:text-white font-data">{stats.rate.toFixed(1)}%</h3>
               </div>
            </div>
            <div className="flex gap-4 text-right">
               <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Sucessos</p>
                  <p className="text-lg font-black text-emerald-500 font-data">{stats.success}</p>
               </div>
               <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Falhas</p>
                  <p className="text-lg font-black text-rose-500 font-data">{stats.errors}</p>
               </div>
            </div>
         </div>

         {/* CONTROLS */}
         <div className="flex-[2] bg-white dark:bg-[#1e293b] p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-premium flex flex-col justify-center gap-4">
            <div className="flex items-center justify-between">
               <h4 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck size={18} className="text-brand-accent" /> Auditoria de Disparos
               </h4>
               <button onClick={refreshLogs} className="p-2 text-slate-400 hover:text-brand-accent transition-colors"><RefreshCw size={16} /></button>
            </div>
            
            <div className="flex gap-4">
               <div className="relative flex-1 group">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-accent transition-colors" />
                  <input 
                    type="text" 
                    placeholder="FILTRAR POR ID DA CARGA..." 
                    className="w-full bg-slate-50 dark:bg-black/20 pl-10 pr-4 py-3 rounded-xl text-[10px] font-bold uppercase text-brand-navy dark:text-white placeholder:text-slate-400 outline-none focus:ring-2 ring-brand-accent/20 transition-all border border-slate-200 dark:border-white/5"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
               </div>
               <select 
                  className="bg-slate-50 dark:bg-black/20 px-4 py-3 rounded-xl text-[10px] font-bold uppercase text-slate-500 dark:text-slate-300 outline-none border border-slate-200 dark:border-white/5 cursor-pointer hover:border-brand-accent/30"
                  value={filterStatus}
                  onChange={(e: any) => setFilterStatus(e.target.value)}
               >
                  <option value="all">Status: Todos</option>
                  <option value="success">Sucesso (200)</option>
                  <option value="error">Falhas (4xx/5xx)</option>
               </select>
            </div>
         </div>
      </div>

      {/* LOGS TABLE */}
      <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-premium overflow-hidden min-h-[400px]">
         <div className="grid grid-cols-12 gap-4 p-4 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 text-[9px] font-black text-slate-400 uppercase tracking-widest">
            <div className="col-span-1 text-center">Status</div>
            <div className="col-span-2">Data / Hora</div>
            <div className="col-span-3">Evento</div>
            <div className="col-span-2">Carga ID</div>
            <div className="col-span-3">Endpoint</div>
            <div className="col-span-1 text-right">Detalhes</div>
         </div>
         
         <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
            {filteredLogs.map((log) => (
               <div 
                 key={log.id} 
                 onClick={() => setSelectedLog(log)}
                 className="grid grid-cols-12 gap-4 p-4 border-b border-slate-50 dark:border-white/5 items-center hover:bg-slate-50 dark:hover:bg-white/5 transition-colors cursor-pointer group"
               >
                  <div className="col-span-1 flex justify-center">
                     {log.sucesso 
                        ? <CheckCircle2 size={18} className="text-emerald-500" /> 
                        : <XCircle size={18} className="text-rose-500" />
                     }
                  </div>
                  <div className="col-span-2">
                     <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 font-data">
                        {new Date(log.data_hora).toLocaleDateString()}
                     </span>
                     <span className="text-[9px] font-bold text-slate-400 block">
                        {new Date(log.data_hora).toLocaleTimeString()}
                     </span>
                  </div>
                  <div className="col-span-3">
                     <span className="text-[9px] font-black uppercase text-brand-navy dark:text-white bg-slate-100 dark:bg-white/10 px-2 py-1 rounded">
                        {log.evento.replace('CARGA_', '')}
                     </span>
                  </div>
                  <div className="col-span-2">
                     <span className="text-[10px] font-black text-brand-accent font-data">
                        {log.carga_id}
                     </span>
                  </div>
                  <div className="col-span-3">
                     <span className="text-[9px] font-bold text-slate-400 truncate block max-w-[200px]" title={log.url_destino}>
                        {log.url_destino}
                     </span>
                  </div>
                  <div className="col-span-1 text-right">
                     <ChevronRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-brand-accent ml-auto" />
                  </div>
               </div>
            ))}
            
            {filteredLogs.length === 0 && (
               <div className="p-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest opacity-60">
                  Nenhum registro encontrado no período
               </div>
            )}
         </div>
      </div>

      {/* DETAIL MODAL */}
      {selectedLog && (
         <div className="fixed inset-0 z-[100] bg-brand-navy/80 dark:bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-[#1e293b] w-full max-w-3xl rounded-[2.5rem] shadow-2xl border border-white/20 overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-300">
               
               {/* Modal Header */}
               <div className="p-6 border-b border-slate-100 dark:border-white/5 flex justify-between items-start bg-slate-50 dark:bg-black/20">
                  <div className="flex gap-4">
                     <div className={`p-3 rounded-2xl ${selectedLog.sucesso ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {selectedLog.sucesso ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                     </div>
                     <div>
                        <h3 className="text-xl font-black text-brand-navy dark:text-white uppercase tracking-tight">Detalhes do Disparo</h3>
                        <div className="flex items-center gap-3 mt-1">
                           <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase ${selectedLog.sucesso ? 'bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-100 dark:bg-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
                              HTTP {selectedLog.status_http}
                           </span>
                           <span className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                              <Clock size={10} /> {new Date(selectedLog.data_hora).toLocaleString()}
                           </span>
                        </div>
                     </div>
                  </div>
                  <button onClick={() => setSelectedLog(null)} className="p-2 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors">
                     <div className="w-6 h-6 flex items-center justify-center text-slate-500">✕</div>
                  </button>
               </div>

               {/* Modal Body */}
               <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
                  
                  {/* Context Info */}
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Evento</span>
                        <span className="text-sm font-bold text-brand-navy dark:text-white">{selectedLog.evento}</span>
                     </div>
                     <div className="p-4 bg-slate-50 dark:bg-black/20 rounded-2xl border border-slate-100 dark:border-white/5">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Carga ID</span>
                        <span className="text-sm font-bold text-brand-navy dark:text-white font-data">{selectedLog.carga_id}</span>
                     </div>
                  </div>

                  {/* Payloads */}
                  <div className="space-y-2">
                     <div className="flex items-center gap-2 mb-2">
                        <Code size={16} className="text-brand-accent" />
                        <h4 className="text-[10px] font-black text-brand-navy dark:text-white uppercase tracking-widest">Payload Enviado (Request)</h4>
                     </div>
                     <JsonViewer data={selectedLog.payload} />
                  </div>

                  <div className="space-y-2">
                     <div className="flex items-center gap-2 mb-2">
                        <Activity size={16} className={selectedLog.sucesso ? 'text-emerald-500' : 'text-rose-500'} />
                        <h4 className="text-[10px] font-black text-brand-navy dark:text-white uppercase tracking-widest">Resposta do Servidor (Response)</h4>
                     </div>
                     <div className={`p-4 rounded-xl text-[10px] font-mono overflow-x-auto whitespace-pre-wrap border ${selectedLog.sucesso ? 'bg-emerald-50/50 dark:bg-emerald-900/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20' : 'bg-rose-50/50 dark:bg-rose-900/10 text-rose-700 dark:text-rose-400 border-rose-200 dark:border-rose-500/20'}`}>
                        {selectedLog.resposta || 'Sem conteúdo de resposta.'}
                     </div>
                  </div>

               </div>

               {/* Footer */}
               <div className="p-4 border-t border-slate-100 dark:border-white/5 bg-slate-50 dark:bg-black/20 flex justify-end">
                  <button onClick={() => setSelectedLog(null)} className="px-6 py-3 bg-white dark:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm hover:bg-slate-50 dark:hover:bg-white/20 transition-all">
                     Fechar Auditoria
                  </button>
               </div>
            </div>
         </div>
      )}

    </div>
  );
};

export default WebhookLogs;
