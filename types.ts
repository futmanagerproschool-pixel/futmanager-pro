// --- TIPOS BASE ---
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type PaymentStatus = 'UP_TO_DATE' | 'IN_ARREARS' | 'PENDING';
export type UserRole = 'ADMIN' | 'COACH' | 'TREASURER';
export type TransactionType = 'INCOME' | 'EXPENSE';
export type PaymentMethod = 'CASH' | 'TRANSFER' | 'CARD';

// --- INTERFACES DE MÓDULOS ---

export interface School {
  name: string;
  logo: string;
  primaryColor: string;
}

export interface User {
  id: string;
  name: string;
  role: UserRole;
  password?: string;
  avatar?: string;
}

export interface Student {
  id: string;
  firstName: string;
  lastName: string;
  document: string;
  dob: string;
  bloodType: BloodType;
  weight: number;
  height: number;
  photo: string; // Aquí guardamos la URL de Firebase Storage
  category: string;
  position: string;
  coachId: string;
  status: 'ACTIVE' | 'INACTIVE';
  paymentStatus: PaymentStatus;
  entryDate: string;
  updatedAt?: number;
  observations?: string;
  paidMonths: string[];
  parents?: {
    fatherName: string;
    motherName: string;
    phone: string;
    address: string;
  };
}

export interface Provider {
  id: string;
  name: string;
  nit: string;
  category: string;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  image: string; // URL de Firebase Storage
}

export interface TrainingPlan {
  id: string;
  title: string;
  category: string;
  coachId: string;
  date: string;
  description: string;
  drills: string[]; // Lista de ejercicios
}

export interface Transaction {
  id: string;
  date: string;
  amount: number;
  type: TransactionType;
  category: string;
  description: string;
  method: PaymentMethod;
}

// --- ESTRUCTURA GLOBAL DE LA BASE DE DATOS (Firestore) ---
export interface AppData {
  school: School;
  students: Student[];
  users: User[];
  providers: Provider[];
  products: Product[];
  transactions: Transaction[];
  trainingPlans: TrainingPlan[];
  matches: any[]; // Puedes detallar esto después
  pettyCashBalance: number;
  nextOrderNumber: number;
  payrollRecords: any[];
}
