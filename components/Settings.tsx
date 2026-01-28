
import React, { useState, useEffect } from 'react';
import { 
  Building2, Scale, Truck, Globe, Save, RefreshCcw, 
  Mail, CheckCircle2, Database, Bell, Terminal, Activity, 
  Zap, Fingerprint, Layers, FileCheck, ToggleLeft, ToggleRight, 
  MonitorSmartphone, CloudLightning, History, MessageCircle, Smartphone, Moon, Sun,
  Wand2, Shield, Sparkles, AlertTriangle, Lock, ShieldCheck, RefreshCw, Filter, List,
  Edit3, Eye, MessageSquare, PlayCircle
} from 'lucide-react';
import { settingsService } from '../services/settingsService';
import { notificationFormatter } from '../services/notificationFormatter';
import { SystemSettings, ShippingType, SystemEventType, Load, LoadStatus, ClientType } from '../types';
import { UFS, TAX_DEFAULTS } from '../constants';
import { maskPhone } from '../utils/formatters';
import WebhookLogs from './WebhookLogs'; // Importação dos Logs

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'geral' | 'fiscal' | 'logistica' | 'api' | 'seguranca'>('geral');
  const [settings, setSettings] = useState<SystemSettings>(settingsService.getSettings());
  const [isSaving, setIsSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mounted, setMounted] = useState(false);
  
  // State para o Editor de Templates
  const [selectedTemplateEvent, setSelectedTemplateEvent] = useState<SystemEventType | null>(null);
  const [previewLoad] = useState<Load>({
    id: 'preview',
    portCode: 'GSL-26-001',
    status: LoadStatus.DISPATCHED,
    client: 'EMPRESA EXEMPLO S/A',
    destinationCity: 'CURITIBA',
    destinationUF: 'PR',
    carrier: 'RODONAVES',
    financial: {
        freightValue: 2500,
        customerFreightValue: 4800,
        extraCosts: 0,
        invoiceValue: 50000,
        currency: 'BRL',
        tollValue: 0
    },
    hasDifal: true,
    active: true,
    createdBy: '1',
    date: new Date().toISOString(),
    clientType: ClientType.CONTRIBUTOR,
    deliveries: [],
    vehicle: { type: 'Truck' },
    history: [],
    items: [],
    movementType: 'Venda' as any,
    canComplement: false,
    paymentType: 'Faturado' as any,
    shippingType: ShippingType.CIF,
    updatedAt: new Date().toISOString()
  });

  // Trigger para animações de entrada
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    // Simula tempo de processamento "mágico" com feedback tátil visual
    setTimeout(() => {
      settingsService.saveSettings(settings);
      setIsSaving(false);
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    }, 1200);
  };

  const toggleSetting = (key: keyof SystemSettings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // --- WEBHOOK HELPERS ---
  const toggleWebhookEvent = (event: SystemEventType) => {
    const currentEvents = settings.webhookConfig.events || [];
    const newEvents = currentEvents.includes(event)
      ? currentEvents.filter(e => e !== event)
      : [...currentEvents, event];
    
    setSettings(prev => ({
      ...prev,
      webhookConfig: { ...prev.webhookConfig, events: newEvents }
    }));
  };

  // --- LÓGICA DE PADRONIZAÇÃO DIFAL ---
  const calculateStandardDifal = () => {
    const newRates = { ...settings.difalRates };
    
    UFS.forEach(uf => {
      if (uf === TAX_DEFAULTS.ORIGIN) {
        newRates[uf] = 0;
        return;
      }

      // Regra: Origem PR (Sul/Sudeste para Sul/Sudeste = 12%, para Outros = 7%)
      // Exceção: ES é Sudeste mas entra na regra de 7%
      const isSouthSoutheast = ['RS', 'SC', 'PR', 'SP', 'MG', 'RJ'].includes(uf);
      const interstateRate = isSouthSoutheast ? TAX_DEFAULTS.INTERSTATE.SOUTH_SOUTHEAST : TAX_DEFAULTS.INTERSTATE.OTHERS;
      
      const internalRate = TAX_DEFAULTS.INTERNAL_RATES[uf] || 18; // Fallback 18%
      
      // Cálculo DIFAL: Interna - Interestadual
      const calculated = Math.max(0, internalRate - interstateRate);
      
      // Arredonda para 2 casas se necessário, mas geralmente é inteiro ou .5
      newRates[uf] = parseFloat(calculated.toFixed(2));
    });

    setSettings(prev => ({ ...prev, difalRates: newRates }));
  };

  // --- ANIMAÇÕES CSS INJETADAS (PERFORMANCE NATIVA) ---
  const customStyles = `
    @keyframes slideUpSmooth {
      0% { opacity: 0; transform: translateY(20px) scale(0.98); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
    @keyframes widthGrow {
      0% { width: 0%; }
      100% { width: var(--target-width); }
    }
    @keyframes pulseSoft {
      0%, 100% { box-shadow: 0 0 0 0 rgba(var(--color-brand-accent), 0); }
      50% { box-shadow: 0 0 15px 0 rgba(var(--color-brand-accent), 0.3); }
    }
    @keyframes shimmer {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }
    .animate-entry { animation: slideUpSmooth 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards; opacity: 0; }
    .delay-1 { animation-delay: 0.1s; }
    .delay-2 { animation-delay: 0.2s; }
    .delay-3 { animation-delay: 0.3s; }
    .delay-4 { animation-delay: 0.4s; }
    
    .mana-bar { animation: widthGrow 1.5s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
    
    .toggle-knob { transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
    
    .btn-shimmer {
      background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
      background-size: 200% 100%;
      animation: shimmer 3s infinite linear;
    }
  `;

  // --- SUB-COMPONENTES VISUAIS (Wizard Kit v2) ---

  const SectionHeader = ({ title, subtitle, icon: Icon }: any) => (
    <div className="flex items-center gap-5 mb-8 pb-6 border-b border-slate-100 dark:border-white/5 relative overflow-hidden group">
      <div className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-brand-accent to-transparent transition-all duration-1000 group-hover:w-full"></div>
      <div className="absolute bottom-0 left-0 w-16 h-0.5 bg-slate-200 dark:bg-white/10"></div>
      
      <div className="w-14 h-14 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-brand-navy dark:text-white shadow-inner transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6 group-hover:bg-white dark:group-hover:bg-white/10 group-hover:shadow-glow-accent">
        <Icon size={24} className="text-brand-accent transition-all duration-500 group-hover:text-brand-navy dark:group-hover:text-white" />
      </div>
      <div>
        <h3 className="text-xl font-black text-brand-navy dark:text-white uppercase tracking-tighter flex items-center gap-2 transition-all duration-300 group-hover:translate-x-1">
          {title}
        </h3>
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] transition-all duration-300 group-hover:text-brand-accent">{subtitle}</p>
      </div>
    </div>
  );

  const TacticalInput = ({ label, value, onChange, type = "text", placeholder, className, icon: Icon, multiline = false }: any) => (
    <div className={`group relative ${className}`}>
      {/* Focus Laser Beam */}
      <div className="absolute bottom-0 left-1/2 w-0 h-[2px] bg-brand-accent transition-all duration-500 group-focus-within:w-full group-focus-within:left-0 z-20"></div>
      
      <div className={`relative flex items-start bg-white dark:bg-[#0f172a] rounded-2xl border border-slate-200 dark:border-white/10 transition-all duration-300 group-hover:border-slate-300 dark:group-hover:border-white/20 group-focus-within:border-brand-accent/50 group-focus-within:shadow-[0_0_30px_-10px_rgba(var(--color-brand-accent),0.3)] overflow-hidden ${multiline ? 'h-auto py-2' : ''}`}>
        {Icon && (
          <div className={`pl-4 pt-4 text-slate-400 group-focus-within:text-brand-accent transition-colors duration-300 group-focus-within:scale-110`}>
            <Icon size={18} />
          </div>
        )}
        <div className={`flex-1 relative ${multiline ? 'min-h-[100px]' : 'h-[56px]'}`}>
          {multiline ? (
             <textarea
                value={value}
                onChange={onChange}
                placeholder=" "
                className="peer w-full h-full bg-transparent text-brand-navy dark:text-white font-bold text-xs outline-none px-4 pt-6 pb-2 font-data tracking-wide resize-none z-10 relative"
             />
          ) : (
             <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder=" "
                className="peer w-full h-full bg-transparent text-brand-navy dark:text-white font-bold text-xs outline-none px-4 pt-4 pb-1 font-data tracking-wide uppercase z-10 relative"
             />
          )}
          <label className={`absolute left-4 top-2 text-[9px] font-black text-slate-400 uppercase tracking-widest transition-all duration-300 pointer-events-none peer-placeholder-shown:top-4 peer-placeholder-shown:text-[10px] peer-focus:top-1.5 peer-focus:text-[8px] peer-focus:text-brand-accent`}>
            {label}
          </label>
        </div>
      </div>
    </div>
  );

  const MagicToggle = ({ label, description, active, onClick, icon: Icon }: any) => (
    <div 
      onClick={onClick}
      className={`
        relative p-5 rounded-[2rem] border-2 transition-all duration-300 cursor-pointer flex items-center justify-between group overflow-hidden active:scale-[0.98]
        ${active 
          ? 'bg-white dark:bg-[#0f172a] border-brand-accent shadow-[0_0_25px_-5px_rgba(var(--color-brand-accent),0.2)]' 
          : 'bg-slate-50 dark:bg-white/5 border-transparent hover:border-slate-200 dark:hover:border-white/10 hover:bg-white dark:hover:bg-white/10'
        }
      `}
    >
      {/* Background Pulse Effect */}
      <div className={`absolute inset-0 bg-brand-accent/5 transition-opacity duration-500 ${active ? 'opacity-100' : 'opacity-0'}`}></div>
      
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
          active 
            ? 'bg-brand-accent text-white shadow-glow-accent rotate-12 scale-110' 
            : 'bg-white dark:bg-white/10 text-slate-400 group-hover:text-brand-navy dark:group-hover:text-white'
        }`}>
          <Icon size={18} />
        </div>
        <div>
          <h4 className={`text-[10px] font-black uppercase tracking-widest transition-colors duration-300 ${active ? 'text-brand-navy dark:text-white' : 'text-slate-500 group-hover:text-brand-navy dark:group-hover:text-white'}`}>{label}</h4>
          <p className="text-[8px] font-bold text-slate-400 uppercase tracking-wide mt-0.5">{description}</p>
        </div>
      </div>
      
      {/* Custom Switch Visual */}
      <div className={`w-14 h-8 rounded-full border-2 relative transition-colors duration-300 ${active ? 'bg-brand-accent border-brand-accent' : 'bg-slate-200 dark:bg-white/10 border-slate-300 dark:border-white/5'}`}>
         <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow-md toggle-knob ${active ? 'translate-x-6' : 'translate-x-0'}`}></div>
      </div>
    </div>
  );

  const EventCheckbox = ({ event, label, active, onClick }: any) => (
    <div 
      onClick={onClick}
      className={`
        flex items-center gap-3 p-3 rounded-2xl border cursor-pointer transition-all active:scale-95
        ${active 
          ? 'bg-brand-navy/5 dark:bg-brand-accent/10 border-brand-navy/20 dark:border-brand-accent/30' 
          : 'bg-transparent border-slate-100 dark:border-white/5 hover:bg-slate-50 dark:hover:bg-white/5'
        }
      `}
    >
      <div className={`
        w-5 h-5 rounded-lg border flex items-center justify-center transition-all
        ${active ? 'bg-brand-navy dark:bg-brand-accent border-transparent' : 'bg-white dark:bg-white/5 border-slate-300 dark:border-white/20'}
      `}>
        {active && <CheckCircle2 size={12} className="text-white" />}
      </div>
      <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-brand-navy dark:text-white' : 'text-slate-400'}`}>{label}</span>
    </div>
  );

  return (
    <div className="pb-24 max-w-[1600px] mx-auto p-4 lg:p-8 overflow-hidden">
      <style>{customStyles}</style>
      
      {/* HEADER: SANCTUM CONTROL */}
      <div className={`flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8 mb-4 animate-entry`}>
        <div className="space-y-3 group cursor-default">
          <div className="flex items-center gap-3">
            <div className="px-3 py-1 bg-brand-navy dark:bg-white/10 rounded-full border border-white/10 flex items-center gap-2 shadow-lg backdrop-blur-md hover:scale-105 transition-transform">
              <Sparkles size={12} className="text-brand-accent animate-pulse" />
              <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">System Core • v2.6.0</span>
            </div>
          </div>
          <h2 className="text-5xl font-black text-brand-navy dark:text-white uppercase tracking-tighter leading-none">
            Painel de <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-purple-600 animate-pulse-slow">Controle</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.3em] pl-1">
            Parametrização do Ecossistema Logístico
          </p>
        </div>
        
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <button 
            onClick={() => setSettings(settingsService.resetToDefault())}
            className="flex-1 lg:flex-none px-6 py-4 rounded-[1.5rem] bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 text-[9px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/10 hover:text-brand-red transition-all flex items-center justify-center gap-2 btn-press hover:rotate-2"
          >
            <RefreshCcw size={16} /> Reset
          </button>
          <button 
            onClick={handleSave}
            disabled={isSaving}
            className="flex-1 lg:flex-none bg-brand-navy dark:bg-white dark:text-brand-navy text-white px-10 py-4 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.2em] shadow-gesla-hard hover:bg-brand-accent dark:hover:bg-brand-accent dark:hover:text-white hover:translate-y-[-2px] transition-all flex items-center justify-center gap-3 btn-press group overflow-hidden relative"
          >
            {isSaving && <div className="absolute inset-0 btn-shimmer"></div>}
            <div className={`flex items-center gap-3 transition-transform duration-300 ${isSaving ? 'scale-90 opacity-80' : 'scale-100'}`}>
               {isSaving ? <RefreshCcw size={18} className="animate-spin" /> : <Save size={18} className="group-hover:scale-110 transition-transform" />}
               <span>{isSaving ? 'Sincronizando...' : 'Salvar Alterações'}</span>
            </div>
          </button>
        </div>
      </div>

      {/* NAVIGATION: ARCANE RUNES */}
      <div className="flex overflow-x-auto scrollbar-none pb-2 animate-entry delay-1">
        <div className="bg-white/80 dark:bg-[#1e293b]/80 backdrop-blur-xl p-1.5 rounded-[2rem] border border-slate-200 dark:border-white/5 flex items-center shadow-lg">
          {[
            { id: 'geral', label: 'Geral', icon: Wand2 },
            { id: 'fiscal', label: 'Fiscal', icon: Scale },
            { id: 'logistica', label: 'Operação', icon: Truck },
            { id: 'api', label: 'Conexões', icon: Globe },
            { id: 'seguranca', label: 'Auditoria', icon: ShieldCheck },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                relative flex items-center gap-2 px-6 py-3 rounded-[1.6rem] text-[9px] font-black uppercase tracking-widest transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
                ${activeTab === tab.id 
                  ? 'text-white shadow-lg scale-105 z-10' 
                  : 'text-slate-400 hover:text-brand-navy dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }
              `}
            >
              {activeTab === tab.id && (
                <div className="absolute inset-0 bg-brand-navy dark:bg-brand-accent rounded-[1.6rem] -z-10 animate-in zoom-in-95 duration-300"></div>
              )}
              <tab.icon size={14} className={`transition-all duration-300 ${activeTab === tab.id ? 'text-brand-accent dark:text-white scale-110' : ''}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 mt-8">
        
        {/* MAIN CONFIGURATION STAGE (Transition Wrapper) */}
        <div className="xl:col-span-8">
          
          <div key={activeTab} className="animate-entry space-y-8">
            {/* TAB: GERAL */}
            {activeTab === 'geral' && (
                <div className="bg-white dark:bg-[#1e293b] p-8 lg:p-10 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-premium space-y-8 group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-navy/5 dark:bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl transition-transform duration-1000 group-hover:scale-150"></div>
                
                <SectionHeader title="Identidade do Sistema" subtitle="Dados Mestre & Aparência" icon={Building2} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                    <TacticalInput label="Razão Social Gesla" value={settings.companyName} onChange={(e: any) => setSettings({...settings, companyName: e.target.value})} icon={Building2} />
                    <TacticalInput label="CNPJ Matriz" value={settings.companyCnpj} onChange={(e: any) => setSettings({...settings, companyCnpj: e.target.value})} icon={FileCheck} />
                    <div className="md:col-span-2">
                    <TacticalInput label="E-mail de Notificações" value={settings.notificationEmail} onChange={(e: any) => setSettings({...settings, notificationEmail: e.target.value})} icon={Mail} type="email" />
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-100 dark:border-white/5">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4 pl-1">Interface Visual</h4>
                    <MagicToggle 
                        label="Modo Dark Ops" 
                        description="Interface de alto contraste para ambientes com pouca luz"
                        active={settings.darkMode}
                        onClick={() => toggleSetting('darkMode')}
                        icon={settings.darkMode ? Moon : Sun}
                    />
                </div>
                </div>
            )}

            {/* TAB: FISCAL */}
            {activeTab === 'fiscal' && (
                <div className="space-y-8">
                <div className="bg-white dark:bg-[#1e293b] p-8 lg:p-10 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-premium">
                    <SectionHeader title="Regras Fiscais" subtitle="Compliance & Tributação" icon={Scale} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <MagicToggle label="Obrigatoriedade DIFAL" description="Exigir GNRE para não contribuintes" active={settings.requireDifalGuide} onClick={() => toggleSetting('requireDifalGuide')} icon={FileCheck} />
                        <MagicToggle label="Comprovante Bancário" description="Bloquear sem prova de pagamento" active={settings.requirePaymentProof} onClick={() => toggleSetting('requirePaymentProof')} icon={Zap} />
                        <MagicToggle label="Trava de Edição" description="Bloquear cargas faturadas" active={settings.lockBilledLoads} onClick={() => toggleSetting('lockBilledLoads')} icon={Lock} />
                        <MagicToggle label="Auto-Expedição" description="Avançar status após faturamento" active={settings.autoDispatchAfterBilling} onClick={() => toggleSetting('autoDispatchAfterBilling')} icon={CloudLightning} />
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1e293b] p-8 lg:p-10 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-premium relative overflow-hidden">
                    <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 relative z-10 gap-4">
                        <div>
                          <h4 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest flex items-center gap-2">
                              <Layers size={16} className="text-brand-accent" /> Matriz Tributária (DIFAL)
                          </h4>
                          <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Cálculo: Alíquota Interna Destino - Interestadual (Origem PR)</p>
                        </div>
                        
                        <button 
                          onClick={calculateStandardDifal}
                          className="flex items-center gap-2 px-4 py-2 bg-brand-navy/5 dark:bg-white/5 border border-brand-navy/10 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-brand-navy dark:text-white hover:bg-brand-navy dark:hover:bg-white hover:text-white dark:hover:text-brand-navy transition-all shadow-sm active:scale-95 group"
                        >
                           <RefreshCw size={14} className="group-hover:rotate-180 transition-transform duration-500" /> Padronizar Regra Fiscal (Origem PR)
                        </button>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-9 gap-3 relative z-10">
                        {UFS.map((uf, idx) => (
                        <div key={uf} className="group relative bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 hover:border-brand-accent/50 transition-all overflow-hidden hover:-translate-y-1 hover:shadow-lg animate-entry" style={{ animationDelay: `${idx * 0.02}s` }}>
                            <div className="absolute inset-0 bg-brand-accent/0 group-hover:bg-brand-accent/5 transition-colors duration-300"></div>
                            <div className="p-3 text-center">
                            <label className="block text-[9px] font-black text-slate-400 group-hover:text-brand-accent transition-colors mb-1">{uf}</label>
                            <div className="relative">
                              <input 
                                  type="number" 
                                  className="w-full bg-transparent text-center text-sm font-black text-brand-navy dark:text-white focus:outline-none font-data"
                                  value={settings.difalRates[uf] || 0}
                                  onChange={e => setSettings({
                                  ...settings, 
                                  difalRates: { ...settings.difalRates, [uf]: Number(e.target.value) }
                                  })}
                              />
                              <span className="text-[8px] font-bold text-slate-400 absolute right-0 top-1 pointer-events-none">%</span>
                            </div>
                            </div>
                        </div>
                        ))}
                    </div>
                </div>
                </div>
            )}

            {/* TAB: LOGISTICA */}
            {activeTab === 'logistica' && (
                <div className="bg-white dark:bg-[#1e293b] p-8 lg:p-10 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-premium space-y-10">
                <SectionHeader title="Parâmetros Operacionais" subtitle="Fluxo & Arquivamento" icon={Truck} />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                    <TacticalInput label="Prefixo de Protocolo" value={settings.portCodePrefix} onChange={(e: any) => setSettings({...settings, portCodePrefix: e.target.value.toUpperCase()})} icon={Terminal} />
                    <TacticalInput label="Ciclo de Arquivamento (Dias)" value={settings.autoArchiveDays} onChange={(e: any) => setSettings({...settings, autoArchiveDays: Number(e.target.value)})} icon={History} type="number" />
                    </div>
                    
                    <div className="bg-slate-900 dark:bg-black/40 p-8 rounded-[2.5rem] text-white relative overflow-hidden border border-white/10 group hover:shadow-glow-accent transition-shadow duration-500">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-brand-accent/20 rounded-full blur-[60px] group-hover:scale-125 transition-transform duration-1000"></div>
                        
                        <div className="relative z-10">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6">Padrão de Frete</h5>
                        <div className="flex gap-4">
                            {[ShippingType.FOB, ShippingType.CIF].map(type => (
                            <button
                                key={type}
                                type="button"
                                onClick={() => setSettings({...settings, defaultShippingType: type})}
                                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all active:scale-95 ${
                                settings.defaultShippingType === type 
                                ? 'bg-brand-accent text-white border-brand-accent shadow-glow-accent scale-105' 
                                : 'bg-transparent text-slate-500 border-white/10 hover:border-white/30 hover:bg-white/5'
                                }`}
                            >
                                {type}
                            </button>
                            ))}
                        </div>
                        <p className="text-[9px] font-medium text-slate-500 mt-6 leading-relaxed">
                            Este parâmetro define a modalidade pré-selecionada ao criar novas cargas, otimizando o tempo de lançamento em 15%.
                        </p>
                        </div>
                    </div>
                </div>
                </div>
            )}

            {/* TAB: API (RENOVADA) */}
            {activeTab === 'api' && (
                <div className="space-y-8">
                  {/* BOTS SECTION */}
                  <div className="bg-white dark:bg-[#1e293b] p-8 lg:p-10 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-premium">
                    <SectionHeader title="Integrações & Bots" subtitle="Conectividade Externa" icon={Globe} />
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="p-8 bg-emerald-50/50 dark:bg-emerald-900/10 rounded-[2.5rem] border border-emerald-100 dark:border-emerald-500/20 relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
                          <div className="flex items-center gap-4 mb-6">
                          <div className="p-3 bg-emerald-100 dark:bg-emerald-500/20 rounded-xl text-emerald-600 dark:text-emerald-400 animate-pulse"><MessageCircle size={20} /></div>
                          <div>
                              <h4 className="text-xs font-black text-brand-navy dark:text-white uppercase tracking-widest">WhatsApp Bot</h4>
                              <p className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide">Notificações Automáticas</p>
                          </div>
                          </div>
                          
                          <div className="space-y-6">
                              <MagicToggle label="Ativar Bot Notificador" description="Disparar mensagens de status" active={settings.enableWhatsAppBot} onClick={() => toggleSetting('enableWhatsAppBot')} icon={Smartphone} />
                              {settings.enableWhatsAppBot && (
                              <div className="animate-in slide-in-from-top-2 fade-in">
                                  <TacticalInput label="Número WhatsApp (Empresa)" value={settings.whatsappBotNumber} onChange={(e: any) => setSettings({...settings, whatsappBotNumber: maskPhone(e.target.value)})} icon={Smartphone} />
                              </div>
                              )}
                          </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-white dark:bg-white/5 p-6 rounded-[2.5rem] border border-slate-200 dark:border-white/10">
                           <div className="flex items-center justify-between mb-4">
                              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest">API Key (Acesso Externo)</label>
                              <Lock size={14} className="text-slate-300" />
                           </div>
                           <div className="flex items-center gap-4">
                              <code className="flex-1 bg-slate-50 dark:bg-[#0f172a] p-4 rounded-xl text-[10px] font-data text-slate-500 border border-slate-100 dark:border-white/5 overflow-hidden text-ellipsis whitespace-nowrap">
                                 {settings.apiKey}
                              </code>
                              <button 
                                 onClick={() => { navigator.clipboard.writeText(settings.apiKey); alert('Copiado!'); }}
                                 className="px-4 py-3 bg-brand-navy dark:bg-white/10 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-brand-accent transition-all shadow-lg btn-press"
                              >
                                 Copiar
                              </button>
                           </div>
                        </div>
                        <TacticalInput label="ERP Webhook URL (Legado)" value={settings.erpWebhookUrl} onChange={(e: any) => setSettings({...settings, erpWebhookUrl: e.target.value})} icon={Terminal} placeholder="https://api.erp.com/webhook" />
                      </div>
                    </div>
                  </div>

                  {/* WEBHOOK CONFIGURATOR */}
                  <div className="bg-white dark:bg-[#1e293b] p-8 lg:p-10 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-premium relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 rounded-full blur-3xl"></div>
                     <div className="flex justify-between items-center mb-8 relative z-10">
                        <div>
                           <h4 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest flex items-center gap-2">
                              <CloudLightning size={18} className="text-brand-accent" /> Configuração de Webhook Global
                           </h4>
                           <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Regras de disparo para integrações externas</p>
                        </div>
                        <div className="flex items-center gap-3">
                           <span className="text-[9px] font-black uppercase text-slate-400">Status da Integração</span>
                           <button 
                             onClick={() => setSettings(p => ({...p, webhookConfig: {...p.webhookConfig, active: !p.webhookConfig.active}}))}
                             className={`w-12 h-7 rounded-full border-2 transition-colors relative ${settings.webhookConfig.active ? 'bg-emerald-500 border-emerald-500' : 'bg-slate-200 dark:bg-white/10 border-slate-300 dark:border-white/20'}`}
                           >
                              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings.webhookConfig.active ? 'translate-x-5' : 'translate-x-0'}`}></div>
                           </button>
                        </div>
                     </div>

                     <div className={`space-y-8 transition-opacity duration-300 relative z-10 ${settings.webhookConfig.active ? 'opacity-100' : 'opacity-50 pointer-events-none grayscale'}`}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                           <TacticalInput 
                              label="Endpoint URL (POST)" 
                              icon={Globe} 
                              value={settings.webhookConfig.url} 
                              onChange={(e: any) => setSettings(p => ({...p, webhookConfig: {...p.webhookConfig, url: e.target.value}}))} 
                              placeholder="https://meu-sistema.com/webhook/gesla"
                           />
                           <TacticalInput 
                              label="API Secret / Bearer Token" 
                              icon={Lock} 
                              type="password"
                              value={settings.webhookConfig.apiKey} 
                              onChange={(e: any) => setSettings(p => ({...p, webhookConfig: {...p.webhookConfig, apiKey: e.target.value}}))} 
                              placeholder="sk_live_..."
                           />
                        </div>

                        <div className="bg-slate-50 dark:bg-black/20 p-6 rounded-[2.5rem] border border-slate-100 dark:border-white/5">
                           <div className="flex items-center gap-2 mb-6 px-2">
                              <List size={16} className="text-brand-accent" />
                              <span className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">Matriz de Eventos (Disparadores)</span>
                           </div>
                           
                           <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                              {[
                                { id: SystemEventType.CARGA_TRANSITO, label: 'Em Trânsito' },
                                { id: SystemEventType.CARGA_PATIO, label: 'Chegou no Pátio' },
                                { id: SystemEventType.CARGA_IDENTIFICADO, label: 'Identificado' },
                                { id: SystemEventType.CARGA_FATURADO, label: 'Faturado' },
                                { id: SystemEventType.CARGA_EXPEDIDO, label: 'Expedido' },
                                { id: SystemEventType.CARGA_CONCLUIDO, label: 'Concluído' },
                                { id: SystemEventType.CARGA_CANCELADO, label: 'Cancelado' },
                              ].map(evt => (
                                 <EventCheckbox 
                                    key={evt.id} 
                                    event={evt.id} 
                                    label={evt.label} 
                                    active={settings.webhookConfig.events?.includes(evt.id as SystemEventType)}
                                    onClick={() => toggleWebhookEvent(evt.id as SystemEventType)}
                                 />
                              ))}
                           </div>
                        </div>

                        {/* ADVANCED FILTERS PREVIEW (PREPARATION LAYER) */}
                        <div className="border-t border-slate-100 dark:border-white/5 pt-6 opacity-60 hover:opacity-100 transition-opacity">
                           <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-2">
                                 <Filter size={16} className="text-slate-400" />
                                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Filtros Avançados (Condicionais)</span>
                              </div>
                              <span className="text-[8px] font-bold bg-brand-accent/10 text-brand-accent px-2 py-1 rounded">EM BREVE</span>
                           </div>
                           <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 text-[10px] font-bold uppercase tracking-wide">
                              Configuração de regras condicionais (ex: Apenas Cargas com DIFAL)
                           </div>
                        </div>
                     </div>
                  </div>

                  {/* NOTIFICATION TEMPLATES ENGINE */}
                  <div className="bg-white dark:bg-[#1e293b] p-8 lg:p-10 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-premium relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl"></div>
                     
                     <SectionHeader title="Motor de Mensagens" subtitle="Templates de Notificação (WhatsApp/Bot)" icon={MessageSquare} />

                     <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
                        
                        {/* LISTA DE EVENTOS */}
                        <div className="lg:col-span-4 space-y-2">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 pl-2">Selecionar Evento</p>
                           {Object.values(settings.notificationTemplates || {}).map((template: any) => (
                              <button
                                key={template.event}
                                onClick={() => setSelectedTemplateEvent(template.event)}
                                className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between group ${selectedTemplateEvent === template.event ? 'bg-brand-navy dark:bg-white text-white dark:text-brand-navy border-transparent shadow-lg' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/5 hover:border-brand-accent/30'}`}
                              >
                                 <span className="text-[10px] font-black uppercase tracking-wide">{template.prefix.split(' ')[0]} {template.event.replace('CARGA_', '')}</span>
                                 {selectedTemplateEvent === template.event && <Edit3 size={14} className="animate-pulse" />}
                              </button>
                           ))}
                        </div>

                        {/* EDITOR & PREVIEW */}
                        <div className="lg:col-span-8 space-y-6">
                           {selectedTemplateEvent ? (
                              <div className="animate-in slide-in-from-right-4 fade-in">
                                 <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest">
                                      Editando: {selectedTemplateEvent}
                                    </h4>
                                    <div className="flex items-center gap-2">
                                       <span className="text-[9px] font-bold text-slate-400 uppercase">Status:</span>
                                       <button 
                                          onClick={() => setSettings(p => ({
                                            ...p, 
                                            notificationTemplates: {
                                              ...p.notificationTemplates,
                                              [selectedTemplateEvent]: {
                                                ...p.notificationTemplates[selectedTemplateEvent],
                                                enabled: !p.notificationTemplates[selectedTemplateEvent].enabled
                                              }
                                            }
                                          }))}
                                          className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-colors ${settings.notificationTemplates[selectedTemplateEvent].enabled ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-500'}`}
                                       >
                                          {settings.notificationTemplates[selectedTemplateEvent].enabled ? 'Ativo' : 'Inativo'}
                                       </button>
                                    </div>
                                 </div>

                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-4">
                                       <TacticalInput 
                                          label="Prefixo (Título/Emoji)" 
                                          value={settings.notificationTemplates[selectedTemplateEvent].prefix} 
                                          onChange={(e: any) => setSettings(p => ({
                                            ...p, 
                                            notificationTemplates: {
                                              ...p.notificationTemplates,
                                              [selectedTemplateEvent]: {
                                                ...p.notificationTemplates[selectedTemplateEvent],
                                                prefix: e.target.value
                                              }
                                            }
                                          }))}
                                       />
                                       <TacticalInput 
                                          label="Corpo da Mensagem (Use {{placeholders}})" 
                                          value={settings.notificationTemplates[selectedTemplateEvent].template} 
                                          onChange={(e: any) => setSettings(p => ({
                                            ...p, 
                                            notificationTemplates: {
                                              ...p.notificationTemplates,
                                              [selectedTemplateEvent]: {
                                                ...p.notificationTemplates[selectedTemplateEvent],
                                                template: e.target.value
                                              }
                                            }
                                          }))}
                                          multiline
                                       />
                                       <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5">
                                          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Variáveis Disponíveis</p>
                                          <div className="flex flex-wrap gap-2">
                                             {['{{codigo}}', '{{status}}', '{{cliente}}', '{{cidade}}', '{{uf}}', '{{transportadora}}', '{{valor}}', '{{data}}'].map(v => (
                                                <span key={v} className="px-2 py-1 bg-white dark:bg-black/20 rounded-md text-[8px] font-mono text-brand-accent border border-slate-200 dark:border-white/10 cursor-help" title="Clique para copiar">{v}</span>
                                             ))}
                                          </div>
                                       </div>
                                    </div>

                                    {/* LIVE PREVIEW */}
                                    <div className="bg-[#e5ddd5] dark:bg-[#0b141a] p-4 rounded-[2rem] border-4 border-slate-200 dark:border-white/10 relative overflow-hidden shadow-inner flex flex-col">
                                       <div className="absolute top-0 left-0 w-full h-8 bg-slate-200 dark:bg-[#1f2c34] flex items-center justify-center z-10 opacity-80">
                                          <div className="w-16 h-1 bg-slate-400 rounded-full"></div>
                                       </div>
                                       
                                       <div className="flex-1 flex flex-col justify-end pt-10 pb-2">
                                          <div className="bg-white dark:bg-[#202c33] p-3 rounded-tr-2xl rounded-tl-2xl rounded-br-2xl shadow-sm self-start max-w-[90%] text-sm text-[#111b21] dark:text-[#e9edef] relative mb-2 animate-in slide-in-from-left-2">
                                             <div className="whitespace-pre-wrap font-sans leading-relaxed">
                                                {notificationFormatter.format(previewLoad, selectedTemplateEvent)}
                                             </div>
                                             <div className="text-[9px] text-slate-400 text-right mt-1 flex justify-end gap-1">
                                                <span>14:32</span>
                                             </div>
                                          </div>
                                       </div>

                                       <div className="mt-auto bg-slate-200 dark:bg-[#1f2c34] p-2 rounded-xl flex items-center gap-2">
                                          <div className="w-6 h-6 rounded-full bg-slate-400 opacity-20"></div>
                                          <div className="h-2 w-24 bg-slate-400 opacity-20 rounded-full"></div>
                                       </div>
                                    </div>
                                 </div>
                              </div>
                           ) : (
                              <div className="h-full flex flex-col items-center justify-center text-center opacity-40 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[2.5rem] p-10">
                                 <MessageSquare size={48} className="mb-4 text-slate-300" />
                                 <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Selecione um evento para configurar o template</p>
                              </div>
                           )}
                        </div>
                     </div>
                  </div>

                  {/* WEBHOOK AUDIT LOGS (NOVO MÓDULO) */}
                  <WebhookLogs />

                </div>
            )}

            {/* TAB: SEGURANÇA */}
            {activeTab === 'seguranca' && (
                <div className="bg-white dark:bg-[#1e293b] p-8 lg:p-10 rounded-[3.5rem] border border-slate-100 dark:border-white/5 shadow-premium space-y-8">
                <SectionHeader title="Auditoria & Logs" subtitle="Rastreabilidade do Sistema" icon={ShieldCheck} />

                <div className="space-y-3">
                    {[
                        { action: 'ALTERAÇÃO DE ALÍQUOTA', user: 'Adrian Gestor', time: 'Há 2 horas', module: 'Fiscal (PR)', icon: Scale },
                        { action: 'UPDATE DE WEBHOOK', user: 'Adrian Gestor', time: 'Ontem às 18:45', module: 'API Core', icon: Terminal },
                        { action: 'NOVA HOMOLOGAÇÃO', user: 'Emilay Silva', time: 'Ontem às 10:20', module: 'Equipe', icon: Fingerprint },
                        { action: 'RESET DE SENHA', user: 'Matheus Oliveira', time: '02 Jan 2025', module: 'Segurança', icon: Lock },
                    ].map((log, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-slate-50 dark:bg-white/5 rounded-[1.5rem] border border-slate-100 dark:border-white/5 hover:border-brand-accent/30 hover:bg-white dark:hover:bg-[#0f172a] transition-all group animate-entry" style={{ animationDelay: `${i * 0.1}s` }}>
                        <div className="flex items-center gap-5">
                            <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/10 flex items-center justify-center text-slate-400 group-hover:text-brand-accent group-hover:scale-110 transition-all shadow-sm">
                            <log.icon size={18} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-brand-navy dark:text-white uppercase tracking-tight">{log.action}</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{log.user} • {log.module}</p>
                            </div>
                        </div>
                        <span className="text-[9px] font-black text-slate-300 dark:text-slate-600 uppercase bg-white dark:bg-white/5 px-3 py-1 rounded-lg border border-slate-100 dark:border-white/5">{log.time}</span>
                        </div>
                    ))}
                </div>
                
                <button className="w-full py-5 border-2 border-dashed border-slate-200 dark:border-white/10 rounded-[2rem] text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-brand-navy dark:hover:text-white hover:border-brand-accent/50 hover:bg-slate-50 dark:hover:bg-white/5 transition-all mt-4">
                    Carregar Histórico Completo
                </button>
                </div>
            )}
          </div>
        </div>

        {/* SYSTEM STATUS SIDEBAR (HUD) */}
        <div className="xl:col-span-4 space-y-8 h-fit sticky top-28 animate-entry delay-3">
          
          {/* SYSTEM MANA (HEALTH) */}
          <div className="bg-brand-navy dark:bg-black/40 p-8 rounded-[3rem] shadow-gesla-hard text-white relative overflow-hidden group border border-white/5 hover:shadow-glow-accent transition-shadow duration-500">
            <div className="absolute top-0 right-0 w-48 h-48 bg-brand-accent/20 blur-[80px] -mr-24 -mt-24 group-hover:scale-150 transition-transform duration-[3000ms]"></div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-8">
                 <div className="flex items-center gap-3">
                   <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/10 flex items-center justify-center text-brand-accent">
                     <Activity size={20} className="animate-pulse" />
                   </div>
                   <div>
                      <h4 className="text-[10px] font-black uppercase tracking-[0.3em]">System Mana</h4>
                      <span className="text-[8px] font-bold text-emerald-400 uppercase tracking-widest">Online & Stable</span>
                   </div>
                 </div>
              </div>
              
              <div className="space-y-6">
                 <div>
                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 mb-2">
                       <span>Database Sync</span>
                       <span className="text-white">99.8%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981] mana-bar" style={{ '--target-width': '99.8%' } as any}></div>
                    </div>
                 </div>

                 <div>
                    <div className="flex justify-between text-[9px] font-black uppercase text-slate-400 mb-2">
                       <span>API Response</span>
                       <span className="text-white">124ms</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                       <div className="h-full bg-brand-accent shadow-[0_0_10px_var(--color-brand-accent)] mana-bar" style={{ '--target-width': '85%', animationDelay: '0.2s' } as any}></div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center hover:bg-white/10 transition-colors cursor-default">
                       <MonitorSmartphone size={16} className="text-slate-400 mb-2" />
                       <span className="text-[8px] font-black text-slate-500 uppercase">Core</span>
                       <span className="text-[10px] font-black text-white mt-1">v2.6.0</span>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col items-center hover:bg-white/10 transition-colors cursor-default">
                       <Database size={16} className="text-slate-400 mb-2" />
                       <span className="text-[8px] font-black text-slate-500 uppercase">Storage</span>
                       <span className="text-[10px] font-black text-white mt-1">54GB</span>
                    </div>
                 </div>
              </div>
            </div>
          </div>

          {/* NOTIFICATION PREVIEW */}
          <div className="bg-white dark:bg-[#1e293b] p-8 rounded-[3rem] border border-slate-100 dark:border-white/5 shadow-premium animate-entry delay-4">
            <div className="flex items-center gap-4 mb-6">
               <div className="w-10 h-10 bg-slate-50 dark:bg-white/5 rounded-xl flex items-center justify-center text-brand-navy dark:text-white"><Bell size={18} /></div>
               <h4 className="text-[10px] font-black text-brand-navy dark:text-white uppercase tracking-[0.3em]">Canais de Alerta</h4>
            </div>
            
            <div className="space-y-3">
               {[
                 { label: 'Push Notifications', active: true },
                 { label: 'E-mail Diário', active: true },
                 { label: 'SMS de Emergência', active: false },
               ].map((item, i) => (
                 <div key={i} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/5 group hover:border-slate-200 dark:hover:border-white/10 transition-colors">
                    <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase">{item.label}</span>
                    <div className={`w-2 h-2 rounded-full transition-all duration-500 ${item.active ? 'bg-emerald-500 shadow-[0_0_8px_#10b981] scale-110' : 'bg-slate-300 dark:bg-white/20'}`}></div>
                 </div>
               ))}
            </div>
          </div>

        </div>
      </div>

      {/* SUCCESS TOAST - MAGIC RUNE STYLE (ELASTIC POP) */}
      {showSuccess && (
        <div className="fixed bottom-12 left-1/2 -translate-x-1/2 bg-brand-navy dark:bg-white text-white dark:text-brand-navy px-12 py-6 rounded-[3rem] shadow-gesla-hard flex items-center gap-6 z-[200] border border-white/10 animate-in slide-in-from-bottom-8 zoom-in-95 duration-500 cubic-bezier(0.175, 0.885, 0.32, 1.275)">
          <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white shadow-lg shadow-emerald-500/30 animate-pulse">
             <CheckCircle2 size={24} />
          </div>
          <div className="flex flex-col">
             <span className="text-[12px] font-black uppercase tracking-[0.2em]">Configuração Aplicada</span>
             <span className="text-[9px] font-bold text-slate-400 dark:text-slate-600 uppercase tracking-widest mt-0.5">O sistema foi atualizado com sucesso.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
