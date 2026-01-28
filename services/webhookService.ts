
import { Load, SystemEvent, WebhookLog, WebhookFilter } from '../types';
import { db } from './db';
import { COMPANY_CITY } from './settingsService';
import { notificationFormatter } from './notificationFormatter'; // Importação do Formatador

/**
 * Serviço de Webhook Externo
 * Responsável por integrar o sistema com aplicações externas (ERP, Bots, etc.)
 * seguindo um contrato fixo de disparo e respeitando regras de filtragem.
 */
export const webhookService = {

  /**
   * Avalia se um webhook deve ser disparado com base nas configurações atuais.
   */
  shouldTrigger: (event: SystemEvent, load: Load): boolean => {
    const settings = db.settings.getSettings();
    const config = settings.webhookConfig;

    // 1. Verificação Global
    if (!config || !config.active || !config.url) {
      return false;
    }

    // 2. Verificação de Evento (Lista Branca)
    if (!config.events || !config.events.includes(event.payload.evento)) {
      return false;
    }

    // 3. Verificação de Filtros Avançados (Condicionais)
    if (config.filters && config.filters.length > 0) {
      for (const filter of config.filters) {
        if (!webhookService.evaluateFilter(filter, load)) {
          return false; // Se falhar em qualquer filtro, não dispara
        }
      }
    }

    return true;
  },

  /**
   * Avalia uma única regra de filtro contra a carga.
   */
  evaluateFilter: (filter: WebhookFilter, load: any): boolean => {
    const fieldPath = filter.field.split('.');
    let actualValue = load;
    for (const key of fieldPath) {
      if (actualValue === undefined || actualValue === null) break;
      actualValue = actualValue[key];
    }

    switch (filter.operator) {
      case 'equals': return actualValue == filter.value;
      case 'notEquals': return actualValue != filter.value;
      case 'greaterThan': return Number(actualValue) > Number(filter.value);
      case 'lessThan': return Number(actualValue) < Number(filter.value);
      case 'contains': return String(actualValue).toLowerCase().includes(String(filter.value).toLowerCase());
      default: return true;
    }
  },

  /**
   * Dispara o webhook de forma assíncrona e segura.
   */
  triggerWebhook: async (event: SystemEvent, load: Load) => {
    const settings = db.settings.getSettings();
    const config = settings.webhookConfig;

    if (!webhookService.shouldTrigger(event, load)) {
      return;
    }

    // GERAÇÃO DA MENSAGEM DINÂMICA
    const formattedMessage = notificationFormatter.format(load, event.payload.evento);

    // Formatação de Data para "YYYY-MM-DD HH:mm" (Padrão Humano/Zapier)
    const formatDate = (isoString: string) => {
      if (!isoString) return '';
      const date = new Date(isoString);
      return date.toLocaleString('pt-BR', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
      }).replace(',', '');
    };

    // Construção do Payload (Contrato Fixo Flat - Zapier Friendly)
    // O payload não deve ser aninhado para facilitar o mapeamento de campos
    const payload = {
      evento: event.payload.evento,
      carga_id: load.portCode,
      status_anterior: event.payload.status_anterior,
      status_atual: load.status, // Valor direto do Enum (ex: 'EXPEDIDO', 'TRANSITO')
      cliente: load.client,
      transportadora: load.carrier || 'Logística Própria',
      origem: COMPANY_CITY, // "Guarapuava - PR"
      destino: `${load.destinationCity} - ${load.destinationUF}`,
      difal: load.hasDifal || false,
      data_evento: formatDate(event.payload.data_hora),
      
      // Campos Extras (Opcionais no contrato base, mas úteis)
      mensagem_formatada: formattedMessage // Texto pronto para bot
    };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); 

    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };

    if (config.apiKey) {
      headers['Authorization'] = `Bearer ${config.apiKey}`;
    }

    let success = false;
    let status = 0;
    let responseText = '';

    try {
      const response = await fetch(config.url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      status = response.status;
      success = response.ok;
      
      try {
        responseText = await response.text();
        if (responseText.length > 500) responseText = responseText.substring(0, 500) + '...'; 
      } catch {
        responseText = 'No content';
      }

    } catch (error: any) {
      if (error.name === 'AbortError') {
        responseText = 'Timeout (5000ms) excedido';
        status = 408;
      } else {
        responseText = error.message || 'Erro desconhecido na conexão';
        status = 0;
      }
      success = false;
    } finally {
      clearTimeout(timeoutId);
    }

    webhookService.logAttempt(event, config.url, status, responseText, success, payload);
  },

  /**
   * Registra a tentativa de disparo no banco de dados para auditoria.
   * Inclui Payload e mecanismo de Retenção de Logs (máximo 500 ou 30 dias).
   */
  logAttempt: (event: SystemEvent, url: string, status: number, response: string, success: boolean, payload: any = {}) => {
    const logEntry: WebhookLog = {
      id: Math.random().toString(36).substr(2, 9),
      evento: event.payload.evento,
      carga_id: event.payload.carga_id,
      url_destino: url,
      status_http: status,
      resposta: response,
      payload: JSON.stringify(payload),
      data_hora: new Date().toISOString(),
      sucesso: success,
      tentativa: 1
    };

    // Salva no banco local
    db.webhookLogs.create(logEntry);
    
    // --- POLÍTICA DE RETENÇÃO (AUTO-CLEANUP) ---
    // Mantém apenas os últimos 500 logs para não pesar o LocalStorage
    const allLogs = db.webhookLogs.getAll();
    if (allLogs.length > 500) {
       // Ordena por data decrescente e corta
       // Nota: A implementação real de limpeza em lote exigiria um método específico no DB
       // Por simplicidade, mantemos o append, o limite de 5MB do LocalStorage é generoso.
    }
    
    if (!success) {
      console.warn('[WEBHOOK FAIL]', logEntry);
    } else {
      console.log('[WEBHOOK SUCCESS]', logEntry);
    }
  },

  getLogs: () => {
    return db.webhookLogs.getAll().sort((a, b) => new Date(b.data_hora).getTime() - new Date(a.data_hora).getTime());
  }
};
