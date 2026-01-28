
import { Load, LoadStatus, SystemEvent, SystemEventType } from '../types';
import { db } from './db';
import { userService } from './userService';
import { webhookService } from './webhookService'; // Importação do Serviço de Webhook

/**
 * Serviço de Eventos do Sistema
 * Responsável por padronizar, criar e persistir eventos de mudança de status
 * para auditoria e futuras integrações.
 */
export const eventService = {
  
  /**
   * Mapeia o Status da Carga para o Tipo de Evento correspondente.
   */
  mapStatusToEventType: (status: LoadStatus): SystemEventType => {
    switch (status) {
      case LoadStatus.TRANSIT: return SystemEventType.CARGA_TRANSITO;
      case LoadStatus.ARRIVED: return SystemEventType.CARGA_PATIO;
      case LoadStatus.IDENTIFIED: return SystemEventType.CARGA_IDENTIFICADO;
      case LoadStatus.BILLED: return SystemEventType.CARGA_FATURADO;
      case LoadStatus.DISPATCHED: return SystemEventType.CARGA_EXPEDIDO;
      case LoadStatus.COMPLETED: return SystemEventType.CARGA_CONCLUIDO;
      case LoadStatus.CANCELLED: return SystemEventType.CARGA_CANCELADO;
      default: return SystemEventType.CARGA_TRANSITO; // Fallback seguro
    }
  },

  /**
   * Dispara um evento de sistema se houver mudança de status.
   * Deve ser chamado APÓS a persistência da carga no banco.
   */
  dispatch: (load: Load, previousStatus: LoadStatus | null) => {
    // Regra de Não Duplicidade: Só dispara se o status mudou
    if (previousStatus === load.status) {
      return null;
    }

    const currentUser = userService.getCurrentUser();
    const eventType = eventService.mapStatusToEventType(load.status);

    const newEvent: SystemEvent = {
      id: Math.random().toString(36).substr(2, 12),
      processed: false, // Flag para workers futuros (webhooks/email)
      payload: {
        evento: eventType,
        carga_id: load.portCode,
        status_anterior: previousStatus ? previousStatus.toUpperCase() : 'N/A',
        status_atual: load.status.toUpperCase().replace(' ', '_'), // Normaliza status composta
        data_hora: new Date().toISOString(),
        usuario_responsavel: currentUser.id,
        metadata: {
          load_db_id: load.id,
          carrier: load.carrier || 'N/A',
          destination: `${load.destinationCity}/${load.destinationUF}`
        }
      }
    };

    // 1. Persistência Interna
    db.events.create(newEvent);
    
    // Log para debug em dev
    console.log(`[EVENT BUS] Dispatched: ${eventType}`, newEvent);

    // 2. Disparo de Webhook Externo (Assíncrono - Fire & Forget)
    // Não aguardamos o resultado para não bloquear a UI do operador
    webhookService.triggerWebhook(newEvent, load).catch(err => {
      console.error('[CRITICAL] Webhook service failure', err);
    });

    return newEvent;
  },

  /**
   * Recupera o histórico de eventos de uma carga específica.
   */
  getEventsByLoad: (portCode: string) => {
    const allEvents = db.events.getAll();
    return allEvents
      .filter(e => e.payload.carga_id === portCode)
      .sort((a, b) => new Date(b.payload.data_hora).getTime() - new Date(a.payload.data_hora).getTime());
  }
};
