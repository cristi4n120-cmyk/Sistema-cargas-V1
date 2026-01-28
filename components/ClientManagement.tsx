import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Phone, Mail, User, Trash2, Edit3, X, 
  CheckCircle2, MapPin, Briefcase, Hash, ShieldAlert, 
  TrendingUp, Building2, Save, Wallet, Package, Activity,
  Filter, ArrowRight, ArrowLeft, Globe, BadgeCheck,
  CreditCard, Landmark, AlertTriangle
} from 'lucide-react';
import { clientService } from '../services/clientService';
import { loadService } from '../services/loadService';
import { Client, ClientType, UserRole, Load } from '../types';
import { userService } from '../services/userService';
import { UFS } from '../constants';
import { maskDocument, maskPhone, maskCEP, formatDocument, formatPhone, formatCurrency } from '../utils/formatters';

// --- COMPONENTES TÁTICOS (Internal Reuse) ---

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

const FiscalSelector = ({ value, onChange }: any) => {
  const options = [
    { id: ClientType.CONTRIBUTOR, label: 'Contribuinte ICMS', icon: BadgeCheck, desc: 'Indústria / Comércio', color: 'emerald' },
    { id: ClientType.NON_CONTRIBUTOR, label: 'Não Contribuinte', icon: ShieldAlert, desc: 'Consumo Final / PF', color: 'amber' },
  ];

  return (
    <div className="grid grid-cols-2 gap-4">
      {options.map((opt) => (
        <button
          key={opt.id}
          type="button"
          onClick={() => onChange(opt.id)}
          className={`
            relative flex flex-col items-start p-5 rounded-3xl border-2 transition-all duration-300 group overflow-hidden text-left
            ${value === opt.id 
              ? (opt.color === 'emerald' 
                  ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-500 text-emerald-700 dark:text-emerald-400' 
                  : 'bg-amber-50 dark:bg-amber-900/10 border-amber-500 text-amber-700 dark:text-amber-400')
              : 'bg-white dark:bg-[#0f172a] border-slate-200 dark:border-white/10 text-slate-400 hover:border-brand-navy/30 dark:hover:border-white/30'
            }
          `}
        >
          {value === opt.id && (
             <div className="absolute top-3 right-3 animate-in zoom-in duration-300">
                <CheckCircle2 size={18} />
             </div>
          )}
          <opt.icon size={24} className={`mb-3 ${value === opt.id ? 'scale-110' : 'grayscale group-hover:grayscale-0'} transition-all`} />
          <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
          <span className="text-[8px] font-bold opacity-70 uppercase mt-1">{opt.desc}</span>
        </button>
      ))}
    </div>
  );
};

const ClientManagement: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]);
  const [loads, setLoads] = useState<Load[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  
  // UI States
  const [mode, setMode] = useState<'grid' | 'wizard'>('grid');
  const [activeStep, setActiveStep] = useState(1);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);
  
  const currentUser = userService.getCurrentUser();
  const isAdmin = currentUser.role === UserRole.ADMIN;

  const [formData, setFormData] = useState<Partial<Client>>({
    name: '', cnpj: '', contact: '', email: '', phone: '',
    type: ClientType.CONTRIBUTOR, zipCode: '', address: '',
    number: '', neighborhood: '', city: '', state: ''
  });

  const refreshData = () => {
    setClients(clientService.getClients());
    setLoads(loadService.getLoads());
  };

  useEffect(() => { refreshData(); }, []);

  // --- MÉTODOS DE CÁLCULO ESTRATÉGICO ---
  const getClientMetrics = (clientId: string) => {
    const clientLoads = loads.filter(l => l.clientId === clientId || (l.client && l.client.includes(clients.find(c => c.id === clientId)?.name || 'XYZ')));
    const totalSpent = clientLoads.reduce((acc, l) => acc + (l.financial?.customerFreightValue || 0), 0);
    const totalLoads = clientLoads.length;
    
    const sortedLoads = [...clientLoads].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastLoadDate = sortedLoads[0]?.date;

    return { totalSpent, totalLoads, lastLoadDate };
  };

  const globalMetrics = useMemo(() => {
    const activeClients = clients.length;
    const nonContributors = clients.filter(c => c.type === ClientType.NON_CONTRIBUTOR).length;
    const totalRevenue = loads.reduce((acc, l) => acc + (l.financial?.customerFreightValue || 0), 0);
    return { activeClients, nonContributors, totalRevenue };
  }, [clients, loads]);

  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.cnpj.includes(searchTerm);
      const matchesType = filterType === 'all' || c.type === filterType;
      return matchesSearch && matchesType;
    });
  }, [clients, searchTerm, filterType]);

  const handleCreateNew = () => {
    setFormData({
      name: '', cnpj: '', contact: '', email: '', phone: '',
      type: ClientType.CONTRIBUTOR, zipCode: '', address: '',
      number: '', neighborhood: '', city: '', state: ''
    });
    setMode('wizard');
    setActiveStep(1);
  };

  const handleEdit = (client: Client) => {
    setFormData(client);
    setMode('wizard');
    setActiveStep(1);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    clientService.saveClient(formData);
    refreshData();
    setMode('grid');
  };

  const handleRequestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); e.preventDefault();
    const target = clients.find(c => c.id === id);
    if (target) { setClientToDelete(target); setIsDeleteModalOpen(true); }
  };

  const confirmDelete = () => {
    if (clientToDelete) {
      clientService.deleteClient(clientToDelete.id);
      refreshData();
      setIsDeleteModalOpen(false);
      setClientToDelete(null);
    }
  };

  // --- WIZARD CONTENT RENDERER ---
  const renderWizardStep = () => {
    switch (activeStep) {
      case 1: // IDENTIDADE & FISCAL
        return (
          <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
             <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-premium">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-brand-navy dark:bg-white text-white dark:text-brand-navy rounded-2xl flex items-center justify-center shadow-lg"><Briefcase size={22} /></div>
                   <div>
                      <h3 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest">Identidade Comercial</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Dados fiscais da empresa ou pessoa</p>
                   </div>
                </div>
                
                <div className="space-y-6">
                   <TacticalInput label="Razão Social / Nome" icon={Building2} value={formData.name} onChange={(e: any) => setFormData({...formData, name: e.target.value.toUpperCase()})} autoFocus />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <TacticalInput label="CNPJ / CPF" icon={Hash} value={formData.cnpj} onChange={(e: any) => setFormData({...formData, cnpj: maskDocument(e.target.value)})} maxLength={18} />
                      
                      {/* FISCAL TOGGLE */}
                      <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-2xl border border-slate-200 dark:border-white/10">
                         <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Enquadramento Fiscal</label>
                         <FiscalSelector value={formData.type} onChange={(val: any) => setFormData({...formData, type: val})} />
                      </div>
                   </div>
                </div>
             </div>
          </div>
        );
      
      case 2: // GEOLOCALIZAÇÃO
        return (
          <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
             <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-premium">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-brand-accent text-white rounded-2xl flex items-center justify-center shadow-glow-accent"><MapPin size={22} /></div>
                   <div>
                      <h3 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest">Base Logística</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Endereço de entrega principal</p>
                   </div>
                </div>

                <div className="grid grid-cols-12 gap-6">
                   <div className="col-span-4 md:col-span-3">
                      <TacticalInput label="CEP" icon={MapPin} value={formData.zipCode} onChange={(e: any) => setFormData({...formData, zipCode: maskCEP(e.target.value)})} maxLength={9} />
                   </div>
                   <div className="col-span-8 md:col-span-6">
                      <TacticalInput label="Cidade" icon={Globe} value={formData.city} onChange={(e: any) => setFormData({...formData, city: e.target.value.toUpperCase()})} />
                   </div>
                   <div className="col-span-12 md:col-span-3">
                      <div className="relative group h-full">
                         <select 
                            className="w-full h-[56px] bg-slate-50 dark:bg-[#020617] border border-slate-200 dark:border-white/10 rounded-2xl px-4 text-xs font-black uppercase outline-none appearance-none cursor-pointer focus:border-brand-accent text-brand-navy dark:text-white"
                            value={formData.state}
                            onChange={e => setFormData({...formData, state: e.target.value})}
                         >
                            <option value="">UF</option>
                            {UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}
                         </select>
                         <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"><ArrowRight size={14} className="rotate-90" /></div>
                      </div>
                   </div>
                   <div className="col-span-12 md:col-span-9">
                      <TacticalInput label="Logradouro" icon={MapPin} value={formData.address} onChange={(e: any) => setFormData({...formData, address: e.target.value.toUpperCase()})} />
                   </div>
                   <div className="col-span-6 md:col-span-3">
                      <TacticalInput label="Número" icon={Hash} value={formData.number} onChange={(e: any) => setFormData({...formData, number: e.target.value})} />
                   </div>
                   <div className="col-span-6 md:col-span-12">
                      <TacticalInput label="Bairro" icon={MapPin} value={formData.neighborhood} onChange={(e: any) => setFormData({...formData, neighborhood: e.target.value.toUpperCase()})} />
                   </div>
                </div>
             </div>
          </div>
        );

      case 3: // CONTATOS
        return (
          <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
             <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-premium">
                <div className="flex items-center gap-4 mb-8">
                   <div className="w-12 h-12 bg-emerald-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20"><User size={22} /></div>
                   <div>
                      <h3 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest">Contatos Chave</h3>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Responsáveis pelo recebimento</p>
                   </div>
                </div>

                <div className="space-y-6">
                   <TacticalInput label="Nome do Contato" icon={User} value={formData.contact} onChange={(e: any) => setFormData({...formData, contact: e.target.value.toUpperCase()})} />
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <TacticalInput label="Telefone / WhatsApp" icon={Phone} value={formData.phone} onChange={(e: any) => setFormData({...formData, phone: maskPhone(e.target.value)})} maxLength={15} />
                      <TacticalInput label="E-mail" icon={Mail} value={formData.email} onChange={(e: any) => setFormData({...formData, email: e.target.value})} type="email" />
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
      
      {/* HEADER: INTELLIGENCE HUB */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 relative z-10 mb-8 p-4 lg:p-0">
        <div className="space-y-2 group cursor-default">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-brand-navy/5 dark:bg-white/10 rounded-xl text-brand-navy dark:text-slate-400 group-hover:rotate-12 transition-transform duration-500 shadow-sm">
                {mode === 'grid' ? <Briefcase size={18} /> : <Edit3 size={18} />}
             </div>
             <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Base Comercial</span>
          </div>
          <h2 className="text-5xl font-black text-brand-navy dark:text-white tracking-tighter uppercase leading-none">
            {mode === 'grid' ? 'Inteligência de ' : (formData.id ? 'Gerenciar ' : 'Novo ')}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-purple-600 animate-pulse-slow">
              {mode === 'grid' ? 'Clientes' : 'Cliente'}
            </span>
          </h2>
        </div>

        {mode === 'grid' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 w-full xl:w-auto">
             <div className="bg-white dark:bg-[#1e293b] p-4 rounded-[1.8rem] border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-xl"><Building2 size={18} /></div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Base Ativa</p>
                   <p className="text-xl font-black text-brand-navy dark:text-white font-data">{globalMetrics.activeClients}</p>
                </div>
             </div>
             <div className="bg-white dark:bg-[#1e293b] p-4 rounded-[1.8rem] border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-4">
                <div className="p-3 bg-brand-accent/10 text-brand-accent rounded-xl"><Wallet size={18} /></div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Movimentado</p>
                   <p className="text-xl font-black text-brand-navy dark:text-white font-data truncate">{formatCurrency(globalMetrics.totalRevenue).split(',')[0]}</p>
                </div>
             </div>
             <div className="bg-white dark:bg-[#1e293b] p-4 rounded-[1.8rem] border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-4 col-span-2 md:col-span-1">
                <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl"><ShieldAlert size={18} /></div>
                <div>
                   <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Risco DIFAL</p>
                   <p className="text-xl font-black text-brand-navy dark:text-white font-data">{globalMetrics.nonContributors}</p>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* MODE: GRID VIEW */}
      {mode === 'grid' && (
        <div className="space-y-8 p-4 lg:p-0">
           {/* CONTROL BAR */}
           <div className={`
             bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-xl p-3 pl-6 rounded-[2.5rem] shadow-premium dark:shadow-none 
             flex flex-wrap items-center justify-between gap-4 border border-slate-200/50 dark:border-white/5 
             transition-all duration-500 hover:shadow-2xl dark:hover:shadow-glow-hover hover:border-brand-accent/30 z-30
           `}>
             <div className="flex-1 flex items-center gap-4 min-w-[280px]">
               <Search className="text-slate-300 dark:text-slate-500" size={24} />
               <input 
                 type="text" 
                 placeholder="BUSCAR EMPRESA, CNPJ OU CIDADE..." 
                 className="w-full bg-transparent text-xs font-black uppercase tracking-widest placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none text-brand-navy dark:text-white h-12"
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
               />
             </div>

             <div className="flex items-center gap-3">
               <div className="relative group">
                 <Filter className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-hover:text-brand-accent transition-colors" size={16} />
                 <select 
                   className="pl-12 pr-10 py-4 bg-slate-50 dark:bg-[#020617] border border-slate-100 dark:border-white/5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400 outline-none cursor-pointer hover:border-brand-accent/30 focus:border-brand-accent transition-all appearance-none min-w-[180px]"
                   value={filterType}
                   onChange={(e) => setFilterType(e.target.value)}
                 >
                   <option value="all">Tipo: Todos</option>
                   <option value={ClientType.CONTRIBUTOR}>Contribuinte</option>
                   <option value={ClientType.NON_CONTRIBUTOR}>Não Contribuinte</option>
                 </select>
               </div>

               {isAdmin && (
                 <button 
                   onClick={handleCreateNew}
                   className="bg-brand-navy dark:bg-white text-white dark:text-brand-navy px-8 py-4 rounded-[2rem] font-black uppercase text-[10px] tracking-[0.2em] flex items-center gap-3 hover:bg-brand-accent dark:hover:bg-brand-accent dark:hover:text-white transition-all shadow-lg hover:translate-y-[-2px] btn-press pointer-events-auto overflow-hidden relative group"
                 >
                   <span className="relative z-10 flex items-center gap-2"><Plus size={18} /> Novo Cliente</span>
                   <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover:animate-shine"></div>
                 </button>
               )}
             </div>
           </div>

           {/* CLIENT CARDS */}
           <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-8">
             {filteredClients.map((client, idx) => {
               const metrics = getClientMetrics(client.id);
               const isNonContributor = client.type === ClientType.NON_CONTRIBUTOR;
               const isHighValue = metrics.totalSpent > 50000;
               
               return (
                 <div 
                   key={client.id} 
                   className={`
                     relative bg-white dark:bg-[#1e293b] rounded-[2.5rem] border transition-all duration-500 p-8 group animate-slide-up flex flex-col h-full 
                     hover:shadow-2xl hover:-translate-y-2 overflow-hidden cursor-default
                     ${isHighValue 
                        ? 'border-brand-accent/30 shadow-[0_0_30px_rgba(var(--color-brand-accent),0.05)]' 
                        : 'border-slate-100 dark:border-white/5 hover:border-brand-navy/20 dark:hover:border-white/20'
                     }
                   `}
                   style={{ animationDelay: `${idx * 60}ms` }}
                 >
                   {/* High Value Glow */}
                   {isHighValue && <div className="absolute -right-20 -top-20 w-40 h-40 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none group-hover:bg-brand-accent/20 transition-colors"></div>}

                   {/* CARD HEADER */}
                   <div className="flex justify-between items-start mb-8 relative z-10">
                     <div className="flex items-center gap-5 min-w-0">
                       <div className={`
                         w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all duration-500 shrink-0 shadow-lg text-xl font-black
                         ${isNonContributor 
                           ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-white' 
                           : 'bg-white dark:bg-white/5 text-brand-navy dark:text-white border border-slate-100 dark:border-white/10 group-hover:bg-brand-navy group-hover:text-white dark:group-hover:bg-white dark:group-hover:text-brand-navy'
                         }
                       `}>
                         {client.name.charAt(0)}
                       </div>
                       <div className="min-w-0 space-y-1">
                         <h4 className="font-black text-brand-navy dark:text-white uppercase text-sm leading-tight truncate w-full" title={client.name}>
                           {client.name}
                         </h4>
                         <div className="flex items-center gap-2">
                           <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest font-data">
                             {formatDocument(client.cnpj)}
                           </p>
                           {isNonContributor && (
                              <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" title="Atenção Fiscal"></div>
                           )}
                         </div>
                       </div>
                     </div>
                     
                     {isAdmin && (
                       <button 
                         onClick={() => handleEdit(client)} 
                         className="p-3 text-slate-300 hover:text-brand-accent bg-transparent hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-all opacity-0 group-hover:opacity-100 translate-x-4 group-hover:translate-x-0 duration-300"
                       >
                         <Edit3 size={18} />
                       </button>
                     )}
                   </div>

                   {/* INFO GRID */}
                   <div className="space-y-5 flex-1 relative z-10">
                     <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#020617] border border-slate-100 dark:border-white/5">
                           <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Contato</span>
                           <p className="text-[10px] font-bold text-brand-navy dark:text-white uppercase truncate flex items-center gap-2">
                              <User size={10} className="text-brand-accent" /> {client.contact.split(' ')[0]}
                           </p>
                        </div>
                        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#020617] border border-slate-100 dark:border-white/5">
                           <span className="text-[8px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest block mb-1">Telefone</span>
                           <p className="text-[10px] font-bold text-brand-navy dark:text-white font-data flex items-center gap-2">
                              <Phone size={10} className="text-brand-accent" /> {formatPhone(client.phone)}
                           </p>
                        </div>
                     </div>
                     
                     <div className="flex items-start gap-3 p-3">
                        <MapPin size={16} className="text-slate-300 dark:text-slate-600 mt-0.5 shrink-0 group-hover:text-brand-accent transition-colors" />
                        <div>
                           <p className="text-[11px] font-black text-brand-navy dark:text-white leading-tight uppercase">
                             {client.city} <span className="text-slate-300">/</span> {client.state}
                           </p>
                           <p className="text-[9px] font-bold text-slate-400 mt-0.5 truncate max-w-[200px]">{client.address}, {client.number}</p>
                        </div>
                     </div>
                   </div>

                   {/* METRICS DASHBOARD (MINI) */}
                   <div className="mt-8 pt-6 border-t border-slate-100 dark:border-white/5 grid grid-cols-3 gap-2 relative z-10">
                      <div className="text-center border-r border-slate-100 dark:border-white/5 pr-2">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cargas</span>
                         <div className="flex items-center justify-center gap-1 text-brand-navy dark:text-white">
                            <Package size={10} />
                            <span className="text-xs font-black font-data">{metrics.totalLoads}</span>
                         </div>
                      </div>
                      <div className="text-center border-r border-slate-100 dark:border-white/5 px-2">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Volume</span>
                         <div className="flex items-center justify-center gap-1 text-emerald-600 dark:text-emerald-400">
                            <TrendingUp size={10} />
                            <span className="text-xs font-black font-data">{metrics.totalSpent > 1000 ? `${(metrics.totalSpent/1000).toFixed(0)}k` : metrics.totalSpent}</span>
                         </div>
                      </div>
                      <div className="text-center pl-2">
                         <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Última</span>
                         <div className="flex items-center justify-center gap-1 text-brand-navy dark:text-white">
                            <Activity size={10} />
                            <span className="text-xs font-black font-data">
                              {metrics.lastLoadDate ? new Date(metrics.lastLoadDate).toLocaleDateString(undefined, {day:'2-digit', month:'2-digit'}) : '--'}
                            </span>
                         </div>
                      </div>
                   </div>

                   {/* ACTION OVERLAY (HOVER) */}
                   <div className="absolute inset-0 bg-brand-navy/90 dark:bg-brand-accent/90 backdrop-blur-sm flex items-center justify-center gap-4 opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-all duration-300 z-20">
                      <button 
                        onClick={() => handleEdit(client)}
                        className="p-4 bg-white text-brand-navy rounded-2xl shadow-lg hover:scale-110 transition-transform"
                        title="Editar Detalhes"
                      >
                         <Edit3 size={20} />
                      </button>
                      {isAdmin && (
                        <button 
                          onClick={(e) => handleRequestDelete(e, client.id)}
                          className="p-4 bg-red-500 text-white rounded-2xl shadow-lg hover:scale-110 transition-transform"
                          title="Arquivar Cliente"
                        >
                           <Trash2 size={20} />
                        </button>
                      )}
                   </div>
                 </div>
               );
             })}
           </div>
        </div>
      )}

      {/* MODE: WIZARD */}
      {mode === 'wizard' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 p-4 lg:p-0">
           
           {/* LEFT NAVIGATION */}
           <div className="xl:col-span-3 space-y-4">
              <div className="bg-white dark:bg-[#1e293b] p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-premium sticky top-24">
                 <button onClick={() => setMode('grid')} className="w-full mb-6 flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-brand-navy dark:hover:text-white transition-colors">
                    <ArrowLeft size={12} /> Voltar para Lista
                 </button>
                 <div className="space-y-2 flex flex-col">
                    {[
                      { step: 1, label: 'Identidade & Fiscal', icon: Briefcase },
                      { step: 2, label: 'Geolocalização', icon: MapPin },
                      { step: 3, label: 'Contatos', icon: Phone }
                    ].map(s => (
                      <button
                        key={s.step}
                        onClick={() => setActiveStep(s.step)}
                        className={`
                          flex items-center gap-3 px-5 py-3 rounded-2xl transition-all duration-300 border w-full text-left
                          ${activeStep === s.step 
                            ? 'bg-brand-navy dark:bg-white text-white dark:text-brand-navy border-brand-navy dark:border-white shadow-lg scale-[1.02]' 
                            : 'bg-transparent text-slate-400 border-transparent hover:bg-slate-50 dark:hover:bg-white/5'
                          }
                        `}
                      >
                        <s.icon size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest flex-1">{s.label}</span>
                        {activeStep > s.step && <CheckCircle2 size={14} className="text-emerald-500" />}
                      </button>
                    ))}
                 </div>
              </div>
           </div>

           {/* CENTER FORM */}
           <div className="xl:col-span-5">
              <form onSubmit={handleSubmit}>
                 {renderWizardStep()}
                 
                 <div className="flex justify-between mt-8 pt-4">
                    {activeStep > 1 && (
                       <button type="button" onClick={() => setActiveStep(prev => prev - 1)} className="px-8 py-4 bg-white dark:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-brand-navy dark:hover:text-white transition-all btn-press border border-slate-200 dark:border-white/10">
                          Anterior
                       </button>
                    )}
                    
                    <div className="flex-1 flex justify-end">
                       {activeStep < 3 ? (
                          <button type="button" onClick={() => setActiveStep(prev => prev + 1)} className="px-10 py-4 bg-brand-navy dark:bg-white text-white dark:text-brand-navy rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent dark:hover:bg-brand-accent dark:hover:text-white transition-all shadow-lg flex items-center gap-2 btn-press">
                             Próximo <ArrowRight size={16} />
                          </button>
                       ) : (
                          <button type="submit" className="px-10 py-4 bg-emerald-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg flex items-center gap-2 btn-press">
                             <Save size={16} /> Salvar Cliente
                          </button>
                       )}
                    </div>
                 </div>
              </form>
           </div>

           {/* RIGHT LIVE PREVIEW */}
           <div className="xl:col-span-4 lg:sticky lg:top-24 h-fit animate-in slide-in-from-bottom-8 fade-in duration-700 delay-200">
              <div className="relative group">
                 <div className="absolute -inset-1 bg-gradient-to-br from-brand-accent to-purple-600 rounded-[2.6rem] blur opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                 <div className="relative bg-white dark:bg-[#0f172a] rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/10 shadow-2xl">
                    <div className="flex justify-between items-start mb-8">
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-lg transition-colors ${formData.type === ClientType.NON_CONTRIBUTOR ? 'bg-amber-500 text-white' : 'bg-brand-navy dark:bg-white text-white dark:text-brand-navy'}`}>
                          {formData.name ? formData.name.charAt(0) : <Briefcase size={24} />}
                       </div>
                       <div className="flex flex-col items-end">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Status Fiscal</span>
                          <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${formData.type === ClientType.NON_CONTRIBUTOR ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200' : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 border-emerald-200'}`}>
                             {formData.type === ClientType.NON_CONTRIBUTOR ? 'Não Contribuinte' : 'Contribuinte'}
                          </span>
                       </div>
                    </div>
                    
                    <div className="space-y-2 mb-8">
                       <h4 className="text-lg font-black text-brand-navy dark:text-white uppercase leading-tight line-clamp-2">
                          {formData.name || 'Novo Cliente'}
                       </h4>
                       <p className="text-[10px] font-bold text-slate-400 font-data">
                          {formData.cnpj || '00.000.000/0000-00'}
                       </p>
                    </div>

                    <div className="space-y-4 pt-6 border-t border-slate-100 dark:border-white/5">
                       <div className="flex items-center gap-3">
                          <MapPin size={14} className="text-slate-400" />
                          <p className="text-[10px] font-bold uppercase text-brand-navy dark:text-white">
                             {formData.city || 'CIDADE'} / {formData.state || 'UF'}
                          </p>
                       </div>
                       <div className="flex items-center gap-3">
                          <User size={14} className="text-slate-400" />
                          <p className="text-[10px] font-bold uppercase text-brand-navy dark:text-white">
                             {formData.contact ? formData.contact.split(' ')[0] : 'CONTATO'}
                          </p>
                       </div>
                    </div>

                    {formData.type === ClientType.NON_CONTRIBUTOR && (
                       <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl flex items-center gap-3 animate-slide-up">
                          <AlertTriangle size={18} className="text-amber-500" />
                          <p className="text-[9px] font-bold text-amber-700 dark:text-amber-400 uppercase leading-tight">
                             Atenção: Operações para este cliente terão incidência automática de DIFAL.
                          </p>
                       </div>
                    )}
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {isDeleteModalOpen && clientToDelete && (
        <div className="fixed inset-0 bg-brand-navy/98 dark:bg-black/90 backdrop-blur-3xl flex items-center justify-center z-[120] p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-[4rem] shadow-premium overflow-hidden animate-in zoom-in duration-500 border border-white/20 relative">
            <button onClick={() => setIsDeleteModalOpen(false)} className="absolute top-6 right-6 p-3 text-slate-300 hover:text-brand-navy dark:hover:text-white rounded-full hover:bg-slate-50 dark:hover:bg-white/10 transition-all btn-press"><X size={20} /></button>
            <div className="p-12 text-center pb-6">
               <div className="w-24 h-24 bg-brand-red/10 rounded-[2.5rem] flex items-center justify-center text-brand-red mx-auto mb-8 shadow-glow-red border border-brand-red/10 relative group">
                 <ShieldAlert size={48} className="relative z-10 animate-pulse" />
                 <div className="absolute inset-0 bg-brand-red/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
               </div>
               <h3 className="text-2xl font-black text-brand-navy dark:text-white uppercase tracking-tighter leading-none mb-4">Excluir Cliente?</h3>
               <div className="space-y-2 mb-2">
                 <p className="text-brand-red font-black font-data text-lg">{clientToDelete.name}</p>
                 <p className="text-slate-500 text-[10px] font-bold leading-relaxed uppercase tracking-[0.2em] px-2 line-clamp-2">{formatDocument(clientToDelete.cnpj)}</p>
               </div>
               <p className="text-[9px] text-slate-400 uppercase mt-4">Esta ação arquivará o cliente.</p>
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

export default ClientManagement;