
import { Notification } from '../types';
import { db } from './db';

export const notificationService = {
  getNotifications: (): Notification[] => {
    return db.notifications.getAll();
  },

  markAsRead: (id: string) => {
    db.notifications.update(id, { read: true });
    window.dispatchEvent(new Event('notificationsChanged'));
  },

  markAllAsRead: () => {
    const notifs = db.notifications.getAll();
    const updated = notifs.map(n => ({ ...n, read: true }));
    // A classe MockDB Table é simples, então salvamos o array inteiro manualmente aqui
    // já que update em lote não foi implementado na classe base para manter simplicidade
    localStorage.setItem('gesla_db_notifications', JSON.stringify(updated));
    window.dispatchEvent(new Event('notificationsChanged'));
  },

  addNotification: (notif: Omit<Notification, 'id' | 'read' | 'time'>) => {
    const newNotif: Notification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      time: 'Agora',
      read: false
    };
    db.notifications.create(newNotif);
    window.dispatchEvent(new Event('notificationsChanged'));
  }
};
