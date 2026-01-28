
import { Carrier } from '../types';
import { db } from './db';

export const carrierService = {
  // Retorna apenas transportadoras ativas
  getCarriers: () => {
    const all = db.carriers.getAll();
    return all.filter(c => c.active !== false);
  },
  
  getCarrierById: (id: string) => db.carriers.getById(id),
  
  saveCarrier: (data: Partial<Carrier>) => {
    if (data.id) {
      return db.carriers.update(data.id, {
        ...data,
        updatedAt: new Date().toISOString()
      });
    } else {
      const newCarrier: Carrier = {
        // Defaults
        zipCode: '',
        address: '',
        number: '',
        neighborhood: '',
        city: '',
        state: '',
        status: 'Ativo',
        fleetType: 'Geral',
        ...data as Carrier,
        id: Math.random().toString(36).substr(2, 9),
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      return db.carriers.create(newCarrier);
    }
  },
  
  // Exclusão Lógica (Soft Delete)
  deleteCarrier: (id: string) => {
    db.carriers.update(id, { active: false, updatedAt: new Date().toISOString() });
  },

  toggleStatus: (id: string) => {
    const carrier = db.carriers.getById(id);
    if (carrier) {
      db.carriers.update(id, { 
        status: carrier.status === 'Ativo' ? 'Inativo' : 'Ativo',
        updatedAt: new Date().toISOString() 
      });
    }
  }
};
