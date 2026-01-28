
import { SystemSettings, ShippingType } from '../types';
import { db } from './db';

export const COMPANY_ADDRESS = "Estrada do Rocio, 777, Guarapuava - PR";
export const COMPANY_CITY = "Guarapuava - PR";

export const settingsService = {
  getSettings: (): SystemSettings => {
    return db.settings.getSettings();
  },

  saveSettings: (settings: SystemSettings) => {
    db.settings.saveSettings(settings);
    window.dispatchEvent(new Event('settingsChanged'));
    return settings;
  },

  resetToDefault: () => {
    // Para resetar, limpamos a chave e o construtor da Table vai recarregar o SEED
    localStorage.removeItem('gesla_db_settings');
    // Forçamos um reload da página ou recriamos a tabela (mais simples reload para settings globais)
    window.location.reload(); 
    return db.settings.getSettings();
  }
};
