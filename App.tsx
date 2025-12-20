
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Plus, Users, PiggyBank, BrainCircuit, Trophy, ChevronRight,
  RefreshCw, Cloud, Lock, TrendingUp, TrendingDown, Calendar, 
  Download, Printer, Search, XCircle, UserPlus, FileSpreadsheet, 
  Upload, Trash2, Sparkles, Camera, Scale, ShoppingBag, 
  ShoppingCart, Package, Tags, Users2, Truck, BookOpen, Star, Gift
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import StudentModal from './components/StudentModal';
import TrainingModal from './components/TrainingModal';
import CoachModal from './components/CoachModal';
import MatchModal from './components/MatchModal';
import UserModal from './components/UserModal';
import { AppData, Student, User, Coach, BloodType, MatchCallup, Product, Sale, Customer, Promotion } from './types';
import { INITIAL_DATA } from './constants';
import { formatCurrency, calculateAge } from './utils';
import { generateSchoolReport } from './geminiService';

// Inicialización de Supabase (las variables vendrán de Vercel después)
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

const App: React.FC = () => {
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('futmanager_session');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [storeSubTab, setStoreSubTab] = useState<'inventory' | 'sales' | 'customers' | 'purchases' | 'marketing' | 'reports'>('inventory');
  const [searchTerm, setSearchTerm] = useState('');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  
  // Modals visibility
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>();
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | undefined>();
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Store POS State
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [selectedPromo, setSelectedPromo] = useState<Promotion | null>(null);
  const [discountManual, setDiscountManual] = useState(0);

  // Purchase State
  const [purchaseForm, setPurchaseForm] = useState({ productId: '', supplierId: '', quantity: 0, cost: 0 });

  const [loginStep, setLoginStep] = useState<'SELECT' | 'PASSWORD'>('SELECT');
  const [selectedUserLogin, setSelectedUserLogin] = useState<User | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  const [reportMonth, setReportMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // --- SINCRONIZACIÓN SUPABASE ---
  
  // 1. Cargar datos iniciales desde la nube
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) {
        setIsLoading(false);
        return;
      }

      const { data: dbData, error } = await supabase
        .from('school_data')
        .select('data')
        .eq('id', 'default_school')
        .single();

      if (dbData) {
        setData(dbData.data);
      } else if (error && error.code === 'PGRST116') {
        // Si no existe, crear la primera fila
        await supabase.from('school_data').insert([{ id: 'default_school', data: INITIAL_DATA }]);
      }
      setIsLoading(false);
    };

    fetchData();

    // Suscribirse a cambios en tiempo real
    const channel = supabase?.channel('schema-db-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'school_data' }, (payload) => {
        setData(payload.new.data);
      })
      .subscribe();

    return () => {
      supabase?.removeChannel(channel);
    };
  }, []);

  // 2. Guardar datos cuando cambien (con debounce para no saturar)
  useEffect(() => {
    if (isLoading || !supabase) return;

    const timer = setTimeout(async () => {
      setIsSyncing(true);
      await supabase
        .from('school_data')
        .update({ data: data, updated_at: new Date() })
        .eq('id', 'default_school');
      setIsSyncing(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [data, isLoading]);

  // --- LÓGICA DE NEGOCIO ---

  const confirmAction = (msg: string, onConfirm: () => void) => {
    if (window.confirm(msg)) onConfirm();
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserLogin && passwordInput === selectedUserLogin.password) {
      setCurrentUser(selectedUserLogin);
      localStorage.setItem('futmanager_session', JSON.stringify(selectedUserLogin));
    } else {
      alert('PIN incorrecto');
    }
  };

  const downloadCSV = (headers: string, rows: any[], filename: string) => {
    const csvContent = [headers, ...rows.map(row => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const importFromCSV = (file: File, type: 'STUDENTS' | 'PRODUCTS') => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const lines = text.split('\n').filter(l => l.trim() !== '');
      if (lines.length < 2) return;
      
      const headers = lines[0].split(',');
      const results = lines.slice(1).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((header, i) => obj[header.trim()] = values[i]?.trim());
        return obj;
      });

      if (type === 'STUDENTS') {
        const newStudents: Student[] = results.map(r => ({
          id: Math.random().toString(36).substr(2, 9),
          firstName: r.firstName || 'Nuevo',
          lastName: r.lastName || 'Alumno',
          document: r.document || Date.now().toString(),
          bloodType: (r.bloodType as BloodType) || 'O+',
          weight: Number(r.weight) || 0,
          height: Number(r.height) || 0,
          school: r.school || '',
          grade: r.grade || '',
          dob: r.dob || '2010-01-01',
          position: r.position || 'Portero',
          entryDate: r.entryDate || new Date().toISOString().split('T')[0],
          category: r.category || 'Sub-13',
          coachId: data.coaches[0]?.id || '',
          parents: { fatherName: r.father || '', motherName: r.mother || '', phone: r.phone || '', address: r.address || '' },
          observations: '',
          paymentStatus: 'UP_TO_DATE',
          status: 'ACTIVE',
          updatedAt: Date.now()
        }));
        setData(prev => ({ ...prev, students: [...prev.students, ...newStudents] }));
      }
    };
    reader.readAsText(file);
  };

  // POS Logic
  const addToCart = (product: Product) => {
    if (product.stock <= 0) return alert("Sin stock");
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.product.id === product.id ? {...item, quantity: item.quantity + 1} : item);
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const cartSubtotal = useMemo(() => cart.reduce((acc, item) => acc + (item.product.sellPrice * item.quantity), 0), [cart]);
  const calculatedDiscount = useMemo(() => {
    let d = discountManual;
    if (selectedPromo && selectedPromo.isActive) d += (cartSubtotal * (selectedPromo.discountPercentage / 100));
    return d;
  }, [cartSubtotal, selectedPromo, discountManual]);
  const cartTotal = useMemo(() => Math.max(0, cartSubtotal - calculatedDiscount), [cartSubtotal, calculatedDiscount]);

  const handleProcessSale = (method: 'CASH' | 'CARD' | 'CREDIT' | 'POINTS') => {
    if (cart.length === 0) return;
    const sale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0],
      customerId: selectedCustomer?.id,
      items: cart.map(i => ({ productId: i.product.id, description: i.product.description, quantity: i.quantity, price: i.product.sellPrice, buyPriceAtSale: i.product.buyPrice, subtotal: i.product.sellPrice * i.quantity })),
      total: cartTotal,
      discount: calculatedDiscount,
      pointsEarned: Math.floor(cartTotal / 1000) * data.pointsConfig.pointsPerThousand,
      paymentMethod: method,
      status: method === 'CREDIT' ? 'PENDING' : 'PAID',
      updatedAt: Date.now()
    };

    setData(prev => ({
      ...prev,
      sales: [sale, ...prev.sales],
      products: prev.products.map(p => {
        const ci = cart.find(x => x.product.id === p.id);
        return ci ? {...p, stock: p.stock - ci.quantity, updatedAt: Date.now()} : p;
      }),
      customers: prev.customers.map(c => {
        if (c.id === selectedCustomer?.id) {
          return {...c, currentDebt: method === 'CREDIT' ? c.currentDebt + cartTotal : c.currentDebt, loyaltyPoints: c.loyaltyPoints + sale.pointsEarned, updatedAt: Date.now()};
        }
        return c;
      }),
      pettyCashBalance: (method === 'CASH' || method === 'CARD') ? prev.pettyCashBalance + cartTotal : prev.pettyCashBalance,
      transactions: (method === 'CASH' || method === 'CARD') ? [{id: Math.random().toString(36).substr(2, 9), orderNumber: prev.nextOrderNumber, date: sale.date, type: 'INCOME', category: 'STORE_SALE', amount: cartTotal, description: `Venta POS`, updatedAt: Date.now()}, ...prev.transactions] : prev.transactions,
      nextOrderNumber: (method === 'CASH' || method === 'CARD') ? prev.nextOrderNumber + 1 : prev.nextOrderNumber
    }));

    setCart([]);
    setSelectedCustomer(null);
  };

  // --- RENDERS ---

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white space-y-4">
        <RefreshCw className="w-12 h-12 animate-spin text-emerald-500" />
        <p className="font-black text-xs uppercase tracking-[0.3em]">Cargando Base de Datos...</p>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl space-y-8 text-center animate-in zoom-in-95 duration-500">
           <div className="w-20 h-20 bg-emerald-500 rounded-3xl flex items-center justify-center mx-auto shadow-2xl"><Lock className="w-10 h-10 text-white" /></div>
           <div><h1 className="text-3xl font-black text-slate-900 tracking-tight">FutManager Pro</h1><p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-1">Acceso Seguro</p></div>
           {loginStep === 'SELECT' ? (
             <div className="space-y-3 text-left">
               {data.users.map(u => (
                 <button key={u.id} onClick={() => { setSelectedUserLogin(u); setLoginStep('PASSWORD'); }} className="w-full p-6 bg-slate-50 hover:bg-emerald-50 border-2 border-transparent hover:border-emerald-200 rounded-3xl flex items-center justify-between transition-all group font-black">
                    <div><p className="text-lg">{u.name}</p><p className="text-[10px] text-slate-400 group-hover:text-emerald-500 uppercase">{u.role}</p></div>
                    <ChevronRight className="w-6 h-6 text-slate-300 group-hover:translate-x-1 transition-all" />
                 </button>
               ))}
             </div>
           ) : (
             <form onSubmit={handleLogin} className="space-y-6">
                <input autoFocus type="password" placeholder="PIN" className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center font-black text-xl outline-none" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
                <div className="flex gap-3 font-black"><button type="button" onClick={() => setLoginStep('SELECT')} className="flex-1 py-4 text-slate-400">Volver</button><button type="submit" className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl shadow-xl">Ingresar</button></div>
             </form>
           )}
        </div>
      </div>
    );
  }

  const filteredStudents = data.students.filter(s => s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || s.document.includes(searchTerm));
  const monthlyStats = { 
    income: data.transactions.filter(t => t.date.startsWith(reportMonth) && t.type === 'INCOME').reduce((a, b) => a + b.amount, 0),
    expense: data.transactions.filter(t => t.date.startsWith(reportMonth) && t.type === 'EXPENSE').reduce((a, b) => a + b.amount, 0),
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} school={data.school} currentUser={currentUser} onLogout={() => confirmAction('¿Salir?', () => { setCurrentUser(null); localStorage.removeItem('futmanager_session'); })} />
      <main className="flex-1 ml-64 p-12 max-w-7xl mx-auto w-full">
        <header className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-6">
            {data.school.logo && <img src={data.school.logo} className="w-16 h-16 object-contain rounded-xl shadow-sm" />}
            <div><h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em] mb-2">Escuela en la Nube</h2><h1 className="text-5xl font-black text-slate-900 capitalize tracking-tighter">{activeTab}</h1></div>
          </div>
          <div className={`flex items-center gap-2 px-4 py-2 rounded-full border font-black text-[10px] uppercase shadow-sm transition-all ${isSyncing ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-blue-50 text-blue-600 border-blue-100'}`}>
            <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> {isSyncing ? 'Sincronizando...' : 'Conectado'}
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-700">
            <div className="bg-gradient-to-br from-emerald-600 to-emerald-900 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
              <h2 className="text-5xl font-black mb-2 italic">Hola, {currentUser.name.split(' ')[0]}</h2>
              <p className="text-emerald-100 font-medium text-xl italic opacity-80">Hoy es un gran día para entrenar.</p>
              <Trophy className="absolute right-[-20px] top-[-20px] w-80 h-80 opacity-10" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 font-black">
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5">
                <Users className="w-14 h-14 bg-blue-100 rounded-2xl p-3 text-blue-600" />
                <div><p className="text-[10px] text-slate-400 uppercase">Alumnos</p><p className="text-3xl text-slate-800">{data.students.length}</p></div>
              </div>
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5">
                <TrendingUp className="w-14 h-14 bg-emerald-100 rounded-2xl p-3 text-emerald-600" />
                <div><p className="text-[10px] text-slate-400 uppercase">Ingresos</p><p className="text-xl text-slate-800">{formatCurrency(monthlyStats.income)}</p></div>
              </div>
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5">
                <ShoppingBag className="w-14 h-14 bg-indigo-100 rounded-2xl p-3 text-indigo-600" />
                <div><p className="text-[10px] text-slate-400 uppercase">Ventas</p><p className="text-3xl text-slate-800">{data.sales.length}</p></div>
              </div>
              <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5">
                <BrainCircuit className="w-14 h-14 bg-amber-100 rounded-2xl p-3 text-amber-600" />
                <div><p className="text-[10px] text-slate-400 uppercase">Planes AI</p><p className="text-3xl text-slate-800">{data.trainingPlans.length}</p></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
               <div className="relative w-full max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" /><input type="text" placeholder="Buscar alumno..." className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
               <button onClick={() => { setEditingStudent(undefined); setIsStudentModalOpen(true); }} className="px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg flex items-center gap-2"><Plus className="w-5 h-5" /> Nuevo Alumno</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {filteredStudents.map(s => (
                  <div key={s.id} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm font-bold">
                     <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center font-black">{s.photo ? <img src={s.photo} className="w-full h-full object-cover rounded-xl" /> : s.firstName[0]}</div>
                        <div><h4 className="text-slate-800">{s.firstName} {s.lastName}</h4><p className="text-[10px] text-slate-400 uppercase">{s.category}</p></div>
                     </div>
                     <button onClick={() => { setEditingStudent(s); setIsStudentModalOpen(true); }} className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] uppercase font-black">Ver Ficha</button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-8 animate-in fade-in font-black">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 flex justify-between items-center">
                <h3 className="text-xl uppercase">Caja Central</h3>
                <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl text-2xl italic">{formatCurrency(data.pettyCashBalance)}</div>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 space-y-4 shadow-sm"><p className="text-[10px] text-slate-400 uppercase">Ingresos Mes</p><h4 className="text-4xl text-emerald-600">{formatCurrency(monthlyStats.income)}</h4></div>
                <div className="bg-white p-8 rounded-[3rem] border border-slate-100 space-y-4 shadow-sm"><p className="text-[10px] text-slate-400 uppercase">Egresos Mes</p><h4 className="text-4xl text-rose-600">{formatCurrency(monthlyStats.expense)}</h4></div>
             </div>
          </div>
        )}

        <StudentModal isOpen={isStudentModalOpen} onClose={() => setIsStudentModalOpen(false)} onSave={(s) => { const existing = data.students.find(st => st.id === s.id); setData(prev => ({ ...prev, students: existing ? prev.students.map(st => st.id === s.id ? { ...s, updatedAt: Date.now() } : st) : [...prev.students, { ...s, id: Math.random().toString(36).substr(2, 9), updatedAt: Date.now() }] })); setIsStudentModalOpen(false); }} student={editingStudent} coaches={data.coaches.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))} />
        <CoachModal isOpen={isCoachModalOpen} onClose={() => setIsCoachModalOpen(false)} onSave={(c) => { const existing = data.coaches.find(ch => ch.id === c.id); setData(prev => ({ ...prev, coaches: existing ? prev.coaches.map(ch => ch.id === c.id ? { ...c, updatedAt: Date.now() } : ch) : [...prev.coaches, { ...c, id: Math.random().toString(36).substr(2, 9), updatedAt: Date.now() }] })); setIsCoachModalOpen(false); }} coach={editingCoach} />
        <TrainingModal isOpen={isTrainingModalOpen} onClose={() => setIsTrainingModalOpen(false)} onSave={(plan) => setData(prev => ({ ...prev, trainingPlans: [plan, ...prev.trainingPlans] }))} coachId={currentUser.id} />
        <MatchModal isOpen={isMatchModalOpen} onClose={() => setIsMatchModalOpen(false)} onSave={(m) => setData({...data, matches: [m, ...data.matches]})} students={data.students} />
        <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={(u) => setData({...data, users: [...data.users, u]})} />
      </main>
    </div>
  );
};

export default App;
