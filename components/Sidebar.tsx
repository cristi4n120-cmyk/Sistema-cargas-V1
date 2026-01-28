
import React, { useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { Link, useLocation } = ReactRouterDOM;
import { 
  LogOut, 
  Settings, 
  ChevronRight,
  ShieldCheck,
  MoreVertical,
  Activity,
  Zap
} from 'lucide-react';
import { NAVIGATION_GROUPS } from '../constants';
import { userService } from '../services/userService';
import { UserRole } from '../types';
import Logo from './Logo';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const currentUser = userService.getCurrentUser();
  const isAdmin = currentUser.role === UserRole.ADMIN;
  const [isHovered, setIsHovered] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Mouse Tracking for "Liquid Light" Effect
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setMousePos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleLogout = (e: React.MouseEvent) => {
    e.preventDefault();
    userService.logout();
  };

  const isExpanded = isOpen || isHovered;

  return (
    <>
      {/* MOBILE BACKDROP - Kinetic Blur */}
      <div 
        className={`fixed inset-0 bg-[#020617]/60 backdrop-blur-md z-[60] lg:hidden transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose} 
      />
      
      {/* SIDEBAR MONOLITH */}
      <aside 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          fixed left-0 top-0 h-screen 
          bg-[#020617] 
          border-r border-white/5 
          flex flex-col z-[70] 
          transition-[width,transform,box-shadow] duration-700 cubic-bezier(0.16, 1, 0.3, 1)
          shadow-[20px_0_80px_-20px_rgba(0,0,0,0.8)]
          group/sidebar
          overflow-hidden
          perspective-[2000px]
          animate-sidebar-deploy
          ${isOpen ? 'translate-x-0 w-[280px]' : 'lg:translate-x-0 -translate-x-full lg:w-[90px]'} 
          ${isHovered ? 'lg:!w-[280px] shadow-[40px_0_100px_-20px_rgba(var(--color-brand-accent),0.15)]' : ''}
        `}
      >
        {/* --- ATMOSPHERE LAYERS (Dynamic Spotlight) --- */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-40 transition-opacity duration-500 group-hover/sidebar:opacity-100 mix-blend-soft-light"
          style={{
            background: `radial-gradient(circle 400px at ${mousePos.x}px ${mousePos.y}px, rgba(255,255,255,0.08), transparent 80%)`
          }}
        />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPgo8cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDIiLz4KPC9zdmc+')] opacity-20 pointer-events-none"></div>

        {/* --- BRAND HEADER --- */}
        <div className="relative pt-10 pb-8 shrink-0 overflow-hidden z-20">
          <div className={`absolute top-[-40px] left-1/2 -translate-x-1/2 w-48 h-48 bg-brand-accent/20 blur-[80px] pointer-events-none transition-all duration-1000 ${isExpanded ? 'opacity-100 scale-125' : 'opacity-40 scale-75'}`}></div>
          
          <Link to="/" onClick={onClose} className="block relative z-10 px-0 outline-none group/logo">
            <div className={`flex items-center transition-all duration-500 ${isExpanded ? 'justify-start pl-8 gap-5' : 'justify-center'}`}>
              
              {/* Logo Icon with Holographic Pulse */}
              <div className="relative shrink-0 transition-transform duration-500 group-hover/logo:scale-110 group-active/logo:scale-95 group-hover/logo:rotate-3">
                 <div className="absolute inset-0 bg-brand-accent rounded-full blur-xl opacity-0 group-hover/logo:opacity-50 transition-opacity duration-500 animate-pulse"></div>
                 <div className="relative z-10 text-white filter drop-shadow-[0_0_15px_rgba(255,255,255,0.3)]">
                    <Logo variant="icon" size={40} white />
                 </div>
              </div>

              {/* Text Reveal with Glitch Effect */}
              <div className={`flex flex-col overflow-hidden whitespace-nowrap transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] origin-left ${isExpanded ? 'w-auto opacity-100 translate-x-0' : 'w-0 opacity-0 -translate-x-8 blur-sm'}`}>
                <h1 className="text-xl font-black text-white tracking-tighter leading-none relative group-hover/logo:text-transparent group-hover/logo:bg-clip-text group-hover/logo:bg-gradient-to-r group-hover/logo:from-white group-hover/logo:to-brand-accent transition-all duration-300">
                  LOGICONTROL
                  <span className="absolute -top-0.5 -right-2 w-1.5 h-1.5 bg-brand-accent rounded-full animate-ping shadow-[0_0_8px_rgba(var(--color-brand-accent),0.8)]"></span>
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="h-px w-0 group-hover/logo:w-6 transition-all duration-500 bg-gradient-to-r from-brand-accent to-transparent"></span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em] font-data group-hover/logo:text-white transition-colors delay-75">LogiControl Pro</span>
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* --- NAVIGATION SCROLL AREA --- */}
        <nav className="flex-1 overflow-y-auto scrollbar-none py-6 px-4 space-y-8 relative z-20 mask-image-b-fade">
          {NAVIGATION_GROUPS.map((group, groupIdx) => {
            if (group.label === 'Administração' && !isAdmin) return null;
            
            return (
              <div key={group.label} className="space-y-3" style={{ animationDelay: `${groupIdx * 100}ms` }}>
                {/* Group Label Reveal */}
                <div className={`px-4 flex items-center transition-all duration-500 delay-100 ${isExpanded ? 'opacity-100 h-auto mb-2 translate-y-0' : 'opacity-0 h-0 overflow-hidden mb-0 -translate-y-2'}`}>
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] group-hover/sidebar:text-brand-accent transition-colors duration-500">{group.label}</span>
                  <div className="ml-3 h-px flex-1 bg-gradient-to-r from-white/5 via-white/10 to-transparent"></div>
                </div>

                <div className="space-y-1.5">
                  {group.items.map((item, itemIdx) => {
                    const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
                    const totalDelay = (groupIdx * 3 + itemIdx) * 50; // Millisecond delay
                    
                    return (
                      <Link
                        key={item.name}
                        to={item.path}
                        onClick={() => onClose()}
                        className={`
                          relative flex items-center min-h-[56px] px-3 rounded-2xl overflow-hidden outline-none group/item
                          transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
                          ${isActive 
                            ? 'text-white shadow-[0_0_30px_-5px_rgba(var(--color-brand-accent),0.3)]' 
                            : 'text-slate-400 hover:text-white'
                          }
                          ${isExpanded ? 'justify-start' : 'justify-center'}
                          animate-enter opacity-0
                        `}
                        style={{ animationDelay: `${totalDelay}ms`, animationFillMode: 'forwards' }}
                      >
                        {/* --- INTERACTIVE BACKGROUNDS --- */}
                        
                        {/* Active: "Deep Core" Glow */}
                        <div className={`absolute inset-0 transition-opacity duration-500 rounded-2xl ${
                          isActive 
                            ? 'bg-gradient-to-r from-brand-accent/20 via-brand-accent/5 to-transparent opacity-100 border border-brand-accent/30' 
                            : 'opacity-0'
                        }`} />

                        {/* Hover: "Cyber Slash" Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity duration-300 transform -skew-x-12 translate-x-[-100%] group-hover/item:translate-x-0 ease-out"></div>

                        {/* Active: "Scanline" Animation */}
                        {isActive && (
                          <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
                             <div className="absolute left-0 right-0 h-[2px] bg-brand-accent/50 shadow-[0_0_10px_#fff] animate-scan-vertical"></div>
                          </div>
                        )}
                        
                        {/* Active Indicator Bar */}
                        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-1 h-0 bg-brand-accent rounded-r-full transition-all duration-500 ease-out ${
                          isActive ? 'h-8 opacity-100 shadow-[0_0_15px_var(--color-brand-accent)]' : 'h-0 opacity-0 group-hover/item:h-4 group-hover/item:opacity-50'
                        }`}></div>

                        {/* Content Container */}
                        <div className={`flex items-center gap-4 relative z-10 transition-all duration-500 ${isExpanded ? 'w-full px-2' : 'justify-center w-full'}`}>
                          
                          {/* Icon with Pop Effect */}
                          <span className={`transition-all duration-300 transform group-hover/item:scale-110 group-active/item:scale-95 ${
                            isActive ? 'text-brand-accent drop-shadow-[0_0_12px_rgba(var(--color-brand-accent),0.8)]' : 'group-hover/item:text-white'
                          }`}>
                            {React.cloneElement(item.icon as React.ReactElement<any>, { 
                              size: 22, 
                              strokeWidth: isActive ? 2.5 : 2
                            })}
                          </span>
                          
                          {/* Text Reveal */}
                          <span className={`text-[11px] font-black uppercase tracking-widest transition-all duration-500 whitespace-nowrap origin-left ${
                            isExpanded 
                              ? 'opacity-100 translate-x-0 blur-0 group-hover/item:translate-x-1' 
                              : 'opacity-0 translate-x-8 blur-md w-0 hidden'
                          }`}>
                            {item.name}
                          </span>

                          {/* Arrow */}
                          {isExpanded && (
                            <ChevronRight size={14} className={`ml-auto transition-all duration-300 text-slate-600 ${
                              isActive ? 'opacity-100 translate-x-0 text-brand-accent' : 'opacity-0 -translate-x-4 group-hover/item:opacity-100 group-hover/item:translate-x-0'
                            }`} />
                          )}
                        </div>

                        {/* Collapsed Tooltip (Float) */}
                        {!isExpanded && !isOpen && (
                          <div className="absolute left-[calc(100%+20px)] top-1/2 -translate-y-1/2 bg-[#020617]/90 border border-white/20 text-white text-[10px] font-black uppercase tracking-widest px-4 py-3 rounded-xl opacity-0 group-hover/item:opacity-100 transition-all duration-300 pointer-events-none shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50 whitespace-nowrap scale-90 group-hover/item:scale-100 origin-left translate-x-4 group-hover/item:translate-x-0 backdrop-blur-xl">
                            {item.name}
                            <div className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-[#020617] border-l border-b border-white/20 rotate-45"></div>
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </nav>

        {/* --- USER FOOTER (Magnetic) --- */}
        <div className="p-4 mt-auto relative z-20 animate-enter" style={{ animationDelay: '500ms' }}>
          <div className={`
            relative overflow-hidden rounded-[2.5rem] transition-all duration-500 border group/profile cursor-pointer
            ${isExpanded 
              ? 'bg-gradient-to-br from-white/[0.03] to-transparent backdrop-blur-xl border-white/10 p-5 shadow-lg hover:border-brand-accent/30 hover:shadow-[0_0_30px_-5px_rgba(var(--color-brand-accent),0.1)]' 
              : 'bg-transparent border-transparent p-0 hover:bg-white/5 rounded-2xl'
            }
          `}>
            
            <div className="absolute inset-0 bg-gradient-to-br from-brand-accent/10 to-transparent opacity-0 group-hover/profile:opacity-100 transition-opacity duration-700 pointer-events-none"></div>

            <div className={`flex items-center ${isExpanded ? 'gap-4' : 'justify-center py-2'}`}>
              
              {/* Avatar with Energy Ring */}
              <div className="relative shrink-0 group-hover/profile:scale-105 transition-transform duration-500">
                <div className="absolute inset-0 bg-brand-accent rounded-2xl blur-md opacity-0 group-hover/profile:opacity-40 transition-opacity duration-500"></div>
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-2xl transition-all duration-500 relative z-10 overflow-hidden ${
                  isAdmin 
                    ? 'bg-gradient-to-br from-brand-navy-light to-black border border-white/10' 
                    : 'bg-slate-800 border border-white/5'
                }`}>
                  {currentUser?.name?.charAt(0)}
                  {/* Internal Shine */}
                  <div className="absolute inset-0 bg-gradient-to-tr from-white/20 to-transparent opacity-0 group-hover/profile:opacity-100 transition-opacity duration-500"></div>
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#020617] rounded-full flex items-center justify-center z-20">
                   <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping absolute opacity-75"></div>
                   <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full relative shadow-[0_0_10px_rgba(16,185,129,1)]"></div>
                </div>
              </div>
              
              {/* User Details Slide-in */}
              <div className={`flex flex-col overflow-hidden transition-all duration-500 relative z-10 ${isExpanded ? 'opacity-100 w-auto translate-x-0' : 'opacity-0 w-0 -translate-x-8 absolute'}`}>
                <h4 className="text-[12px] font-black text-white uppercase tracking-tight truncate leading-tight group-hover/profile:text-brand-accent transition-colors">
                  {currentUser?.name?.split(' ')[0]}
                </h4>
                <div className="flex items-center gap-1.5 mt-1">
                  <ShieldCheck size={12} className="text-slate-500 shrink-0 group-hover/profile:text-brand-accent transition-colors" />
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest truncate">
                    {currentUser?.role === UserRole.ADMIN ? 'System Admin' : 'Operator'}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div className="ml-auto opacity-50 group-hover/profile:opacity-100 transition-all duration-300 transform group-hover/profile:rotate-90">
                  <MoreVertical size={18} className="text-slate-400 hover:text-white transition-colors" />
                </div>
              )}
            </div>

            {/* Expander Menu with Slide Down */}
            <div className={`
              grid grid-cols-2 gap-2 overflow-hidden transition-all duration-700 ease-[cubic-bezier(0.19,1,0.22,1)] relative z-10
              ${isExpanded ? 'mt-5 pt-5 border-t border-white/5 max-h-32 opacity-100 scale-100' : 'max-h-0 opacity-0 border-none mt-0 pt-0 scale-95'}
            `}>
               <Link 
                 to="/settings" 
                 onClick={onClose}
                 className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 text-[9px] font-black uppercase tracking-wider text-slate-400 hover:text-white transition-all group/btn active:scale-95"
               >
                  <Settings size={16} className="group-hover/btn:rotate-90 transition-transform duration-500 text-brand-accent" />
                  Config
               </Link>
               <button 
                onClick={handleLogout}
                className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/10 hover:border-red-500/30 text-[9px] font-black uppercase tracking-wider text-red-400 hover:text-red-200 transition-all group/btn active:scale-95"
               >
                  <LogOut size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                  Sair
               </button>
            </div>
          </div>
        </div>

        {/* BOTTOM ENERGY LINE */}
        <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-brand-accent/50 to-transparent opacity-30 relative z-20">
           <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[2px] w-2/3 bg-brand-accent blur-[4px] animate-pulse"></div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
