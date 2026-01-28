
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { userService, UserExtended } from '../services/userService';
import { UserRole, User } from '../types';
import { 
  Users, UserPlus, Trash2, ShieldCheck, RefreshCw, Edit3, X, Fingerprint,
  Lock, ArrowRight, ShieldAlert, Settings, Truck, FileCheck, Mail, Briefcase,
  BadgeCheck, Zap, Shield, Save, Search, Filter, Activity, CheckCircle2,
  Eye, LayoutGrid, AlertTriangle, Key
} from 'lucide-react';

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

// --- COMPONENTE DE SELEÇÃO DE PERFIL (Access Cards) ---
const AccessProfileSelector = ({ selectedRole, onSelect }: { selectedRole: UserRole, onSelect: (r: UserRole) => void }) => {
  const profiles = [
    { 
      id: UserRole.ADMIN, 
      label: 'Administrador', 
      icon: ShieldCheck, 
      color: 'brand-accent',
      desc: 'Controle Total'
    },
    { 
      id: UserRole.OPERATOR, 
      label: 'Operador', 
      icon: Truck, 
      color: 'emerald-500',
      desc: 'Gestão Logística'
    },
    { 
      id: UserRole.VIEWER, 
      label: 'Visualizador', 
      icon: Eye, 
      color: 'slate-400',
      desc: 'Apenas Leitura'
    }
  ];

  return (
    <div className="grid grid-cols-3 gap-3">
      {profiles.map((p) => {
        const isSelected = selectedRole === p.id;
        return (
          <button
            key={p.id}
            type="button"
            onClick={() => onSelect(p.id)}
            className={`
              relative flex flex-col items-center justify-center p-3 rounded-2xl border transition-all duration-300 group overflow-hidden
              ${isSelected 
                ? `bg-brand-navy dark:bg-white text-white dark:text-brand-navy border-brand-navy dark:border-white shadow-lg transform scale-105`
                : 'bg-slate-50 dark:bg-[#0f172a] border-slate-200 dark:border-white/10 text-slate-400 hover:border-brand-accent/30 hover:bg-white dark:hover:bg-white/5'
              }
            `}
          >
            <p.icon size={20} className={`mb-2 ${isSelected ? 'text-brand-accent' : `text-${p.color} grayscale group-hover:grayscale-0`}`} />
            <span className="text-[9px] font-black uppercase tracking-widest">{p.label}</span>
            <span className={`text-[7px] font-bold uppercase mt-1 opacity-60`}>{p.desc}</span>
            
            {isSelected && <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse"></div>}
          </button>
        );
      })}
    </div>
  );
};

// --- COMPONENTE DE MATRIZ DE PERMISSÕES (Permission Check) ---
const PermissionMatrix = ({ role }: { role: UserRole }) => {
  const capabilities = [
    { label: 'Visualizar Dashboard', roles: [UserRole.ADMIN, UserRole.OPERATOR, UserRole.VIEWER] },
    { label: 'Criar/Editar Cargas', roles: [UserRole.ADMIN, UserRole.OPERATOR] },
    { label: 'Gestão Financeira', roles: [UserRole.ADMIN, UserRole.OPERATOR] },
    { label: 'Excluir Registros', roles: [UserRole.ADMIN] },
    { label: 'Gerenciar Usuários', roles: [UserRole.ADMIN] },
    { label: 'Configurações do Sistema', roles: [UserRole.ADMIN] },
  ];

  return (
    <div className="bg-slate-50 dark:bg-[#0f172a] rounded-2xl p-4 border border-slate-200 dark:border-white/10 space-y-2">
      <h5 className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-1 flex items-center gap-2">
        <Key size={12} /> Capacidades do Nível
      </h5>
      {capabilities.map((cap, i) => {
        const allowed = cap.roles.includes(role);
        return (
          <div key={i} className="flex items-center justify-between text-[10px] font-bold uppercase p-2 hover:bg-white dark:hover:bg-white/5 rounded-lg transition-colors">
            <span className={allowed ? 'text-brand-navy dark:text-white' : 'text-slate-400 line-through decoration-slate-300'}>
              {cap.label}
            </span>
            {allowed 
              ? <CheckCircle2 size={14} className="text-emerald-500" />
              : <Lock size={12} className="text-slate-300" />
            }
          </div>
        );
      })}
    </div>
  );
};

const UserManagement: React.FC = () => {
  const currentUser = userService.getCurrentUser();
  const isAdmin = currentUser.role === UserRole.ADMIN;
  
  const [team, setTeam] = useState<UserExtended[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState<string>('all');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserExtended | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserExtended | null>(null);

  const [formData, setFormData] = useState<Partial<UserExtended>>({
    name: '',
    email: '',
    role: UserRole.OPERATOR,
    department: '',
    status: 'Ativo' // Simulando campo de status para UI
  });

  const refreshList = useCallback(() => {
    setTeam(userService.getUsers());
  }, []);

  useEffect(() => {
    refreshList();
    const handleChanged = () => refreshList();
    window.addEventListener('userChanged', handleChanged);
    return () => window.removeEventListener('userChanged', handleChanged);
  }, [refreshList]);

  const filteredTeam = useMemo(() => {
    return team.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role === filterRole;
      return matchesSearch && matchesRole;
    });
  }, [team, searchTerm, filterRole]);

  const stats = useMemo(() => ({
    total: team.length,
    admins: team.filter(u => u.role === UserRole.ADMIN).length,
    operators: team.filter(u => u.role === UserRole.OPERATOR).length,
    activeNow: Math.ceil(team.length * 0.8) // Simulação visual
  }), [team]);

  if (!isAdmin) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center p-8 animate-in fade-in zoom-in duration-500">
        <div className="w-24 h-24 bg-brand-navy/10 dark:bg-white/10 rounded-[2.5rem] flex items-center justify-center text-brand-navy dark:text-white mb-8 border border-brand-navy/5 dark:border-white/5 shadow-inner">
          <Lock size={40} className="animate-pulse" />
        </div>
        <h2 className="text-4xl font-black text-brand-navy dark:text-white uppercase tracking-tighter mb-4">Protocolo de Acesso Privado</h2>
        <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.4em] max-w-sm leading-relaxed">
          O gerenciamento da rede operacional Gesla é restrito à diretoria de sistemas.
        </p>
        <button 
          type="button"
          onClick={() => window.location.hash = '#/'}
          className="mt-10 px-12 py-5 bg-brand-navy dark:bg-white dark:text-brand-navy text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-gesla-hard hover:bg-brand-accent dark:hover:bg-brand-accent dark:hover:text-white hover:-translate-y-1 transition-all active:scale-95 btn-press"
        >
          Retornar ao Painel
        </button>
      </div>
    );
  }

  const handleOpenModal = (user: UserExtended | null = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({ name: user.name, email: user.email, role: user.role, department: user.department });
    } else {
      setEditingUser(null);
      setFormData({ name: '', email: '', role: UserRole.OPERATOR, department: '', status: 'Ativo' });
    }
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      userService.updateUser(editingUser.id, formData);
    } else {
      userService.addUser(formData);
    }
    setIsModalOpen(false);
    refreshList();
  };

  const handleDelete = (e: React.MouseEvent, user: UserExtended) => {
    e.stopPropagation();
    e.preventDefault();
    if (user.id === currentUser.id) return;
    setUserToDelete(user);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = () => {
    if (userToDelete) {
      userService.deleteUser(userToDelete.id);
      setIsDeleteModalOpen(false);
      setUserToDelete(null);
      refreshList();
    }
  };

  const handleSimulate = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    userService.setCurrentUser(id);
    window.location.reload();
  };

  const PermissionRow = ({ icon: Icon, label, allowed }: any) => (
    <div className={`flex items-center justify-between py-4 border-b border-slate-100 dark:border-white/5 last:border-none transition-opacity ${allowed ? 'opacity-100' : 'opacity-40'}`}>
      <div className="flex items-center gap-4">
        <div className={`p-2.5 rounded-xl ${allowed ? 'bg-brand-accent/10 text-brand-accent' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
          <Icon size={16} />
        </div>
        <span className="text-[10px] font-black uppercase tracking-widest text-brand-navy dark:text-white">{label}</span>
      </div>
      {allowed ? <BadgeCheck size={18} className="text-emerald-500" /> : <X size={16} className="text-slate-300 dark:text-slate-600" />}
    </div>
  );

  return (
    <div className="space-y-8 animate-enter pb-24 min-h-screen">
      
      {/* HEADER MISSION CONTROL */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10 p-4 lg:p-0">
        <div className="space-y-2 group cursor-default">
          <div className="flex items-center gap-3">
             <div className="p-2 bg-brand-navy/5 dark:bg-white/10 rounded-xl text-brand-navy dark:text-slate-400 shadow-sm group-hover:rotate-12 transition-transform duration-500">
                <Users size={18} />
             </div>
             <span className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.4em]">Gesla Personnel Command</span>
          </div>
          <h2 className="text-5xl font-black text-brand-navy dark:text-white tracking-tighter uppercase leading-none">
            Time de <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-purple-600 animate-pulse-slow">Elite</span>
          </h2>
        </div>

        {/* METRICS HUD */}
        <div className="flex gap-4 w-full xl:w-auto">
           <div className="flex-1 bg-white dark:bg-[#1e293b] p-4 rounded-[1.8rem] border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-4 min-w-[140px]">
              <div className="p-3 bg-brand-navy dark:bg-white text-white dark:text-brand-navy rounded-xl"><ShieldCheck size={18} /></div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Admins</p>
                 <p className="text-xl font-black text-brand-navy dark:text-white font-data">{stats.admins}</p>
              </div>
           </div>
           <div className="flex-1 bg-white dark:bg-[#1e293b] p-4 rounded-[1.8rem] border border-slate-100 dark:border-white/5 shadow-sm flex items-center gap-4 min-w-[140px]">
              <div className="p-3 bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-slate-300 rounded-xl"><Truck size={18} /></div>
              <div>
                 <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Agentes</p>
                 <p className="text-xl font-black text-brand-navy dark:text-white font-data">{stats.operators}</p>
              </div>
           </div>
        </div>
      </div>

      {/* CONTROL BAR */}
      <div className="p-4 lg:p-0">
        <div className="bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-xl p-3 pl-6 rounded-[2.5rem] shadow-premium dark:shadow-none flex flex-wrap items-center justify-between gap-4 border border-slate-200/50 dark:border-white/5 transition-all duration-500 hover:shadow-2xl dark:hover:shadow-glow-hover hover:border-brand-accent/30">
          <div className="flex-1 flex items-center gap-4 min-w-[280px]">
            <Search className="text-slate-300 dark:text-slate-500" size={24} />
            <input 
              type="text" 
              placeholder="BUSCAR AGENTE, EMAIL OU DEPARTAMENTO..." 
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
                value={filterRole}
                onChange={(e) => setFilterRole(e.target.value)}
              >
                <option value="all">Nível: Todos</option>
                <option value={UserRole.ADMIN}>Administradores</option>
                <option value={UserRole.OPERATOR}>Operadores</option>
              </select>
            </div>

            <button 
              type="button"
              onClick={() => handleOpenModal()}
              className="bg-brand-accent text-white px-8 py-4 rounded-[2rem] font-black shadow-glow-accent hover:bg-opacity-90 hover:translate-y-[-4px] active:scale-95 transition-all flex items-center gap-3 uppercase tracking-[0.2em] text-[10px] group btn-press"
            >
              <UserPlus size={18} className="group-hover:rotate-12 transition-transform" /> <span className="hidden sm:inline">Homologar</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 p-4 lg:p-0">
        
        {/* TEAM CARDS GRID */}
        <div className="xl:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredTeam.map((user, idx) => (
            <div 
              key={user.id} 
              className={`
                group relative bg-white dark:bg-[#1e293b] p-8 rounded-[3rem] border transition-all duration-500 overflow-hidden flex flex-col justify-between min-h-[280px] animate-slide-up
                ${user.id === currentUser.id 
                  ? 'border-brand-navy dark:border-white/30 shadow-2xl' 
                  : 'border-slate-100 dark:border-white/5 hover:border-brand-accent/30 hover:shadow-premium dark:hover:shadow-glow-hover hover:-translate-y-2'
                }
              `}
              style={{ animationDelay: `${idx * 100}ms` }}
            >
              {/* Background Glow */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-brand-navy/5 dark:bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl group-hover:bg-brand-accent/10 transition-colors duration-700"></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div className={`
                    w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl transition-all duration-500 shadow-lg
                    ${user.id === currentUser.id 
                      ? 'bg-brand-navy dark:bg-white text-white dark:text-brand-navy' 
                      : 'bg-slate-50 dark:bg-white/5 text-brand-navy dark:text-white border border-slate-100 dark:border-white/10 group-hover:bg-brand-accent group-hover:text-white'
                    }
                  `}>
                    {user.name.charAt(0)}
                  </div>
                  
                  <div className="flex flex-col items-end gap-2">
                    <span className={`px-4 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                      user.role === UserRole.ADMIN 
                        ? 'bg-brand-navy dark:bg-white text-white dark:text-brand-navy border-brand-navy dark:border-white' 
                        : 'bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-slate-100 dark:border-white/5'
                    }`}>
                      {user.role}
                    </span>
                    <div className="flex items-center gap-2">
                       <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]"></div>
                       <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{user.lastActivity || 'Offline'}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h4 className="font-black text-brand-navy dark:text-white uppercase text-lg tracking-tight truncate pr-4 group-hover:text-brand-accent transition-colors">{user.name}</h4>
                  <div className="flex items-center gap-2 text-slate-400 font-bold text-[9px] uppercase tracking-widest">
                    <Briefcase size={12} />
                    {user.department || 'Operações Gerais'}
                  </div>
                </div>

                <div className="mt-6 flex items-center gap-3 text-slate-400 group-hover:text-brand-navy dark:group-hover:text-white transition-colors">
                  <Mail size={14} className="shrink-0" />
                  <p className="text-[10px] font-bold tracking-tight truncate font-data">{user.email}</p>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 dark:border-white/5 relative z-10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0 duration-300">
                <span className="text-[8px] font-black text-slate-300 dark:text-slate-600 font-data">ID: {user.id.slice(0, 4)}</span>
                
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => handleOpenModal(user)}
                    className="p-2.5 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-400 hover:text-brand-navy dark:hover:text-white hover:border-brand-accent/50 rounded-xl transition-all shadow-sm"
                    title="Editar Credenciais"
                  ><Edit3 size={16} /></button>
                  {user.id !== currentUser.id && (
                    <button 
                      type="button"
                      onClick={(e) => handleDelete(e, user)}
                      className="p-2.5 bg-white dark:bg-white/5 border border-slate-100 dark:border-white/5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-200 rounded-xl transition-all shadow-sm"
                      title="Revogar Acesso"
                    ><Trash2 size={16} /></button>
                  )}
                  <button 
                    type="button" 
                    onClick={(e) => handleSimulate(e, user.id)}
                    className="p-2.5 bg-brand-navy dark:bg-white text-white dark:text-brand-navy rounded-xl shadow-lg hover:bg-brand-accent dark:hover:bg-brand-accent dark:hover:text-white transition-all"
                    title="Simular Acesso"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* SIDEBAR: SECURITY DOSSIER */}
        <div className="xl:col-span-4 space-y-8 h-fit sticky top-28 animate-in slide-in-from-right-8 fade-in duration-700">
          
          {/* AUTHORITY MATRIX */}
          <div className="bg-brand-navy dark:bg-[#0f172a] p-8 rounded-[3rem] shadow-gesla-hard dark:shadow-none border border-white/5 text-white relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-accent/10 rounded-full -mr-24 -mt-24 blur-[60px] group-hover:scale-150 transition-transform duration-[2000ms]"></div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 bg-brand-accent text-white rounded-[1.2rem] flex items-center justify-center shadow-glow-accent">
                  <Shield size={24} />
                </div>
                <div>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">Matriz de Autoridade</h4>
                  <p className="text-[8px] font-bold text-slate-400 uppercase mt-1">Hierarquia LogiControl Pro</p>
                </div>
              </div>
              
              <div className="space-y-8">
                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span> Nível Operacional
                  </p>
                  <div className="bg-white/5 rounded-2xl p-4 space-y-3 border border-white/5">
                     <PermissionRow icon={Truck} label="Fluxo Logístico" allowed={true} />
                     <PermissionRow icon={FileCheck} label="DIFAL & Faturamento" allowed={true} />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Nível Administrativo
                  </p>
                  <div className="bg-white/5 rounded-2xl p-4 space-y-3 border border-white/5">
                     <PermissionRow icon={Fingerprint} label="Controle de Equipe" allowed={currentUser.role === UserRole.ADMIN} />
                     <PermissionRow icon={Settings} label="Configurações Core" allowed={currentUser.role === UserRole.ADMIN} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* AUDIT LOG PREVIEW */}
          <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-premium">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-brand-navy dark:text-white"><Activity size={18} /></div>
              <h4 className="text-[10px] font-black text-brand-navy dark:text-white uppercase tracking-[0.3em]">Logs Recentes</h4>
            </div>
            <div className="space-y-4">
               {[1, 2, 3].map((_, i) => (
                  <div key={i} className="flex gap-3 items-start p-3 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors cursor-default">
                     <div className="mt-1 w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                     <div>
                        <p className="text-[9px] font-black text-brand-navy dark:text-white uppercase leading-tight">Login Autorizado</p>
                        <p className="text-[8px] font-bold text-slate-400 mt-0.5">Adrian Gestor • Há 2 min</p>
                     </div>
                  </div>
               ))}
            </div>
          </div>

        </div>
      </div>

      {/* MODAL DE HOMOLOGAÇÃO ( IDENTITY & ACCESS PROTOCOL ) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-brand-navy/95 dark:bg-black/90 backdrop-blur-2xl flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-4xl rounded-[4rem] shadow-gesla-hard border border-white/20 overflow-hidden animate-in zoom-in duration-500 flex flex-col max-h-[90vh]">
            
            <div className="p-8 lg:p-10 pb-6 flex justify-between items-center bg-slate-50/50 dark:bg-[#020617]/50 border-b border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-6">
                <div className="w-16 h-16 bg-brand-navy dark:bg-white/10 text-white rounded-[1.8rem] flex items-center justify-center shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-brand-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500"></div>
                  <Fingerprint size={32} className="relative z-10" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-brand-navy dark:text-white uppercase tracking-tighter leading-none">
                    {editingUser ? 'Ajustar Credenciais' : 'Console de Credenciamento'}
                  </h3>
                  <p className="text-[9px] font-black text-brand-accent uppercase tracking-[0.4em] mt-2">Identity & Access Protocol (IAP)</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 text-slate-400 hover:bg-white hover:text-brand-accent rounded-full transition-all shadow-sm btn-press">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSave} className="flex-1 overflow-y-auto custom-scrollbar">
              <div className="p-8 lg:p-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                
                {/* ESQUERDA: DADOS DE IDENTIDADE */}
                <div className="space-y-8 animate-in slide-in-from-left-4 fade-in duration-500 delay-100">
                   <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-navy dark:bg-white/10 text-white flex items-center justify-center shadow-md"><Users size={16} /></div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Dados do Agente</h4>
                   </div>

                   <div className="p-6 bg-slate-50 dark:bg-[#020617] rounded-[2.5rem] border border-slate-100 dark:border-white/5 flex flex-col items-center justify-center mb-6 relative overflow-hidden group">
                      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none"></div>
                      <div className="w-24 h-24 rounded-[2rem] bg-white dark:bg-white/10 shadow-xl flex items-center justify-center text-4xl font-black text-brand-navy dark:text-white mb-4 relative z-10 transition-transform group-hover:scale-110">
                         {formData.name ? formData.name.charAt(0) : <UserPlus size={32} className="text-slate-300" />}
                      </div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Avatar do Sistema</p>
                   </div>

                   <div className="space-y-6">
                      <TacticalInput 
                         label="Nome Completo" 
                         icon={Users} 
                         value={formData.name} 
                         onChange={(e: any) => setFormData({...formData, name: e.target.value.toUpperCase()})}
                         placeholder="EX: JOÃO SILVA"
                         autoFocus
                         required
                      />
                      <TacticalInput 
                         label="E-mail Corporativo" 
                         icon={Mail} 
                         value={formData.email} 
                         onChange={(e: any) => setFormData({...formData, email: e.target.value.toLowerCase()})}
                         placeholder="nome@gesla.com.br"
                         type="email"
                         required
                      />
                      <TacticalInput 
                         label="Departamento" 
                         icon={Briefcase} 
                         value={formData.department} 
                         onChange={(e: any) => setFormData({...formData, department: e.target.value.toUpperCase()})}
                         placeholder="EX: LOGÍSTICA"
                      />
                   </div>
                </div>

                {/* DIREITA: PERMISSÕES E ACESSO */}
                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-500 delay-200">
                   <div className="flex items-center gap-3 mb-2">
                      <div className="w-8 h-8 rounded-lg bg-brand-accent text-white flex items-center justify-center shadow-glow-accent"><Lock size={16} /></div>
                      <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Nível de Autoridade</h4>
                   </div>

                   <div className="p-6 bg-white dark:bg-[#020617] rounded-[2.5rem] border border-slate-200 dark:border-white/10 shadow-sm relative">
                      <label className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] block mb-4 ml-1">Perfil de Acesso</label>
                      <AccessProfileSelector 
                        selectedRole={formData.role || UserRole.OPERATOR} 
                        onSelect={(role) => setFormData({...formData, role})}
                      />
                   </div>

                   <div className="space-y-4">
                      <PermissionMatrix role={formData.role || UserRole.OPERATOR} />
                      
                      {/* STATUS TOGGLE */}
                      <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-[#020617] rounded-2xl border border-slate-200 dark:border-white/5">
                         <div className="flex items-center gap-3">
                            <Activity size={18} className={formData.status === 'Ativo' ? 'text-emerald-500' : 'text-slate-400'} />
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">Status da Conta</span>
                         </div>
                         <button 
                           type="button" 
                           onClick={() => setFormData({...formData, status: formData.status === 'Ativo' ? 'Inativo' : 'Ativo'})}
                           className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest border transition-all ${
                             formData.status === 'Ativo' 
                               ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg' 
                               : 'bg-slate-200 dark:bg-white/10 text-slate-500 border-transparent'
                           }`}
                         >
                            {formData.status || 'Ativo'}
                         </button>
                      </div>
                   </div>
                </div>

              </div>
            </form>

            {/* Footer Actions */}
            <div className="p-8 border-t border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-[#020617]/50 flex gap-4">
               <button 
                 type="button" 
                 onClick={() => setIsModalOpen(false)} 
                 className="flex-1 py-5 rounded-[2rem] font-black text-slate-400 hover:bg-white dark:hover:bg-white/5 transition-all uppercase text-[10px] tracking-widest btn-press"
               >
                  Cancelar
               </button>
               <button 
                 onClick={handleSave} 
                 className="flex-[2] bg-brand-navy dark:bg-white dark:text-brand-navy text-white py-5 rounded-[2rem] font-black shadow-gesla-hard hover:bg-brand-accent dark:hover:bg-brand-accent dark:hover:text-white transition-all uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-4 group btn-press"
               >
                  <Save size={20} className="group-hover:animate-bounce" /> 
                  {editingUser ? 'Atualizar Dossiê' : 'Conceder Acesso'}
               </button>
            </div>

          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {isDeleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-brand-navy/98 dark:bg-black/90 backdrop-blur-3xl flex items-center justify-center z-[120] p-6 animate-in fade-in duration-300">
          <div className="bg-white dark:bg-[#1e293b] w-full max-w-sm rounded-[4rem] shadow-gesla-hard overflow-hidden animate-in zoom-in duration-500 border border-white/20">
            <div className="p-12 text-center">
               <div className="w-24 h-24 bg-brand-red/10 rounded-[2.5rem] flex items-center justify-center text-brand-red mx-auto mb-10 shadow-glow-red border border-brand-red/10">
                 <ShieldAlert size={48} className="animate-pulse" />
               </div>
               <h3 className="text-3xl font-black text-brand-navy dark:text-white uppercase tracking-tighter leading-none mb-4">Revogar Acesso?</h3>
               <p className="text-slate-500 text-[10px] font-bold leading-relaxed uppercase tracking-[0.2em] px-6">
                O colaborador <span className="text-brand-red font-black">{userToDelete.name}</span> perderá acesso imediato a todo o ecossistema Gesla.
              </p>
            </div>
            <div className="p-12 pt-0 flex flex-col gap-4">
              <button type="button" onClick={confirmDelete} className="w-full bg-brand-red text-white py-5 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] hover:bg-red-700 transition-all shadow-xl shadow-red-900/20 active:scale-95 btn-press">Confirmar Revogação</button>
              <button type="button" onClick={() => setIsDeleteModalOpen(false)} className="w-full py-5 rounded-[1.5rem] font-black text-slate-400 uppercase text-[10px] tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all btn-press">Manter Ativo</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
