
import { Client } from '../types';
import { db } from './db';

export const clientService = {
  // Retorna apenas clientes ativos
  getClients: () => {
    const all = db.clients.getAll();
    return all.filter(c => c.active !== false);
  },
  
  getClientById: (id: string) => db.clients.getById(id),
  
  saveClient: (data: Partial<Client>) => {
    if (data.id) {
      return db.clients.update(data.id, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } else {
      const newClient: Client = {
        // Defaults
        zipCode: '',
        address: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        ...data as Client,
        id: Math.random().toString(36).substr(2, 9),
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return db.clients.create(newClient);
    }
  },
  
  // Exclusão Lógica (Soft Delete)
  deleteClient: (id: string) => {
    db.clients.update(id, { active: false, updatedAt: new Date().toISOString() });
  }
};
