
import { AppData } from './types';

export const CATEGORIES = [
  'Sub-5', 'Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Mayores'
];

export const POSITIONS = [
  'Portero', 'Defensa Central', 'Lateral', 'Mediocentro', 'Extremo', 'Delantero'
];

export const INITIAL_DATA: AppData = {
  school: {
    name: 'FutManager Pro School',
    slogan: 'Formando Campeones para el Mañana'
  },
  users: [
    { id: 'u1', name: 'Admin Principal', email: 'admin@escuela.com', role: 'ADMIN', password: 'admin' },
    { id: 'u2', name: 'Entrenador Juan', email: 'juan@escuela.com', role: 'COACH', password: 'coach' },
    { id: 'u3', name: 'Secretaria Ana', email: 'ana@escuela.com', role: 'SECRETARY', password: 'sec' }
  ],
  students: [],
  coaches: [],
  transactions: [],
  matches: [],
  trainingPlans: [],
  products: [
    { id: 'p1', code: 'UNI-01', description: 'Uniforme Oficial Titular', buyPrice: 45000, sellPrice: 85000, stock: 20, category: 'Uniformes', updatedAt: Date.now() },
    { id: 'p2', code: 'BAL-05', description: 'Balón Profesional #5', buyPrice: 120000, sellPrice: 185000, stock: 10, category: 'Implementos', updatedAt: Date.now() }
  ],
  sales: [],
  pettyCashBalance: 1000000,
  nextOrderNumber: 1
};
