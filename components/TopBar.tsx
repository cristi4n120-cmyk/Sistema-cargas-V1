import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Menu, Bell, Sun, Moon
} from 'lucide-react';
import { userService } from '../services/userService';
import { notificationService } from '../services/notificationService';
import { settingsService } from '../services/settingsService';
import { Notification } from '../types';

interface TopBarProps {
  onOpenSidebar: () => void;
}

const TopBar: React.FC<TopBarProps> = ({ onOpenSidebar }) => {
  const navigate = useNavigate();
  const currentUser = userService.getCurrentUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isDark, setIsDark] = useState(settingsService.getSettings().darkMode);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadData = () => {
      setNotifications(notificationService.getNotifications());
      setIsDark(settingsService.getSettings().darkMode);
    };
    loadData();

    const handleNotifChange = () => setNotifications(notificationService.getNotifications());
    const handleSettingsChange = () => setIsDark(settingsService.getSettings().darkMode);

    window.addEventListener('notificationsChanged', handleNotifChange);
    window.addEventListener('settingsChanged', handleSettingsChange);
    
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('notificationsChanged', handleNotifChange);
      window.removeEventListener('settingsChanged', handleSettingsChange);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadCount = notifications.filter(n => !n.read).length;

  const toggleTheme = () => {
    const current = settingsService.getSettings();
    settingsService.saveSettings({ ...current, darkMode: !current.darkMode });
  };

  const markAllRead = () => {
    notificationService.markAllAsRead();
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/5 h-20 px-4 lg:px-8 flex items-center justify-between transition-colors duration-500">
      
      <div className="flex items-center gap-4">
        <button 
          onClick={onOpenSidebar}
          className="lg:hidden p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/10 rounded-xl transition-all"
        >
          <Menu size={24} />
        </button>
        
        <div className="hidden md:flex flex-col">
           <h2 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest">
             {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long' })}
           </h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
             Bem-vindo, {currentUser.name.split(' ')[0]}
           </p>
        </div>
      </div>

      <div className="flex items-center gap-3 lg:gap-6">
        
        <button 
          onClick={toggleTheme}
          className="p-3 text-slate-400 hover:text-brand-accent hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-all"
          title="Alternar Tema"
        >
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>

        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className={`
              p-3 rounded-xl transition-all relative
              ${showNotifications 
                ? 'bg-brand-navy/5 dark:bg-white/10 text-brand-navy dark:text-white' 
                : 'text-slate-400 hover:text-brand-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
              }
            `}
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#020617]"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-4 w-80 md:w-96 bg-white dark:bg-[#1e293b] rounded-[2rem] shadow-premium border border-slate-100 dark:border-white/10 overflow-hidden animate-in zoom-in-95 origin-top-right">
               <div className="p-5 border-b border-slate-100 dark:border-white/5 flex justify-between items-center">
                  <h4 className="text-xs font-black text-brand-navy dark:text-white uppercase tracking-widest">Notificações</h4>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[9px] font-bold text-brand-accent hover:text-brand-navy dark:hover:text-white uppercase tracking-wide">
                       Marcar lidas
                    </button>
                  )}
               </div>
               <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                       Nenhuma notificação
                    </div>
                  ) : (
                    notifications.map(n => (
                       <div key={n.id} className={`p-4 border-b border-slate-50 dark:border-white/5 last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors ${!n.read ? 'bg-brand-accent/5' : ''}`}>
                          <div className="flex gap-3">
                             <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${!n.read ? 'bg-brand-accent' : 'bg-slate-300 dark:bg-white/20'}`}></div>
                             <div>
                                <p className="text-[10px] font-black text-brand-navy dark:text-white uppercase tracking-tight mb-1">{n.title}</p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">{n.description}</p>
                                <span className="text-[8px] font-bold text-slate-400 mt-2 block">{n.time}</span>
                             </div>
                          </div>
                       </div>
                    ))
                  )}
               </div>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-3 pl-3 border-l border-slate-200 dark:border-white/10">
           <div className="text-right hidden lg:block">
              <p className="text-[10px] font-black text-brand-navy dark:text-white uppercase tracking-widest">{currentUser.name}</p>
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">{currentUser.role}</p>
           </div>
           <div className="w-10 h-10 rounded-xl bg-brand-navy dark:bg-white text-white dark:text-brand-navy flex items-center justify-center font-black text-sm">
              {currentUser.name.charAt(0)}
           </div>
        </div>

      </div>
    </header>
  );
};

export default TopBar;