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
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('settingsChanged'));
    }
    return settings;
  },

  resetToDefault: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('gesla_db_settings');
      window.location.reload();
    }
    return db.settings.getSettings();
  }
};