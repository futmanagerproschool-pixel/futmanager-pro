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

// --- IMPORTACIÓN DE TIPOS Y UTILIDADES ---
import { AppData, Student, User, Coach, Product, Provider, Sale, Transaction, TrainingPlan } from './types';
import { INITIAL_DATA } from './constants';
import { formatCurrency, generateId } from './utils';

// --- 1. CONFIGURACIÓN FIREBASE (PROYECTO: futmanagerpro-42dfd) ---
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
  // --- ESTADOS DE DATOS ---
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'LOCAL' | 'CLOUD' | 'ERROR'>('LOCAL');
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('futmanager_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Modales
  const [modals, setModals] = useState({
    student: false, provider: false, coach: false, product: false, 
    transaction: false, match: false, training: false
  });

  // --- 2. SINCRONIZACIÓN EN TIEMPO REAL ---
  useEffect(() => {
    const docRef = doc(db, 'escuela', 'datos_principales');
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const cloudData = docSnap.data() as AppData;
        // Aseguramos que todos los arrays existan para evitar errores de .map() o .length
        setData({
          ...INITIAL_DATA,
          ...cloudData,
          students: cloudData.students || [],
          providers: cloudData.providers || [],
          products: cloudData.products || [],
          transactions: cloudData.transactions || [],
          trainingPlans: cloudData.trainingPlans || [],
          matches: cloudData.matches || [],
          payrollRecords: cloudData.payrollRecords || []
        });
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

  // --- 3. FUNCIONES MAESTRAS DE GUARDADO (MOTOR BLAZE) ---

  const uploadToStorage = async (file: File, folder: string) => {
    const storageRef = ref(storage, `${folder}/${Date.now()}_${file.name}`);
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  };

  const persistData = async (updater: (prev: AppData) => AppData) => {
    setIsSyncing(true);
    try {
      const updatedData = updater(data);
      const docRef = doc(db, 'escuela', 'datos_principales');
      // Guardado con merge para asegurar integridad
      await setDoc(docRef, updatedData, { merge: true });
      setSyncStatus('CLOUD');
    } catch (e) {
      console.error("Error crítico de guardado:", e);
      setSyncStatus('ERROR');
      alert("Hubo un error al guardar en la nube. Revisa tu conexión.");
    } finally {
      setIsSyncing(false);
    }
  };

  // --- 4. INTEGRACIÓN DE TODOS LOS MÓDULOS (SIN EXCEPCIÓN) ---

  const handleSaveStudent = async (student: Student, imageFile?: File) => {
    let photoUrl = student.photo;
    if (imageFile) {
      photoUrl = await uploadToStorage(imageFile, 'alumnos');
    }

    const studentWithPhoto = { ...student, photo: photoUrl, updatedAt: Date.now() };
    persistData(prev => ({
      ...prev,
      students: [...(prev.students || []).filter(s => s.id !== student.id), studentWithPhoto]
    }));
    setModals(m => ({ ...m, student: false }));
  };

  const handleSaveProvider = (provider: Provider) => {
    persistData(prev => ({
      ...prev,
      providers: [...(prev.providers || []).filter(p => p.id !== provider.id), provider]
    }));
    setModals(m => ({ ...m, provider: false }));
  };

  const handleSaveProduct = async (product: Product, imageFile?: File) => {
    let imageUrl = product.image;
    if (imageFile) {
      imageUrl = await uploadToStorage(imageFile, 'productos');
    }

    const productWithImage = { ...product, image: imageUrl };
    persistData(prev => ({
      ...prev,
      products: [...(prev.products || []).filter(p => p.id !== product.id), productWithImage]
    }));
    setModals(m => ({ ...m, product: false }));
  };

  const handleSaveTraining = (plan: TrainingPlan) => {
    const newPlan = { ...plan, id: plan.id || generateId() };
    persistData(prev => ({
      ...prev,
      trainingPlans: [...(prev.trainingPlans || []).filter(p => p.id !== newPlan.id), newPlan]
    }));
    setModals
