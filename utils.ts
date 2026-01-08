import { BloodType } from './types';

// --- CÁLCULOS DE SALUD ---
export const calculateBMI = (weight: number, height: number): number => {
  if (!weight || !height) return 0;
  // Altura viene en cm, pasamos a metros: peso / (altura_m * altura_m)
  const heightInMeters = height / 100;
  const bmi = weight / (heightInMeters * heightInMeters);
  return parseFloat(bmi.toFixed(1));
};

export const getBMIStatus = (bmi: number): string => {
  if (bmi === 0) return 'Sin datos';
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25) return 'Normal';
  if (bmi < 30) return 'Sobrepeso';
  return 'Obesidad';
};

export const calculateAge = (dob: string): number => {
  if (!dob) return 0;
  const birthDate = new Date(dob);
  const difference = Date.now() - birthDate.getTime();
  const ageDate = new Date(difference);
  return Math.abs(ageDate.getUTCFullYear() - 1970);
};

// --- FORMATEO DE MONEDA (Para que los precios se vean bien) ---
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
};

// --- GENERADOR DE IDS SEGUROS (Si Firebase no genera uno) ---
export const generateId = () => Math.random().toString(36).substr(2, 9);
