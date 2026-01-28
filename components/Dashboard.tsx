
import React, { useMemo, useState, useEffect, useRef } from 'react';
import * as ReactRouterDOM from 'react-router-dom';
const { useNavigate } = ReactRouterDOM;
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, ComposedChart, Line
} from 'recharts';
import { 
  Activity, TrendingUp, TrendingDown, Truck, 
  DollarSign, AlertTriangle, CheckCircle2, BarChart3, 
  Package, ShieldCheck, Clock, Wallet, Coins,
  Target, Zap, Radar, ArrowUpRight
} from 'lucide-react';
import { loadService } from '../services/loadService';
import { userService } from '../services/userService';
import { settingsService } from '../services/settingsService';
import { LoadStatus, ShippingType, ClientType } from '../types';
import { formatCurrency, formatDecimal } from '../utils/formatters';
import { STATUS_HEX } from '../constants';

type TimeRange = 'week' | 'month' | 'quarter' | 'year';
type TabType = 'overview' | 'financeiro' | 'transportadoras';

// --- HOOKS DE ANIMAÇÃO ---

// Hook para animar números (CountUp)
const useCountUp = (end: number, duration = 1500, start = 0) => {
  const [count, setCount] = useState(start);
  
  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      
      // Easing function: EaseOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);
      
      setCount(start + (end - start) * ease);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [end, duration, start]);

  return count;
};

// Hook para tema
const useThemeColors = () => {
  const [isDark, setIsDark] = useState(settingsService.getSettings().darkMode);

  useEffect(() => {
    const handleSettingsChange = () => {
      setIsDark(settingsService.getSettings().darkMode);
    };
    window.addEventListener('settingsChanged', handleSettingsChange);
    return () => window.removeEventListener('settingsChanged', handleSettingsChange);
  }, []);

  return {
    isDark,
    text: isDark ? '#94a3b8' : '#64748b', 
    grid: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    tooltipBg: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)',
    tooltipBorder: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
  };
};

// --- COMPONENTES VISUAIS ---

const AnimatedValue = ({ value, formatter = (v: number) => v.toString(), className }: { value: number, formatter?: (v: number) => string, className?: string }) => {
  const count = useCountUp(value);
  return <span className={className}>{formatter(count)}</span>;
};

const StatCard = ({ title, value, subtext, icon: Icon, trend, trendLabel, color = 'navy', delay = 0, onClick }: any) => {
  const isRed = color === 'red';
  const isGreen = color === 'green';
  const isNavy = color === 'navy';
  const isWhite = color === 'white';
  
  // Extrai número para animação se for possível
  const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^0-9.-]+/g,"")) : value;
  const isCurrency = typeof value === 'string' && value.includes('R$');
  const isPercent = typeof value === 'string' && value.includes('%');

  return (
    <div 
      onClick={onClick}
      className={`
        holo-card rounded-[2.5rem] p-6 glass-panel border transition-all duration-500 group animate-enter relative overflow-hidden
        ${isRed ? 'bg-white dark:bg-[#1e293b] border-rose-200 dark:border-rose-500/30' : ''}
        ${isGreen ? 'bg-white dark:bg-[#1e293b] border-emerald-200 dark:border-emerald-500/30' : ''}
        ${isNavy ? 'bg-brand-navy dark:bg-[#0f172a] border-transparent dark:border-white/10 text-white' : ''}
        ${isWhite ? 'bg-white dark:bg-[#1e293b] border-slate-200 dark:border-white/10' : ''}
        ${onClick ? 'cursor-pointer hover:-translate-y-2' : ''}
      `}
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Background Ambient Glow */}
      <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[60px] opacity-20 transition-transform duration-1000 group-hover:scale-150 group-hover:opacity-40 ${isRed ? 'bg-rose-500' : (isGreen ? 'bg-emerald-500' : 'bg-brand-accent')}`}></div>
      
      {/* Decorative Tech Lines */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-current to-transparent opacity-10"></div>

      <div className="relative z-10 flex justify-between items-start mb-4">
        <div className={`p-3.5 rounded-2xl border transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 ${isNavy ? 'bg-white/10 border-white/5 text-white shadow-lg' : 'bg-slate-50 dark:bg-white/5 border-slate-100 dark:border-white/10 text-brand-navy dark:text-white shadow-sm'}`}>
          <Icon size={22} className="animate-pulse-slow" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-[9px] font-black uppercase px-2.5 py-1 rounded-lg backdrop-blur-sm border ${trend >= 0 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-600 dark:text-rose-400'}`}>
            {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            <AnimatedValue value={Math.abs(trend)} formatter={(v) => v.toFixed(0)} />%
          </div>
        )}
      </div>
      
      <div className="relative z-10">
        <h3 className={`text-3xl font-black font-data tracking-tighter mb-1 truncate ${isNavy ? 'text-white' : 'text-brand-navy dark:text-white'}`}>
           {/* Se for número extraível, anima. Se não, mostra estático */}
           {!isNaN(numValue) ? (
             <AnimatedValue 
               value={numValue} 
               formatter={(v) => isCurrency ? formatCurrency(v) : (isPercent ? `${v.toFixed(0)}%` : Math.floor(v).toLocaleString())} 
             />
           ) : value}
        </h3>
        <p className={`text-[10px] font-black uppercase tracking-[0.25em] flex items-center gap-2 ${isNavy ? 'text-slate-400' : 'text-slate-500 dark:text-slate-400'}`}>
          {title}
        </p>
        
        {subtext && (
          <div className={`mt-5 pt-4 border-t flex items-center justify-between ${isNavy ? 'border-white/10' : 'border-slate-100 dark:border-white/10'}`}>
            <span className={`text-[9px] font-bold ${isNavy ? 'text-slate-500' : 'text-slate-400'}`}>{subtext}</span>
            {trendLabel && <span className="text-[9px] font-black uppercase text-brand-accent animate-pulse">{trendLabel}</span>}
          </div>
        )}
      </div>
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-panel p-4 rounded-2xl shadow-2xl border border-white/10 backdrop-blur-xl animate-in zoom-in-95 duration-200">
        <div className="flex items-center gap-2 mb-3 border-b border-white/10 pb-2">
           <div className="w-1.5 h-1.5 rounded-full bg-brand-accent animate-pulse"></div>
           <p className="text-[10px] font-black text-slate-500 dark:text-slate-300 uppercase tracking-widest">{label}</p>
        </div>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-8 text-xs font-bold text-slate-700 dark:text-white mb-1.5 last:mb-0">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full shadow-sm ring-2 ring-white/10" style={{ backgroundColor: entry.color || entry.fill }}></div>
              <span className="uppercase text-[9px] tracking-wider text-slate-500 dark:text-slate-400">{entry.name}</span>
            </div>
            <span className="font-data text-brand-navy dark:text-white font-black">
              {typeof entry.value === 'number' && (entry.name.toLowerCase().includes('valor') || entry.name.toLowerCase().includes('receita') || entry.name.toLowerCase().includes('custo') || entry.name.toLowerCase().includes('lucro'))
                ? formatCurrency(entry.value) 
                : entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const currentUser = userService.getCurrentUser();
  const theme = useThemeColors();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [timeFilter, setTimeFilter] = useState<TimeRange>('month');
  const [isLoading, setIsLoading] = useState(true);
  
  // Simulando loading para transições de "troca de contexto"
  useEffect(() => {
    setIsLoading(true);
    const timer = setTimeout(() => setIsLoading(false), 400); // Rápido para não travar
    return () => clearTimeout(timer);
  }, [activeTab, timeFilter]);

  const handleNavigate = (filterType: string, value: any = null, label: string = 'Filtro Personalizado') => {
    navigate('/loads', { state: { filter: { type: filterType, value, label } } });
  };

  const analytics = useMemo(() => {
    const allLoads = loadService.getLoads();
    const now = new Date();
    
    const filtered = allLoads.filter(l => {
      if (!l.date) return false;
      const d = new Date(l.date);
      if (timeFilter === 'week') { const weekAgo = new Date(); weekAgo.setDate(now.getDate() - 7); return d >= weekAgo; }
      if (timeFilter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      if (timeFilter === 'quarter') { const qStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1); return d >= qStart; }
      return d.getFullYear() === now.getFullYear();
    });

    let totalRevenue = 0, totalCost = 0, totalWeight = 0;
    filtered.forEach(l => {
      const rev = l.financial?.customerFreightValue || 0;
      const cost = (l.financial?.freightValue || l.freightValue || 0) + (l.financial?.extraCosts || 0);
      totalRevenue += rev; totalCost += cost; totalWeight += (l.totalWeight || 0);
    });

    const grossProfit = totalRevenue - totalCost;
    const marginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const avgCostPerKg = totalWeight > 0 ? totalCost / totalWeight : 0;

    let delayedCount = 0;
    const loadsWithSla = filtered.filter(l => l.status !== LoadStatus.CANCELLED);
    loadsWithSla.forEach(l => {
      if (!l.expectedDeliveryDate) return;
      const expected = new Date(l.expectedDeliveryDate).setHours(23, 59, 59);
      if (l.status === LoadStatus.COMPLETED && l.actualDeliveryDate) {
        if (new Date(l.actualDeliveryDate).getTime() > expected) delayedCount++;
      } else {
        if (now.getTime() > expected) delayedCount++;
      }
    });

    const onTimeCount = loadsWithSla.length - delayedCount;
    const slaRate = loadsWithSla.length > 0 ? Math.round((onTimeCount / loadsWithSla.length) * 100) : 100;

    const statusMap = filtered.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {} as Record<string, number>);
    const statusChart = [
      { name: 'Em Trânsito', value: statusMap[LoadStatus.TRANSIT] || 0, color: STATUS_HEX[LoadStatus.TRANSIT], statusKey: LoadStatus.TRANSIT },
      { name: 'Pátio/Chegou', value: statusMap[LoadStatus.ARRIVED] || 0, color: STATUS_HEX[LoadStatus.ARRIVED], statusKey: LoadStatus.ARRIVED },
      { name: 'Faturado', value: statusMap[LoadStatus.BILLED] || 0, color: STATUS_HEX[LoadStatus.BILLED], statusKey: LoadStatus.BILLED },
      { name: 'Expedido', value: statusMap[LoadStatus.DISPATCHED] || 0, color: STATUS_HEX[LoadStatus.DISPATCHED], statusKey: LoadStatus.DISPATCHED },
    ].filter(i => i.value > 0);

    const carrierMap = filtered.reduce((acc, l) => {
      const name = l.carrier || 'Logística Própria';
      if (!acc[name]) acc[name] = { name, count: 0, cost: 0, revenue: 0, delays: 0 };
      acc[name].count += 1;
      acc[name].cost += ((l.financial?.freightValue || l.freightValue || 0) + (l.financial?.extraCosts || 0));
      acc[name].revenue += (l.financial?.customerFreightValue || 0);
      if (l.expectedDeliveryDate) {
         const expected = new Date(l.expectedDeliveryDate).setHours(23, 59, 59);
         const actual = l.actualDeliveryDate ? new Date(l.actualDeliveryDate).getTime() : now.getTime();
         if ((l.status === LoadStatus.COMPLETED && actual > expected) || (l.status !== LoadStatus.COMPLETED && l.status !== LoadStatus.CANCELLED && now.getTime() > expected)) {
            acc[name].delays += 1;
         }
      }
      return acc;
    }, {} as Record<string, any>);
    
    const carrierRanking = Object.values(carrierMap)
      .map((c: any) => ({ ...c, sla: Math.round(((c.count - c.delays)/c.count)*100) }))
      .sort((a: any, b: any) => b.cost - a.cost).slice(0, 5);

    const timelineMap: Record<string, { revenue: number, cost: number }> = {};
    filtered.forEach(l => {
      const d = new Date(l.date);
      const key = timeFilter === 'month' ? `${d.getDate()}/${d.getMonth()+1}` : `${d.getMonth()+1}/${d.getFullYear().toString().substr(2)}`;
      if (!timelineMap[key]) timelineMap[key] = { revenue: 0, cost: 0 };
      timelineMap[key].revenue += (l.financial?.customerFreightValue || 0);
      timelineMap[key].cost += ((l.financial?.freightValue || l.freightValue || 0) + (l.financial?.extraCosts || 0));
    });
    const financialTrendChart = Object.entries(timelineMap).map(([name, data]) => ({ name, ...data }));

    const cifLoads = filtered.filter(l => l.shippingType === ShippingType.CIF);
    const fobLoads = filtered.filter(l => l.shippingType === ShippingType.FOB);
    const cifRevenue = cifLoads.reduce((acc, l) => acc + (l.financial?.customerFreightValue || 0), 0);
    const pendingDocs = filtered.filter(l => (l.hasDifal || l.clientType === ClientType.NON_CONTRIBUTOR) && (!l.paymentProof || !l.difalGuide) && l.status !== LoadStatus.CANCELLED);
    const highValueLoads = filtered.filter(l => (l.financial?.customerFreightValue || 0) > 10000);

    return {
      kpis: { totalRevenue, totalCost, grossProfit, marginPercent, totalWeight, activeLoads: filtered.filter(l => l.status !== LoadStatus.COMPLETED && l.status !== LoadStatus.CANCELLED).length, slaRate, avgCostPerKg },
      statusDistribution: statusChart,
      carrierPerformance: carrierRanking,
      financialTrend: financialTrendChart,
      cifFobAnalysis: [
        { name: 'CIF (LogiControl)', value: cifLoads.length, revenue: cifRevenue, fill: '#7c3aed', type: ShippingType.CIF },
        { name: 'FOB (Cliente)', value: fobLoads.length, revenue: 0, fill: '#06b6d4', type: ShippingType.FOB }
      ],
      alerts: { fiscal: pendingDocs.length, highValue: highValueLoads.length }
    };
  }, [timeFilter]);

  const renderHeader = () => (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 mb-10 animate-enter">
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 px-4 py-1.5 rounded-full flex items-center gap-2 shadow-sm backdrop-blur-sm animate-pulse-slow">
            <Activity size={14} className="text-brand-accent animate-pulse" />
            <span className="text-[10px] font-black text-slate-600 dark:text-white uppercase tracking-[0.3em]">Logistics Command Center</span>
          </div>
        </div>
        <div className="relative group cursor-default">
          <div className="absolute -left-4 top-0 w-1 h-full bg-gradient-to-b from-brand-accent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          <h1 className="text-4xl lg:text-6xl font-black text-brand-navy dark:text-white uppercase tracking-tighter leading-none mb-2 text-glow group-hover:translate-x-2 transition-transform duration-500">
            Painel <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-cyan animate-pulse-slow">Estratégico</span>
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-[0.3em] group-hover:translate-x-2 transition-transform duration-500 delay-75">
            Visão Consolidada • {currentUser.name.split(' ')[0]} • {timeFilter === 'month' ? 'Mensal' : timeFilter}
          </p>
        </div>
      </div>
      
      <div className="glass-panel p-1.5 rounded-[1.8rem] flex items-center gap-1 shadow-sm relative overflow-hidden">
        {[
          { id: 'week', label: '7 Dias' },
          { id: 'month', label: 'Este Mês' },
          { id: 'quarter', label: 'Trimestre' },
          { id: 'year', label: 'Ano' }
        ].map(opt => (
          <button
            key={opt.id}
            onClick={() => setTimeFilter(opt.id as TimeRange)}
            className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all relative z-10 btn-press ${
              timeFilter === opt.id 
                ? 'text-white shadow-md' 
                : 'text-slate-400 hover:text-brand-navy dark:hover:text-white'
            }`}
          >
            {opt.label}
            {timeFilter === opt.id && (
              <div className="absolute inset-0 bg-brand-navy dark:bg-brand-accent rounded-2xl -z-10 animate-scale-in"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const renderTabs = () => (
    <div className="flex overflow-x-auto scrollbar-none gap-4 mb-8 pb-2">
      {[
        { id: 'overview', icon: BarChart3, label: 'Visão Geral' },
        { id: 'financeiro', icon: Wallet, label: 'DRE & Margens' },
        { id: 'transportadoras', icon: Truck, label: 'Performance (SLA)' },
      ].map((tab, idx) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id as TabType)}
          className={`
            relative flex items-center gap-3 px-8 py-4 rounded-[1.8rem] border transition-all whitespace-nowrap btn-press overflow-hidden group
            ${activeTab === tab.id
              ? 'border-brand-accent text-white shadow-xl'
              : 'bg-transparent border-transparent text-slate-400 hover:text-brand-navy dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
            }
          `}
          style={{ animationDelay: `${idx * 100}ms` }}
        >
          {/* Active Background Animation */}
          {activeTab === tab.id && (
             <div className="absolute inset-0 bg-gradient-to-r from-brand-navy to-brand-navy-light dark:from-brand-accent dark:to-purple-600 rounded-[1.8rem] animate-slide-up-fade -z-10"></div>
          )}
          
          <tab.icon size={18} className={`relative z-10 transition-transform group-hover:scale-110 ${activeTab === tab.id ? 'text-white' : ''}`} />
          <span className="text-[10px] font-black uppercase tracking-widest relative z-10">{tab.label}</span>
        </button>
      ))}
    </div>
  );

  const renderContent = () => {
    // SKELETON LOADING
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
          {[1,2,3,4].map(i => <div key={i} className="h-48 bg-slate-200 dark:bg-white/5 rounded-[2.5rem] border border-slate-300 dark:border-white/5 opacity-50"></div>)}
          <div className="col-span-full h-96 bg-slate-200 dark:bg-white/5 rounded-[3rem] border border-slate-300 dark:border-white/5 opacity-30"></div>
        </div>
      );
    }

    const { kpis, statusDistribution, carrierPerformance, financialTrend, cifFobAnalysis, alerts } = analytics;

    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8 animate-enter">
            {/* KPI ROW */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <StatCard title="Receita Bruta" value={kpis.totalRevenue} icon={DollarSign} color="navy" subtext="Faturamento de Fretes" delay={0} />
              <StatCard title="Custo Logístico" value={kpis.totalCost} icon={Coins} color="white" subtext="Pago a Parceiros" delay={100} />
              <StatCard title="SLA de Entrega" value={`${kpis.slaRate}%`} icon={CheckCircle2} color="green" subtext="Entregas no Prazo" delay={200} />
              <StatCard title="Bloqueios Fiscais" value={alerts.fiscal} icon={AlertTriangle} color="red" subtext="Requer Atenção" onClick={() => handleNavigate('fiscal_pending', true, 'Pendências Fiscais')} delay={300} />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* STATUS PIPELINE */}
              <div className="lg:col-span-2 glass-panel p-8 lg:p-10 rounded-[3rem] shadow-premium animate-enter stagger-4 relative overflow-hidden">
                {/* Decorative Grid */}
                <div className="absolute inset-0 bg-grid-pattern opacity-[0.03] pointer-events-none"></div>
                
                <div className="flex items-center justify-between mb-8 relative z-10">
                   <div>
                     <h3 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest flex items-center gap-2">
                       <Activity size={18} className="text-brand-accent" /> Pipeline Operacional
                     </h3>
                     <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Distribuição Atual de Cargas</p>
                   </div>
                   <div className="hidden sm:flex gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                      <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                   </div>
                </div>
                
                <div className="h-[350px] relative z-10">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statusDistribution} barSize={60} onClick={(data: any) => { if (data && data.activePayload && data.activePayload[0]) handleNavigate('status', data.activePayload[0].payload.statusKey, `Status: ${data.activePayload[0].payload.name}`); }}>
                      <defs>
                        {statusDistribution.map((entry, index) => (
                          <linearGradient key={`grad-${index}`} id={`grad-${index}`} x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={entry.color} stopOpacity={0.8} />
                            <stop offset="95%" stopColor={entry.color} stopOpacity={0.3} />
                          </linearGradient>
                        ))}
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.grid} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: theme.text, fontWeight: 700}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: theme.text}} />
                      <Tooltip content={<CustomTooltip />} cursor={{fill: theme.grid}} />
                      <Bar dataKey="value" radius={[12, 12, 12, 12]}>
                        {statusDistribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={`url(#grad-${index})`} stroke={entry.color} strokeWidth={2} cursor="pointer" className="transition-all duration-300 hover:opacity-80" />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              {/* RISK RADAR */}
              <div className="glass-panel p-8 lg:p-10 rounded-[3rem] shadow-premium relative overflow-hidden group animate-enter stagger-5 flex flex-col">
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/5 dark:bg-brand-accent/20 rounded-full blur-3xl -mr-32 -mt-32 group-hover:scale-150 transition-transform duration-[2000ms]"></div>
                
                <h3 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest flex items-center gap-2 mb-8 relative z-10">
                  <ShieldCheck size={18} className="text-brand-cyan" /> Radar de Risco
                </h3>
                
                <div className="space-y-4 flex-1 relative z-10">
                  {[
                    { label: 'Pendência Fiscal', sub: 'Sem comprovante/DIFAL', val: alerts.fiscal, icon: AlertTriangle, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10', border: 'border-rose-100 dark:border-rose-500/20', action: () => handleNavigate('fiscal_pending', true, 'Pendências Fiscais') },
                    { label: 'Alto Valor', sub: 'Cargas acima de R$ 10k', val: alerts.highValue, icon: Target, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10', border: 'border-amber-100 dark:border-amber-500/20', action: () => handleNavigate('high_value', true, 'Cargas de Alto Valor') },
                    { label: 'Cargas Ativas', sub: 'Em operação', val: kpis.activeLoads, icon: Clock, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-100 dark:border-emerald-500/20', action: () => {} }
                  ].map((item, i) => (
                    <div 
                      key={i} 
                      onClick={item.action} 
                      className={`
                        p-5 rounded-2xl border flex items-center justify-between group/item transition-all duration-300 cursor-pointer
                        bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10
                        hover:scale-[1.02] hover:shadow-lg
                        ${item.border}
                      `}
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                       <div className="flex items-center gap-4">
                          <div className={`p-3 ${item.bg} ${item.color} rounded-xl shadow-inner`}><item.icon size={18} /></div>
                          <div>
                             <h4 className="text-[10px] font-black text-brand-navy dark:text-white uppercase tracking-wide group-hover/item:text-brand-accent transition-colors">{item.label}</h4>
                             <p className="text-[9px] font-bold text-slate-400">{item.sub}</p>
                          </div>
                       </div>
                       <div className={`text-xl font-black ${item.color} font-data flex items-center gap-1`}>
                          <AnimatedValue value={item.val} />
                          {item.val > 0 && <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse mb-3"></span>}
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );

      case 'financeiro':
        return (
          <div className="space-y-8 animate-enter">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <StatCard title="Lucro Operacional" value={kpis.grossProfit} icon={Wallet} color={kpis.grossProfit >= 0 ? "navy" : "red"} subtext={`Margem: ${formatDecimal(kpis.marginPercent)}%`} />
               <StatCard title="Custo Médio / Kg" value={kpis.avgCostPerKg} icon={Package} color="white" subtext="Eficiência de Carga" delay={100} />
               <StatCard title="Share CIF" value={`${Math.round((cifFobAnalysis[0]?.value / (cifFobAnalysis[0]?.value + cifFobAnalysis[1]?.value)) * 100 || 0)}%`} icon={TrendingUp} color="white" subtext="Volume Controlado" onClick={() => handleNavigate('shippingType', 'CIF', 'Cargas CIF')} delay={200} />
            </div>

            <div className="glass-panel p-10 rounded-[3rem] shadow-premium animate-enter stagger-3 relative">
                <div className="flex items-center justify-between mb-8">
                   <div>
                     <h3 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest flex items-center gap-2">
                       <DollarSign size={18} className="text-emerald-500" /> DRE: Receita vs Custo
                     </h3>
                     <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-wider">Spread Financeiro ({timeFilter})</p>
                   </div>
                   <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-500 animate-pulse">
                      <Radar size={20} />
                   </div>
                </div>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={financialTrend}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme.grid} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: theme.text, fontWeight: 700}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: theme.text}} tickFormatter={(val) => `R$ ${val/1000}k`} />
                      <Tooltip content={<CustomTooltip />} cursor={{stroke: '#ce1126', strokeWidth: 1, strokeDasharray: '5 5'}} />
                      <Area type="monotone" dataKey="revenue" name="Receita" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" animationDuration={1500} />
                      <Line type="monotone" dataKey="cost" name="Custo" stroke="#f43f5e" strokeWidth={3} dot={{r: 4, fill: '#f43f5e', strokeWidth: 2, stroke: '#fff'}} animationDuration={2000} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
            </div>
          </div>
        );

      case 'transportadoras':
        return (
          <div className="space-y-8 animate-enter">
             <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="glass-panel p-10 rounded-[3rem] shadow-premium animate-enter stagger-1 h-full">
                 <h3 className="text-sm font-black text-brand-navy dark:text-white uppercase tracking-widest mb-8 flex items-center gap-2">
                   <Truck size={18} className="text-brand-red" /> Ranking por Custo (Spend)
                 </h3>
                 <div className="space-y-6">
                   {carrierPerformance.map((c: any, i: number) => (
                     <div 
                       key={i} 
                       className="flex items-center gap-4 group cursor-pointer p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-white/5 transition-all" 
                       onClick={() => handleNavigate('carrier', c.name, `Transp: ${c.name}`)}
                       style={{ animationDelay: `${i * 100}ms` }}
                     >
                       <div className="w-10 h-10 rounded-xl bg-white dark:bg-white/5 flex items-center justify-center text-[10px] font-black text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-white/5 group-hover:bg-brand-accent group-hover:text-white transition-all shadow-sm">
                         0{i+1}
                       </div>
                       <div className="flex-1">
                         <div className="flex justify-between mb-1.5">
                           <span className="text-[10px] font-black text-brand-navy dark:text-white uppercase group-hover:text-brand-accent transition-colors">{c.name}</span>
                           <span className="text-[10px] font-black text-brand-accent font-data">{formatCurrency(c.cost)}</span>
                         </div>
                         <div className="h-2 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                           <div className="h-full bg-gradient-to-r from-brand-accent to-purple-500 rounded-full transition-all duration-1000 ease-out" style={{ width: `${(c.cost / (carrierPerformance[0]?.cost || 1)) * 100}%` }}></div>
                         </div>
                       </div>
                       <ArrowUpRight size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity -translate-x-2 group-hover:translate-x-0" />
                     </div>
                   ))}
                 </div>
               </div>
             </div>
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="pb-20 p-4 lg:p-0 space-y-6">
      {renderHeader()}
      {renderTabs()}
      <div className="min-h-[500px]">
        {renderContent()}
      </div>
    </div>
  );
};

export default Dashboard;
