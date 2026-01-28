
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
    companyName: 'Gesla Isolamentos',
    companyCnpj: '35.691.397/0001-90',
    portCodePrefix: 'GSL',
    defaultShippingType: ShippingType.FOB,
    autoArchiveDays: 30,
    // MATRIZ DIFAL (ORIGEM PR) - DEFINITIVA
    // Base de Cálculo: Alíquota Interna Destino - Interestadual
    difalRates: { 
      'AC': 12,   'AL': 13,   'AM': 13,   'AP': 11,
      'BA': 13.5, 'CE': 13,   'DF': 13,   'ES': 10,
      'GO': 12,   'MA': 16,   'MG': 6,    'MS': 10,
      'MT': 10,   'PA': 12,   'PB': 13,   'PE': 13.5,
      'PI': 15.5, 'PR': 0,    'RJ': 10,   'RN': 13,
      'RO': 12.5, 'RR': 13,   'RS': 5,    'SC': 5,
      'SE': 13,   'SP': 6,    'TO': 13
    },
    erpWebhookUrl: '', // Mantido para retrocompatibilidade
    apiKey: 'ak_live_987654321', // Mantido para retrocompatibilidade
    notificationEmail: 'logistica@geslaisolamentos.com',
    darkMode: false,
    requirePaymentProof: true,
    requireDifalGuide: true,
    notifyOnBilled: true,
    notifyOnCancelled: true,
    lockBilledLoads: true,
    autoDispatchAfterBilling: false,
    enableWhatsAppBot: false,
    whatsappBotNumber: '',
    // Configuração de Webhook Externo
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
    // Templates de Notificação Padrão
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
        id: '1', name: 'Adrian Oliveira', email: 'logistica@geslaisolamentos.com', role: UserRole.ADMIN, 
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
    },
    {
      id: 'cli_engecass_001',
      name: 'ENGECASS CALDEIRAS',
      cnpj: '02.913.450/0001-09',
      contact: 'SANDRO',
      email: '',
      phone: '(47) 98847-2999',
      type: ClientType.CONTRIBUTOR,
      zipCode: '89162-850',
      address: 'RUA DOS VEREADORES',
      number: '410',
      neighborhood: 'VALADA ITOUPAVA',
      city: 'RIO DO SUL',
      state: 'SC',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cli_hilder_001',
      name: 'HILDER GABRIEL DE OLIVEIRA',
      cnpj: '24.392.727/0001-20',
      contact: 'FRANK',
      email: '',
      phone: '(41) 9509-5619',
      type: ClientType.CONTRIBUTOR,
      zipCode: '83410-360',
      address: 'R GUARANIACU',
      number: '89',
      neighborhood: 'PALOMA',
      city: 'COLOMBO',
      state: 'PR',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cli_benecke_001',
      name: 'BENECKE',
      cnpj: '86.375.656/0001-04',
      contact: 'WILLIAM',
      email: '',
      phone: '(47) 93382-2222',
      type: ClientType.CONTRIBUTOR,
      zipCode: '89120-971',
      address: 'RUA FRITZ LORENZ',
      number: '2170',
      neighborhood: 'CENTRO',
      city: 'TIMBÓ',
      state: 'SC',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cli_icavi_001',
      name: 'ICAVI - IND DE CALDEIRAS',
      cnpj: '07.386.836/0001-15',
      contact: 'MARCO',
      email: '',
      phone: '(47) 93545-8200',
      type: ClientType.CONTRIBUTOR,
      zipCode: '89173-000',
      address: 'RODOVIA BR 470 KM 171',
      number: 'SN',
      neighborhood: 'DISTRITO DE ATERRADO',
      city: 'POUSO REDONDO',
      state: 'SC',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cli_drytec_001',
      name: 'DRYTEC LTDA',
      cnpj: '63.721.181/0001-65',
      contact: 'LIA',
      email: '',
      phone: '(47) 9760-2111',
      type: ClientType.CONTRIBUTOR,
      zipCode: '89030-000',
      address: 'RUA CARLOS JENSEN',
      number: '204',
      neighborhood: 'ITOUPAVA SECA',
      city: 'BLUMENAU',
      state: 'SC',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cli_amdecor_001',
      name: 'AM DECOR',
      cnpj: '27.582.943/0001-26',
      contact: 'MARCELO',
      email: '',
      phone: '(54) 99973-0796',
      type: ClientType.CONTRIBUTOR,
      zipCode: '95000-000',
      address: 'MUNICIPAL VALENTINO VENTURIN',
      number: '920',
      neighborhood: 'MONTE BERICO',
      city: 'CAXIAS DO SUL',
      state: 'RS',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'cli_jpisolamentos_001',
      name: 'JP ISOLAMENTOS',
      cnpj: '52.954.963/0001-28',
      contact: 'ANDRÉ',
      email: '',
      phone: '(11) 2954-9767',
      type: ClientType.CONTRIBUTOR,
      zipCode: '06401-090',
      address: 'ALAMEDA RIO PRETO',
      number: '752',
      neighborhood: 'TAMBORE',
      city: 'BARUERI',
      state: 'SP',
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
    },
    {
      id: 'car_rodonaves_001',
      name: 'RTE RODONAVES',
      cnpj: '44.914.992/0001-38',
      contact: 'COMERCIAL',
      email: 'cotacao@rodonaves.com.br',
      phone: '(16) 2101-9999',
      fleetType: 'Média / Trucks',
      status: 'Ativo',
      zipCode: '14075-260',
      address: 'AVENIDA PRESIDENTE KENNEDY',
      number: '2000',
      neighborhood: 'RIBEIRANIA',
      city: 'RIBEIRÃO PRETO',
      state: 'SP',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'car_jrg_001',
      name: 'JRG DE LARA TRANSPORTES',
      cnpj: '54.865.166/0001-08',
      contact: 'COMERCIAL',
      email: '',
      phone: '(41) 9 9545-2155',
      fleetType: 'Geral',
      status: 'Ativo',
      zipCode: '81480-326',
      address: 'RUA JANGUITO DO ROSÁRIO',
      number: '50',
      neighborhood: 'TATUQUARA',
      city: 'CURITIBA',
      state: 'PR',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'car_queritos_001',
      name: 'QUERITOS TRANSPORTES',
      cnpj: '23.815.722/0007-08',
      contact: 'COMERCIAL',
      email: '',
      phone: '(41) 9 8894-3890',
      fleetType: 'Geral',
      status: 'Ativo',
      zipCode: '83825-380',
      address: 'RUA LUCINIR FRANCO DA ROCHA',
      number: '241',
      neighborhood: 'VENEZA',
      city: 'FAZENDA RIO GRANDE',
      state: 'PR',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'car_hf_001',
      name: 'H.F SOLUÇÕES',
      cnpj: '58.075.757/0001-24',
      contact: 'COMERCIAL',
      email: '',
      phone: '(41) 9 9739-5155',
      fleetType: 'Geral',
      status: 'Ativo',
      zipCode: '81540-250',
      address: 'RUA NICOLAU COPÉRNICO',
      number: '41',
      neighborhood: 'JARDIM DAS AMÉRICAS',
      city: 'CURITIBA',
      state: 'PR',
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  MATERIALS: [
    // MATERIAIS ZERADOS
  ],
  LOADS: [
    // 1. CARGA FINALIZADA (MA) - Histórico (MANTIDO APENAS COMO REFERÊNCIA HISTÓRICA)
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
      updatedAt: daysAgo(30), paymentProof: 'comp_gsl001.pdf', difalGuide: 'gnre_ma.pdf', deliveryProof: 'canhoto_gsl001.jpg'
    }
  ]
};

// Classe Genérica de Tabela
class Table<T> {
  private key: string;

  constructor(key: string, initialData: any = []) {
    this.key = key;
    if (!localStorage.getItem(this.key)) {
      localStorage.setItem(this.key, JSON.stringify(initialData));
    }
  }

  getAll(): T[] {
    const data = localStorage.getItem(this.key);
    return data ? JSON.parse(data) : [];
  }

  getById(id: string): T | undefined {
    return this.getAll().find((item: any) => item.id === id);
  }

  create(item: T): T {
    const data = this.getAll();
    const newItem = { ...item }; // Clone
    data.unshift(newItem as any);
    this.save(data);
    return newItem;
  }

  update(id: string, updates: Partial<T>): T | null {
    const data = this.getAll();
    const index = data.findIndex((item: any) => item.id === id);
    if (index === -1) return null;
    
    const updatedItem = { ...data[index], ...updates };
    data[index] = updatedItem;
    this.save(data);
    return updatedItem;
  }

  delete(id: string): void {
    const data = this.getAll();
    const filtered = data.filter((item: any) => item.id !== id);
    this.save(filtered);
  }

  // Específico para Settings (Objeto único, não array)
  getSettings(): T {
    const data = localStorage.getItem(this.key);
    if (data) {
        const parsed = JSON.parse(data);
        
        // --- MIGRAÇÃO V31: Garantir que novos campos existam ---
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
  }

  saveSettings(settings: T): void {
    localStorage.setItem(this.key, JSON.stringify(settings));
  }

  private save(data: T[]) {
    localStorage.setItem(this.key, JSON.stringify(data));
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
    localStorage.clear();
    window.location.reload();
  }
};
