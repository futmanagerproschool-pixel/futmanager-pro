
export type BloodType = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
export type UserRole = 'ADMIN' | 'COACH' | 'SECRETARY';
export type PaymentMethod = 'CASH' | 'CARD' | 'CREDIT' | 'NEQUI' | 'DAVIPLATA' | 'TRANSFER' | 'OTHER';
export type SaleStatus = 'PAID' | 'PENDING' | 'CANCELLED';

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

export interface SaleItem {
  productId: string;
  description: string;
  quantity: number;
  price: number;
}

export interface Sale {
  id: string;
  orderNumber: number;
  date: string;
  items: SaleItem[];
  total: number;
  paymentMethod: PaymentMethod;
  status: SaleStatus;
  customerName: string;
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
  school: string;
  grade: string;
  dob: string;
  photo?: string;
  position: string;
  entryDate: string;
  category: string;
  coachId: string;
  parents: {
    fatherName: string;
    motherName: string;
    phone: string;
    address: string;
  };
  observations: string;
  paymentStatus: 'UP_TO_DATE' | 'IN_ARREARS';
  status: 'ACTIVE' | 'RETIRED';
  updatedAt: number;
  paidMonths?: string[]; // Formato YYYY-MM
}

export interface MonthlyPaymentRecord {
  id: string;
  studentId: string;
  studentName: string;
  month: string; // YYYY-MM
  baseAmount: number;
  discount: number;
  paidAmount: number;
  paymentMethod: PaymentMethod;
  date: string;
  orderNumber: number;
}

export interface PayrollRecord {
  id: string;
  coachId: string;
  coachName: string;
  month: string; // YYYY-MM
  baseSalary: number;
  discounts: number;
  netPaid: number;
  paymentMethod: PaymentMethod;
  date: string;
  orderNumber: number;
}

export interface Transaction {
  id: string;
  orderNumber: number;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: 'MONTHLY_PAYMENT' | 'PETTY_CASH' | 'EQUIPMENT' | 'SALARY' | 'STORE_SALE' | 'OTHER';
  amount: number;
  description: string;
  paymentMethod: PaymentMethod;
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
  sales: Sale[];
  monthlyPayments: MonthlyPaymentRecord[];
  payrollRecords: PayrollRecord[];
  pettyCashBalance: number;
  nextOrderNumber: number;
}
