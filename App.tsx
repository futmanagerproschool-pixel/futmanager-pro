
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Users, PiggyBank, BrainCircuit, Trophy, ChevronRight,
  RefreshCw, Lock, TrendingUp, TrendingDown, Search, XCircle, 
  ShoppingBag, ShoppingCart, Package, History, Sparkles, 
  BarChart3, ShieldCheck, CloudOff, Globe, CheckCircle2, AlertTriangle,
  UserSquare2, Trash2, Download, Upload, Settings, Calendar
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import StudentModal from './components/StudentModal';
import TrainingModal from './components/TrainingModal';
import CoachModal from './components/CoachModal';
import MatchModal from './components/MatchModal';
import UserModal from './components/UserModal';
import { AppData, Student, User, Coach, Product, Transaction } from './types';
import { INITIAL_DATA } from './constants';
import { formatCurrency } from './utils';
import { generateSchoolReport } from './geminiService';

// Inicialización segura de Supabase
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

const App: React.FC = () => {
  // Garantizar que 'data' siempre tenga la estructura de INITIAL_DATA al inicio
  const [data, setData] = useState<AppData>(INITIAL_DATA);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('futmanager_session');
    return saved ? JSON.parse(saved) : null;
  });

  // Estados de Modales
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>();
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | undefined>();
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // Estados de Tienda
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [storeView, setStoreView] = useState<'POS' | 'INVENTORY'>('POS');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Estados de Login
  const [loginStep, setLoginStep] = useState<'SELECT' | 'PASSWORD'>('SELECT');
  const [selectedUserLogin, setSelectedUserLogin] = useState<User | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  // 1. CARGA DE DATOS: LocalStorage -> Supabase
  useEffect(() => {
    const initApp = async () => {
      // Intentar cargar de LocalStorage primero (Respaldo inmediato)
      const local = localStorage.getItem('futmanager_v7_db');
      if (local) {
        try { 
          const parsed = JSON.parse(local);
          // Mezclar con INITIAL_DATA para asegurar que si faltan campos nuevos no rompa
          setData({ ...INITIAL_DATA, ...parsed }); 
        } catch (e) {
          console.error("Error al leer local storage:", e);
        }
      }

      // Sincronizar con Supabase si está configurado
      if (supabase) {
        try {
          const { data: dbData, error } = await supabase
            .from('school_data')
            .select('data')
            .eq('id', 'default_school')
            .single();

          if (dbData?.data && Object.keys(dbData.data).length > 0) {
            setData(prev => ({ ...prev, ...dbData.data }));
            localStorage.setItem('futmanager_v7_db', JSON.stringify(dbData.data));
          } else if (error && error.code !== 'PGRST116') {
             setSyncError("Error al conectar con Supabase");
          }
        } catch (e) {
          setSyncError("Error al conectar con Supabase");
          console.warn("Nube no disponible. Trabajando en modo local.");
        }
      }
      setIsLoading(false);
    };
    initApp();
  }, []);

  // 2. PERSISTENCIA AUTOMÁTICA
  useEffect(() => {
    if (isLoading) return;

    // Guardado local obligatorio e instantáneo
    localStorage.setItem('futmanager_v7_db', JSON.stringify(data));

    // Sincronización con Supabase (Debounce de 2 segundos)
    if (!supabase) return;

    const timer = setTimeout(async () => {
      setIsSyncing(true);
      try {
        const { error } = await supabase
          .from('school_data')
          .upsert({ id: 'default_school', data: data }, { onConflict: 'id' });
        
        if (error) throw error;
        setSyncError(null);
      } catch (err) {
        setSyncError("Fallo al sincronizar con la nube");
      } finally {
        setIsSyncing(false);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [data, isLoading]);

  const stats = useMemo(() => {
    const month = new Date().toISOString().slice(0, 7);
    const incomes = data.transactions.filter(t => t.type === 'INCOME' && t.date.startsWith(month)).reduce((a, b) => a + b.amount, 0);
    const expenses = data.transactions.filter(t => t.type === 'EXPENSE' && t.date.startsWith(month)).reduce((a, b) => a + b.amount, 0);
    return { incomes, expenses };
  }, [data.transactions]);

  const handleSale = () => {
    if (cart.length === 0) return;
    const total = cart.reduce((acc, item) => acc + (item.product.sellPrice * item.quantity), 0);
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: data.nextOrderNumber,
      date: new Date().toISOString().split('T')[0],
      type: 'INCOME',
      category: 'STORE_SALE',
      amount: total,
      description: `Venta Tienda (${cart.length} productos)`,
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
    alert("Venta registrada con éxito.");
  };

  if (isLoading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
      <RefreshCw className="w-12 h-12 text-emerald-500 animate-spin" />
      <p className="text-emerald-500 font-black uppercase text-[10px] tracking-widest">Sincronizando Base de Datos...</p>
    </div>
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-[3.5rem] w-full max-w-md p-10 shadow-2xl space-y-8 animate-in zoom-in-95 duration-500">
           <div className="text-center">
             <div className="w-16 h-16 bg-emerald-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4 shadow-xl rotate-3"><Lock className="text-white w-8 h-8" /></div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tighter leading-none">FutManager<br/>Pro v7</h1>
           </div>
           {loginStep === 'SELECT' ? (
             <div className="space-y-3">
               {data.users.map(u => (
                 <button key={u.id} onClick={() => { setSelectedUserLogin(u); setLoginStep('PASSWORD'); }} className="w-full p-6 bg-slate-50 hover:bg-emerald-50 border-2 border-transparent hover:border-emerald-200 rounded-[2rem] flex items-center justify-between transition-all group active:scale-95">
                    <div className="text-left"><p className="font-black text-slate-800 text-lg">{u.name}</p><p className="text-[10px] text-emerald-600 uppercase font-black tracking-widest">{u.role}</p></div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1" />
                 </button>
               ))}
             </div>
           ) : (
             <form onSubmit={(e) => { e.preventDefault(); if (selectedUserLogin?.password === passwordInput) { setCurrentUser(selectedUserLogin); localStorage.setItem('futmanager_session', JSON.stringify(selectedUserLogin)); } else { alert("PIN Incorrecto"); setPasswordInput(''); } }} className="space-y-6">
                <input autoFocus type="password" placeholder="PIN" className="w-full py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-center font-black text-4xl outline-none focus:border-emerald-500 transition-all tracking-[0.5em]" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
                <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[1.8rem] font-black shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all">Entrar al Sistema</button>
                <button type="button" onClick={() => { setLoginStep('SELECT'); setPasswordInput(''); }} className="w-full text-slate-400 font-black text-[10px] uppercase tracking-widest text-center">Volver</button>
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
          <div>
            <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-1">Módulo Seleccionado</h2>
            <h1 className="text-4xl font-black text-slate-900 capitalize tracking-tighter">{activeTab}</h1>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <div className={`px-5 py-2.5 rounded-full border-2 text-[10px] font-black uppercase flex items-center gap-3 transition-all ${
              !supabase ? 'bg-slate-100 text-slate-400 border-slate-200' :
              syncError ? 'bg-rose-50 text-rose-500 border-rose-100' : 
              isSyncing ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
            }`}>
              {!supabase ? <CloudOff className="w-4 h-4" /> : syncError ? <AlertTriangle className="w-4 h-4" /> : isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {!supabase ? 'Guardado Local' : syncError ? 'Fallo Nube' : isSyncing ? 'Sincronizando...' : 'Multi-Usuario Activo'}
            </div>
            {!supabase && <span className="text-[8px] font-black text-slate-400 uppercase">Configura SUPABASE_URL para multi-usuario</span>}
          </div>
        </header>

        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-3xl relative overflow-hidden group border border-slate-800">
               <div className="relative z-10 space-y-4">
                 <h2 className="text-5xl font-black italic tracking-tighter leading-tight">Hola,<br/>{currentUser.name.split(' ')[0]}</h2>
                 <p className="text-slate-400 font-medium max-w-sm">Gestionando {data.students.length} alumnos en la escuela.</p>
               </div>
               <Trophy className="absolute right-[-20px] bottom-[-20px] w-64 h-64 text-emerald-500 opacity-10 -rotate-12" />
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                {[
                  { label: 'Alumnos', val: data.students.length, icon: Users, color: 'emerald' },
                  { label: 'Ingresos', val: formatCurrency(stats.incomes), icon: TrendingUp, color: 'blue' },
                  { label: 'Egresos', val: formatCurrency(stats.expenses), icon: TrendingDown, color: 'rose' },
                  { label: 'Caja', val: formatCurrency(data.pettyCashBalance), icon: PiggyBank, color: 'amber' }
                ].map((s, i) => (
                  <div key={i} className="bg-white p-10 rounded-[3rem] shadow-sm border border-slate-100 flex flex-col gap-6 hover:shadow-2xl transition-all">
                    <s.icon className={`w-12 h-12 text-${s.color}-600 bg-${s.color}-50 p-3.5 rounded-2xl`} />
                    <div><p className="text-[10px] text-slate-400 uppercase font-black tracking-widest mb-1">{s.label}</p><p className="text-2xl font-black text-slate-800 tracking-tighter">{s.val}</p></div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* ALUMNOS */}
        {activeTab === 'students' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="flex flex-col md:flex-row justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 gap-4">
               <div className="relative w-full max-w-md">
                 <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                 <input type="text" placeholder="Buscar alumno..." className="w-full pl-16 pr-8 py-5 bg-slate-50 rounded-[2rem] font-bold outline-none border-2 border-transparent focus:border-emerald-100 transition-all" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
               </div>
               <button onClick={() => { setEditingStudent(undefined); setIsStudentModalOpen(true); }} className="px-10 py-5 bg-emerald-600 text-white font-black rounded-[2rem] shadow-2xl hover:bg-emerald-700 transition-all flex items-center gap-3"><Plus className="w-6 h-6" /> Nuevo Alumno</button>
             </div>
             
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {data.students.filter(s => `${s.firstName} ${s.lastName} ${s.document}`.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                  <div key={s.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all font-bold group">
                     <div className="flex items-center gap-5 mb-8">
                        <div className="w-20 h-20 rounded-[2rem] bg-slate-100 flex items-center justify-center overflow-hidden ring-8 ring-slate-50">
                          {s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : <span className="text-3xl text-slate-300">{s.firstName[0]}</span>}
                        </div>
                        <div><h4 className="text-slate-800 text-xl leading-tight">{s.firstName}<br />{s.lastName}</h4><p className="text-[10px] text-emerald-600 uppercase font-black tracking-widest mt-1">{s.category}</p></div>
                     </div>
                     <div className="grid grid-cols-2 gap-3 mb-8 text-[10px] uppercase text-slate-400">
                       <div className="bg-slate-50 p-4 rounded-2xl"><span className="block font-black text-slate-800 mb-1">{s.position}</span>Posición</div>
                       <div className={`p-4 rounded-2xl ${s.paymentStatus === 'UP_TO_DATE' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'}`}><span className="block font-black mb-1">{s.paymentStatus === 'UP_TO_DATE' ? 'Al Día' : 'En Mora'}</span>Estado</div>
                     </div>
                     <button onClick={() => { setEditingStudent(s); setIsStudentModalOpen(true); }} className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] text-[10px] uppercase font-black tracking-widest hover:bg-emerald-600 transition-colors shadow-lg shadow-slate-100">Ver Perfil</button>
                  </div>
                ))}
                {data.students.length === 0 && <div className="col-span-full py-32 text-center text-slate-300 font-black uppercase tracking-[0.3em]">No hay alumnos registrados</div>}
             </div>
          </div>
        )}

        {/* TIENDA PRO */}
        {activeTab === 'store' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="flex gap-4 p-3 bg-white rounded-[2rem] border border-slate-100 w-fit">
                {['POS', 'INVENTORY'].map(v => (
                  <button key={v} onClick={() => setStoreView(v as any)} className={`px-10 py-3 rounded-[1.5rem] text-[10px] font-black uppercase transition-all ${storeView === v ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>{v === 'POS' ? 'Terminal Venta' : 'Inventario'}</button>
                ))}
             </div>

             {storeView === 'POS' ? (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {data.products.map(p => (
                      <button key={p.id} onClick={() => { if(p.stock > 0) { setCart(prev => { const exists = prev.find(i => i.product.id === p.id); return exists ? prev.map(i => i.product.id === p.id ? {...i, quantity: i.quantity + 1} : i) : [...prev, {product: p, quantity: 1}]; }); } else alert("Producto agotado"); }} className="bg-white p-10 rounded-[3rem] border border-slate-100 text-left hover:border-indigo-200 hover:shadow-2xl transition-all group">
                        <div className="flex justify-between items-start mb-6"><div className="p-4 bg-indigo-50 rounded-2xl text-indigo-600"><Package className="w-8 h-8" /></div><span className="text-[10px] font-black bg-slate-50 px-4 py-2 rounded-full text-slate-400 uppercase">Stock: {p.stock}</span></div>
                        <h4 className="font-black text-slate-800 text-xl tracking-tighter leading-tight">{p.description}</h4>
                        <p className="text-3xl font-black text-indigo-600 mt-2 tracking-tighter">{formatCurrency(p.sellPrice)}</p>
                      </button>
                    ))}
                  </div>
                  <div className="bg-white rounded-[3rem] border border-slate-100 p-10 shadow-3xl flex flex-col min-h-[600px] animate-in slide-in-from-right">
                    <h3 className="text-2xl font-black text-slate-800 mb-10 flex items-center gap-4"><ShoppingCart className="w-8 h-8 text-indigo-600" /> Carrito</h3>
                    <div className="flex-1 space-y-5 overflow-y-auto pr-2 scrollbar-hide">
                       {cart.map(item => (
                         <div key={item.product.id} className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                           <div className="flex-1"><p className="text-sm font-black text-slate-800 leading-tight">{item.product.description}</p><p className="text-[10px] text-slate-400 font-black mt-1 uppercase">{item.quantity} x {formatCurrency(item.product.sellPrice)}</p></div>
                           <button onClick={() => setCart(cart.filter(i => i.product.id !== item.product.id))} className="text-rose-400 p-2 hover:bg-rose-50 rounded-full transition-all"><XCircle className="w-6 h-6" /></button>
                         </div>
                       ))}
                       {cart.length === 0 && <div className="text-center py-32 text-slate-300 font-black uppercase text-[10px] flex flex-col items-center gap-4"><ShoppingBag className="w-16 h-16 opacity-10" />Listo para vender</div>}
                    </div>
                    <div className="pt-8 border-t-2 border-slate-50 mt-8 space-y-8">
                       <div className="flex justify-between items-center"><span className="text-slate-400 font-black text-[10px] uppercase tracking-widest">Total</span><span className="text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(cart.reduce((a, b) => a + (b.product.sellPrice * b.quantity), 0))}</span></div>
                       <button onClick={handleSale} className="w-full py-6 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-3xl hover:bg-indigo-600 transition-all">Cobrar Venta</button>
                    </div>
                  </div>
               </div>
             ) : (
                <div className="bg-white rounded-[4rem] border border-slate-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 font-black text-[10px] uppercase text-slate-400 tracking-widest border-b-2">
                      <tr><th className="px-10 py-8">Producto</th><th className="px-10 py-8">Existencias</th><th className="px-10 py-8 text-right">Precio</th></tr>
                    </thead>
                    <tbody className="divide-y font-bold">
                      {data.products.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-10 py-6 text-slate-800 text-lg font-black">{p.description}</td>
                          <td className={`px-10 py-6 ${p.stock < 5 ? 'text-rose-500' : 'text-slate-600'}`}>{p.stock} unidades</td>
                          <td className="px-10 py-6 text-right text-2xl text-indigo-600 font-black">{formatCurrency(p.sellPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
             )}
          </div>
        )}

        {/* FINANZAS */}
        {activeTab === 'financial' && (
          <div className="space-y-10 animate-in fade-in">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-slate-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                   <p className="text-[10px] text-emerald-400 uppercase font-black mb-2 tracking-[0.2em] relative z-10">Saldo en Caja</p>
                   <h4 className="text-5xl font-black italic relative z-10 tracking-tighter">{formatCurrency(data.pettyCashBalance)}</h4>
                   <PiggyBank className="absolute right-[-20px] bottom-[-20px] w-48 h-48 opacity-5 -rotate-12" />
                </div>
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-center">
                   <p className="text-[10px] text-slate-400 uppercase font-black mb-2 tracking-[0.2em]">Ingresos del Mes</p>
                   <h4 className="text-4xl font-black text-emerald-600 italic tracking-tighter">{formatCurrency(stats.incomes)}</h4>
                </div>
                <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col justify-center">
                   <p className="text-[10px] text-slate-400 uppercase font-black mb-2 tracking-[0.2em]">Egresos del Mes</p>
                   <h4 className="text-4xl font-black text-rose-500 italic tracking-tighter">{formatCurrency(stats.expenses)}</h4>
                </div>
             </div>
             
             <div className="bg-white rounded-[4rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-10 border-b flex justify-between items-center bg-slate-50/50">
                  <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-3"><History className="text-emerald-600" /> Historial Completo</h3>
                </div>
                <table className="w-full text-left">
                   <thead className="bg-slate-50 font-black text-[10px] uppercase text-slate-400">
                      <tr><th className="px-10 py-6">Orden</th><th className="px-10 py-6">Fecha</th><th className="px-10 py-6">Descripción</th><th className="px-10 py-6 text-right">Monto</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-100 font-bold">
                      {data.transactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-colors">
                           <td className="px-10 py-5 text-slate-400">#{String(t.orderNumber).padStart(4, '0')}</td>
                           <td className="px-10 py-5 text-slate-500">{t.date}</td>
                           <td className="px-10 py-5 text-slate-800">{t.description}</td>
                           <td className={`px-10 py-5 text-right font-black ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                             {t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}
                           </td>
                        </tr>
                      ))}
                      {data.transactions.length === 0 && <tr><td colSpan={4} className="py-20 text-center text-slate-300 font-black uppercase text-[10px]">No hay transacciones registradas</td></tr>}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {/* ENTRENADORES */}
        {activeTab === 'coaches' && (
          <div className="space-y-10 animate-in fade-in">
             <div className="flex justify-between items-center bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
               <div><h3 className="font-black text-slate-800 text-2xl tracking-tighter">Staff Técnico</h3><p className="text-slate-400 font-medium">Gestión de profesionales</p></div>
               <button onClick={() => { setEditingCoach(undefined); setIsCoachModalOpen(true); }} className="px-10 py-5 bg-slate-900 text-white font-black rounded-[2rem] shadow-3xl hover:bg-emerald-600 transition-all flex items-center gap-3"><Plus className="w-6 h-6" /> Nuevo Entrenador</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                {data.coaches.map(c => (
                  <div key={c.id} className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col items-center text-center space-y-6 hover:shadow-2xl transition-all font-bold">
                    <div className="w-32 h-32 rounded-[3rem] bg-slate-100 ring-[12px] ring-slate-50 overflow-hidden">
                      {c.photo ? <img src={c.photo} className="w-full h-full object-cover" /> : <UserSquare2 className="w-full h-full p-8 text-slate-300" />}
                    </div>
                    <div>
                      <h4 className="text-2xl text-slate-800 font-black leading-tight tracking-tighter">{c.firstName}<br />{c.lastName}</h4>
                      <p className="text-emerald-600 text-[10px] uppercase font-black tracking-[0.2em] mt-2">{c.category}</p>
                    </div>
                    <div className="w-full grid grid-cols-2 gap-4 text-[10px] uppercase font-black">
                       <div className="bg-slate-50 p-5 rounded-3xl text-slate-400">Salario <span className="block text-slate-800 mt-1">{formatCurrency(c.baseSalary)}</span></div>
                       <div className="bg-slate-50 p-5 rounded-3xl text-slate-400">Ingreso <span className="block text-slate-800 mt-1">{c.entryDate}</span></div>
                    </div>
                    <button onClick={() => { setEditingCoach(c); setIsCoachModalOpen(true); }} className="w-full py-5 bg-slate-100 text-slate-600 rounded-[2rem] text-[10px] uppercase font-black hover:bg-emerald-50 hover:text-emerald-600 transition-all shadow-sm">Editar Perfil</button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Otros módulos: Se cargan dinámicamente según la navegación */}
        {activeTab === 'training' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="flex justify-between items-center bg-white p-10 rounded-[3.5rem] shadow-sm border border-slate-100">
               <div><h3 className="font-black text-slate-800 text-2xl tracking-tighter">Metodología IA</h3><p className="text-slate-400 font-medium tracking-tight">Crea entrenamientos inteligentes</p></div>
               <button onClick={() => setIsTrainingModalOpen(true)} className="px-10 py-5 bg-emerald-600 text-white font-black rounded-2xl shadow-xl hover:bg-emerald-700 transition-all flex items-center gap-3"><BrainCircuit className="w-6 h-6" /> Nuevo Plan AI</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {data.trainingPlans.map(p => (
                  <div key={p.id} className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm space-y-4 hover:shadow-2xl transition-all group border-b-4 border-b-emerald-500">
                    <div className="flex justify-between items-start">
                      <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-full uppercase tracking-widest">{p.category}</span>
                      <span className="text-[10px] text-slate-400 font-black">{p.date}</span>
                    </div>
                    <h4 className="font-black text-2xl text-slate-800 leading-tight group-hover:text-emerald-600 transition-colors tracking-tighter">{p.objective}</h4>
                    <div className="bg-slate-50 p-6 rounded-3xl max-h-48 overflow-hidden relative">
                      <p className="text-xs text-slate-600 whitespace-pre-wrap leading-relaxed font-medium">{p.content}</p>
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-slate-50 to-transparent"></div>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* PARTIDOS */}
        {activeTab === 'matches' && (
          <div className="space-y-10 animate-in fade-in">
             <div className="flex justify-between items-center bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
               <h3 className="font-black text-slate-800 text-2xl tracking-tighter">Calendario de Partidos</h3>
               <button onClick={() => setIsMatchModalOpen(true)} className="px-10 py-5 bg-amber-500 text-white font-black rounded-[2rem] shadow-2xl hover:bg-amber-600 transition-all flex items-center gap-3"><Trophy className="w-6 h-6" /> Nueva Convocatoria</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {data.matches.map(m => (
                  <div key={m.id} className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-2xl transition-all">
                    <div className="flex justify-between items-start mb-8">
                      <div className="flex items-center gap-4">
                         <div className="p-4 bg-amber-50 rounded-[1.5rem] text-amber-500"><Trophy className="w-8 h-8" /></div>
                         <div><p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{m.tournament}</p><h4 className="text-3xl font-black text-slate-800 tracking-tighter leading-none mt-1">vs {m.opponent}</h4></div>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-6 rounded-3xl mb-8 font-bold text-slate-600 text-sm flex flex-col gap-2">
                      <div className="flex items-center gap-3"><Calendar className="w-4 h-4 text-emerald-500" /> {m.date} a las {m.time}</div>
                      <div className="flex items-center gap-3"><Globe className="w-4 h-4 text-emerald-500" /> {m.location}</div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-5 py-2 rounded-full">{m.starters.length} Jugadores Citados</span>
                    </div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* INFORMES IA */}
        {activeTab === 'reports' && (
           <div className="space-y-12 animate-in fade-in max-w-5xl mx-auto">
             <div className="bg-white p-20 rounded-[5rem] shadow-sm border border-slate-100 text-center space-y-10">
                <div className="w-32 h-32 bg-emerald-50 text-emerald-600 rounded-[3rem] flex items-center justify-center mx-auto"><BarChart3 className="w-16 h-16" /></div>
                <div className="space-y-4">
                   <h3 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Análisis Estratégico</h3>
                   <p className="text-slate-400 font-medium text-lg max-w-xl mx-auto italic">Auditoría financiera e inventario mediante Inteligencia Artificial.</p>
                </div>
                <button 
                  onClick={async () => { setIsGeneratingReport(true); const r = await generateSchoolReport(data); setAiReport(r); setIsGeneratingReport(false); }} 
                  disabled={isGeneratingReport} 
                  className="px-16 py-6 bg-slate-900 text-white font-black rounded-[2.5rem] shadow-3xl hover:bg-emerald-600 transition-all flex items-center gap-4 mx-auto text-lg disabled:opacity-50"
                >
                   {isGeneratingReport ? <RefreshCw className="animate-spin" /> : <Sparkles className="text-amber-400" />} {isGeneratingReport ? 'Analizando Datos...' : 'Generar Informe Ejecutivo'}
                </button>
             </div>
             {aiReport && (
               <div className="bg-white p-16 rounded-[4rem] border-2 border-emerald-100 shadow-2xl animate-in slide-in-from-bottom duration-700">
                 <h4 className="text-2xl font-black text-slate-900 uppercase border-b pb-6 mb-10 tracking-tighter">Resultados de la Auditoría</h4>
                 <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed font-medium text-lg"> {aiReport} </div>
               </div>
             )}
           </div>
        )}

        {/* USUARIOS */}
        {activeTab === 'users' && (
           <div className="space-y-8 animate-in fade-in">
             <div className="flex justify-between items-center bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100">
               <div><h3 className="font-black text-slate-800 text-2xl tracking-tighter leading-none">Accesos al Sistema</h3><p className="text-sm text-slate-400 font-medium mt-2">Personal con permiso de ingreso</p></div>
               <button onClick={() => setIsUserModalOpen(true)} className="px-10 py-5 bg-emerald-600 text-white font-black rounded-[2rem] shadow-2xl hover:bg-emerald-700 transition-all flex items-center gap-3"><ShieldCheck className="w-6 h-6" /> Vincular Nuevo</button>
             </div>
             <div className="bg-white rounded-[4rem] border border-slate-100 overflow-hidden shadow-sm">
                <table className="w-full text-left">
                   <thead className="bg-slate-50 font-black text-[10px] uppercase text-slate-400">
                      <tr><th className="px-10 py-8">Nombre</th><th className="px-10 py-8">Email</th><th className="px-10 py-8">Rol</th><th className="px-10 py-8 text-right">Acción</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 font-black text-sm">
                      {data.users.map(u => (
                        <tr key={u.id} className="hover:bg-slate-50/50">
                           <td className="px-10 py-6 flex items-center gap-4 font-black"><div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400">{u.name[0]}</div> {u.name}</td>
                           <td className="px-10 py-6 text-slate-400">{u.email}</td>
                           <td className="px-10 py-6"><span className="px-4 py-2 bg-slate-100 rounded-xl text-[10px] uppercase font-black tracking-widest">{u.role}</span></td>
                           <td className="px-10 py-6 text-right"><button className="p-3 text-rose-300 hover:text-rose-600 transition-all"><Trash2 className="w-6 h-6" /></button></td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
           </div>
        )}

        {/* BACKUPS */}
        {activeTab === 'backups' && (
          <div className="space-y-12 animate-in fade-in max-w-3xl mx-auto">
             <div className="bg-white p-20 rounded-[5rem] shadow-sm border border-slate-100 text-center space-y-12">
               <div className="w-32 h-32 bg-emerald-50 text-emerald-600 rounded-[3rem] flex items-center justify-center mx-auto"><ShieldCheck className="w-16 h-16" /></div>
               <div className="space-y-4">
                 <h3 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Bóveda de Datos</h3>
                 <p className="text-slate-400 font-medium text-lg">Exporta o importa toda la base de datos de tu escuela en formato JSON.</p>
               </div>
               <div className="flex flex-col gap-6">
                  <button onClick={() => {
                     const dataStr = JSON.stringify(data, null, 2);
                     const blob = new Blob([dataStr], { type: 'application/json' });
                     const url = URL.createObjectURL(blob);
                     const link = document.createElement('a');
                     link.href = url;
                     link.download = `futbol_backup_${new Date().toISOString().split('T')[0]}.json`;
                     link.click();
                  }} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] font-black flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all text-xl"><Download className="w-8 h-8" /> Descargar Backup Completo</button>
                  
                  <label className="w-full py-8 bg-white border-4 border-dashed border-slate-100 text-slate-400 rounded-[2.5rem] font-black flex items-center justify-center gap-4 hover:border-emerald-500 transition-all cursor-pointer text-xl">
                    <Upload className="w-8 h-8" /> Restaurar desde Archivo
                    <input type="file" className="hidden" onChange={(e) => {
                       const file = e.target.files?.[0];
                       if (file) {
                         const reader = new FileReader();
                         reader.onload = (ev) => {
                           try {
                             const imported = JSON.parse(ev.target?.result as string);
                             if (confirm("¿Estás seguro de sobrescribir todos los datos actuales?")) {
                               setData({ ...INITIAL_DATA, ...imported });
                             }
                           } catch { alert("El archivo no tiene el formato correcto."); }
                         };
                         reader.readAsText(file);
                       }
                    }} />
                  </label>
               </div>
             </div>
          </div>
        )}

        {/* CONFIGURACIÓN */}
        {activeTab === 'settings' && (
          <div className="space-y-12 animate-in fade-in max-w-5xl mx-auto">
             <div className="bg-white p-16 rounded-[4rem] shadow-sm border border-slate-100">
               <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-10 leading-none">Identidad Institucional</h3>
               <form className="grid grid-cols-1 md:grid-cols-2 gap-12" onSubmit={(e) => { e.preventDefault(); alert("Marca actualizada!"); }}>
                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nombre de la Escuela</label>
                      <input type="text" value={data.school.name} onChange={e => setData({...data, school: {...data.school, name: e.target.value}})} className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] outline-none font-black text-slate-800 text-xl border border-transparent focus:border-emerald-200" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Eslogan Publicitario</label>
                      <input type="text" value={data.school.slogan} onChange={e => setData({...data, school: {...data.school, slogan: e.target.value}})} className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] outline-none font-bold text-slate-600 text-lg border border-transparent focus:border-emerald-200" />
                    </div>
                  </div>
                  <div className="space-y-8">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">URL del Logotipo</label>
                      <input type="text" value={data.school.logo || ''} onChange={e => setData({...data, school: {...data.school, logo: e.target.value}})} className="w-full px-8 py-5 bg-slate-50 rounded-[2rem] outline-none font-bold text-slate-800 border border-transparent focus:border-emerald-200" placeholder="https://ejemplo.com/logo.png" />
                    </div>
                    <div className="p-12 bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100 flex items-center justify-center">
                       {data.school.logo ? <img src={data.school.logo} className="h-28 object-contain" /> : <p className="text-slate-300 font-black text-[10px] uppercase">Previsualización Logo</p>}
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <button type="submit" className="px-20 py-6 bg-emerald-600 text-white font-black rounded-[2.5rem] shadow-xl hover:scale-105 active:scale-95 transition-all text-lg">Guardar Cambios</button>
                  </div>
               </form>
             </div>
          </div>
        )}

        {/* MODALES COMUNES */}
        <StudentModal isOpen={isStudentModalOpen} onClose={() => setIsStudentModalOpen(false)} onSave={(s) => { const existing = data.students.find(st => st.id === s.id); setData(prev => ({ ...prev, students: existing ? prev.students.map(st => st.id === s.id ? { ...s, updatedAt: Date.now() } : st) : [...prev.students, { ...s, id: Math.random().toString(36).substr(2, 9), updatedAt: Date.now() }] })); setIsStudentModalOpen(false); }} student={editingStudent} coaches={data.coaches.map(c => ({ id: c.id, name: `${c.firstName} ${c.lastName}` }))} />
        <CoachModal isOpen={isCoachModalOpen} onClose={() => setIsCoachModalOpen(false)} onSave={(c) => { const existing = data.coaches.find(ch => ch.id === c.id); setData(prev => ({ ...prev, coaches: existing ? prev.coaches.map(ch => ch.id === c.id ? { ...c, updatedAt: Date.now() } : ch) : [...prev.coaches, { ...c, id: Math.random().toString(36).substr(2, 9), updatedAt: Date.now() }] })); setIsCoachModalOpen(false); }} coach={editingCoach} />
        <TrainingModal isOpen={isTrainingModalOpen} onClose={() => setIsTrainingModalOpen(false)} onSave={(plan) => setData(prev => ({ ...prev, trainingPlans: [plan, ...prev.trainingPlans] }))} coachId={currentUser.id} />
        <MatchModal isOpen={isMatchModalOpen} onClose={() => setIsMatchModalOpen(false)} onSave={(m) => setData(prev => ({ ...prev, matches: [m, ...prev.matches] }))} students={data.students} />
        <UserModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} onSave={(u) => setData(prev => ({ ...prev, users: [...prev.users, u] }))} />
      </main>
    </div>
  );
};

export default App;
