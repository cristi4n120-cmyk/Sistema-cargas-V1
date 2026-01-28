import { Notification } from '../types';
import { db } from './db';

export const notificationService = {
  getNotifications: (): Notification[] => {
    return db.notifications.getAll();
  },

  markAsRead: (id: string) => {
    db.notifications.update(id, { read: true });
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('notificationsChanged'));
    }
  },

  markAllAsRead: () => {
    const notifs = db.notifications.getAll();
    const updated = notifs.map(n => ({ ...n, read: true }));
    if (typeof window !== 'undefined') {
      localStorage.setItem('gesla_db_notifications', JSON.stringify(updated));
      window.dispatchEvent(new Event('notificationsChanged'));
    }
  },

  addNotification: (notif: Omit<Notification, 'id' | 'read' | 'time'>) => {
    const newNotif: Notification = {
      ...notif,
      id: Math.random().toString(36).substr(2, 9),
      time: 'Agora',
      read: false
    };
    db.notifications.create(newNotif);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('notificationsChanged'));
    }
  }
};