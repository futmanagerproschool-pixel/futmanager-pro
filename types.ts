
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type UserRole = 'ADMIN' | 'COACH' | 'SECRETARY';
export type PaymentMethod = 'CASH' | 'CARD' | 'CREDIT' | 'POINTS';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
}

export interface SchoolInfo {
  name: string;
  slogan: string;
  logo?: string;
  address?: string;
  nit?: string;
}

export interface LoyaltyConfig {
  enabled: boolean;
  pointsPerAmount: number; // Ej: 1 punto por cada 10.000
  redemptionValue: number; // Ej: 1 punto vale 1.000
}

export interface ExternalClient {
  id: string;
  name: string;
  document: string;
  phone: string;
  email?: string;
  loyaltyPoints: number;
  creditDebt: number;
  updatedAt: number;
}

export interface Vendor {
  id: string;
  name: string;
  nit: string;
  phone: string;
  category: string;
  updatedAt: number;
}

export interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  category: string;
  entryDate: string;
  exitDate?: string;
  phone: string;
  address: string;
  baseSalary: number;
  bankAccount?: string;
  photo?: string;
  updatedAt: number;
}

export interface Product {
  id: string;
  code: string;
  description: string;
  buyPrice: number;
  sellPrice: number;
  stock: number;
  category: string;
  updatedAt: number;
}

export interface Sale {
  id: string;
  orderNumber: number;
  date: string;
  customerType: 'STUDENT' | 'EXTERNAL' | 'ANONYMOUS';
  customerId?: string;
  items: {
    productId: string;
    description: string;
    quantity: number;
    price: number;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: PaymentMethod;
  pointsEarned: number;
  updatedAt: number;
}

export interface Purchase {
  id: string;
  vendorId: string;
  date: string;
  items: {
    productId: string;
    quantity: number;
    buyPrice: number;
  }[];
  total: number;
  updatedAt: number;
}

export interface MatchCallup {
  id: string;
  tournament: string;
  opponent: string;
  date: string;
  time: string;
  location: string;
  starters: { studentId: string; position: string }[];
  substitutes: string[];
  updatedAt: number;
}

export interface TrainingPlan {
  id: string;
  category: string;
  objective: string;
  content: string;
  date: string;
  coachId: string;
  updatedAt: number;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  document: string;
  bloodType: BloodType;
  weight: number;
  height: number;
  dob: string;
  photo?: string;
  position: string;
  category: string;
  coachId: string;
  parents: {
    phone: string;
    address: string;
  };
  paymentStatus: 'UP_TO_DATE' | 'IN_ARREARS';
  loyaltyPoints: number;
  creditDebt: number;
  updatedAt: number;
}

export interface Transaction {
  id: string;
  orderNumber: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: 'MONTHLY_PAYMENT' | 'PETTY_CASH' | 'EQUIPMENT' | 'SALARY' | 'STORE_SALE' | 'PURCHASE' | 'OTHER';
  amount: number;
  description: string;
  relatedId?: string;
  updatedAt: number;
}

export interface AppData {
  school: SchoolInfo;
  loyaltyConfig: LoyaltyConfig;
  students: Student[];
  externalClients: ExternalClient[];
  vendors: Vendor[];
  coaches: Coach[];
  transactions: Transaction[];
  trainingPlans: TrainingPlan[];
  matches: MatchCallup[];
  users: User[];
  products: Product[];
  sales: Sale[];
  purchases: Purchase[];
  pettyCashBalance: number;
  nextOrderNumber: number;
}
