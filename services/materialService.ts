
import { Material } from '../types';
import { db } from './db';

export const materialService = {
  getMaterials: () => db.materials.getAll(),
  
  getMaterialByCode: (code: string) => db.materials.getAll().find(m => m.code === code),
  
  saveMaterial: (data: Partial<Material>) => {
    if (data.id) {
      return db.materials.update(data.id, data);
    } else {
      const newMaterial: Material = {
        code: '',
        description: '',
        unit: 'UN',
        category: '',
        ...data as Material,
        id: Math.random().toString(36).substr(2, 9),
        status: data.status || 'Ativo'
      };
      return db.materials.create(newMaterial);
    }
  },
  
  deleteMaterial: (id: string) => {
    db.materials.delete(id);
  }
};
