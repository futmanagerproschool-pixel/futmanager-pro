
import { AppData } from './types';

export const CATEGORIES = [
  'Sub-5', 'Sub-7', 'Sub-9', 'Sub-11', 'Sub-13', 'Sub-15', 'Sub-17', 'Sub-20', 'Mayores'
];

export const POSITIONS = [
  'Portero', 'Defensa Central', 'Lateral', 'Mediocentro', 'Extremo', 'Delantero'
];

export const INITIAL_DATA: AppData = {
  school: {
    name: 'FutManager Pro Academy',
    slogan: 'Liderazgo y Disciplina en la Cancha',
    address: 'Av. Deportiva 123',
    nit: '900.123.456-1'
  },
  loyaltyConfig: {
    enabled: true,
    pointsPerAmount: 10000,
    redemptionValue: 500
  },
  users: [
    { id: 'u1', name: 'Admin Principal', email: 'admin@escuela.com', role: 'ADMIN', password: 'admin' },
    { id: 'u2', name: 'Entrenador Juan', email: 'juan@escuela.com', role: 'COACH', password: 'coach' }
  ],
  students: [],
  externalClients: [],
  vendors: [
    { id: 'v1', name: 'Deportes El Campeón', nit: '800.555.444', phone: '3001234567', category: 'Uniformes', updatedAt: Date.now() }
  ],
  coaches: [],
  transactions: [],
  matches: [],
  trainingPlans: [],
  products: [
    { id: 'p1', code: 'UNI-01', description: 'Uniforme Titular', buyPrice: 45000, sellPrice: 85000, stock: 15, category: 'Uniformes', updatedAt: Date.now() },
    { id: 'p2', code: 'BAL-05', description: 'Balón Golty #5', buyPrice: 90000, sellPrice: 140000, stock: 8, category: 'Implementos', updatedAt: Date.now() }
  ],
  sales: [],
  purchases: [],
  pettyCashBalance: 2000000,
  nextOrderNumber: 1
};
