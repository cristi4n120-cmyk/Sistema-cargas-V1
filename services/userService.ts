
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
  window.dispatchEvent(new Event('authUpdate'));
  window.dispatchEvent(new Event('storage'));
};

export const userService = {
  getUsers: () => db.users.getAll().map(({ password, ...user }: any) => user),
  
  isAuthenticated: () => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (!session) return false;
      const user = JSON.parse(session);
      return !!(user && user.id && user.name);
    } catch {
      return false;
    }
  },

  // Novo método para verificar sem logar (para animações de UI)
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
      localStorage.setItem(SESSION_KEY, JSON.stringify(userSafe));
      notifyAuthChange();
      return userSafe;
    }
    return null;
  },

  getCurrentUser: (): UserExtended => {
    try {
      const session = localStorage.getItem(SESSION_KEY);
      if (session) return JSON.parse(session);
    } catch {}
    // Fallback seguro se não houver sessão
    return { id: '0', name: 'Visitante', role: UserRole.VIEWER, email: '' };
  },

  logout: () => {
    localStorage.removeItem(SESSION_KEY);
    notifyAuthChange();
  },

  isAdmin: () => userService.getCurrentUser().role === UserRole.ADMIN,

  setCurrentUser: (id: string) => {
    const users = db.users.getAll() as UserExtended[];
    const user = users.find(u => u.id === id);
    if (user) {
      const { password: _, ...userSafe } = user;
      localStorage.setItem(SESSION_KEY, JSON.stringify(userSafe));
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
      password: '123', // Senha padrão para novos usuários criados pelo admin
      lastActivity: 'Recém Criado'
    };
    db.users.create(newUser);
    window.dispatchEvent(new Event('userChanged'));
  },

  updateUser: (id: string, userData: Partial<UserExtended>) => {
    db.users.update(id, userData);
    window.dispatchEvent(new Event('userChanged'));
  },

  deleteUser: (id: string) => {
    db.users.delete(id);
    window.dispatchEvent(new Event('userChanged'));
  }
};
