
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Plus, Users, PiggyBank, BrainCircuit, Trophy, ChevronRight,
  RefreshCw, Lock, TrendingUp, TrendingDown, Search, XCircle, 
  ShoppingBag, ShoppingCart, Package, Eye, History, Sparkles, 
  BarChart3, Calendar, MapPin, Printer, ShieldCheck, Download, 
  Upload, Settings, UserSquare2, Trash2, Mail, Phone, Map,
  FileText, CreditCard, Star, FileSpreadsheet, Receipt, Store,
  Truck, Tag, Calculator
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Sidebar from './components/Sidebar';
import StudentModal from './components/StudentModal';
import TrainingModal from './components/TrainingModal';
import CoachModal from './components/CoachModal';
import MatchModal from './components/MatchModal';
import UserModal from './components/UserModal';
import { AppData, Student, User, Coach, Product, Sale, Transaction, ExternalClient, Vendor, Purchase } from './types';
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
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  // Estados Tienda
  const [cart, setCart] = useState<{product: Product, quantity: number}[]>([]);
  const [customerType, setCustomerType] = useState<'STUDENT' | 'EXTERNAL' | 'ANONYMOUS'>('ANONYMOUS');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [saleDiscount, setSaleDiscount] = useState<number>(0);
  const [storeView, setStoreView] = useState<'POS' | 'INVENTORY' | 'PURCHASES'>('POS');

  // Estados de Login
  const [loginStep, setLoginStep] = useState<'SELECT' | 'PASSWORD'>('SELECT');
  const [selectedUserLogin, setSelectedUserLogin] = useState<User | null>(null);
  const [passwordInput, setPasswordInput] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!supabase) { setIsLoading(false); return; }
      const { data: dbData } = await supabase.from('school_data').select('data').eq('id', 'default_school').single();
      if (dbData) setData(dbData.data);
      setIsLoading(false);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (isLoading || !supabase) return;
    const timer = setTimeout(async () => {
      setIsSyncing(true);
      await supabase.from('school_data').upsert({ id: 'default_school', data: data });
      setIsSyncing(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [data, isLoading]);

  const handleSale = (method: 'CASH' | 'CARD' | 'CREDIT' | 'POINTS') => {
    if (cart.length === 0) return;
    const subtotal = cart.reduce((acc, item) => acc + (item.product.sellPrice * item.quantity), 0);
    const total = subtotal - saleDiscount;
    
    // Validación de Stock
    const stockIssues = cart.filter(item => item.product.stock < item.quantity);
    if (stockIssues.length > 0) return alert(`Stock insuficiente para: ${stockIssues.map(i => i.product.description).join(', ')}`);

    const pointsEarned = data.loyaltyConfig.enabled ? Math.floor(total / data.loyaltyConfig.pointsPerAmount) : 0;
    
    const newSale: Sale = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: data.nextOrderNumber,
      date: new Date().toISOString().split('T')[0],
      customerType,
      customerId: selectedCustomerId || undefined,
      items: cart.map(i => ({ productId: i.product.id, description: i.product.description, quantity: i.quantity, price: i.product.sellPrice })),
      subtotal,
      discount: saleDiscount,
      total,
      paymentMethod: method,
      pointsEarned,
      updatedAt: Date.now()
    };

    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: data.nextOrderNumber,
      date: new Date().toISOString().split('T')[0],
      type: 'INCOME',
      category: 'STORE_SALE',
      amount: total,
      description: `Venta #${data.nextOrderNumber} - ${method}`,
      updatedAt: Date.now()
    };

    setData(prev => ({
      ...prev,
      sales: [newSale, ...prev.sales],
      transactions: method !== 'CREDIT' ? [newTransaction, ...prev.transactions] : prev.transactions,
      pettyCashBalance: method !== 'CREDIT' ? prev.pettyCashBalance + total : prev.pettyCashBalance,
      nextOrderNumber: prev.nextOrderNumber + 1,
      products: prev.products.map(p => {
        const item = cart.find(i => i.product.id === p.id);
        return item ? { ...p, stock: p.stock - item.quantity, updatedAt: Date.now() } : p;
      }),
      students: prev.students.map(s => {
        if (customerType === 'STUDENT' && s.id === selectedCustomerId) {
          return { 
            ...s, 
            loyaltyPoints: s.loyaltyPoints + pointsEarned, 
            creditDebt: method === 'CREDIT' ? s.creditDebt + total : s.creditDebt,
            updatedAt: Date.now()
          };
        }
        return s;
      }),
      externalClients: prev.externalClients.map(c => {
        if (customerType === 'EXTERNAL' && c.id === selectedCustomerId) {
          return { 
            ...c, 
            loyaltyPoints: c.loyaltyPoints + pointsEarned,
            creditDebt: method === 'CREDIT' ? c.creditDebt + total : c.creditDebt,
            updatedAt: Date.now()
          };
        }
        return c;
      })
    }));

    setLastSale(newSale);
    setCart([]);
    setSaleDiscount(0);
    alert("Venta procesada con éxito.");
  };

  const handleRestock = (productId: string, qty: number, buyPrice: number, vendorId: string) => {
    const newTransaction: Transaction = {
      id: Math.random().toString(36).substr(2, 9),
      orderNumber: data.nextOrderNumber,
      date: new Date().toISOString().split('T')[0],
      type: 'EXPENSE',
      category: 'PURCHASE',
      amount: qty * buyPrice,
      description: `Compra Stock: ${qty} unid. a Proveedor`,
      updatedAt: Date.now()
    };

    setData(prev => ({
      ...prev,
      products: prev.products.map(p => p.id === productId ? { ...p, stock: p.stock + qty, buyPrice, updatedAt: Date.now() } : p),
      transactions: [newTransaction, ...prev.transactions],
      pettyCashBalance: prev.pettyCashBalance - (qty * buyPrice),
      nextOrderNumber: prev.nextOrderNumber + 1
    }));
    alert("Inventario actualizado y egreso registrado.");
  };

  const inventoryValuation = useMemo(() => {
    return data.products.reduce((acc, p) => acc + (p.stock * p.buyPrice), 0);
  }, [data.products]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="bg-white rounded-[3.5rem] w-full max-w-md p-12 shadow-2xl space-y-10">
           <div className="text-center space-y-3">
             <div className="w-20 h-20 bg-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-xl"><Lock className="text-white w-8 h-8" /></div>
             <h1 className="text-3xl font-black text-slate-900 tracking-tighter">FutManager Admin</h1>
           </div>
           <form onSubmit={(e) => { e.preventDefault(); if (selectedUserLogin?.password === passwordInput) setCurrentUser(selectedUserLogin); else alert("PIN Incorrecto"); }} className="space-y-8">
                <select className="w-full p-4 bg-slate-50 border-none rounded-2xl font-black text-slate-800 outline-none mb-4" onChange={e => setSelectedUserLogin(data.users.find(u => u.id === e.target.value) || null)}>
                  <option value="">Seleccionar Usuario</option>
                  {data.users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                </select>
                <input type="password" placeholder="PIN" className="w-full py-6 bg-slate-50 border-2 border-slate-100 rounded-[2rem] text-center font-black text-4xl outline-none focus:border-emerald-500 tracking-[0.5em]" value={passwordInput} onChange={e => setPasswordInput(e.target.value)} />
                <button type="submit" className="w-full py-5 bg-emerald-600 text-white rounded-[2rem] font-black">Acceder</button>
           </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} school={data.school} currentUser={currentUser} onLogout={() => setCurrentUser(null)} />
      
      <main className="flex-1 ml-64 p-12 overflow-y-auto h-screen scrollbar-hide print:ml-0 print:p-0">
        <header className="flex items-center justify-between mb-12 print:hidden">
          <div><h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Control Institucional</h2><h1 className="text-5xl font-black text-slate-900 capitalize tracking-tighter">{activeTab}</h1></div>
          <div className="flex items-center gap-6">
             <div className="bg-white p-6 rounded-[2rem] border border-slate-100 flex items-center gap-4 shadow-sm">
                <PiggyBank className="w-10 h-10 text-emerald-600" />
                <div><p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Saldo en Caja</p><p className="text-2xl font-black text-slate-800">{formatCurrency(data.pettyCashBalance)}</p></div>
             </div>
          </div>
        </header>

        {activeTab === 'store' && (
          <div className="space-y-10 animate-in fade-in">
             <div className="flex justify-between items-center bg-white p-8 rounded-[3rem] shadow-sm border border-slate-100">
                <div className="flex gap-4">
                  {['POS', 'INVENTORY', 'PURCHASES'].map(v => (
                    <button key={v} onClick={() => setStoreView(v as any)} className={`px-10 py-4 rounded-[1.8rem] text-[10px] font-black uppercase transition-all ${storeView === v ? 'bg-indigo-600 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}>
                      {v === 'POS' ? 'Terminal Venta' : v === 'INVENTORY' ? 'Inventario' : 'Compras'}
                    </button>
                  ))}
                </div>
                {storeView === 'INVENTORY' && (
                  <div className="bg-indigo-50 px-6 py-4 rounded-2xl flex items-center gap-4 border border-indigo-100">
                    <Calculator className="w-6 h-6 text-indigo-600" />
                    <div><p className="text-[8px] font-black text-indigo-400 uppercase">Valuación Total Inventario</p><p className="text-xl font-black text-indigo-900">{formatCurrency(inventoryValuation)}</p></div>
                  </div>
                )}
             </div>

             {storeView === 'POS' ? (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                  <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Cliente</label>
                          <div className="flex gap-2">
                             {['ANONYMOUS', 'STUDENT', 'EXTERNAL'].map(t => (
                               <button key={t} onClick={() => { setCustomerType(t as any); setSelectedCustomerId(null); }} className={`flex-1 py-3 rounded-xl text-[10px] font-black border-2 transition-all ${customerType === t ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'}`}>{t === 'ANONYMOUS' ? 'Final' : t === 'STUDENT' ? 'Alumno' : 'Externo'}</button>
                             ))}
                          </div>
                       </div>
                       {customerType !== 'ANONYMOUS' && (
                         <div className="space-y-4 animate-in slide-in-from-left">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleccionar {customerType === 'STUDENT' ? 'Alumno' : 'Cliente'}</label>
                            <select className="w-full p-4 bg-slate-50 rounded-2xl font-bold outline-none border-2 border-transparent focus:border-indigo-100" value={selectedCustomerId || ''} onChange={e => setSelectedCustomerId(e.target.value)}>
                               <option value="">Seleccionar...</option>
                               {customerType === 'STUDENT' ? data.students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName} (Pts: {s.loyaltyPoints})</option>) : data.externalClients.map(c => <option key={c.id} value={c.id}>{c.name} (Pts: {c.loyaltyPoints})</option>)}
                            </select>
                         </div>
                       )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {data.products.map(p => (
                        <button key={p.id} disabled={p.stock === 0} onClick={() => setCart([...cart, {product: p, quantity: 1}])} className={`bg-white p-10 rounded-[3.5rem] border border-slate-100 text-left hover:border-indigo-200 transition-all group ${p.stock === 0 ? 'opacity-50 grayscale' : 'hover:shadow-2xl'}`}>
                          <div className="flex justify-between items-start mb-8">
                            <Package className={`w-12 h-12 text-indigo-600 transition-transform ${p.stock > 0 ? 'group-hover:rotate-12' : ''}`} />
                            <span className={`text-[10px] font-black px-4 py-2 rounded-full ${p.stock === 0 ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-400'}`}>STOCK: {p.stock}</span>
                          </div>
                          <h4 className="font-black text-slate-800 text-2xl tracking-tighter mb-2 leading-tight">{p.description}</h4>
                          <p className="text-3xl font-black text-indigo-600 tracking-tighter">{formatCurrency(p.sellPrice)}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-[4rem] border border-slate-100 p-10 shadow-2xl flex flex-col min-h-[700px]">
                    <h3 className="text-2xl font-black text-slate-800 mb-10 flex items-center gap-4"><ShoppingCart className="w-8 h-8 text-indigo-600" /> Carrito</h3>
                    <div className="flex-1 space-y-6 overflow-y-auto pr-4 scrollbar-hide">
                       {cart.map((item, idx) => (
                         <div key={idx} className="flex justify-between items-center bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                           <div className="flex-1"><p className="text-sm font-black text-slate-800">{item.product.description}</p><p className="text-[10px] text-slate-400 font-black uppercase mt-1">{formatCurrency(item.product.sellPrice)}</p></div>
                           <button onClick={() => setCart(cart.filter((_, i) => i !== idx))} className="text-rose-400 hover:bg-rose-50 p-2 rounded-full"><XCircle className="w-6 h-6" /></button>
                         </div>
                       ))}
                       {cart.length === 0 && <div className="text-center py-32 text-slate-300 font-black uppercase text-[10px]">CARRITO VACÍO</div>}
                    </div>

                    <div className="pt-8 border-t-2 border-slate-50 mt-8 space-y-6">
                       <div className="flex items-center gap-4">
                          <Tag className="w-5 h-5 text-indigo-400" />
                          <input type="number" placeholder="Descuento manual" className="flex-1 p-4 bg-slate-50 rounded-xl font-black text-rose-500 outline-none" value={saleDiscount} onChange={e => setSaleDiscount(parseFloat(e.target.value) || 0)} />
                       </div>
                       <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-black text-[10px] uppercase">Total Neto</span>
                          <span className="text-4xl font-black text-slate-900 tracking-tighter">{formatCurrency(Math.max(0, cart.reduce((a, b) => a + (b.product.sellPrice * b.quantity), 0) - saleDiscount))}</span>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <button onClick={() => handleSale('CASH')} className="py-5 bg-slate-900 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest">Efectivo</button>
                          <button onClick={() => handleSale('CARD')} className="py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest">Tarjeta</button>
                          <button onClick={() => handleSale('CREDIT')} className="py-5 bg-rose-500 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest">A Crédito</button>
                          {data.loyaltyConfig.enabled && <button onClick={() => handleSale('POINTS')} className="py-5 bg-amber-500 text-white rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest">Puntos</button>}
                       </div>
                    </div>
                  </div>
               </div>
             ) : storeView === 'INVENTORY' ? (
               <div className="bg-white rounded-[4rem] border border-slate-100 overflow-hidden shadow-sm">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 font-black text-[10px] uppercase text-slate-400 tracking-widest">
                      <tr><th className="px-10 py-8">Código</th><th className="px-10 py-8">Producto</th><th className="px-10 py-8">Existencias</th><th className="px-10 py-8">Costo Unit.</th><th className="px-10 py-8">PVP</th><th className="px-10 py-8 text-right">Valor Total</th></tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 font-black text-sm">
                      {data.products.map(p => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-10 py-6 text-slate-400">{p.code}</td>
                          <td className="px-10 py-6 text-slate-800 text-lg">{p.description}</td>
                          <td className="px-10 py-6"><span className={`px-4 py-2 rounded-full font-black text-[10px] uppercase ${p.stock < 5 ? 'bg-rose-50 text-rose-500' : 'bg-slate-100 text-slate-500'}`}>{p.stock} unid.</span></td>
                          <td className="px-10 py-6 text-slate-500">{formatCurrency(p.buyPrice)}</td>
                          <td className="px-10 py-6 text-indigo-600">{formatCurrency(p.sellPrice)}</td>
                          <td className="px-10 py-6 text-right text-slate-900 text-lg">{formatCurrency(p.stock * p.buyPrice)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
             ) : (
               <div className="bg-white p-16 rounded-[4rem] shadow-sm border border-slate-100 space-y-12 animate-in slide-in-from-bottom">
                  <h3 className="text-3xl font-black text-slate-900 flex items-center gap-4"><Truck className="w-10 h-10 text-emerald-600" /> Ingreso de Mercancía</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                     <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Seleccionar Producto Existente</label>
                        <select className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-emerald-100" id="purchaseProduct">
                           {data.products.map(p => <option key={p.id} value={p.id}>{p.description} (Stock: {p.stock})</option>)}
                        </select>
                     </div>
                     <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Proveedor</label>
                        <select className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-emerald-100" id="purchaseVendor">
                           {data.vendors.map(v => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                     </div>
                     <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Cantidad Comprada</label>
                        <input type="number" id="purchaseQty" className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-emerald-100" />
                     </div>
                     <div className="space-y-4">
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">Costo Compra Unit.</label>
                        <input type="number" id="purchasePrice" className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border-2 border-transparent focus:border-emerald-100" />
                     </div>
                  </div>
                  <button onClick={() => {
                     const pId = (document.getElementById('purchaseProduct') as HTMLSelectElement).value;
                     const vId = (document.getElementById('purchaseVendor') as HTMLSelectElement).value;
                     const qty = parseInt((document.getElementById('purchaseQty') as HTMLInputElement).value);
                     const price = parseFloat((document.getElementById('purchasePrice') as HTMLInputElement).value);
                     if (pId && qty > 0 && price > 0) handleRestock(pId, qty, price, vId);
                     else alert("Datos de compra inválidos");
                  }} className="px-16 py-6 bg-slate-900 text-white font-black rounded-[2.5rem] shadow-3xl hover:bg-emerald-600 transition-all text-lg">Procesar Ingreso de Mercancía</button>
               </div>
             )}
          </div>
        )}

        {/* Ticket de Venta para Impresión */}
        {lastSale && (
           <div className="hidden print:block fixed inset-0 bg-white z-[999] p-12 overflow-y-auto">
             <div className="max-w-[400px] mx-auto border-2 border-slate-900 p-8 space-y-6 font-mono text-xs uppercase">
                <div className="text-center space-y-2">
                   <h2 className="text-2xl font-black italic">{data.school.name}</h2>
                   <p>NIT: {data.school.nit}</p>
                   <p>{data.school.address}</p>
                   <div className="border-b-2 border-dashed border-slate-900 pt-4"></div>
                </div>
                <div className="space-y-1">
                   <p>Ticket No: {lastSale.orderNumber}</p>
                   <p>Fecha: {lastSale.date}</p>
                   <p>Cliente: {customerType === 'ANONYMOUS' ? 'Venta Mostrador' : 'Cliente Registrado'}</p>
                </div>
                <div className="border-y border-dashed border-slate-900 py-4 space-y-2">
                   {lastSale.items.map((it, i) => (
                     <div key={i} className="flex justify-between">
                        <span>{it.quantity} x {it.description.substring(0, 20)}</span>
                        <span>{formatCurrency(it.price * it.quantity)}</span>
                     </div>
                   ))}
                </div>
                <div className="space-y-2 font-black text-sm">
                   <div className="flex justify-between"><span>Subtotal:</span><span>{formatCurrency(lastSale.subtotal)}</span></div>
                   <div className="flex justify-between text-rose-600"><span>Descuento:</span><span>-{formatCurrency(lastSale.discount)}</span></div>
                   <div className="flex justify-between border-t border-slate-900 pt-2 text-lg"><span>TOTAL:</span><span>{formatCurrency(lastSale.total)}</span></div>
                </div>
                <div className="text-center pt-8 space-y-4">
                   <p>¡Gracias por apoyar a nuestra academia!</p>
                   {lastSale.pointsEarned > 0 && <p className="bg-slate-100 p-2 rounded-lg">Puntos acumulados: {lastSale.pointsEarned}</p>}
                   <button onClick={() => setLastSale(null)} className="print:hidden px-4 py-2 bg-slate-900 text-white rounded-lg">Cerrar Ticket</button>
                </div>
             </div>
           </div>
        )}
        
        {/* Renderizado de Modales Estándar */}
        <StudentModal isOpen={false} onClose={() => {}} onSave={() => {}} coaches={[]} />
      </main>
    </div>
  );
};

export default App;
