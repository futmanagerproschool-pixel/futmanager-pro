
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Users, PiggyBank, BrainCircuit, Trophy, ChevronRight,
  RefreshCw, Lock, TrendingUp, TrendingDown, Search, XCircle, 
  ShoppingBag, ShoppingCart, Package, Eye, History, Sparkles, 
  BarChart3, Calendar, MapPin, Printer
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import StudentModal from './components/StudentModal';
import TrainingModal from './components/TrainingModal';
import CoachModal from './components/CoachModal';
import MatchModal from './components/MatchModal';
import UserModal from './components/UserModal';
import { AppData, Student, User, Coach, Product, Sale, Transaction } from './types';
import { INITIAL_DATA } from './constants';
import { formatCurrency } from './utils';
import { generateSchoolReport } from './geminiService';

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
  
  // Modals
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | undefined>();
  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const [editingCoach, setEditingCoach] = useState<Coach | undefined>();
  const [isTrainingModalOpen, setIsTrainingModalOpen] = useState(false);
  const [isMatchModalOpen, setIsMatchModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  // POS State
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [storeView, setStoreView] = useState<'POS' | 'INVENTORY'>('POS');
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Login
  const [loginStep, setLoginStep] = useState<'SELECT' | 'PASSWORD'>('SELECT');
  const [selectedUserLogin, setSelectedUserLogin] = useState<User | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  // Sincronización Supabase
  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) { setIsLoading(false); return; }
      const { data: dbData } = await supabase.from('school_data').select('data').eq('id', 'default_school').single();
      if (dbData) setData(dbData.data);
      setIsLoading(false);
    };
    fetchData();

    const channel = supabase?.channel('db_changes').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'school_data' }, (p) => {
      if (p.new?.data) setData(p.new.data);
    }).subscribe();
    return () => { supabase?.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (isLoading || !supabase) return;
    const timer = setTimeout(async () => {
      setIsSyncing(true);
      await supabase.from('school_data').update({ data: data }).eq('id', 'default_school');
      setIsSyncing(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [data, isLoading]);

  // Lógica POS
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

  if (isLoading) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500 font-black">CARGANDO SISTEMA...</div>;

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-[3rem] w-full max-w-md p-10 shadow-2xl space-y-8 animate-in zoom-in-95">
           <div className="text-center">
             <div className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-xl"><Lock className="text-white" /></div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tighter">Acceso Institucional</h1>
           </div>
           {loginStep === 'SELECT' ? (
             <div className="space-y-3">
               {data.users.map(u => (
                 <button key={u.id} onClick={() => { setSelectedUserLogin(u); setLoginStep('PASSWORD'); }} className="w-full p-6 bg-slate-50 hover:bg-emerald-50 border-2 border-transparent hover:border-emerald-200 rounded-2xl flex items-center justify-between transition-all group">
                    <div className="text-left"><p className="font-black text-slate-800">{u.name}</p><p className="text-[10px] text-slate-400 uppercase font-black">{u.role}</p></div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:translate-x-1" />
                 </button>
               ))}
             </div>
           ) : (
             <form onSubmit={(e) => { e.preventDefault(); if (selectedUserLogin?.password === passwordInput) { setCurrentUser(selectedUserLogin); localStorage.setItem('futmanager_session', JSON.stringify(selectedUserLogin)); } else alert("Pin Incorrecto"); }} className="space-y-6">
                <input autoFocus type="password" placeholder="PIN" className="w-full py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-center font-black text-3xl outline-none focus:border-emerald-500" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
                <button type="submit" className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl">Ingresar</button>
             </form>
           )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} school={data.school} currentUser={currentUser} onLogout={() => { setCurrentUser(null); localStorage.removeItem('futmanager_session'); }} />
      
      <main className="flex-1 ml-64 p-12">
        <header className="flex items-center justify-between mb-12">
          <div><h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Módulo Activo</h2><h1 className="text-4xl font-black text-slate-900 capitalize tracking-tighter">{activeTab}</h1></div>
          <div className={`px-4 py-2 rounded-full border text-[10px] font-black uppercase flex items-center gap-2 ${isSyncing ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}><RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} /> {isSyncing ? 'Sincronizando' : 'Nube Activa'}</div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-10 animate-in fade-in duration-500">
             <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group">
               <div className="relative z-10 space-y-4">
                 <h2 className="text-5xl font-black italic tracking-tighter">¡Hola, {currentUser.name.split(' ')[0]}!</h2>
                 <p className="text-slate-400 font-medium max-w-md">Tienes {data.students.length} alumnos activos y {data.students.filter(s => s.paymentStatus === 'IN_ARREARS').length} en mora.</p>
               </div>
               <Trophy className="absolute right-[-20px] bottom-[-20px] w-64 h-64 text-emerald-500 opacity-20" />
             </div>
             <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: 'Alumnos', val: data.students.length, icon: Users, color: 'emerald' },
                  { label: 'Ingresos Mes', val: formatCurrency(stats.incomes), icon: TrendingUp, color: 'blue' },
                  { label: 'Egresos Mes', val: formatCurrency(stats.expenses), icon: TrendingDown, color: 'rose' },
                  { label: 'Caja Menor', val: formatCurrency(data.pettyCashBalance), icon: PiggyBank, color: 'amber' }
                ].map((s, i) => (
                  <div key={i} className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 flex items-center gap-5">
                    <s.icon className={`w-12 h-12 text-${s.color}-600 bg-${s.color}-50 p-3 rounded-2xl`} />
                    <div><p className="text-[10px] text-slate-400 uppercase font-black">{s.label}</p><p className="text-xl font-black text-slate-800">{s.val}</p></div>
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'store' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="flex gap-4 p-2 bg-white rounded-3xl border border-slate-100 w-fit">
                {['POS', 'INVENTORY'].map(v => (
                  <button key={v} onClick={() => setStoreView(v as any)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${storeView === v ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>{v === 'POS' ? 'Venta Directa' : 'Inventario'}</button>
                ))}
             </div>

             {storeView === 'POS' ? (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {data.products.map(p => (
                      <button key={p.id} onClick={() => addToCart(p)} className="bg-white p-6 rounded-[2.5rem] border border-slate-100 text-left hover:border-indigo-200 transition-all group">
                        <div className="flex justify-between items-start mb-4"><Package className="w-10 h-10 text-indigo-100 group-hover:text-indigo-600" /><span className="text-[10px] font-black bg-slate-50 px-3 py-1 rounded-full text-slate-400">STOCK: {p.stock}</span></div>
                        <h4 className="font-black text-slate-800 text-lg mb-1">{p.description}</h4>
                        <p className="text-2xl font-black text-indigo-600">{formatCurrency(p.sellPrice)}</p>
                      </button>
                    ))}
                  </div>
                  <div className="bg-white rounded-[3rem] border border-slate-100 p-8 shadow-sm flex flex-col min-h-[500px]">
                    <h3 className="text-xl font-black text-slate-800 mb-6 flex items-center gap-3"><ShoppingCart className="w-6 h-6 text-indigo-600" /> Carrito</h3>
                    <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                       {cart.map(item => (
                         <div key={item.product.id} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                           <div className="flex-1"><p className="text-xs font-black text-slate-800">{item.product.description}</p><p className="text-[10px] text-slate-400 font-black">{item.quantity} x {formatCurrency(item.product.sellPrice)}</p></div>
                           <button onClick={() => setCart(cart.filter(c => c.product.id !== item.product.id))} className="text-rose-400"><XCircle className="w-5 h-5" /></button>
                         </div>
                       ))}
                       {cart.length === 0 && <div className="text-center py-20 text-slate-300 font-black uppercase text-[10px]">Vacío</div>}
                    </div>
                    <div className="pt-6 border-t mt-6 space-y-6">
                       <div className="flex justify-between items-center"><span className="text-slate-400 font-black text-xs uppercase">Total</span><span className="text-3xl font-black text-slate-900">{formatCurrency(cart.reduce((a, b) => a + (b.product.sellPrice * b.quantity), 0))}</span></div>
                       <div className="grid grid-cols-2 gap-3">
                          <button onClick={() => handleSale('CASH')} className="py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase">Efectivo</button>
                          <button onClick={() => handleSale('CARD')} className="py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase">Tarjeta</button>
                       </div>
                    </div>
                  </div>
               </div>
             ) : (
               <div className="bg-white rounded-[3rem] border border-slate-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b font-black text-[10px] uppercase text-slate-400">
                      <tr><th className="px-8 py-6">Código</th><th className="px-8 py-6">Descripción</th><th className="px-8 py-6">Stock</th><th className="px-8 py-6">P. Venta</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {data.products.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors font-bold text-sm">
                          <td className="px-8 py-5 text-slate-400">{p.code}</td>
                          <td className="px-8 py-5 text-slate-800">{p.description}</td>
                          <td className={`px-8 py-5 ${p.stock < 5 ? 'text-rose-500' : 'text-slate-600'}`}>{p.stock} unid.</td>
                          <td className="px-8 py-5 text-indigo-600">{formatCurrency(p.sellPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
             )}
          </div>
        )}

        {activeTab === 'financial' && (
          <div className="space-y-10 animate-in fade-in">
             <div className="bg-white rounded-[3.5rem] border border-slate-100 overflow-hidden shadow-sm">
                <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
                   <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-3"><History className="w-5 h-5 text-emerald-600" /> Historial de Movimientos</h3>
                   <button className="px-6 py-2 bg-white border rounded-xl text-[10px] font-black uppercase text-slate-400">Exportar PDF</button>
                </div>
                <table className="w-full text-left">
                   <thead className="bg-slate-50/50 border-b font-black text-[10px] uppercase text-slate-400">
                      <tr><th className="px-8 py-5">Orden</th><th className="px-8 py-5">Fecha</th><th className="px-8 py-5">Categoría</th><th className="px-8 py-5">Descripción</th><th className="px-8 py-5 text-right">Monto</th></tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50 font-bold text-sm">
                      {data.transactions.map(t => (
                        <tr key={t.id} className="hover:bg-slate-50/50">
                           <td className="px-8 py-5 text-slate-400">#{String(t.orderNumber).padStart(4, '0')}</td>
                           <td className="px-8 py-5 text-slate-500">{t.date}</td>
                           <td className="px-8 py-5"><span className="px-3 py-1 bg-slate-100 rounded-lg text-[10px] uppercase font-black text-slate-500">{t.category}</span></td>
                           <td className="px-8 py-5 text-slate-800">{t.description}</td>
                           <td className={`px-8 py-5 text-right font-black ${t.type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>{t.type === 'INCOME' ? '+' : '-'}{formatCurrency(t.amount)}</td>
                        </tr>
                      ))}
                   </tbody>
                </table>
             </div>
          </div>
        )}

        {activeTab === 'reports' && (
           <div className="space-y-8 animate-in fade-in">
             <div className="bg-white p-12 rounded-[3.5rem] shadow-sm border border-slate-100 text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto"><BarChart3 className="w-10 h-10" /></div>
                <div className="max-w-md mx-auto">
                   <h3 className="text-3xl font-black text-slate-900 tracking-tight">Análisis Ejecutivo IA</h3>
                   <p className="text-slate-400 font-medium mt-2">Analiza finanzas, morosidad y ventas de uniformes en segundos.</p>
                </div>
                <button onClick={handleAIReport} disabled={isGeneratingReport} className="px-12 py-5 bg-slate-900 text-white font-black rounded-[1.5rem] shadow-xl hover:bg-emerald-600 transition-all flex items-center gap-3 mx-auto">
                   {isGeneratingReport ? <><RefreshCw className="animate-spin" /> Procesando...</> : <><Sparkles className="text-amber-400" /> Generar Informe con IA</>}
                </button>
             </div>
             {aiReport && (
               <div className="bg-white p-12 rounded-[3.5rem] border border-emerald-100 shadow-xl animate-in slide-in-from-bottom-8">
                 <div className="prose prose-slate max-w-none text-slate-700 whitespace-pre-wrap leading-relaxed">{aiReport}</div>
               </div>
             )}
           </div>
        )}

        {/* Los demás módulos (students, coaches, matches) ya tienen sus modales asociados en el JSX */}
        {activeTab === 'students' && (
          <div className="space-y-8 animate-in fade-in">
             <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
               <div className="relative w-full max-w-md"><Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" /><input type="text" placeholder="Buscar alumno..." className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-emerald-100" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
               <button onClick={() => { setEditingStudent(undefined); setIsStudentModalOpen(true); }} className="px-8 py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg flex items-center gap-2"><Plus className="w-5 h-5" /> Nuevo Alumno</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {data.students.filter(s => s.firstName.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                  <div key={s.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm font-bold group hover:shadow-xl transition-all">
                     <div className="flex items-center gap-4 mb-6">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center font-black text-slate-400 overflow-hidden ring-4 ring-slate-50">{s.photo ? <img src={s.photo} className="w-full h-full object-cover" /> : s.firstName[0]}</div>
                        <div><h4 className="text-slate-800 text-lg leading-tight">{s.firstName} {s.lastName}</h4><p className="text-[10px] text-emerald-600 uppercase font-black tracking-widest">{s.category}</p></div>
                     </div>
                     <button onClick={() => { setEditingStudent(s); setIsStudentModalOpen(true); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] uppercase font-black tracking-widest hover:bg-emerald-600 transition-colors">Ver Detalles</button>
                  </div>
                ))}
             </div>
          </div>
        )}

        {/* Renderizado de Modales */}
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
