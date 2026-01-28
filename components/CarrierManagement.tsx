
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Plus, Search, Phone, Mail, User, Trash2, Edit3, X, 
  CheckCircle2, ShieldCheck, Truck, MapPin, ArrowRight, ArrowLeft,
  BarChart3, PieChart, Wallet, AlertTriangle, Activity, Calendar,
  TrendingUp, Package, FileCheck, Anchor, Navigation, Zap, Globe, Container,
  CreditCard, HardHat, Save, ShieldAlert
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, Pie, Cell, Legend
} from 'recharts';
import { carrierService } from '../services/carrierService';
import { loadService } from '../services/loadService';
import { Carrier, UserRole, Load, LoadStatus, ShippingType } from '../types';
import { userService } from '../services/userService';
import { UFS } from '../constants';
import { maskDocument, maskPhone, maskCEP, formatDocument, formatPhone, formatCurrency } from '../utils/formatters';

// --- COMPONENTES TÁTICOS (Internal) ---

const TacticalInput = ({ label, icon: Icon, value, onChange, placeholder, className, ...props }: any) => {
  const [focused, setFocused] = useState(false);
  const hasValue = value && value.length > 0;

  return (
    <div className={`relative group ${className}`}>
      <div className={`absolute -inset-0.5 bg-gradient-to-r from-brand-accent to-brand-navy rounded-2xl opacity-0 transition-duration-500 blur-sm group-hover:opacity-20 ${focused ? 'opacity-30' : ''}`}></div>
      <div className={`
        relative flex items-center bg-white dark:bg-[#020617] rounded-2xl border transition-all duration-300 overflow-hidden
        ${focused 
          ? 'border-brand-accent shadow-[0_0_20px_rgba(var(--color-brand-accent),0.1)]' 
          : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
        }
      `}>
        <div className={`pl-4 pr-3 transition-colors duration-300 ${focused ? 'text-brand-accent' : 'text-slate-400'}`}>
          <Icon size={18} />
        </div>
        <div className="flex-1 relative h-[56px]">
          <input
            {...props}
            value={value}
            onChange={onChange}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder=" "
            className="peer w-full h-full bg-transparent text-brand-navy dark:text-white font-bold text-xs outline-none pt-5 pb-2 px-1 font-data tracking-wider uppercase z-10 relative"
          />
          <label className={`
            absolute left-1 top-2 text-[9px] font-black text-slate-400 uppercase tracking-widest transition-all duration-300 pointer-events-none
            peer-placeholder-shown:top-4 peer-placeholder-shown:text-[10px]
            peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:text-brand-accent
            ${hasValue ? 'top-1.5 text-[8px]' : ''}
          `}>
            {label}
          </label>
        </div>
        {hasValue && (
           <div className="pr-4 text-emerald-500 animate-in zoom-in duration-300">
              <CheckCircle2 size={14} />
           </div>
        )}
      </div>
    </div>
  );
};

const FleetSelector = ({ value, onChange }: any) => {
  const options = [
    { id: 'Pesada / Carretas', label: 'Carreta / Bitrem', icon: Container, desc: 'Alta Capacidade' },
    { id: 'Média / Trucks', label: 'Truck / Toco', icon: Truck, desc: 'Distribuição Regional' },
    { id: 'Leve / Utilitários', label: 'VUC / Van', icon: Zap, desc: 'Entrega Urbana' },
    { id: 'Geral', label: 'Frota Mista', icon: Anchor, desc: 'Multimodal' },
  ];

  return (
    <div className="grid grid-cols-2 gap-3">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`
            relative flex flex-col items-start p-4 rounded-2xl border transition-all duration-300 group overflow-hidden
            ${value === opt.id 
              ? 'bg-brand-navy dark:bg-white text-white dark:text-brand-navy border-brand-navy dark:border-white shadow-lg' 
              : 'bg-slate-50 dark:bg-[#0f172a] border-slate-200 dark:border-white/10 text-slate-500 dark:text-slate-400 hover:border-brand-accent/30 hover:bg-white dark:hover:bg-white/5'
            }
          `}
        >
          {value === opt.id && <div className="absolute top-0 right-0 p-2"><CheckCircle2 size={14} className="text-brand-accent" /></div>}
          <opt.icon size={20} className={`mb-3 ${value === opt.id ? 'text-brand-accent' : 'text-slate-400 group-hover:text-brand-navy dark:group-hover:text-white'}`} />
          <span className="text-[10px] font-black uppercase tracking-widest leading-tight text-left">{opt.label}</span>
          <span className={`text-[8px] font-bold uppercase mt-1 text-left ${value === opt.id ? 'text-white/60 dark:text-brand-navy/60' : 'text-slate-400/60'}`}>{opt.desc}</span>
        </button>
      ))}
    </div>
  );
};

const WizardStep = ({ active, title, icon: Icon, onClick, completed }: any) => (
  <button 
    onClick={onClick}
    disabled={!completed && !active}
    className={`
      flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 border w-full text-left
      ${active 
        ? 'bg-brand-navy dark:bg-white text-white dark:text-brand-navy border-brand-navy dark:border-white shadow-lg scale-[1.02]' 
        : completed
          ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
          : 'bg-transparent text-slate-400 border-transparent opacity-50 cursor-not-allowed'
      }
    `}
  >
    <div className={`p-1.5 rounded-lg ${active ? 'bg-white/20' : ''}`}>
      <Icon size={16} />
    </div>
    <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap flex-1">{title}</span>
    {completed && !active && <CheckCircle2 size={14} />}
  </button>
);

const MetricCard = ({ label, value, sub, icon: Icon, color = "blue", delay = 0 }: any) => {
  const colors: any = {
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20",
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20",
    amber: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-500/20",
    rose: "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-500/20",
    slate: "bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-300 border-slate-100 dark:border-white/10"
  };

  return (
    <div 
      className={`p-6 rounded-[2rem] border ${colors[color]} animate-slide-up flex flex-col justify-between h-full group hover:scale-[1.02] transition-transform`}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex justify-between items-start mb-4">
        <span className="text-[9px] font-black uppercase tracking-widest opacity-70">{label}</span>
        <div className={`p-2 rounded-xl bg-white/50 dark:bg-black/20 shadow-sm`}>
          <Icon size={18} />
        </div>
      </div>
      <div>
        <h4 className="text-2xl font-black font-data tracking-tighter">{value}</h4>
        {sub && <p className="text-[9px] font-bold mt-1 opacity-60">{sub}</p>}
      </div>
    </div>
  );
};

const CarrierManagement: React.FC = () => {
  const [mode, setMode] = useState<'grid' | 'wizard'>('grid');
  const [activeStep, setActiveStep] = useState(1);
  const [carriers, setCarriers] = useState<Carrier[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estado de Edição/Criação
  const [selectedCarrier, setSelectedCarrier] = useState<Carrier | null>(null);
  const [formData, setFormData] = useState<Partial<Carrier>>({});
  
  // Estado de Exclusão
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [carrierToDelete, setCarrierToDelete] = useState<Carrier | null>(null);
  
  const currentUser = userService.getCurrentUser();
  const isAdmin = currentUser.role === UserRole.ADMIN;

  const refreshData = () => {
    setCarriers(carrierService.getCarriers());
    setLoads(loadService.getLoads());
  };

  useEffect(() => { refreshData(); }, []);

  const filteredCarriers = useMemo(() => {
    return carriers.filter(c => 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.cnpj.includes(searchTerm)
    );
  }, [carriers, searchTerm]);

  // --- ANALYTICS ENGINE ---
  const carrierMetrics = useMemo(() => {
    if (!selectedCarrier) return null;
    const cLoads = loads.filter(l => l.carrierId === selectedCarrier.id || l.carrier === selectedCarrier.name);
    
    // Volumetria
    const totalLoads = cLoads.length;
    const activeLoads = cLoads.filter(l => l.status !== LoadStatus.COMPLETED && l.status !== LoadStatus.CANCELLED).length;
    const completedLoads = cLoads.filter(l => l.status === LoadStatus.COMPLETED).length;
    
    // Financeiro
    const totalSpend = cLoads.reduce((acc, l) => acc + ((l.financial?.freightValue || 0) + (l.financial?.extraCosts || 0)), 0);
    const avgTicket = totalLoads > 0 ? totalSpend / totalLoads : 0;

    // CIF vs FOB
    const cifCount = cLoads.filter(l => l.shippingType === ShippingType.CIF).length;
    const fobCount = cLoads.filter(l => l.shippingType === ShippingType.FOB).length;

    // Performance & SLA
    let delayedCount = 0;
    cLoads.forEach(l => {
      if (l.status === LoadStatus.COMPLETED && l.actualDeliveryDate && l.expectedDeliveryDate) {
        if (new Date(l.actualDeliveryDate) > new Date(l.expectedDeliveryDate)) delayedCount++;
      }
    });
    const onTimeRate = totalLoads > 0 ? ((completedLoads - delayedCount) / (completedLoads || 1)) * 100 : 100;

    // Charts Data
    const monthlyVol: Record<string, number> = {};
    cLoads.forEach(l => {
      const d = new Date(l.date);
      const key = `${d.getMonth()+1}/${d.getFullYear().toString().substr(2)}`;
      monthlyVol[key] = (monthlyVol[key] || 0) + 1;
    });
    const volumeChartData = Object.entries(monthlyVol).map(([name, loads]) => ({ name, loads })).slice(-6);

    return { totalLoads, activeLoads, totalSpend, avgTicket, cifCount, fobCount, onTimeRate, volumeChartData };
  }, [selectedCarrier, loads]);

  // --- ACTIONS ---

  const handleCreateNew = () => {
    setSelectedCarrier(null);
    setFormData({
      name: '', cnpj: '', contact: '', email: '', phone: '',
      fleetType: 'Geral', status: 'Ativo', zipCode: '', address: '',
      number: '', neighborhood: '', city: '', state: ''
    });
    setMode('wizard');
    setActiveStep(1);
  };

  const handleEdit = (carrier: Carrier) => {
    setSelectedCarrier(carrier);
    setFormData(carrier);
    setMode('wizard');
    setActiveStep(1);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const saved = carrierService.saveCarrier(formData);
    setFormData(saved);
    setSelectedCarrier(saved as Carrier);
    refreshData();
    if (!selectedCarrier) {
       // Feedback visual poderia ser um toast, mas por agora mantemos o padrão
    }
  };

  const handleGridDelete = (e: React.MouseEvent, carrier: Carrier) => {
    e.stopPropagation();
    setCarrierToDelete(carrier);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = () => {
    if (selectedCarrier) {
       setCarrierToDelete(selectedCarrier);
       setIsDeleteModalOpen(true);
    }
  };

  const confirmDelete = () => {
    if (carrierToDelete) {
      carrierService.deleteCarrier(carrierToDelete.id);
      refreshData();
      setIsDeleteModalOpen(false);
      setCarrierToDelete(null);
      // Se estava no modo wizard editando este, volta pra grid
      if (mode === 'wizard' && selectedCarrier?.id === carrierToDelete.id) {
        setMode('grid');
        setSelectedCarrier(null);
      }
    }
  };

  // --- RENDERIZADORES DO WIZARD ---

  const renderStepContent = () => {
    if (!formData) return null;
    const isNew = !selectedCarrier;

    switch (activeStep) {
      case 1: // CADASTRO ESTRATÉGICO (BRUXO LEVEL)
        return (
          <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-right-8 fade-in duration-500">
            
            {/* LEFT COLUMN: THE INPUT CONSOLE */}
            <div className="lg:col-span-8 space-y-8">
               
               {/* 1.1 IDENTIDADE CORPORATIVA */}
               <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-premium relative group overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-brand-navy/5 dark:bg-white/5 rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150"></div>
                  
                  <div className="flex items-center gap-4 mb-8 relative z-10">
                     <div className="w-12 h-12 bg-brand-navy dark:bg-white text-white dark:text-brand-navy rounded-2xl flex items-center justify-center shadow-lg"><Building2 size={22} /></div>
                     <div>
                        <h3 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest">Entidade Corporativa</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Dados fiscais da transportadora</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative z-10">
                     <div className="md:col-span-2">
                        <TacticalInput 
                           label="Razão Social / Nome Fantasia" 
                           icon={Globe}
                           value={formData.name} 
                           onChange={(e: any) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                        />
                     </div>
                     <div>
                        <TacticalInput 
                           label="CNPJ" 
                           icon={FileCheck}
                           value={formData.cnpj} 
                           onChange={(e: any) => setFormData({...formData, cnpj: maskDocument(e.target.value)})}
                           maxLength={18}
                        />
                     </div>
                     <div>
                        <TacticalInput 
                           label="Contato Comercial" 
                           icon={User}
                           value={formData.contact} 
                           onChange={(e: any) => setFormData({...formData, contact: e.target.value.toUpperCase()})}
                        />
                     </div>
                  </div>
               </div>

               {/* 1.2 CAPACIDADE LOGÍSTICA (FROTA) */}
               <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-premium">
                  <div className="flex items-center gap-4 mb-6">
                     <div className="w-12 h-12 bg-brand-accent text-white rounded-2xl flex items-center justify-center shadow-glow-accent"><Truck size={22} /></div>
                     <div>
                        <h3 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest">Matriz de Frota</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Definição de capacidade operacional</p>
                     </div>
                  </div>
                  
                  <FleetSelector 
                     value={formData.fleetType} 
                     onChange={(val: string) => setFormData({...formData, fleetType: val})} 
                  />
               </div>

               {/* 1.3 BASE GEOGRÁFICA & COMUNICAÇÃO */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-premium">
                     <div className="flex items-center gap-3 mb-6">
                        <MapPin size={18} className="text-slate-400" />
                        <h4 className="text-xs font-black uppercase tracking-widest">Base Operacional</h4>
                     </div>
                     <div className="space-y-4">
                        <div className="flex gap-3">
                           <div className="flex-1">
                              <TacticalInput label="Cidade" icon={MapPin} value={formData.city} onChange={(e: any) => setFormData({...formData, city: e.target.value.toUpperCase()})} />
                           </div>
                           <div className="w-24">
                              <div className="relative group h-full">
                                 <select 
                                    className="w-full h-full bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-2xl px-3 text-xs font-black uppercase outline-none appearance-none cursor-pointer focus:border-brand-accent"
                                    value={formData.state}
                                    onChange={e => setFormData({...formData, state: e.target.value})}
                                 >
                                    <option value="">UF</option>
                                    {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                                 </select>
                              </div>
                           </div>
                        </div>
                        <TacticalInput label="Endereço Base" icon={Navigation} value={formData.address} onChange={(e: any) => setFormData({...formData, address: e.target.value.toUpperCase()})} />
                     </div>
                  </div>

                  <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-premium">
                     <div className="flex items-center gap-3 mb-6">
                        <Phone size={18} className="text-slate-400" />
                        <h4 className="text-xs font-black uppercase tracking-widest">Canais de Contato</h4>
                     </div>
                     <div className="space-y-4">
                        <TacticalInput label="Telefone / WhatsApp" icon={Phone} value={formData.phone} onChange={(e: any) => setFormData({...formData, phone: maskPhone(e.target.value)})} />
                        <TacticalInput label="E-mail Corporativo" icon={Mail} value={formData.email} onChange={(e: any) => setFormData({...formData, email: e.target.value})} type="email" />
                     </div>
                  </div>
               </div>

               {/* ACTION BAR */}
               <div className="flex justify-end pt-4">
                  {isAdmin && (
                    <button type="submit" className="bg-brand-navy dark:bg-white dark:text-brand-navy text-white px-12 py-5 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] shadow-premium hover:scale-105 hover:bg-brand-accent dark:hover:bg-brand-accent dark:hover:text-white transition-all flex items-center gap-4 group btn-press">
                       <Save size={20} className="group-hover:animate-bounce" /> 
                       {selectedCarrier ? 'Atualizar Dossiê' : 'Homologar Parceiro'}
                    </button>
                  )}
               </div>
            </div>

            {/* RIGHT COLUMN: LIVE SIMULATION (THE HOLOGRAM) */}
            <div className="lg:col-span-4 space-y-6 lg:sticky lg:top-24 h-fit animate-in slide-in-from-bottom-8 fade-in duration-700 delay-200">
               
               {/* PREVIEW CARD */}
               <div className="relative group perspective-[1000px]">
                  <div className="absolute -inset-1 bg-gradient-to-r from-brand-accent to-purple-600 rounded-[2.6rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                  <div className="relative bg-white dark:bg-[#0f172a] rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/10 shadow-2xl">
                     <div className="flex justify-between items-start mb-8">
                        <div className="w-14 h-14 bg-brand-navy dark:bg-white text-white dark:text-brand-navy rounded-2xl flex items-center justify-center font-black text-xl shadow-lg">
                           {formData.name ? formData.name.charAt(0) : <Truck size={24} />}
                        </div>
                        <span className="px-3 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 rounded-lg text-[8px] font-black uppercase tracking-widest">
                           {formData.status || 'Em Aprovação'}
                        </span>
                     </div>
                     
                     <div className="space-y-2 mb-8">
                        <h4 className="text-lg font-black text-brand-navy dark:text-white uppercase leading-tight line-clamp-2">
                           {formData.name || 'Nova Transportadora'}
                        </h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-data">
                           {formData.cnpj || '00.000.000/0000-00'}
                        </p>
                     </div>

                     <div className="space-y-3 pt-6 border-t border-slate-100 dark:border-white/5">
                        <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400">
                           <span className="flex items-center gap-2"><MapPin size={12} /> Base</span>
                           <span className="text-brand-navy dark:text-white">{formData.city || '--'} / {formData.state || '--'}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] font-bold uppercase text-slate-500 dark:text-slate-400">
                           <span className="flex items-center gap-2"><Anchor size={12} /> Frota</span>
                           <span className="text-brand-navy dark:text-white">{formData.fleetType?.split('/')[0] || '--'}</span>
                        </div>
                     </div>
                  </div>
               </div>

               {/* OPERATIONAL IMPACT PREVIEW */}
               <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-[2rem] border border-slate-200 dark:border-white/5">
                  <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                     <Activity size={12} /> Capacidade Projetada
                  </h5>
                  <div className="space-y-3">
                     {formData.fleetType?.includes('Pesada') && (
                        <div className="flex items-center gap-3 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase bg-emerald-50 dark:bg-emerald-900/10 p-2 rounded-xl">
                           <TrendingUp size={14} /> Alto Volume de Carga
                        </div>
                     )}
                     {formData.fleetType?.includes('Leve') && (
                        <div className="flex items-center gap-3 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase bg-blue-50 dark:bg-blue-900/10 p-2 rounded-xl">
                           <Zap size={14} /> Agilidade Urbana
                        </div>
                     )}
                     {!formData.city && (
                        <div className="flex items-center gap-3 text-slate-400 text-[10px] font-bold uppercase bg-slate-200/50 dark:bg-white/5 p-2 rounded-xl border border-dashed border-slate-300 dark:border-white/10">
                           <AlertTriangle size={14} /> Aguardando Localização
                        </div>
                     )}
                  </div>
               </div>

            </div>
          </form>
        );

      case 2: // VISÃO GERAL
        if (!carrierMetrics) return <div className="p-10 text-center opacity-50">Dados insuficientes para análise.</div>;
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-in slide-in-from-bottom-8 fade-in duration-500">
             <MetricCard label="Cargas Totais" value={carrierMetrics.totalLoads} sub="Histórico Completo" icon={Package} color="slate" delay={0} />
             <MetricCard label="Em Operação" value={carrierMetrics.activeLoads} sub="Trânsito ou Pátio" icon={Activity} color="blue" delay={100} />
             <MetricCard label="Spend Total" value={formatCurrency(carrierMetrics.totalSpend)} sub="Investimento Logístico" icon={Wallet} color="emerald" delay={200} />
             <MetricCard label="Confiabilidade" value={`${Math.round(carrierMetrics.onTimeRate)}%`} sub="Entregas no Prazo" icon={ShieldCheck} color={carrierMetrics.onTimeRate > 90 ? 'emerald' : 'rose'} delay={300} />
             
             <div className="col-span-full mt-6 bg-white dark:bg-[#1e293b] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-premium">
                <h4 className="text-sm font-black uppercase tracking-widest mb-4 flex items-center gap-2"><Truck size={18} className="text-brand-navy dark:text-white" /> Frota e Capacidade</h4>
                <div className="flex items-center gap-4">
                   <div className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Tipo Principal</span>
                      <span className="text-sm font-black text-brand-navy dark:text-white uppercase">{formData.fleetType || 'N/A'}</span>
                   </div>
                   <div className="px-6 py-3 bg-slate-50 dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10">
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Status</span>
                      <span className={`text-sm font-black uppercase ${formData.status === 'Ativo' ? 'text-emerald-500' : 'text-slate-500'}`}>{formData.status}</span>
                   </div>
                </div>
             </div>
          </div>
        );

      case 3: // VOLUMES
        if (!carrierMetrics) return null;
        return (
          <div className="h-[500px] bg-white dark:bg-[#1e293b] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-premium animate-in zoom-in-95 duration-500">
             <h4 className="text-sm font-black uppercase tracking-widest mb-8 flex items-center gap-2"><BarChart3 size={18} className="text-blue-500" /> Evolução de Cargas (Últimos 6 Meses)</h4>
             <ResponsiveContainer width="100%" height="85%">
                <BarChart data={carrierMetrics.volumeChartData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" opacity={0.1} />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} dy={10} />
                   <Tooltip 
                      cursor={{fill: 'var(--color-surface-highlight)', opacity: 0.5}}
                      contentStyle={{backgroundColor: 'var(--color-surface)', borderRadius: '1rem', border: '1px solid var(--color-border)'}}
                   />
                   <Bar dataKey="loads" name="Cargas" fill="var(--color-brand-accent)" radius={[8, 8, 8, 8]} barSize={60} animationDuration={1500} />
                </BarChart>
             </ResponsiveContainer>
          </div>
        );

      case 4: // CUSTOS
        if (!carrierMetrics) return null;
        return (
          <div className="space-y-8 animate-in slide-in-from-bottom-8 fade-in duration-500">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <MetricCard label="Ticket Médio" value={formatCurrency(carrierMetrics.avgTicket)} sub="Custo por Viagem" icon={TrendingUp} color="amber" />
                <MetricCard label="Total Pago" value={formatCurrency(carrierMetrics.totalSpend)} sub="Acumulado Histórico" icon={Wallet} color="emerald" />
             </div>
             <div className="bg-slate-50 dark:bg-[#1e293b] p-8 rounded-[3rem] border border-slate-200 dark:border-white/5 flex items-center justify-center min-h-[300px] opacity-70">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Análise detalhada de custos por rota em desenvolvimento.</p>
             </div>
          </div>
        );

      case 5: // CIF X FOB
        if (!carrierMetrics) return null;
        const pieData = [
          { name: 'CIF (Pago LogiControl)', value: carrierMetrics.cifCount, color: '#7c3aed' },
          { name: 'FOB (Pago Cliente)', value: carrierMetrics.fobCount, color: '#06b6d4' },
        ];
        return (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[500px] animate-in zoom-in-95 duration-500">
             <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-premium flex flex-col items-center justify-center relative">
                <h4 className="absolute top-8 left-8 text-sm font-black uppercase tracking-widest flex items-center gap-2"><PieChart size={18} className="text-purple-500" /> Share de Modalidade</h4>
                <ResponsiveContainer width="100%" height="100%">
                   <PieChart>
                      <Pie data={pieData} innerRadius={80} outerRadius={120} paddingAngle={5} dataKey="value">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                   </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="text-center">
                      <span className="text-3xl font-black text-brand-navy dark:text-white font-data">{carrierMetrics.totalLoads}</span>
                      <span className="block text-[8px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
                   </div>
                </div>
             </div>
             <div className="space-y-6">
                <div className="bg-purple-50 dark:bg-purple-900/10 p-8 rounded-[3rem] border border-purple-100 dark:border-purple-500/20 h-full flex flex-col justify-center">
                   <span className="text-[10px] font-black text-purple-600 dark:text-purple-400 uppercase tracking-widest mb-2">Operações CIF</span>
                   <span className="text-5xl font-black text-brand-navy dark:text-white font-data">{carrierMetrics.cifCount}</span>
                   <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase">Frete sob gestão LogiControl</p>
                </div>
                <div className="bg-cyan-50 dark:bg-cyan-900/10 p-8 rounded-[3rem] border border-cyan-100 dark:border-cyan-500/20 h-full flex flex-col justify-center">
                   <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 uppercase tracking-widest mb-2">Operações FOB</span>
                   <span className="text-5xl font-black text-brand-navy dark:text-white font-data">{carrierMetrics.fobCount}</span>
                   <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase">Retira ou Frete Cliente</p>
                </div>
             </div>
          </div>
        );

      case 6: // PERFORMANCE
        if (!carrierMetrics) return null;
        return (
          <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
             <div className="bg-white dark:bg-[#1e293b] p-10 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-premium text-center relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-full h-2 bg-slate-100 dark:bg-white/5">
                   <div className={`h-full transition-all duration-1000 ${carrierMetrics.onTimeRate > 90 ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${carrierMetrics.onTimeRate}%` }}></div>
                </div>
                <h2 className="text-6xl font-black font-data text-brand-navy dark:text-white mb-2 group-hover:scale-110 transition-transform duration-500">{Math.round(carrierMetrics.onTimeRate)}%</h2>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">SLA de Pontualidade (On-Time Delivery)</p>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-8 bg-slate-50 dark:bg-[#020617] rounded-[2.5rem] border border-slate-200 dark:border-white/10 flex items-center gap-6">
                   <div className="p-4 bg-white dark:bg-white/10 rounded-2xl text-emerald-500 shadow-sm"><CheckCircle2 size={24} /></div>
                   <div>
                      <h4 className="text-xl font-black text-brand-navy dark:text-white uppercase">Sem Pendências</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Documentação Fiscal em dia</p>
                   </div>
                </div>
                <div className="p-8 bg-slate-50 dark:bg-[#020617] rounded-[2.5rem] border border-slate-200 dark:border-white/10 flex items-center gap-6 opacity-60">
                   <div className="p-4 bg-white dark:bg-white/10 rounded-2xl text-slate-400 shadow-sm"><AlertTriangle size={24} /></div>
                   <div>
                      <h4 className="text-xl font-black text-brand-navy dark:text-white uppercase">Ocorrências</h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">0 Registros de Avaria</p>
                   </div>
                </div>
             </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen pb-20 animate-enter">
      
      {/* HEADER: DYNAMIC */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-10 p-4 lg:p-0">
        <div className="space-y-2 group cursor-default">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-brand-navy/5 dark:bg-white/10 rounded-xl text-brand-navy dark:text-slate-400 shadow-sm">
                {mode === 'grid' ? <Truck size={18} /> : <Anchor size={18} />}
             </div>
             <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">LogiControl Fleet Command</span>
          </div>
          <h2 className="text-5xl font-black text-brand-navy dark:text-white tracking-tighter uppercase leading-none">
            {mode === 'grid' ? 'Rede de ' : selectedCarrier ? selectedCarrier.name : 'Nova '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-purple-600 animate-pulse-slow">
              {mode === 'grid' ? 'Transportes' : (selectedCarrier ? '' : 'Parceria')}
            </span>
          </h2>
        </div>

        {mode === 'grid' ? (
          isAdmin && (
            <button 
              onClick={handleCreateNew}
              className="bg-brand-accent text-white px-10 py-5 rounded-[2rem] font-black shadow-glow-accent hover:bg-opacity-90 hover:translate-y-[-4px] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] group btn-press"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Homologar Parceiro
            </button>
          )
        ) : (
          <div className="flex gap-4">
             {selectedCarrier && isAdmin && (
               <button onClick={handleDelete} className="px-6 py-4 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl border border-red-100 dark:border-red-500/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all btn-press">
                  <Trash2 size={20} />
               </button>
             )}
             <button onClick={() => setMode('grid')} className="px-8 py-4 bg-white dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/20 transition-all btn-press flex items-center gap-2">
                <ArrowLeft size={16} /> Voltar
             </button>
          </div>
        )}
      </div>

      {/* MODE: GRID VIEW */}
      {mode === 'grid' && (
        <div className="space-y-8 p-4 lg:p-0">
           <div className="relative max-w-4xl group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 dark:text-slate-500 group-focus-within:text-brand-accent transition-colors" size={22} />
              <input 
                type="text" 
                placeholder="BUSCAR PARCEIRO..."
                className="w-full pl-16 pr-8 py-6 bg-white dark:bg-[#1e293b] border border-slate-100 dark:border-white/5 rounded-[3rem] shadow-premium dark:shadow-none focus:outline-none focus:ring-8 focus:ring-brand-accent/5 focus:border-brand-accent transition-all text-sm font-black uppercase tracking-widest text-brand-navy dark:text-white"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
              {filteredCarriers.map((carrier, idx) => (
                <div 
                  key={carrier.id}
                  onClick={() => handleEdit(carrier)}
                  className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] border border-slate-100 dark:border-white/5 p-8 group cursor-pointer hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                   {/* Background Decor */}
                   <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 dark:bg-white/5 rounded-full -mr-16 -mt-16 transition-transform duration-700 group-hover:scale-150 group-hover:bg-brand-accent/5"></div>

                   <div className="flex justify-between items-start mb-8 relative z-10">
                      <div className="w-16 h-16 bg-brand-navy dark:bg-white/10 text-white rounded-[1.5rem] flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform duration-500">
                         <Truck size={24} />
                      </div>
                      <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${carrier.status === 'Ativo' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200' : 'bg-slate-100 text-slate-500'}`}>
                         {carrier.status}
                      </span>
                   </div>

                   <div className="relative z-10 space-y-2">
                      <h4 className="text-lg font-black text-brand-navy dark:text-white uppercase leading-tight group-hover:text-brand-accent transition-colors">{carrier.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-data">{formatDocument(carrier.cnpj)}</p>
                   </div>

                   <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 flex items-center justify-between text-slate-500 dark:text-slate-400 relative z-10">
                      <div className="flex items-center gap-2 text-[9px] font-bold uppercase">
                         <MapPin size={12} className="text-brand-accent" />
                         {carrier.city} / {carrier.state}
                      </div>
                      <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-white/5 flex items-center justify-center group-hover:bg-brand-navy group-hover:text-white transition-colors">
                         <ArrowRight size={14} />
                      </div>
                   </div>

                   {/* ACTION OVERLAY (HOVER) */}
                   <div className="absolute inset-0 bg-brand-navy/90 dark:bg-brand-accent/90 backdrop-blur-sm flex items-center justify-center gap-4 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 z-20">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleEdit(carrier); }}
                        className="p-4 bg-white text-brand-navy rounded-2xl shadow-lg hover:scale-110 transition-transform"
                        title="Editar Detalhes"
                      >
                         <Edit3 size={20} />
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={(e) => handleGridDelete(e, carrier)}
                          className="p-4 bg-red-500 text-white rounded-2xl shadow-lg hover:scale-110 transition-transform"
                          title="Arquivar Transportadora"
                        >
                           <Trash2 size={20} />
                        </button>
                      )}
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* MODE: WIZARD (DOSSIER) */}
      {mode === 'wizard' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 p-4 lg:p-0">
           
           {/* LEFT: WIZARD NAVIGATION */}
           <div className="xl:col-span-3 space-y-4">
              <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-premium sticky top-24">
                 <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 pl-2">Dossiê Estratégico</h4>
                 <div className="space-y-2 flex flex-col">
                    <WizardStep active={activeStep === 1} title="1. Cadastro & Frota" icon={Building2} onClick={() => setActiveStep(1)} completed={!!selectedCarrier} />
                    <WizardStep active={activeStep === 2} title="2. Visão Geral" icon={Navigation} onClick={() => selectedCarrier && setActiveStep(2)} completed={!!selectedCarrier} />
                    <WizardStep active={activeStep === 3} title="3. Volumes (Load)" icon={BarChart3} onClick={() => selectedCarrier && setActiveStep(3)} completed={!!selectedCarrier} />
                    <WizardStep active={activeStep === 4} title="4. Custos & Frete" icon={Wallet} onClick={() => selectedCarrier && setActiveStep(4)} completed={!!selectedCarrier} />
                    <WizardStep active={activeStep === 5} title="5. CIF x FOB" icon={PieChart} onClick={() => selectedCarrier && setActiveStep(5)} completed={!!selectedCarrier} />
                    <WizardStep active={activeStep === 6} title="6. Performance" icon={ShieldCheck} onClick={() => selectedCarrier && setActiveStep(6)} completed={!!selectedCarrier} />
                 </div>
              </div>
           </div>

           {/* RIGHT: CONTENT STAGE */}
           <div className="xl:col-span-9">
              {renderStepContent()}
           </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && carrierToDelete && (
        <div className="fixed inset-0 bg-brand-navy/98 dark:bg-black/90 backdrop-blur-3xl flex items-center justify-center z-[120] p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-[4rem] shadow-gesla-hard overflow-hidden animate-in zoom-in duration-500 border border-white/20 relative">
            <button onClick={() => setIsDeleteModalOpen(false)} className="absolute top-6 right-6 p-3 text-slate-300 hover:text-brand-navy dark:hover:text-white rounded-full hover:bg-slate-50 dark:hover:bg-white/10 transition-all btn-press"><X size={20} /></button>
            <div className="p-12 text-center pb-6">
               <div className="w-24 h-24 bg-brand-red/10 rounded-[2.5rem] flex items-center justify-center text-brand-red mx-auto mb-8 shadow-glow-red border border-brand-red/10 relative group">
                 <ShieldAlert size={48} className="relative z-10 animate-pulse" />
                 <div className="absolute inset-0 bg-brand-red/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
               </div>
               <h3 className="text-2xl font-black text-brand-navy dark:text-white uppercase tracking-tighter leading-none mb-4">Excluir Parceiro?</h3>
               <div className="space-y-2 mb-2">
                 <p className="text-brand-red font-black font-data text-lg">{carrierToDelete.name}</p>
                 <p className="text-slate-500 text-[10px] font-bold leading-relaxed uppercase tracking-[0.2em] px-2 line-clamp-2">{formatDocument(carrierToDelete.cnpj)}</p>
               </div>
               <p className="text-[9px] text-slate-400 uppercase mt-4">Esta ação arquivará a transportadora.</p>
            </div>
            <div className="p-12 pt-4 flex flex-col gap-3">
              <button type="button" onClick={confirmDelete} className="w-full bg-brand-red text-white py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-brand-red-deep transition-all shadow-xl shadow-red-900/20 active:scale-95 group flex items-center justify-center gap-2 btn-press"><Trash2 size={16} /> Confirmar</button>
              <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="w-full py-5 rounded-[1.5rem] font-black text-slate-400 uppercase text-[10px] tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 hover:text-brand-navy dark:hover:text-white transition-all btn-press">Cancelar</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CarrierManagement;
