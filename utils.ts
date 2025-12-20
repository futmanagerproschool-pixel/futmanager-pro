
import { differenceInYears, parseISO } from 'date-fns';

export const calculateBMI = (weight: number, heightCm: number): number => {
  if (!weight || !heightCm) return 0;
  const heightM = heightCm / 100;
  return parseFloat((weight / (heightM * heightM)).toFixed(2));
};

export const calculateAge = (dob: string): number => {
  if (!dob) return 0;
  return differenceInYears(new Date(), parseISO(dob));
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
};

export const getBMIStatus = (bmi: number): string => {
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Sobrepeso';
  return 'Obesidad';
};

/**
 * Mezcla datos locales con remotos basándose en marcas de tiempo.
 * Esto permite que múltiples usuarios trabajen sobre la misma base de datos.
 */
export const mergeData = (local: any[], remote: any[]): any[] => {
  const mergedMap = new Map();
  
  // Agregar locales
  local.forEach(item => mergedMap.set(item.id, item));
  
  // Sobrescribir con remotos si son más nuevos
  remote.forEach(remoteItem => {
    const localItem = mergedMap.get(remoteItem.id);
    if (!localItem || remoteItem.updatedAt > localItem.updatedAt) {
      mergedMap.set(remoteItem.id, remoteItem);
    }
  });
  
  return Array.from(mergedMap.values());
};
