
import { Load, SystemEventType, ClientType } from '../types';
import { db } from './db';
import { formatCurrency } from '../utils/formatters';

/**
 * Serviço de Formatação de Notificações
 * Transforma dados técnicos da carga em mensagens humanizadas para bots (WhatsApp/Telegram).
 */
export const notificationFormatter = {

  /**
   * Gera a mensagem final processada com base no template do evento e dados da carga.
   */
  format: (load: Load, eventType: SystemEventType): string => {
    const settings = db.settings.getSettings();
    const templateConfig = settings.notificationTemplates?.[eventType];

    // Fallback de segurança se não houver template configurado
    if (!templateConfig || !templateConfig.enabled) {
      return `Atualização de Carga: ${load.portCode} - Novo Status: ${load.status}`;
    }

    let message = `*${templateConfig.prefix}*\n\n${templateConfig.template}`;

    // --- SUBSTITUIÇÃO DE VARIÁVEIS (PLACEHOLDERS) ---
    
    // Dados Básicos
    message = message.replace('{{codigo}}', load.portCode || 'N/A');
    message = message.replace('{{status}}', load.status || 'N/A');
    message = message.replace('{{cliente}}', load.client || 'Cliente não informado');
    message = message.replace('{{cidade}}', load.destinationCity || '---');
    message = message.replace('{{uf}}', load.destinationUF || 'UF');
    message = message.replace('{{transportadora}}', load.carrier || 'Logística Própria');
    message = message.replace('{{placa}}', load.vehicle?.plate || 'Não informada');
    
    // Dados Financeiros e Datas
    const revenue = load.financial?.customerFreightValue || 0;
    const invoiceVal = load.financial?.invoiceValue || 0;
    message = message.replace('{{valor}}', formatCurrency(revenue));
    message = message.replace('{{valor_nf}}', formatCurrency(invoiceVal));
    
    const dateStr = new Date().toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    message = message.replace('{{data}}', dateStr);
    
    const prevDate = load.expectedDeliveryDate 
      ? new Date(load.expectedDeliveryDate).toLocaleDateString('pt-BR') 
      : 'A definir';
    message = message.replace('{{previsao}}', prevDate);

    // --- BLOCOS CONDICIONAIS INTELIGENTES ---

    // 1. Alerta de DIFAL
    const hasDifal = load.hasDifal || load.clientType === ClientType.NON_CONTRIBUTOR;
    if (hasDifal) {
      message += `\n\n⚠️ *Atenção Fiscal:* Incidência de DIFAL (${load.destinationUF})`;
    }

    // 2. Alerta de Multientrega
    if (load.deliveries && load.deliveries.length > 1) {
      message += `\n📦 *Multientrega:* ${load.deliveries.length} destinos nesta rota.`;
    }

    // 3. Fallback para campos vazios (Limpeza final)
    // Remove linhas que ficaram com placeholders não substituídos (se houver algum customizado fora do padrão)
    message = message.replace(/\{\{.*?\}\}/g, '---');

    return message;
  }
};
