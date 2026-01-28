import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Plus, Search, Trash2, Edit3, X, Box, Layers, 
  Tag, Hash, Database, ArrowUpRight, Save, Boxes, Activity, 
  ShieldAlert, CheckCircle2, LayoutGrid, List as ListIcon,
  MoreVertical, Ruler, Weight, Scissors, Container, ScanBarcode,
  Info
} from 'lucide-react';
import { materialService } from '../services/materialService';
import { Material, UserRole } from '../types';
import { userService } from '../services/userService';

// --- COMPONENTES TÁTICOS (Reuso Interno) ---

const TacticalInput = ({ label, icon: Icon, value, onChange, placeholder, className, list, ...props }: any) => {
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
            list={list}
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

const UnitSelector = ({ value, onChange }: any) => {
  const units = [
    { id: 'UN', label: 'Unidade', icon: Box, desc: 'Contagem' },
    { id: 'CX', label: 'Caixa', icon: Container, desc: 'Volume Fechado' },
    { id: 'M', label: 'Metro', icon: Ruler, desc: 'Linear' },
    { id: 'M2', label: 'Metro²', icon: LayoutGrid, desc: 'Área' },
    { id: 'KG', label: 'Kilo', icon: Weight, desc: 'Pesagem' },
    { id: 'RL', label: 'Rolo', icon: Activity, desc: 'Bobina' },
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {units.map((u) => (
        <button
          key={u.id}
          type="button"
          onClick={() => onChange(u.id)}
          className={`
            relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 group
            ${value === u.id
              ? 'bg-brand-navy dark:bg-white text-white dark:text-brand-navy border-brand-navy dark:border-white shadow-lg transform scale-105'
              : 'bg-slate-50 dark:bg-[#0f172a] border-slate-200 dark:border-white/10 text-slate-400 hover:border-brand-accent/30 hover:bg-white dark:hover:bg-white/5'
            }
          `}
        >
          <u.icon size={18} className={`mb-1 ${value === u.id ? 'text-brand-accent' : 'text-slate-400'}`} />
          <span className="text-[10px] font-black font-data">{u.id}</span>
          {value === u.id && <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse"></div>}
        </button>
      ))}
    </div>
  );
};

const MaterialManagement: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<Material | null>(null);

  const currentUser = userService.getCurrentUser();
  const isAdmin = currentUser.role === UserRole.ADMIN;

  const [formData, setFormData] = useState<Partial<Material>>({
    code: '', description: '', unit: 'UN', category: '', status: 'Ativo'
  });

  const refreshMaterials = () => setMaterials(materialService.getMaterials());
  useEffect(() => { refreshMaterials(); }, []);

  const categories = useMemo(() => {
    const cats = new Set(materials.map(m => m.category));
    return Array.from(cats);
  }, [materials]);

  const stats = useMemo(() => ({
    total: materials.length,
    active: materials.filter(m => m.status === 'Ativo').length,
    categories: categories.length
  }), [materials, categories]);

  const filteredMaterials = useMemo(() => {
    return materials.filter(m => {
      const matchesSearch = 
        m.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = filterCategory === 'all' || m.category === filterCategory;
      return matchesSearch && matchesCategory;
    });
  }, [materials, searchTerm, filterCategory]);

  const handleOpenModal = (material: Material | null = null) => {
    if (material) {
      setEditingMaterial(material);
      setFormData(material);
    } else {
      setEditingMaterial(null);
      setFormData({ code: '', description: '', unit: 'UN', category: '', status: 'Ativo' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    materialService.saveMaterial(formData);
    refreshMaterials();
    setIsModalOpen(false);
  };

  const handleRequestDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); e.preventDefault();
    const target = materials.find(m => m.id === id);
    if (target) { setMaterialToDelete(target); setIsDeleteModalOpen(true); }
  };

  const confirmDelete = () => {
    if (materialToDelete) {
      materialService.deleteMaterial(materialToDelete.id);
      refreshMaterials();
      setIsDeleteModalOpen(false);
      setMaterialToDelete(null);
    }
  };

  const getCategoryColor = (cat: string) => {
    const hash = cat.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const colors = ['text-blue-500 bg-blue-500/10', 'text-purple-500 bg-purple-500/10', 'text-emerald-500 bg-emerald-500/10', 'text-amber-500 bg-amber-500/10', 'text-rose-500 bg-rose-500/10'];
    return colors[hash % colors.length];
  };

  // Lógica de "Logistics Intelligence"
  const getLogisticsImpact = (unit: string) => {
    if (['M', 'M2', 'RL'].includes(unit)) return { label: 'Requer Medição/Corte', icon: Scissors, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    if (['KG', 'TON'].includes(unit)) return { label: 'Controle por Pesagem', icon: Weight, color: 'text-blue-500', bg: 'bg-blue-500/10' };
    return { label: 'Controle Unitário', icon: Box, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
  };

  const impact = getLogisticsImpact(formData.unit || 'UN');

  return (
    <div className="space-y-8 animate-enter pb-24 min-h-screen">
      
      {/* HEADER TÁTICO */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 p-4 lg:p-0">
        <div className="space-y-2 group cursor-default">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-brand-navy/5 dark:bg-white/10 rounded-xl text-brand-navy dark:text-slate-400 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <Box size={18} />
             </div>
             <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Inventory Core</span>
          </div>
          <h2 className="text-5xl font-black text-brand-navy dark:text-white tracking-tighter uppercase leading-none">
            Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-purple-600 animate-pulse-slow">SKU</span>
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
          {isAdmin && (
            <button 
              type="button"
              onClick={() => handleOpenModal()}
              className="bg-brand-accent text-white px-10 py-5 rounded-[2rem] font-black shadow-glow-accent hover:bg-opacity-90 hover:translate-y-[-4px] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest text-[10px] group btn-press"
            >
              <Plus size={20} className="group-hover:rotate-90 transition-transform" /> Novo Ativo
            </button>
          )}
        </div>
      </div>

      {/* KPI HUD */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up p-4 lg:p-0">
        {[
          { label: 'Itens Catalogados', val: stats.total, icon: <Boxes />, color: 'bg-brand-navy dark:bg-white/10 text-white' },
          { label: 'Categorias', val: stats.categories, icon: <Layers />, color: 'bg-brand-accent text-white' },
          { label: 'Disponibilidade', val: `${Math.round((stats.active/stats.total)*100 || 0)}%`, icon: <Activity />, color: 'bg-emerald-600 text-white' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white dark:bg-[#1e293b] p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5 flex items-center gap-6 shadow-premium dark:shadow-none group hover:border-brand-accent/30 hover:-translate-y-1 transition-all duration-300" style={{ animationDelay: `${i * 100}ms` }}>
            <div className={`w-14 h-14 rounded-[1.2rem] ${kpi.color} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500`}>
              {React.cloneElement(kpi.icon as React.ReactElement<any>, { size: 24 })}
            </div>
            <div>
              <p className="text-[9px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1 group-hover:text-brand-accent transition-colors">{kpi.label}</p>
              <h3 className="text-3xl font-black text-brand-navy dark:text-white font-data tracking-tighter">{kpi.val}</h3>
            </div>
          </div>
        ))}
      </div>

      {/* SEARCH & CONTROL BAR */}
      <div className="sticky top-24 z-30 p-4 lg:p-0">
        <div className="bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-xl p-3 pl-6 rounded-[2.5rem] shadow-premium dark:shadow-none flex flex-wrap items-center justify-between gap-4 border border-slate-200/50 dark:border-white/5 transition-all duration-500 hover:shadow-2xl dark:hover:shadow-glow-hover hover:border-brand-accent/30">
          <div className="flex-1 flex items-center gap-4 min-w-[280px]">
            <Search className="text-slate-300 dark:text-slate-500" size={24} />
            <input 
              type="text" 
              placeholder="BUSCAR SKU, DESCRIÇÃO OU CATEGORIA..." 
              className="w-full bg-transparent text-xs font-black uppercase tracking-widest placeholder:text-slate-300 dark:placeholder:text-slate-600 focus:outline-none text-brand-navy dark:text-white h-12"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3 overflow-x-auto scrollbar-none max-w-[500px]">
            <button 
              onClick={() => setFilterCategory('all')}
              className={`px-6 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap btn-press ${filterCategory === 'all' ? 'bg-brand-navy dark:bg-white text-white dark:text-brand-navy shadow-lg' : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button 
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-6 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap btn-press ${filterCategory === cat ? 'bg-brand-navy dark:bg-white text-white dark:text-brand-navy shadow-lg' : 'bg-slate-50 dark:bg-white/5 text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10'}`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-2xl">
             <button onClick={() => setViewMode('grid')} className={`p-3 rounded-xl transition-all ${viewMode === 'grid' ? 'bg-white dark:bg-brand-navy text-brand-accent shadow-sm' : 'text-slate-400'}`}><LayoutGrid size={18} /></button>
             <button onClick={() => setViewMode('list')} className={`p-3 rounded-xl transition-all ${viewMode === 'list' ? 'bg-white dark:bg-brand-navy text-brand-accent shadow-sm' : 'text-slate-400'}`}><ListIcon size={18} /></button>
          </div>
        </div>
      </div>

      {/* CONTENT GRID/LIST */}
      <div className="p-4 lg:p-0">
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
            {filteredMaterials.map((m, idx) => (
              <div 
                key={m.id}
                onClick={() => isAdmin && handleOpenModal(m)}
                className="group relative bg-white dark:bg-[#1e293b] rounded-[2.5rem] p-6 border border-slate-100 dark:border-white/5 hover:border-brand-accent/30 hover:shadow-2xl dark:hover:shadow-glow-hover transition-all duration-300 hover:-translate-y-2 cursor-pointer overflow-hidden animate-slide-up flex flex-col justify-between min-h-[220px]"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                {/* Status Pulse */}
                <div className="absolute top-6 right-6">
                   <div className={`w-2 h-2 rounded-full ${m.status === 'Ativo' ? 'bg-emerald-500' : 'bg-slate-400'} animate-pulse shadow-[0_0_10px_currentColor]`}></div>
                </div>

                <div className="space-y-4">
                   <div className={`w-fit px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${getCategoryColor(m.category)}`}>
                      {m.category}
                   </div>
                   
                   <div>
                      <h4 className="text-xl font-black text-brand-navy dark:text-white font-data tracking-tight group-hover:text-brand-accent transition-colors">{m.code}</h4>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase leading-relaxed mt-2 line-clamp-3">
                         {m.description}
                      </p>
                   </div>
                </div>

                <div className="flex items-end justify-between pt-6 mt-2 border-t border-slate-50 dark:border-white/5">
                   <div className="flex items-center gap-3">
                      <div className="flex flex-col">
                         <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase tracking-widest">Unidade</span>
                         <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 text-[10px] font-bold bg-slate-50 dark:bg-white/5 px-2 py-1 rounded-lg mt-1">
                            {['M2', 'M', 'MT'].includes(m.unit) ? <Ruler size={10} /> : <Weight size={10} />}
                            {m.unit}
                         </div>
                      </div>
                   </div>

                   <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                      {isAdmin && (
                         <button 
                           onClick={(e) => handleRequestDelete(e, m.id)}
                           className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-xl hover:bg-red-100 transition-colors shadow-sm"
                         >
                            <Trash2 size={16} />
                         </button>
                      )}
                      <div className="p-2.5 bg-brand-navy dark:bg-white text-white dark:text-brand-navy rounded-xl shadow-lg">
                         <ArrowUpRight size={16} />
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white dark:bg-[#1e293b] rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-premium dark:shadow-none overflow-hidden animate-slide-up">
             {filteredMaterials.map((m, idx) => (
                <div 
                  key={m.id}
                  onClick={() => isAdmin && handleOpenModal(m)}
                  className="group flex items-center justify-between p-6 border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50/50 dark:hover:bg-white/5 transition-all cursor-pointer"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                   <div className="flex items-center gap-6">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${getCategoryColor(m.category)} bg-opacity-20`}>
                         <Box size={20} />
                      </div>
                      <div>
                         <h4 className="text-sm font-black text-brand-navy dark:text-white font-data">{m.code}</h4>
                         <span className={`text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded ${getCategoryColor(m.category)}`}>{m.category}</span>
                      </div>
                   </div>
                   
                   <div className="flex-1 px-8 hidden md:block">
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase truncate">{m.description}</p>
                   </div>

                   <div className="flex items-center gap-8">
                      <div className="text-center">
                         <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 uppercase block">UND</span>
                         <span className="text-[10px] font-bold text-brand-navy dark:text-white">{m.unit}</span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${m.status === 'Ativo' ? 'bg-emerald-500' : 'bg-slate-300'}`}></div>
                      {isAdmin && (
                         <button onClick={(e) => handleRequestDelete(e, m.id)} className="p-2 text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 size={16} />
                         </button>
                      )}
                   </div>
                </div>
             ))}
          </div>
        )}

        {filteredMaterials.length === 0 && (
          <div className="py-40 text-center bg-slate-50/30 dark:bg-white/5 rounded-[3rem] border-2 border-dashed border-slate-200 dark:border-white/5 animate-pulse">
            <div className="w-24 h-24 bg-white dark:bg-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 text-slate-200 dark:text-slate-600 shadow-inner">
              <Package size={48} />
            </div>
            <h4 className="text-brand-navy dark:text-white font-black uppercase text-sm mb-2 tracking-tighter">Inventário Vazio</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em]">Nenhum ativo corresponde aos critérios</p>
          </div>
        )}
      </div>

      {/* ASSET BLUEPRINT EDITOR (MODAL) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-navy/95 dark:bg-black/95 backdrop-blur-2xl flex items-center justify-center z-[100] p-4 lg:p-8 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-5xl rounded-[4rem] shadow-premium border border-slate-200/50 dark:border-white/10 overflow-hidden animate-in zoom-in duration-500 flex flex-col max-h-full">
            
            {/* Header */}
            <div className="p-8 lg:p-10 pb-6 flex justify-between items-center bg-slate-50/50 dark:bg-[#020617]/50 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 bg-brand-navy dark:bg-white/10 text-white rounded-[1.8rem] flex items-center justify-center shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-brand-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                    <ScanBarcode size={32} className="relative z-10" />
                 </div>
                 <div>
                    <h3 className="text-3xl font-black text-brand-navy dark:text-white uppercase tracking-tighter leading-none">
                      {editingMaterial ? 'Editar Especificação' : 'Engenharia de Ativo'}
                    </h3>
                    <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.4em] mt-2">Inventory Blueprint v2.0</p>
                 </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 text-slate-400 hover:bg-white hover:text-brand-accent rounded-full transition-all shadow-sm btn-press">
                <X size={28} />
              </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
               <form onSubmit={handleSubmit} className="p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-12 gap-10">
                  
                  {/* LEFT: INPUT CONSOLE */}
                  <div className="lg:col-span-7 space-y-8">
                     
                     {/* Identification Block */}
                     <div className="space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="w-8 h-8 rounded-lg bg-brand-navy dark:bg-white/10 text-white flex items-center justify-center shadow-md"><Hash size={16} /></div>
                           <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Identificação Única</h4>
                        </div>
                        <TacticalInput 
                           label="Código SKU (Master ID)" 
                           icon={Hash} 
                           value={formData.code} 
                           onChange={(e: any) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                           placeholder="EX: ISO-ROCK-600"
                           required
                           autoFocus
                        />
                        <TacticalInput 
                           label="Descrição Técnica" 
                           icon={Database} 
                           value={formData.description} 
                           onChange={(e: any) => setFormData({...formData, description: e.target.value.toUpperCase()})}
                           placeholder="ESPECIFICAÇÃO DETALHADA DO MATERIAL"
                           required
                        />
                     </div>

                     {/* Metrology Block */}
                     <div className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="w-8 h-8 rounded-lg bg-brand-accent text-white flex items-center justify-center shadow-glow-accent"><Ruler size={16} /></div>
                           <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Metrologia & Unidade</h4>
                        </div>
                        <UnitSelector 
                           value={formData.unit} 
                           onChange={(val: string) => setFormData({...formData, unit: val})} 
                        />
                     </div>

                     {/* Classification Block */}
                     <div className="pt-6 border-t border-slate-100 dark:border-white/5 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                           <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-lg"><Layers size={16} /></div>
                           <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Taxonomia</h4>
                        </div>
                        <TacticalInput 
                           label="Categoria Operacional" 
                           icon={Tag} 
                           value={formData.category} 
                           onChange={(e: any) => setFormData({...formData, category: e.target.value})}
                           placeholder="SELECIONE OU DIGITE..."
                           list="categories-list"
                           required
                        />
                        <datalist id="categories-list">{categories.map(c => <option key={c} value={c} />)}</datalist>
                     </div>

                  </div>

                  {/* RIGHT: LIVE PREVIEW & FEEDBACK */}
                  <div className="lg:col-span-5 space-y-6">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4 pl-2">Simulação de Ativo</h4>
                     
                     {/* Preview Card */}
                     <div className="relative bg-white dark:bg-[#0f172a] rounded-[2.5rem] p-8 border border-slate-200 dark:border-white/10 shadow-2xl transition-all duration-500 hover:scale-[1.02]">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
                        
                        <div className="relative z-10 space-y-6">
                           <div className="flex justify-between items-start">
                              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-colors duration-500 ${impact.color} ${impact.bg}`}>
                                 <impact.icon size={24} />
                              </div>
                              <button 
                                type="button" 
                                onClick={() => setFormData({...formData, status: formData.status === 'Ativo' ? 'Inativo' : 'Ativo'})}
                                className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${formData.status === 'Ativo' ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg' : 'bg-slate-100 dark:bg-white/5 text-slate-400 border-slate-200 dark:border-white/10'}`}
                              >
                                 {formData.status || 'Status'}
                              </button>
                           </div>

                           <div>
                              <h3 className="text-2xl font-black text-brand-navy dark:text-white font-data tracking-tight break-all">
                                 {formData.code || 'SKU-0000'}
                              </h3>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-2 line-clamp-3 leading-relaxed">
                                 {formData.description || 'Descrição do material aparecerá aqui...'}
                              </p>
                           </div>

                           <div className="flex items-center gap-2 pt-4 border-t border-slate-100 dark:border-white/5">
                              <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase">UNIDADE BASE:</span>
                              <span className="text-sm font-black text-brand-navy dark:text-white bg-slate-50 dark:bg-white/5 px-3 py-1 rounded-lg">{formData.unit}</span>
                           </div>
                        </div>
                     </div>

                     {/* Logistics Intelligence Feedback */}
                     <div className="bg-slate-50 dark:bg-[#020617] p-6 rounded-[2rem] border border-slate-200 dark:border-white/5 relative overflow-hidden">
                        <div className="flex items-start gap-4 relative z-10">
                           <Info size={20} className="text-slate-400 mt-1" />
                           <div>
                              <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Logistics Intelligence</h5>
                              <div className={`flex items-center gap-2 text-[10px] font-bold uppercase ${impact.color}`}>
                                 <impact.icon size={14} /> {impact.label}
                              </div>
                              <p className="text-[9px] text-slate-400 mt-2 leading-relaxed">
                                 O sistema configurará automaticamente as regras de expedição baseadas na unidade <strong>{formData.unit}</strong>.
                              </p>
                           </div>
                        </div>
                     </div>

                  </div>

               </form>
            </div>

            {/* Footer Actions */}
            <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#020617]/50 flex gap-4">
               <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-5 rounded-[2rem] font-black text-slate-400 hover:bg-white dark:hover:bg-white/5 transition-all uppercase text-[10px] tracking-widest btn-press">
                  Cancelar Operação
               </button>
               <button onClick={handleSubmit} className="flex-[2] bg-brand-navy dark:bg-white dark:text-brand-navy text-white py-5 rounded-[2rem] font-black shadow-premium hover:bg-brand-accent dark:hover:bg-brand-accent dark:hover:text-white transition-all uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-4 group btn-press">
                  <Save size={20} className="group-hover:animate-bounce" /> 
                  {editingMaterial ? 'Confirmar Alterações' : 'Catalogar Novo Ativo'}
               </button>
            </div>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {isDeleteModalOpen && materialToDelete && (
        <div className="fixed inset-0 bg-brand-navy/98 dark:bg-black/90 backdrop-blur-3xl flex items-center justify-center z-[120] p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-[4rem] shadow-premium overflow-hidden animate-in zoom-in duration-500 border border-white/20 relative">
            <div className="p-12 text-center pb-6">
               <div className="w-24 h-24 bg-brand-red/10 rounded-[2.5rem] flex items-center justify-center text-brand-red mx-auto mb-8 shadow-glow-red border border-brand-red/10 relative group">
                 <ShieldAlert size={48} className="relative z-10 animate-pulse" />
                 <div className="absolute inset-0 bg-brand-red/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
               </div>
               <h3 className="text-2xl font-black text-brand-navy dark:text-white uppercase tracking-tighter leading-none mb-4">Arquivar SKU?</h3>
               <div className="space-y-2 mb-2">
                 <p className="text-brand-red font-black font-data text-lg">{materialToDelete.code}</p>
                 <p className="text-slate-500 text-[10px] font-bold leading-relaxed uppercase tracking-[0.2em] px-2 line-clamp-2">{materialToDelete.description}</p>
               </div>
               <p className="text-[9px] text-slate-400 uppercase mt-4">Esta ação remove o item do catálogo ativo.</p>
            </div>
            <div className="p-12 pt-4 flex flex-col gap-3">
              <button type="button" onClick={confirmDelete} className="w-full bg-brand-red text-white py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-brand-red-deep transition-all shadow-xl shadow-red-900/20 active:scale-95 group flex items-center justify-center gap-2 btn-press"><Trash2 size={16} /> Confirmar Arquivamento</button>
              <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="w-full py-5 rounded-[1.5rem] font-black text-slate-400 uppercase text-[10px] tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 hover:text-brand-navy dark:hover:text-white transition-all btn-press">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MaterialManagement;