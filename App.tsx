import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { 
  Plus, Users, PiggyBank, Trophy, ChevronRight, RefreshCw, Lock, 
  Search, ShoppingBag, Package, Globe, Activity, Truck, X, Save, 
  WifiOff, Calendar, CreditCard, ShoppingCart, UserPlus, ClipboardList 
} from 'lucide-react';

// --- IMPORTACIÓN DE TUS COMPONENTES ---
import Sidebar from './components/Sidebar';
import StudentModal from './components/StudentModal';
import ProviderModal from './components/ProviderModal';
import CoachModal from './components/CoachModal';
import ProductModal from './components/ProductModal';
import TransactionModal from './components/TransactionModal';
import MatchModal from './components/MatchModal';
import TrainingModal from './components/TrainingModal';

// --- IMPORTACIÓN DE TIPOS Y CONSTANTES ---
import { AppData, Student, User, Coach, Product, Provider, Sale, Transaction, TrainingPlan } from './types';
import { INITIAL_DATA } from './constants';
import { formatCurrency } from './utils';

// --- 1. CONFIGURACIÓN FIREBASE ---
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
const storage = getStorage(app);

const App: React.FC = () => {
  // --- ESTADOS ---
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'LOCAL' | 'CLOUD' | 'ERROR'>('LOCAL');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('futmanager_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Control de Modales
  const [modals, setModals] = useState({
    student: false, provider: false, coach: false, product: false, 
    transaction: false, match: false, training: false
  });
  const [editingItem, setEditingItem] = useState<any>(null);

  // --- 2. ESCUCHA DE DATOS EN TIEMPO REAL ---
  useEffect(() => {
    const docRef = doc(db, 'escuela', 'datos_principales');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        setData(docSnap.data() as AppData);
        setSyncStatus('CLOUD');
      } else {
        setDoc(docRef, INITIAL_DATA);
      }
      setIsLoading(false);
    }, (error) => {
      console.error("Error Firebase:", error);
      setSyncStatus('ERROR');
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- 3. FUNCIONES DE PERSISTENCIA (NUBE) ---

  // Función para subir archivos a Storage
  const uploadToStorage = async (file: File, folder: string) => {
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  // Función Maestra para guardar en Firestore
  const persistData = async (updater: (prev: AppData) => AppData) => {
    setIsSyncing(true);
    try {
      const updatedData = updater(data);
      await setDoc(doc(db, 'escuela', 'datos_principales'), updatedData);
      setSyncStatus('CLOUD');
    } catch (e) {
      console.error("Error al persistir:", e);
      setSyncStatus('ERROR');
    } finally {
      setIsSyncing(false);
    }
  };

  // --- 4. MANEJADORES POR MÓDULO ---

  const handleSaveStudent = async (student: Student, imageFile?: File) => {
    let photoUrl = student.photo;
    if (imageFile) photoUrl = await uploadToStorage(imageFile, 'alumnos');

    const studentWithPhoto = { ...student, photo: photoUrl };
    persistData(prev => ({
      ...prev,
      students: prev.students.find(s => s.id === student.id)
        ? prev.students.map(s => s.id === student.id ? studentWithPhoto : s)
        : [...prev.students, studentWithPhoto]
    }));
    setModals(m => ({ ...m, student: false }));
  };

  const handleSaveProvider = (provider: Provider) => {
    persistData(prev => ({
      ...prev,
      providers: (prev.providers || []).find(p => p.id === provider.id)
        ? prev.providers.map(p => p.id === provider.id ? provider : p)
        : [...(prev.providers || []), provider]
    }));
    setModals(m => ({ ...m, provider: false }));
  };

  const handleSaveProduct = async (product: Product, imageFile?: File) => {
    let photoUrl = product.image;
    if (imageFile) photoUrl = await uploadToStorage(imageFile, 'productos');

    const productWithImage = { ...product, image: photoUrl };
    persistData(prev => ({
      ...prev,
      products: prev.products.find(p => p.id === product.id)
        ? prev.products.map(p => p.id === product.id ? productWithImage : p)
        : [...prev.products, productWithImage]
    }));
    setModals(m => ({ ...m, product: false }));
  };

  const handleSaveTraining = (plan: TrainingPlan) => {
    persistData(prev => ({
      ...prev,
      trainingPlans: (prev.trainingPlans || []).find(p => p.id === plan.id)
        ? prev.trainingPlans.map(p => p.id === plan.id ? plan : p)
        : [...(prev.trainingPlans || []), plan]
    }));
    setModals(m => ({ ...m, training: false }));
  };

  const handleSaveMatch = (match: any) => {
    persistData(prev => ({
      ...prev,
      matches: [...(prev.matches || []), match]
    }));
    setModals(m => ({ ...m, match: false }));
  };

  const handleTransaction = (t: Transaction) => {
    persistData(prev => ({
      ...prev,
      transactions: [t, ...(prev.transactions || [])],
      pettyCashBalance: t.type === 'INCOME' ? prev.pettyCashBalance + t.amount : prev.pettyCashBalance - t.amount
    }));
    setModals(m => ({ ...m, transaction: false }));
  };

  // --- 5. RENDERIZADO ---

  if (isLoading) return (
    <div className="h-screen bg-slate-950 flex flex-col items-center justify-center gap-4 text-emerald-500">
      <RefreshCw className="animate-spin" size={40} />
      <span className="font-black text-xs uppercase tracking-widest">Sincronizando con Google Cloud...</span>
    </div>
  );

  if (!currentUser) return (
    <div className="h-screen bg-slate-950 flex items-center justify-center p-6">
      <div className="bg-white rounded-[3rem] w-full max-w-sm p-10 shadow-2xl">
        <h1 className="text-2xl font-black text-center mb-8 text-slate-900">FutManager Pro</h1>
        <div className="space-y-3">
          {data.users?.map(u => (
            <button key={u.id} onClick={() => { setCurrentUser(u); localStorage.setItem('futmanager_session', JSON.stringify(u)); }} 
              className="w-full p-5 bg-slate-100 rounded-2xl font-bold hover:bg-emerald-500 hover:text-white transition-all text-left flex justify-between items-center group">
              {u.name} <ChevronRight size={18} className="opacity-0 group-hover:opacity-100" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} school={data.school} currentUser={currentUser} onLogout={() => { setCurrentUser(null); localStorage.removeItem('futmanager_session'); }} />
      
      <main className="flex-1 ml-64 p-12 h-screen overflow-y-auto">
        <header className="flex justify-between items-start mb-12">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter capitalize">{activeTab}</h1>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${syncStatus === 'CLOUD' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                {syncStatus === 'CLOUD' ? 'Conexión Segura Nube' : 'Error de Sincronización'}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            {activeTab === 'students' && (
              <button onClick={() => setModals(m => ({ ...m, student: true }))} className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:scale-105 transition-transform">
                <UserPlus size={16} /> Inscribir Alumno
              </button>
            )}
            {activeTab === 'providers' && (
              <button onClick={() => setModals(m => ({ ...m, provider: true }))} className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase flex items-center gap-2 hover:scale-105 transition-transform">
                <Truck size={16} /> Nuevo Proveedor
              </button>
            )}
          </div>
        </header>

        {/* CONTENIDO DEL DASHBOARD / SECCIONES */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <Users className="text-emerald-500 mb-4" size={32} />
                <p className="text-[10px] font-black text-slate-400 uppercase">Estudiantes Activos</p>
                <p className="text-4xl font-black text-slate-900">{data.students.length}</p>
              </div>
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                <PiggyBank className="text-blue-500 mb-4" size={32} />
                <p className="text-[10px] font-black text-slate-400 uppercase">Balance en Caja</p>
                <p className="text-4xl font-black text-slate-900">{formatCurrency(data.pettyCashBalance)}</p>
              </div>
            </div>
          )}
          {/* Aquí puedes seguir mapeando el resto de tus pestañas */}
        </div>
      </main>

      {/* --- RENDERIZADO DE TODOS LOS MODALES --- */}
      <StudentModal isOpen={modals.student} onClose={() => setModals(m => ({ ...m, student: false }))} onSave={handleSaveStudent} />
      <ProviderModal isOpen={modals.provider} onClose={() => setModals(m => ({ ...m, provider: false }))} onSave={handleSaveProvider} />
      <ProductModal isOpen={modals.product} onClose={() => setModals(m => ({ ...m, product: false }))} onSave={handleSaveProduct} />
      <TransactionModal isOpen={modals.transaction} onClose={() => setModals(m => ({ ...m, transaction: false }))} onSave={handleTransaction} />
      <TrainingModal isOpen={modals.training} onClose={() => setModals(m => ({ ...m, training: false }))} onSave={handleSaveTraining} />
      <MatchModal isOpen={modals.match} onClose={() => setModals(m => ({ ...m, match: false }))} onSave={handleSaveMatch} />

    </div>
  );
};

export default App;
