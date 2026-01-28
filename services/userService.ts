import { User, UserRole } from '../types';
import { db } from './db';

const SESSION_KEY = 'gesla_session_active';

export interface UserExtended extends User {
  password?: string;
  department?: string;
  lastActivity?: string;
  status?: string;
}

const notifyAuthChange = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event('authUpdate'));
    window.dispatchEvent(new Event('storage'));
  }
};

export const userService = {
  getUsers: () => db.users.getAll().map(({ password, ...user }: any) => user),
  
  isAuthenticated: () => {
    if (typeof window === 'undefined') return false;
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (!session) return false;
      const user = JSON.parse(session);
      return !!(user && user.id && user.name);
    } catch {
      return false;
    }
  },

  validateCredentials: (username: string, password: string): boolean => {
    const users = db.users.getAll() as UserExtended[];
    return users.some(u => 
      u.username?.toLowerCase() === username.trim().toLowerCase() && 
      u.password === password
    );
  },

  login: (username: string, password: string): User | null => {
    const users = db.users.getAll() as UserExtended[];
    const user = users.find(u => 
      u.username?.toLowerCase() === username.trim().toLowerCase() && 
      u.password === password
    );
    
    if (user) {
      const { password: _, ...userSafe } = user;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(userSafe));
        } catch {}
      }
      notifyAuthChange();
      return userSafe;
    }
    return null;
  },

  getCurrentUser: (): UserExtended => {
    if (typeof window !== 'undefined') {
      try {
        const session = localStorage.getItem(SESSION_KEY);
        if (session) return JSON.parse(session);
      } catch {}
    }
    // Fallback seguro
    return { id: '0', name: 'Visitante', role: UserRole.VIEWER, email: '' };
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(SESSION_KEY);
      } catch {}
    }
    notifyAuthChange();
  },

  isAdmin: () => userService.getCurrentUser().role === UserRole.ADMIN,

  setCurrentUser: (id: string) => {
    const users = db.users.getAll() as UserExtended[];
    const user = users.find(u => u.id === id);
    if (user) {
      const { password: _, ...userSafe } = user;
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(SESSION_KEY, JSON.stringify(userSafe));
        } catch {}
      }
      notifyAuthChange();
    }
  },

  addUser: (userData: Partial<UserExtended>) => {
    const newUser: UserExtended = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      email: '',
      role: UserRole.OPERATOR,
      ...userData,
      username: userData.name?.toLowerCase().split(' ')[0].normalize("NFD").replace(/[\u0300-\u036f]/g, "") || 'user',
      password: '123',
      lastActivity: 'Recém Criado'
    };
    db.users.create(newUser);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('userChanged'));
  },

  updateUser: (id: string, userData: Partial<UserExtended>) => {
    db.users.update(id, userData);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('userChanged'));
  },

  deleteUser: (id: string) => {
    db.users.delete(id);
    if (typeof window !== 'undefined') window.dispatchEvent(new Event('userChanged'));
  }
};