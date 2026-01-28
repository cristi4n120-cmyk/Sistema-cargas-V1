import { 
  Load, Client, Carrier, Material, User, SystemSettings, Notification, SystemEvent, WebhookLog,
  LoadStatus, ShippingType, ClientType, MovementType, PaymentType, UserRole, SystemEventType 
} from '../types';

// Chaves do LocalStorage - Atualizadas para v32 (Logs Auditáveis)
const DB_KEYS = {
  LOADS: 'gesla_db_loads_v32',
  CLIENTS: 'gesla_db_clients_v32',
  CARRIERS: 'gesla_db_carriers_v32',
  MATERIALS: 'gesla_db_materials_v32',
  USERS: 'gesla_db_users_v32',
  SETTINGS: 'gesla_db_settings_v32',
  NOTIFICATIONS: 'gesla_db_notifications_v32',
  EVENTS: 'gesla_db_events_v32',
  WEBHOOK_LOGS: 'gesla_db_webhook_logs_v32'
};

// Helper para datas
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
};

// Dados Iniciais (Seed)
const SEED_DATA = {
  SETTINGS: {
    companyName: 'LogiControl',
    companyCnpj: '35.691.397/0001-90',
    portCodePrefix: 'GSL',
    defaultShippingType: ShippingType.FOB,
    autoArchiveDays: 30,
    // MATRIZ DIFAL (ORIGEM PR) - DEFINITIVA
    difalRates: { 
      'AC': 12,   'AL': 13,   'AM': 13,   'AP': 11,
      'BA': 13.5, 'CE': 13,   'DF': 13,   'ES': 10,
      'GO': 12,   'MA': 16,   'MG': 6,    'MS': 10,
      'MT': 10,   'PA': 12,   'PB': 13,   'PE': 13.5,
      'PI': 15.5, 'PR': 0,    'RJ': 10,   'RN': 13,
      'RO': 12.5, 'RR': 13,   'RS': 5,    'SC': 5,
      'SE': 13,   'SP': 6,    'TO': 13
    },
    erpWebhookUrl: '', 
    apiKey: 'ak_live_987654321',
    notificationEmail: 'logistica@logicontrol.com',
    darkMode: false,
    requirePaymentProof: true,
    requireDifalGuide: true,
    notifyOnBilled: true,
    notifyOnCancelled: true,
    lockBilledLoads: true,
    autoDispatchAfterBilling: false,
    enableWhatsAppBot: false,
    whatsappBotNumber: '',
    webhookConfig: {
      active: true,
      url: 'https://hooks.zapier.com/hooks/catch/26225775/ulyv8hk/',
      apiKey: '',
      events: [
        SystemEventType.CARGA_EXPEDIDO,
        SystemEventType.CARGA_CONCLUIDO,
        SystemEventType.CARGA_CANCELADO
      ], 
      filters: [] 
    },
    notificationTemplates: {
      [SystemEventType.CARGA_TRANSITO]: {
        event: SystemEventType.CARGA_TRANSITO,
        enabled: true,
        prefix: "🚚 Carga em Trânsito",
        template: "Carga: *{{codigo}}*\nCliente: {{cliente}}\nDestino: {{cidade}} / {{uf}}\nTransp: {{transportadora}}\nValor: {{valor}}"
      },
      [SystemEventType.CARGA_PATIO]: {
        event: SystemEventType.CARGA_PATIO,
        enabled: true,
        prefix: "🅿️ Carga no Pátio",
        template: "Carga: *{{codigo}}*\nStatus: Chegou na Unidade\nCliente: {{cliente}}\nPlaca: {{placa}}"
      },
      [SystemEventType.CARGA_IDENTIFICADO]: {
        event: SystemEventType.CARGA_IDENTIFICADO,
        enabled: true,
        prefix: "🏷️ Carga Identificada",
        template: "Carga: *{{codigo}}*\nProcesso de conferência iniciado.\nCliente: {{cliente}}"
      },
      [SystemEventType.CARGA_FATURADO]: {
        event: SystemEventType.CARGA_FATURADO,
        enabled: true,
        prefix: "🧾 Carga Faturada",
        template: "Carga: *{{codigo}}*\nFaturamento concluído com sucesso.\nValor NF: {{valor_nf}}\nCliente: {{cliente}}"
      },
      [SystemEventType.CARGA_EXPEDIDO]: {
        event: SystemEventType.CARGA_EXPEDIDO,
        enabled: true,
        prefix: "📤 Carga Expedida",
        template: "Carga: *{{codigo}}*\nStatus: SAIU PARA ENTREGA\nCliente: {{cliente}}\nDestino: {{cidade}} / {{uf}}\nPrevisão: {{previsao}}"
      },
      [SystemEventType.CARGA_CONCLUIDO]: {
        event: SystemEventType.CARGA_CONCLUIDO,
        enabled: true,
        prefix: "✅ Entrega Concluída",
        template: "Carga: *{{codigo}}*\nStatus: FINALIZADO\nCliente: {{cliente}}\nData: {{data}}"
      },
      [SystemEventType.CARGA_CANCELADO]: {
        event: SystemEventType.CARGA_CANCELADO,
        enabled: true,
        prefix: "🚫 Carga Cancelada",
        template: "Carga: *{{codigo}}*\nA operação foi cancelada e arquivada.\nMotivo: Gestão Operacional"
      }
    }
  },
  USERS: [
    { 
        id: '1', name: 'Adrian Oliveira', email: 'logistica@logicontrol.com', role: UserRole.ADMIN, 
        password: 'admin', username: 'adrian', department: 'Gerência de Logística', lastActivity: 'Agora'
    }
  ],
  CLIENTS: [
    {
      id: 'cli_vilagale_001',
      name: 'VILA GALE (SÃO LUIS MA)',
      cnpj: '04.027.102/0015-57',
      contact: 'COMERCIAL',
      email: '', 
      phone: '(84) 9 9981-7879',
      type: ClientType.CONTRIBUTOR,
      zipCode: '65.010-200',
      address: 'RUA ESTRELA',
      number: '421',
      neighborhood: 'PRAIA GRANDE',
      city: 'SÃO LUIS',
      state: 'MA',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  CARRIERS: [
    {
      id: 'car_obal_001',
      name: 'OBAL TRANSPORTES',
      cnpj: '81.472.169/0001-46',
      contact: 'ERONDI',
      email: '',
      phone: '(42) 99800-8070',
      fleetType: 'Pesada / Carretas',
      status: 'Ativo',
      zipCode: '85055-410',
      address: 'RUA INDONESIA',
      number: '173',
      neighborhood: 'CONRADINHO',
      city: 'GUARAPUAVA',
      state: 'PR',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  MATERIALS: [],
  LOADS: [
    {
      id: 'l_001', active: true, createdBy: '1', portCode: 'GSL-25-001', date: daysAgo(35),
      clientId: 'cli_vilagale_001', client: 'VILA GALE', clientType: ClientType.CONTRIBUTOR,
      destinationCity: 'SÃO LUIS', destinationUF: 'MA',
      carrierId: 'car_obal_001', carrier: 'OBAL TRANSPORTES', shippingType: ShippingType.CIF,
      totalWeight: 4500.50, totalVolume: 12.400, 
      financial: {
        freightValue: 3200.00,
        customerFreightValue: 5800.00,
        extraCosts: 150.00,
        invoiceValue: 85000.00,
        currency: 'BRL'
      },
      freightValue: 3200.00, 
      movementType: MovementType.SALE, hasDifal: true, paymentType: PaymentType.BILLED,
      status: LoadStatus.COMPLETED,
      expectedDeliveryDate: daysAgo(30), actualDeliveryDate: daysAgo(31),
      deliveries: [{
        id: 'del_001', clientId: 'cli_vilagale_001', clientName: 'VILA GALE',
        cnpjCpf: '04.027.102/0015-57', clientType: ClientType.CONTRIBUTOR,
        address: { city: 'SÃO LUIS', state: 'MA' }, loadingOrder: 'OC-9882',
        items: [{ id: 'i1', code: 'LR-50-600', description: 'PAINEL LÃ ROCHA 50MM', quantity: 150, unit: 'M2' }]
      }],
      items: [{ id: 'i1', code: 'LR-50-600', description: 'PAINEL LÃ ROCHA 50MM', quantity: 150, unit: 'M2' }],
      updatedAt: daysAgo(30), paymentProof: 'comp_gsl001.pdf', difalGuide: 'gnre_ma.pdf', deliveryProof: 'canhoto_gsl001.jpg',
      vehicle: { type: 'Truck' }, history: []
    }
  ]
};

// Classe Genérica de Tabela com Proteção de Ambiente
class Table<T> {
  private key: string;
  private initialData: any;

  constructor(key: string, initialData: any = []) {
    this.key = key;
    this.initialData = initialData;
    
    // Guard clause for SSR/Node environments
    if (typeof window !== 'undefined') {
      try {
        if (!localStorage.getItem(this.key)) {
          localStorage.setItem(this.key, JSON.stringify(initialData));
        }
      } catch {}
    }
  }

  getAll(): T[] {
    if (typeof window === 'undefined') return this.initialData;
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : [];
    } catch {
      return this.initialData;
    }
  }

  getById(id: string): T | undefined {
    return this.getAll().find((item: any) => item.id === id);
  }

  create(item: T): T {
    if (typeof window === 'undefined') return item;
    try {
      const data = this.getAll();
      const newItem = { ...item }; 
      data.unshift(newItem as any);
      this.save(data);
      return newItem;
    } catch {
      return item;
    }
  }

  update(id: string, updates: Partial<T>): T | null {
    if (typeof window === 'undefined') return null;
    try {
      const data = this.getAll();
      const index = data.findIndex((item: any) => item.id === id);
      if (index === -1) return null;
      
      const updatedItem = { ...data[index], ...updates };
      data[index] = updatedItem;
      this.save(data);
      return updatedItem;
    } catch {
      return null;
    }
  }

  delete(id: string): void {
    if (typeof window === 'undefined') return;
    try {
      const data = this.getAll();
      const filtered = data.filter((item: any) => item.id !== id);
      this.save(filtered);
    } catch {}
  }

  getSettings(): T {
    if (typeof window === 'undefined') return SEED_DATA.SETTINGS as unknown as T;
    try {
        const data = localStorage.getItem(this.key);
        if (data) {
            const parsed = JSON.parse(data);
            
            if (!parsed.webhookConfig) {
                parsed.webhookConfig = SEED_DATA.SETTINGS.webhookConfig;
            } else if (!parsed.webhookConfig.events) {
                parsed.webhookConfig.events = [];
                parsed.webhookConfig.filters = [];
            }
            
            if (!parsed.notificationTemplates) {
                parsed.notificationTemplates = SEED_DATA.SETTINGS.notificationTemplates;
            }
            
            return parsed;
        }
        return SEED_DATA.SETTINGS as unknown as T;
    } catch {
        return SEED_DATA.SETTINGS as unknown as T;
    }
  }

  saveSettings(settings: T): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.key, JSON.stringify(settings));
    } catch {}
  }

  private save(data: T[]) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch {}
  }
}

// Inicializa o Banco de Dados
export const db = {
  loads: new Table<Load>(DB_KEYS.LOADS, SEED_DATA.LOADS),
  clients: new Table<Client>(DB_KEYS.CLIENTS, SEED_DATA.CLIENTS),
  carriers: new Table<Carrier>(DB_KEYS.CARRIERS, SEED_DATA.CARRIERS),
  materials: new Table<Material>(DB_KEYS.MATERIALS, SEED_DATA.MATERIALS),
  users: new Table<User>(DB_KEYS.USERS, SEED_DATA.USERS),
  notifications: new Table<Notification>(DB_KEYS.NOTIFICATIONS, []),
  events: new Table<SystemEvent>(DB_KEYS.EVENTS, []),
  webhookLogs: new Table<WebhookLog>(DB_KEYS.WEBHOOK_LOGS, []),
  settings: new Table<SystemSettings>(DB_KEYS.SETTINGS, SEED_DATA.SETTINGS),
  
  // Utilitário para limpar o banco (reset)
  resetDatabase: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.clear();
        window.location.reload();
      } catch {}
    }
  }
};