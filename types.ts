
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type UserRole = 'ADMIN' | 'COACH' | 'SECRETARY';
export type PaymentMethod = 'CASH' | 'CARD' | 'CREDIT' | 'POINTS';

export interface DriveConfig {
  email: string;
  fileId?: string;
  linkedAt?: string;
  lastSync?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password: string;
  lastActive?: string;
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
  photo?: string;
  cvUrl?: string;
  signature?: string;
  updatedAt: number;
}

export interface Supplier {
  id: string;
  name: string;
  document: string;
  phone: string;
  email: string;
  address: string;
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

export interface Promotion {
  id: string;
  name: string;
  discountPercentage: number;
  isActive: boolean;
  minPurchase?: number;
}

export interface Customer {
  id: string;
  name: string;
  document: string;
  phone: string;
  address: string;
  creditLimit: number;
  currentDebt: number;
  loyaltyPoints: number;
  updatedAt: number;
}

export interface SaleItem {
  productId: string;
  description: string;
  quantity: number;
  price: number;
  buyPriceAtSale: number;
  subtotal: number;
}

export interface Sale {
  id: string;
  date: string;
  customerId?: string;
  items: SaleItem[];
  total: number;
  discount: number;
  pointsEarned: number;
  paymentMethod: PaymentMethod;
  status: 'PAID' | 'PENDING';
  updatedAt: number;
}

export interface Purchase {
  id: string;
  date: string;
  productId: string;
  supplierId: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
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

export interface SchoolInfo {
  name: string;
  slogan: string;
  logo?: string;
}

export interface ParentsInfo {
  fatherName: string;
  motherName: string;
  phone: string;
  address: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  document: string;
  bloodType: BloodType;
  weight: number;
  height: number;
  school: string;
  grade: string;
  dob: string;
  photo?: string;
  position: string;
  entryDate: string;
  exitDate?: string;
  category: string;
  coachId: string;
  parents: ParentsInfo;
  observations: string;
  paymentStatus: 'UP_TO_DATE' | 'IN_ARREARS';
  lastPaymentMonth?: string;
  status: 'ACTIVE' | 'RETIRED';
  updatedAt: number;
}

export interface Transaction {
  id: string;
  orderNumber: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: 'MONTHLY_PAYMENT' | 'PETTY_CASH' | 'EQUIPMENT' | 'SALARY' | 'STORE_SALE' | 'STORE_PURCHASE' | 'OTHER';
  amount: number;
  description: string;
  studentId?: string;
  updatedAt: number;
}

export interface AppData {
  school: SchoolInfo;
  students: Student[];
  coaches: Coach[];
  transactions: Transaction[];
  trainingPlans: TrainingPlan[];
  matches: MatchCallup[];
  users: User[];
  products: Product[];
  customers: Customer[];
  suppliers: Supplier[];
  sales: Sale[];
  purchases: Purchase[];
  promotions: Promotion[];
  pointsConfig: {
    pointsPerThousand: number;
    valuePerPoint: number;
  };
  driveConfig?: DriveConfig;
  pettyCashBalance: number;
  nextOrderNumber: number;
  version: number;
}
