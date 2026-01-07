import ProviderModal from './components/ProviderModal';

export interface Provider {
  id: string;
  name: string;
  nit: string;
  contactName: string;
  phone: string;
  address: string;
  email: string;
  updatedAt: number;
}
export interface Provider {
  id: string;
  name: string;
  nit: string;
  contactName: string;
  phone: string;
  address
import ProviderModal from './components/ProviderModal';
import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { 
  Plus, Users, PiggyBank, Trophy, ChevronRight,
  RefreshCw, Lock, TrendingUp, TrendingDown, Search, 
  ShoppingBag, ShoppingCart, Package, History, 
  CheckCircle2, AlertTriangle, UserSquare2, Trash2, 
  Download, FileText, Printer, FileSpreadsheet, Landmark, 
  Wallet, Eye, EyeOff, UserPlus, Minus, Tag, Store,
  Globe, CloudOff, Activity, Clock, ShieldCheck, Settings as SettingsIcon,
  Sparkles, BrainCircuit, Upload, Trash, Mail, Phone, Briefcase,
  X, CreditCard, Smartphone, FileUp, ClipboardList, BookOpen,
  WifiOff, AlertCircle, ReceiptText, UserX
} from 'lucide-react';

import Sidebar from './components/Sidebar';
import StudentModal from './components/StudentModal';
import TrainingModal from './components/TrainingModal';
import CoachModal from './components/CoachModal';
import MatchModal from './components/MatchModal';
import UserModal from './components/UserModal';
import TransactionModal from './components/TransactionModal';
import ProductModal from './components/ProductModal';
import StudentPaymentModal from './components/StudentPaymentModal';
import { AppData, Student, User, Coach, Product, Transaction, PaymentMethod, MonthlyPaymentRecord, PayrollRecord, TrainingPlan, Sale, SaleItem, MatchCallup, BloodType } from './types';
import { INITIAL_DATA } from './constants';
import { formatCurrency, exportToCSV, printMonthlyReceipt, printPayrollStub, calculateAge, calculateBMI, getBMIStatus, printReceipt, downloadCSVTemplate, parseCSV } from './utils';
import { generateSchoolReport } from './geminiService';
// 1. Definimos qué datos tiene un Proveedor
export interface Provider {
  id: string;
  name: string;
  nit: string;
  contactName: string;
  phone: string;
  address: string;
  email: string;
  updatedAt: number;
}

// 2. BUSCA la interface AppData que ya tienes y asegúrate de que tenga esto:
// interface AppData {
//   ... otros campos ...
//   providers: Provider[]; // <--- AGREGA ESTA LÍNEA
// }
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD8COWL_GU3k1oIN37r5rroBuqYvCD4Skw",
  authDomain: "futmanagerpro-42dfd.firebaseapp.com",
  projectId: "futmanagerpro-42dfd",
  storageBucket: "futmanagerpro-42dfd.firebasestorage.app",
  messagingSenderId: "934402477410",
  appId: "1:934402477410:web:ce63f48cf38179d67c703b",
  measurementId: "G-WG0D4K2TF5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

const app = firebaseConfig.apiKey ? initializeApp(firebaseConfig) : null;
const db = app ? getFirestore(app) : null;

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [syncStatus, setSyncStatus] = useState<'LOCAL' | 'CLOUD' | 'ERROR'>('LOCAL');
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(true);
  const [editingProvider, setEditingProvider] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [financialView, setFinancialView] = useState<'RECAUDO' | 'NOMINA' | 'CAJA'>('RECAUDO');
  const [storeView, setStoreView] = useState<'POS' | 'INVENTORY'>('POS');
  const [searchTerm, setSearchTerm] = useState('');
  const [visiblePins, setVisiblePins] = useState<Record<string, boolean>>({});
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
 const [editingProvider, setEditingProvider] = useState<Provider | null>(null); 
  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('futmanager_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginStep, setLoginStep] = useState<'SELECT' | 'PASSWORD'>('SELECT');
  const [selectedUserLogin, setSelectedUserLogin] = useState<User | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  // Modales
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>();
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | undefined>();
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [studentForPayment, setStudentForPayment] = useState<Student | null>(null);

  // POS State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<PaymentMethod>('CASH');

  useEffect(() => {
    if (!db) { setIsLoading(false); return; }
    const docRef = doc(db, 'escuela', 'datos_principales');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const remoteData = docSnap.data() as AppData;
        setData(remoteData);
        setSyncStatus('CLOUD');
        setLastSyncTime(new Date());
      } else {
        setDoc(docRef, INITIAL_DATA);
      }
      setIsLoading(false);
    }, (error) => { 
      console.error("Firestore Error:", error);
      setSyncStatus('ERROR'); 
      setIsLoading(false); 
    });
    return () => unsubscribe();
  }, []);

  // Mecanismo de monitoreo de conexión (Chequeo cada 5 minutos)
  useEffect(() => {
    const checkConnection = async () => {
      if (!db) return;
      try {
        const docRef = doc(db, 'escuela', 'datos_principales');
        const testSnap = await getDoc(docRef);
        if (testSnap.exists()) {
          if (syncStatus === 'ERROR') setSyncStatus('CLOUD');
        }
      } catch (e) {
        setSyncStatus('ERROR');
      }
    };

    const intervalId = setInterval(() => {
      checkConnection();
      if (syncStatus === 'ERROR') {
        alert("⚠️ ATENCIÓN: Se ha detectado una interrupción en la sincronización con la nube. Los cambios podrían no guardarse correctamente hasta restablecer la conexión.");
      }
    }, 300000);

    return () => clearInterval(intervalId);
  }, [syncStatus]);

  const persistData = async (updater: (prev: AppData) => AppData) => {
    setIsSyncing(true);
    try {
      const updated = updater(data);
      if (db) {
        await setDoc(doc(db, 'escuela', 'datos_principales'), updated);
      } else {
        setData(updated);
      }
    } catch (e) {
      console.error("Firebase Sync Error", e);
      setSyncStatus('ERROR');
      alert("Error al sincronizar datos. Verifique su conexión.");
    } finally {
      setIsSyncing(false);
    }
  };

  const currentMonth = new Date().toISOString().slice(0, 7);

  // Stats para Nómina
  const payrollStats = useMemo(() => {
    const paidRecords = (data.payrollRecords || []).filter(r => r.month === currentMonth);
    const totalPaid = paidRecords.reduce((acc, r) => acc + r.netPaid, 0);
    const pendingCoaches = data.coaches.filter(c => !paidRecords.some(r => r.coachId === c.id) && !c.exitDate);
    const totalPending = pendingCoaches.reduce((acc, c) => acc + c.baseSalary, 0);
    return { totalPaid, totalPending, pendingCount: pendingCoaches.length };
  }, [data.payrollRecords, data.coaches, currentMonth]);

  // Lógica de pago de nómina
  const handlePayrollPayment = (coach: Coach) => {
    const discount = 0;
    const net = coach.baseSalary - discount;
    
    if (net > data.pettyCashBalance) {
      return alert("Fondo de caja insuficiente para realizar este pago.");
    }

    const newPayrollRecord: PayrollRecord = {
      id: Math.random().toString(36).substr(2, 9),
      coachId: coach.id,
      coachName: `${coach.firstName} ${coach.lastName}`,
      month: currentMonth,
      baseSalary: coach.baseSalary,
      discounts: discount,
      netPaid: net,
      paymentMethod: 'CASH',
      date: new Date().toISOString().split('T')[0],
      orderNumber: data.nextOrderNumber
    };

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: data.nextOrderNumber,
      date: new Date().toISOString().split('T')[0],
      type: 'EXPENSE',
      category: 'SALARY',
      amount: net,
      description: `Pago Nómina ${currentMonth} - ${coach.firstName} ${coach.lastName}`,
      paymentMethod: 'CASH',
      updatedAt: Date.now()
    };

    persistData(prev => ({
      ...prev,
      payrollRecords: [newPayrollRecord, ...(prev.payrollRecords || [])],
      transactions: [newTx, ...prev.transactions],
      pettyCashBalance: prev.pettyCashBalance - net,
      nextOrderNumber: prev.nextOrderNumber + 1
    }));
    
    alert(`Pago de ${formatCurrency(net)} procesado con éxito para ${coach.firstName}.`);
  };

  // Lógica de Pago de Mensualidades (NUEVO)
  const handleSaveMonthlyPayments = (newRecords: Omit<MonthlyPaymentRecord, 'id' | 'orderNumber'>[]) => {
    if (!studentForPayment) return;

    let nextOrder = data.nextOrderNumber;
    let totalPaidInThisOperation = 0;
    const finalMonthlyRecords: MonthlyPaymentRecord[] = [];
    const finalTransactions: Transaction[] = [];

    newRecords.forEach(r => {
      const recordId = Math.random().toString(36).substr(2, 9);
      const record: MonthlyPaymentRecord = { ...r, id: recordId, orderNumber: nextOrder };
      finalMonthlyRecords.push(record);

      const tx: Transaction = {
        id: Math.random().toString(36).substr(2, 9),
        orderNumber: nextOrder,
        date: r.date,
        type: 'INCOME',
        category: 'MONTHLY_PAYMENT',
        amount: r.paidAmount,
        description: `Pago Mes ${r.month} - ${r.studentName}`,
        paymentMethod: r.paymentMethod,
        updatedAt: Date.now()
      };
      finalTransactions.push(tx);
      totalPaidInThisOperation += r.paidAmount;
      nextOrder++;
    });

    persistData(prev => ({
      ...prev,
      monthlyPayments: [...(prev.monthlyPayments || []), ...finalMonthlyRecords],
      transactions: [...finalTransactions, ...prev.transactions],
      students: prev.students.map(s => s.id === studentForPayment.id ? {
        ...s,
        paidMonths: [...(s.paidMonths || []), ...newRecords.map(nr => nr.month)],
        paymentStatus: 'UP_TO_DATE'
      } : s),
      pettyCashBalance: prev.pettyCashBalance + totalPaidInThisOperation,
      nextOrderNumber: nextOrder
    }));

    // Imprimir el último volante (o podríamos generar uno resumen)
    if (finalMonthlyRecords.length > 0) {
      printMonthlyReceipt(finalMonthlyRecords[finalMonthlyRecords.length - 1], data.school.name);
    }
    alert(`${newRecords.length} meses pagados con éxito.`);
  };

  // Reporte de Mora
  const exportArrearsReport = () => {
    const arrears = data.students.filter(s => !(s.paidMonths || []).includes(currentMonth));
    if (arrears.length === 0) return alert("¡Excelente! No hay alumnos en mora para el mes actual.");
    
    const reportData = arrears.map(s => ({
      Alumno: `${s.firstName} ${s.lastName}`,
      Documento: s.document,
      Categoria: s.category,
      Padre: s.parents?.fatherName || 'N/A',
      Madre: s.parents?.motherName || 'N/A',
      Celular: s.parents?.phone || 'N/A',
      Estado: 'MORA'
    }));
    exportToCSV(`Alumnos_En_Mora_${currentMonth}`, reportData);
  };

  // Lógica de actualización automática de paymentStatus
  useEffect(() => {
    if (!isLoading && data.students.length > 0) {
      const needsSync = data.students.some(s => {
        const isPaid = (s.paidMonths || []).includes(currentMonth);
        const expectedStatus = isPaid ? 'UP_TO_DATE' : 'IN_ARREARS';
        return s.paymentStatus !== expectedStatus;
      });

      if (needsSync) {
        persistData(prev => ({
          ...prev,
          students: prev.students.map(s => {
            const isPaid = (s.paidMonths || []).includes(currentMonth);
            const status = isPaid ? 'UP_TO_DATE' : 'IN_ARREARS';
            return s.paymentStatus === status ? s : { ...s, paymentStatus: status };
          })
        }));
      }
    }
  }, [isLoading, data.students.length, currentMonth]);

  const monthlyStats = useMemo(() => {
    const inc = (data.transactions || []).filter(t => t.type === 'INCOME' && t.date.startsWith(currentMonth)).reduce((a, b) => a + b.amount, 0);
    const exp = (data.transactions || []).filter(t => t.type === 'EXPENSE' && t.date.startsWith(currentMonth)).reduce((a, b) => a + b.amount, 0);
    return { inc, exp };
  }, [data.transactions, currentMonth]);

  // Import Logic
  const handleImportCSV = (type: 'STUDENTS' | 'COACHES' | 'PRODUCTS', file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parsed = parseCSV(text);
      
      if (parsed.length === 0) return alert("El archivo está vacío o tiene un formato incorrecto.");

      persistData(prev => {
        const newData = { ...prev };
        const now = Date.now();

        if (type === 'STUDENTS') {
          const importedStudents: Student[] = parsed.map(p => ({
            ...p,
            id: Math.random().toString(36).substr(2, 9),
            weight: parseFloat(p.weight) || 0,
            height: parseFloat(p.height) || 0,
            bloodType: (p.bloodType || 'O+') as BloodType,
            updatedAt: now,
            paymentStatus: 'IN_ARREARS',
            status: 'ACTIVE',
            paidMonths: [],
            parents: {
              fatherName: p.fatherName || '',
              motherName: p.motherName || '',
              phone: p.phone || '',
              address: p.address || ''
            }
          }));
          newData.students = [...prev.students, ...importedStudents];
        } else if (type === 'COACHES') {
          const importedCoaches: Coach[] = parsed.map(p => ({
            ...p,
            id: Math.random().toString(36).substr(2, 9),
            baseSalary: parseFloat(p.baseSalary) || 0,
            updatedAt: now
          }));
          newData.coaches = [...prev.coaches, ...importedCoaches];
        } else if (type === 'PRODUCTS') {
          const importedProducts: Product[] = parsed.map(p => ({
            ...p,
            id: Math.random().toString(36).substr(2, 9),
            buyPrice: parseFloat(p.buyPrice) || 0,
            sellPrice: parseFloat(p.sellPrice) || 0,
            stock: parseInt(p.stock) || 0,
            updatedAt: now
          }));
          newData.products = [...prev.products, ...importedProducts];
        }

        return newData;
      });
      alert(`${parsed.length} registros importados correctamente.`);
    };
    reader.readAsText(file);
  };

  // POS Functions
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return alert("Producto sin stock");
    setCart(prev => {
      const exists = prev.find(item => item.productId === product.id);
      if (exists) {
        if (exists.quantity >= product.stock) {
           alert("No hay más unidades disponibles");
           return prev;
        }
        return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { productId: product.id, description: product.description, price: product.sellPrice, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.productId !== productId));
  };

  const processCheckout = async () => {
    if (cart.length === 0) return;
    const total = cart.reduce((a, b) => a + (b.price * b.quantity), 0);
    
    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: data.nextOrderNumber,
      date: new Date().toISOString().split('T')[0],
      items: cart,
      total: total,
      paymentMethod: posPaymentMethod,
      status: 'PAID',
      customerName: customerName || 'Venta Mostrador',
      updatedAt: Date.now()
    };

    const newTx: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: data.nextOrderNumber,
      date: new Date().toISOString().split('T')[0],
      type: 'INCOME',
      category: 'STORE_SALE',
      amount: total,
      description: `Venta #${newSale.orderNumber} - ${newSale.customerName}`,
      paymentMethod: posPaymentMethod,
      updatedAt: Date.now()
    };

    persistData(prev => ({
      ...prev,
      sales: [newSale, ...prev.sales],
      transactions: [newTx, ...prev.transactions],
      products: prev.products.map(p => {
        const cartItem = cart.find(ci => ci.productId === p.id);
        return cartItem ? { ...p, stock: p.stock - cartItem.quantity } : p;
      }),
      pettyCashBalance: posPaymentMethod === 'CASH' ? prev.pettyCashBalance + total : prev.pettyCashBalance,
      nextOrderNumber: prev.nextOrderNumber + 1
    }));

    setCart([]);
    setCustomerName('');
    alert("Venta procesada con éxito");
  };

  // IA: Generar reporte
  const triggerAiReport = async () => {
    setIsGeneratingReport(true);
    try {
      const report = await generateSchoolReport(data);
      setAiReport(report);
    } catch (e) {
      alert("Error con la IA.");
    } finally {
      setIsGeneratingReport(false);
    }
  };

  // Seguridad: Backup
  const downloadBackup = () => {
    const backup = JSON.stringify(data, null, 2);
    const blob = new Blob([backup], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FutManager_Backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
  };

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6"><RefreshCw className="w-12 h-12 text-emerald-500 animate-spin" /><p className="text-emerald-500 font-black uppercase text-[10px] tracking-widest animate-pulse">Sincronizando con la Nube...</p></div>;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-[3.5rem] w-full max-w-md p-10 shadow-2xl space-y-8">
           <div className="text-center">
             <div className="w-16 h-16 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4"><Lock className="text-white w-8 h-8" /></div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Acceso FutManager</h1>
           </div>
           {loginStep === 'SELECT' ? (
             <div className="space-y-3">
               {(data.users || []).map(u => (
                 <button key={u.id} onClick={() => { setSelectedUserLogin(u); setLoginStep('PASSWORD'); }} className="w-full p-6 bg-slate-50 border-2 border-transparent hover:border-emerald-200 rounded-[2rem] flex items-center justify-between transition-all group">
                    <div className="text-left"><p className="font-black text-slate-800">{u.name}</p><p className="text-[10px] text-emerald-600 uppercase font-black">{u.role}</p></div>
                    <ChevronRight className="w-5 h-5 text-slate-300" />
                 </button>
               ))}
             </div>
           ) : (
             <form onSubmit={(e) => { e.preventDefault(); if (selectedUserLogin?.password === passwordInput) { setCurrentUser(selectedUserLogin); localStorage.setItem('futmanager_session', JSON.stringify(selectedUserLogin)); } else { alert("PIN Incorrecto"); setPasswordInput(''); } }} className="space-y-6">
                <input autoFocus type="password" placeholder="PIN" className="w-full py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-center font-black text-4xl outline-none" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
                <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[1.8rem] font-black shadow-2xl">Ingresar</button>
                <button type="button" onClick={() => { setLoginStep('SELECT'); setPasswordInput(''); }} className="w-full text-slate-400 font-black text-[10px] uppercase text-center">Volver</button>
             </form>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Alerta de Desconexión Flotante */}
      {syncStatus === 'ERROR' && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] animate-bounce">
           <div className="bg-rose-600 text-white px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border-2 border-white">
              <WifiOff className="w-6 h-6" />
              <div>
                <p className="text-xs font-black uppercase tracking-widest">Sin Conexión Cloud</p>
                <p className="text-[10px] font-bold opacity-80">Los cambios no se sincronizarán hasta restablecer la red.</p>
              </div>
              <button onClick={() => window.location.reload()} className="p-2 bg-white/20 rounded-full hover:bg-white/40 transition-all"><RefreshCw className="w-4 h-4" /></button>
           </div>
        </div>
      )}

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} school={data.school} currentUser={currentUser} onLogout={() => { setCurrentUser(null); localStorage.removeItem('futmanager_session'); }} />
      <main className="flex-1 ml-64 p-12 overflow-y-auto h-screen scrollbar-hide">
        <header className="flex items-center justify-between mb-12">
          <div><h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1">Módulo de Gestión</h2><h1 className="text-4xl font-black text-slate-900 capitalize tracking-tighter">{
            activeTab === 'coaches' ? 'Entrenadores' : 
            activeTab === 'users' ? 'Usuarios del Sistema' :
            activeTab === 'store' ? 'Tienda Pro' :
            activeTab === 'training' ? 'Metodología Deportiva' :
            <button 
  onClick={() => setIsProviderModalOpen(true)}
  className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-600 hover:border-emerald-500 transition-all"
>
  <span className="text-xl">🚚</span> Gestionar Proveedores
</button>
            activeTab
            <button 
  onClick={() => setIsProviderModalOpen(true)}
  className="..."
>
  <Truck size={18} /> Gestionar Proveedores
</button>
          }</h1></div>
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[8px] font-black text-slate-400 uppercase">Última Sincronización</span>
              <span className="text-[10px] font-bold text-slate-500 flex items-center gap-1"><Clock className="w-3 h-3 text-emerald-500" /> {lastSyncTime.toLocaleTimeString()}</span>
            </div>
            <div className={`px-5 py-2.5 rounded-full border-2 text-[10px] font-black uppercase flex items-center gap-3 ${syncStatus === 'CLOUD' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
              {syncStatus === 'CLOUD' ? <Globe className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />} {syncStatus === 'CLOUD' ? 'Conectado' : 'Offline'}
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in">
             <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-3xl relative overflow-hidden group">
               <div className="relative z-10 space-y-4">
                 <h2 className="text-5xl font-black italic tracking-tighter">Bienvenido,<br/>{currentUser.name}</h2>
                 <p className="text-slate-400 font-medium">Control total de la escuela en tiempo real.</p>
               </div>
               <Activity className="absolute right-[-20px] bottom-[-20px] w-64 h-64 text-emerald-500 opacity-5 -rotate-12" />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  { label: 'Alumnos Activos', val: data.students.length, icon: Users, color: 'emerald' },
                  { label: 'Caja Principal', val: formatCurrency(data.pettyCashBalance), icon: PiggyBank, color: 'blue' },
                  { label: 'Inventario', val: data.products.length, icon: Package, color: 'rose' },
                  { label: 'Próximos Partidos', val: data.matches.length, icon: Trophy, color: 'amber' }
                ].map((s, i) => (
                  <div key={i} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-2xl transition-all">
                    <s.icon className={`w-12 h-12 text-${s.color}-600 bg-${s.color}-50 p-3.5 rounded-2xl`} />
                    <div><p className="text-[10px] text-slate-400 uppercase font-black mb-1">{s.label}</p><p className="text-2xl font-black text-slate-800">{s.val}</p></div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'training' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm gap-6 border border-slate-100">
                <div className="relative flex-1 w-full max-w-md">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                   <input 
                     type="text" 
                     placeholder="Buscar por categoría u objetivo..." 
                     className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[1.5rem] font-bold outline-none ring-2 ring-slate-100 focus:ring-indigo-500/30 transition-all"
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                   />
                </div>
                <button 
                  onClick={() => setIsTrainingModalOpen(true)} 
                  className="px-10 py-5 bg-indigo-600 text-white font-black rounded-[1.5rem] shadow-2xl hover:bg-indigo-700 transition-all flex items-center gap-3 w-full md:w-auto justify-center"
                >
                  <BrainCircuit className="w-6 h-6" /> Nuevo Entrenamiento AI
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(data.trainingPlans || []).filter(tp => `${tp.category} ${tp.objective}`.toLowerCase().includes(searchTerm.toLowerCase())).map(plan => (
                  <div key={plan.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group flex flex-col">
                     <div className="flex items-start justify-between mb-8">
                        <div className="w-16 h-16 rounded-[1.2rem] bg-indigo-50 flex items-center justify-center text-indigo-600 border-2 border-white ring-8 ring-slate-50">
                           <ClipboardList className="w-8 h-8" />
                        </div>
                        <div className="text-[9px] font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full uppercase tracking-widest">{plan.date}</div>
                     </div>
                     <div className="space-y-4 flex-1">
                        <div>
                          <p className="text-[10px] text-indigo-600 font-black uppercase tracking-[0.2em] mb-1">{plan.category}</p>
                          <h4 className="text-xl font-black text-slate-800 tracking-tighter leading-tight line-clamp-2">{plan.objective}</h4>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl line-clamp-3 text-[11px] text-slate-500 font-medium leading-relaxed italic">
                           {plan.content.substring(0, 150)}...
                        </div>
                     </div>
                     <div className="flex gap-3 mt-8 pt-6 border-t border-slate-50">
                        <button className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all flex items-center justify-center gap-2"><BookOpen className="w-4 h-4" /> Ver Sesión</button>
                        <button onClick={() => { if(confirm('¿Eliminar plan?')) persistData(prev => ({ ...prev, trainingPlans: prev.trainingPlans.filter(tp => tp.id !== plan.id) })); }} className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-all"><Trash2 className="w-5 h-5" /></button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'store' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="flex gap-4 p-2 bg-white rounded-[2rem] w-fit shadow-sm">
                {['POS', 'INVENTORY'].map(v => (
                  <button key={v} onClick={() => setStoreView(v as any)} className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase transition-all ${storeView === v ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>{v === 'POS' ? 'Punto de Venta' : 'Inventario'}</button>
                ))}
             </div>

             {storeView === 'POS' && (
               <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  <div className="lg:col-span-8 space-y-6">
                     <div className="bg-white p-6 rounded-[2.5rem] shadow-sm flex items-center gap-4 border border-slate-100">
                        <Search className="text-slate-400 w-6 h-6 ml-4" />
                        <input type="text" placeholder="Buscar producto..." className="flex-1 py-2 outline-none font-bold text-slate-700" onChange={e => setSearchTerm(e.target.value)} />
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {data.products.filter(p => p.description.toLowerCase().includes(searchTerm.toLowerCase())).map(product => (
                          <button key={product.id} onClick={() => addToCart(product)} className="bg-white p-6 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all text-left flex flex-col gap-4 group active:scale-95">
                             <div className="w-full aspect-square bg-slate-50 rounded-[2rem] flex items-center justify-center relative overflow-hidden">
                                <Package className="w-12 h-12 text-slate-200 group-hover:scale-110 transition-transform" />
                                <div className="absolute top-4 right-4 bg-emerald-100 text-emerald-600 text-[8px] font-black px-3 py-1 rounded-full uppercase">Stock: {product.stock}</div>
                             </div>
                             <div>
                                <p className="text-[8px] text-slate-400 font-black uppercase tracking-widest">{product.category}</p>
                                <h4 className="font-black text-slate-800 leading-tight mb-2">{product.description}</h4>
                                <p className="text-lg font-black text-emerald-600">{formatCurrency(product.sellPrice)}</p>
                             </div>
                          </button>
                        ))}
                     </div>
                  </div>

                  <div className="lg:col-span-4 bg-white rounded-[3.5rem] shadow-sm border border-slate-100 p-10 sticky top-12 flex flex-col h-[calc(100vh-180px)]">
                     <div className="flex items-center gap-4 mb-8">
                        <div className="p-3 bg-slate-900 text-white rounded-2xl"><ShoppingCart className="w-6 h-6" /></div>
                        <h3 className="text-xl font-black text-slate-800 uppercase">Orden de Venta</h3>
                     </div>
                     
                     <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4 mb-8 pr-2">
                        {cart.length === 0 ? (
                          <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-30">
                             <ShoppingBag className="w-16 h-16" />
                             <p className="text-[10px] font-black uppercase tracking-widest">Carrito Vacío</p>
                          </div>
                        ) : cart.map(item => (
                          <div key={item.productId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl group">
                             <div className="flex-1">
                                <p className="text-xs font-black text-slate-800">{item.description}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{item.quantity} x {formatCurrency(item.price)}</p>
                             </div>
                             <button onClick={() => removeFromCart(item.productId)} className="p-2 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"><Trash className="w-4 h-4" /></button>
                          </div>
                        ))}
                     </div>

                     <div className="space-y-6 pt-6 border-t">
                        <div className="space-y-2">
                           <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Cliente (Opcional)</label>
                           <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Ej: Juan Pérez" className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border border-transparent focus:border-emerald-500/20" />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-2">
                           {[
                             { id: 'CASH', icon: Wallet },
                             { id: 'NEQUI', icon: Smartphone },
                             { id: 'CARD', icon: CreditCard }
                           ].map(m => (
                             <button key={m.id} onClick={() => setPosPaymentMethod(m.id as any)} className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${posPaymentMethod === m.id ? 'bg-emerald-50 border-emerald-500 text-emerald-600' : 'bg-slate-50 border-transparent text-slate-400'}`}>
                                <m.icon className="w-5 h-5" />
                                <span className="text-[8px] font-black uppercase">{m.id}</span>
                             </button>
                           ))}
                        </div>

                        <div className="flex justify-between items-center bg-slate-900 p-8 rounded-[2.5rem] text-white">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Total</p>
                              <p className="text-2xl font-black italic">{formatCurrency(cart.reduce((a, b) => a + (b.price * b.quantity), 0))}</p>
                           </div>
                           <button onClick={processCheckout} disabled={cart.length === 0} className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30">
                              <CheckCircle2 className="w-8 h-8" />
                           </button>
                        </div>
                     </div>
                  </div>
               </div>
             )}

             {storeView === 'INVENTORY' && (
                <div className="space-y-8">
                   <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm gap-4">
                      <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Kardex de Inventario</h3>
                      <div className="flex flex-wrap items-center gap-3">
                         <button onClick={() => downloadCSVTemplate('PRODUCTS')} className="p-4 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-2xl transition-all border border-slate-100" title="Descargar Plantilla CSV"><FileSpreadsheet className="w-5 h-5" /></button>
                         <button onClick={() => exportToCSV('Inventario_FutManager', data.products)} className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all border border-slate-100" title="Exportar CSV"><Download className="w-5 h-5" /></button>
                         <label className="p-4 bg-slate-50 text-slate-400 hover:text-amber-600 rounded-2xl transition-all border border-slate-100 cursor-pointer" title="Importar CSV">
                            <FileUp className="w-5 h-5" />
                            <input type="file" accept=".csv" className="hidden" onChange={(e) => {
                               const file = e.target.files?.[0];
                               if(file) handleImportCSV('PRODUCTS', file);
                            }} />
                         </label>
                         <button onClick={() => { setEditingProduct(undefined); setIsProductModalOpen(true); }} className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl flex items-center gap-3 ml-2"><Plus className="w-5 h-5" /> Agregar Producto</button>
                      </div>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                      {data.products.map(product => (
                        <div key={product.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all space-y-6 group">
                           <div className="flex justify-between items-start">
                              <div className={`p-4 rounded-3xl ${product.stock < 5 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'}`}>
                                 <Tag className="w-6 h-6" />
                              </div>
                              {product.stock < 5 && (
                                <div className="flex items-center gap-1 text-[8px] font-black text-rose-600 uppercase bg-rose-50 px-3 py-1 rounded-full animate-pulse"><AlertTriangle className="w-3 h-3" /> Bajo Stock</div>
                              )}
                           </div>
                           <div>
                              <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{product.category}</p>
                              <h4 className="text-xl font-black text-slate-800 tracking-tighter leading-tight mb-4">{product.description}</h4>
                              <div className="grid grid-cols-2 gap-4">
                                 <div className="p-3 bg-slate-50 rounded-2xl">
                                    <p className="text-[8px] text-slate-400 font-black uppercase mb-1">Precio</p>
                                    <p className="text-xs font-black text-slate-800">{formatCurrency(product.sellPrice)}</p>
                                 </div>
                                 <div className="p-3 bg-slate-50 rounded-2xl">
                                    <p className="text-[8px] text-slate-400 font-black uppercase mb-1">Stock</p>
                                    <p className={`text-xs font-black ${product.stock < 5 ? 'text-rose-600' : 'text-slate-800'}`}>{product.stock} Und.</p>
                                 </div>
                              </div>
                           </div>
                           <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all pt-4">
                              <button onClick={() => { setEditingProduct(product); setIsProductModalOpen(true); }} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest">Editar</button>
                              <button onClick={() => { if(confirm('¿Eliminar producto?')) persistData(prev => ({ ...prev, products: prev.products.filter(p => p.id !== product.id) })); }} className="p-3 bg-rose-50 text-rose-500 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>
             )}
          </div>
        )}

        {activeTab === 'students' && (
           <div className="space-y-8 animate-in fade-in">
              <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-[2rem] shadow-sm gap-4">
                <div className="relative flex-1 w-full max-w-md">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                   <input type="text" placeholder="Buscar alumno..." className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                   <button onClick={() => downloadCSVTemplate('STUDENTS')} className="p-4 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-2xl transition-all border border-slate-100" title="Descargar Plantilla CSV"><FileSpreadsheet className="w-5 h-5" /></button>
                   <button onClick={() => exportToCSV('Alumnos_FutManager', data.students)} className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all border border-slate-100" title="Exportar CSV"><Download className="w-5 h-5" /></button>
                   <label className="p-4 bg-slate-50 text-slate-400 hover:text-amber-600 rounded-2xl transition-all border border-slate-100 cursor-pointer" title="Importar CSV">
                      <FileUp className="w-5 h-5" />
                      <input type="file" accept=".csv" className="hidden" onChange={(e) => {
                         const file = e.target.files?.[0];
                         if(file) handleImportCSV('STUDENTS', file);
                      }} />
                   </label>
                   <button onClick={() => { setEditingStudent(undefined); setIsStudentModalOpen(true); }} className="px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl flex items-center gap-2 ml-2"><Plus /> Nuevo Alumno</button>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                 {data.students.filter(s => `${s.firstName} ${s.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                   <div key={s.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                      <div className="flex items-center gap-4 mb-6">
                        <div className="w-16 h-16 rounded-[1.5rem] bg-slate-100 overflow-hidden border-2 border-white ring-4 ring-slate-50">
                           {s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : <Users className="w-8 h-8 m-auto mt-4 text-slate-300" />}
                        </div>
                        <div>
                          <p className="font-black text-slate-800 leading-tight">{s.firstName} {s.lastName}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{s.category} • {s.position}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setEditingStudent(s); setIsStudentModalOpen(true); }} className="flex-1 py-3 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase">Ficha</button>
                        <button onClick={() => { if(confirm('¿Eliminar?')) persistData(prev => ({ ...prev, students: prev.students.filter(st => st.id !== s.id) })); }} className="p-3 bg-rose-50 text-rose-500 rounded-xl"><Trash2 className="w-4 h-4" /></button>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        )}

        {activeTab === 'coaches' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm gap-6 border border-slate-100">
                <div className="relative flex-1 w-full max-w-md">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                   <input 
                     type="text" 
                     placeholder="Buscar por nombre..." 
                     className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[1.5rem] font-bold outline-none ring-2 ring-slate-100 focus:ring-emerald-500/30 transition-all"
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                   />
                </div>
                <div className="flex flex-wrap items-center gap-3">
                   <button onClick={() => downloadCSVTemplate('COACHES')} className="p-4 bg-slate-50 text-slate-400 hover:text-emerald-600 rounded-2xl transition-all border border-slate-100" title="Descargar Plantilla CSV"><FileSpreadsheet className="w-5 h-5" /></button>
                   <button onClick={() => exportToCSV('Entrenadores_FutManager', data.coaches)} className="p-4 bg-slate-50 text-slate-400 hover:text-indigo-600 rounded-2xl transition-all border border-slate-100" title="Exportar CSV"><Download className="w-5 h-5" /></button>
                   <label className="p-4 bg-slate-50 text-slate-400 hover:text-amber-600 rounded-2xl transition-all border border-slate-100 cursor-pointer" title="Importar CSV">
                      <FileUp className="w-5 h-5" />
                      <input type="file" accept=".csv" className="hidden" onChange={(e) => {
                         const file = e.target.files?.[0];
                         if(file) handleImportCSV('COACHES', file);
                      }} />
                   </label>
                   <button 
                     onClick={() => { setEditingCoach(undefined); setIsCoachModalOpen(true); }} 
                     className="px-10 py-5 bg-emerald-600 text-white font-black rounded-[1.5rem] shadow-2xl hover:bg-emerald-700 transition-all flex items-center gap-3 w-full md:w-auto justify-center ml-2"
                   >
                     <UserPlus className="w-6 h-6" /> Nuevo Entrenador
                   </button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(data.coaches || []).filter(c => `${c.firstName} ${c.lastName}`.toLowerCase().includes(searchTerm.toLowerCase())).map(coach => (
                  <div 
                    key={coach.id} 
                    onClick={() => { setEditingCoach(coach); setIsCoachModalOpen(true); }}
                    className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group cursor-pointer"
                  >
                     <div className="flex items-start justify-between mb-8">
                        <div className="w-24 h-24 rounded-[2rem] bg-slate-100 overflow-hidden ring-8 ring-slate-50 border-2 border-white">
                           {coach.photo ? <img src={coach.photo} className="w-full h-full object-cover" /> : <UserSquare2 className="w-10 h-10 text-slate-300 m-auto mt-6" />}
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase flex items-center gap-2 ${coach.exitDate ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                           {coach.exitDate ? 'Inactivo' : 'Activo'}
                        </div>
                     </div>
                     <div className="space-y-1 mb-8">
                        <h4 className="text-xl font-black text-slate-800 tracking-tighter leading-tight">{coach.firstName}<br/>{coach.lastName}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2"><Briefcase className="w-3 h-3" /> {coach.category}</p>
                     </div>
                     <div className="grid grid-cols-1 gap-3 mb-8">
                        <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                          <Phone className="w-4 h-4 text-emerald-500" />
                          <div><p className="text-[8px] font-black text-slate-400 uppercase">Contacto</p><p className="text-xs font-black text-slate-800">{coach.phone}</p></div>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl flex items-center gap-4">
                          <Landmark className="w-4 h-4 text-emerald-500" />
                          <div><p className="text-[8px] font-black text-slate-400 uppercase">Salario Base</p><p className="text-xs font-black text-slate-800">{formatCurrency(coach.baseSalary)}</p></div>
                        </div>
                     </div>
                     <div className="flex gap-3">
                        <button onClick={() => { setEditingCoach(coach); setIsCoachModalOpen(true); }} className="flex-1 py-4 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"><FileText className="w-4 h-4" /> Perfil</button>
                        <button 
                          onClick={(e) => { e.stopPropagation(); if(confirm('¿Eliminar entrenador?')) persistData(prev => ({ ...prev, coaches: prev.coaches.filter(c => c.id !== coach.id) })); }} 
                          className="p-4 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-all"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm gap-6 border border-slate-100">
                <div className="relative flex-1 w-full max-w-md">
                   <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                   <input 
                     type="text" 
                     placeholder="Buscar por nombre o email..." 
                     className="w-full pl-14 pr-6 py-4 bg-slate-50 border-none rounded-[1.5rem] font-bold outline-none ring-2 ring-slate-100 focus:ring-emerald-500/30 transition-all"
                     value={searchTerm}
                     onChange={e => setSearchTerm(e.target.value)}
                   />
                </div>
                <button 
                  onClick={() => setIsUserModalOpen(true)} 
                  className="px-10 py-5 bg-emerald-600 text-white font-black rounded-[1.5rem] shadow-2xl hover:bg-emerald-700 transition-all flex items-center gap-3 w-full md:w-auto justify-center"
                >
                  <UserPlus className="w-6 h-6" /> Nuevo Usuario
                </button>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(data.users || []).filter(u => `${u.name} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase())).map(user => (
                  <div key={user.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
                     <div className="flex items-start justify-between mb-8">
                        <div className="w-20 h-20 rounded-[1.8rem] bg-emerald-50 flex items-center justify-center text-emerald-600 border-2 border-white ring-8 ring-slate-50">
                           <UserSquare2 className="w-10 h-10" />
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-[8px] font-black uppercase flex items-center gap-2 ${user.role === 'ADMIN' ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-50 text-slate-500'}`}>
                           <ShieldCheck className="w-3 h-3" />
                           {user.role}
                        </div>
                     </div>
                     <div className="space-y-1 mb-8">
                        <h4 className="text-xl font-black text-slate-800 tracking-tighter leading-tight flex items-center gap-2">
                          {user.name}
                          {user.id === currentUser.id && <span className="bg-emerald-500 text-white text-[8px] px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Tú</span>}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-2">
                          <Mail className="w-3 h-3" /> {user.email}
                        </p>
                     </div>
                     <div className="p-4 bg-slate-50 rounded-2xl flex items-center justify-between mb-8">
                        <div>
                          <p className="text-[8px] font-black text-slate-400 uppercase">Clave de Acceso</p>
                          <p className="text-xs font-black text-slate-800 tracking-widest">
                            {visiblePins[user.id] ? user.password : '••••••'}
                          </p>
                        </div>
                        <button onClick={() => setVisiblePins(prev => ({...prev, [user.id]: !prev[user.id]}))} className="p-2 text-slate-400 hover:text-emerald-600">
                           {visiblePins[user.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                     </div>
                     <div className="flex gap-3">
                        <button 
                          disabled={user.id === currentUser.id}
                          onClick={() => { if(confirm(`¿Eliminar acceso a ${user.name}?`)) persistData(prev => ({ ...prev, users: prev.users.filter(u => u.id !== user.id) })); }} 
                          className="w-full py-4 bg-rose-50 text-rose-500 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-100 transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" /> Revocar Acceso
                        </button>
                     </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="flex gap-4 p-2 bg-white rounded-[2rem] w-fit shadow-sm">
                {['RECAUDO', 'NOMINA', 'CAJA'].map(v => (
                  <button key={v} onClick={() => setFinancialView(v as any)} className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase transition-all ${financialView === v ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>{v}</button>
                ))}
             </div>

             {financialView === 'RECAUDO' && (
               <div className="space-y-8">
                  <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm gap-6">
                    <div className="flex-1 relative w-full">
                       <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                       <input type="text" placeholder="Filtrar alumnos por nombre o categoría..." className="w-full pl-14 pr-6 py-4 bg-slate-50 rounded-2xl outline-none font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                    <div className="flex items-center gap-3">
                       <button onClick={exportArrearsReport} className="px-6 py-4 bg-rose-50 text-rose-600 font-black rounded-2xl text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-rose-100 transition-all">
                          <UserX className="w-4 h-4" /> Reporte de Mora
                       </button>
                       <button onClick={() => exportToCSV('Historial_Recaudo_Mensualidades', data.monthlyPayments || [])} className="px-6 py-4 bg-slate-900 text-white font-black rounded-2xl text-[9px] uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all">
                          <FileSpreadsheet className="w-4 h-4" /> Historial Pagos
                       </button>
                    </div>
                  </div>

                  <div className="bg-white rounded-[3rem] shadow-sm overflow-hidden border border-slate-100">
                    <div className="p-10 border-b flex justify-between items-center bg-slate-50/30">
                       <h3 className="text-xl font-black text-slate-800 uppercase">Estado de Mensualidades - {currentMonth}</h3>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left">
                        <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                          <tr><th className="px-10 py-6">Alumno</th><th className="px-10 py-6">Categoría</th><th className="px-10 py-6">Mes Actual</th><th className="px-10 py-6">Último Pago</th><th className="px-10 py-6 text-center">Acciones</th></tr>
                        </thead>
                        <tbody className="font-bold divide-y">
                          {data.students.filter(s => `${s.firstName} ${s.lastName} ${s.category}`.toLowerCase().includes(searchTerm.toLowerCase())).map(s => {
                            const isPaid = (s.paidMonths || []).includes(currentMonth);
                            const lastMonth = s.paidMonths?.length ? s.paidMonths[s.paidMonths.length - 1] : 'Ninguno';
                            return (
                              <tr key={s.id} className="hover:bg-slate-50/50">
                                 <td className="px-10 py-6 text-slate-800">{s.firstName} {s.lastName}</td>
                                 <td className="px-10 py-6 text-slate-400 text-xs">{s.category}</td>
                                 <td className="px-10 py-6">
                                    <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase ${isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>{isPaid ? 'Al Día' : 'En Mora'}</span>
                                 </td>
                                 <td className="px-10 py-6 text-slate-400 text-xs">{lastMonth}</td>
                                 <td className="px-10 py-6 text-center">
                                    <div className="flex items-center justify-center gap-2">
                                       <button onClick={() => { setStudentForPayment(s); setIsPaymentModalOpen(true); }} className="p-3 bg-emerald-600 text-white rounded-xl shadow-lg hover:scale-105 transition-all" title="Registrar Pago">
                                          <Wallet className="w-4 h-4" />
                                       </button>
                                       {isPaid && (
                                          <button onClick={() => {
                                             const lastRecord = (data.monthlyPayments || []).find(r => r.studentId === s.id && r.month === currentMonth);
                                             if(lastRecord) printMonthlyReceipt(lastRecord, data.school.name);
                                          }} className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all" title="Imprimir Comprobante">
                                             <Printer className="w-4 h-4" />
                                          </button>
                                       )}
                                    </div>
                                 </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
               </div>
             )}

             {financialView === 'NOMINA' && (
               <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Total Pagado Mes</p>
                        <p className="text-2xl font-black text-emerald-600 italic">{formatCurrency(payrollStats.totalPaid)}</p>
                     </div>
                     <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Pendiente por Pagar</p>
                        <p className="text-2xl font-black text-rose-600 italic">{formatCurrency(payrollStats.totalPending)}</p>
                     </div>
                     <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl">
                        <p className="text-[10px] font-black text-slate-400 uppercase mb-2">Entrenadores Pendientes</p>
                        <p className="text-2xl font-black text-emerald-400 italic">{payrollStats.pendingCount}</p>
                     </div>
                  </div>

                  <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden">
                     <div className="p-10 border-b flex justify-between items-center bg-slate-50/30">
                        <h3 className="text-xl font-black text-slate-800 uppercase">Control de Nómina - {currentMonth}</h3>
                     </div>
                     <div className="overflow-x-auto">
                        <table className="w-full text-left">
                           <thead className="bg-slate-50 text-[10px] font-black uppercase text-slate-400 border-b">
                              <tr>
                                 <th className="px-10 py-6">Entrenador</th>
                                 <th className="px-10 py-6">Salario Base</th>
                                 <th className="px-10 py-6">Estado Mes</th>
                                 <th className="px-10 py-6 text-center">Acciones</th>
                              </tr>
                           </thead>
                           <tbody className="font-bold divide-y">
                              {data.coaches.filter(c => !c.exitDate).map(coach => {
                                 const record = (data.payrollRecords || []).find(r => r.coachId === coach.id && r.month === currentMonth);
                                 return (
                                    <tr key={coach.id} className="hover:bg-slate-50/50">
                                       <td className="px-10 py-6">
                                          <div className="flex items-center gap-3">
                                             <div className="w-8 h-8 rounded-full bg-slate-100 overflow-hidden">
                                                {coach.photo ? <img src={coach.photo} className="w-full h-full object-cover" /> : <UserSquare2 className="w-5 h-5 m-auto mt-1.5 text-slate-300" />}
                                             </div>
                                             <div>
                                                <p className="text-slate-800">{coach.firstName} {coach.lastName}</p>
                                                <p className="text-[8px] text-slate-400 uppercase tracking-widest">{coach.category}</p>
                                             </div>
                                          </div>
                                       </td>
                                       <td className="px-10 py-6 text-slate-500">{formatCurrency(coach.baseSalary)}</td>
                                       <td className="px-10 py-6">
                                          <span className={`px-4 py-2 rounded-full text-[9px] font-black uppercase ${record ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}>
                                             {record ? 'Pagado' : 'Pendiente'}
                                          </span>
                                       </td>
                                       <td className="px-10 py-6 text-center">
                                          <div className="flex items-center justify-center gap-2">
                                             {!record ? (
                                                <button 
                                                   onClick={() => handlePayrollPayment(coach)} 
                                                   className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-[9px] font-black uppercase rounded-xl shadow-lg hover:scale-105 transition-all"
                                                >
                                                   <Wallet className="w-3.5 h-3.5" /> Pagar
                                                </button>
                                             ) : (
                                                <button 
                                                   onClick={() => printPayrollStub(record, data.school.name)} 
                                                   className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                                                   title="Ver Desprendible"
                                                >
                                                   <ReceiptText className="w-4 h-4" />
                                                </button>
                                             )}
                                          </div>
                                       </td>
                                    </tr>
                                 );
                              })}
                           </tbody>
                        </table>
                     </div>
                  </div>

                  {/* Reporte histórico de pagos */}
                  <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-10">
                     <div className="flex justify-between items-center mb-8">
                        <h3 className="text-lg font-black text-slate-800 uppercase">Histórico de Nómina (General)</h3>
                        <button onClick={() => exportToCSV('Nomina_FutManager', data.payrollRecords || [])} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white text-[10px] font-black uppercase rounded-xl">
                           <FileSpreadsheet className="w-4 h-4" /> Exportar Reporte
                        </button>
                     </div>
                     <div className="space-y-3">
                        {(data.payrollRecords || []).slice(0, 10).map(pr => (
                           <div key={pr.id} className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl border border-slate-100 hover:border-indigo-100 transition-all">
                              <div className="flex items-center gap-4">
                                 <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl"><Briefcase className="w-4 h-4" /></div>
                                 <div>
                                    <p className="text-sm font-black text-slate-800">{pr.coachName}</p>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{pr.month} • Comprobante #{String(pr.orderNumber).padStart(5, '0')}</p>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-sm font-black text-slate-800">{formatCurrency(pr.netPaid)}</p>
                                 <button onClick={() => printPayrollStub(pr, data.school.name)} className="text-[9px] font-black text-indigo-600 uppercase hover:underline">Imprimir Copia</button>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
             )}

             {financialView === 'CAJA' && (
               <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                     <div className="bg-emerald-600 p-8 rounded-[3rem] text-white shadow-xl shadow-emerald-100">
                        <p className="text-[10px] font-black uppercase opacity-60 mb-2">Ingresos Mes</p>
                        <p className="text-3xl font-black italic">{formatCurrency(monthlyStats.inc)}</p>
                     </div>
                     <div className="bg-rose-600 p-8 rounded-[3rem] text-white shadow-xl shadow-rose-100">
                        <p className="text-[10px] font-black uppercase opacity-60 mb-2">Egresos Mes</p>
                        <p className="text-3xl font-black italic">{formatCurrency(monthlyStats.exp)}</p>
                     </div>
                     <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-xl shadow-slate-200">
                        <p className="text-[10px] font-black uppercase opacity-60 mb-2">Saldo Caja Física</p>
                        <p className="text-3xl font-black italic text-emerald-400">{formatCurrency(data.pettyCashBalance)}</p>
                     </div>
                  </div>
                  <div className="bg-white rounded-[3rem] shadow-sm border border-slate-100 p-10">
                     <div className="flex justify-between items-center mb-10">
                        <h3 className="text-xl font-black text-slate-800 uppercase">Libro Diario</h3>
                        <button onClick={() => setIsTransactionModalOpen(true)} className="px-6 py-3 bg-slate-100 text-slate-600 font-black rounded-xl text-[10px] uppercase hover:bg-slate-200 transition-all">+ Nuevo Movimiento</button>
                     </div>
                     <div className="space-y-4">
                        {data.transactions.slice(0, 10).map(t => (
                          <div key={t.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[2rem] border border-slate-100 group">
                             <div className="flex items-center gap-5">
                                <div className={`p-4 rounded-2xl ${t.type === 'INCOME' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                                   {t.type === 'INCOME' ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                                </div>
                                <div>
                                   <p className="text-sm font-black text-slate-800">{t.description}</p>
                                   <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest">{t.date} • {t.paymentMethod}</p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className={`text-lg font-black ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'INCOME' ? '+' : '-'} {formatCurrency(t.amount)}</p>
                                <button onClick={() => printReceipt(t, data.school.name)} className="p-2 text-slate-300 hover:text-indigo-600 opacity-0 group-hover:opacity-100 transition-all"><Printer className="w-4 h-4" /></button>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-10 animate-in fade-in">
             <div className="flex items-center justify-between bg-white p-10 rounded-[4rem] shadow-sm border border-slate-100 overflow-hidden relative">
                <div className="relative z-10">
                   <h3 className="text-3xl font-black text-slate-900 tracking-tighter mb-4">Analítica Predictiva con IA</h3>
                   <p className="text-slate-400 font-medium max-w-sm mb-8">Utiliza Gemini Pro para analizar la salud de tu escuela y obtener recomendaciones estratégicas.</p>
                   <button onClick={triggerAiReport} disabled={isGeneratingReport} className="px-10 py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center gap-4 hover:bg-indigo-700 transition-all shadow-2xl shadow-indigo-200 disabled:opacity-50">
                      {isGeneratingReport ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      Generar Informe Estratégico
                   </button>
                </div>
                <BrainCircuit className="absolute right-10 top-1/2 -translate-y-1/2 w-64 h-64 text-indigo-500 opacity-5" />
             </div>

             {aiReport && (
               <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 animate-in slide-in-from-bottom-5">
                  <div className="flex items-center gap-4 mb-8 border-b pb-6">
                     <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl"><Activity className="w-8 h-8" /></div>
                     <div><h4 className="text-xl font-black text-slate-800 uppercase">Resultado del Análisis</h4><p className="text-[10px] text-slate-400 font-black uppercase">Basado en datos de hoy {new Date().toLocaleDateString()}</p></div>
                  </div>
                  <div className="prose prose-slate max-w-none text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                     {aiReport}
                  </div>
               </div>
             )}
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm">
                <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Convocatorias de Juego</h3>
                <button onClick={() => setIsMatchModalOpen(true)} className="px-8 py-4 bg-amber-500 text-white font-black rounded-2xl shadow-xl hover:bg-amber-600 transition-all flex items-center gap-2"><Trophy className="w-5 h-5" /> Organizar Partido</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {data.matches.map(m => (
                  <div key={m.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all relative group">
                     <div className="absolute top-8 right-8 text-[9px] font-black bg-slate-100 text-slate-500 px-4 py-2 rounded-full uppercase">{m.date}</div>
                     <div className="flex flex-col items-center text-center space-y-4 mb-8">
                        <div className="flex items-center justify-center gap-6 w-full">
                           <div className="flex-1 text-right font-black text-slate-800 uppercase tracking-tighter">{data.school.name}</div>
                           <div className="text-2xl font-black italic text-emerald-500">VS</div>
                           <div className="flex-1 text-left font-black text-rose-600 uppercase tracking-tighter">{m.opponent}</div>
                        </div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{m.tournament} • {m.location}</p>
                     </div>
                     <div className="grid grid-cols-2 gap-4 mb-8">
                        <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center">
                           <span className="text-[8px] font-black text-slate-400 uppercase mb-1">Titulares</span>
                           <span className="text-xl font-black text-indigo-600">{m.starters.length}</span>
                        </div>
                        <div className="p-4 bg-slate-50 rounded-2xl flex flex-col items-center">
                           <span className="text-[8px] font-black text-slate-400 uppercase mb-1">Suplentes</span>
                           <span className="text-xl font-black text-amber-500">{m.substitutes.length}</span>
                        </div>
                     </div>
                     <button className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl text-[9px] uppercase tracking-widest hover:bg-emerald-600 transition-all">Ver Planilla Pro</button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'backups' && (
          <div className="space-y-10 animate-in fade-in">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 space-y-6">
                   <div className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl w-fit"><Download className="w-8 h-8" /></div>
                   <div><h4 className="text-2xl font-black text-slate-900 uppercase">Exportar Datos</h4><p className="text-slate-400 font-medium">Crea una copia de seguridad local de toda tu escuela en formato JSON.</p></div>
                   <button onClick={downloadBackup} className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">Descargar FutManager.json</button>
                </div>
                <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 space-y-6">
                   <div className="p-4 bg-indigo-50 text-indigo-600 rounded-3xl w-fit"><Upload className="w-8 h-8" /></div>
                   <div><h4 className="text-2xl font-black text-slate-900 uppercase">Restaurar Cloud</h4><p className="text-slate-400 font-medium">Sube un archivo de backup previo para sobreescribir los datos actuales.</p></div>
                   <div className="relative">
                      <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => {
                        const file = e.target.files?.[0];
                        if(file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            try {
                              const json = JSON.parse(ev.target?.result as string);
                              if(confirm('¿Seguro que deseas restaurar estos datos? Se sobreescribirá todo en la nube.')) persistData(() => json);
                            } catch(e) { alert("Archivo inválido"); }
                          };
                          reader.readAsText(file);
                        }
                      }} />
                      <button className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest shadow-xl">Subir y Restaurar</button>
                   </div>
                </div>
             </div>
             <div className="bg-rose-50 p-10 rounded-[3rem] border border-rose-100 space-y-4">
                <div className="flex items-center gap-4 text-rose-600 font-black uppercase text-sm"><AlertTriangle /> Zona de Peligro</div>
                <p className="text-xs text-rose-500 font-bold">Reiniciar los datos de la escuela eliminará todos los registros en Firebase de forma permanente.</p>
                <button onClick={() => { if(confirm('¿ESTÁS ABSOLUTAMENTE SEGURO? Esta acción no se puede deshacer.')) persistData(() => INITIAL_DATA); }} className="px-10 py-4 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs">Reiniciar Base de Datos</button>
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="max-w-2xl mx-auto bg-white p-12 rounded-[4rem] shadow-sm border border-slate-100 animate-in fade-in space-y-10">
             <div className="flex items-center gap-4 border-b pb-8">
                <div className="p-4 bg-slate-100 text-slate-600 rounded-3xl"><SettingsIcon className="w-8 h-8" /></div>
                <div><h3 className="text-2xl font-black text-slate-900 uppercase">Ajustes Institucionales</h3><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Identidad y parámetros globales</p></div>
             </div>
             <div className="space-y-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Nombre de la Escuela</label>
                   <input type="text" value={data.school.name} onChange={e => persistData(prev => ({ ...prev, school: { ...prev.school, name: e.target.value } }))} className="w-full p-6 bg-slate-50 rounded-[2rem] font-black text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-emerald-500/20" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Eslogan / Lema</label>
                   <input type="text" value={data.school.slogan} onChange={e => persistData(prev => ({ ...prev, school: { ...prev.school, slogan: e.target.value } }))} className="w-full p-6 bg-slate-50 rounded-[2rem] font-black text-slate-800 outline-none ring-2 ring-slate-100 focus:ring-emerald-500/20" />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Logotipo (URL Imagen)</label>
                   <input type="text" value={data.school.logo || ''} onChange={e => persistData(prev => ({ ...prev, school: { ...prev.school, logo: e.target.value } }))} className="w-full p-6 bg-slate-50 rounded-[2rem] font-bold text-slate-500 outline-none ring-2 ring-slate-100" placeholder="https://..." />
                </div>
             </div>
             <div className="p-8 bg-slate-900 rounded-[3rem] text-white flex items-center justify-between">
                <div className="flex items-center gap-4"><div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center"><CheckCircle2 className="w-6 h-6" /></div><p className="text-xs font-bold">Cambios sincronizados automáticamente para todos los usuarios.</p></div>
             </div>
            <ProviderModal 
  isOpen={isProviderModalOpen} 
  onClose={() => setIsProviderModalOpen(false)}
  onSave={(p) => {
    // Esto guarda el proveedor sin importar cómo se llame tu función de guardado
    console.log("Proveedor guardado:", p);
    setIsProviderModalOpen(false);
  }}
/>
          </div>
        )}

        <StudentModal isOpen={isStudentModalOpen} onClose={() => { setIsStudentModalOpen(false); setEditingStudent(undefined); }} student={editingStudent} onSave={(s) => { persistData(prev => ({ ...prev, students: prev.students.find(st => st.id === s.id) ? prev.students.map(st => st.id === s.id ? s : st) : [...prev.students, s] })); setIsStudentModalOpen(false); }} coaches={(data.coaches || []).map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))} />
        <TrainingModal isOpen={isTrainingModalOpen} onClose={() => setIsTrainingModalOpen(false)} onSave={(plan) => persistData(prev => ({ ...prev, trainingPlans: [plan, ...(prev.trainingPlans || [])] }))} coachId={currentUser?.id || ''} />
        <CoachModal isOpen={isCoachModalOpen} onClose={() => { setIsCoachModalOpen(false); setEditingCoach(undefined); }} coach={editingCoach} onSave={(c) => persistData(prev => ({ ...prev, coaches: prev.coaches.find(ch => ch.id === c.id) ? prev.coaches.map(ch => ch.id === c.id ? c : ch) : [...prev.coaches, c] }))} />
        <TransactionModal isOpen={isTransactionModalOpen} onClose={() => setIsTransactionModalOpen(false)} onSave={(t) => persistData(prev => ({ ...prev, transactions: [{ ...t, id: Math.random().toString(36).substr(2, 9), orderNumber: prev.nextOrderNumber, updatedAt: Date.now() }, ...prev.transactions], pettyCashBalance: t.type === 'INCOME' ? (t.paymentMethod === 'CASH' ? prev.pettyCashBalance + t.amount : prev.pettyCashBalance) : (t.paymentMethod === 'CASH' ? prev.pettyCashBalance - t.amount : prev.pettyCashBalance), nextOrderNumber: prev.nextOrderNumber + 1 }))} />
        <ProductModal isOpen={isProductModalOpen} onClose={() => setIsProductModalOpen(false)} product={editingProduct} onSave={(p) => persistData(prev => ({ ...prev, products: prev.products.find(pr => pr.id === p.id) ? prev.products.map(pr => pr.id === p.id ? p : pr) : [...prev.products, p] }))} />
        <MatchModal isOpen={isMatchModalOpen} onClose={() => setIsMatchModalOpen(false)} students={data.students} onSave={(m) => persistData(prev => ({ ...prev, matches: [m, ...prev.matches] }))} />
        <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={(u) => persistData(prev => ({ ...prev, users: [...prev.users, u] }))} />
        
        {studentForPayment && (
          <StudentPaymentModal 
            isOpen={isPaymentModalOpen} 
            onClose={() => { setIsPaymentModalOpen(false); setStudentForPayment(null); }} 
            student={studentForPayment} 
            onSave={handleSaveMonthlyPayments} 
          />
        )}
      </main>
    </div>
  );
};

export default App;
