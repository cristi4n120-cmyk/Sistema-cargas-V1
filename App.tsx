import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import Dashboard from './components/Dashboard';
import LoadList from './components/LoadList';
import LoadForm from './components/LoadForm';
import LoadArchive from './components/LoadArchive';
import UserManagement from './components/UserManagement';
import CarrierManagement from './components/CarrierManagement';
import ClientManagement from './components/ClientManagement';
import MaterialManagement from './components/MaterialManagement';
import Settings from './components/Settings';
import Login from './components/Login';
import { userService } from './services/userService';
import { settingsService } from './services/settingsService';
import Logo from './components/Logo';
import { Cpu, Server, Lock, Wifi } from 'lucide-react';

// --- SISTEMA DE BOOT AVANÇADO ---
const BootScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [isExiting, setIsExiting] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);
  
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; }, [onComplete]);

  const systemLogs = [
    "INITIALIZING KERNEL...",
    "MOUNTING VIRTUAL FILE SYSTEM (VFS)...",
    "ALLOCATING MEMORY BLOCKS [0x0000 - 0xFFFF]...",
    "VERIFYING SECURITY HANDSHAKE...",
    "LOADING LOGICONTROL CORE MODULES...",
    "CONNECTING TO SECURE DATA STREAM...",
    "DECRYPTING USER PROTOCOLS...",
    "SYNCHRONIZING FISCAL PARAMETERS (DIFAL/ICMS)...",
    "OPTIMIZING LOGISTICAL ROUTES...",
    "ESTABLISHING SATELLITE UPLINK...",
    "CHECKING INTEGRITY CHECKSUMS...",
    "STARTING INTERFACE ENGINE...",
    "SYSTEM READY."
  ];

  useEffect(() => {
    let logIndex = 0;
    setLogs([`> ${systemLogs[0]}`]);

    const interval = setInterval(() => {
      setProgress(prev => {
        const increment = Math.random() * (prev > 80 ? 2 : 5); 
        const next = Math.min(prev + increment, 100);
        
        const totalLogs = systemLogs.length;
        const targetLogIndex = Math.floor((next / 100) * totalLogs);
        
        if (targetLogIndex > logIndex && targetLogIndex < totalLogs) {
          logIndex = targetLogIndex;
          const timestamp = new Date().toISOString().split('T')[1].slice(0,8);
          setLogs(prevLogs => [...prevLogs.slice(-5), `[${timestamp}] ${systemLogs[logIndex]}`]);
        }

        if (next >= 100) {
          clearInterval(interval);
          setLogs(prevLogs => [...prevLogs, `> ACCESS GRANTED.`]);
          setTimeout(() => {
            setIsExiting(true);
            setTimeout(() => {
                if (onCompleteRef.current) onCompleteRef.current();
            }, 800);
          }, 500);
          return 100;
        }
        return next;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div className={`fixed inset-0 z-[9999] bg-[#020617] flex flex-col items-center justify-center overflow-hidden transition-all duration-1000 ease-in-out cursor-wait ${isExiting ? 'opacity-0 scale-110 filter blur-xl' : 'opacity-100 scale-100'}`}>
      
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute inset-0 opacity-[0.1] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
        <div className="absolute inset-0 bg-radial-gradient from-transparent to-[#020617] opacity-90"></div>
      </div>

      <div className="relative z-30 flex flex-col items-center">
        <div className="relative w-64 h-64 flex items-center justify-center mb-12">
           <div className="absolute inset-0 rounded-full border border-slate-800 border-t-brand-accent/50 border-b-brand-accent/50 animate-[spin_4s_linear_infinite_reverse] opacity-40"></div>
           <div className="absolute inset-4 rounded-full border-2 border-transparent border-l-brand-accent border-r-brand-accent animate-[spin_2s_linear_infinite] shadow-[0_0_15px_var(--color-brand-accent)]"></div>
           <div className="absolute inset-0 rounded-full border border-white/5 animate-pulse"></div>
           <div className={`relative z-10 transition-all duration-300 ${progress > 90 ? 'scale-110 drop-shadow-[0_0_30px_rgba(var(--color-brand-accent),0.8)]' : 'scale-100'}`}>
              <Logo white size={100} variant="icon" />
           </div>
           {progress >= 100 && (
             <div className="absolute inset-0 bg-brand-accent/20 mix-blend-overlay animate-ping rounded-full"></div>
           )}
        </div>

        <div className="w-[300px] space-y-4 relative z-40">
           <div className="flex justify-between items-end px-1">
              <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] flex items-center gap-2 animate-pulse">
                <Cpu size={12} />
                Processing
              </span>
              <span className="text-4xl font-black text-white font-data tracking-tighter tabular-nums">
                {Math.floor(progress).toString().padStart(3, '0')}<span className="text-sm text-slate-500 ml-1">%</span>
              </span>
           </div>
           
           <div className="h-1 w-full bg-slate-800 relative overflow-hidden rounded-full">
              <div 
                className="h-full bg-gradient-to-r from-transparent via-brand-accent to-white shadow-[0_0_20px_2px_rgba(var(--color-brand-accent),0.5)] transition-all duration-75 ease-out relative rounded-full" 
                style={{ width: `${progress}%` }}
              >
              </div>
           </div>

           <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase tracking-widest font-data">
              <span className="flex items-center gap-1"><Server size={10} /> Node: GSL-01</span>
              <span className="flex items-center gap-1"><Lock size={10} /> Encr: AES-256</span>
              <span className="flex items-center gap-1"><Wifi size={10} /> Latency: 12ms</span>
           </div>

           <div className="mt-8 h-24 w-full bg-black/40 border border-white/10 rounded-xl p-3 overflow-hidden relative font-data">
              <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black/20 to-transparent pointer-events-none"></div>
              <div className="flex flex-col justify-end h-full">
                 {logs.map((log, i) => (
                   <div key={i} className={`text-[9px] font-bold truncate leading-relaxed ${i === logs.length - 1 ? 'text-brand-accent animate-pulse' : 'text-slate-500'}`}>
                     {log}
                   </div>
                 ))}
                 <div ref={logsEndRef} />
              </div>
              <div className="absolute inset-0 bg-[linear-gradient(transparent_50%,rgba(0,0,0,0.5)_50%)] bg-[size:100%_4px] pointer-events-none opacity-50"></div>
           </div>
        </div>
      </div>

      <div className="absolute bottom-8 text-[8px] font-black text-slate-700 uppercase tracking-[0.5em]">
        LogiControl Pro v2.6.0
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(userService.isAuthenticated());
  const [isBooting, setIsBooting] = useState(false);
  const [hasBooted, setHasBooted] = useState(false);

  const checkAuth = useCallback(() => {
    const auth = userService.isAuthenticated();
    if (auth && !isAuthenticated && !hasBooted && !isBooting) {
      setIsBooting(true);
    }
    setIsAuthenticated(auth);
  }, [isAuthenticated, hasBooted, isBooting]);

  useEffect(() => {
    const applyTheme = () => {
      const settings = settingsService.getSettings();
      if (settings.darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    };
    applyTheme();
    window.addEventListener('settingsChanged', applyTheme);
    return () => window.removeEventListener('settingsChanged', applyTheme);
  }, []);

  useEffect(() => {
    window.addEventListener('authUpdate', checkAuth);
    window.addEventListener('storage', checkAuth);
    return () => {
      window.removeEventListener('authUpdate', checkAuth);
      window.removeEventListener('storage', checkAuth);
    };
  }, [checkAuth]);

  const handleBootComplete = useCallback(() => {
    setIsBooting(false);
    setHasBooted(true);
  }, []);

  if (!isAuthenticated) return <Login />;
  if (isBooting) return <BootScreen onComplete={handleBootComplete} />;

  return (
    <Router>
      <div className="flex min-h-screen bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white font-sans selection:bg-brand-accent selection:text-white relative overflow-hidden transition-colors duration-500">
        
        {/* --- GLOBAL ATMOSPHERE LAYERS (PERSISTENT & THEME AWARE) --- */}
        <div className="fixed inset-0 pointer-events-none z-0">
           {/* Scanline Texture Overlay (Tactical Feel) */}
           <div className="absolute inset-0 opacity-[0.02] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-20 bg-[length:100%_4px,3px_100%] pointer-events-none mix-blend-overlay"></div>

           {/* Moving Grid - Subtle in Light Mode, Visible in Dark */}
           <div className="absolute inset-0 bg-grid-pattern bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_70%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-[0.03] dark:opacity-20 transition-opacity duration-500"></div>
           
           {/* Ambient Orbs - Colored in Dark, Subtle Gray in Light */}
           <div className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full blur-[150px] bg-slate-300/30 dark:bg-brand-navy/60 transition-colors duration-700 animate-pulse-slow"></div>
           <div className="absolute bottom-[-20%] right-[-10%] w-[60vw] h-[60vw] rounded-full blur-[180px] bg-slate-200/40 dark:bg-brand-accent/10 transition-colors duration-700 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        </div>

        <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        
        {/* Main Content Wrapper */}
        <main className="flex-1 lg:ml-[90px] min-h-screen flex flex-col relative z-10 transition-all duration-500">
          <TopBar onOpenSidebar={() => setIsSidebarOpen(true)} />
          <div className="p-4 lg:p-8 w-full flex-1 overflow-x-hidden">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/loads" element={<LoadList />} />
              <Route path="/loads/history" element={<LoadArchive />} />
              <Route path="/loads/new" element={<LoadForm />} />
              <Route path="/loads/edit/:id" element={<LoadForm />} />
              <Route path="/carriers" element={<CarrierManagement />} />
              <Route path="/clients" element={<ClientManagement />} />
              <Route path="/materials" element={<MaterialManagement />} />
              <Route path="/users" element={<UserManagement />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
          
          <footer className="py-6 px-8 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row items-center justify-between gap-4 bg-white/50 dark:bg-[#020617]/50 backdrop-blur-md transition-all duration-500 mt-auto">
             <div className="flex items-center gap-4 opacity-40 hover:opacity-100 transition-opacity cursor-default group">
                <Logo size={30} variant="icon" className="grayscale group-hover:grayscale-0 transition-all duration-500" />
                <div className="h-3 w-px bg-slate-300 dark:bg-white/20"></div>
                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500">LogiControl System</span>
             </div>
             <p className="text-[8px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-[0.3em] font-data">
               SECURE CONNECTION • ENCRYPTED
             </p>
          </footer>
        </main>
      </div>
    </Router>
  );
};

export default App;