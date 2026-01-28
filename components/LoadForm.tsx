import React, { useState, useEffect, useMemo, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { useNavigate, useParams } = ReactRouterDOM;
import { 
  Save, ArrowLeft, Plus, Trash2, Package, 
  MapPin, Upload, FileCheck, ArrowRight, X,
  Search, DollarSign, Scale, Calendar, 
  Briefcase, Building2, Receipt, Percent, TrendingUp, TrendingDown,
  Wallet, Lock, History, AlertTriangle, ToggleLeft, ToggleRight, ShieldAlert,
  CheckCircle2, Box, ChevronUp, ChevronDown, GripVertical, FileSignature
} from 'lucide-react';
import { 
  Load, LoadItem, ShippingType, ClientType, MovementType, 
  PaymentType, LoadStatus, Client, Carrier, UserRole, Material, DeliveryPoint,
  FinancialData
} from '../types';
import { loadService } from '../services/loadService';
import { clientService } from '../services/clientService';
import { carrierService } from '../services/carrierService';
import { materialService } from '../services/materialService'; 
import { settingsService } from '../services/settingsService';
import { userService } from '../services/userService';
import { formatCurrency, formatDecimal } from '../utils/formatters';
import GeslaDatePicker from './GeslaDatePicker';

// --- SUB-COMPONENTS VISUAIS (Internal) ---

const TacticalInput = ({ label, icon: Icon, value, onChange, type = "text", placeholder, list, className, readOnly, ...props }: any) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== undefined && value !== '' && value !== null;

  return (
    <div className={`relative group ${className}`}>
      <div className={`
        absolute -inset-0.5 bg-gradient-to-r from-brand-accent to-brand-navy rounded-2xl opacity-0 
        transition-opacity duration-500 blur-sm group-hover:opacity-20
        ${isFocused ? 'opacity-40' : ''}
      `}></div>
      <div className={`
        relative flex items-center bg-white dark:bg-[#020617] rounded-2xl overflow-hidden border transition-all duration-300
        ${isFocused 
          ? 'border-brand-accent shadow-[0_0_20px_rgba(var(--color-brand-accent),0.15)]' 
          : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20'
        }
      `}>
        {Icon && (
          <div className={`pl-4 pr-2 transition-colors duration-300 ${isFocused ? 'text-brand-accent' : 'text-slate-400'}`}>
            <Icon size={18} />
          </div>
        )}
        <div className="flex-1 relative h-[52px]">
          <input
            type={type}
            value={value}
            onChange={onChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder || " "} // Espaço para hack do peer-placeholder
            readOnly={readOnly}
            className={`
              peer w-full h-full bg-transparent text-brand-navy dark:text-white font-bold text-xs outline-none px-3 pt-4 pb-1 
              placeholder-transparent font-data tracking-wider z-10 relative uppercase
              ${readOnly ? 'cursor-not-allowed opacity-70' : ''}
            `}
            list={list}
            {...props}
          />
          <label className={`
            absolute left-3 top-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest transition-all duration-300 pointer-events-none
            peer-placeholder-shown:top-4 peer-placeholder-shown:text-[10px] peer-placeholder-shown:text-slate-400
            peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:text-brand-accent
            ${hasValue ? 'top-1.5 text-[8px]' : ''}
          `}>
            {label}
          </label>
        </div>
      </div>
    </div>
  );
};

const LoadForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [settings] = useState(settingsService.getSettings());
  const currentUser = userService.getCurrentUser();

  const [currentStep, setCurrentStep] = useState(1);
  const [availableClients] = useState<Client[]>(clientService.getClients());
  const [availableCarriers] = useState<Carrier[]>(carrierService.getCarriers());
  const [availableMaterials] = useState<Material[]>(materialService.getMaterials());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // States de Busca
  const [clientSearch, setClientSearch] = useState('');
  const [carrierSearch, setCarrierSearch] = useState('');
  const [showClientResults, setShowClientResults] = useState(false);
  const [showCarrierResults, setShowCarrierResults] = useState(false);
  const [activeItemSearch, setActiveItemSearch] = useState<{ deliveryId: string, itemId: string, field: 'code' | 'description' } | null>(null);

  // Drag & Drop State
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  // Refs
  const clientRef = useRef<HTMLDivElement>(null);
  const carrierRef = useRef<HTMLDivElement>(null);
  const difalInputRef = useRef<HTMLInputElement>(null);
  const paymentInputRef = useRef<HTMLInputElement>(null);
  const deliveryProofInputRef = useRef<HTMLInputElement>(null); // New POD Ref
  const itemSearchRef = useRef<HTMLDivElement>(null);

  // --- STATE INICIALIZADO ---
  const [formData, setFormData] = useState<Partial<Load>>({
    shippingType: settings.defaultShippingType,
    clientType: ClientType.CONTRIBUTOR,
    items: [],
    deliveries: [],
    movementType: MovementType.SALE,
    hasDifal: false,
    canComplement: false,
    paymentType: PaymentType.BILLED,
    status: LoadStatus.TRANSIT,
    vehicle: { type: 'N/A', plate: '', driverName: '' },
    financial: { freightValue: 0, customerFreightValue: 0, extraCosts: 0, invoiceValue: 0, currency: 'BRL' },
    totalWeight: 0,
    totalVolume: 0
  });

  useEffect(() => {
    if (isEdit) {
      const load = loadService.getLoadById(id);
      if (load) {
        if (!load.financial) {
            load.financial = { 
                freightValue: load.freightValue || 0, 
                customerFreightValue: 0, 
                extraCosts: 0, 
                invoiceValue: 0, 
                currency: 'BRL' 
            };
        } else if (load.financial.customerFreightValue === undefined) {
            load.financial.customerFreightValue = 0;
        }
        setFormData(load);
        setCarrierSearch(load.carrier || '');
      }
    }
  }, [id, isEdit]);

  // Recalculo automático de cabeçalho
  useEffect(() => {
    if (formData.deliveries) {
      const allItems = formData.deliveries.flatMap(d => d.items);
      const mainDelivery = formData.deliveries[0];
      const multiple = formData.deliveries.length > 1;
      
      const newClientType = mainDelivery?.clientType || ClientType.CONTRIBUTOR;

      setFormData(prev => ({
        ...prev,
        items: allItems,
        client: multiple ? `${mainDelivery?.clientName} (+${formData.deliveries!.length - 1})` : (mainDelivery?.clientName || ''),
        clientId: mainDelivery?.clientId,
        clientType: newClientType,
        destinationCity: multiple ? 'Múltiplos Destinos' : (mainDelivery?.address.city || ''),
        destinationUF: multiple ? 'MULTI' : (mainDelivery?.address.state || ''),
      }));
    }
  }, [formData.deliveries]);

  // Click Outside Handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (clientRef.current && !clientRef.current.contains(event.target as Node)) setShowClientResults(false);
      if (carrierRef.current && !carrierRef.current.contains(event.target as Node)) setShowCarrierResults(false);
      if (itemSearchRef.current && !itemSearchRef.current.contains(event.target as Node)) setActiveItemSearch(null);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtros
  const filteredClients = useMemo(() => {
    if (!clientSearch) return availableClients;
    return availableClients.filter(c => c.name.toLowerCase().includes(clientSearch.toLowerCase()) || c.cnpj.includes(clientSearch));
  }, [clientSearch, availableClients]);

  const filteredCarriers = useMemo(() => {
    if (!carrierSearch) return availableCarriers;
    return availableCarriers.filter(c => c.name.toLowerCase().includes(carrierSearch.toLowerCase()) || c.cnpj.includes(carrierSearch));
  }, [carrierSearch, availableCarriers]);

  const getFilteredMaterials = (term: string) => {
    if (!term) return [];
    const termLower = term.toLowerCase();
    return availableMaterials.filter(m => m.code.toLowerCase().includes(termLower) || m.description.toLowerCase().includes(termLower)).slice(0, 8);
  };

  // --- HANDLERS ---

  const updateFinancial = (field: keyof FinancialData, value: any) => {
    setFormData(prev => ({
      ...prev,
      financial: { ...prev.financial!, [field]: parseFloat(value) || 0 },
      freightValue: field === 'freightValue' ? parseFloat(value) || 0 : prev.freightValue // Sync legacy
    }));
  };

  const handleAddDelivery = (client: Client) => {
    const newDelivery: DeliveryPoint = {
      id: Math.random().toString(36).substr(2, 9),
      clientId: client.id,
      clientName: client.name,
      cnpjCpf: client.cnpj,
      clientType: client.type,
      address: { city: client.city, state: client.state },
      loadingOrder: '',
      items: []
    };
    setFormData(prev => ({ ...prev, deliveries: [...(prev.deliveries || []), newDelivery] }));
    setClientSearch('');
    setShowClientResults(false);
  };

  const handleRemoveDelivery = (id: string) => {
    setFormData(prev => ({ ...prev, deliveries: prev.deliveries?.filter(d => d.id !== id) }));
  };

  const handleMoveDelivery = (index: number, direction: 'up' | 'down') => {
    setFormData(prev => {
      const deliveries = [...(prev.deliveries || [])];
      if (direction === 'up' && index > 0) {
        // Swap with previous
        [deliveries[index - 1], deliveries[index]] = [deliveries[index], deliveries[index - 1]];
      } else if (direction === 'down' && index < deliveries.length - 1) {
        // Swap with next
        [deliveries[index], deliveries[index + 1]] = [deliveries[index + 1], deliveries[index]];
      }
      return { ...prev, deliveries };
    });
  };

  // --- DRAG AND DROP HANDLERS ---
  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedItemIndex(index);
    // Efeito visual
    e.dataTransfer.effectAllowed = "move";
    // Pode definir uma imagem fantasma personalizada se desejar
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    e.preventDefault(); // Necessário para permitir o drop
    if (draggedItemIndex === null || draggedItemIndex === index) return;

    // Reordenação em tempo real (Visual)
    const newDeliveries = [...(formData.deliveries || [])];
    const draggedItem = newDeliveries[draggedItemIndex];
    
    // Remove do índice antigo
    newDeliveries.splice(draggedItemIndex, 1);
    // Insere no novo índice
    newDeliveries.splice(index, 0, draggedItem);
    
    setFormData(prev => ({ ...prev, deliveries: newDeliveries }));
    setDraggedItemIndex(index); // Atualiza o índice do item arrastado para o novo local
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const handleDeliveryChange = (id: string, field: keyof DeliveryPoint, value: any) => {
    setFormData(prev => ({ ...prev, deliveries: prev.deliveries?.map(d => d.id === id ? { ...d, [field]: value } : d) }));
  };

  const handleAddItem = (deliveryId: string) => {
    setFormData(prev => ({
      ...prev,
      deliveries: prev.deliveries?.map(d => d.id === deliveryId ? { 
        ...d, items: [...d.items, { id: Math.random().toString(36).substr(2, 9), code: '', description: '', quantity: 1, unit: 'UN' }] 
      } : d)
    }));
  };

  const handleItemChange = (deliveryId: string, itemId: string, field: keyof LoadItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      deliveries: prev.deliveries?.map(d => d.id === deliveryId ? {
        ...d, items: d.items.map(i => i.id === itemId ? { ...i, [field]: value } : i)
      } : d)
    }));
    if (field === 'code' || field === 'description') setActiveItemSearch({ deliveryId, itemId, field });
  };

  const handleSelectMaterial = (deliveryId: string, itemId: string, mat: Material) => {
    setFormData(prev => ({
      ...prev,
      deliveries: prev.deliveries?.map(d => d.id === deliveryId ? {
        ...d, items: d.items.map(i => i.id === itemId ? { ...i, code: mat.code, description: mat.description, unit: mat.unit } : i)
      } : d)
    }));
    setActiveItemSearch(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.deliveries?.length) return alert('Adicione pelo menos uma entrega.');
    if (formData.deliveries.some(d => !d.items.length)) return alert('Todas as entregas devem ter itens.');
    
    setIsSubmitting(true);
    try {
      await loadService.saveLoad(formData);
      if (formData.status === LoadStatus.COMPLETED || formData.status === LoadStatus.CANCELLED) {
         navigate('/loads/history');
      } else {
         navigate('/loads');
      }
    } catch {
      alert("Erro ao salvar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // KPIs Calculados
  const totalCost = (formData.financial?.freightValue || 0) + (formData.financial?.extraCosts || 0);
  const revenue = formData.financial?.customerFreightValue || 0;
  const profit = revenue - totalCost;
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;

  // Verificação de Status Arquivado/Fechado
  const isArchived = formData.status === LoadStatus.COMPLETED || formData.status === LoadStatus.CANCELLED;

  return (
    <div className="space-y-8 animate-enter pb-32 max-w-[1600px] mx-auto px-4 lg:px-8">
      
      {/* ARCHIVED BANNER */}
      {isArchived && (
        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-500/20 p-4 rounded-[1.5rem] flex items-center justify-center gap-3 animate-slide-up">
           <Lock size={18} className="text-amber-600 dark:text-amber-500" />
           <p className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest">
             Modo de Auditoria • Registro Histórico ({formData.status})
           </p>
        </div>
      )}

      {/* HEADER & STEPPER */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-3.5 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl text-slate-400 hover:text-brand-navy dark:hover:text-white btn-press transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <div className="flex items-center gap-2 mb-1">
               <span className="text-[8px] font-black bg-brand-navy dark:bg-brand-accent text-white px-2 py-0.5 rounded uppercase tracking-widest">Protocolo</span>
               <span className="text-[10px] font-black text-brand-navy dark:text-white font-data">{formData.portCode || 'NOVO'}</span>
            </div>
            <h2 className="text-2xl font-black text-brand-navy dark:text-white uppercase tracking-tighter">
              {isEdit ? `Gerenciar Carga` : 'Criar Carga'}
            </h2>
          </div>
        </div>
        
        {/* LIQUID STEPPER */}
        <div className="bg-slate-100 dark:bg-white/5 p-1.5 rounded-[1.5rem] flex relative overflow-hidden w-full lg:w-auto">
           {/* Animated Background Indicator */}
           <div className={`absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-white dark:bg-brand-navy rounded-[1.2rem] shadow-sm transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] ${currentStep === 1 ? 'left-1.5' : 'left-[50%]'}`}></div>
           
           {[
             { id: 1, label: '1. Origem & Conteúdo', icon: Package },
             { id: 2, label: '2. Custos & Operação', icon: DollarSign }
           ].map(step => (
             <button
               key={step.id}
               onClick={() => setCurrentStep(step.id)}
               className={`relative z-10 flex-1 flex items-center justify-center gap-2 px-8 py-3 rounded-[1.2rem] transition-colors duration-300 lg:min-w-[200px] ${
                 currentStep === step.id 
                   ? 'text-brand-navy dark:text-white' 
                   : 'text-slate-400 hover:text-brand-navy dark:hover:text-white'
               }`}
             >
               <step.icon size={16} className={`transition-transform duration-300 ${currentStep === step.id ? 'scale-110' : ''}`} />
               <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap">{step.label}</span>
             </button>
           ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <div className="xl:col-span-8 space-y-8">
          
          {/* STEP 1: CARGA & ITINERÁRIO */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in slide-in-from-left-4 fade-in duration-500">
               
               {/* ADD CLIENT SECTION */}
               <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-premium space-y-8 relative overflow-visible">
                  <div className="flex justify-between items-center">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-brand-accent/10 text-brand-accent rounded-2xl flex items-center justify-center border border-brand-accent/20"><Briefcase size={22} /></div>
                        <div>
                           <h3 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest">Destinatário & Materiais</h3>
                           <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Configure os pontos de entrega</p>
                        </div>
                     </div>
                     <div ref={clientRef} className="relative z-50">
                        <button type="button" onClick={() => setShowClientResults(!showClientResults)} className="bg-brand-navy dark:bg-white dark:text-brand-navy text-white px-6 py-3 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-brand-accent dark:hover:bg-brand-accent dark:hover:text-white transition-all shadow-lg btn-press">
                           <Plus size={16} /> Adicionar Entrega
                        </button>
                        {showClientResults && (
                           <div className="absolute right-0 mt-3 w-96 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-100 dark:border-white/10 shadow-2xl max-h-80 overflow-y-auto p-3 z-50 animate-in zoom-in-95 duration-200">
                              <input type="text" className="w-full p-4 mb-2 bg-slate-50 dark:bg-white/5 rounded-xl text-xs font-bold uppercase outline-none focus:ring-2 ring-brand-accent/20 transition-all text-brand-navy dark:text-white" placeholder="BUSCAR CLIENTE..." value={clientSearch} onChange={e => setClientSearch(e.target.value)} autoFocus />
                              <div className="space-y-1">
                                {filteredClients.map(c => (
                                   <button key={c.id} type="button" onClick={() => handleAddDelivery(c)} className="w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl text-[10px] font-black uppercase text-brand-navy dark:text-white border-b border-slate-50 dark:border-white/5 last:border-0 transition-colors group">
                                      <span className="block group-hover:text-brand-accent transition-colors">{c.name}</span> 
                                      <span className="block text-[8px] text-slate-400 mt-1 flex items-center gap-1"><MapPin size={10} /> {c.city} - {c.state}</span>
                                   </button>
                                ))}
                              </div>
                           </div>
                        )}
                     </div>
                  </div>

                  {formData.deliveries?.length === 0 && (
                    <div className="py-16 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-50/50 dark:bg-white/5">
                       <MapPin size={48} className="mb-4 opacity-50" />
                       <p className="text-[10px] font-black uppercase tracking-widest">Nenhum destino adicionado</p>
                       <p className="text-[9px] mt-1 font-bold">Utilize o botão acima para selecionar um cliente</p>
                    </div>
                  )}

                  <div className="space-y-6">
                    {formData.deliveries?.map((delivery, idx) => (
                       <div 
                          key={delivery.id} 
                          draggable 
                          onDragStart={(e) => handleDragStart(e, idx)}
                          onDragOver={(e) => handleDragOver(e, idx)}
                          onDragEnd={handleDragEnd}
                          className={`
                            bg-slate-50/50 dark:bg-[#0f172a] border border-slate-100 dark:border-white/5 
                            rounded-[2.5rem] p-6 relative group transition-all hover:shadow-lg hover:border-brand-accent/30 
                            animate-slide-up cursor-grab active:cursor-grabbing
                            ${draggedItemIndex === idx ? 'opacity-50 scale-[0.98]' : 'opacity-100'}
                          `}
                          style={{ animationDelay: `${idx * 100}ms` }}
                       >
                          {/* ORDER INDICATOR CORNER BADGE */}
                          <div className="absolute top-0 right-0 bg-brand-navy dark:bg-white text-white dark:text-brand-navy px-4 py-2 rounded-bl-2xl rounded-tr-[2.3rem] text-[9px] font-black uppercase tracking-widest shadow-md z-10">
                             {idx + 1}ª ENTREGA
                          </div>

                          <div className="flex justify-between items-start mb-6">
                             <div className="flex items-center gap-4">
                                {/* DRAG HANDLE / CONTROLS */}
                                <div className="flex items-center gap-2 mr-2">
                                   <div className="text-slate-300 group-hover:text-brand-accent transition-colors cursor-move" title="Arrastar para reordenar">
                                      <GripVertical size={20} />
                                   </div>
                                   <div className="flex flex-col items-center gap-1">
                                      {idx > 0 && (
                                         <button 
                                           type="button" 
                                           onClick={() => handleMoveDelivery(idx, 'up')}
                                           className="p-1 text-slate-400 hover:text-brand-accent hover:bg-white dark:hover:bg-white/10 rounded-md transition-all"
                                           title="Mover para cima"
                                         >
                                            <ChevronUp size={12} />
                                         </button>
                                      )}
                                      <span className="w-6 h-6 rounded-lg bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-white flex items-center justify-center text-[10px] font-black shadow-inner">
                                         {idx + 1}
                                      </span>
                                      {idx < (formData.deliveries?.length || 0) - 1 && (
                                         <button 
                                           type="button" 
                                           onClick={() => handleMoveDelivery(idx, 'down')}
                                           className="p-1 text-slate-400 hover:text-brand-accent hover:bg-white dark:hover:bg-white/10 rounded-md transition-all"
                                           title="Mover para baixo"
                                         >
                                            <ChevronDown size={12} />
                                         </button>
                                      )}
                                   </div>
                                </div>

                                <div>
                                   <h4 className="text-xs font-black text-brand-navy dark:text-white uppercase tracking-tight">{delivery.clientName}</h4>
                                   <p className="text-[9px] font-bold text-slate-400 uppercase flex items-center gap-1.5 mt-0.5">
                                     <MapPin size={10} className="text-brand-accent" /> {delivery.address.city}/{delivery.address.state}
                                   </p>
                                </div>
                             </div>
                             <button type="button" onClick={() => handleRemoveDelivery(delivery.id)} className="p-2 bg-white dark:bg-white/5 rounded-xl text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all border border-transparent hover:border-red-100 mr-28"><Trash2 size={16} /></button>
                          </div>
                          
                          <div className="pl-0 lg:pl-12 space-y-6">
                             <div className="grid grid-cols-12 gap-4 items-end">
                                <div className="col-span-12 md:col-span-4">
                                  <TacticalInput 
                                    label="Ordem Carregamento (OC)" 
                                    icon={FileCheck}
                                    value={delivery.loadingOrder} 
                                    onChange={(e: any) => handleDeliveryChange(delivery.id, 'loadingOrder', e.target.value.toUpperCase())} 
                                    placeholder="OC-123"
                                  />
                                </div>
                                <div className="col-span-12 md:col-span-8">
                                  <button type="button" onClick={() => handleAddItem(delivery.id)} className="flex items-center justify-center gap-2 text-[9px] font-black text-brand-accent bg-brand-accent/5 border border-brand-accent/20 px-4 py-3.5 rounded-2xl w-full hover:bg-brand-accent hover:text-white uppercase transition-all shadow-sm group/btn">
                                    <Plus size={14} className="group-hover:btn:rotate-90 transition-transform" /> Adicionar Item ao Manifesto
                                  </button>
                                </div>
                             </div>
                             
                             {/* ITEMS TABLE */}
                             {delivery.items.length > 0 && (
                                <div className="bg-white dark:bg-[#020617] rounded-3xl p-1 border border-slate-100 dark:border-white/5 shadow-sm overflow-hidden">
                                   <div className="grid grid-cols-12 gap-2 px-4 py-3 text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
                                      <div className="col-span-3">Código SKU</div>
                                      <div className="col-span-5">Descrição</div>
                                      <div className="col-span-2 text-center">Qtd</div>
                                      <div className="col-span-2 text-center">Und</div>
                                   </div>
                                   <div className="divide-y divide-slate-50 dark:divide-white/5">
                                     {delivery.items.map(item => (
                                        <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 relative group/row hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors">
                                           <div className="col-span-3"><input type="text" className="w-full bg-transparent text-[10px] font-bold text-brand-navy dark:text-white uppercase outline-none placeholder:text-slate-300" placeholder="CÓDIGO" value={item.code} onChange={e => handleItemChange(delivery.id, item.id, 'code', e.target.value)} /></div>
                                           <div className="col-span-5"><input type="text" className="w-full bg-transparent text-[10px] font-bold text-brand-navy dark:text-white uppercase outline-none placeholder:text-slate-300" placeholder="DESCRIÇÃO TÉCNICA" value={item.description} onChange={e => handleItemChange(delivery.id, item.id, 'description', e.target.value)} /></div>
                                           <div className="col-span-2"><input type="number" className="w-full bg-transparent text-[10px] font-bold text-brand-navy dark:text-white text-center outline-none" placeholder="0" value={item.quantity} onChange={e => handleItemChange(delivery.id, item.id, 'quantity', parseFloat(e.target.value))} /></div>
                                           <div className="col-span-2 flex items-center gap-1 justify-center">
                                              <span className="text-[9px] font-black text-slate-400 bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded">{item.unit}</span>
                                              <button type="button" onClick={() => setFormData(p => ({...p, deliveries: p.deliveries?.map(d => d.id === delivery.id ? {...d, items: d.items.filter(i => i.id !== item.id)} : d)}))} className="text-slate-300 hover:text-red-500 opacity-0 group-hover/row:opacity-100 transition-opacity ml-2"><X size={14} /></button>
                                           </div>
                                           {activeItemSearch?.itemId === item.id && activeItemSearch.field === 'code' && getFilteredMaterials(item.code).length > 0 && (
                                              <div className="absolute top-full left-0 w-72 bg-white dark:bg-[#0f172a] z-50 rounded-2xl shadow-2xl p-2 border border-slate-100 dark:border-white/10 animate-in slide-in-from-top-2">{getFilteredMaterials(item.code).map(m => <div key={m.id} onClick={() => handleSelectMaterial(delivery.id, item.id, m)} className="p-3 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl text-[9px] font-bold cursor-pointer uppercase text-brand-navy dark:text-white flex justify-between group/opt"><span className="group-hover/opt:text-brand-accent transition-colors">{m.code}</span><span className="text-slate-400 truncate max-w-[100px]">{m.description}</span></div>)}</div>
                                           )}
                                        </div>
                                     ))}
                                   </div>
                                </div>
                             )}
                          </div>
                       </div>
                    ))}
                  </div>
               </div>
               
               {/* TOTALIZADORES CARGA */}
               <div className="bg-brand-navy dark:bg-[#0f172a] p-8 rounded-[3rem] text-white flex flex-col md:flex-row justify-between items-center shadow-premium relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl group-hover:scale-150 transition-transform duration-[2000ms]"></div>
                  
                  <div className="flex items-center gap-4 relative z-10 mb-6 md:mb-0">
                     <div className="p-3 bg-white/10 rounded-2xl backdrop-blur-sm"><Scale size={24} className="text-brand-accent" /></div>
                     <div>
                       <span className="text-xs font-black uppercase tracking-[0.3em]">Totais Físicos</span>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Peso Bruto & Cubagem</p>
                     </div>
                  </div>
                  
                  <div className="flex gap-8 relative z-10 w-full md:w-auto">
                     <div className="flex-1 md:flex-none bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                        <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Peso (KG)</label>
                        <input type="number" className="bg-transparent text-center font-black text-xl w-full focus:outline-none focus:text-brand-accent transition-colors placeholder:text-white/20" value={formData.totalWeight} onChange={e => setFormData(p => ({...p, totalWeight: parseFloat(e.target.value)}))} placeholder="0.00" />
                     </div>
                     <div className="flex-1 md:flex-none bg-white/5 p-4 rounded-2xl border border-white/5 text-center">
                        <label className="text-[8px] font-black text-slate-400 uppercase block mb-1">Volume (M³)</label>
                        <input type="number" className="bg-transparent text-center font-black text-xl w-full focus:outline-none focus:text-brand-accent transition-colors placeholder:text-white/20" value={formData.totalVolume} onChange={e => setFormData(p => ({...p, totalVolume: parseFloat(e.target.value)}))} placeholder="0.000" />
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* STEP 2: CUSTOS & OPERAÇÃO */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-500">
              
              {/* OPERAÇÃO LOGÍSTICA */}
              <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-premium space-y-8">
                 <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-brand-navy dark:bg-white/10 text-white rounded-2xl flex items-center justify-center shadow-lg"><Building2 size={22} /></div>
                    <div>
                       <h3 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest">Parceiro Logístico</h3>
                       <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Definição do transportador e datas</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div ref={carrierRef} className="relative">
                      <TacticalInput
                        label="Transportadora Homologada"
                        icon={Search}
                        value={carrierSearch}
                        onChange={(e: any) => { setCarrierSearch(e.target.value); setShowCarrierResults(true); }}
                        onFocus={() => setShowCarrierResults(true)}
                        placeholder="BUSCAR PARCEIRO..."
                      />
                      {showCarrierResults && filteredCarriers.length > 0 && (
                        <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-100 dark:border-white/10 shadow-2xl max-h-48 overflow-y-auto p-2 animate-in zoom-in-95">
                          {filteredCarriers.map(c => (
                            <button key={c.id} type="button" onClick={() => { setFormData(prev => ({...prev, carrier: c.name, carrierId: c.id})); setCarrierSearch(c.name); setShowCarrierResults(false); }} className="w-full text-left p-3 hover:bg-slate-50 dark:hover:bg-white/10 rounded-xl text-[10px] font-black text-brand-navy dark:text-white uppercase flex justify-between group">
                              <span className="group-hover:text-brand-accent transition-colors">{c.name}</span>
                              <span className="text-slate-400">{c.city}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <div>
                       <div className="bg-slate-50 dark:bg-white/5 p-1.5 rounded-2xl flex border border-slate-100 dark:border-white/5 h-[52px]">
                          {[ShippingType.CIF, ShippingType.FOB].map(t => (
                             <button key={t} type="button" onClick={() => setFormData(p => ({...p, shippingType: t}))} className={`flex-1 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${formData.shippingType === t ? 'bg-white dark:bg-brand-navy shadow-md text-brand-navy dark:text-white scale-105' : 'text-slate-400 hover:text-brand-navy dark:hover:text-white'}`}>{t}</button>
                          ))}
                       </div>
                    </div>
                 </div>
                 
                 {/* DATAS & SLA */}
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <GeslaDatePicker 
                      label="Data de Emissão"
                      value={formData.date ? formData.date.split('T')[0] : ''}
                      onChange={(newDate) => setFormData(p => ({...p, date: new Date(newDate).toISOString()}))}
                    />
                    <GeslaDatePicker 
                      label="Previsão de Entrega (SLA)"
                      value={formData.expectedDeliveryDate || ''}
                      onChange={(newDate) => setFormData(p => ({...p, expectedDeliveryDate: newDate}))}
                    />
                 </div>
              </div>

              {/* ENGENHARIA FINANCEIRA REESTRUTURADA (HUD STYLE) */}
              <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-premium space-y-10">
                  <div className="flex items-center gap-4">
                     <div className="w-12 h-12 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20"><DollarSign size={22} /></div>
                     <div>
                        <h3 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest">DRE da Operação</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Simulação de margem em tempo real</p>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                     
                     {/* COLUNA 1: ENTRADAS E SAÍDAS */}
                     <div className="space-y-6">
                        <div className="bg-emerald-50/50 dark:bg-emerald-900/10 p-6 rounded-[2rem] border border-emerald-100 dark:border-emerald-500/20 group hover:border-emerald-200 transition-colors">
                           <div className="flex items-center justify-between mb-4">
                              <label className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Receita (Valor Cobrado)</label>
                              <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 rounded-lg text-emerald-600"><Wallet size={14} /></div>
                           </div>
                           <div className="relative">
                              <span className="absolute left-0 top-1/2 -translate-y-1/2 text-emerald-600 text-lg font-bold">R$</span>
                              <input 
                                type="number" 
                                className="w-full bg-transparent text-3xl font-black text-emerald-600 pl-8 focus:outline-none placeholder:text-emerald-600/30" 
                                placeholder="0.00" 
                                value={formData.financial?.customerFreightValue} 
                                onChange={e => updateFinancial('customerFreightValue', e.target.value)} 
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <div className="bg-rose-50/50 dark:bg-rose-900/10 p-5 rounded-[2rem] border border-rose-100 dark:border-rose-500/20 group hover:border-rose-200 transition-colors">
                              <label className="text-[8px] font-black text-rose-500 uppercase tracking-widest block mb-2">Pago Motorista</label>
                              <div className="relative">
                                 <span className="absolute left-0 top-1/2 -translate-y-1/2 text-rose-500 text-xs font-bold">R$</span>
                                 <input type="number" className="w-full bg-transparent pl-6 text-xl font-black text-rose-500 focus:outline-none" placeholder="0.00" value={formData.financial?.freightValue} onChange={e => updateFinancial('freightValue', e.target.value)} />
                              </div>
                           </div>
                           <div className="bg-amber-50/50 dark:bg-amber-900/10 p-5 rounded-[2rem] border border-amber-100 dark:border-amber-500/20 group hover:border-amber-200 transition-colors">
                              <label className="text-[8px] font-black text-amber-500 uppercase tracking-widest block mb-2">Custos Extras</label>
                              <div className="relative">
                                 <span className="absolute left-0 top-1/2 -translate-y-1/2 text-amber-500 text-xs font-bold">R$</span>
                                 <input type="number" className="w-full bg-transparent pl-6 text-xl font-black text-amber-500 focus:outline-none" placeholder="0.00" value={formData.financial?.extraCosts} onChange={e => updateFinancial('extraCosts', e.target.value)} />
                              </div>
                           </div>
                        </div>
                     </div>

                     {/* COLUNA 2: RESULTADOS (HUD) */}
                     <div className="bg-brand-navy dark:bg-black/60 p-8 rounded-[2.5rem] text-white flex flex-col justify-between relative overflow-hidden border border-white/5 shadow-2xl">
                        {/* Background ambient lighting based on profit */}
                        <div className={`absolute top-0 right-0 w-64 h-64 rounded-full -mr-32 -mt-32 blur-[80px] transition-colors duration-1000 ${profit >= 0 ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`}></div>
                        <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full -ml-32 -mb-32 blur-[80px] transition-colors duration-1000 ${profit >= 0 ? 'bg-emerald-500/10' : 'bg-rose-500/10'}`}></div>
                        
                        <div className="relative z-10">
                           <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-6">Resultado Operacional</span>
                           
                           <div className="flex items-end justify-between mb-4">
                              <span className={`text-4xl font-data font-black tracking-tighter transition-colors duration-500 ${profit >= 0 ? 'text-white' : 'text-rose-400'}`}>
                                 {formatCurrency(profit)}
                              </span>
                              <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all duration-500 ${profit >= 0 ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border-rose-500/30'}`}>
                                 {profit >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                                 {profit >= 0 ? 'Lucro' : 'Prejuízo'}
                              </div>
                           </div>
                           
                           <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden mb-8">
                              <div className={`h-full transition-all duration-1000 ease-out ${profit >= 0 ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500 shadow-[0_0_10px_#f43f5e]'}`} style={{ width: `${Math.min(Math.abs(margin), 100)}%` }}></div>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6 pt-6 border-t border-white/10 relative z-10">
                           <div>
                              <span className="text-[8px] font-black text-slate-400 uppercase block tracking-widest mb-1">Margem %</span>
                              <span className={`text-2xl font-black font-data ${margin > 20 ? 'text-emerald-400' : (margin > 0 ? 'text-amber-400' : 'text-rose-400')}`}>
                                 {formatDecimal(margin)}%
                              </span>
                           </div>
                           <div>
                              <span className="text-[8px] font-black text-slate-400 uppercase block tracking-widest mb-1">Custo Total</span>
                              <span className="text-2xl font-black font-data text-white">
                                 {formatCurrency(totalCost)}
                              </span>
                           </div>
                        </div>
                     </div>
                  </div>

                  <div className="pt-8 border-t border-slate-100 dark:border-white/5">
                     <div className="bg-slate-50 dark:bg-white/5 p-6 rounded-[2rem] border border-slate-100 dark:border-white/5 max-w-md">
                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Valor Mercadoria (NF)</label>
                        <div className="relative">
                           <span className="absolute left-0 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">R$</span>
                           <input type="number" className="w-full bg-transparent pl-6 text-brand-navy dark:text-white text-xl font-black focus:outline-none" placeholder="0.00" value={formData.financial?.invoiceValue} onChange={e => updateFinancial('invoiceValue', e.target.value)} />
                        </div>
                        <p className="text-[8px] font-bold text-slate-400 mt-2 uppercase flex items-center gap-1"><ShieldAlert size={10} /> Seguro Obrigatório</p>
                     </div>
                  </div>

                  {/* UPLOADS & COMPLIANCE */}
                  <div className="pt-8 border-t border-slate-100 dark:border-white/5 space-y-6">
                     <div className="flex items-center justify-between">
                        <h4 className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><FileCheck size={14} /> Compliance & Auditoria</h4>
                        
                        {/* TOGGLE DIFAL MANUAL */}
                        <div 
                           onClick={() => setFormData(p => ({...p, hasDifal: !p.hasDifal}))}
                           className={`flex items-center gap-3 px-5 py-2.5 rounded-xl cursor-pointer border transition-all duration-300 ${
                              formData.hasDifal 
                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-500/20 text-amber-600 dark:text-amber-400' 
                                : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'
                           }`}
                        >
                           {formData.hasDifal ? <ToggleRight size={28} className="text-amber-500" /> : <ToggleLeft size={28} />}
                           <span className="text-[9px] font-black uppercase tracking-widest">Incidência de DIFAL</span>
                        </div>
                     </div>

                     {(formData.hasDifal || formData.clientType === ClientType.NON_CONTRIBUTOR) && (
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-200 dark:border-amber-500/20 flex items-center gap-3 animate-slide-up">
                           <ShieldAlert size={18} className="text-amber-500" />
                           <p className="text-[10px] font-bold text-amber-600 dark:text-amber-400 uppercase">
                              Alerta de Compliance: Esta operação exige recolhimento antecipado de DIFAL.
                           </p>
                        </div>
                     )}

                     <div className="flex flex-col md:flex-row gap-6">
                        {/* GNRE UPLOAD */}
                        <button type="button" onClick={() => difalInputRef.current?.click()} className={`flex-1 p-6 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all group hover:-translate-y-1 ${formData.difalGuide ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 dark:border-white/10 text-slate-400 hover:border-brand-accent hover:text-brand-accent'}`}>
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${formData.difalGuide ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 dark:bg-white/5 group-hover:bg-brand-accent/10'}`}>
                              {formData.difalGuide ? <CheckCircle2 size={24} /> : <Upload size={24} />}
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-widest">{formData.difalGuide || 'Upload GNRE / DIFAL'}</span>
                           <input type="file" ref={difalInputRef} className="hidden" accept=".pdf" onChange={(e) => e.target.files?.[0] && setFormData(p => ({...p, difalGuide: e.target.files![0].name}))} />
                        </button>
                        
                        {/* COMPROVANTE PAGAMENTO */}
                        <button type="button" onClick={() => paymentInputRef.current?.click()} className={`flex-1 p-6 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all group hover:-translate-y-1 ${formData.paymentProof ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 dark:border-white/10 text-slate-400 hover:border-brand-accent hover:text-brand-accent'}`}>
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${formData.paymentProof ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 dark:bg-white/5 group-hover:bg-brand-accent/10'}`}>
                              {formData.paymentProof ? <CheckCircle2 size={24} /> : <Upload size={24} />}
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-widest">{formData.paymentProof || 'Upload Comprovante'}</span>
                           <input type="file" ref={paymentInputRef} className="hidden" accept=".pdf" onChange={(e) => e.target.files?.[0] && setFormData(p => ({...p, paymentProof: e.target.files![0].name}))} />
                        </button>

                        {/* CANHOTO POD (NOVO) */}
                        <button type="button" onClick={() => deliveryProofInputRef.current?.click()} className={`flex-1 p-6 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-3 transition-all group hover:-translate-y-1 ${formData.deliveryProof ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 dark:border-white/10 text-slate-400 hover:border-brand-accent hover:text-brand-accent'}`}>
                           <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${formData.deliveryProof ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 dark:bg-white/5 group-hover:bg-brand-accent/10'}`}>
                              {formData.deliveryProof ? <FileSignature size={24} /> : <Upload size={24} />}
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-widest">{formData.deliveryProof || 'Upload Canhoto (POD)'}</span>
                           <input type="file" ref={deliveryProofInputRef} className="hidden" accept=".pdf,.jpg,.png" onChange={(e) => e.target.files?.[0] && setFormData(p => ({...p, deliveryProof: e.target.files![0].name}))} />
                        </button>
                     </div>
                  </div>
               </div>
            </div>
          )}
        </div>

        {/* SIDEBAR SUMMARY - ALWAYS VISIBLE */}
        <div className="xl:col-span-4 h-fit sticky top-24 space-y-6 animate-fade-in delay-200">
           <div className={`p-8 rounded-[3rem] text-white shadow-premium relative overflow-hidden group transition-all duration-500 ${isArchived ? 'bg-slate-900 border border-slate-700' : 'bg-brand-navy dark:bg-[#0f172a] border border-white/5'}`}>
              <div className="absolute top-0 right-0 w-40 h-40 bg-brand-accent/20 rounded-full -mr-20 -mt-20 blur-3xl group-hover:scale-150 transition-transform duration-[2000ms]"></div>
              
              <div className="relative z-10">
                 <div className="flex justify-between items-start mb-8">
                    <div>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] block mb-1">Status Atual</span>
                       <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isArchived ? 'bg-slate-500' : 'bg-emerald-500 animate-pulse'}`}></span>
                          <span className={`text-xl font-black uppercase tracking-tighter ${isArchived ? 'text-slate-400' : 'text-brand-accent'}`}>{formData.status}</span>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="bg-white/5 p-5 rounded-[1.5rem] border border-white/5 backdrop-blur-sm">
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Destino Principal</span>
                       <p className="text-[11px] font-bold uppercase truncate flex items-center gap-2"><MapPin size={12} className="text-brand-accent" /> {formData.destinationCity || '---'} / {formData.destinationUF}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <div className="bg-white/5 p-5 rounded-[1.5rem] border border-white/5 backdrop-blur-sm">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Entregas</span>
                          <p className="text-xl font-data font-bold">{formData.deliveries?.length || 0}</p>
                       </div>
                       <div className="bg-white/5 p-5 rounded-[1.5rem] border border-white/5 backdrop-blur-sm">
                          <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block mb-1">Peso Total</span>
                          <p className="text-[11px] font-data font-bold mt-1.5">{formatDecimal(formData.totalWeight)} kg</p>
                       </div>
                    </div>
                 </div>

                 <button 
                   onClick={handleSubmit}
                   disabled={isSubmitting}
                   className={`w-full mt-10 py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-xl shadow-black/20 flex items-center justify-center gap-3 btn-press relative overflow-hidden group/btn ${
                     isArchived 
                       ? 'bg-amber-500 text-white hover:bg-amber-600' 
                       : 'bg-white text-brand-navy hover:bg-brand-accent hover:text-white'
                   }`}
                 >
                    <span className="relative z-10 flex items-center gap-3">
                       {isSubmitting ? 'Processando...' : (isArchived ? 'Retificar Registro' : (isEdit ? 'Atualizar Manifesto' : 'Gerar Manifesto'))}
                       {isArchived ? <History size={16} /> : <Save size={16} className="group-hover/btn:scale-110 transition-transform" />}
                    </span>
                    {/* Button Shine Effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[150%] group-hover/btn:animate-shine"></div>
                 </button>
              </div>
           </div>
        </div>
      </form>
    </div>
  );
};

export default LoadForm;