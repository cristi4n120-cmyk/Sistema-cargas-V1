
import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { useNavigate } = ReactRouterDOM;
import { 
  Menu, Bell, Search, MapPin, Plus, 
  Settings, LogOut, ChevronDown, CheckCircle2, 
  AlertCircle, Info, ShieldAlert, FileBarChart,
  Zap, Command, LayoutGrid, Radio, MessageCircle
} from 'lucide-react';
import { userService } from '../services/userService';
import { notificationService } from '../services/notificationService';
import { Notification, OperationUnit, UserRole } from '../types';

const UNITS: OperationUnit[] = [
  { id: 'pr01', name: 'Guarapuava HQ', state: 'PR', code: 'GSL-HQ-01' },
  { id: 'sc01', name: 'Joinville Hub', state: 'SC', code: 'GSL-HUB-02' },
  { id: 'sp01', name: 'Santos Port', state: 'SP', code: 'GSL-PRT-03' },
];

const TopBar: React.FC<{ onOpenSidebar: () => void }> = ({ onOpenSidebar }) => {
  const navigate = useNavigate();
  const currentUser = userService.getCurrentUser();
  const [activeUnit, setActiveUnit] = useState(UNITS[0]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUnitMenu, setShowUnitMenu] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  
  const notifRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const unitRef = useRef<HTMLDivElement>(null);

  const refreshNotifications = () => {
    setNotifications(notificationService.getNotifications());
  };

  useEffect(() => {
    refreshNotifications();
    window.addEventListener('notificationsChanged', refreshNotifications);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotifications(false);
      if (userRef.current && !userRef.current.contains(event.target as Node)) setShowUserMenu(false);
      if (unitRef.current && !unitRef.current.contains(event.target as Node)) setShowUnitMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      window.removeEventListener('notificationsChanged', refreshNotifications);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;
  // Check for critical notifications
  const hasDanger = notifications.some(n => !n.read && n.type === 'danger');

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    userService.logout();
  };

  const executeSearch = () => {
    if (globalSearch.trim()) {
      navigate('/loads', { state: { globalSearch } });
      setSearchFocused(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeSearch();
    }
  };

  const handleNotificationClick = (notif: Notification) => {
    notificationService.markAsRead(notif.id);
    if (notif.link) {
      window.open(notif.link, '_blank');
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case 'success': return <div className="p-2 bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl"><CheckCircle2 size={16} /></div>;
      case 'danger': return <div className="p-2 bg-red-100 dark:bg-brand-red/20 text-brand-red dark:text-brand-red rounded-xl animate-pulse"><ShieldAlert size={16} /></div>;
      case 'warning': return <div className="p-2 bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl"><AlertCircle size={16} /></div>;
      case 'whatsapp': return <div className="p-2 bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 rounded-xl"><MessageCircle size={16} /></div>;
      default: return <div className="p-2 bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 rounded-xl"><Info size={16} /></div>;
    }
  };

  return (
    <header className="h-20 bg-white/80 dark:bg-brand-navy/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 shadow-sm dark:shadow-none flex items-center justify-between px-4 lg:px-6 sticky top-0 z-[60] transition-all duration-300">
      
      {/* LEFT SECTION: MOBILE MENU & UNIT SELECTOR */}
      <div className="flex items-center gap-6">
        <button 
          onClick={onOpenSidebar} 
          className="lg:hidden p-3 text-brand-navy dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all btn-press"
        >
          <Menu size={24} />
        </button>

        <div className="relative" ref={unitRef}>
          <button 
            onClick={() => setShowUnitMenu(!showUnitMenu)}
            className={`group flex items-center gap-4 px-1 py-1 pr-5 rounded-[1.2rem] border transition-all duration-300 btn-press ${
              showUnitMenu 
                ? 'bg-white dark:bg-brand-navy-light border-brand-accent shadow-lg ring-4 ring-brand-accent/10' 
                : 'bg-slate-50/50 dark:bg-brand-navy-lighter/50 border-slate-200 dark:border-white/10 hover:bg-white dark:hover:bg-brand-navy-light hover:shadow-md'
            }`}
          >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm transition-colors ${
              showUnitMenu 
                ? 'bg-brand-accent text-white' 
                : 'bg-white dark:bg-brand-navy-light text-brand-navy dark:text-white border border-slate-200 dark:border-white/5'
            }`}>
              <MapPin size={18} />
            </div>
            <div className="text-left hidden sm:block">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-brand-navy dark:text-white uppercase tracking-widest">{activeUnit.name}</span>
                <span className={`w-1.5 h-1.5 rounded-full ${showUnitMenu ? 'bg-brand-accent animate-pulse' : 'bg-emerald-500'}`}></span>
              </div>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight font-data mt-0.5">{activeUnit.code}</p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 dark:text-slate-300 transition-transform duration-300 ${showUnitMenu ? 'rotate-180 text-brand-accent' : ''}`} />
          </button>

          {showUnitMenu && (
            <div className="absolute top-full left-0 mt-3 w-72 bg-white dark:bg-brand-navy-light rounded-[2rem] shadow-xl shadow-slate-200/50 dark:shadow-gesla-hard border border-slate-100 dark:border-white/10 overflow-hidden animate-in slide-in-from-top-2 duration-300 z-[70]">
              <div className="p-5 border-b border-slate-100 dark:border-white/5 bg-slate-50/50 dark:bg-black/20 flex items-center justify-between">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Seleção de Terminal</span>
                <Radio size={14} className="text-brand-accent animate-pulse" />
              </div>
              <div className="p-2 space-y-1">
                {UNITS.map(unit => (
                  <button
                    key={unit.id}
                    onClick={() => { setActiveUnit(unit); setShowUnitMenu(false); }}
                    className={`w-full flex items-center justify-between p-4 rounded-2xl transition-all group btn-press ${
                      activeUnit.id === unit.id 
                        ? 'bg-brand-navy dark:bg-brand-accent text-white shadow-lg shadow-brand-navy/20 dark:shadow-glow-accent' 
                        : 'hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex flex-col items-start gap-1">
                       <span className="text-[10px] font-black uppercase tracking-wider">{unit.name}</span>
                       <span className={`text-[8px] font-bold uppercase tracking-widest ${activeUnit.id === unit.id ? 'text-slate-400 dark:text-white/80' : 'text-slate-400 dark:text-slate-500'}`}>{unit.state} • {unit.code}</span>
                    </div>
                    {activeUnit.id === unit.id && <Zap size={14} className="text-brand-accent dark:text-white fill-current" />}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* CENTER SECTION: GLOBAL SEARCH */}
      <div className={`hidden md:flex flex-1 max-w-xl mx-8 relative group transition-all duration-500 ${searchFocused ? 'scale-[1.02]' : ''}`}>
        <div className={`absolute inset-0 bg-gradient-to-r from-brand-red/10 to-brand-navy/10 dark:from-brand-accent/20 dark:to-brand-navy/20 rounded-[2rem] blur-xl transition-opacity duration-500 ${searchFocused ? 'opacity-100' : 'opacity-0'}`}></div>
        <div className={`relative flex items-center w-full bg-slate-100/50 dark:bg-[#020617]/50 border rounded-[2rem] transition-all duration-300 ${
          searchFocused 
            ? 'bg-white dark:bg-[#0f172a] border-brand-accent ring-4 ring-brand-accent/10 shadow-xl' 
            : 'border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 hover:bg-white dark:hover:bg-[#0f172a]'
        }`}>
          <button 
            onClick={executeSearch}
            className="pl-6 pr-2 text-slate-400 hover:text-brand-accent transition-colors focus:outline-none"
            title="Pesquisar"
          >
            <Search size={20} />
          </button>
          <input 
            type="text" 
            placeholder="Pesquisar carga (Enter)" 
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            onKeyDown={handleKeyDown}
            className="w-full px-2 py-4 bg-transparent text-sm font-bold text-brand-navy dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 outline-none uppercase tracking-wide"
          />
          <div className="pr-4 hidden lg:flex pointer-events-none">
             <div className="flex items-center gap-1 px-2 py-1 bg-slate-200 dark:bg-white/10 rounded-lg border border-slate-300/50 dark:border-white/5 text-slate-500 dark:text-slate-300">
                <Command size={10} />
                <span className="text-[9px] font-black font-data">K</span>
             </div>
          </div>
        </div>
      </div>

      {/* RIGHT SECTION: ACTIONS & PROFILE */}
      <div className="flex items-center gap-3 lg:gap-5">
        
        {/* Quick Actions */}
        <div className="hidden xl:flex items-center gap-2 pr-5 border-r border-slate-200 dark:border-white/5">
          <button 
            onClick={() => navigate('/loads/new')} 
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-brand-navy dark:bg-brand-accent text-white text-[10px] font-black uppercase tracking-widest hover:bg-brand-red dark:hover:bg-brand-accent/80 hover:shadow-lg hover:shadow-brand-red/20 dark:hover:shadow-glow-accent transition-all btn-press group border border-transparent dark:border-white/5"
          >
            <Plus size={14} className="group-hover:rotate-90 transition-transform" /> 
            <span>Novo Manifesto</span>
          </button>
          <button 
            onClick={() => navigate('/')} 
            className="p-3 text-slate-500 hover:text-brand-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10 rounded-2xl transition-all btn-press" 
            title="Dashboard BI"
          >
            <LayoutGrid size={20} />
          </button>
        </div>

        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`p-3.5 rounded-2xl relative transition-all duration-300 btn-press ${
              showNotifications 
                ? 'bg-white dark:bg-brand-navy-light text-brand-red dark:text-brand-accent shadow-lg ring-4 ring-brand-red/5 dark:ring-brand-accent/10' 
                : hasDanger 
                  ? 'bg-red-50 dark:bg-red-900/20 text-brand-red shadow-glow-red animate-pulse' 
                  : 'bg-slate-50/50 dark:bg-white/5 text-slate-500 hover:text-brand-navy dark:text-slate-400 hover:bg-white dark:hover:bg-white/10 dark:hover:text-white hover:shadow-md'
            }`}
          >
            <Bell size={20} className={unreadCount > 0 ? 'animate-swing origin-top' : ''} />
            {unreadCount > 0 && (
              <span className={`absolute top-2 right-2.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-brand-navy ${hasDanger ? 'bg-brand-red' : 'bg-brand-accent'}`}>
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${hasDanger ? 'bg-brand-red' : 'bg-brand-accent'}`}></span>
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute top-full right-0 mt-4 w-[400px] bg-white dark:bg-brand-navy-light rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-gesla-hard border border-slate-100 dark:border-white/10 overflow-hidden animate-in zoom-in duration-300 origin-top-right z-[70]">
              <div className={`p-6 text-white flex justify-between items-center relative overflow-hidden ${hasDanger ? 'bg-brand-red' : 'bg-brand-navy dark:bg-[#020617]'}`}>
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                <div className="relative z-10 flex items-center gap-3">
                   <div className="p-2 bg-white/10 rounded-xl backdrop-blur-sm"><Bell size={16} /></div>
                   <div>
                      <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">Notificações</h4>
                      <p className="text-[9px] font-bold text-white/70 uppercase tracking-wide">{unreadCount} não lidas {hasDanger && '(Crítico)'}</p>
                   </div>
                </div>
                <button 
                  onClick={() => notificationService.markAllAsRead()} 
                  className="relative z-10 text-[9px] font-black uppercase text-white bg-white/10 px-3 py-1.5 rounded-lg hover:bg-white hover:text-brand-navy transition-colors btn-press"
                >
                  Limpar
                </button>
              </div>
              
              <div className="max-h-[400px] overflow-y-auto p-3 space-y-2 custom-scrollbar">
                {notifications.length > 0 ? notifications.map((notif, idx) => (
                  <div 
                    key={notif.id} 
                    onClick={() => handleNotificationClick(notif)}
                    className={`flex items-start gap-4 p-4 rounded-3xl transition-all cursor-pointer group border ${
                      notif.read 
                        ? 'bg-transparent border-transparent opacity-60 hover:opacity-100' 
                        : 'bg-slate-50 dark:bg-brand-navy-lighter/30 border-slate-100 dark:border-white/5 hover:bg-white dark:hover:bg-brand-navy-lighter/60 hover:border-brand-accent/20 hover:shadow-lg'
                    }`}
                    style={{ animationDelay: `${idx * 0.05}s` }}
                  >
                    <div className="shrink-0 mt-0.5 group-hover:scale-110 transition-transform">{getNotifIcon(notif.type)}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-start">
                        <p className={`text-[10px] font-black uppercase truncate ${notif.read ? 'text-slate-500' : 'text-brand-navy dark:text-white'}`}>{notif.title}</p>
                        <span className="text-[8px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">{notif.time}</span>
                      </div>
                      <p className="text-[10px] font-bold text-slate-500 dark:text-slate-400 leading-snug mt-1 line-clamp-2">{notif.description}</p>
                      {notif.link && (
                        <span className="text-[8px] font-black text-green-600 dark:text-green-400 uppercase flex items-center gap-1 mt-1.5">
                          <MessageCircle size={10} /> Disparar Bot WhatsApp
                        </span>
                      )}
                    </div>
                    {!notif.read && <div className={`w-1.5 h-1.5 rounded-full mt-2 ${notif.type === 'danger' ? 'bg-brand-red' : 'bg-brand-accent'}`}></div>}
                  </div>
                )) : (
                  <div className="py-16 text-center opacity-40">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <FileBarChart size={24} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tudo Silencioso</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="relative" ref={userRef}>
          <button 
            onClick={() => setShowUserMenu(!showUserMenu)}
            className={`flex items-center gap-3 p-1.5 pr-2 rounded-[1.2rem] border transition-all duration-300 btn-press ${
              showUserMenu 
                ? 'bg-white dark:bg-brand-navy-light border-brand-accent shadow-lg ring-4 ring-brand-accent/10' 
                : 'bg-slate-50/50 dark:bg-white/5 border-transparent hover:bg-white dark:hover:bg-brand-navy-light hover:border-slate-200 dark:hover:border-white/10 hover:shadow-md'
            }`}
          >
            <div className={`w-10 h-10 rounded-[0.8rem] flex items-center justify-center font-black text-sm text-white shadow-md transition-transform ${
              currentUser?.role === UserRole.ADMIN ? 'bg-brand-navy dark:bg-brand-accent' : 'bg-indigo-600'
            }`}>
              {currentUser?.name?.charAt(0)}
            </div>
            
            <div className="text-left hidden lg:block mr-2">
              <p className="text-[10px] font-black text-brand-navy dark:text-white uppercase tracking-tight leading-none mb-0.5">
                {currentUser?.name?.split(' ')[0]}
              </p>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest leading-none">
                {currentUser?.role === UserRole.ADMIN ? 'Admin' : 'Operador'}
              </p>
            </div>
            <ChevronDown size={14} className={`text-slate-400 dark:text-slate-300 transition-transform duration-300 ${showUserMenu ? 'rotate-180 text-brand-accent' : ''}`} />
          </button>

          {showUserMenu && (
            <div className="absolute top-full right-0 mt-4 w-72 bg-white dark:bg-brand-navy-light rounded-[2.5rem] shadow-xl shadow-slate-200/50 dark:shadow-gesla-hard border border-slate-100 dark:border-white/10 overflow-hidden animate-in slide-in-from-top-2 duration-300 z-[70]">
              <div className="p-8 pb-6 border-b border-slate-100 dark:border-white/5 text-center bg-slate-50/30 dark:bg-black/20 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-brand-navy via-brand-accent to-brand-navy"></div>
                 <div className="w-20 h-20 rounded-[1.5rem] bg-brand-navy dark:bg-brand-accent flex items-center justify-center text-white text-2xl font-black mx-auto mb-4 shadow-xl border-4 border-white dark:border-brand-navy-light relative z-10">
                    {currentUser?.name?.charAt(0)}
                    {currentUser?.role === UserRole.ADMIN && (
                      <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-brand-red rounded-full flex items-center justify-center border-4 border-white dark:border-brand-navy-light">
                        <Zap size={10} fill="currentColor" />
                      </div>
                    )}
                 </div>
                 <h5 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-tight">{currentUser?.name}</h5>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{currentUser?.email}</p>
                 <div className="mt-4 flex justify-center">
                    <span className="px-3 py-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-full text-[8px] font-black uppercase tracking-[0.2em] text-slate-500 shadow-sm">
                      {currentUser?.role}
                    </span>
                 </div>
              </div>
              <div className="p-3 space-y-1">
                <button onClick={() => { navigate('/settings'); setShowUserMenu(false); }} className="w-full flex items-center gap-4 p-4 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 hover:text-brand-navy dark:hover:text-white transition-all group btn-press">
                  <div className="p-2 bg-slate-100 dark:bg-white/10 rounded-xl text-slate-400 group-hover:bg-brand-navy dark:group-hover:bg-brand-accent group-hover:text-white transition-colors">
                    <Settings size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest">Configurações</p>
                    <p className="text-[8px] font-bold text-slate-300 dark:text-slate-500 uppercase">Preferências</p>
                  </div>
                </button>
                <button onClick={handleLogout} className="w-full flex items-center gap-4 p-4 rounded-2xl text-slate-500 dark:text-slate-400 hover:bg-red-50 dark:hover:bg-red-900/10 hover:text-brand-red transition-all group btn-press">
                  <div className="p-2 bg-slate-100 dark:bg-white/10 rounded-xl text-slate-400 group-hover:bg-brand-red group-hover:text-white transition-colors">
                    <LogOut size={16} />
                  </div>
                  <div className="text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest">Encerrar Sessão</p>
                    <p className="text-[8px] font-bold text-slate-300 dark:text-slate-500 uppercase">Logout Seguro</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
