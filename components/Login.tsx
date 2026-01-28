
import React, { useState, useEffect, useRef } from 'react';
import { userService } from '../services/userService';
import { 
  Lock, 
  User, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2,
  ShieldCheck,
  Cpu,
  Scan,
  Zap,
  Fingerprint,
  Loader2
} from 'lucide-react';
import Logo from './Logo';

// Hook para efeito de texto "Matrix/Decrypt"
const useScrambleText = (text: string, active: boolean) => {
  const [display, setDisplay] = useState(text);
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&";
  
  useEffect(() => {
    if (!active) return;
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((letter, index) => {
            if (index < iteration) return text[index];
            return chars[Math.floor(Math.random() * chars.length)];
          })
          .join("")
      );
      if (iteration >= text.length) clearInterval(interval);
      iteration += 1 / 3;
    }, 30);
    return () => clearInterval(interval);
  }, [text, active]);

  return display;
};

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loadingStep, setLoadingStep] = useState(0); // 0: Idle, 1: Scanning, 2: Verifying, 3: Success
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Textos animados
  const titleText = useScrambleText("GESLA OS", mounted);
  const subtitleText = useScrambleText("SECURE ACCESS PROTOCOL", mounted);

  useEffect(() => {
    setMounted(true);
    
    // Mouse move handler for 3D Tilt & Spotlight
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const { innerWidth, innerHeight } = window;
      const x = (e.clientX - innerWidth / 2) / 25; // Sensibilidade do Tilt X
      const y = (e.clientY - innerHeight / 2) / 25; // Sensibilidade do Tilt Y
      setMousePos({ x, y });
      
      // Update spotlight CSS variables
      containerRef.current.style.setProperty('--mouse-x', `${e.clientX}px`);
      containerRef.current.style.setProperty('--mouse-y', `${e.clientY}px`);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoadingStep(1); // Start Scanning

    // Sequência de Animação de Login "Absurda"
    
    // Etapa 1: Scan Biométrico (Simulado)
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoadingStep(2); // Verificando Credenciais

    // Etapa 2: Processamento
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Validação prévia para permitir animação de sucesso
    const isValid = userService.validateCredentials(username, password);
    
    if (!isValid) {
      setError('Acesso negado. Assinatura digital inválida.');
      setLoadingStep(0);
      // Ativa efeito de vibração (Glitch)
    } else {
      setLoadingStep(3); // Sucesso - Efeito de Explosão/Implosão
      
      // Aguarda animação de sucesso antes de alterar o estado global (que desmonta este componente)
      setTimeout(() => {
        userService.login(username, password);
        // Não usamos reload() aqui para manter o estado SPA e permitir a transição para BootScreen
      }, 1200);
    }
  };

  // Styles Injection for Advanced Keyframes that Tailwind doesn't cover easily
  const customStyles = `
    @property --angle {
      syntax: '<angle>';
      initial-value: 0deg;
      inherits: false;
    }
    @keyframes borderRotate {
      from { --angle: 0deg; }
      to { --angle: 360deg; }
    }
    .kinetic-border::after, .kinetic-border::before {
      content: '';
      position: absolute;
      inset: -2px;
      z-index: -1;
      background: conic-gradient(from var(--angle), transparent 70%, var(--color-brand-accent), transparent);
      border-radius: 2.5rem;
      animation: borderRotate 4s linear infinite;
    }
    .kinetic-border::before {
      filter: blur(20px);
      opacity: 0.5;
    }
    .scan-line {
      animation: scan 2s cubic-bezier(0.4, 0, 0.2, 1) infinite;
    }
    @keyframes scan {
      0% { top: 0%; opacity: 0; }
      10% { opacity: 1; }
      90% { opacity: 1; }
      100% { top: 100%; opacity: 0; }
    }
    .glitch-effect {
      animation: glitch 0.3s cubic-bezier(.25, .46, .45, .94) both infinite;
    }
    @keyframes glitch {
      0% { transform: translate(0) }
      20% { transform: translate(-2px, 2px) }
      40% { transform: translate(-2px, -2px) }
      60% { transform: translate(2px, 2px) }
      80% { transform: translate(2px, -2px) }
      100% { transform: translate(0) }
    }
  `;

  return (
    <div 
      ref={containerRef}
      className="min-h-screen w-full relative flex items-center justify-center overflow-hidden bg-[#020617] text-white selection:bg-brand-accent selection:text-black perspective-[1000px]"
    >
      <style>{customStyles}</style>

      {/* --- LAYER 1: DYNAMIC GRID BACKGROUND (SPOTLIGHT REVEAL) --- */}
      <div 
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(
              circle 600px at var(--mouse-x, 50%) var(--mouse-y, 50%), 
              rgba(var(--color-brand-accent), 0.15), 
              transparent 80%
            )
          `
        }}
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-50"></div>
      </div>

      {/* --- LAYER 2: AMBIENT ORBS --- */}
      <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] bg-brand-navy rounded-full blur-[150px] opacity-40 animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] bg-brand-accent rounded-full blur-[150px] opacity-20 animate-pulse-slow delay-1000"></div>

      {/* --- MAIN 3D CARD CONTAINER --- */}
      <div 
        className={`relative z-20 w-full max-w-[460px] p-2 transition-transform duration-100 ease-out ${loadingStep === 3 ? 'scale-110 opacity-0 blur-xl duration-700' : ''}`}
        style={{
          transform: `rotateX(${-mousePos.y}deg) rotateY(${mousePos.x}deg)`,
          transformStyle: 'preserve-3d'
        }}
      >
        
        {/* --- BRAND HEADER --- */}
        <div 
          className="mb-12 flex flex-col items-center" 
          style={{ transform: 'translateZ(50px)' }} // Parallax Depth
        >
          <div className="relative group cursor-pointer hover:scale-110 transition-transform duration-500">
             <div className="absolute inset-0 bg-brand-accent blur-[60px] opacity-30 group-hover:opacity-60 transition-opacity duration-500"></div>
             <Logo white size={140} className="drop-shadow-[0_0_25px_rgba(255,255,255,0.3)] relative z-10" />
             {/* Holographic Ring */}
             <div className="absolute inset-0 border border-white/20 rounded-full scale-150 opacity-0 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 rounded-[30%]"></div>
          </div>
          
          <div className="mt-6 text-center">
             <h1 className="text-5xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/50 drop-shadow-sm font-data">
                {titleText}
             </h1>
             <div className="flex items-center justify-center gap-3 mt-2 opacity-70">
                <div className="h-px w-8 bg-gradient-to-r from-transparent to-brand-accent"></div>
                <span className="text-[10px] font-bold tracking-[0.5em] text-brand-accent">{subtitleText}</span>
                <div className="h-px w-8 bg-gradient-to-l from-transparent to-brand-accent"></div>
             </div>
          </div>
        </div>

        {/* --- THE KINETIC GLASS CARD --- */}
        <div 
          className={`
            relative bg-[#0f172a]/60 backdrop-blur-3xl rounded-[2.5rem] 
            border border-white/10 shadow-2xl kinetic-border overflow-hidden
            ${error ? 'border-red-500/50 shadow-[0_0_50px_rgba(220,38,38,0.3)] glitch-effect' : ''}
          `}
          style={{ transform: 'translateZ(20px)' }}
        >
          
          {/* Scanning Beam (Active during loading) */}
          {loadingStep === 1 && (
            <div className="absolute left-0 right-0 h-1 bg-brand-accent/80 shadow-[0_0_20px_var(--color-brand-accent)] z-50 scan-line"></div>
          )}

          <div className="p-10 relative z-10">
             
             {/* Dynamic Noise Overlay */}
             <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none bg-repeat" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }}></div>

             <form onSubmit={handleSubmit} className="space-y-8">
                
                {/* Header Text */}
                <div className="flex justify-between items-end border-b border-white/5 pb-4">
                   <div>
                      <h3 className="text-xs font-black uppercase tracking-widest text-white mb-1">Identificação</h3>
                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Insira credenciais de nível 1</p>
                   </div>
                   <Fingerprint size={24} className={`text-slate-600 transition-colors duration-300 ${focusedField ? 'text-brand-accent animate-pulse' : ''}`} />
                </div>

                {/* USERNAME FIELD */}
                <div className="group relative">
                   <div className={`
                     absolute -inset-0.5 bg-gradient-to-r from-brand-accent to-purple-600 rounded-2xl opacity-0 
                     group-hover:opacity-50 transition-opacity duration-500 blur
                     ${focusedField === 'user' ? 'opacity-100 animate-pulse' : ''}
                   `}></div>
                   <div className="relative flex items-center bg-[#020617] rounded-2xl overflow-hidden border border-white/10 group-hover:border-white/20 transition-all">
                      <div className={`w-14 h-14 flex items-center justify-center border-r border-white/5 transition-colors ${focusedField === 'user' ? 'text-brand-accent bg-brand-accent/5' : 'text-slate-500'}`}>
                         <User size={20} />
                      </div>
                      <div className="flex-1 relative h-14">
                         <input 
                           type="text" 
                           required
                           disabled={loadingStep > 0}
                           value={username}
                           onChange={e => setUsername(e.target.value)}
                           onFocus={() => setFocusedField('user')}
                           onBlur={() => setFocusedField(null)}
                           className="peer w-full h-full bg-transparent text-white font-bold text-sm outline-none px-4 pt-4 pb-1 placeholder-transparent font-data tracking-wider z-10 relative"
                           placeholder="ID"
                           id="username"
                           autoComplete="off"
                         />
                         <label 
                           htmlFor="username"
                           className="absolute left-4 top-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest transition-all duration-300 pointer-events-none
                           peer-placeholder-shown:top-5 peer-placeholder-shown:text-xs peer-placeholder-shown:text-slate-500
                           peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:text-brand-accent
                           peer-valid:top-1.5 peer-valid:text-[8px] peer-valid:text-slate-400"
                         >
                           ID Operacional
                         </label>
                         {/* Typing Particles simulated by CSS glow on right side of input */}
                         <div className={`absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-brand-accent/20 to-transparent pointer-events-none transition-opacity duration-200 ${focusedField === 'user' && username.length > 0 ? 'opacity-100' : 'opacity-0'}`}></div>
                      </div>
                   </div>
                </div>

                {/* PASSWORD FIELD */}
                <div className="group relative">
                   <div className={`
                     absolute -inset-0.5 bg-gradient-to-r from-brand-accent to-purple-600 rounded-2xl opacity-0 
                     group-hover:opacity-50 transition-opacity duration-500 blur
                     ${focusedField === 'pass' ? 'opacity-100 animate-pulse' : ''}
                   `}></div>
                   <div className="relative flex items-center bg-[#020617] rounded-2xl overflow-hidden border border-white/10 group-hover:border-white/20 transition-all">
                      <div className={`w-14 h-14 flex items-center justify-center border-r border-white/5 transition-colors ${focusedField === 'pass' ? 'text-brand-accent bg-brand-accent/5' : 'text-slate-500'}`}>
                         <Lock size={20} />
                      </div>
                      <div className="flex-1 relative h-14">
                         <input 
                           type="password" 
                           required
                           disabled={loadingStep > 0}
                           value={password}
                           onChange={e => setPassword(e.target.value)}
                           onFocus={() => setFocusedField('pass')}
                           onBlur={() => setFocusedField(null)}
                           className="peer w-full h-full bg-transparent text-white font-bold text-sm outline-none px-4 pt-4 pb-1 placeholder-transparent font-data tracking-widest z-10 relative"
                           placeholder="Senha"
                           id="password"
                         />
                         <label 
                           htmlFor="password"
                           className="absolute left-4 top-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest transition-all duration-300 pointer-events-none
                           peer-placeholder-shown:top-5 peer-placeholder-shown:text-xs peer-placeholder-shown:text-slate-500
                           peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:text-brand-accent
                           peer-valid:top-1.5 peer-valid:text-[8px] peer-valid:text-slate-400"
                         >
                           Chave de Acesso
                         </label>
                      </div>
                   </div>
                </div>

                {/* ERROR CONSOLE */}
                <div className={`relative overflow-hidden transition-all duration-500 ease-out ${error ? 'max-h-24 opacity-100' : 'max-h-0 opacity-0'}`}>
                   <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex gap-3 backdrop-blur-md relative">
                      <div className="absolute inset-0 bg-red-500/5 animate-pulse"></div>
                      <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5 relative z-10" />
                      <div className="relative z-10">
                         <p className="text-[10px] font-black text-red-400 uppercase tracking-wide">Erro Crítico</p>
                         <p className="text-[9px] font-medium text-red-300/80 leading-tight mt-0.5 font-data">{error}</p>
                      </div>
                   </div>
                </div>

                {/* HYPER BUTTON */}
                <button 
                  type="submit"
                  disabled={loadingStep > 0}
                  className={`
                    w-full h-16 rounded-2xl relative overflow-hidden group transition-all duration-500 transform
                    ${loadingStep === 3 
                      ? 'bg-emerald-500 scale-100' 
                      : 'bg-[#020617] border border-white/10 hover:border-brand-accent/50 hover:scale-[1.02] active:scale-95'
                    }
                  `}
                >
                  {/* Button Content */}
                  <div className="relative z-10 flex items-center justify-center gap-3 h-full">
                    {loadingStep === 0 && (
                      <>
                        <div className="absolute inset-0 bg-brand-accent/0 group-hover:bg-brand-accent/10 transition-colors duration-300"></div>
                        <span className="text-[11px] font-black uppercase tracking-[0.3em] text-white group-hover:text-brand-accent transition-colors">Iniciar Sistema</span>
                        <div className="w-6 h-6 bg-white/5 rounded-lg flex items-center justify-center group-hover:translate-x-1 transition-transform group-hover:bg-brand-accent group-hover:text-white">
                           <ArrowRight size={14} />
                        </div>
                      </>
                    )}

                    {loadingStep === 1 && (
                      <div className="flex items-center gap-3 text-brand-accent animate-pulse">
                        <Scan size={20} className="animate-spin-slow" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Escaneando...</span>
                      </div>
                    )}

                    {loadingStep === 2 && (
                      <div className="flex items-center gap-3 text-white">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Verificando...</span>
                      </div>
                    )}

                    {loadingStep === 3 && (
                      <div className="flex items-center gap-3 text-white animate-in zoom-in duration-300">
                        <CheckCircle2 size={24} />
                        <span className="text-[12px] font-black uppercase tracking-[0.2em]">Acesso Permitido</span>
                      </div>
                    )}
                  </div>

                  {/* Button "Nuclear" Progress Bar Background */}
                  {loadingStep > 0 && loadingStep < 3 && (
                    <div className="absolute inset-0 bg-brand-accent/20 w-full h-full origin-left animate-[progress_2s_ease-in-out_infinite]"></div>
                  )}
                  
                  {/* Hover Shine */}
                  {loadingStep === 0 && (
                    <div className="absolute inset-0 w-[200%] h-full bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-[150%] group-hover:animate-shine pointer-events-none"></div>
                  )}
                </button>

             </form>
          </div>
        </div>

        {/* --- FOOTER HUD --- */}
        <div 
          className="mt-12 flex items-center justify-between w-full px-4 opacity-50 hover:opacity-100 transition-opacity duration-500"
          style={{ transform: 'translateZ(30px)' }}
        >
           <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-emerald-500">
                 <ShieldCheck size={12} />
                 <span className="text-[9px] font-black uppercase tracking-widest">Secure Connection</span>
              </div>
              <span className="text-[8px] font-mono text-slate-500">TLS 1.3 / AES-256</span>
           </div>

           <div className="flex items-center gap-3">
              <Cpu size={14} className="text-slate-500" />
              <div className="h-px w-10 bg-white/10"></div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Gesla v2.6</span>
           </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
