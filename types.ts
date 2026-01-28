
export enum ShippingType {
  FOB = 'FOB',
  CIF = 'CIF'
}

export enum ClientType {
  CONTRIBUTOR = 'Contribuinte',
  NON_CONTRIBUTOR = 'Não contribuinte'
}

export enum MovementType {
  SALE = 'Venda',
  SALE_FINAL_CONSUMER = 'Venda consumidor final',
  SAMPLE = 'Amostra',
  TRIANGULATION = 'Triangulação',
  SALE_NON_CONTRIBUTOR = 'Venda não contribuinte',
  FUTURE_DELIVERY = 'Entrega futura',
  SIMPLE_REMITTANCE = 'Simples remessa',
  EXPORT = 'Exportação'
}

export enum PaymentType {
  CASH = 'À vista',
  BILLED = 'Faturado'
}

export enum LoadStatus {
  TRANSIT = 'Em Trânsito',
  ARRIVED = 'Chegou',
  IDENTIFIED = 'Identificado',
  BILLED = 'Faturado',
  DISPATCHED = 'Saiu',
  COMPLETED = 'Concluído',
  CANCELLED = 'Cancelado'
}

// --- SISTEMA DE EVENTOS ---
export enum SystemEventType {
  CARGA_TRANSITO = 'CARGA_TRANSITO',
  CARGA_PATIO = 'CARGA_PATIO',
  CARGA_IDENTIFICADO = 'CARGA_IDENTIFICADO',
  CARGA_FATURADO = 'CARGA_FATURADO',
  CARGA_EXPEDIDO = 'CARGA_EXPEDIDO',
  CARGA_CONCLUIDO = 'CARGA_CONCLUIDO',
  CARGA_CANCELADO = 'CARGA_CANCELADO' // Adicionado por segurança para cobrir todo o enum de Status
}

export interface SystemEventPayload {
  evento: SystemEventType;
  carga_id: string;
  status_anterior: string;
  status_atual: string;
  data_hora: string;
  usuario_responsavel: string;
  metadata?: any; // Campo flexível para dados extras futuros
}

export interface SystemEvent {
  id: string;
  payload: SystemEventPayload;
  processed: boolean; // Flag para indicar se integrações futuras (ex: webhook) processaram
}

// --- WEBHOOKS & INTEGRAÇÕES ---

export type WebhookFilterOperator = 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains';

export interface WebhookFilter {
  id: string;
  field: string; // Ex: 'hasDifal', 'financial.customerFreightValue', 'clientType'
  operator: WebhookFilterOperator;
  value: any;
  label: string; // Nome legível do filtro (ex: "Apenas com DIFAL")
}

export interface NotificationTemplate {
  event: SystemEventType;
  enabled: boolean;
  prefix: string; // Título/Emoji (ex: "🚚 Carga em Trânsito")
  template: string; // Corpo da mensagem com placeholders
}

export interface WebhookConfig {
  active: boolean;
  url: string;
  apiKey: string;
  events: SystemEventType[]; // Lista de eventos habilitados para disparo
  filters: WebhookFilter[];  // Lista de condições que devem ser verdadeiras
}

export interface WebhookLog {
  id: string;
  evento: SystemEventType;
  carga_id: string;
  url_destino: string;
  status_http: number; // 0 se falhar antes do envio
  resposta: string;
  payload: string; // JSON string do que foi enviado
  data_hora: string;
  sucesso: boolean;
  tentativa: number;
}

export enum UserRole {
  ADMIN = 'Administrador',
  OPERATOR = 'Operador Logístico',
  VIEWER = 'Visualizador'
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  email: string;
  avatar?: string;
  username?: string;
}

export interface Carrier {
  id: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  name: string;
  cnpj: string;
  contact: string;
  email: string;
  phone: string;
  status: 'Ativo' | 'Inativo';
  fleetType?: string;
  zipCode: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Client {
  id: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
  name: string;
  cnpj: string;
  contact: string;
  email: string;
  phone: string;
  type: ClientType;
  zipCode: string;
  address: string;
  number: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface Material {
  id: string;
  code: string;
  description: string;
  unit: string;
  category: string;
  status: 'Ativo' | 'Inativo';
}

export interface LoadItem {
  id: string;
  code: string;
  description: string;
  quantity: number;
  unit: string;
  category?: string;
}

export interface DeliveryPoint {
  id: string;
  clientId: string;
  clientName: string;
  cnpjCpf: string;
  clientType: ClientType;
  address: {
    city: string;
    state: string;
    fullAddress?: string;
  };
  loadingOrder: string;
  items: LoadItem[];
}

// --- NOVAS ESTRUTURAS DE DADOS INTELIGENTES ---

export interface LoadStatusEvent {
  status: LoadStatus;
  timestamp: string;
  userId: string;
  notes?: string;
}

export interface VehicleData {
  type: string; // Ex: Truck, Carreta, Toco
  plate?: string;
  driverName?: string;
  driverPhone?: string;
  estimatedCapacityKg?: number; // Para cálculo de ocupação
}

export interface FinancialData {
  freightValue: number; // Custo (Pago ao Motorista/Parceiro)
  customerFreightValue?: number; // Receita (Cobrado do Cliente)
  extraCosts: number; // Pedágios, Descargas, Taxas
  tollValue?: number;
  invoiceValue: number; // Valor da Mercadoria (Nota Fiscal)
  currency: string;
}

export interface Load {
  id: string;
  active: boolean;
  createdBy: string;
  portCode: string;
  date: string; // Data de Criação
  
  // Dados de SLA (Previsão vs Real)
  expectedDeliveryDate?: string; // Data Alvo (Meta)
  actualDeliveryDate?: string;   // Data Real (Performance)
  
  // Campos Denormalizados
  clientId?: string; 
  client: string; 
  cnpjCpf?: string;
  clientType: ClientType;
  destinationCity: string;
  destinationUF: string;
  
  deliveries: DeliveryPoint[];

  carrierId?: string;
  carrier?: string;
  shippingType: ShippingType;
  
  // Estruturas Agrupadas
  vehicle: VehicleData;
  financial: FinancialData;
  history: LoadStatusEvent[]; // Log de alterações para Analytics

  // Legado (Mantido para compatibilidade onde necessário)
  totalWeight?: number; 
  totalVolume?: number; 
  freightValue?: number; // Atalho para financial.freightValue
  items: LoadItem[]; 
  
  movementType: MovementType;
  logisticsNotes?: string;
  
  hasDifal: boolean;
  difalPercent?: number;
  canComplement: boolean;
  paymentType: PaymentType;
  paymentTerm?: string;
  paymentNotes?: string;
  status: LoadStatus;
  
  updatedAt: string;
  paymentProof?: string;
  difalGuide?: string;
}

export interface SystemSettings {
  companyName: string;
  companyCnpj: string;
  portCodePrefix: string;
  defaultShippingType: ShippingType;
  autoArchiveDays: number;
  difalRates: Record<string, number>;
  erpWebhookUrl: string;
  apiKey: string;
  notificationEmail: string;
  darkMode: boolean;
  requirePaymentProof: boolean;
  requireDifalGuide: boolean;
  notifyOnBilled: boolean;
  notifyOnCancelled: boolean;
  lockBilledLoads: boolean;
  autoDispatchAfterBilling: boolean;
  enableWhatsAppBot: boolean;
  whatsappBotNumber: string;
  // Configuração Específica de Webhook Genérico
  webhookConfig: WebhookConfig;
  // Templates de Mensagem (WhatsApp/Bot)
  notificationTemplates: Record<string, NotificationTemplate>;
}

export type NotificationType = 'success' | 'info' | 'warning' | 'danger' | 'whatsapp';

export interface Notification {
  id: string;
  title: string;
  description: string;
  type: NotificationType;
  time: string;
  read: boolean;
  link?: string;
}

export interface OperationUnit {
  id: string;
  name: string;
  state: string;
  code: string;
}
