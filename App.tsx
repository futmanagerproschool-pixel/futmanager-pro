import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc, getDoc } from 'firebase/firestore';
import { getAnalytics } from "firebase/analytics";
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
  WifiOff, AlertCircle, ReceiptText, UserX, Truck
} from 'lucide-react';

// Componentes e Interfaces
import Sidebar from './components/Sidebar';
import StudentModal from './components/StudentModal';
import TrainingModal from './components/TrainingModal';
import CoachModal from './components/CoachModal';
import MatchModal from './components/MatchModal';
import UserModal from './components/UserModal';
import TransactionModal from './components/TransactionModal';
import ProductModal from './components/ProductModal';
import StudentPaymentModal from './components/StudentPaymentModal';
import ProviderModal from './components/ProviderModal';
import { AppData, Student, User, Coach, Product, Transaction, PaymentMethod, MonthlyPaymentRecord, PayrollRecord, TrainingPlan, Sale, SaleItem, Provider, BloodType } from './types';
import { INITIAL_DATA } from './constants';
import { formatCurrency, exportToCSV, printMonthlyReceipt, calculateAge, printReceipt, parseCSV } from './utils';
import { generateSchoolReport } from './geminiService';

// --- CONFIGURACIÓN DE FIREBASE ---
const firebaseConfig = {
  apiKey: "AIzaSyD8COWL_GU3k1oIN37r5rroBuqYvCD4Skw",
  authDomain: "futmanagerpro-42dfd.firebaseapp.com",
  projectId: "futmanagerpro-42dfd",
  storageBucket: "futmanagerpro-42dfd.firebasestorage.app",
  messagingSenderId: "934402477410",
  appId: "1:934402477410:web:ce63f48cf38179d67c703b",
  measurementId: "G-WG0D4K2TF5"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const analytics = getAnalytics(app);

const App: React.FC = () => {
  // Estados de Datos y Sincronización
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const [syncStatus, setSyncStatus] = useState<'LOCAL' | 'CLOUD' | 'ERROR'>('LOCAL');

  // Estados de Navegación y UI
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [financialView, setFinancialView] = useState<'RECAUDO' | 'NOMINA' | 'CAJA'>('RECAUDO');
  const [storeView, setStoreView] = useState<'POS' | 'INVENTORY'>('POS');

  // Estados de Modales y Edición
  const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
  const [editingProvider, setEditingProvider] = useState<Provider | null>(null);
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

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('futmanager_session');
    return saved ? JSON.parse(saved) : null;
  });
  const [loginStep, setLoginStep] = useState<'SELECT' | 'PASSWORD'>('SELECT');
  const [selectedUserLogin, setSelectedUserLogin] = useState<User | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  // POS State
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [posPaymentMethod, setPosPaymentMethod] = useState<PaymentMethod>('CASH');

  // --- LÓGICA DE FIREBASE (READ) ---
  useEffect(() => {
    const docRef = doc(db, 'escuela', 'datos_principales');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data() as AppData);
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

  // --- LÓGICA DE PERSISTENCIA (WRITE) ---
  const persistData = async (updater: (prev: AppData) => AppData) => {
  setIsSyncing(true);
  try {
    // Calculamos el nuevo estado basado en el estado anterior más reciente
    const updated = updater(data);
    
    // Referencia exacta al documento
    const docRef = doc(db, 'escuela', 'datos_principales');
    
    // Guardado forzado
    await setDoc(docRef, updated, { merge: true });
    
    console.log("✅ ¡ÉXITO! Guardado en Firebase:", updated);
    setSyncStatus('CLOUD');
  } catch (e: any) {
    console.error("❌ ERROR DE FIREBASE:", e);
    setSyncStatus('ERROR');
    
    // Esto te dirá exactamente POR QUÉ falla (ej: "Missing or insufficient permissions")
    alert(`Error de Firebase: ${e.message}`);
  } finally {
    setIsSyncing(false);
  }
};

  // --- HANDLERS DE NEGOCIO ---
  const handleSaveProvider = (provider: Provider) => {
    persistData(prev => ({
      ...prev,
      providers: prev.providers 
        ? (prev.providers.find(p => p.id === provider.id) 
            ? prev.providers.map(p => p.id === provider.id ? provider : p)
            : [...prev.providers, provider])
        : [provider]
    }));
    setIsProviderModalOpen(false);
    setEditingProvider(null);
  };

  const currentMonth = new Date().toISOString().slice(0, 7);

  const handlePayrollPayment = (coach: Coach) => {
    const net = coach.baseSalary;
    if (net > data.pettyCashBalance) return alert("Fondo insuficiente.");
    const newRecord: PayrollRecord = {
      id: Math.random().toString(36).substr(2, 9),
      coachId: coach.id,
      coachName: `${coach.firstName} ${coach.lastName}`,
      month: currentMonth,
      baseSalary: coach.baseSalary,
      discounts: 0,
      netPaid: net,
      paymentMethod: 'CASH',
      date: new Date().toISOString().split('T')[0],
      orderNumber: data.nextOrderNumber
    };
    persistData(prev => ({
      ...prev,
      payrollRecords: [newRecord, ...(prev.payrollRecords || [])],
      pettyCashBalance: prev.pettyCashBalance - net,
      nextOrderNumber: prev.nextOrderNumber + 1
    }));
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return alert("Sin stock");
    setCart(prev => {
      const exists = prev.find(item => item.productId === product.id);
      if (exists) return prev.map(item => item.productId === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      return [...prev, { productId: product.id, description: product.description, price: product.sellPrice, quantity: 1 }];
    });
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
    persistData(prev => ({
      ...prev,
      sales: [newSale, ...prev.sales],
      products: prev.products.map(p => {
        const item = cart.find(ci => ci.productId === p.id);
        return item ? { ...p, stock: p.stock - item.quantity } : p;
      }),
      pettyCashBalance: posPaymentMethod === 'CASH' ? prev.pettyCashBalance + total : prev.pettyCashBalance,
      nextOrderNumber: prev.nextOrderNumber + 1
    }));
    setCart([]);
    setCustomerName('');
    alert("Venta procesada");
  };

  // --- RENDERIZADO DE CARGA Y LOGIN ---
  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
      <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin" />
      <p className="text-emerald-500 font-black uppercase text-[10px] tracking-widest animate-pulse">Sincronizando con la Nube...</p>
    </div>
  );

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

  // --- RENDERIZADO PRINCIPAL ---
  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} school={data.school} currentUser={currentUser} onLogout={() => { setCurrentUser(null); localStorage.removeItem('futmanager_session'); }} />
      
      <main className="flex-1 ml-64 p-12 overflow-y-auto h-screen">
        <header className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1">Módulo de Gestión</h2>
            <h1 className="text-4xl font-black text-slate-900 capitalize tracking-tighter">
              {activeTab === 'dashboard' ? 'Panel Principal' : 
               activeTab === 'store' ? 'Tienda Pro' : 
               activeTab === 'providers' ? 'Proveedores' : activeTab}
            </h1>
          </div>
          
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsProviderModalOpen(true)}
              className="flex items-center gap-3 px-6 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-[10px] uppercase text-slate-600 hover:border-emerald-500 transition-all"
            >
              <Truck size={18} className="text-emerald-500" /> Gestionar Proveedores
            </button>
            <div className={`px-5 py-2.5 rounded-full border-2 text-[10px] font-black uppercase flex items-center gap-3 ${syncStatus === 'CLOUD' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
              {syncStatus === 'CLOUD' ? <Globe className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />} {syncStatus === 'CLOUD' ? 'Sincronizado' : 'Error Red'}
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
                  { label: 'Alumnos', val: data.students.length, icon: Users, color: 'emerald' },
                  { label: 'Caja', val: formatCurrency(data.pettyCashBalance), icon: PiggyBank, color: 'blue' },
                  { label: 'Productos', val: data.products.length, icon: Package, color: 'rose' },
                  { label: 'Proveedores', val: data.providers?.length || 0, icon: Truck, color: 'amber' }
                ].map((s, i) => (
                  <div key={i} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-2xl transition-all">
                    <s.icon className={`w-12 h-12 text-slate-600 bg-slate-50 p-3.5 rounded-2xl`} />
                    <div><p className="text-[10px] text-slate-400 uppercase font-black mb-1">{s.label}</p><p className="text-2xl font-black text-slate-800">{s.val}</p></div>
                  </div>
                ))}
             </div>
          </div>
        )}
        
        {/* Aquí puedes seguir pegando el resto de tus bloques activeTab (training, store, etc.) 
            manteniendo la misma lógica de mapeo de data */}

      </main>

      {/* Modales Críticos */}
      <ProviderModal 
        isOpen={isProviderModalOpen} 
        onClose={() => setIsProviderModalOpen(false)} 
        onSave={handleSaveProvider}
        editingProvider={editingProvider}
      />
      
      {isStudentModalOpen && (
        <StudentModal 
          isOpen={isStudentModalOpen} 
          onClose={() => setIsStudentModalOpen(false)} 
          onSave={(student) => persistData(prev => ({ ...prev, students: [...prev.students, student] }))}
        />
      )}
      
      {/* Resto de modales (Training, Coach, Match, etc.) siguiendo el mismo patrón */}

    </div>
  );
};

export default App;
