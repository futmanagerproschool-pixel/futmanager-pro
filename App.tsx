
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Users, PiggyBank, BrainCircuit, Trophy, ChevronRight,
  RefreshCw, Lock, TrendingUp, TrendingDown, Search, XCircle, 
  ShoppingBag, ShoppingCart, Package, Eye, History, Sparkles, 
  BarChart3, Calendar, MapPin, Printer, ShieldCheck, Download, 
  Upload, Settings, UserSquare2, Trash2, Mail, Phone, Map,
  FileText
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import StudentModal from './components/StudentModal';
import TrainingModal from './components/TrainingModal';
import CoachModal from './components/CoachModal';
import MatchModal from './components/MatchModal';
import UserModal from './components/UserModal';
import { AppData, Student, User, Coach, Product, Sale, Transaction, TrainingPlan, MatchCallup } from './types';
import { INITIAL_DATA } from './constants';
import { formatCurrency } from './utils';
import { generateSchoolReport } from './geminiService';

// Configuración de Supabase (Variables de entorno)
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
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados de Modales
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>();
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | undefined>();
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Estados de Tienda (POS)
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [storeView, setStoreView] = useState<'POS' | 'INVENTORY'>('POS');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Estados de Login
  const [loginStep, setLoginStep] = useState<'SELECT' | 'PASSWORD'>('SELECT');
  const [selectedUserLogin, setSelectedUserLogin] = useState<User | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  // 1. Cargar datos iniciales desde Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) { 
        console.warn("Supabase no configurado. Usando datos locales.");
        setIsLoading(false); 
        return; 
      }
      try {
        const { data: dbData, error } = await supabase
          .from('school_data')
          .select('data')
          .eq('id', 'default_school')
          .single();
        
        if (dbData) setData(dbData.data);
        if (error && error.code !== 'PGRST116') console.error("Error cargando datos:", error);
      } catch (err) {
        console.error("Error de conexión:", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();

    // Suscripción en tiempo real para múltiples usuarios
    const channel = supabase?.channel('db_changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'school_data' }, (p) => {
        if (p.new?.data) setData(p.new.data);
      })
      .subscribe();

    return () => { supabase?.removeChannel(channel); };
  }, []);

  // 2. Guardar automáticamente cuando los datos cambian (Debounce 1.5s)
  useEffect(() => {
    if (isLoading || !supabase) return;
    const timer = setTimeout(async () => {
      setIsSyncing(true);
      await supabase.from('school_data').upsert({ id: 'default_school', data: data });
      setIsSyncing(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [data, isLoading]);

  // Handlers
  const handleExportData = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `futmanager_backup_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
  };

  const addToCart = (product: Product) => {
    if (product.stock <= 0) return alert("Producto sin existencias.");
    setCart(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) return prev.map(item => item.product.id === product.id ? {...item, quantity: item.quantity + 1} : item);
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleSale = (method: 'CASH' | 'CARD') => {
    if (cart.length === 0) return;
    const total = cart.reduce((acc, item) => acc + (item.product.sellPrice * item.quantity), 0);
    
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: data.nextOrderNumber,
      date: new Date().toISOString().split('T')[0],
      type: 'INCOME',
      category: 'STORE_SALE',
      amount: total,
      description: `Venta Tienda (${cart.length} items) - Pago ${method}`,
      updatedAt: Date.now()
    };

    setData(prev => ({
      ...prev,
      transactions: [newTransaction, ...prev.transactions],
      pettyCashBalance: prev.pettyCashBalance + total,
      nextOrderNumber: prev.nextOrderNumber + 1,
      products: prev.products.map(p => {
        const item = cart.find(i => i.product.id === p.id);
        return item ? { ...p, stock: p.stock - item.quantity, updatedAt: Date.now() } : p;
      })
    }));
    setCart([]);
    alert("¡Venta procesada con éxito!");
  };

  const handleAIReport = async () => {
    setIsGeneratingReport(true);
    const report = await generateSchoolReport(data);
    setAiReport(report);
    setIsGeneratingReport(false);
  };

  const stats = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    const incomes = data.transactions.filter(t => t.type === 'INCOME' && t.date.startsWith(month)).reduce((a, b) => a + b.amount, 0);
    const expenses = data.transactions.filter(t => t.type === 'EXPENSE' && t.date.startsWith(month)).reduce((a, b) => a + b.amount, 0);
    return { incomes, expenses };
  }, [data.transactions]);

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center space-y-6">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-4 border-emerald-500/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-t-emerald-500 rounded-full animate-spin"></div>
      </div>
      <span className="text-emerald-500 font-black tracking-[0.3em] text-[10px] uppercase">Sincronizando FutManager Pro</span>
    </div>
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-[3.5rem] w-full max-w-md p-12 shadow-2xl space-y-10 animate-in zoom-in-95 duration-500">
           <div className="text-center space-y-4">
             <div className="w-20 h-20 bg-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-2 shadow-2xl shadow-emerald-200 rotate-3"><Lock className="text-white w-10 h-10" /></div>
             <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Acceso de Personal</h1>
             <p className="text-slate-400 font-medium text-sm px-8">Selecciona tu perfil para ingresar al sistema administrativo.</p>
           </div>
           {loginStep === 'SELECT' ? (
             <div className="space-y-4">
               {data.users.map(u => (
                 <button key={u.id} onClick={() => { setSelectedUserLogin(u); setLoginStep('PASSWORD'); }} className="w-full p-6 bg-slate-50 hover:bg-emerald-50 border-2 border-transparent hover:border-emerald-200 rounded-3xl flex items-center justify-between transition-all group active:scale-95">
                    <div className="text-left"><p className="font-black text-slate-800 text-lg">{u.name}</p><p className="text-[10px] text-emerald-600 uppercase font-black tracking-widest">{u.role}</p></div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1 transition-transform" />
                 </button>
               ))}
             </div>
           ) : (
             <form onSubmit={(e) => { e.preventDefault(); if (selectedUserLogin?.password === passwordInput) { setCurrentUser(selectedUserLogin); localStorage.setItem('futmanager_session', JSON.stringify(selectedUserLogin)); } else { alert("PIN Incorrecto"); setPasswordInput(''); } }} className="space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Introduce tu PIN de acceso</label>
                  <input autoFocus type="password" placeholder="••••" className="w-full py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-center font-black text-4xl outline-none focus:border-emerald-500 transition-colors tracking-[0.5em]" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
                </div>
                <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black shadow-2xl shadow-emerald-200 text-lg active:scale-95 transition-transform">Entrar al Sistema</button>
                <button type="button" onClick={() => { setLoginStep('SELECT'); setPasswordInput(''); }} className="w-full text-slate-400 font-bold text-[10px] uppercase tracking-widest">Volver a selección</button>
             </form>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} school={data.school} currentUser={currentUser} onLogout={() => { setCurrentUser(null); localStorage.removeItem('futmanager_session'); }} />
      
      <main className="flex-1 ml-64 p-12 overflow-y-auto h-screen scrollbar-hide">
        <header className="flex items-center justify-between mb-12">
          <div className="animate-in slide-in-from-left duration-700">
            <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1">Módulo de Gestión</h2>
            <h1 className="text-5xl font-black text-slate-900 capitalize tracking-tighter">{activeTab}</h1>
          </div>
          <div className={`px-6 py-3 rounded-full border-2 text-[10px] font-black uppercase flex items-center gap-3 transition-colors ${isSyncing ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} /> 
            {isSyncing ? 'Sincronizando cambios...' : 'Datos Sincronizados'}
          </div>
        </header>

        {/* CONTENIDO DE PESTAÑAS */}
        
        {activeTab === 'dashboard' && (
          <div className="space-y-12 animate-in fade-in zoom-in-95 duration-700">
             <div className="bg-slate-900 p-16 rounded-[4rem] text-white shadow-3xl relative overflow-hidden group">
               <div className="relative z-10 space-y-6">
                 <h2 className="text-6xl font-black italic tracking-tighter leading-tight">¡Bienvenido,<br />{currentUser.name.split(' ')[0]}!</h2>
                 <p className="text-slate-400 font-medium max-w-md text-lg">La escuela "{data.school.name}" está funcionando con éxito. Tienes {data.students.length} promesas del fútbol registradas.</p>
               </div>
               <Trophy className="absolute right-[-40px] bottom-[-40px] w-80 h-80 text-emerald-500 opacity-10 -rotate-12 group-hover:scale-110 transition-transform duration-1000" />
               <div className="absolute top-10 right-10 bg-emerald-500/20 p-6 rounded-full blur-3xl"></div>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  { label: 'Total Alumnos', val: data.students.length, icon: Users, color: 'emerald' },
                  { label: 'Ingresos (Mes)', val: formatCurrency(stats.incomes), icon: TrendingUp, color: 'blue' },
                  { label: 'Gastos (Mes)', val: formatCurrency(stats.expenses), icon: TrendingDown, color: 'rose' },
                  { label: 'Caja Menor', val: formatCurrency(data.pettyCashBalance), icon: PiggyBank, color: 'amber' }
                ].map((s, i) => (
                  <div key={i} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-xl hover:-translate-y-1 transition-all">
                    <s.icon className={`w-14 h-14 text-${s.color}-600 bg-${s.color}-50 p-4 rounded-[1.5rem]`} />
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">{s.label}</p>
                      <p className="text-3xl font-black text-slate-800 tracking-tighter">{s.val}</p>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="flex flex-col md:flex-row justify-between items-center bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100 gap-6">
               <div className="relative w-full max-w-xl">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-300" />
                 <input type="text" placeholder="Buscar por nombre o documento..." className="w-full pl-16 pr-8 py-5 bg-slate-50 rounded-[2rem] font-bold outline-none border-2 border-transparent focus:border-emerald-100 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>
               <button onClick={() => { setEditingStudent(undefined); setIsStudentModalOpen(true); }} className="w-full md:w-auto px-10 py-5 bg-emerald-600 text-white font-black rounded-[2rem] shadow-2xl shadow-emerald-100 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all">
                 <Plus className="w-6 h-6" /> Nuevo Alumno
               </button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {data.students.filter(s => `${s.firstName} ${s.lastName} ${s.document}`.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                  <div key={s.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm group hover:shadow-2xl hover:border-emerald-100 transition-all relative overflow-hidden">
                     <div className={`absolute top-0 right-0 w-32 h-32 bg-${s.paymentStatus === 'UP_TO_DATE' ? 'emerald' : 'rose'}-50 rounded-bl-[4rem] -mr-10 -mt-10 transition-colors`}></div>
                     <div className="flex items-center gap-6 mb-8 relative z-10">
                        <div className="w-20 h-20 rounded-[2rem] bg-slate-100 flex items-center justify-center font-black text-slate-400 overflow-hidden ring-8 ring-slate-50">
                          {s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : <span className="text-3xl">{s.firstName[0]}</span>}
                        </div>
                        <div>
                          <h4 className="text-2xl font-black text-slate-800 leading-tight">{s.firstName}<br />{s.lastName}</h4>
                          <span className="text-[10px] text-emerald-600 uppercase font-black tracking-widest">{s.category}</span>
                        </div>
                     </div>
                     <div className="grid grid-cols-2 gap-4 mb-8 text-[10px] uppercase text-slate-400 relative z-10 font-black">
                       <div className="bg-slate-50 p-4 rounded-2xl"><span className="block text-slate-800 mb-1">{s.position}</span>Posición</div>
                       <div className={`p-4 rounded-2xl ${s.paymentStatus === 'UP_TO_DATE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                         <span className="block mb-1">{s.paymentStatus === 'UP_TO_DATE' ? 'Al Día' : 'En Mora'}</span>Estado
                       </div>
                     </div>
                     <button onClick={() => { setEditingStudent(s); setIsStudentModalOpen(true); }} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] text-xs uppercase font-black tracking-[0.2em] hover:bg-emerald-600 transition-colors relative z-10 shadow-xl shadow-slate-100">Expediente Alumno</button>
                  </div>
                ))}
                {data.students.length === 0 && (
                  <div className="col-span-full py-32 flex flex-col items-center text-slate-300 space-y-4">
                    <Users className="w-24 h-24 opacity-10" />
                    <p className="font-black uppercase tracking-widest text-sm">No hay alumnos registrados aún</p>
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'training' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="flex justify-between items-center bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
               <div>
                 <h3 className="font-black text-slate-800 text-2xl tracking-tighter">Sesiones Técnicas</h3>
                 <p className="text-sm text-slate-400 font-medium">Planificación deportiva impulsada por Inteligencia Artificial</p>
               </div>
               <button onClick={() => setIsTrainingModalOpen(true)} className="px-10 py-5 bg-emerald-600 text-white font-black rounded-[2rem] shadow-2xl shadow-emerald-100 flex items-center gap-3 hover:scale-105 transition-all">
                 <BrainCircuit className="w-6 h-6" /> Nueva Sesión AI
               </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {data.trainingPlans.map(p => (
                  <div key={p.id} className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm space-y-6 hover:shadow-xl transition-all group">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center"><Sparkles className="w-6 h-6" /></div>
                        <div>
                          <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{p.category}</p>
                          <p className="text-[10px] text-emerald-600 font-black uppercase tracking-widest">{p.date}</p>
                        </div>
                      </div>
                    </div>
                    <h4 className="font-black text-2xl text-slate-800 leading-tight group-hover:text-emerald-600 transition-colors">{p.objective}</h4>
                    <div className="bg-slate-50 p-8 rounded-[2.5rem] max-h-48 overflow-hidden relative">
                      <p className="text-sm text-slate-600 whitespace-pre-wrap leading-relaxed">{p.content}</p>
                      <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-slate-50 to-transparent"></div>
                    </div>
                    <button className="w-full py-4 border-2 border-slate-100 text-slate-400 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                       <Eye className="w-4 h-4" /> Ver Detalles
                    </button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'coaches' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="flex justify-between items-center bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
               <div>
                 <h3 className="font-black text-slate-800 text-2xl tracking-tighter">Staff Técnico</h3>
                 <p className="text-sm text-slate-400 font-medium">Gestión de entrenadores y perfiles profesionales</p>
               </div>
               <button onClick={() => { setEditingCoach(undefined); setIsCoachModalOpen(true); }} className="px-10 py-5 bg-slate-900 text-white font-black rounded-[2rem] shadow-2xl shadow-slate-200 flex items-center gap-3 hover:bg-emerald-600 transition-all">
                 <Plus className="w-6 h-6" /> Agregar Entrenador
               </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                {data.coaches.map(c => (
                  <div key={c.id} className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm font-bold flex flex-col items-center text-center space-y-6 hover:shadow-2xl transition-all">
                    <div className="w-32 h-32 rounded-[3rem] bg-slate-100 ring-[12px] ring-slate-50 overflow-hidden relative group">
                      {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <UserSquare2 className="w-full h-full p-8 text-slate-300" />}
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-2xl text-slate-800 font-black tracking-tight">{c.firstName}<br />{c.lastName}</h4>
                      <p className="text-emerald-600 text-[10px] uppercase font-black tracking-widest">{c.category}</p>
                    </div>
                    <div className="w-full grid grid-cols-2 gap-4 text-[10px] uppercase tracking-widest font-black">
                       <div className="bg-slate-50 p-5 rounded-3xl text-slate-400">Sueldo <span className="block text-slate-800 mt-1">{formatCurrency(c.baseSalary)}</span></div>
                       <div className="bg-slate-50 p-5 rounded-3xl text-slate-400">Ingreso <span className="block text-slate-800 mt-1">{c.entryDate.split('-')[0]}</span></div>
                    </div>
                    <button onClick={() => { setEditingCoach(c); setIsCoachModalOpen(true); }} className="w-full py-5 bg-slate-100 text-slate-600 rounded-[2rem] text-xs uppercase font-black tracking-widest hover:bg-emerald-50 hover:text-emerald-600 transition-all">Editar Perfil</button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'matches' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="flex justify-between items-center bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
               <h3 className="font-black text-slate-800 text-2xl tracking-tighter">Calendario de Partidos</h3>
               <button onClick={() => setIsMatchModalOpen(true)} className="px-10 py-5 bg-amber-500 text-white font-black rounded-[2rem] shadow-2xl shadow-amber-100 flex items-center gap-3 hover:bg-amber-600 transition-all">
                 <Trophy className="w-6 h-6" /> Crear Convocatoria
               </button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {data.matches.map(m => (
                  <div key={m.id} className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all">
                    <div className="flex justify-between items-start mb-10">
                      <div className="flex items-center gap-4">
                         <div className="p-4 bg-amber-50 rounded-[1.5rem] text-amber-500 group-hover:rotate-12 transition-transform"><Trophy className="w-8 h-8" /></div>
                         <div>
                           <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{m.tournament}</p>
                           <h4 className="text-3xl font-black text-slate-800 tracking-tighter">vs {m.opponent}</h4>
                         </div>
                      </div>
                      <div className="text-right bg-slate-50 p-4 rounded-3xl">
                        <p className="text-xl font-black text-slate-800">{m.time}</p>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{m.date}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 py-6 border-y border-slate-50 mb-10">
                      <MapPin className="w-5 h-5 text-emerald-500" />
                      <p className="text-sm font-bold text-slate-600 tracking-tight">{m.location}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex -space-x-3">
                        {[1,2,3,4,5].map((_, idx) => (
                          <div key={idx} className="w-10 h-10 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center text-[10px] font-black uppercase text-slate-400">P</div>
                        ))}
                        {m.starters.length > 5 && <div className="w-10 h-10 rounded-full bg-slate-900 border-4 border-white flex items-center justify-center text-[10px] font-black text-white">+{m.starters.length - 5}</div>}
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full">{m.starters.length} Titulares Seleccionados</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* MÁS MÓDULOS (STORE, FINANCIAL, REPORTS, USERS, BACKUPS, SETTINGS) */}

        {activeTab === 'store' && (
          <div className="space-y-10 animate-in fade-in">
             <div className="flex gap-4 p-3 bg-white rounded-[2.5rem] border border-slate-100 w-fit shadow-sm">
                {['POS', 'INVENTORY'].map(v => (
                  <button key={v} onClick={() => setStoreView(v as any)} className={`px-10 py-4 rounded-[1.8rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all ${storeView === v ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>{v === 'POS' ? 'Terminal de Venta' : 'Gestionar Inventario'}</button>
                ))}
             </div>

             {storeView === 'POS' ? (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.products.map(p => (
                      <button key={p.id} onClick={() => addToCart(p)} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 text-left hover:border-indigo-200 hover:shadow-2xl transition-all group active:scale-95">
                        <div className="flex justify-between items-start mb-8">
                          <div className="p-4 bg-indigo-50 rounded-3xl group-hover:bg-indigo-600 group-hover:text-white transition-colors text-indigo-600"><Package className="w-8 h-8" /></div>
                          <span className="text-[10px] font-black bg-slate-50 px-4 py-2 rounded-full text-slate-400">STOCK: {p.stock}</span>
                        </div>
                        <h4 className="font-black text-slate-800 text-2xl tracking-tighter mb-2 leading-tight">{p.description}</h4>
                        <p className="text-3xl font-black text-indigo-600 tracking-tighter">{formatCurrency(p.sellPrice)}</p>
                      </button>
                    ))}
                  </div>
                  <div className="bg-white rounded-[4rem] border border-slate-100 p-10 shadow-2xl flex flex-col min-h-[600px] animate-in slide-in-from-right">
                    <h3 className="text-2xl font-black text-slate-800 mb-10 flex items-center gap-4"><ShoppingCart className="w-8 h-8 text-indigo-600" /> Tu Carrito</h3>
                    <div className="flex-1 space-y-6 overflow-y-auto pr-4 scrollbar-hide">
                       {cart.map(item => (
                         <div key={item.product.id} className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                           <div className="flex-1"><p className="text-sm font-black text-slate-800 leading-tight">{item.product.description}</p><p className="text-[10px] text-slate-400 font-black uppercase mt-1">{item.quantity} UNID. x {formatCurrency(item.product.sellPrice)}</p></div>
                           <button onClick={() => setCart(cart.filter(c => c.product.id !== item.product.id))} className="text-rose-400 hover:bg-rose-50 p-2 rounded-full transition-colors"><XCircle className="w-6 h-6" /></button>
                         </div>
                       ))}
                       {cart.length === 0 && (
                         <div className="text-center py-32 text-slate-300 font-black uppercase text-[10px] flex flex-col items-center gap-4">
                           <ShoppingBag className="w-16 h-16 opacity-10" />
                           El carrito está vacío
                         </div>
                       )}
                    </div>
                    <div className="pt-8 border-t-2 border-slate-50 mt-8 space-y-8">
                       <div className="flex justify-between items-center"><span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Total a Pagar</span><span className="text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(cart.reduce((a, b) => a + (b.product.sellPrice * b.quantity), 0))}</span></div>
                       <div className="grid grid-cols-1 gap-4">
                          <button onClick={() => handleSale('CASH')} className="py-6 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-emerald-600 transition-colors shadow-xl active:scale-95">Cobrar en Efectivo</button>
                          <button onClick={() => handleSale('CARD')} className="py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-colors shadow-xl active:scale-95">Cobrar con Tarjeta</button>
                       </div>
                    </div>
                  </div>
               </div>
             ) : (
               <div className="bg-white rounded-[4rem] border border-slate-100 overflow-hidden shadow-sm animate-in fade-in">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b-2 border-slate-100 font-black text-[10px] uppercase text-slate-400 tracking-widest">
                      <tr><th className="px-10 py-8">Código</th><th className="px-10 py-8">Descripción Producto</th><th className="px-10 py-8">Stock Actual</th><th className="px-10 py-8 text-right">Precio Venta</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data.products.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-10 py-6 font-black text-slate-400">{p.code}</td>
                          <td className="px-10 py-6 font-black text-slate-800 text-lg">{p.description}</td>
                          <td className="px-10 py-6">
                            <span className={`px-4 py-2 rounded-full font-black text-[10px] uppercase ${p.stock < 5 ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500'}`}>
                              {p.stock} UNID. {p.stock < 5 && '(BAJO)'}
                            </span>
                          </td>
                          <td className="px-10 py-6 text-right font-black text-xl text-indigo-600">{formatCurrency(p.sellPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
             )}
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-12 animate-in fade-in">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <div className="bg-slate-900 p-12 rounded-[4rem] text-white relative overflow-hidden group">
                   <p className="text-[10px] text-emerald-400 uppercase font-black tracking-widest mb-2 relative z-10">Saldo Actual en Caja</p>
                   <h4 className="text-5xl font-black italic tracking-tighter relative z-10">{formatCurrency(data.pettyCashBalance)}</h4>
                   <PiggyBank className="absolute right-[-20px] bottom-[-20px] w-40 h-40 text-white opacity-5 -rotate-12" />
                </div>
                <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                   <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Ingresos del Mes</p>
                   <h4 className="text-5xl font-black text-emerald-600 italic tracking-tighter">{formatCurrency(stats.incomes)}</h4>
                </div>
                <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm">
                   <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-2">Gastos del Mes</p>
                   <h4 className="text-5xl font-black text-rose-500 italic tracking-tighter">{formatCurrency(stats.expenses)}</h4>
                </div>
             </div>
             
             <div className="bg-white rounded-[4rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-10 border-b flex justify-between items-center bg-slate-50/30">
                   <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-4">
                     <History className="w-6 h-6 text-emerald-600" /> Libro de Movimientos
                   </h3>
                   <button className="px-8 py-3 bg-white border-2 border-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all">Generar Reporte Excel</button>
                </div>
                <table className="w-full text-left">
                   <thead className="bg-slate-50 font-black text-[10px] uppercase text-slate-400 tracking-widest">
                      <tr><th className="px-10 py-6">ID Orden</th><th className="px-10 py-6">Fecha</th><th className="px-10 py-6">Categoría</th><th className="px-10 py-6">Descripción</th><th className="px-10 py-6 text-right">Monto Neto</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                      {data.transactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-10 py-6 font-black text-slate-400">#{String(t.orderNumber).padStart(5, '0')}</td>
                           <td className="px-10 py-6 font-bold text-slate-500">{t.date}</td>
                           <td className="px-10 py-6"><span className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] uppercase font-black text-slate-500 tracking-wider">{t.category.replace('_', ' ')}</span></td>
                           <td className="px-10 py-6 font-bold text-slate-800">{t.description}</td>
                           <td className={`px-10 py-6 text-right font-black text-xl ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}</td>
                        </tr>
                      ))}
                      {data.transactions.length === 0 && (
                        <tr><td colSpan={5} className="text-center py-20 text-slate-300 font-black uppercase text-xs">No hay movimientos financieros</td></tr>
                      )}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'reports' && (
           <div className="space-y-12 animate-in fade-in max-w-5xl mx-auto">
             <div className="bg-white p-20 rounded-[5rem] shadow-sm border border-slate-100 text-center space-y-10">
                <div className="w-32 h-32 bg-emerald-50 text-emerald-600 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner shadow-emerald-100"><BarChart3 className="w-16 h-16" /></div>
                <div className="space-y-4">
                   <h3 className="text-5xl font-black text-slate-900 tracking-tighter leading-tight">Auditoría con IA Gemini</h3>
                   <p className="text-slate-400 font-medium text-lg max-w-xl mx-auto leading-relaxed">Analiza instantáneamente el flujo de caja, detecta morosidad crítica y recibe recomendaciones estratégicas basadas en tus datos reales.</p>
                </div>
                <button onClick={handleAIReport} disabled={isGeneratingReport} className="px-16 py-6 bg-slate-900 text-white font-black rounded-[2.5rem] shadow-3xl shadow-slate-200 hover:bg-emerald-600 hover:-translate-y-1 transition-all flex items-center gap-4 mx-auto text-lg disabled:opacity-50">
                   {isGeneratingReport ? <RefreshCw className="w-6 h-6 animate-spin" /> : <Sparkles className="w-6 h-6 text-amber-400" />}
                   {isGeneratingReport ? 'Procesando Datos...' : 'Generar Informe Ejecutivo AI'}
                </button>
             </div>
             
             {aiReport && (
               <div className="bg-white p-16 rounded-[4rem] border-2 border-emerald-100 shadow-2xl animate-in slide-in-from-bottom-12 duration-700">
                 <div className="flex items-center gap-4 mb-10 border-b border-emerald-50 pb-8">
                   <div className="p-3 bg-emerald-600 rounded-2xl text-white"><FileText className="w-8 h-8" /></div>
                   <div>
                     <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Análisis Estratégico</h4>
                     <p className="text-xs text-emerald-600 font-black uppercase tracking-widest">Generado hoy • Versión 1.2</p>
                   </div>
                 </div>
                 <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed font-medium text-lg italic">
                    {aiReport}
                 </div>
               </div>
             )}
           </div>
        )}

        {/* MODALES DE CREACIÓN/EDICIÓN */}
        
        <StudentModal 
          isOpen={isStudentModalOpen} 
          onClose={() => setIsStudentModalOpen(false)} 
          onSave={(s) => { 
            const existing = data.students.find(st => st.id === s.id);
            setData(prev => ({ 
              ...prev, 
              students: existing 
                ? prev.students.map(st => st.id === s.id ? { ...s, updatedAt: Date.now() } : st) 
                : [...prev.students, { ...s, id: Math.random().toString(36).substr(2, 9), updatedAt: Date.now() }] 
            })); 
            setIsStudentModalOpen(false); 
          }} 
          student={editingStudent} 
          coaches={data.coaches.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))} 
        />
        
        <CoachModal 
          isOpen={isCoachModalOpen} 
          onClose={() => setIsCoachModalOpen(false)} 
          onSave={(c) => { 
            const existing = data.coaches.find(ch => ch.id === c.id);
            setData(prev => ({ 
              ...prev, 
              coaches: existing 
                ? prev.coaches.map(ch => ch.id === c.id ? { ...c, updatedAt: Date.now() } : ch) 
                : [...prev.coaches, { ...c, id: Math.random().toString(36).substr(2, 9), updatedAt: Date.now() }] 
            })); 
            setIsCoachModalOpen(false); 
          }} 
          coach={editingCoach} 
        />
        
        <TrainingModal 
          isOpen={isTrainingModalOpen} 
          onClose={() => setIsTrainingModalOpen(false)} 
          onSave={(plan) => setData(prev => ({ ...prev, trainingPlans: [plan, ...prev.trainingPlans] }))} 
          coachId={currentUser.id} 
        />
        
        <MatchModal 
          isOpen={isMatchModalOpen} 
          onClose={() => setIsMatchModalOpen(false)} 
          onSave={(m) => setData(prev => ({ ...prev, matches: [m, ...prev.matches] }))} 
          students={data.students} 
        />
        
        <UserModal 
          isOpen={isUserModalOpen} 
          onClose={() => setIsUserModalOpen(false)} 
          onSave={(u) => setData(prev => ({ ...prev, users: [...prev.users, u] }))} 
        />

        {/* MÓDULOS DE SISTEMA (USERS, BACKUPS, SETTINGS) */}

        {activeTab === 'users' && (
           <div className="space-y-10 animate-in fade-in">
             <div className="flex justify-between items-center bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
               <div>
                 <h3 className="font-black text-slate-800 text-2xl tracking-tighter">Accesos de Usuario</h3>
                 <p className="text-sm text-slate-400 font-medium">Control de personal administrativo y técnico</p>
               </div>
               <button onClick={() => setIsUserModalOpen(true)} className="px-10 py-5 bg-emerald-600 text-white font-black rounded-[2rem] shadow-2xl shadow-emerald-100 flex items-center gap-3 hover:scale-105 transition-all">
                 <ShieldCheck className="w-6 h-6" /> Vincular Nuevo Usuario
               </button>
             </div>
             <div className="bg-white rounded-[4rem] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 font-black text-[10px] uppercase text-slate-400 tracking-[0.2em]">
                      <tr><th className="px-10 py-8">Identidad Usuario</th><th className="px-10 py-8">Correo Electrónico</th><th className="px-10 py-8">Nivel Acceso</th><th className="px-10 py-8">Estado</th><th className="px-10 py-8 text-right">Acciones</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 font-black text-sm">
                      {data.users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-10 py-6 flex items-center gap-4"><div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-sm font-black text-slate-400 ring-4 ring-slate-50">{u.name[0]}</div> {u.name}</td>
                           <td className="px-10 py-6 text-slate-400 font-bold">{u.email}</td>
                           <td className="px-10 py-6"><span className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] uppercase font-black text-slate-500 tracking-widest">{u.role}</span></td>
                           <td className="px-10 py-6"><span className="flex items-center gap-3 text-[10px] text-emerald-600 uppercase font-black"><div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" /> Conectado</span></td>
                           <td className="px-10 py-6 text-right"><button className="p-3 text-rose-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 className="w-6 h-6" /></button></td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           </div>
        )}

        {activeTab === 'backups' && (
          <div className="space-y-12 animate-in fade-in max-w-3xl mx-auto">
             <div className="bg-white p-20 rounded-[5rem] shadow-sm border border-slate-100 text-center space-y-12">
               <div className="w-32 h-32 bg-emerald-50 text-emerald-600 rounded-[3rem] flex items-center justify-center mx-auto shadow-inner shadow-emerald-50"><ShieldCheck className="w-16 h-16" /></div>
               <div className="space-y-4">
                 <h3 className="text-5xl font-black text-slate-900 tracking-tighter">Bóveda de Seguridad</h3>
                 <p className="text-slate-400 font-medium text-lg leading-relaxed">Protege tu información. Aunque los datos se sincronizan con la nube de Supabase, te recomendamos exportar una copia local semanalmente.</p>
               </div>
               <div className="grid grid-cols-1 gap-6">
                  <button onClick={handleExportData} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all shadow-3xl shadow-slate-100 text-lg">
                    <Download className="w-8 h-8" /> Descargar Backup Maestro (.json)
                  </button>
                  <label className="w-full py-8 bg-white border-4 border-dashed border-slate-100 text-slate-400 rounded-[2.5rem] font-black flex items-center justify-center gap-4 hover:border-emerald-500 hover:text-emerald-500 transition-all cursor-pointer text-lg">
                    <Upload className="w-8 h-8" /> Cargar Backup Anterior
                    <input type="file" className="hidden" onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                         const reader = new FileReader();
                         reader.onload = (ev) => {
                           try {
                             const imported = JSON.parse(ev.target?.result as string);
                             if (confirm("⚠️ ¡ADVERTENCIA! Se borrarán todos los datos actuales para cargar esta copia. ¿Deseas continuar?")) setData(imported);
                           } catch { alert("Error: El archivo no es un backup válido de FutManager Pro."); }
                         };
                         reader.readAsText(file);
                       }
                    }} />
                  </label>
               </div>
             </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-12 animate-in fade-in max-w-5xl mx-auto">
             <div className="bg-white p-16 rounded-[4rem] shadow-sm border border-slate-100">
               <div className="flex items-center gap-6 mb-16 border-b border-slate-50 pb-10">
                 <div className="p-5 bg-emerald-600 text-white rounded-[1.5rem] shadow-xl shadow-emerald-100"><Settings className="w-10 h-10" /></div>
                 <div><h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">Perfil de la Escuela</h3><p className="text-sm text-slate-400 font-bold uppercase tracking-widest">Identidad institucional y marca visual</p></div>
               </div>
               <form className="grid grid-cols-1 md:grid-cols-2 gap-12" onSubmit={(e) => { e.preventDefault(); alert("¡Identidad institucional actualizada!"); }}>
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Nombre Oficial</label>
                      <input type="text" value={data.school.name} onChange={e => setData({...data, school: {...data.school, name: e.target.value}})} className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] outline-none font-black text-slate-800 text-xl border-2 border-transparent focus:border-emerald-100 transition-all" />
                    </div>
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Eslogan del Club</label>
                      <input type="text" value={data.school.slogan} onChange={e => setData({...data, school: {...data.school, slogan: e.target.value}})} className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] outline-none font-bold text-slate-600 text-lg border-2 border-transparent focus:border-emerald-100 transition-all" />
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-2">Logotipo Institucional (URL)</label>
                      <input type="text" placeholder="https://..." value={data.school.logo || ''} onChange={e => setData({...data, school: {...data.school, logo: e.target.value}})} className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] outline-none font-bold text-slate-800 border-2 border-transparent focus:border-emerald-100 transition-all" />
                    </div>
                    <div className="p-12 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100 flex items-center justify-center group">
                       {data.school.logo ? <img src={data.school.logo} className="h-28 object-contain drop-shadow-2xl group-hover:scale-110 transition-transform" /> : <div className="text-slate-300 font-black text-[10px] uppercase tracking-widest">Tu logo aquí</div>}
                    </div>
                  </div>
                  <div className="md:col-span-2 pt-10">
                    <button type="submit" className="w-full md:w-auto px-20 py-6 bg-emerald-600 text-white font-black rounded-[2.5rem] shadow-3xl shadow-emerald-100 hover:-translate-y-1 transition-all text-lg">Actualizar Marca Visual</button>
                  </div>
               </form>
             </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
