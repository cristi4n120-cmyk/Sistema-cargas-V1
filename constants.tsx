
import React from 'react';
import { 
  LayoutDashboard, 
  Truck, 
  Settings, 
  MapPin,
  ClipboardCheck,
  FileCheck2,
  LogOut,
  Ban,
  Users,
  Navigation,
  Building2,
  Briefcase,
  Package,
  FileBarChart,
  UserCog,
  ShieldCheck,
  Globe,
  Archive,
  History
} from 'lucide-react';
import { LoadStatus } from './types';

export const COLORS = {
  navy: '#0a1128',
  red: '#ce1126',
  slate: '#64748b'
};

export const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

// --- MATRIZ TRIBUTÁRIA OFICIAL (BASE 2025/2026) ---
// Origem Fixa: Paraná (PR)
export const TAX_DEFAULTS = {
  ORIGIN: 'PR',
  // Regra Interestadual (Saindo do Sul/Sudeste)
  INTERSTATE: {
    SOUTH_SOUTHEAST: 12, // Destino: RS, SC, PR, SP, MG, RJ
    OTHERS: 7 // Destino: Norte, Nordeste, Centro-Oeste + ES
  },
  // Alíquotas Internas (Modal Geral 2025)
  INTERNAL_RATES: {
    'AC': 19,   'AL': 19,   'AM': 20,   'AP': 18, 
    'BA': 20.5, 'CE': 20,   'DF': 20,   'ES': 17, 
    'GO': 19,   'MA': 22,   'MG': 18,   'MS': 17, 
    'MT': 17,   'PA': 19,   'PB': 20,   'PE': 20.5, 
    'PI': 21,   'PR': 19.5, 'RJ': 22,   'RN': 18, 
    'RO': 17.5, 'RR': 20,   'RS': 17,   'SC': 17, 
    'SE': 19,   'SP': 18,   'TO': 20
  } as Record<string, number>
};

export const PAYMENT_TERMS = ['7 dias', '14 dias', '28 dias', '30 dias', '60 dias', '90 dias'];

export interface NavGroup {
  label: string;
  items: {
    name: string;
    path: string;
    icon: React.ReactNode;
  }[];
}

export const NAVIGATION_GROUPS: NavGroup[] = [
  {
    label: 'Relatórios & BI',
    items: [
      { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    ]
  },
  {
    label: 'Operacional',
    items: [
      { name: 'Controle de Cargas', path: '/loads', icon: <Truck size={20} /> },
      { name: 'Histórico', path: '/loads/history', icon: <History size={20} /> },
    ]
  },
  {
    label: 'Cadastros Base',
    items: [
      { name: 'Clientes', path: '/clients', icon: <Briefcase size={20} /> },
      { name: 'Transportadoras', path: '/carriers', icon: <Building2 size={20} /> },
      { name: 'Materiais (SKU)', path: '/materials', icon: <Package size={20} /> },
    ]
  },
  {
    label: 'Administração',
    items: [
      { name: 'Equipe Gesla', path: '/users', icon: <Users size={20} /> },
      { name: 'Configurações', path: '/settings', icon: <Settings size={20} /> },
    ]
  }
];

// Mapeamento Centralizado de Cores Semânticas
export const STATUS_COLORS: Record<LoadStatus, string> = {
  [LoadStatus.TRANSIT]: 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20',
  [LoadStatus.ARRIVED]: 'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-500/20',
  [LoadStatus.IDENTIFIED]: 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-200 dark:border-indigo-500/20',
  [LoadStatus.BILLED]: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20',
  [LoadStatus.DISPATCHED]: 'bg-violet-50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-200 dark:border-violet-500/20',
  [LoadStatus.COMPLETED]: 'bg-slate-50 dark:bg-slate-500/10 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-500/20',
  // CANCELLED: Light Mode (Rose) | Dark Mode (Violet/Accent stylization)
  [LoadStatus.CANCELLED]: 'bg-rose-50 dark:bg-violet-500/5 text-rose-600 dark:text-violet-400 border-rose-200 dark:border-violet-500/10',
};

// Cores Hex para Gráficos e Elementos não-Tailwind
export const STATUS_HEX: Record<LoadStatus, string> = {
  [LoadStatus.TRANSIT]: '#3b82f6', // blue-500
  [LoadStatus.ARRIVED]: '#f59e0b', // amber-500
  [LoadStatus.IDENTIFIED]: '#6366f1', // indigo-500
  [LoadStatus.BILLED]: '#10b981', // emerald-500
  [LoadStatus.DISPATCHED]: '#8b5cf6', // violet-500
  [LoadStatus.COMPLETED]: '#64748b', // slate-500
  [LoadStatus.CANCELLED]: '#f43f5e', // rose-500
};

export const STATUS_ICONS: Record<LoadStatus, React.ReactNode> = {
  [LoadStatus.TRANSIT]: <Navigation size={14} />,
  [LoadStatus.ARRIVED]: <MapPin size={14} />,
  [LoadStatus.IDENTIFIED]: <ClipboardCheck size={14} />,
  [LoadStatus.BILLED]: <FileCheck2 size={14} />,
  [LoadStatus.DISPATCHED]: <LogOut size={14} />,
  [LoadStatus.COMPLETED]: <Archive size={14} />,
  [LoadStatus.CANCELLED]: <Ban size={14} />,
};
